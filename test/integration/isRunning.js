"use strict";

var virtualbox = require("../../lib/virtualbox"),
  { logger } = require("../helpers/logger"),
  vm = "node-virtualbox-test-machine";

virtualbox.isRunning(vm, function (error, isRunning) {
  if (error) {
    throw error;
  }
  if (isRunning) {
    logger.log('Virtual Machine "%s" is Running', vm);
  } else {
    logger.log('Virtual Machine "%s" is Poweroff', vm);
  }
});
