var virtualbox = require('../lib/virtualbox'),
    args       = process.argv.slice(2),
    vm         = args[0],
    user       = args[1],
    pass       = args[2],
    path       = "C:\\Program Files\\Internet Explorer\\iexplore.exe";


virtualbox.start(vm, function(){

  virtualbox.exec({ 'vm': vm, 'user': user, 'passwd': pass, 'path': path, 'params': [args[1] || 'google.com'] }, function(error){
    if(error) throw error;
  });

});
