var virtualbox = require('../lib/virtualbox'),
    args       = process.argv.slice(2),
    vm         = args[0],
    path       = "C:\\Program Files\\Internet Explorer\\iexplore.exe";


virtualbox.start(vm, function(){

  virtualbox.exec({ 'vm': vm, 'path': path, 'params': [args[1] || 'google.com'] }, function(error){
    if(error) throw error;
  });

});
