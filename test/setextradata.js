"use strict";

var virtualbox = require('../lib/virtualbox'),
    args = process.argv.slice(2);

virtualbox.extradata.set({vm: args[0], key: args[1], value: args[2]}, function(error, value){
  if(error) {
    throw error;
  }

  console.log('Set Virtual Machine "%s" extra "%s" value to "%s"', args[0], args[1], args[2]);
});