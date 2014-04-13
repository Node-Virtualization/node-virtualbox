"use strict";

var virtualbox = require('../lib/virtualbox'),
    args       = process.argv.slice(2),
    vm         = args[0],
    user       = args[1],
    pass       = args[2],
    ostype     = virtualbox.guestproperty.os(vm),
    path;

if (ostype === "windows") {
  path = "C:\\Program Files\\Internet Explorer\\iexplore.exe";
} else if (ostype === "mac") {
  path = "Safari.app";
} else {
  path = "whoami";
}

virtualbox.start(vm, function(){
  virtualbox.exec({ 'vm': vm, 'user': user, 'passwd': pass, 'path': path, 'params': [args[1] || 'http://google.com'] }, function(error){
    if(error) {
      throw error;
    }
  });
});
