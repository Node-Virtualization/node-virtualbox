'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.export(args[0], args[1], function (error) {
  if (error) {
    throw error;
  }
});
