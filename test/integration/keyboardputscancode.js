'use strict';

var virtualbox = require('../../lib/virtualbox'),
  async = require('async'),
  args = process.argv.slice(2),
  vm = 'node-virtualbox-test-machine',
  key = args.length > 1 && args[1],
  delay = 250,
  sequence;

var SCAN_CODES = virtualbox.SCAN_CODES;

var fns = [];

/**
 *
 * Uncomment the following if you want to
 * test a particular key down/up (make/break)
 * sequence.
 *
 **/

// SHIFT + A Sequence
sequence = [
  { key: 'SHIFT', type: 'make', code: SCAN_CODES['SHIFT'] },
  { key: 'A', type: 'make', code: SCAN_CODES['A'] },
  { key: 'SHIFT', type: 'break', code: SCAN_CODES.getBreakCode('SHIFT') },
  { key: 'A', type: 'break', code: SCAN_CODES.getBreakCode('A') },
];

function onResponse(err) {
  if (err) {
    throw err;
  }
}

function generateFunc(key, type, code) {
  return function (cb) {
    setTimeout(function () {
      console.info('Sending %s %s code', key, type);
      virtualbox.keyboardputscancode(vm, code, function (err) {
        onResponse(err);
        cb();
      });
    }, delay);
  };
}

function addKeyFuncs(key) {
  var makeCode = SCAN_CODES[key];
  var breakCode = SCAN_CODES.getBreakCode(key);

  if (makeCode && makeCode.length) {
    fns.push(generateFunc(key, 'make', makeCode));

    if (breakCode && breakCode.length) {
      fns.push(generateFunc(key, 'break', breakCode));
    }
  }
}

if (sequence) {
  fns = sequence.map(function (s) {
    return generateFunc(s.key, s.type, s.code);
  });
} else if (key) {
  addKeyFuncs(key);
} else {
  for (var key in SCAN_CODES) {
    if (key === 'getBreakCode') {
      continue;
    }
    addKeyFuncs(key);
  }
}

async.series(fns, function () {
  console.info('Keyboard Put Scan Code Test Complete');
});
