'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.poweroff(vmName, function (error) {
  if (error) {
    throw error;
  }
});
