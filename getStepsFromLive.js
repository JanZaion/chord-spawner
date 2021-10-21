function clipOrSlot() {
  var clipToSelect = new LiveAPI('live_set view detail_clip');
  if (clipToSelect) {
    return clipToSelect;
  } else {
    return new LiveAPI('live_set view highlighted_clip_slot clip');
  }
}

function liveEleven(clip) {
  var end_time = clip.get('end_time');
  var content = clip.call('get_notes_extended', 1, 127, 0, end_time);
  var notes = content.toString();

  return notes;
}

function liveTen(clip) {
  var end_time = clip.get('end_time');
  var content = clip.call('get_notes', 0, 1, end_time, 127);
  var notesArr = [];
  var repeats = content[1] * 5;

  for (var i = 2; i < repeats + 1; i = i + 6) {
    notesArr.push({
      pitch: content[i + 1],
      start_time: content[i + 2],
      duration: content[i + 3],
      velocity: content[i + 4],
    });
  }

  var notes = JSON.stringify({ notes: notesArr });

  return notes;
}

function getLive(dictName) {
  var clip = clipOrSlot();
  var live = new LiveAPI('live_app');

  if (live.call('get_major_version') === 10) {
    var notes = liveTen(clip);
  } else {
    var notes = liveEleven(clip);
  }

  var dict = new Dict(dictName);
  dict.clear();
  dict.parse(notes);

  var totalDuration = clip.get('loop_end');
  dict.set('totalDuration', totalDuration);

  outlet(0, 'bang');
}
