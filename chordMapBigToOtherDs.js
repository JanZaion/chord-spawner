function chordMapBigToOtherDicts() {
  var chordMapBigDict = new Dict('chordMapBigD');
  var chordMapDict = new Dict('chordMapD');
  var main = new Dict('main');
  var chordMap = [];
  var keys = chordMapBigDict.getkeys();

  for (var i = 0; i < keys.length; i++) {
    var matrixPosition = chordMapBigDict.get(keys[i]);

    for (var j = 0; j < matrixPosition.length; j++) {
      chordMap.push(matrixPosition[j]);
    }
  }

  chordMapDict.set('chordMap', chordMap);
  main.set('chordMap', chordMap);
}
