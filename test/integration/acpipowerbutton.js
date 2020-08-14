'use strict';

const virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.acpipowerbutton(vmName, function (error) {
  if (error) {
    throw error;
  }
});
