'use strict';

var util = require('util');
var virtualbox = require('../../lib/virtualbox');

virtualbox.list(function (list_data, error) {
  if (error) {
    throw error;
  }

  if (list_data) {
    virtualbox._logging.log(util.inspect(list_data));
    //logger.log(list_data);
  }
});
