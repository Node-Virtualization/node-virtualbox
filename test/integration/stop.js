'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.stop(vmName, function (error) {
  if (error) {
    throw error;
  }
});
