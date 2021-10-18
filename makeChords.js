'use strict';
const scribble = require('scribbletune');
const {
  Note,
  Key,
  Interval,
  Scale,
  transpose,
  interval,
  ScaleType,
  RomanNumeral,
  Progression,
  Mode,
} = require('@tonaljs/tonal');

function dice(number) {
  //Dice roll, returns any number in the 1-number range
  return Math.floor(Math.random() * number + 1);
}

function diceBoolean(probability) {
  //Dice roll, returns random boolean value based on the probability input. 0.1 means 10% chance of true
  let randoBool = Math.random() <= probability;
  return randoBool;
}

function diceRange(max, min) {
  //Dice roll, returns any number in the min-max range. Careful: The max number is excluded, so a roll for 2-8 would look like this: diceRange(9, 2)
  return Math.floor(Math.random() * (max - min) + min);
}

function diceMultiRollSortedASC(max, min, rolls) {
  //Multiple dice rolls, returns an array of ascending different numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.sort(function (a, b) {
    return a - b;
  });
}

function diceMultiRollSortedDSC(max, min, rolls) {
  //Multiple dice rolls, returns an array of descending different numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr.sort(function (a, b) {
    return b - a;
  });
}

function diceMultiRollUnsorted(max, min, rolls) {
  //Multiple dice rolls, returns an array of unsorted numbers that is as long as the 'rolls' input. Max is excluded just like with diceRange.
  let arr = [];
  while (arr.length < rolls) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}

function replaceAt(string, index, replace) {
  //Replaces character in a string
  return string.substring(0, index) + replace + string.substring(index + 1);
}

Array.prototype.insert = function (index, item) {
  //Inserts item to an array and changes the length (index, item)
  this.splice(index, 0, item);
};

function indexOfSmallest(a) {
  //finds an index of the smallest element in an array of numbers
  return a.indexOf(Math.min.apply(Math, a));
}

function indexOfHighest(a) {
  //finds an index of the highest element in an array of numbers
  return a.indexOf(Math.max.apply(Math, a));
}

/*
Generates Root Note Pattern as a string
-RNfirstBeat accepts boolean and it decides whether the first beat will be the root note
-numBeats accepts number and it guides how many beats will there be in the pattern
*/
function generateRP(RNfirstBeat, numBeats) {
  const nonRoot = ['-', 'P', '_'];
  RNfirstBeat ? (RNpattern = ['x']) : (RNpattern = [nonRoot[dice(3) - 1]]);
  nonRoot.push('x');
  for (let i = 0; i < numBeats - 1; i++) RNpattern.push(nonRoot[dice(4) - 1]);
  return RNpattern.join('');
}

//A banks of commonly used root note patterns
function commonRPs8n() {
  let RPs = ['x-x-x-x-', 'x_--x_--', 'x_x_x_x_', 'x___----'];
  let RP = RPs[dice(RPs.length)];
  return RP;
}
/*
Generates Scribbletune clip based on the defined procedure. Nonroot notes sometimes can be prolongued, RN notes are fixed
-RN accepts string and it denotes the root note of the later created scale, ie 'C1'. Note that the pitch must be included as well.
-mode accepts string that denotes the mode of the later created scale, ie 'minor, 'ionian'.
-nonRootPitch accepts 3 string values: 'lower', 'higher', 'any'. It guides the pitch of random notes relative to the root note.
-nonRootNotesNum accepts a number and it guides how many notes will be there in the melody. If the number of remaining spaces exceeds the number nonRootNotesNum, the notes will repeat.
-RNpattern accepts string that denotes the pattern of the root note, ie 'xPxPx-x-'. 'P' stand for placeholder and acts as a placeholder for a new note to be picked.
-arpMelody accepts boolean and if false, it gives a chance to non root notes have chance to be sustained for 1 beat or repeat themselves in 1 beat.
-nonRootPitchDirrection accepts 3 string values: 'any', 'ascend', 'descend'. It guides the pitch direction of non root notes relative to the root note.
-smoothEdges accepts number 1-7 and it reduces the direction of the melody notes from the root note.
-subdiv is the same as subdiv in Scribbletune.

careful:
-subdiv should only get 1, 4, 8, 16, 32 and the subdiv number should be the same as the number of characters in RNpattern.
*/
function generateMelodyClip(
  RN,
  mode,
  nonRootPitch,
  nonRootNotesNum,
  RNpattern,
  arpMelody,
  nonRootPitchDirrection,
  smoothEdges,
  subdiv
) {
  var activeScale = Mode.notes(mode, RN);
  //var activeScale = Scale.get(scale).notes //we get individual notes from Tonal.
  var defineScale = [];

  var spaces = (RNpattern.match(/P/g) || []).length;
  if (nonRootNotesNum > spaces) nonRootNotesNum = spaces; //contingency to avoid crash if too high value for nonRootNotesNum

  if (smoothEdges > activeScale.length - 1) smoothEdges = activeScale.length - 1; //contingency to avoid crash if too high value for smoothEdges

  //Here we define the scale we will use to generate the melody based on the nonRootPitch and smoothEdges inputs. The scale does not contain the root note.If smoothEdges is 0, the scale contains the root note transposed by perfect 8.
  switch (nonRootPitch) {
    case 'lower':
      activeScale.forEach((element) => {
        defineScale.push(Note.transpose(element, '-8P'));
      });

      for (let i = 0; i < smoothEdges; i++) {
        defineScale.shift();
      }
      break;

    case 'higher':
      var RN8P = Note.transpose(activeScale[0], '8P'); //RN8P stands for Root Note Perfect Eight
      activeScale.shift();
      activeScale.push(RN8P);
      defineScale = activeScale;

      for (let i = 0; i < smoothEdges; i++) {
        defineScale.pop();
      }
      break;

    case 'any':
      activeScale.forEach((element) => {
        defineScale.push(Note.transpose(element, '-8P'));
      });

      var RN8P = Note.transpose(activeScale[0], '8P');
      activeScale.shift();
      activeScale.push(RN8P);

      defineScale = defineScale.concat(activeScale);

      for (let i = 0; i < smoothEdges; i++) {
        defineScale.pop();
        defineScale.shift();
      }
      break;
  }
  if (nonRootNotesNum > defineScale.length) nonRootNotesNum = defineScale.length; //contingency. If nonRootNotesNum > defineScale.length = true, then the dice will be rolling forever and ever

  //We reoll the dice and see what notes will be part of the melody. The array of notes is finalized in the for loop that follows the switch statement.
  switch (nonRootPitchDirrection) {
    case 'any':
      var melodyIndexArray = diceMultiRollUnsorted(defineScale.length, 0, nonRootNotesNum);
      break;

    case 'descend':
      var melodyIndexArray = diceMultiRollSortedASC(defineScale.length, 0, nonRootNotesNum);
      break;

    case 'ascend':
      var melodyIndexArray = diceMultiRollSortedDSC(defineScale.length, 0, nonRootNotesNum);
      break;
  }

  var nonRootNotes = [];

  for (let i = 0; i < nonRootNotesNum; i++) {
    nonRootNotes.unshift(defineScale[melodyIndexArray[i]]);
  }

  //if there are less notes (nonRootNotesNum) than spaces in the inserted RNpattern and arpMelody is false, we roll the dice to determine which notes will repeat themselves or will be sustained for 1 beat.
  var benefitingNotes = [];

  if (spaces > nonRootNotesNum && arpMelody == false) {
    for (let i = 0; i < spaces - nonRootNotesNum; i++) {
      benefitingNotes.push(dice(nonRootNotesNum) - 1);
    }
  }

  //We construct the melody pattern and the final 'xx_x-x__' pattern. We iterate throuth the received RNpattern and do different stuff based on each character. Depending on individual cases, we alter (or leave as is) the RNpattern and push a note to the melody array
  var melody = [];
  var noteToAdd = 0;
  var benefitsSpent = 0;
  var benefitNum = benefitingNotes.length;

  for (let i = 0; i < RNpattern.length; i++) {
    switch (RNpattern[i]) {
      case 'x':
        melody.push(RN);
        break;
      case '_':
        break;
      case '-':
        break;
      case 'P':
        //Provedem check, zdali je to benefitující nota. Pokud ne, tak jedeme jak teď. Pokud ano, tak najdeme nejbližší následující '-', změníme ho za 'B'.
        if (benefitsSpent < benefitNum && benefitingNotes[benefitsSpent] == noteToAdd) {
          melody.push(nonRootNotes[noteToAdd]);
          var activeBenefitingNote = nonRootNotes[noteToAdd];
          var RNpattern = replaceAt(RNpattern, i, 'T'); //T jako tato benefituje, později může být přepsáno na 'x'

          if (RNpattern.indexOf('P') != -1) var RNpattern = replaceAt(RNpattern, RNpattern.indexOf('P'), 'B'); //B jako bude benefitovat. Jako jediná se B dává dopředu a nemůže být v rámci tohoto switch casu zaměněna za 'x'

          benefitsSpent++;
        } else {
          melody.push(nonRootNotes[noteToAdd]);
          var RNpattern = replaceAt(RNpattern, i, 'N'); //N jako no benefit, později může být přepsáno na 'x'

          noteToAdd != nonRootNotesNum - 1 ? noteToAdd++ : (noteToAdd = 0);
        }

        break;
      case 'B':
        var benefitIsSustain = diceBoolean(0.5); //in the future, concider adding the value as an argument to the functain so chance here can be controlled

        if (RNpattern[i - 1] == 'T' && benefitIsSustain == true) {
          var RNpattern = replaceAt(RNpattern, i, 'S'); //S jako sustain, ale nesustainujeme root notu, v budoucnu mozna bude mozne vymenit za '_'
        } else {
          var RNpattern = replaceAt(RNpattern, i, 'R'); //v budoucnu přidat ještě jeden case, kdy bude možnost, aby jedna nota benefitovala vícekrát a mohla být vícekrát po sobě sustainována. Takže asi provést check, jestli je v bnefitingNotes proměnné ta předchozí ta stejná. Uff...
          melody.push(activeBenefitingNote);
        }

        noteToAdd != nonRootNotesNum - 1 ? noteToAdd++ : (noteToAdd = 0);

        break;
    }
  }

  //we replace RNpattern characters so that they match the Scribbletune notation language
  var RNpattern = RNpattern.replace(/S/g, '_');
  var RNpattern = RNpattern.replace(/T/g, 'x');
  var RNpattern = RNpattern.replace(/N/g, 'x');
  var RNpattern = RNpattern.replace(/R/g, 'x');

  return (scribbleClip = scribble.clip({
    notes: melody,
    pattern: RNpattern,
    subdiv,
  }));

  /*
    //If we want to return access clip, return an array of 2 objects. The scribbleclip with patterns and received subdiv and accessClip which receives the same data as scribbleclip, but makes later data retrieval easier.
    return [scribbleClip = scribble.clip({
        notes: melody,
        pattern: RNpattern, 
        subdiv,
    }),
    acessClip =
    {
        notes: melody,
        pattern: RNpattern, 
        subdiv,
    }]
    */
}

