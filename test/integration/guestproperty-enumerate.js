"use strict";

const virtualbox = require("../../lib/virtualbox"),
  { logger } = require("../helpers/logger"),
  vm = "node-virtualbox-test-machine";

virtualbox.guestproperty.enumerate(vm, (err, arr) => {
  logger.debug(arr);
});
