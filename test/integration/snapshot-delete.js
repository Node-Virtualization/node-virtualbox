'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vm = process.argv[2],
  uuid = process.argv[3];

virtualbox.snapshotDelete(vm, uuid, function (error) {
  if (error) {
    throw error;
  }
});