/*
Accepts Scribbletune clip and returns the clip with desired chops (spaces)

-scribbleClip accepts the Scribbletune clip
-chopSubdiv accepts string in the form of Scribbletune pattern language subdiv + 32n and 64n for some extra tiny chops
-chopPatternOrAmount either accepts string in the form of Scribbletune pattern language ('x-x-') or number. If number, then the number governs howm nay chops will be in random places in the clip

*/
function chop(scribbleClip, chopSubdiv, chopPatternOrAmount) {
  //the distinction is made of whether we pass down the accepted chop pattern or whether we roll the dice and build new pattern
  if (isNaN(chopPatternOrAmount)) {
    var chopPattern = chopPatternOrAmount.split('');
  } else {
    var dicedChops = diceMultiRollSortedASC(scribbleClip.length, 0, chopPatternOrAmount);
    var chopPattern = [];

    for (let i = 0; i < scribbleClip.length; i++) {
      if (dicedChops.indexOf(i) != -1) {
        chopPattern.push('-');
      } else {
        chopPattern.push('x');
      }
    }
  }

  //this is basicaly a library of values based on the accepted chopSubdiv. The values are used later during the chopping algos
  switch (chopSubdiv) {
    case '64n':
      var chops = 1;
      var chopLengthSum = 8;
      var chopLength = 8;
      break;

    case '32n':
      var chops = 1;
      var chopLengthSum = 16;
      var chopLength = 16;
      break;

    case '16n':
      var chops = 1;
      var chopLengthSum = 32;
      var chopLength = 32;
      break;

    case '8n':
      var chops = 2;
      var chopLengthSum = 64;
      var chopLength = 32;
      break;

    case '4n':
      var chops = 4;
      var chopLengthSum = 128;
      var chopLength = 32;
      break;

    case '2n':
      var chops = 8;
      var chopLengthSum = 256;
      var chopLength = 32;
      break;

    case '1n':
      var chops = 16;
      var chopLengthSum = 512;
      var chopLength = 32;
      break;

    case '1m':
      var chops = 64;
      var chopLengthSum = 2048;
      var chopLength = 32;
      break;

    case '2m':
      var chops = 128;
      var chopLengthSum = 4096;
      var chopLength = 32;
      break;

    case '3m':
      var chops = 192;
      var chopLengthSum = 6144;
      var chopLength = 32;
      break;

    case '4m':
      var chops = 256;
      var chopLengthSum = 8192;
      var chopLength = 32;
      break;
  }

  //we translate the patterno to chopMoment, an array of values. The value indicates that the chop belongs to this place. The place is read from the scribbleclip .length object value.
  var chopMoment = [];
  var patternPosition = 0;

  for (let i = 0; i < chopPattern.length; i++) {
    if (chopPattern[i] == '-') {
      var patternPositionInner = patternPosition;

      for (j = 0; j < chops; j++) {
        chopMoment.push(patternPositionInner);
        var patternPositionInner = patternPositionInner + chopLength;
      }
    }

    var patternPosition = patternPosition + chopLengthSum;
  }

  //Here we do the actual chopping. Based on the chopMoment values, we know where to put the chop. We iterate through the chopMoment array, then through the scribbleClip array and finally through the some of all the .length object values.
  //If the chopmoment is at the end or beginning of the note, the chop is simply added where it belongs. If it is in the middle of the note, then the same note occurs in the edited clip like this: x => x-x
  for (chopMomentIndex = 0; chopMomentIndex < chopMoment.length; chopMomentIndex++) {
    var clipLengthIncrement = 0;

    for (i = 0; i < scribbleClip.length; i++) {
      var clipLengthIncrementPreviousTick = clipLengthIncrement;
      var clipLengthIncrement = clipLengthIncrement + scribbleClip[i].length;

      for (lengthPosition = 0; lengthPosition < clipLengthIncrement; lengthPosition += chopLength) {
        if (chopMoment[chopMomentIndex] == lengthPosition) {
          if (scribbleClip[i].note != null) {
            //prly should be removed now

            if (lengthPosition == clipLengthIncrementPreviousTick) {
              //1) if chop belongs at the beginning of the note
              scribbleClip.insert(i + 1, { note: null, length: chopLength, level: scribbleClip[i].level });
              if (scribbleClip[i].length - chopLength > 0)
                scribbleClip.insert(i + 2, {
                  note: scribbleClip[i].note,
                  length: scribbleClip[i].length - chopLength,
                  level: scribbleClip[i].level,
                });
              scribbleClip.splice(i, 1);
            } else if (
              lengthPosition > clipLengthIncrementPreviousTick &&
              lengthPosition + chopLength != clipLengthIncrement
            ) {
              //2) if chop belongs in the middle of the note //
              scribbleClip.insert(i + 1, {
                note: scribbleClip[i].note,
                length: lengthPosition - clipLengthIncrementPreviousTick,
                level: scribbleClip[i].level,
              });
              scribbleClip.insert(i + 2, { note: null, length: chopLength, level: scribbleClip[i].level });
              scribbleClip.insert(i + 3, {
                note: scribbleClip[i].note,
                length: clipLengthIncrement - (lengthPosition + chopLength),
                level: scribbleClip[i].level,
              });
              scribbleClip.splice(i, 1);
            } else if (lengthPosition + chopLength == clipLengthIncrement) {
              //3) if chop belongs in the end of the note
              if (scribbleClip[i].length - chopLength > 0)
                scribbleClip.insert(i + 1, {
                  note: scribbleClip[i].note,
                  length: scribbleClip[i].length - chopLength,
                  level: scribbleClip[i].level,
                });
              scribbleClip.insert(i + 2, { note: null, length: chopLength, level: scribbleClip[i].level });
              scribbleClip.splice(i, 1);
            }
          }
        }
      }
    }
  }
  //We return the chopped Scribbletune clip with nulls consolidated
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

//It turns out that Scribbletune accepts notes as strings, but if they are not arrays, it exports them kinda wonky. This function loops through a scribbleClip and converts all string notes to array notes
function notesToArray(scribbleClip) {
  for (let i = 0; i < scribbleClip.length; i++) {
    if (Array.isArray(scribbleClip[i].note) == false && scribbleClip[i].note != null) {
      var noteInArray = [];
      noteInArray.push(scribbleClip[i].note);
      var newPart = { note: noteInArray, length: scribbleClip[i].length, level: scribbleClip[i].level };
      scribbleClip.splice(i, 1);
      scribbleClip.insert(i, newPart);
    }
  }

  return scribbleClip;
}

//The clip that was generated by the previous algo is usable, but further retrieval of data might pose a problem, so here we consolidate all the null note scribble objects so that there are never 2 in a row, just 1 with the appropriate length.
function nullCleanup(scribbleClip) {
  for (var q = 0; q < scribbleClip.length; q++) {
    if (q != scribbleClip.length - 1 && scribbleClip[q].note == null && scribbleClip[q + 1].note == null) {
      var newNullLength = scribbleClip[q].length + scribbleClip[q + 1].length;
      var newPart = { note: null, length: newNullLength, level: scribbleClip[q].level };
      scribbleClip.splice(q, 2);
      scribbleClip.insert(q, newPart);
      var q = q - 1;
    }
  }
  return scribbleClip;
}

//We count the number of nulls and root notes and then make couple of checks of whether we can continue based on how many notes are there to change to return unedited clip rather than error. This Function works as an auxiliary function for functions that have number of notes and first note specified to modify scribbletune clip
function contingency(scribbleClip, numOfNotes, firstNote, RN, transposeRN) {
  var RNamount = 0;
  var Nullamount = 0;

  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note == null) {
      Nullamount++;
    } else if (scribbleClip[i].note.join('') == RN) {
      RNamount++;
    }
  }

  var nonRNamount = scribbleClip.length - RNamount - Nullamount;

  if (transposeRN && nonRNamount + RNamount < 1) {
    return true;
  } else if (transposeRN == false && nonRNamount < 1) {
    return true;
  } else if (numOfNotes < 1) {
    return true;
  } else if (firstNote > scribbleClip.length) {
    return true;
  } else {
    return false;
  }
}

//Accepts string and converts it to boolean values, provided the string is yes, no, on or off
function humanToBool(str) {
  switch (str) {
    case 'yes':
      str = true;
      break;

    case 'no':
      str = false;
      break;

    case 'on':
      str = true;
      break;

    case 'off':
      str = false;
      break;
    case 'sevenths':
      str = true;
      break;

    case 'triads':
      str = false;
      break;
    case 0: //inverted logic for indexes
      str = true;
      break;

    case 1:
      str = false;
      break;
  }
  return str;
}

/*
Moves all notes in a Scribbletune clip that are not in a specified scale 1 or 2 semitones higher or lower, so that all notes are notes of that scale. Only accepts major and minor scales. In the future I should add pentatonic
-scribbleClip accepts a Scribbletune clip
-RN accepts string, a root note of the desired scale, like 'F1'. Dont forget include pitch, whichever one, but include it
-Mode accepts string that denotes by which mode to transpose
-goLow accepts boolean and it denotes whether when fixing the notes, they should be transposed up or down
*/
function fixScale(scribbleClip, RN, mode, goLow) {
  var originalScale = Mode.notes(mode, RN);
  var activeScale = [];

  //We populate activeScale, the scale agianst which scribbleClip notes will be compared, with multiples of the pitches of the received scale
  for (let i = -8; i > -69; i -= 7)
    originalScale.forEach((element) => {
      activeScale.push(Note.transpose(element, i + 'P'));
    });
  for (let i = 1; i < 79; i += 7)
    originalScale.forEach((element) => {
      activeScale.push(Note.transpose(element, i + 'P'));
    });

  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note != null) {
      var note = scribbleClip[i].note.join('');

      if (activeScale.indexOf(note) == -1) {
        var newNote = note;

        switch (
          goLow //Here we do the actual fixing by transposing those notes that are out of the desired scale, or mode
        ) {
          case false:
            while (activeScale.indexOf(newNote) === -1) newNote = Note.simplify(Note.transpose(newNote, '1A'));
            break;

          case true:
            while (activeScale.indexOf(newNote) === -1) newNote = Note.simplify(Note.transpose(newNote, '-1A'));
            break;
        }

        var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
        scribbleClip.splice(i, 1);
        scribbleClip.insert(i, newPart);
      }
    }
  }
  notesToArray(scribbleClip);
  nullCleanup(scribbleClip);
  return scribbleClip;
}

