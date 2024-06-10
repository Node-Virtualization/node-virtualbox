'use strict';

var virtualbox = require('../../lib/virtualbox'),
  vm = 'node-virtualbox-test-machine';

virtualbox.snapshotList(vm, function (
  error,
  snapshotList,
  currentSnapshotUUID
) {
  if (error) {
    throw error;
  }

  if (snapshotList) {
    logger.log(
      JSON.stringify(snapshotList),
      JSON.stringify(currentSnapshotUUID)
    );
  }
});
