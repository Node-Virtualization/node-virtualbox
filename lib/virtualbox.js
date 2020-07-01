"use strict";

// @todo use a promise library instead of so many callbacks

const execFile = require('child_process').execFile,
  host_platform = process.platform,
  logging = require('./logging'),
   known_OS_types = {
    WINDOWS: 'windows',
    MAC: 'mac',
    LINUX: 'linux'
  };

let vBoxManageBinary,
  vbox_version;

// Host operating system
if (/^win/.test(host_platform)) {

  // Path may not contain VBoxManage.exe but it provides this environment variable
  var vBoxInstallPath = process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH;
  vBoxManageBinary = '"' + vBoxInstallPath + '\\VBoxManage.exe' + '" ';

} else if (/^darwin/.test(host_platform) || /^linux/.test(host_platform)) {

  // Mac OS X and most Linux use the same binary name, in the path
  vBoxManageBinary = 'vboxmanage ';

} else {

  // Otherwise (e.g., SunOS) hope it's in the path
  vBoxManageBinary = 'vboxmanage ';

}

const  allowedBinaries = ["VBoxControl", vBoxManageBinary];


execFile(vBoxManageBinary, ["--version"], function(error, stdout, stderr) {
  // e.g., "4.3.38r106717" or "5.0.20r106931"
  vbox_version = stdout.split(".")[0];
  logging.info("Virtualbox version detected as %s", vbox_version);
});

function command(bin, cmd, callback) {
  if(!allowedBinaries.includes(bin)) {
    throw new Error("Not an allowed binary");
  }

  execFile(bin, cmd, function(err, stdout, stderr) {

    if (!err && stderr && cmd.indexOf("pause") !== -1 && cmd.indexOf("savestate") !== -1) {
      err = new Error(stderr);
    }

    callback(err, stdout);
  });
}

function vboxcontrol(cmd, callback) {
  command("VBoxControl", cmd, callback);
}

function vboxmanage(cmd, callback) {
  command(vBoxManageBinary, cmd, callback);
}

function pause(vmname, callback) {
  logging.info('Pausing VM "%s"', vmname);
  vboxmanage(["controlvm", vmname, "pause"], function(error, stdout) {
    callback(error);
  });
}

