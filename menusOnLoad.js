/*
This script modifies all named objects in a patch based on values from a dictionary. Dictionary keys must correspond to object names, ie dict key "note" changes the value of object named "note"
*/
function changeMenus(dictName) {
  var patch = this.patcher;
  var d = new Dict(dictName);
  var keys = d.getkeys();
  var objToList = patch.firstobject;
  var objects = [];

  while (objToList !== null) {
    //we get list of all the named objects
    objects.push(objToList.varname);
    var objToList = objToList.nextobject;
  }

  for (var i = 0; i < keys.length; i++) {
    //We cycle through the array of keys from the dictionary. If there is an object with the same name as a key from the dict, we change the object's value
    objects.indexOf(keys[i]) !== -1 ? (obj = patch.getnamed(keys[i])) : (obj = 'none');

    if (obj.maxclass === 'live.menu' || (obj.maxclass === 'umenu' && obj.varname.indexOf('Int') === -1)) {
      //Different objects need different methods to change their values, ie live.menu neets .setsymbol, textedit needs .set
      obj.setsymbol(d.get(keys[i]));
    } else if (obj.maxclass === 'umenu' && obj.varname.indexOf('Int') !== -1) {
      //Sometimes menu items need to be named differently from loaded items, like when there need to be spaces in menu items. We use the .int method and reflect it in menus name by appending it with Int
      obj.int(d.get(keys[i]));
    } else if (
      obj.maxclass === 'textedit' ||
      obj.maxclass === 'led' ||
      obj.maxclass === 'live.text' ||
      obj.maxclass === 'live.tab'
    ) {
      obj.set(d.get(keys[i]));
    }
  }

  outlet(0, 'bang');
}
