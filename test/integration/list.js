'use strict';

var util = require('util');
var virtualbox = require('../../lib/virtualbox'),
  vmName = 'node-virtualbox-test-machine';

virtualbox.list(function (list_data, error) {
  if (error) {
    throw error;
  }

  if (list_data) {
    logger.log(util.inspect(list_data));
    //logger.log(list_data);
  }
});
