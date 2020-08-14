'use strict';

const virtualbox = require('../../lib/virtualbox'),
  vm = 'node-virtualbox-test-machine';

virtualbox.guestproperty.enumerate(vm, (err, arr) => {
  console.log(arr);
});
