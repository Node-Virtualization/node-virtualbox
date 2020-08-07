'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.extradata.get({ vm: args[0], key: args[1] }, function (
  error,
  value
) {
  if (error) {
    throw error;
  }

  console.log(
    'Virtual Machine "%s" extra "%s" value is "%s"',
    args[0],
    args[1],
    value
  );
});
