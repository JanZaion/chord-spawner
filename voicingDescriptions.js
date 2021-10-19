var descriptions = [
  'Takes the 2nd and the 4th (7th) notes and transposes them an octave higher. If there is no 4th note, it transposes only the 2nd.',
  'Renders only the root note of the chords.',
  'Renders only the mediant note of the chords.',
  'Renders only the dominant note of the chords.',
  'Renders only the 7th note of the chords.',
  'Renders a random note from each chord.',
  'Transposes the root note an octave higher.',
  'Transposes the root and the mediant note an octave higher.',
  'Transposes the root, mediant and dominant note an octave higher.',
  'Removes the dominant note. Should be used with seventh chords for propper shell voicing.',
  'Transposes the highest note an octave lower.',
  'Transposes the second highest note an octave lower.',
  'Transposes the third highest note an octave lower.',
  'Transposes the fourth highest note an octave lower.',
  'Looks at the root note of the first chord. If any other note is in a higher octave, it transposes it an octave lower. If any other note is in a lower octave, it transposes it an octave higher.',
  'It looks at the previous chord and if there is a the same note at a different octave, it transposes the previous an octave higher or lower to the dirrection of the respective previous note.',
  'It looks at the first chord of the progression and if there is any note an octave higher than the highest note of the first chord in the following chords, it transposes the note an octave lower. Visa versa with lower notes.',
  'It looks at the last chord of the progression and if there is any note an octave higher than the highest note of the last chord in the following chords, it transposes the note an octave lower. Visa versa with lower notes.',
  'The lowest note of every chord is always lower or equal to the lowest note of the chord preceeding it.',
  'The highest note of every chord is always lower or equal to the highest note of the chord preceeding it.',
  'The lowest note of every chord is always higher or equal to the lowest of the chord preceeding it.',
  'The highest note of every chord is always higher or equal to the highest of the chord preceeding it',
];

function postDescription(index) {
  outlet(0, descriptions[index]);
}
