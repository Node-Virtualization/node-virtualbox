"use strict";

var virtualbox = require('../lib/virtualbox'),
    // vm = process.argv[2],
    // uuid = process.argv[3];
    vm = 'hola',
    uuid = 'test';

virtualbox.snapshotRestore(vm, uuid, (error) => {
  if (error) throw error;
  console.log("Virtual machine has been restored");
})