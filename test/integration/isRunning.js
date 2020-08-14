'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vm = 'node-virtualbox-test-machine';

virtualbox.isRunning(vm, function (error, isRunning) {
  if (error) {
    throw error;
  }
  if (isRunning) {
    console.log('Virtual Machine "%s" is Running', vm);
  } else {
    console.log('Virtual Machine "%s" is Poweroff', vm);
  }
});
