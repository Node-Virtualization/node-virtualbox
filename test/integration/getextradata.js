"use strict";

var virtualbox = require("../../lib/virtualbox"),
  vmname = "node-virtualbox-test-machine",
  { logger } = require("../helpers/logger"),
  key = "some-data-key";

virtualbox.extradata.get({ vmname, key }, function (error, value) {
  if (error) {
    throw error;
  }

  logger.debug(
    'Virtual Machine "%s" extra "%s" value is "%s"',
    vmname,
    key,
    value
  );
});
