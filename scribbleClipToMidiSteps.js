const jsmidgen = require('jsmidgen');

const scribbleClipToMidiSteps = (scribbleClip) => {
  let startTime = 0;
  let endTime = 0;
  const liveFormat = [];
  for (const step of scribbleClip) {
    endTime += step.length;

    if (step.note) {
      for (let noteInt = 0; noteInt < step.note.length; noteInt++) {
        liveFormat.push({
          pitch: jsmidgen.Util.midiPitchFromNote(step.note[noteInt]),
          start_time: startTime / 128,
          duration: (endTime - startTime) / 128,
          velocity: step.level,
          probability: 1,
          velocity_deviation: 1,
          release_velocity: 64,
          mute: 0,
        });
      }
    }

    startTime += step.length;
  }

  const totalDuration = scribbleClip.reduce((duration, step) => (duration = duration + step.length), 0) / 128;

  return { liveFormat, totalDuration };
};

module.exports = { scribbleClipToMidiSteps };