/*
Removes received number of notes from a Scribble clip
-scribbleClip accepts a Scribbletune clip
-direction accepts either 'left' or 'right and it decides from which direction we cut
-numOfNotes accepts the amount of notes or length to remove
-absoluteLength accepts boolean. If false, then the amount of notes cut is cut by the numOfNotes. If true then the value received as numOfNotes will represent the length to cut

-if numOfNotes is greater than number of notes in the scribbleClip, then the returned clibp will be one null with the length equivalent to the length of the received scribbleClip
-if there are nulls in the way, they are skipped, meaning there will always be notes deleted
*/
function nullNotesDirection(scribbleClip, direction, numOfNotes, absoluteLength) {
  //here we define the cutting by number of notes
  if (absoluteLength == false) {
    switch (direction) {
      case 'right':
        numOfNotes < scribbleClip.length
          ? (numOfNotesUPDT = scribbleClip.length - numOfNotes - 1)
          : (numOfNotesUPDT = -1);

        for (let i = scribbleClip.length - 1; i > numOfNotesUPDT; i--) {
          if (scribbleClip[i].note == null) {
            var numOfNotesUPDT = numOfNotesUPDT - 1;
          } else {
            //further down the line when writing similar functions which accepts direction, just copy this switch statement as a whole and only edit the part below this else condition in each case
            var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, newPart);
          }
        }
        break;

      case 'left':
        numOfNotes < scribbleClip.length ? (numOfNotesUPDT = numOfNotes) : (numOfNotesUPDT = scribbleClip.length);

        for (let i = 0; i < numOfNotesUPDT; i++) {
          if (scribbleClip[i].note == null) {
            var numOfNotesUPDT = numOfNotesUPDT + 1;
          } else {
            var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, newPart);
          }
        }
        break;
    }

    //here we define the cutting by absolute value
  } else {
    var absoluteLength = numOfNotes;
    var clipLength = [];
    scribbleClip.forEach((element) => {
      clipLength.push(element.length);
    });
    var clipLength = clipLength.reduce(function (a, b) {
      return a + b;
    }, 0);
    if (absoluteLength > clipLength) var absoluteLength = clipLength;

    switch (direction) {
      case 'right':
        for (let i = scribbleClip.length - 1; i > -1; i--) {
          if (absoluteLength >= scribbleClip[i].length) {
            var absoluteLength = absoluteLength - scribbleClip[i].length;
            var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, newPart);
          } else {
            var nullPart = { note: null, length: absoluteLength, level: scribbleClip[i].level };
            var newPart = {
              note: scribbleClip[i].note,
              length: scribbleClip[i].length - absoluteLength,
              level: scribbleClip[i].level,
            };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, newPart);
            scribbleClip.insert(i + 1, nullPart);
            break;
          }
        }
        break;

      case 'left':
        for (let i = 0; i < scribbleClip.length; i++) {
          if (absoluteLength >= scribbleClip[i].length) {
            var absoluteLength = absoluteLength - scribbleClip[i].length;
            var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, newPart);
          } else {
            var nullPart = { note: null, length: absoluteLength, level: scribbleClip[i].level };
            var newPart = {
              note: scribbleClip[i].note,
              length: scribbleClip[i].length - absoluteLength,
              level: scribbleClip[i].level,
            };
            scribbleClip.splice(i, 1);
            scribbleClip.insert(i, nullPart);
            scribbleClip.insert(i + 1, newPart);
            break;
          }
        }
        break;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Transposes received amount of notes by a received interval from either direction in either direction
-scribbleClip accepts a Scribbletune clip
-direction accepts either 'left' or 'right and it decides from which direction we cut
-numOfNotes accepts the amount of notes to transpose
-interval accepts string and its function is pretty selfexplanatory. It also accepts number. If input is a number, then it transposes the note by a given number of fifths.  Mind up ('m2') vs down ('-2m')
-transposeRN accepts boolean and it guides whether root note will or will not be transposed. Root note is determined by getting the first note from the clip if RN omitted as argument
-RN accepts string and it sets the root note. If omitted or false, first note of the clip is the root note

