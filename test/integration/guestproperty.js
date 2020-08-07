'use strict';

const virtualbox = require('../../lib/virtualbox'),
  options = {
    vm: 'node-virtualbox-test-machine',
    key: '/VirtualBox/GuestInfo/Net/0/V4/IP',
  };

virtualbox.guestproperty.get(options, (error, stdout, _) => {
  if (error) {
    throw error;
  }
  console.log(error, stdout, _);
  console.log(stdout);
});
