const maxApi = require('max-api');
const { makeChords, translateChordMap, voicingAlgos } = require('./makeChords');
const { scribbleClipToMidiSteps } = require('./scribbleClipToMidiSteps');
const { getNotes } = require('./getNotesChords');
const { getClip } = require('./getClipChords');
const { rhythmAlgos } = require('./rhythmAlgosChords');

const make = async () => {
  const main = await maxApi.getDict('main');

  const chordMap = translateChordMap(main.chordMap);

  const chordsMade = makeChords({ ...main, chordMap });

  const clip = chordsMade[0];
  const names = chordsMade[1];

  const { liveFormat, totalDuration } = scribbleClipToMidiSteps(clip);

  await Promise.all([
    maxApi.setDict('chordNames', {
      chords: names,
    }),
    maxApi.setDict('steps', {
      notes: liveFormat,
      totalDuration,
    }),
  ]);

  maxApi.outlet('render');
};

const generateRhythm = async () => {
  const main = await maxApi.getDict('main');
  const { rhythmAlgoInt } = main;

  maxApi.outlet(`pattern ${rhythmAlgos[rhythmAlgoInt].algo(main)}`);
  maxApi.outlet(`gatedBang`);
};

const getPattern = async () => {
  const parsed = await getNotes('stepsFromLive');

  const clipData = getClip(parsed);

  if (clipData) {
    const { pattern, subdiv } = clipData;

    maxApi.outlet(`pattern ${pattern}`);
    maxApi.outlet(`subdiv ${subdiv}`);
  }
};

const patternDescription = async () => {
  const main = await maxApi.getDict('main');
  const { rhythmAlgoInt } = main;

  maxApi.outlet(`description ${rhythmAlgos[rhythmAlgoInt].description}`);
};

const voicingDescription = async () => {
  const main = await maxApi.getDict('main');
  const { voicingInt } = main;

  maxApi.outlet(`description ${voicingAlgos[voicingInt].description}`);
};

maxApi.addHandler('make', make);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('generateRhythm', generateRhythm);
maxApi.addHandler('patternDescription', patternDescription);
maxApi.addHandler('voicingDescription', voicingDescription);
