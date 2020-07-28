'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vm = process.argv[2],
  name = process.argv[3];

virtualbox.snapshotTake(vm, name, function (error, uuid) {
  if (error) {
    throw error;
  }
  if (uuid) {
    console.log('UUID: ' + uuid);
  }
});
