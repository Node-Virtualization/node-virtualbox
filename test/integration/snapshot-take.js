'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmname = 'node-virtualbox-test-machine',
  exportName = 'test-export';

virtualbox.snapshotTake(vmname, exportName, function (error, uuid) {
  if (error) {
    throw error;
  }
  if (uuid) {
    console.log('UUID: ' + uuid);
  }
});
