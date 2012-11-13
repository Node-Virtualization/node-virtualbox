var util = require('util');
var virtualbox = require('../lib/virtualbox'),
    args = process.argv.slice(2);

virtualbox.list(args[0] || 'vms', function(list_data, error){
  if(error) throw error;
  if(list_data) {
    console.log(util.inspect(list_data));
    //console.log(list_data);
  }
});