-if numOfNotes is greater than number of notes in the scribbleClip, then all the notes (except for RNs if transposeRN == false) will be transposed without error
*/
function transposeNotesDirection(scribbleClip, numOfNotes, direction, interval, transposeRN, RN) {
  if (RN === false || RN === undefined) RN = scribbleClip[0].note;
  if (isNaN(interval) == false) interval = Interval.fromSemitones(interval);

  switch (
    direction //after we decide the direction, we do some increment conditions to figure out how far do we loop
  ) {
    case 'right':
      numOfNotes < scribbleClip.length
        ? (numOfNotesUPDT = scribbleClip.length - numOfNotes - 1)
        : (numOfNotesUPDT = -1);

      for (let i = scribbleClip.length - 1; i > numOfNotesUPDT; i--) {
        if (scribbleClip[i].note == null) {
          var numOfNotesUPDT = numOfNotesUPDT - 1;
        } else {
          switch (
            transposeRN //here we do the actual transposition and scribbleClip editing
          ) {
            case true:
              var newNote = [];
              newNote.push(Note.simplify(Note.transpose(scribbleClip[i].note.join(''), interval)));
              var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
              scribbleClip.splice(i, 1);
              scribbleClip.insert(i, newPart);
              break;

            case false:
              if (scribbleClip[i].note.join('') == RN) {
                var numOfNotesUPDT = numOfNotesUPDT - 1;
              } else {
                var newNote = [];
                newNote.push(Note.simplify(Note.transpose(scribbleClip[i].note.join(''), interval)));
                var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
                scribbleClip.splice(i, 1);
                scribbleClip.insert(i, newPart);
                break;
              }
              break;
          }
        }
        if (i == 0) numOfNotesUPDT = 0; //if there is null then the loop might go to minus values, which we cant have, because scribble clip does not have negative elements in array
      }
      break;

    case 'left':
      numOfNotes < scribbleClip.length ? (numOfNotesUPDT = numOfNotes) : (numOfNotesUPDT = scribbleClip.length);

      for (let i = 0; i < numOfNotesUPDT; i++) {
        if (scribbleClip[i].note == null) {
          var numOfNotesUPDT = numOfNotesUPDT + 1;
        } else {
          switch (transposeRN) {
            case true:
              var newNote = [];
              newNote.push(Note.transpose(scribbleClip[i].note.join(''), interval));
              var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
              scribbleClip.splice(i, 1);
              scribbleClip.insert(i, newPart);
              break;

            case false:
              if (scribbleClip[i].note.join('') == RN) {
                var numOfNotesUPDT = numOfNotesUPDT + 1;
              } else {
                var newNote = [];
                newNote.push(Note.transpose(scribbleClip[i].note.join(''), interval));
                var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
                scribbleClip.splice(i, 1);
                scribbleClip.insert(i, newPart);
                break;
              }
              break;
          }
        }
        if (i == scribbleClip.length - 1) numOfNotesUPDT = scribbleClip.length - 1; //Same case as before except inverted
      }
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Simply reverses the desired part of the clip. Does not skip nulls or give option to skip root notes, which is kinda lame.
-scribbleClip accepts a Scribbletune clip
-direction accepts either 'left' or 'right and it decides from which direction we reverse
-numOfNotes accepts the amount of notes to reverse
*/
function retrograde(scribbleClip, numOfNotes, direction) {
  if (numOfNotes > scribbleClip.length) numOfNotes = scribbleClip.length;
  if (numOfNotes < 2) return nullCleanup(scribbleClip);

  switch (direction) {
    case 'right':
      var retrograded = scribbleClip.splice(scribbleClip.length - numOfNotes, numOfNotes);
      var retrograded = retrograded.reverse();
      scribbleClip.splice(0, scribbleClip.length - numOfNotes);
      var scribbleClip = scribbleClip.concat(retrograded);
      break;

    case 'left':
      var retrograded = scribbleClip.splice(0, numOfNotes);
      var retrograded = retrograded.reverse();
      scribbleClip.splice(numOfNotes, scribbleClip.length - numOfNotes);
      var scribbleClip = retrograded.concat(scribbleClip);
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Performs inversion on selected amount of notes. Refer to this function for comments to understand how fucntions with numOfNotes and firstNote are written and what are theri contingencies
-scribbleClip accepts a Scribbletune clip
-numOfNotes accepts the amount of notes to invert
-firstNote accepts number and it denotes where to start inverting
-RN accepts string and if false, then the first note will be root note
-transposeRN can be ommited and it is here only for the contingency function. Note that inverting root note results in 0 interval so... inverted root note is a root note.
*/
function inversion(scribbleClip, numOfNotes, firstNote, RN, transposeRN) {
  if (RN === false || RN === undefined) RN = scribbleClip[0].note.join('');
  if (contingency(scribbleClip, numOfNotes, firstNote, RN, transposeRN)) return nullCleanup(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip); //contingency if 0 or lower value passed

  for (let i = 0; i < firstNote - 1; i++) {
    //we need to increment firstNote to skip null notes
    if (scribbleClip[i].note == null) firstNote++;
  }

  if (scribbleClip.length - firstNote < numOfNotes) {
    //this is a contingency in case numOfNotes input exceeds the clip length. If it does than last note is the last note of the clip, therefore Infinity can be inputed to change all notes after firstNote. There used to be the ' - firstNote + 2' bug for some reason, dont know why
    var lastNote = scribbleClip.length;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  var transpositions = [];

  scribbleClip.forEach((element) => {
    element.note != null
      ? transpositions.push(Interval.distance(element.note.join(''), RN))
      : transpositions.push(null);
  });

  for (let i = firstNote - 1; i < lastNote; i++) {
    //This is where the actual work gets done. This is also the part that varies the most in all functions of this type.

    if (transpositions[i] != null) {
      var newNote = [];
      newNote.push(Note.simplify(Note.transpose(RN, transpositions[i])));
      var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
      scribbleClip.splice(i, 1);
      scribbleClip.insert(i, newPart);
    } else {
      lastNote++;
      if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Transposes selected amount of notes.
-scribbleClip accepts a Scribbletune clip
-numOfNotes accepts the amount of notes to invert
-firstNote accepts number and it denotes where to start inverting
-interval accepts string and it denots the interval to transpose. It also accepts number. If input is a number, then it transposes the note by a given number of fifths.  Mind up ('m2') vs down ('-2m')
-transposeRN accepts boolean
-RN accepts string and if false, then the first note will be root note. Note that the root note needs to have an octave attached, ie 'F1', not just 'F'

In the future:
-fix the RN functionality, so that RN no longer needs an octave attached
*/
function transposeNotes(scribbleClip, numOfNotes, firstNote, interval, transposeRN, RN) {
  if (RN === false || RN === undefined) RN = scribbleClip[0].note.join('');
  if (isNaN(interval) == false) interval = Interval.fromSemitones(interval);
  if (contingency(scribbleClip, numOfNotes, firstNote, RN, transposeRN)) return nullCleanup(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip);

  for (let i = 0; i < firstNote - 1; i++) {
    if (scribbleClip[i].note == null) firstNote++;
  }

  if (scribbleClip.length - firstNote < numOfNotes) {
    var lastNote = scribbleClip.length;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  switch (transposeRN) {
    case true:
      for (let i = firstNote - 1; i < lastNote; i++) {
        if (scribbleClip[i].note != null) {
          var newNote = [];
          newNote.push(Note.simplify(Note.transpose(scribbleClip[i].note.join(''), interval)));
          var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        } else {
          lastNote++;
          if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
        }
      }
      break;

    case false:
      for (let i = firstNote - 1; i < lastNote; i++) {
        if (scribbleClip[i].note != null && scribbleClip[i].note != RN) {
          var newNote = [];
          newNote.push(Note.simplify(Note.transpose(scribbleClip[i].note.join(''), interval)));
          var newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        } else {
          lastNote++;
          if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
        }
      }
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Ommits selected amount of notes.
-scribbleClip accepts a Scribbletune clip
-numOfNotes accepts the amount of notes to ommit
-firstNote accepts number and it denotes where to start ommiting
-ommitRN accepts boolean
-RN accepts string and if false, then the first note will be root note
*/
function ommitNotes(scribbleClip, numOfNotes, firstNote, ommitRN, RN) {
  if (RN === false || RN === undefined) RN = scribbleClip[0].note.join('');
  if (contingency(scribbleClip, numOfNotes, firstNote, RN, ommitRN)) return nullCleanup(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip);

  for (let i = 0; i < firstNote - 1; i++) {
    if (scribbleClip[i].note == null) firstNote++;
  }

  if (scribbleClip.length - firstNote < numOfNotes) {
    var lastNote = scribbleClip.length;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  switch (ommitRN) {
    case true:
      for (let i = firstNote - 1; i < lastNote; i++) {
        if (scribbleClip[i].note != null) {
          var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        } else {
          lastNote++;
          if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
        }
      }
      break;

    case false:
      for (let i = firstNote - 1; i < lastNote; i++) {
        if (scribbleClip[i].note != null && scribbleClip[i].note != RN) {
          var newPart = { note: null, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        } else {
          lastNote++;
          if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
        }
      }
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Shortens the clip by removing null values on either side
-scribbleClip accepts SCribletune clip
-direction accepts 'left' or 'right' string
*/
function trimClip(scribbleClip, direction) {
  switch (direction) {
    case 'right':
      for (let i = scribbleClip.length - 1; i > 0; i--) {
        if (scribbleClip[i].note != null) {
          break;
        } else if (scribbleClip[i].note == null) {
          scribbleClip.splice(i, 1);
        }
      }
      break;

    case 'left':
      for (let i = 0; i < scribbleClip.length; i++) {
        if (scribbleClip[i].note != null) {
          break;
        } else if (scribbleClip[i].note == null) {
          scribbleClip.splice(i, 1);
        }
      }
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}
/*
changes the length of notes. Does not skip null notes!!!
-scribbleClip accepts a Scribbletune clip
-numOfNotes accepts the amount of notes to change
-firstNote accepts number and it denotes where to start changing
-changeRN accepts boolean
-value accepts the value by which the length of notes will be changed, ie 0.5 halves the notes
-RN accepts string and if false, then the first note will be root note
*/
function changeLength(scribbleClip, numOfNotes, firstNote, changeRN, value, RN) {
  if (RN === false || RN === undefined) RN = scribbleClip[0].note.join('');
  if (contingency(scribbleClip, numOfNotes, firstNote, RN, changeRN)) return nullCleanup(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip);

  if (scribbleClip.length - firstNote < numOfNotes) {
    var lastNote = scribbleClip.length;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  switch (changeRN) {
    case true:
      for (let i = firstNote - 1; i < lastNote; i++) {
        var newPart = {
          note: scribbleClip[i].note,
          length: scribbleClip[i].length * value,
          level: scribbleClip[i].level,
        };
        scribbleClip.splice(i, 1);
        scribbleClip.insert(i, newPart);
      }
      break;

    case false:
      for (let i = firstNote - 1; i < lastNote; i++) {
        if (scribbleClip[i].note != RN) {
          var newPart = {
            note: scribbleClip[i].note,
            length: scribbleClip[i].length * value,
            level: scribbleClip[i].level,
          };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        } else {
          lastNote++;
          if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
        }
      }
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Displaces a motif from either direction. Cal extend the duration of the clip or leave it as is and cut notes, depending on input. Does not skip null values.
-scribbleClip accepts SCribletune clip
-direction accepts 'left' or 'right' string
-absoluteLength accepts value by which to displace
-nullEdge accepts boolean and guides whether the notes of the direction opposite to the direction of displacement should be changed to null. The length of nulled notes is the absoluteLength
-trimEdge accepts boolean and works similar to nullEdge, except iit trims nulls. nullEdge = false and trimEdge = true results in nothing, unless there was a null before.
*/
function displacement(scribbleClip, direction, absoluteLength, nullEdge, trimEdge) {
  switch (direction) {
    case 'right':
      var newPart = { note: null, length: absoluteLength, level: 100 };
      scribbleClip.insert(scribbleClip.length, newPart);

      if (nullEdge) nullNotesDirection(scribbleClip, 'left', absoluteLength, true);
      if (trimEdge) trimClip(scribbleClip, 'left');
      break;

    case 'left':
      var newPart = { note: null, length: absoluteLength, level: 100 };
      scribbleClip.insert(0, newPart);

      if (nullEdge) nullNotesDirection(scribbleClip, 'right', absoluteLength, true);
      if (trimEdge) trimClip(scribbleClip, 'right');
      break;
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
If there is null after selected note, then the selected note becomes longer by the length of the following null and the following null disapears. firstNote skips nulls.
-scribbleClip accepts a Scribbletune clip
-numOfNotes accepts the amount of notes to change
-firstNote accepts number and it denotes where to start changing
*/
function legato(scribbleClip, numOfNotes, firstNote) {
  if (contingency(scribbleClip, numOfNotes, firstNote, false, false)) return nullCleanup(scribbleClip);
  nullCleanup(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip);

  for (let i = 0; i < firstNote - 1; i++) {
    if (scribbleClip[i].note == null) firstNote++;
  }

  if (scribbleClip.length - firstNote < numOfNotes) {
    var lastNote = scribbleClip.length - firstNote + 2;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  for (let i = firstNote - 1; i < lastNote; i++) {
    if (i == scribbleClip.length - 1) break;

    if (scribbleClip[i].note != null) {
      if (scribbleClip[i + 1].note == null) {
        var newPart = {
          note: scribbleClip[i].note,
          length: scribbleClip[i].length + scribbleClip[i + 1].length,
          level: scribbleClip[i].level,
        };
        scribbleClip.splice(i, 2);
        scribbleClip.insert(i, newPart);
      }
    } else {
      lastNote++;
      if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Converts a chord to an arabic numeral (substituting the function of a roman numeral in a standard chord notation) based on the inputed root note of a chord and a desired key.
-RN accepts a string that denotes the root note of a key, ie 'C' of C major
-mode accepts either of the 4 possible strings: "major", "minor", "ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"
-chord accepts a string of a chord
*/
function absoluteToRelativeChord(RN, mode, chord) {
  let notes = Mode.notes(mode, RN);

  if (chord.indexOf('#') == 1 || chord.indexOf('b') == 1) {
    var chordRoot = chord.slice(0, 2);
  } else {
    var chordRoot = chord.slice(0, 1);
  }

  return notes.indexOf(chordRoot) + 1;
}

/*
Translates an array of chords from roman notation to absolute chord notation.
-RN accepts a string that denotes the root note of a key, ie 'C' of C major
-chords accepts array of strings
*/
function romans(RN, chords) {
  for (let i = 0; i < chords.length; i++) {
    let chord = chords[i];

    if (chord.match(/[ iIVv ]/) !== null && chord.indexOf('dim') === -1) {
      if (chord.toLowerCase() === chord) {
        switch (chord.indexOf(7) === -1) {
          case true:
            chord = chord + 'm';
            break;

          case false:
            chord = chord.slice(0, -1);
            chord = chord + 'm' + '7';
            break;
        }
      } else if (
        chord.indexOf('maj') === -1 &&
        chord.indexOf('Maj') === -1 &&
        chord.indexOf('min') === -1 &&
        chord.indexOf('Min') === -1 &&
        chord.indexOf('m') === -1
      ) {
        switch (chord.indexOf(7) === -1) {
          case true:
            chord = chord + 'M';
            break;

          case false:
            chord = chord.slice(0, -1);
            chord = chord + 'M' + '7';
            break;
        }
      }
      let chordarr = [];
      chordarr.push(chord);
      chordarr = Progression.fromRomanNumerals(RN, chordarr);
      chords[i] = chordarr[0];
    }
  }
  return chords;
}

//ridiculous craziness for chops. Rewrite of the entire chop thing would prly be good. The good thing is that this function is now not in use and can be deleted
function chopNum(scribbleClip, subdiv, num) {
  if (num === 0) return scribbleClip;
  var chopSubdiv = subdiv;

  switch (subdiv) {
    case '2m':
      switch (num) {
        case 1:
          chopSubdiv = '1m';
          break;
        case 2:
          chopSubdiv = '1n';
          break;
        case 3:
          chopSubdiv = '2n';
          break;
        case 4:
          chopSubdiv = '4n';
          break;
      }
      break;

    case '1m':
      switch (num) {
        case 1:
          chopSubdiv = '1n';
          break;
        case 2:
          chopSubdiv = '2n';
          break;
        case 3:
          chopSubdiv = '4n';
          break;
      }
      break;

    case '1n':
      switch (num) {
        case 1:
          chopSubdiv = '2n';
          break;
        case 2:
          chopSubdiv = '4n';
          break;
      }
      break;
    case '2n':
      switch (num) {
        case 1:
          chopSubdiv = '4n';
          break;
      }
      break;
  }

  var clipLength = 0;
  for (let i = 0; i < scribbleClip.length; i++) clipLength = clipLength + scribbleClip[i].length;

  const spareClip = [];
  spareClip.push(scribbleClip[0]);
  chop(spareClip, chopSubdiv, 'x-');
  const choplength = spareClip[0].length;
  const numChops = clipLength / choplength;

  var chopPattern = [];

  for (let i = 0; i < numChops; i++) i % 2 === 0 ? chopPattern.push('x') : chopPattern.push('-');

  chordPattern = chopPattern.join('');

  chop(scribbleClip, chopSubdiv, chordPattern);
  return scribbleClip;
}

/*
Generates a chord progression. Returns a scribbleclip and the chord progression as a string, so it can be manipulated again.
-RN accepts a string that denotes the root note of a key, ie 'C' of C major
-mode accepts either of the 4 possible strings: "major", "minor", "ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"
-seventh denotes whether we will use seventh chords and accepts boolean.
-chords accetps an array or string that denotes chords to use and where to pick random chords, ie 'CM7 1 2 R'. 'R' denotes that this time we pick a random chord. Numbers 1-7 are a standin for the Roman numeral chord notation. Chord names are accepted in both tonal.js Scribbletune ('maj' vs 'M').
-repeatChords dictates whether randomly picked chords have a chance to be the same as chords already present in the progression.
-pattern is the Scribbletune pattern
-subdiv is the Sccribbletune subdiv
-voicing accepts string and it looks for globally scoped functions with a name same as the string to execute on the scribbleclip.
-octave accepts 0-5 and it denotes in which octave a root note of each chord should be
-bassNote accepts 1 or 0 and it denotes whether there should be a root note at octave 0 added to each chord

description to add: randomAssist, chordMap

Notes:
-For now we accept either names of chords or arabic numbers. In the future write function that will preceed this function with translation of roman to arabic. 
-When using randomAssist feature to pick a chord from a chord map, whether the previous chord is M or m is disregarded. In the future, the diferentiator needs to be added.
-Another thing with randomAssist is that when M instead of maj Maj is inputed in the chords argument. Chord input will have to be strictly controlled in the frontend. When refactoring this function, special attention will have to be paid to tha Maj M translation from tonal to Scribbletune.
*/
function makeChords(params) {
  let {
    RN,
    mode,
    seventh,
    chords,
    repeatChords,
    pattern,
    subdiv,
    randomAssist,
    chordMap,
    sizzle,
    advChords,
    open,
    voicing,
    octave,
    bassNote,
    splitChop,
    splitter,
  } = params;
  seventh = humanToBool(seventh); //design choice: we convert all yes/no on/off values to boolean
  repeatChords = humanToBool(repeatChords);
  randomAssist = humanToBool(randomAssist);

  switch (seventh) {
    case false:
      var chordSet = Mode.triads(mode, RN);
      break;
    case true:
      var chordSet = Mode.seventhChords(mode, RN);
      break;
  }

  if (!isNaN(chords)) chords = chords.toString();
  if (!Array.isArray(chords)) chords = chords.split(' '); //we want to accept both strings and arrays
  chords.forEach((chord, index) => (chords[index] = chords[index].toString())); //this is here because numbers need to be strings later
  chords = romans(RN, chords); //we convert chords in roman numeral notation to absolute notation

  chordSet.forEach((chord, index) => {
    if (chordSet[index].indexOf('##') !== -1 || chordSet[index].indexOf('bb') !== -1)
      chordSet[index] = Note.simplify(chordSet[index].substring(0, 3)) + chordSet[index].substring(3, 100);
  }); //Pretty ilegible, I know. Sometimes tonal spits out C## instead of D etc, so we fix it in this line. Maybe better solution would be to adress all cases with multiple bs and #s, not just with 2.
  chordSet.forEach((chord, index) => (chordSet[index] = chordSet[index].replace(/maj/g, 'M'))); // this step is necessary, because Scribbletune does not accept maj as a denotation of major chord, instead it accepts M
  chordSet.forEach((chord, index) => (chordSet[index] = chordSet[index].replace(/Maj/g, 'M')));
  chords.forEach((chord, index) => (chords[index] = chords[index].replace(/maj/g, 'M'))); //Thanks to this we can accept either the tonal.js or Scribbletune notation (maj vs M)
  chords.forEach((chord, index) => (chords[index] = chords[index].replace(/Maj/g, 'M')));
  chordSet.forEach((chord, index) => {
    if (chordSet[index].length === 1) chordSet[index] = chordSet[index] + 'M';
  }); //Also tonal.js sometimes calls major chords without "M", ie CM is just C. Scribbletune v4+ dont accept dat!
  chordSet.forEach((chord, index) => {
    if (chordSet[index].length === 2 && chordSet[index].indexOf('#') !== -1) chordSet[index] = chordSet[index] + 'M';
  }); //just like the last one, except for black key notes
  chordSet.forEach((chord, index) => {
    if (chordSet[index].length === 2 && chordSet[index].indexOf('b') !== -1) chordSet[index] = chordSet[index] + 'M';
  });

  var chordsFinal = [];

  for (let i = 0; i < chords.length; i++) {
    //Here we convert numbers to chord names if numbers are present in the chords variable.

    if (!isNaN(chords[i])) {
      chordsFinal.push(chordSet[chords[i] - 1]);
    } else {
      chordsFinal.push(chords[i]);
    }
  }

  const repeatchordsInputed = repeatChords; //this is here, because later the repeatChords variable needs to be reeveluated in a loop

  switch (
    randomAssist //Are we using the chordMap or not? Important branch that starts right here
  ) {
    case false: //We are not using the chordmap
      for (let i = 0; i < chords.length; i++) {
        let chordsPresent = chordSet.filter((element) => chordsFinal.includes(element)); //these 2 lines are here as a contingency for the upcoming while loop
        if (chordsPresent.length == chordSet.length) repeatChords = true;

        if (chords[i].indexOf('R') !== -1) {
          switch (repeatChords) {
            case false:
              let arr = [];
              while (arr.length < 1) {
                let chordThatWasPicked = chordSet[diceRange(7, 0)];
                if (chordsFinal.indexOf(chordThatWasPicked) === -1) arr.push(chordThatWasPicked);
              }

              chordsFinal[i] = arr[0];
              break;

            case true:
              chordsFinal[i] = chordSet[diceRange(7, 0)];
              break;
          }

          if (chords[i].length !== 1) {
            //for advanced chords with R, like Rsus4

            let currentRoot =
              chordsFinal[i].charAt(1) === 'b' || chordsFinal[i].charAt(1) === '#'
                ? (chordsFinal[i] = chordsFinal[i].charAt(0) + chordsFinal[i].charAt(1))
                : (chordsFinal[i] = chordsFinal[i].charAt(0));
            chordsFinal[i] = currentRoot + chords[i].substring(1);
          }
        }
      }
      break;

    case true: //We are using the chordmap
      for (let i = 0; i < chords.length; i++) {
        if (repeatchordsInputed === false) repeatChords = false; //a necessary reevaluation of the repeatChords variable that is here because of the chordMap

        if (i > 0) {
          //the contingency here is slightly more complex, as it needs to take into account the previous chord in regards to the chordMap
          var previousChordNumeral = absoluteToRelativeChord(RN, mode, chordsFinal[i - 1]);

          let chordsPresent = chordSet.filter((element) => chordsFinal.includes(element)); //at this part of the contingency, we look at whether all chords are already present, just like in the previous contingency

          if (chordsPresent.length == chordSet.length) repeatChords = true;

          let chordsFromPreviousChord = []; //here we check whether all chords that would follow the previous chord according to the chordMap are present.
          chordMap[previousChordNumeral].forEach((element) => chordsFromPreviousChord.push(chordSet[element - 1]));
          let chordsPresentFromPreviousChord = chordsPresent.filter((element) =>
            chordsFromPreviousChord.includes(element)
          );

          if (chordsFromPreviousChord.length == chordsPresentFromPreviousChord.length) repeatChords = true;
        } //end of the contingency

        if (chords[i].indexOf('R') !== -1) {
          switch (repeatChords) {
            case false:
              if (i === 0) {
                let arr = [];
                while (arr.length < 1) {
                  var chordsToPickFrom = chordMap[0];
                  var chordThatWasPicked = chordsToPickFrom[diceRange(chordsToPickFrom.length, 0)] - 1;
                  if (chordsFinal.indexOf(chordSet[chordThatWasPicked]) === -1) arr.push(chordSet[chordThatWasPicked]);
                }
                chordsFinal[i] = arr[0];
              } else {
                let arr = [];
                while (arr.length < 1) {
                  var chordsToPickFrom = chordMap[previousChordNumeral];
                  var chordThatWasPicked = chordsToPickFrom[diceRange(chordsToPickFrom.length, 0)] - 1;
                  if (chordsFinal.indexOf(chordSet[chordThatWasPicked]) === -1) arr.push(chordSet[chordThatWasPicked]);
                }
                chordsFinal[i] = arr[0];
              }
              break;

            case true:
              if (i === 0) {
                var chordsToPickFrom = chordMap[0];
                var chordThatWasPicked = chordsToPickFrom[diceRange(chordsToPickFrom.length, 0)] - 1;
                chordsFinal[i] = chordSet[chordThatWasPicked];
              } else {
                var chordsToPickFrom = chordMap[previousChordNumeral];
                var chordThatWasPicked = chordsToPickFrom[diceRange(chordsToPickFrom.length, 0)] - 1;
                chordsFinal[i] = chordSet[chordThatWasPicked];
              }

              break;
          }

          if (chords[i].length !== 1) {
            //for advanced chords with R, like Rsus4

            let currentRoot =
              chordsFinal[i].charAt(1) === 'b' || chordsFinal[i].charAt(1) === '#'
                ? (chordsFinal[i] = chordsFinal[i].charAt(0) + chordsFinal[i].charAt(1))
                : (chordsFinal[i] = chordsFinal[i].charAt(0));
            chordsFinal[i] = currentRoot + chords[i].substring(1);
          }
        }
      }
      break;
  }

  for (let i = 0; i < chordsFinal.length; i++) {
    //Here we have to loop through the chordsFinal array and fix any chords that Scribbletune cant read.
    if (chordsFinal[i].indexOf('mb5') !== -1) chordsFinal[i] = chordsFinal[i].replace(/mb5/g, 'dim');
    if (chordsFinal[i].indexOf('m7b5') !== -1) chordsFinal[i] = chordsFinal[i].replace(/m7b5/g, 'dim7');

    if (
      (chordsFinal[i].length < 4 && chordsFinal[i].indexOf('7') == 1) ||
      (chordsFinal[i].length < 4 && chordsFinal[i].indexOf('#7') == 1) ||
      (chordsFinal[i].length < 4 && chordsFinal[i].indexOf('b7') == 1)
    )
      chordsFinal[i] = chordsFinal[i] + 'th'; //Again with the th at the end of G7. the < 4 condition is there so we are able to accept crazy chords like D#7#11b13
    if (chordsFinal[i].indexOf('thth') !== -1) chordsFinal[i] = chordsFinal[i].replace(/thth/g, 'th');
  }

  if (advChords !== 'none') {
    //if we want to, we transform all the chords into any accepted crazy chord in the following 2 loops
    chordsFinal.forEach((chord, index) => {
      chordsFinal[index].charAt(1) === 'b' || chordsFinal[index].charAt(1) === '#'
        ? (chordsFinal[index] = chordsFinal[index].charAt(0) + chordsFinal[index].charAt(1))
        : (chordsFinal[index] = chordsFinal[index].charAt(0));
    });
    chordsFinal.forEach((chord, index) => {
      chordsFinal[index] = chordsFinal[index] + advChords;
    });
  }

  chordsFinal = chordsFinal.join(' ');

  var scribbleClip = scribble.clip({
    notes: chordsFinal,
    pattern,
    subdiv,
    sizzle,
  });

  const rootNotes = []; //In these 3 steps we extract root notes of chords before they go to voicingCallback
  scribbleClip.forEach((element) => {
    element.note === null ? rootNotes.push('n') : rootNotes.push(element.note[0]);
  });
  rootNotes.forEach((chord, index) => {
    rootNotes[index].charAt(1) === 'b' || rootNotes[index].charAt(1) === '#'
      ? (rootNotes[index] = rootNotes[index].charAt(0) + rootNotes[index].charAt(1))
      : (rootNotes[index] = rootNotes[index].charAt(0));
  });

  const voicingCallback = global[voicing]; //this is a way through which a function can be passed to another function as a string and yet it will still act as a callback
  scribbleClip = voicingCallback(scribbleClip);

  chordsToOctave(scribbleClip, octave);

  if (open !== 0) openChords(scribbleClip, open);

  if (bassNote !== 0) augmentChordsWithBassNote2(scribbleClip, rootNotes, bassNote);

  if (splitter !== 0) var scribbleClip = chopOrSplit(scribbleClip, splitter, splitChop);

  return [scribbleClip, chordsFinal];
}

/*
Transposes a note in a chord.
-scribbleClip accepts a Scribbletune clip
-firstChord accepts number and it denotes at which chord in the scribbleclip array to start transposing
-numOfChords accepts number and it denotes the amount of chords that will have a transposed note
-numNote accepts array and denotes which notes from the chord to transpose, ie 1 (in ie [1, 2...]) in [ 'F4', 'A4', 'C4', 'E5' ] will transpose 'F4'. Alternatively it accepts "all"
-interval accepts string and it denots the interval to transpose. It also accepts number. If input is a number, then it transposes the note by a given number of semitones or more probably fifths, im not sure. Mind up ('m2') vs down ('-2m')

In the future:
-it might also accept name of to note and as parameter to denote which note to transpose, instead of just numNote
-when Scribbletune creates a chord, it orders the notes in array from lowest to highest. Pretty logical. When a scribbleclip gets altered by this function, the original order of the notes stays the same. Meaning, that if we transpose 'F4' in [ 'F4', 'A4', 'C5' ] by '8P', the new chord will be [ 'F5', 'A4', 'C5' ] instead of [ 'A4', 'C5', 'F5' ]. It might be useful to write a function that fixes this.
*/
function transposeNotesInChord(scribbleClip, firstChord, numOfChords, numNote, interval) {
  if (isNaN(interval) == false) interval = Interval.fromSemitones(interval);
  if (contingency(scribbleClip, numOfChords, firstChord, false, false)) return nullCleanup(scribbleClip);
  if (firstChord < 1) return nullCleanup(scribbleClip);
  redeclareScribbleClip(scribbleClip);
  if (numNote === 'all') numNote = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; //lame af, I know. If we want to transpose all notes in a chord, then we just make sure there are more chord to transpose than a chord can have

  for (let i = 0; i < firstChord - 1; i++) {
    if (scribbleClip[i].note == null) firstChord++;
  }

  if (scribbleClip.length - firstChord < numOfChords) {
    var lastChord = scribbleClip.length;
  } else {
    var lastChord = firstChord - 1 + numOfChords;
  }

  for (let i = firstChord - 1; i < lastChord; i++) {
    if (scribbleClip[i].note != null) {
      for (let n = 0; n < numNote.length; n++) {
        if (numNote[n] < scribbleClip[i].note.length + 1) {
          var newNote = Note.simplify(Note.transpose(scribbleClip[i].note[numNote[n] - 1], interval));
          var currentChord = scribbleClip[i].note;

          for (let j = 0; j < currentChord.length; j++) {
            if (j + 1 == numNote[n]) currentChord[j] = newNote;
          }

          var newPart = { note: currentChord, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        }
      }
    } else {
      lastChord++;
      if (lastChord > scribbleClip.length) var lastChord = scribbleClip.length;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Augments a chord with an inputed note
-scribbleClip accepts a Scribbletune clip
-chord accepts number and it denotes which chord in the scribbleclip array to augment
-numNote accepts number and it denotes behind which note in the chord array will the augmentingNote be inserted
-augmentingNote accepts string and it denotes which note to insert
*/
function augmentChord(scribbleClip, chord, numNote, augmentingNote) {
  if (chord < 1 || chord > scribbleClip.length) return nullCleanup(scribbleClip);

  for (let i = 0; i < chord; i++) if (scribbleClip[i].note === null) chord++;

  if (chord > scribbleClip.length) return nullCleanup(scribbleClip);
  redeclareScribbleClip(scribbleClip);

  var chord = chord - 1;
  if (scribbleClip[chord].note.length < numNote) numNote = scribbleClip[chord].note.length + 1;

  var currentChord = scribbleClip[chord].note;
  if (currentChord.indexOf(augmentingNote) === -1) currentChord.insert(numNote - 1, augmentingNote);

  var newPart = { note: currentChord, length: scribbleClip[chord].length, level: scribbleClip[chord].level };
  scribbleClip.splice(chord, 1);
  scribbleClip.insert(chord, newPart);

  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
Augments all chords in a Scribbleclip with a the 1st note at the scribbleclip note array that is at the 0th octave. 
-scribbleClip accepts a Scribbletune clip
*/
function augmentChordsWithBassNote(scribbleClip) {
  let chordCount = 0;

  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      chordCount++;

      var rootNote = scribbleClip[i].note[0];
      var bassNote = rootNote.replace(/[1-9]/g, '1'); //We transpose the root note to the 1 octave, not 0 octave, because Scribbletune produces notes an octave lower.
      augmentChord(scribbleClip, chordCount, 1, bassNote);
    }
  }

  return scribbleClip;
}

/*
Augments all chords in a Scribbleclip with a root note that is at the 0th octave. 
-scribbleClip accepts a Scribbletune clip
-rootNotes accepts array of note strings
*/
function augmentChordsWithBassNote2(scribbleClip, rootNotes, CX) {
  let chordCount = 0;

  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      chordCount++;

      var bassNote = rootNotes[i] + CX;
      //var bassNote = rootNote.replace(/[1-9]/g, '1') //We transpose the root note to the 1 octave, not 0 octave, because Scribbletune produces notes an octave lower.
      augmentChord(scribbleClip, chordCount, 1, bassNote);
    }
  }

  return scribbleClip;
}

/*
Defines at which octave should the scribbleclip be created by scribblemax. Accepts Scribbletune clip and a number denoting the desired octave.
*/
function chordsToOctave(scribbleClip, octave) {
  //var octave = octave +1 //because scribblemax exports them octave lower, than scribbleclip sais.
  const defOctave = 3; //default octave, where Scribbletune exports chords
  const transp = octave - defOctave;

  switch (Math.sign(transp)) {
    case 1:
      for (let i = 0; i < transp; i++) var scribbleClip = transposeNotesInChord(scribbleClip, 1, Infinity, 'all', '8P');
      break;
    case -1:
      for (let i = 0; i < transp * -1; i++) transposeNotesInChord(scribbleClip, 1, Infinity, 'all', '-8P');
      break;
    case 0:
      break;
  }

  return scribbleClip;
}

/*
The chordMap needs to be translated from the recieved version that the chordMap matrix understands to the version that the makeChords fn understands.
*/
function translateChordMap(chordMapMatrixified) {
  const chordMap = [[], [], [], [], [], [], [], []];

  for (let i = 0; i < chordMapMatrixified.length; i++) {
    if ((i + 1) % 3 === 0 && chordMapMatrixified[i] === 1) {
      //we divide by 3 because the matrix data are always 3 digits: rolumn, row, value

      chordMap[chordMapMatrixified[i - 1]].push(chordMapMatrixified[i - 2] + 1);
    }
  }

  chordMap.forEach((element) => {
    if (element.length === 0) element.push(1);
  }); //We cannot construct chord progression if 0 chords are to follow any chord, but user might leave a row totally empty, hence if empty row, we push the 1st chord

  return chordMap;
}

/*
Generates a rhythm suitable for 4 chord pattern out of 4 "x" and 4 or 12 "_".
-wild accepts boolean. If true, x can be anywhere, if false, x is more evenly distributed
-hoLong accepts 1 or 2. If 1 then the rhythm pattern is 8 char long. If 2 then 16.
*/
function generateRhythm(wild, howLong) {
  switch (howLong) {
    case 'short':
      numChar = 8;
      break;

    case 'long':
      numChar = 16;
      break;
  }

  var rhythm = [];
  for (var i = 0; i < numChar; i++) rhythm.push('_');

  switch (wild) {
    case 'wild':
      var xArray = diceMultiRollSortedASC(numChar, 0, 4);

      break;

    case 'mild':
      var x1 = diceRange(numChar / 4, 0);
      var x2 = diceRange(numChar / 4 + numChar / 4, numChar / 4);
      var x3 = diceRange(numChar / 4 + (numChar / 4) * 2, numChar / 4 + numChar / 4);
      var x4 = diceRange(numChar / 4 + (numChar / 4) * 3, numChar / 4 + (numChar / 4) * 2);
      var xArray = [x1, x2, x3, x4];

      break;
  }

  var j = 0;
  for (var i = 0; i < numChar; i++) {
    if (i === xArray[j]) {
      rhythm[i] = 'x';
      j++;
    }
  }

  for (var i = 0; i < numChar; i) {
    if (rhythm[i] === '_') {
      rhythm.shift();
      rhythm.push('_');
    } else {
      break;
    }
  }

  return rhythm.join('');
}

function halve(scribbleClip, numOfNotes, firstNote) {
  if (contingency(scribbleClip, numOfNotes, firstNote, false, false)) return nullCleanup(scribbleClip);
  nullCleanup(scribbleClip);
  redeclareScribbleClip(scribbleClip);

  if (firstNote < 1) return nullCleanup(scribbleClip);

  for (let i = 0; i < firstNote - 1; i++) {
    if (scribbleClip[i].note == null) firstNote++;
  }

  if (scribbleClip.length - firstNote < numOfNotes) {
    var lastNote = scribbleClip.length;
  } else {
    var lastNote = firstNote - 1 + numOfNotes;
  }

  for (var i = firstNote - 1; i < lastNote; i++) {
    if (scribbleClip[i].note != null) {
      var newPart = { note: scribbleClip[i].note, length: scribbleClip[i].length / 2, level: scribbleClip[i].level };
      scribbleClip.splice(i, 1);
      scribbleClip.insert(i, newPart);
      scribbleClip.insert(i + 1, newPart);
      i++;
      lastNote++;
    } else {
      lastNote++;
      if (lastNote > scribbleClip.length) var lastNote = scribbleClip.length;
    }
  }
  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

/*
We chop up a clip by a given length
-scribbleClip accepts scribletune clip
-splitter accepts 1-5
-splitChop accepts "split" or "chop", determining whether to split or chop the clip. "halve" halves the clip the number of times splitter is
*/
function chopOrSplit(scribbleClip, splitter, splitChop) {
  redeclareScribbleClip(scribbleClip);

  if (splitter === 1) {
    var splitter2 = 5;
  }
  if (splitter === 2) {
    var splitter2 = 4;
  }
  if (splitter === 3) {
    var splitter2 = 3;
  }
  if (splitter === 4) {
    var splitter2 = 2;
  }
  if (splitter === 5) {
    var splitter2 = 1;
  }

  switch (splitter2) {
    case 5: //1/8
      var chopLength = 128;
      break;

    case 4: //1/4
      var chopLength = 256;
      break;

    case 3: //1/2
      var chopLength = 512;
      break;

    case 2: //1
      var chopLength = 2048;
      break;

    case 1: //2
      var chopLength = 4096;
      break;
  }

  var newClip = [];

  for (let i = 0; i < scribbleClip.length; i++) {
    const partLength = scribbleClip[i].length;

    const chops = Math.trunc(partLength) / chopLength;

    const newPart = { note: scribbleClip[i].note, length: partLength / chops, level: scribbleClip[i].level };

    for (let j = 0; j < chops; j++) {
      if (splitChop === 0) {
        //split
        newClip.push(newPart);
      } else if (splitChop === 1) {
        //chop
        const newPartNull = { note: null, length: partLength / chops, level: scribbleClip[i].level };
        j % 2 === 0 ? newClip.push(newPart) : newClip.push(newPartNull);
      }
    }
    if (splitChop === 2) {
      //halve
      var partLengthHalved = partLength;
      var exp = 2;
      for (let k = 0; k < splitter; k++) var partLengthHalved = partLengthHalved / 2;
      for (let m = 0; m < splitter - 1; m++) var exp = exp * 2;
      const newPartHalved = { note: scribbleClip[i].note, length: partLengthHalved, level: scribbleClip[i].level };
      for (let l = 0; l < exp; l++) newClip.push(newPartHalved);
    }
  }

  //We return new clip, so scribbleclip needs to be redeclared
  nullCleanup(newClip);
  notesToArray(newClip);
  return newClip;
}

function removeNotesFromChord(scribbleClip, firstChord, numOfChords, numNote) {
  if (isNaN(interval) == false) interval = Interval.fromSemitones(interval);
  if (contingency(scribbleClip, numOfChords, firstChord, false, false)) return nullCleanup(scribbleClip);
  if (firstChord < 1) return nullCleanup(scribbleClip);
  redeclareScribbleClip(scribbleClip);

  for (let i = 0; i < firstChord - 1; i++) {
    if (scribbleClip[i].note == null) firstChord++;
  }

  if (scribbleClip.length - firstChord < numOfChords) {
    var lastChord = scribbleClip.length;
  } else {
    var lastChord = firstChord - 1 + numOfChords;
  }

  for (let i = firstChord - 1; i < lastChord; i++) {
    if (scribbleClip[i].note !== null) {
      for (let n = 0; n < numNote.length; n++) {
        if (numNote[n] < scribbleClip[i].note.length + 1) {
          var newNote = 'placeholder';
          var currentChord = scribbleClip[i].note;

          for (let j = 0; j < currentChord.length; j++) {
            if (j + 1 == numNote[n]) currentChord[j] = newNote;
          }

          var newPart = { note: currentChord, length: scribbleClip[i].length, level: scribbleClip[i].level };
          scribbleClip.splice(i, 1);
          scribbleClip.insert(i, newPart);
        }
      }

      var newPart = {
        note: scribbleClip[i].note.filter((word) => word !== 'placeholder'),
        length: scribbleClip[i].length,
        level: scribbleClip[i].level,
      };
      scribbleClip.splice(i, 1);
      scribbleClip.insert(i, newPart);
    } else {
      lastChord++;
      if (lastChord > scribbleClip.length) var lastChord = scribbleClip.length;
    }
  }

  nullCleanup(scribbleClip);
  notesToArray(scribbleClip);
  return scribbleClip;
}

//It is possible to let Scribbletune make chords like notes: 'FM DM', pattern: "xxxx". That means that same chords repeat, that is their note arrays repeat. We redeclare the clip so they dont repeat
function redeclareScribbleClip(scribbleClip) {
  for (let i = 0; i < scribbleClip.length; i++) {
    var newNote = [];
    scribbleClip[i].note === null ? (newNote = null) : newNote.push(...scribbleClip[i].note);
    let newPart = { note: newNote, length: scribbleClip[i].length, level: scribbleClip[i].level };
    scribbleClip.splice(i, 1);
    scribbleClip.insert(i, newPart);
  }
  return scribbleClip;
}

//Transposes the 1st and the 3rd note octave or 2 octaves lower and higher respectively
function openChords(scribbleClip, open) {
  switch (open) {
    case 1:
      var chordPos = 0;

      for (let i = 0; i < scribbleClip.length; i++) {
        var currentChord = scribbleClip[i].note;

        if (currentChord !== null) {
          var currentChordFreqs = [];
          currentChord.forEach((element) => {
            currentChordFreqs.push(Note.freq(element));
          });
          var lowestNoteIndex = indexOfSmallest(currentChordFreqs);
          scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [lowestNoteIndex + 1], '-8P');
          currentChordFreqs[lowestNoteIndex] = 1000000;
          currentChordFreqs[indexOfSmallest(currentChordFreqs)] = 'NaN';
          currentChordFreqs[lowestNoteIndex] = 'NaN';

          for (let j = 0; j < currentChordFreqs.length; j++) {
            if (currentChordFreqs[j] !== 'NaN') {
              scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [j + 1], '8P');
            }
          }
          chordPos++;
        }
      }

      break;

    case 2:
      var chordPos = 0;

      for (let i = 0; i < scribbleClip.length; i++) {
        var currentChord = scribbleClip[i].note;

        if (currentChord !== null) {
          var currentChordFreqs = [];
          currentChord.forEach((element) => {
            currentChordFreqs.push(Note.freq(element));
          });
          var lowestNoteIndex = indexOfSmallest(currentChordFreqs);
          scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [lowestNoteIndex + 1], '-8P');
          scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [lowestNoteIndex + 1], '-8P');
          currentChordFreqs[lowestNoteIndex] = 1000000;
          currentChordFreqs[indexOfSmallest(currentChordFreqs)] = 'NaN';
          currentChordFreqs[lowestNoteIndex] = 'NaN';

          for (let j = 0; j < currentChordFreqs.length; j++) {
            if (currentChordFreqs[j] !== 'NaN') {
              scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [j + 1], '8P');
              scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [j + 1], '8P');
            }
          }
          chordPos++;
        }
      }

      break;
  }
  return scribbleClip;
}

/*
Ok, wtf is this? Since makeChords accepts callback function to do the voicing and these functions are picked from live.menu as strings, there needs to be option for no voicing, hence this function.
*/
global.none = function none(scribbleClip) {
  return scribbleClip;
};

/*
Takes the 2nd and the 4th (7th) notes and transposes them an octave higher. If there is no 4th note, it transposes only the 2nd.
*/
global.Venus_Chords = function Venus_Chords(scribbleClip) {
  scribbleClip = transposeNotesInChord(scribbleClip, 1, Infinity, [2, 4], '8P');
  return scribbleClip;
};

global.Root_Note_Only = function Root_Note_Only(scribbleClip) {
  removeNotesFromChord(scribbleClip, 1, Infinity, [2, 3, 4, 5, 6, 7, 8, 9]);
  return scribbleClip;
};

global.Mediant_Note_Only = function Mediant_Note_Only(scribbleClip) {
  removeNotesFromChord(scribbleClip, 1, Infinity, [1, 3, 4, 5, 6, 7, 8, 9]);
  return scribbleClip;
};

global.Dominant_Note_Only = function Dominant_Note_Only(scribbleClip) {
  removeNotesFromChord(scribbleClip, 1, Infinity, [1, 2, 4, 5, 6, 7, 8, 9]);
  return scribbleClip;
};

global.Seventh_Note_Only = function Seventh_Note_Only(scribbleClip) {
  removeNotesFromChord(scribbleClip, 1, Infinity, [1, 2, 3, 5, 6, 7, 8, 9]);
  return scribbleClip;
};

global.Random_Note_Only = function Random_Note_Only(scribbleClip) {
  const chordPositions = [];

  scribbleClip.forEach((e, i) => {
    if (scribbleClip[i].note !== null) chordPositions.push(i);
  });

  for (let i = 0; i < chordPositions.length; i++) {
    let currentChord = scribbleClip[chordPositions[i]].note;
    let numNoteArr = diceMultiRollSortedASC(currentChord.length + 1, 1, currentChord.length - 1);
    removeNotesFromChord(scribbleClip, i + 1, 1, numNoteArr);
  }

  return scribbleClip;
};

//Transposes the root note an octave higher
global.Inversion_1 = function Inversion_1(scribbleClip) {
  scribbleClip = transposeNotesInChord(scribbleClip, 1, Infinity, [1], '8P');
  return scribbleClip;
};

//Transposes the root and the mediant note an octave higher
global.Inversion_2 = function Inversion_2(scribbleClip) {
  scribbleClip = transposeNotesInChord(scribbleClip, 1, Infinity, [1, 2], '8P');
  return scribbleClip;
};

//Transposes the root, mediant and dominant note an octave higher
global.Inversion_3 = function Inversion_3(scribbleClip) {
  scribbleClip = transposeNotesInChord(scribbleClip, 1, Infinity, [1, 2, 3], '8P');
  return scribbleClip;
};

//Removes the dominant note. Should be used with seventh chords for propper shell voicing
global.Shell_Voicing = function Shell_Voicing(scribbleClip) {
  scribbleClip = removeNotesFromChord(scribbleClip, 1, Infinity, [3]);
  return scribbleClip;
};

//Transposes the highest note an octave lower
global.Drop_1 = function Drop_1(scribbleClip) {
  let chordPos = 0;
  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [scribbleClip[i].note.length], '-8P');
      chordPos++;
    }
  }
  return scribbleClip;
};

//Transposes the second highest note an octave lower
global.Drop_2 = function Drop_2(scribbleClip) {
  let chordPos = 0;
  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [scribbleClip[i].note.length - 1], '-8P');
      chordPos++;
    }
  }
  return scribbleClip;
};

//Transposes the third highest note an octave lower
global.Drop_3 = function Drop_3(scribbleClip) {
  let chordPos = 0;
  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [scribbleClip[i].note.length - 2], '-8P');
      chordPos++;
    }
  }
  return scribbleClip;
};

//Transposes the fourth highest note an octave lower
global.Drop_4 = function Drop_4(scribbleClip) {
  let chordPos = 0;
  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [scribbleClip[i].note.length - 3], '-8P');
      chordPos++;
    }
  }
  return scribbleClip;
};

//Looks at the root note of the first chord. If any other note is in a higher octave, it transposes it an octave lower. If any other note is in a lower octave, it transposes it an octave higher.
global.Single_Octave_Chords = function Single_Octave_Chords(scribbleClip) {
  const octave = Note.octave(scribbleClip[0].note[0]);

  let chordPos = 0;
  for (let i = 0; i < scribbleClip.length; i++) {
    if (scribbleClip[i].note !== null) {
      for (let j = 0; j < scribbleClip[i].note.length; j++) {
        if (Note.octave(scribbleClip[i].note[j]) < octave) {
          scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [j + 1], '8P');
        } else if (Note.octave(scribbleClip[i].note[j]) > octave) {
          scribbleClip = transposeNotesInChord(scribbleClip, chordPos + 1, 1, [j + 1], '-8P');
        }
      }
      chordPos++;
    }
  }
  return scribbleClip;
};

//It looks at the previous chord and if there is a the same note at a different octave, it transposes the previous an octave higher or lower to the dirrection of the respective previous note.
global.Same_Notes = function Same_Notes(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);

  for (let i = 1; i < chordPositions.length; i++) {
    let currentChord = scribbleClip[chordPositions[i]].note;
    let previousChord = scribbleClip[chordPositions[i - 1]].note;
    let previousChordPitchClasses = [];
    previousChord.forEach((element) => {
      previousChordPitchClasses.push(Note.pitchClass(element));
    });

    for (let j = 0; j < currentChord.length; j++) {
      let currentNote = currentChord[j];

      if (previousChordPitchClasses.indexOf(Note.pitchClass(currentNote)) !== -1) {
        let sameNote = previousChord[previousChordPitchClasses.indexOf(Note.pitchClass(currentNote))];

        if (Note.octave(currentNote) < Note.octave(sameNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '8P');
        } else if (Note.octave(currentNote) > Note.octave(sameNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '-8P');
        }
      }
    }
  }

  return scribbleClip;
};

//It looks at the first chord of the progression and if there is any note an octave higher than the highest note of the first chord in the following chords, it transposes the note an octave lower. Visa versa with lower notes.
global.First_Chord_Trim = function First_Chord_Trim(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);

  for (let i = 1; i < chordPositions.length; i++) {
    let currentChord = scribbleClip[chordPositions[i]].note;
    let firstChord = scribbleClip[chordPositions[0]].note;
    let firstChordHighestNote = firstChord[firstChord.length - 1];
    let firstChordLowestNote = firstChord[0];

    for (let j = 0; j < currentChord.length; j++) {
      let currentNote = currentChord[j];

      if (Note.freq(currentNote) < Note.freq(firstChordLowestNote)) {
        scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '8P');
      } else if (Note.freq(currentNote) > Note.freq(firstChordHighestNote)) {
        scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '-8P');
      }
    }
  }

  return scribbleClip;
};

//It looks at the last chord of the progression and if there is any note an octave higher than the highest note of the last chord in the following chords, it transposes the note an octave lower. Visa versa with lower notes.
global.Last_Chord_Trim = function Last_Chord_Trim(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);

  for (let i = 0; i < chordPositions.length - 1; i++) {
    let currentChord = scribbleClip[chordPositions[i]].note;
    let lastChord = scribbleClip[chordPositions[chordPositions.length - 1]].note;
    let lastChordHighestNote = lastChord[lastChord.length - 1];
    let lasttChordLowestNote = lastChord[0];

    for (let j = 0; j < currentChord.length; j++) {
      let currentNote = currentChord[j];

      if (Note.freq(currentNote) < Note.freq(lasttChordLowestNote)) {
        scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '8P');
      } else if (Note.freq(currentNote) > Note.freq(lastChordHighestNote)) {
        scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '-8P');
      }
    }
  }

  return scribbleClip;
};

//The lowest note of every chord is always lower or equal to the lowest note of the chord preceeding it.
global.Descend = function Descend(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);

  function inner(scribbleClip, chordPositions) {
    for (let i = 1; i < chordPositions.length; i++) {
      let currentChordLength = scribbleClip[chordPositions[i]].note.length;
      let previousChord = scribbleClip[chordPositions[i - 1]].note;
      let previousChordFreqs = [];
      previousChord.forEach((element) => {
        previousChordFreqs.push(Note.freq(element));
      });
      let previousChordLowestNote = previousChord[indexOfSmallest(previousChordFreqs)];

      for (let j = currentChordLength - 1; j > -1; j--) {
        let currentChord = scribbleClip[chordPositions[i]].note;

        let currentChordFreqs = [];
        currentChord.forEach((element) => {
          currentChordFreqs.push(Note.freq(element));
        });
        let currentChordLowestNote = currentChord[indexOfSmallest(currentChordFreqs)];

        if (Note.freq(currentChordLowestNote) > Note.freq(previousChordLowestNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '-8P');
        } else {
          break;
        }
      }
    }
  }
  inner(scribbleClip, chordPositions);
  inner(scribbleClip, chordPositions);

  return scribbleClip;
};

