'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vm = 'node-virtualbox-test-machine',
  uuid = '44f96692-854f-4358-b246-d455bc403e16';

virtualbox.snapshotDelete(vm, uuid, function (error) {
  if (error) {
    throw error;
  }
});
