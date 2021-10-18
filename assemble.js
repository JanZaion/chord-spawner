const maxApi = require('max-api');
const { makeChords, translateChordMap } = require('./makeChords');
const { scribbleClipToMidiSteps, liveFormatTranspose } = require('./liveFormatFNs');

const make = async () => {
  const main = await maxApi.getDict('main');

  const chordMap = translateChordMap(main.chordMap);

  const chordsMade = makeChords({ ...main, chordMap });

  const clip = chordsMade[0];
  const names = chordsMade[1];

  const preTransposedMidiSteps = scribbleClipToMidiSteps(clip);

  const liveFormat = liveFormatTranspose(preTransposedMidiSteps.liveFormat, 12);

  const totalDuration = preTransposedMidiSteps.totalDuration;

  await Promise.all([
    maxApi.setDict('chordNames', {
      Chords: names,
    }),
    maxApi.setDict('steps', {
      notes: liveFormat,
      totalDuration,
    }),
  ]);

  maxApi.outlet('render');
};

maxApi.addHandler('make', make);
