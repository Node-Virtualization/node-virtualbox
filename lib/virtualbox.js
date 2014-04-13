"use strict";

var exec = require('child_process').exec,
  platform = require('os').platform,
  logging = require('./logging');
//  undefined = function (){}();

var vBoxManageBinary;

// Host operating system
if (/^win/.test(platform)) {

  // Path may not contain VBoxManage.exe but it provides this environment variable
  vBoxManageBinary = '"' + process.env.VBOX_INSTALL_PATH + '\\VBoxManage.exe' + '" ';

} else if (/^darwin/.test(platform) || /^linux/.test(platform)) {

  // Mac OS X and most Linux use the same binary name, in the path
  vBoxManageBinary = 'vboxmanage ';

} else {

  // Otherwise (e.g., SunOS) hope it's in the path
  vBoxManageBinary = 'vboxmanage ';

}

function command(cmd, callback) {
  exec(cmd, function (err, stdout, stderr) {

    if (!err && stderr && cmd.indexOf("pause") !== -1 && cmd.indexOf("savestate") !== -1) {
      err = new Error(stderr);
    }

    callback(err, stdout);
  });
}

function vboxcontrol(cmd, callback) {
  command('VBoxControl ' + cmd, callback);
}

function vboxmanage(cmd, callback) {
  command(vBoxManageBinary + cmd, callback);
}

function pause(vmname, callback) {
  logging.info('Pausing VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" pause', function (error, stdout) {
    callback(error);
  });
}

function list(callback) {
  logging.info('Listing VMs');
  vboxmanage('list "runningvms"', function (error, stdout) {
    var _list = {};
    var _runningvms = parse_listdata(stdout);
    vboxmanage('list "vms"', function (error, full_stdout) {
      var _all = parse_listdata(full_stdout);
      var _keys = Object.keys(_all);
      for (var _i = 0; _i < _keys.length; _i += 1) {
        var _key = _keys[_i];
        if (_runningvms[_key]) {
          _all[_key].running = true;
        } else {
          _all[_key].running = false;
        }
      }
      callback(_all, error);
    });
  });
}

function parse_listdata(raw_data) {
  var _raw = raw_data.split('\n');
  var _data = {};
  if (_raw.length > 0) {
    for (var _i = 0; _i < _raw.length; _i += 1) {
      var _line = _raw[_i];
      if (_line === '') {
        continue;
      }
      // "centos6" {64ec13bb-5889-4352-aee9-0f1c2a17923d}
      var rePattern = new RegExp(/^\"(.+)\" \{(.+)\}$/);
      var arrMatches = _line.match(rePattern);
      // {'64ec13bb-5889-4352-aee9-0f1c2a17923d': 'centos6'}
      if (arrMatches.length === 3) {
        _data[arrMatches[2].toString()] = {name: arrMatches[1].toString()};
      }
    }
  }
  return _data;
}

function reset(vmname, callback) {
  logging.info('Resetting VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" reset', function (error, stdout) {
    callback(error);
  });
}

function resume(vmname, callback) {
  logging.info('Resuming VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" resume', function (error, stdout) {
    callback(error);
  });
}

function start(vmname, callback) {
  logging.info('Starting VM "%s"', vmname);
  vboxmanage('-nologo startvm "' + vmname + '" --type headless', function (error, stdout) {

    if (error && /VBOX_E_INVALID_OBJECT_STATE/.test(error.message)) {
      error = undefined;
    }

    callback(error);
  });
}

function stop(vmname, callback) {
  logging.info('Stopping VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" savestate', function (error, stdout) {
    callback(error);
  });
}

function savestate(vmname, callback) {
  logging.info('Saving State (alias to stop) VM "%s"', vmname);
  stop(vmname, callback);
}

function poweroff(vmname, callback) {
  logging.info('Powering off VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" poweroff', function (error, stdout) {
    callback(error);
  });
}

function acpipowerbutton(vmname, callback) {
  logging.info('ACPI power button VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" acpipowerbutton', function (error, stdout) {
    callback(error);
  });
}

function acpisleepbutton(vmname, callback) {
  logging.info('ACPI sleep button VM "%s"', vmname);
  vboxmanage('controlvm "' + vmname + '" acpisleepbutton', function (error, stdout) {
    callback(error);
  });
}

function vmExec(options, callback) {
  var vm = options.vm || options.name || options.vmname || options.title,
    username = options.user || options.username || 'Guest',
    password = options.pass || options.passwd || options.password,
    path = options.path || options.cmd || options.command || options.exec || options.execute || options.run,
    ostype = guestproperty.os(vm),
    cmd,
    params = options.params || options.parameters || options.args;

  if (Array.isArray(params)) {
    params = params.join(" ");
  }

  if (params === undefined) {
    params = "";
  }

  if (ostype === "windows") {
    path = path.replace(/\\/g, '\\\\');
    cmd = 'guestcontrol ' + vm + ' execute  --image "cmd.exe" --username ' + username + ( password ? ' --password ' + password : '' ) + ' -- "/c" "' + path + '" "' + params + '"';
  } else if (ostype === "mac") {
    cmd = 'guestcontrol ' + vm + ' execute  --image "/usr/bin/open -a" --username ' + username + ( password ? ' --password ' + password : '' ) + ' -- "/c" "' + path + '" "' + params + '"';
  } else {
    cmd = 'guestcontrol ' + vm + ' execute  --image "/bin/sh" --username ' + username + ( password ? ' --password ' + password : '' ) + ' -- "/c" "' + path + '" "' + params + '"';
  }

  logging.info('Executing command "vboxmanage %s" on VM "%s" detected OS type "%s"', cmd, vm, ostype);

  vboxmanage(cmd, function (error, stdout) {
    callback(error);
  });
}

var guestproperty = {
  get: function (options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    if (this.os(vm) === "linux") {
      vboxcontrol('guestproperty get ' + key, function (error, stdout) {
        if (error) {
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

  os: function (vmname, callback) {
    var ostype = null;

    try {
      exec(vBoxManageBinary + 'showvminfo -machinereadable "' + vmname + '"', function (error, stdout, stderr) {
        if (!error) {

          // The ostype is matched against the ID attribute of 'vboxmanage list ostypes'
          if (stdout.indexOf('ostype="Windows') !== -1) {
            ostype = "windows";
          } else if (stdout.indexOf('ostype="MacOS') !== -1) {
            ostype = "mac";
          } else {
            ostype = "linux";
          }
        } else {
          ostype = false;

        }
      });

      callback(ostype);

    } catch (e) {
      logging.info('Could not showvminfo for %s', vmname);
    }
  }
};

module.exports = {
  'exec': vmExec,
  'list': list,
  'pause': pause,
  'reset': reset,
  'resume': resume,
  'start': start,
  'stop': stop,
  'savestate': savestate,
  'poweroff': poweroff,
  'acpisleepbutton': acpisleepbutton,
  'acpipowerbutton': acpipowerbutton,
  'guestproperty': guestproperty
};
