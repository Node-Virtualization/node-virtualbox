'use strict';

const virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.pause(vmName, function (error) {
  if (error) {
    throw error;
  }
});
