'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.modify(vmName, { memory: 64 }, function (error) {
  if (error) {
    throw error;
  }
});