//The highest note of every chord is always lower or equal to the highest note of the chord preceeding it
global.Descend_Highest = function Descend_Highest(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);

  function inner(scribbleClip, chordPositions) {
    for (let i = 1; i < chordPositions.length; i++) {
      let currentChordLength = scribbleClip[chordPositions[i]].note.length;
      let previousChord = scribbleClip[chordPositions[i - 1]].note;
      let previousChordFreqs = [];
      previousChord.forEach((element) => {
        previousChordFreqs.push(Note.freq(element));
      });
      let previousChordHighestNote = previousChord[indexOfHighest(previousChordFreqs)];

      for (let j = currentChordLength - 1; j > -1; j--) {
        let currentChord = scribbleClip[chordPositions[i]].note;

        let currentChordFreqs = [];
        currentChord.forEach((element) => {
          currentChordFreqs.push(Note.freq(element));
        });
        let currentChordHighestNote = currentChord[indexOfHighest(currentChordFreqs)];

        if (Note.freq(currentChordHighestNote) > Note.freq(previousChordHighestNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '-8P');
        } else {
          break;
        }
      }
    }
  }
  inner(scribbleClip, chordPositions);
  inner(scribbleClip, chordPositions);

  return scribbleClip;
};

//The lowest note of every chord is always higher or equal to the lowest of the chord preceeding it
global.Ascend = function Ascend(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);
  function inner(scribbleClip, chordPositions) {
    for (let i = 1; i < chordPositions.length; i++) {
      let currentChordLength = scribbleClip[chordPositions[i]].note.length;
      let previousChord = scribbleClip[chordPositions[i - 1]].note;
      let previousChordFreqs = [];
      previousChord.forEach((element) => {
        previousChordFreqs.push(Note.freq(element));
      });
      let previousChordLowestNote = previousChord[indexOfSmallest(previousChordFreqs)];

      for (let j = 0; j < currentChordLength; j++) {
        let currentChord = scribbleClip[chordPositions[i]].note;

        let currentChordFreqs = [];
        currentChord.forEach((element) => {
          currentChordFreqs.push(Note.freq(element));
        });
        let currentChordLowestNote = currentChord[indexOfSmallest(currentChordFreqs)];

        if (Note.freq(currentChordLowestNote) < Note.freq(previousChordLowestNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '8P');
        } else {
          break;
        }
      }
    }
  }
  inner(scribbleClip, chordPositions);
  inner(scribbleClip, chordPositions);

  return scribbleClip;
};

