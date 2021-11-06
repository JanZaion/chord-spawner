const { Note } = require('@tonaljs/tonal');

const duplicateNotes = (notes) => {
  return notes.map((step) => {
    return { ...step };
  });
};

//sorts by the earliest start time and then by the lowest pitch
const sortStartTimesAndPitches = (notes) => {
  const notesMutable = duplicateNotes(notes);

  const startTimesSorted = notesMutable.sort((a, b) =>
    a.start_time > b.start_time ? 1 : b.start_time > a.start_time ? -1 : 0
  );

  const arrays = [];

  startTimesSorted.forEach((step, stepIndex) => {
    const { start_time } = step;
    const prevStep = startTimesSorted[stepIndex - 1];

    if (stepIndex === 0 || start_time !== prevStep.start_time) {
      let int = 0;
      const innerArr = [];

      while (startTimesSorted[stepIndex + int] && start_time === startTimesSorted[stepIndex + int].start_time) {
        innerArr.push(startTimesSorted[stepIndex + int]);
        int++;
      }

      arrays.push(innerArr);
    }
  });

  const pitchesSorted = [];

  for (const innerArr of arrays) {
    const pitchesSortedInner = innerArr.sort((a, b) => (a.pitch > b.pitch ? 1 : b.pitch > a.pitch ? -1 : 0));

    for (const step of pitchesSortedInner) {
      pitchesSorted.push(step);
    }
  }
  return pitchesSorted;
};

const quantize = (number, block, allowZero) => {
  const absoluteNumber = number.toFixed(3) * 1000; //always assuming floats
  const divider = block * 1000; //need to get rid of floats for equality evaluation
  if (absoluteNumber % divider === 0) return absoluteNumber / 1000;
  if (number < 0) return 0;

  let numberGoUp = absoluteNumber;
  let numberGoDown = absoluteNumber;

  while (numberGoUp % divider !== 0) {
    numberGoUp += 1;
  }

  while (numberGoDown % divider !== 0) {
    numberGoDown -= 1;
  }

  const roundedNumber =
    numberGoUp - absoluteNumber < absoluteNumber - numberGoDown ? numberGoUp / 1000 : numberGoDown / 1000;

  const quantizedNumber = allowZero ? roundedNumber : roundedNumber !== 0 ? roundedNumber : divider / 1000;

  return quantizedNumber;
};

const checkOverlaps = (notes, block) => {
  const notesMutable = duplicateNotes(notes);

  notesMutable.forEach((step, stepIndex) => {
    const { start_time, duration } = step;
    const stepEnd = start_time + duration;
    let shortestFollowingStart = 0;

    notesMutable.forEach((nextStep, nextStepIndex) => {
      const next_start_time = nextStep.start_time;
      const next_duration = nextStep.duration;
      const nextEnd = next_start_time + next_duration;

      //check if overlap in following note
      if (next_start_time < stepEnd && next_start_time > start_time) {
        //check if the overlaping note is the earliest following
        if (shortestFollowingStart === 0 || next_start_time < shortestFollowingStart) {
          //ckeck how long the overlap is to decide whether to create separate note else chord
          if (next_duration / 2 > stepEnd - next_start_time) {
            shortestFollowingStart = next_start_time;
          } else {
            notesMutable[nextStepIndex].start_time = start_time;
            notesMutable[nextStepIndex].duration = duration;
          }
        }
      }

      //check following notes if they long for chord creation
      if (stepEnd !== nextEnd && next_start_time === start_time && nextStepIndex > stepIndex)
        notesMutable[nextStepIndex].duration = duration;
    });
    if (shortestFollowingStart !== 0) notesMutable[stepIndex].duration = shortestFollowingStart - start_time;

    if (notesMutable[stepIndex].duration === 0) notesMutable[stepIndex].duration = block;
  });

  return notesMutable;
};

