'use strict';

const virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.start(vmName, function (error) {
  if (error) {
    throw error;
  }
});
