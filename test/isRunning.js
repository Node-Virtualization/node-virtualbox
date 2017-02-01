"use strict";

var virtualbox = require('../lib/virtualbox'),
    vm = process.argv[2];

virtualbox.isRunning(vm, (error, isRunning) => {
  if (error) throw error;
  if (isRunning) {
    console.log('Virtual Machine "%s" is Running', vm);
  } else {
    console.log('Virtual Machine "%s" is Poweroff', vm);
  }
});