//The highest note of every chord is always higher or equal to the highest of the chord preceeding it
global.Ascend_Highest = function Ascend_Highest(scribbleClip) {
  const chordPositions = [];

  for (let i = 0; i < scribbleClip.length; i++) if (scribbleClip[i].note !== null) chordPositions.push(i);
  function inner(scribbleClip, chordPositions) {
    for (let i = 1; i < chordPositions.length; i++) {
      let currentChordLength = scribbleClip[chordPositions[i]].note.length;
      let previousChord = scribbleClip[chordPositions[i - 1]].note;
      let previousChordFreqs = [];
      previousChord.forEach((element) => {
        previousChordFreqs.push(Note.freq(element));
      });
      let previousChordHighestNote = previousChord[indexOfHighest(previousChordFreqs)];

      for (let j = 0; j < currentChordLength; j++) {
        let currentChord = scribbleClip[chordPositions[i]].note;

        let currentChordFreqs = [];
        currentChord.forEach((element) => {
          currentChordFreqs.push(Note.freq(element));
        });
        let currentChordHighestNote = currentChord[indexOfHighest(currentChordFreqs)];

        if (Note.freq(currentChordHighestNote) < Note.freq(previousChordHighestNote)) {
          scribbleClip = transposeNotesInChord(scribbleClip, i + 1, 1, [j + 1], '8P');
        } else {
          break;
        }
      }
    }
  }
  inner(scribbleClip, chordPositions);
  inner(scribbleClip, chordPositions);

  return scribbleClip;
};