const dechordify = (notes) => {
  const unique_start_times = new Set();
  const dechordifiedNotes = [];

  notes.forEach((step) => {
    const { start_time } = step;
    const preAddSize = unique_start_times.size;
    unique_start_times.add(start_time);
    if (preAddSize < unique_start_times.size) dechordifiedNotes.push({ ...step });
  });

  return dechordifiedNotes;
};

const createSpacedSteps = (notes, totalDuration) => {
  const spacedSteps = [];

  notes.forEach((step, stepIndex) => {
    const { start_time, duration } = step;

    if (stepIndex === 0) {
      spacedSteps.push({ duration: start_time, note: false });
    } else {
      const prevStepEnd = notes[stepIndex - 1].start_time + notes[stepIndex - 1].duration;
      spacedSteps.push({ duration: start_time - prevStepEnd, note: false });
    }
    spacedSteps.push({ duration, note: true });
  });

  const spacedStepsNoZeroDurations = spacedSteps.filter((step) => step.duration > 0);

  if (notes[notes.length - 1]) {
    const unEmptyDuration = notes[notes.length - 1].duration + notes[notes.length - 1].start_time;

    const finalSpaceLength = totalDuration - unEmptyDuration;

    if (finalSpaceLength > 0) spacedStepsNoZeroDurations.push({ duration: finalSpaceLength, note: false });
  }

  return spacedStepsNoZeroDurations;
};

//this whole fn hingis on the assumption that 0.25 is the smallest unit of division, the smallestBlock. Once it changes, arrays need to be rewriten
const subdivFromSpacedSteps = (spacedSteps, smallestBlock) => {
  const durations = spacedSteps.map((step) => step.duration).filter((step) => step !== 0);
  const blocks = [0, 1, 2, 4, 8, 16, 64, 128, 256];

  const durationsDivided = durations.map((duration) => {
    const blocksPerDiration = duration / smallestBlock;
    return blocks.filter((block) => {
      if (blocksPerDiration % block === 0) return block;
    });
  });

  const leastDivisibleDuration = durationsDivided.sort((a, b) => a.length - b.length)[0];

  const index = leastDivisibleDuration.length;
  const dividers = [0, 0.25, 0.5, 1, 2, 4, 16, 32, 64];
  const subdivs = ['32n', '16n', '8n', '4n', '2n', '1n', '1m', '2m', '4m'];
  const divider = dividers[index];
  const subdiv = subdivs[index];

  return { divider, subdiv };
};

const createRhythmPattern = (spacedSteps, block) => {
  const pattern = spacedSteps
    .map((step) => {
      const { duration, note } = step;
      const repeats = duration / block;
      const underscores = '_'.repeat(repeats - 1);

      return note ? 'x' + underscores : '-' + underscores;
    })
    .join('');

  return pattern;
};

const getClip = ({ notes, totalDuration }) => {
  if (!notes.length) return;

  const block = 0.25; //0.25, 16n as the smallest unit of division. Change to 0.125 when 32n

  const quantizedNotes = notes.map((step) => {
    return {
      ...step,
      start_time: quantize(step.start_time, block, true),
      duration: quantize(step.duration, block, false),
    };
  });

  const quantizedDuration = quantize(totalDuration, block, false);

  const notesSortedOne = sortStartTimesAndPitches(quantizedNotes);

  const noOverlapSteps = checkOverlaps(notesSortedOne, block);

  const notesSortedTwo = sortStartTimesAndPitches(noOverlapSteps);

  const dechordifiedNotes = dechordify(notesSortedTwo);

  const noteNames = dechordifiedNotes.map((step) => Note.fromMidi(step.pitch - 12)).join(' '); //-12 because of the middle C octave transpose

  const spacedSteps = createSpacedSteps(dechordifiedNotes, quantizedDuration);

  const subdivInfo = subdivFromSpacedSteps(spacedSteps, block);

  const { divider, subdiv } = subdivInfo;

  const pattern = createRhythmPattern(spacedSteps, divider); //change the block once its possible to extract it from no spaced notes

  return { pattern, subdiv, noteNames };
};

module.exports = { getClip };
