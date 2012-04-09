var exec = require('child_process').exec,
    logging = require('./logging'),
    undefined = function(){}();

var isLinux = (process.platform == 'linux');

function command(cmd, callback) {
  exec(cmd, function(err, stdout, stderr){
    !err && stderr && ( err = new Error(stderr) );
    
    callback(err, stdout);

  });
}

function vboxcontrol(cmd, callback) {
  command('VBoxControl '+cmd, callback);
}

function vboxmanage(cmd, callback){
  command('vboxmanage '+cmd, callback);
}

function pause(vmname, callback){
  logging.info('Pausing VM "%s"', vmname);
  vboxmanage('controlvm "'+vmname+'" pause', function(error, stdout){
    callback(error);
  });
}

function reset(vmname, callback){
  logging.info('Resetting VM "%s"', vmname);
  vboxmanage('controlvm "'+vmname+'" reset', function(error, stdout){
    callback(error);
  });
}

function resume(vmname, callback){
  logging.info('Resuming VM "%s"', vmname);
  vboxmanage('controlvm "'+vmname+'" resume', function(error, stdout){
    callback(error);
  });
}

function start(vmname, callback){
  logging.info('Starting VM "%s"', vmname);
  vboxmanage('-nologo startvm "'+vmname+'" --type headless', function(error, stdout){

    if(error && /VBOX_E_INVALID_OBJECT_STATE/.test(error.message)){
      error = undefined;
    }
    
    callback(error);
  });
}

function stop(vmname, callback){
  logging.info('Stopping VM "%s"', vmname);
  vboxmanage('controlvm "'+vmname+'" savestate', function(error, stdout){
    callback(error);
  });
}

function vmExec(options, callback){
  var vm = options.vm || options.name || options.vmname || options.title,
      username = options.user || options.username || 'Guest',
      password = options.pass || options.passwd || options.password,
      path = options.path || options.cmd || options.command || options.exec || options.execute || options.run,
      params = options.params || options.parameters || options.args;

  Array.isArray(params) && ( params = params.join(" ") );

  params == undefined && ( params = "" );

  path = path.replace(/\\/g, '\\\\');

  var cmd = 'guestcontrol '+vm+' execute  --image "cmd.exe" --username ' + username + ( password ? ' --password ' + password : '' ) + ' -- "/c" "'+path+'" "'+params+'"';

  logging.info('Executing command "vboxmanage %s" on VM "%s"', cmd, vm);

  vboxmanage(cmd, function(error, stdout){
    callback(error);
  });
}

var guestproperty = {
  get: function(options, callback){
    var vm = options.vm || options.name || options.vmname || options.title,
        key = options.key,
        value = options.defaultValue || options.value;

    if(isLinux){
      vboxcontrol('guestproperty get '+key, function(error, stdout){
        if(error){
          //returning default value
          callback(value);
          return;
        }

        var tmp = stdout.split("\n")[4];
        callback(tmp.substring(7, tmp.length));
      });
    } else {
      //windows support to be implemented
      callback(value);
    }
  },
}

module.exports = {
  'exec': vmExec,
  'pause': pause,
  'reset': reset,
  'resume': resume,
  'start': start,
  'stop': stop,
  'guestproperty': guestproperty
};