module.exports = {
  augmentChordsWithBassNote2,
  openChords,
  redeclareScribbleClip,
  removeNotesFromChord,
  chopOrSplit,
  generateRhythm,
  chopNum,
  translateChordMap,
  humanToBool,
  augmentChordsWithBassNote,
  augmentChord,
  transposeNotesInChord,
  makeChords,
  absoluteToRelativeChord,
  halve,
  legato,
  displacement,
  changeLength,
  trimClip,
  transposeNotes,
  dice,
  diceBoolean,
  diceRange,
  diceMultiRollSortedASC,
  diceMultiRollSortedDSC,
  diceMultiRollUnsorted,
  replaceAt,
  generateRP,
  commonRPs8n,
  generateMelodyClip,
  chop,
  notesToArray,
  nullCleanup,
  contingency,
  fixScale,
  nullNotesDirection,
  transposeNotesDirection,
  retrograde,
  inversion,
  ommitNotes,
};

/*
const clipScribble = scribble.clip({
    notes: 'A#dim D#m G#m C1',
    pattern: 'x-x-x-x',
    subdiv: '2n'
});

/*
const chordMap =
    [
        [1, 2, 3, 4, 5, 6, 7],
        [2, 3, 4, 5, 6, 7],
        [3, 4, 5],
        [1, 2, 4, 6],
        [1, 3, 5, 6],
        [1, 4, 6],
        [1, 2, 4, 5],
        [1, 4, 6],
    ]

console.log(makeChords("C", "major", false, "A#dim", true, "x-xx", "4n", 0, chordMap, "sin","none", 0, "Venus_Chords", 3, 1, "split", 0)[0])
//for (i = 0; i < 30; i++)console.log(makeChords("C", "major", true, "R R R R R", false, "xx", "4n", 0, chordMap, "sin", "none", 0, "Venus_Chords", 1, 0, "split", 0)[1])
*/

