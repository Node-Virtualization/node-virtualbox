'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.export(vmName, 'test-export', function (error) {
  if (error) {
    throw error;
  }
});
