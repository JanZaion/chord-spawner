function splitterToggles(num) {
  var menuOptions = [8, 8, 8, 8, 6, 5, 4, 3, 2, 1];
  var picked = menuOptions[num];
  var patch = this.patcher;
  var splitter = patch.getnamed('splitter');

  splitter.clear();
  for (var i = 0; i < picked; i++) splitter.append(i);

  outlet(0, 'bang');
}