makeChords({
  chordMap: [
    0, 0, 1, 1, 0, 1, 2, 0, 1, 3, 0, 1, 4, 0, 1, 5, 0, 1, 6, 0, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 3, 1, 1, 4, 1, 1, 5, 1, 1,
    6, 1, 1, 0, 2, 0, 1, 2, 0, 2, 2, 1, 3, 2, 1, 4, 2, 1, 5, 2, 0, 6, 2, 0, 0, 3, 1, 1, 3, 1, 2, 3, 0, 3, 3, 1, 4, 3, 0,
    5, 3, 1, 6, 3, 0, 0, 4, 1, 1, 4, 0, 2, 4, 1, 3, 4, 0, 4, 4, 1, 5, 4, 1, 6, 4, 0, 0, 5, 1, 1, 5, 0, 2, 5, 0, 3, 5, 1,
    4, 5, 0, 5, 5, 1, 6, 5, 0, 0, 6, 1, 1, 6, 1, 2, 6, 0, 3, 6, 1, 4, 6, 1, 5, 6, 0, 6, 6, 0, 0, 7, 1, 1, 7, 0, 2, 7, 0,
    3, 7, 1, 4, 7, 0, 5, 7, 1, 6, 7, 0,
  ],
  bassNote: 0,
  open: 0,
  randomAssist: 1,
  repeatChords: 1,
  seventh: 1,
  splitChop: 0,
  RN: 'E',
  mode: 'Dorian',
  octave: 3,
  sizzle: 'sin',
  advChords: 'none',
  voicing: 'none',
  subdiv: '4n',
  splitter: 0,
  chordPatterns: ['R', 'R', 'R', 'R'],
  patterns: 'xxxx',
  pattern: 'xxxx',
  chords: ['R', 'R', 'R', 'R'],
});
