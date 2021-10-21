const maxApi = require('max-api');
const { makeChords, translateChordMap } = require('./makeChords');
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
  const { rhythmAlgo } = main;

  maxApi.outlet(`pattern ${rhythmAlgos[rhythmAlgo].algo(main)}`);
  maxApi.outlet(`gatedBang`);
};

const getPattern = async () => {
  const parsed = await getNotes('steps');

  const clipData = getClip(parsed);

  if (clipData) {
    const { pattern, subdiv } = clipData;

    maxApi.outlet(`pattern ${pattern}`);
    maxApi.outlet(`subdiv ${subdiv}`);
  }
};

const patternDescription = async () => {
  const main = await maxApi.getDict('main');
  const { rhythmAlgo } = main;

  maxApi.outlet(`description ${rhythmAlgos[rhythmAlgo].description}`);
};

const initial = async () => {
  await maxApi.setDict('main', {
    chordMap: [
      0, 0, 1, 1, 0, 1, 2, 0, 1, 3, 0, 1, 4, 0, 1, 5, 0, 1, 6, 0, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 3, 1, 1, 4, 1, 1, 5, 1,
      1, 6, 1, 1, 0, 2, 0, 1, 2, 0, 2, 2, 1, 3, 2, 1, 4, 2, 1, 5, 2, 0, 6, 2, 0, 0, 3, 1, 1, 3, 1, 2, 3, 0, 3, 3, 1, 4,
      3, 0, 5, 3, 1, 6, 3, 0, 0, 4, 1, 1, 4, 0, 2, 4, 1, 3, 4, 0, 4, 4, 1, 5, 4, 1, 6, 4, 0, 0, 5, 1, 1, 5, 0, 2, 5, 0,
      3, 5, 1, 4, 5, 0, 5, 5, 1, 6, 5, 0, 0, 6, 1, 1, 6, 1, 2, 6, 0, 3, 6, 1, 4, 6, 1, 5, 6, 0, 6, 6, 0, 0, 7, 1, 1, 7,
      0, 2, 7, 0, 3, 7, 1, 4, 7, 0, 5, 7, 1, 6, 7, 0,
    ],
    bassNote: 0,
    open: 0,
    randomAssist: 1,
    repeatChords: 1,
    seventh: 1,
    splitChop: 0,
    RN: 'F',
    mode: 'Minor',
    octave: 3,
    sizzle: 'none',
    advChords: 'none',
    voicing: 'none',
    subdiv: '4n',
    splitter: 0,
    chordPatterns: ['R', 'R', 'R', 'R'],
    patterns: 'xxxx',
    pattern: 'xxxx',
    chords: ['R', 'R', 'R', 'R'],
    rhythmAlgo: 'long_wild',
  });

  maxApi.outlet('initial');
};

maxApi.addHandler('make', make);
maxApi.addHandler('Init', initial);
maxApi.addHandler('getPattern', getPattern);
maxApi.addHandler('generateRhythm', generateRhythm);
maxApi.addHandler('patternDescription', patternDescription);
