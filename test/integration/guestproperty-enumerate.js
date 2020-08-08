'use strict';

const virtualbox = require('../../lib/virtualbox'),
  vm = 'node-virtualbox-test-machine';

virtualbox.guestproperty.enumerate(vm, (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(error, stdout, stderr);
  console.log(stdout);
});
