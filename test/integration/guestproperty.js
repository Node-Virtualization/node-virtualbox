"use strict";

const virtualbox = require("../../lib/virtualbox"),
  { logger } = require("../helpers/logger"),
  options = {
    vm: "node-virtualbox-test-machine",
    key: "/VirtualBox/GuestInfo/Net/0/V4/IP",
  };

virtualbox.guestproperty.get(options, (error, stdout, _) => {
  if (error) {
    throw error;
  }
  logger.debug(error, stdout, _);
  logger.debug(stdout);
});
