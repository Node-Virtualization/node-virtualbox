"use strict";

const virtualbox = require("../../lib/virtualbox"),
  vm = "node-virtualbox-test-machine",
  user = "vagrant",
  pass = "vagrant",
  { logger } = require("../helpers/logger"),
  ostype = virtualbox.guestproperty.os(vm);
let path;

if (ostype === "windows") {
  path = "C:\\Program Files\\Internet Explorer\\iexplore.exe";
} else if (ostype === "mac") {
  path = "Safari.app";
} else {
  path = "ping";
}

virtualbox.start(vm, function () {
  virtualbox.exec(
    {
      vm: vm,
      user: user,
      passwd: pass,
      path: path,
      params: ["http://google.com"],
    },
    function (error, stdout) {
      if (error) {
        throw error;
      }
      logger.debug(stdout);
    }
  );
});