function list(callback) {
  logging.info('Listing VMs');
  vboxmanage(['list', 'runningvms'], function(error, stdout) {
    var _list = {};
    var _runningvms = parse_listdata(stdout);
    vboxmanage(["list", "vms"], function(error, fullStdout) {
      var _all = parse_listdata(fullStdout);
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
  var _raw = raw_data.split(/\r?\n/g);
  var _data = {};
  if (_raw.length > 0) {
    for (var _i = 0; _i < _raw.length; _i += 1) {
      var _line = _raw[_i];
      if (_line === '') {
        continue;
      }
      // "centos6" {64ec13bb-5889-4352-aee9-0f1c2a17923d}
      var rePattern = /^"(.+)" \{(.+)\}$/;
      var arrMatches = _line.match(rePattern);
      // {'64ec13bb-5889-4352-aee9-0f1c2a17923d': 'centos6'}
      if (arrMatches && arrMatches.length === 3) {
        _data[arrMatches[2].toString()] = {
          name: arrMatches[1].toString()
        };
      }
    }
  }
  return _data;
}

function reset(vmname, callback) {
  logging.info('Resetting VM "%s"', vmname);
  vboxmanage(["controlvm", vmname, "reset"], function(error, stdout) {
    callback(error);
  });
}

function resume(vmname, callback) {
  logging.info('Resuming VM "%s"', vmname);
  vboxmanage(["controlvm", vmname, "resume"], function(error, stdout) {
    callback(error);
  });
}

function start(vmname, useGui, callback) {
  if ((typeof useGui) === 'function') {
    callback = useGui;
    useGui = false;
  }
  var vmType = (useGui ? "gui" : "headless");

  logging.info('Starting VM "%s" with options: ', vmname, vmType);

  vboxmanage(["-nologo", "startvm", vmname, "--type", vmType], function(error, stdout) {
    if (error && /VBOX_E_INVALID_OBJECT_STATE/.test(error.message)) {
      error = undefined;
    }
    callback(error);
  });
}

function stop(vmname, callback) {
  logging.info('Stopping VM "%s"', vmname);
  vboxmanage(["controlvm", vmname, "savestate"], function(error, stdout) {
    callback(error);
  });
}

function savestate(vmname, callback) {
  logging.info('Saving State (alias to stop) VM "%s"', vmname);
  stop(vmname, callback);
}

function vmExport(vmname, output, callback) {
  logging.info('Exporting VM "%s"', vmname);
  vboxmanage(['export', vmname, '--output', output], function(error, stdout) {
    callback(error);
  });
}

function poweroff(vmname, callback) {
  logging.info('Powering off VM "%s"', vmname);
  vboxmanage(['controlvm', vmname, 'poweroff'], function(error, stdout) {
    callback(error);
  });
}

function acpipowerbutton(vmname, callback) {
  logging.info('ACPI power button VM "%s"', vmname);
  vboxmanage(['controlvm', vmname, 'acpipowerbutton'], function(error, stdout) {
    callback(error);
  });
}

function acpisleepbutton(vmname, callback) {
  logging.info('ACPI sleep button VM "%s"', vmname);
  vboxmanage(['controlvm', vmname, 'acpisleepbutton'], function(error, stdout) {
    callback(error);
  });
}

function modify(vname, properties, callback) {
  logging.info('Modifying VM %s', vname);
  var args = [vname];

  for (var property in properties) {
    if (properties.hasOwnProperty(property)) {
      var value = properties[property];
      args.push('--' + property);

      if (Array.isArray(value)) {
        Array.prototype.push.apply(args, value);
      }
      else {
        args.push(value.toString());
      }
    }
  }

  vboxmanage(['modifyvm', ...args], function (error, stdout) {
    callback(error);
  });
}

function snapshotList(vmname, callback) {
  logging.info('Listing snapshots for VM "%s"', vmname);
  vboxmanage(['snapshot', vmname, 'list', '--machinereadable'], function(error, stdout) {

    if (error) {
      callback(error);
      return;
    }

    var s;
    var snapshots = [];
    var currentSnapshot;
    var lines = (stdout || '').split(require('os').EOL);

    lines.forEach(function(line) {
      line.trim().replace(/^(CurrentSnapshotUUID|SnapshotName|SnapshotUUID).*\="(.*)"$/, function(l, k, v) {
        if (k === 'CurrentSnapshotUUID') {
          currentSnapshot = v;
        }
        else if (k === 'SnapshotName') {
          s = {
            'name': v
          };
          snapshots.push(s);
        }
        else {
          s.uuid = v;
        }
      });
    });

    callback(null, snapshots, currentSnapshot);
  });
}

function snapshotTake(vmname, name, /*optional*/ description, /*optional*/ live, callback) {
  logging.info('Taking snapshot for VM "%s"', vmname);

  if(typeof description === 'function') {
    callback = description;
    description = undefined;
  }
  else if(typeof live === 'function') {
    callback = live;
    live = false;
  }

  var cmd = ['snapshot', vmname, 'take', name];

  if(description) {
    cmd.push('--description');
    cmd.push(description);
  }

  if(live === true) {
    cmd.push('--live');
  }

  vboxmanage(cmd, function(error, stdout) {
    var uuid;
    stdout.trim().replace(/UUID\: ([a-f0-9\-]+)$/, function(l, u) {
      uuid = u;
    });
    callback(error, uuid);
  });
}

function snapshotDelete(vmname, uuid, callback) {
  logging.info('Deleting snapshot "%s" for VM "%s"', uuid, vmname);
  vboxmanage(['snapshot', vmname, 'delete', uuid], callback);
}

function snapshotRestore(vmname, uuid, callback) {
  logging.info('Restoring snapshot "%s" for VM "%s"', uuid, vmname);
  vboxmanage(['snapshot', vmname, 'restore', uuid], callback);
}

function clone(vmname, clonevmname, /*optional*/ snapshot, callback) {
  logging.info('Cloning machine "%s" to "%s"', vmname, clonevmname);
  var cmd = ['clonevm', vmname, '--name', clonevmname, "--register"];
  if(typeof snapshot === 'function') {
    callback = snapshot;
    snapshot = undefined;
  }else{
    cmd.push("--options");
    cmd.push("link");
    cmd.push("--snapshot");
    cmd.push(snapshot);
  }
  vboxmanage(cmd, callback);
}

function isRunning(vmname, callback) {
  vboxmanage(['list', 'runningvms'], function (error, stdout) {
    logging.info('Checking virtual machine "%s" is running or not', vmname);
    if (stdout.indexOf(vmname) === -1) {
      callback(error, false);
    } else {
      callback(error, true);
    }
  });
}

function keyboardputscancode(vmname, codes, callback) {
  var codeStr = codes.map(function(code) {
    var s = code.toString(16);

    if (s.length === 1) {
      s = '0' + s;
    }
    return s;
  }).join(' ');
  logging.info('Sending VM "%s" keyboard scan codes "%s"', vmname, codeStr);
  vboxmanage(['controlvm', vmname, 'keyboardputscancode', codeStr], function(error, stdout) {
    callback(error, stdout);
  });
}

function vmExec(options, callback) {
  var vm = options.vm || options.name || options.vmname || options.title,
    username = options.user || options.username || 'Guest',
    password = options.pass || options.passwd || options.password,
    path = options.path || options.cmd || options.command || options.exec || options.execute || options.run,
    cmd,
    params = options.params || options.parameters || options.args;

  if (Array.isArray(params)) {
    params = params.join(" ");
  }

  if (params === undefined) {
    params = "";
  }

  guestproperty.os(vm, getOSTypeCb);

  function getOSTypeCb(os_type) {
    var cmd = ['guestcontrol', vm];
    var runcmd = vbox_version === 5 ? ['run'] : ['execute', '--image'];
    cmd.push(runcmd);
    switch (os_type) {
      case known_OS_types.WINDOWS:
        path = path.replace(/\\/g, '\\\\');
        cmd.push('cmd.exe', '--username', username);
        break;
      case known_OS_types.MAC:
        cmd.push('/usr/bin/open', '-a', '--username', username);
        break;
      case known_OS_types.LINUX:
        cmd.push('/bin/sh', '--username', username);
        break;
      default:
        break;
    }

    if (password) {
      cmd.push('--password', password);
    }
    cmd.push('--', '/c', path, params);

    logging.info('Executing command "vboxmanage %s" on VM "%s" detected OS type "%s"', cmd, vm, os_type);

    vboxmanage(cmd, function(error, stdout) {
      callback(error, stdout);
    });
  }

}

function vmKill(options, callback) {
  options = options || {};
  var vm = options.vm || options.name || options.vmname || options.title,
    path = options.path || options.cmd || options.command || options.exec || options.execute || options.run,
    image_name = options.image_name || path;

  guestproperty.os(vm, function(os_type) {
    switch (os_type) {
      case known_OS_types.WINDOWS:
        vmExec({
          vm: vm,
          user: options.user,
          password: options.password,
          path: 'C:\\Windows\\System32\\taskkill.exe /im ',
          params: image_name
        }, callback);
        break;
      case known_OS_types.MAC:
      case known_OS_types.LINUX:
        vmExec({
          vm: vm,
          user: options.user,
          password: options.password,
          path: 'sudo killall ',
          params: image_name
        }, callback);
        break;
    }
  });

}

var guestproperty = {
  get: function(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    guestproperty.os(vm, getOSTypeCallback);

    function getOSTypeCallback(os_type) {
      vboxmanage(['guestproperty', 'get', vm, key], function(error, stdout) {
        if (error) {
          throw error;
        }
        var value = stdout.substr(stdout.indexOf(':') + 1).trim();
        if (value === 'No value set!') {
          value = undefined;
        }
        callback(value);
      });
    }

  },

  os_type: null, // cached

  os: function(vmname, callback) {
    function getOSTypeCallback(error, stdout, stderr) {
      if (error) {
        throw error;
      }

      // The ostype is matched against the ID attribute of 'vboxmanage list ostypes'
      if (stdout.indexOf('ostype="Windows') !== -1) {
        guestproperty.os_type = known_OS_types.WINDOWS;
      } else if (['ostype="MacOS', 'ostype="Mac OS machine'].includes(stdout)) {
        guestproperty.os_type = known_OS_types.MAC;
      } else {
        guestproperty.os_type = known_OS_types.LINUX;
      }
      logging.debug('Detected guest OS as: ' + guestproperty.os_type);
      callback(guestproperty.os_type);
    }

    if (guestproperty.os_type) {
      return callback(guestproperty.os_type);
    }

    try {
      vboxmanage(['showvminfo', '--machinereadable', vmname], getOSTypeCallback);
    } catch (e) {
      logging.error(e);
      logging.info('Could not showvminfo for %s', vmname);
    }
  }

};

var extradata =  {
  get: function(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    vboxmanage(['getextradata', vm, key], function(error, stdout) {
      if (error) {
        callback(error);
        return;
      }
      var value = stdout.substr(stdout.indexOf(':') + 1).trim();
      if (value === 'No value set!') {
        value = undefined;
      }
      callback(null, value);
    });
  },

  set: function(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    var cmd = 'setextradata "' + vm + '" "' + key + '" "' + value + '"';
    vboxmanage(cmd, function(error, stdout) {
        callback(error);
    });
  }
};

module.exports = {
  'exec': vmExec,
  'kill': vmKill,
  'list': list,
  'pause': pause,
  'reset': reset,
  'resume': resume,
  'start': start,
  'stop': stop,
  'savestate': savestate,
  'export': vmExport,
  'poweroff': poweroff,
  'acpisleepbutton': acpisleepbutton,
  'acpipowerbutton': acpipowerbutton,
  'modify': modify,
  'guestproperty': guestproperty,
  'keyboardputscancode': keyboardputscancode,
  'snapshotList': snapshotList,
  'snapshotTake': snapshotTake,
  'snapshotDelete': snapshotDelete,
  'snapshotRestore': snapshotRestore,
  'isRunning': isRunning,
  'extradata': extradata,
  'clone': clone

  'SCAN_CODES': require('./scan-codes')
};
