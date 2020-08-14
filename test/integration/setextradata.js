'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vmname = 'node-virtualbox-test-machine',
  key = 'some_value',
  value = 'kind of value';

virtualbox.extradata.set({ vmname, key, value }, function (error, result) {
  if (error) {
    throw error;
  }

  console.log(
    'Set Virtual Machine "%s" extra "%s" value to "%s"; result is "%s"',
    vmname,
    key,
    value,
    result
  );
});
