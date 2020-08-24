'use strict';

const execFile = require('child_process').execFile,
  log4js = require('log4js'),
  host_platform = process.platform,
  known_OS_types = {
    WINDOWS: 'windows',
    MAC: 'mac',
    LINUX: 'linux',
  },
  defaultExecutor = (bin, cmd) => {
    return new Promise((resolve, reject) => {
      if (!allowedBinaries.includes(bin)) {
        reject(new Error('Not an allowed binary'));
      } else {
        execFile(bin, cmd, function (err, stdout, stderr) {
          if (
            !err &&
            stderr &&
            cmd.indexOf('pause') !== -1 &&
            cmd.indexOf('savestate') !== -1
          ) {
            reject(new Error(stderr));
          }

          resolve({ err, stdout, stderr });
        });
      }
    });
  },
  defaultLoggingConfig = {
    appenders: {
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] %c - %]%m',
        },
      },
    },
    categories: { default: { appenders: ['out'], level: 'info' } },
  },
  defaultLoggerFn = () => {
    log4js.configure(defaultLoggingConfig);
    return log4js.getLogger('VirtualBox');
  },
  defaultLogger = defaultLoggerFn(),
  defaultvboxmanage = function (cmd, callback) {
    try {
      this._executor(this._vBoxManageBinary, cmd)
        .then(({ err, stdout, stderr }) => callback(err, stdout, stderr))
        .catch(defaultErrorHandler);
    } catch (err) {
      this._logging.error(err);
    }
  },
  defaultErrorHandler = (err) => {
    console.error(err);
  },
  allowedBinaries = ['VBoxControl'];

class Virtualbox {
  constructor(logging = defaultLogger, executor = defaultExecutor) {
    this._logging = logging;
    this._executor = executor;
    this._setVboxManageBinary();
    allowedBinaries.push(this._vBoxManageBinary);
    this._logging.debug(allowedBinaries);
    this._detectVboxVersion();
    this.storage = new VboxStorage(
      this._logging,
      this._executor,
      this._vBoxManageBinary
    );
    this.guestproperty = new VboxGuestProperty(
      this._logging,
      this._executor,
      this._vBoxManageBinary
    );
    this.extradata = new VboxExtraData(
      this._logging,
      this._executor,
      this._vBoxManageBinary
    );
    this.vboxmanage = defaultvboxmanage;
    this.SCAN_CODES = require('./scan-codes');
  }

  static create(logging, executor) {
    const logger = !!logging ? logging : defaultLogger;
    return new Virtualbox(logger, executor);
  }

  pause(vmname, callback) {
    this._logging.info('Pausing VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'pause'], function (error, _) {
      callback(error);
    });
  }

  list(callback) {
    const parse_listdata = (raw_data) => {
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
              name: arrMatches[1].toString(),
            };
          }
        }
      }
      return _data;
    };

    this._logging.info('Listing VMs');
    this.vboxmanage(['list', 'runningvms'], (_, stdout) => {
      var _runningvms = parse_listdata(stdout);
      this.vboxmanage(['list', 'vms'], function (error, fullStdout) {
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

  reset(vmname, callback) {
    this._logging.info('Resetting VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'reset'], function (error, _) {
      callback(error);
    });
  }

  resume(vmname, callback) {
    this._logging.info('Resuming VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'resume'], function (error, _) {
      callback(error);
    });
  }

  start(vmname, useGui, callback) {
    if (typeof useGui === 'function') {
      callback = useGui;
      useGui = false;
    }
    var vmType = useGui ? 'gui' : 'headless';

    this._logging.info('Starting VM "%s" with options: ', vmname, vmType);

    this.vboxmanage(['-nologo', 'startvm', vmname, '--type', vmType], function (
      error,
      _
    ) {
      if (error && /VBOX_E_INVALID_OBJECT_STATE/.test(error.message)) {
        error = undefined;
      }
      callback(error);
    });
  }

  stop(vmname, callback) {
    this._logging.info('Stopping VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'savestate'], function (error, _) {
      callback(error);
    });
  }

  savestate(vmname, callback) {
    this._logging.info('Saving State (alias to stop) VM "%s"', vmname);
    this.stop(vmname, callback);
  }

  vmExport(vmname, output, callback) {
    this._logging.info('Exporting VM "%s"', vmname);
    this.vboxmanage(['export', vmname, '--output', output], function (
      error,
      _
    ) {
      callback(error);
    });
  }

  poweroff(vmname, callback) {
    this._logging.info('Powering off VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'poweroff'], function (error, _) {
      callback(error);
    });
  }

  acpipowerbutton(vmname, callback) {
    this._logging.info('ACPI power button VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'acpipowerbutton'], function (error) {
      callback(error);
    });
  }

  acpisleepbutton(vmname, callback) {
    this._logging.info('ACPI sleep button VM "%s"', vmname);
    this.vboxmanage(['controlvm', vmname, 'acpisleepbutton'], function (
      error,
      _
    ) {
      callback(error);
    });
  }

  modify(vname, properties, callback) {
    this._logging.info('Modifying VM %s', vname);
    var args = [vname];

    for (var property in properties) {
      if (properties.hasOwnProperty(property)) {
        var value = properties[property];
        args.push('--' + property);

        if (Array.isArray(value)) {
          Array.prototype.push.apply(args, value);
        } else {
          args.push(value.toString());
        }
      }
    }

    this.vboxmanage(['modifyvm', ...args], function (error, _) {
      callback(error);
    });
  }

  snapshotList(vmname, callback) {
    this._logging.info('Listing snapshots for VM "%s"', vmname);
    this.vboxmanage(
      ['snapshot', vmname, 'list', '--machinereadable'],
      function (error, stdout) {
        if (error) {
          callback(error);
          return;
        }

        var s;
        var snapshots = [];
        var currentSnapshot;
        var lines = (stdout || '').split(require('os').EOL);

        lines.forEach(function (line) {
          line
            .trim()
            .replace(
              /^(CurrentSnapshotUUID|SnapshotName|SnapshotUUID).*\="(.*)"$/,
              function (l, k, v) {
                if (k === 'CurrentSnapshotUUID') {
                  currentSnapshot = v;
                } else if (k === 'SnapshotName') {
                  s = {
                    name: v,
                  };
                  snapshots.push(s);
                } else {
                  s.uuid = v;
                }
              }
            );
        });

        callback(null, snapshots, currentSnapshot);
      }
    );
  }

  snapshotTake(
    vmname,
    name,
    /*optional*/ description,
    /*optional*/ live,
    callback
  ) {
    this._logging.info('Taking snapshot for VM "%s"', vmname);

    if (typeof description === 'function') {
      callback = description;
      description = undefined;
    } else if (typeof live === 'function') {
      callback = live;
      live = false;
    }

    var cmd = ['snapshot', vmname, 'take', name];

    if (description) {
      cmd.push('--description');
      cmd.push(description);
    }

    if (live === true) {
      cmd.push('--live');
    }

    this.vboxmanage(cmd, function (error, stdout) {
      var uuid;
      stdout.trim().replace(/UUID\: ([a-f0-9\-]+)$/, function (l, u) {
        uuid = u;
      });
      callback(error, uuid);
    });
  }

  snapshotDelete(vmname, uuid, callback) {
    this._logging.info('Deleting snapshot "%s" for VM "%s"', uuid, vmname);
    this.vboxmanage(['snapshot', vmname, 'delete', uuid], callback);
  }

  snapshotRestore(vmname, uuid, callback) {
    this._logging.info('Restoring snapshot "%s" for VM "%s"', uuid, vmname);
    this.vboxmanage(['snapshot', vmname, 'restore', uuid], callback);
  }

  clone(vmname, clonevmname, /*optional*/ snapshot, callback) {
    this._logging.info('Cloning machine "%s" to "%s"', vmname, clonevmname);
    var cmd = ['clonevm', vmname, '--name', clonevmname, '--register'];
    if (typeof snapshot === 'function') {
      callback = snapshot;
      snapshot = undefined;
    } else {
      cmd.push('--options');
      cmd.push('link');
      cmd.push('--snapshot');
      cmd.push(snapshot);
    }
    this.vboxmanage(cmd, callback);
  }

  isRunning(vmname, callback) {
    this.vboxmanage(['list', 'runningvms'], (error, stdout) => {
      this._logging.info(
        'Checking virtual machine "%s" is running or not',
        vmname
      );
      if (stdout.indexOf(vmname) === -1) {
        callback(error, false);
      } else {
        callback(error, true);
      }
    });
  }

  keyboardputscancode(vmname, codes, callback) {
    var codeStr = codes
      .map(function (code) {
        var s = code.toString(16);

        if (s.length === 1) {
          s = '0' + s;
        }
        return s;
      })
      .join(' ');
    this._logging.info(
      'Sending VM "%s" keyboard scan codes "%s"',
      vmname,
      codeStr
    );
    this.vboxmanage(
      ['controlvm', vmname, 'keyboardputscancode', codeStr],
      function (error, stdout) {
        callback(error, stdout);
      }
    );
  }

  exec(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      username = options.user || options.username || 'Guest',
      password = options.pass || options.passwd || options.password,
      path =
        options.path ||
        options.cmd ||
        options.command ||
        options.exec ||
        options.execute ||
        options.run,
      cmd,
      params = options.params || options.parameters || options.args;

    if (Array.isArray(params)) {
      params = params.join(' ');
    }

    if (params === undefined) {
      params = '';
    }

    const getOSTypeCb = (os_type) => {
      var cmd = ['guestcontrol', vm];
      var runcmd = this._vboxVersion > 5 ? ['run'] : ['execute', '--image'];
      cmd = [...cmd, ...runcmd];
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

      this._logging.info(
        'Executing command "vboxmanage %s" on VM "%s" detected OS type "%s"',
        cmd,
        vm,
        os_type
      );

      this.vboxmanage(cmd, function (error, stdout) {
        callback(error, stdout);
      });
    };

    this.guestproperty.os(vm, getOSTypeCb);
  }

  kill(options, callback) {
    options = options || {};
    var vm = options.vm || options.name || options.vmname || options.title,
      path =
        options.path ||
        options.cmd ||
        options.command ||
        options.exec ||
        options.execute ||
        options.run,
      image_name = options.image_name || path;

    this.guestproperty.os(vm, (os_type) => {
      switch (os_type) {
        case known_OS_types.WINDOWS:
          this._executor(
            {
              vm: vm,
              user: options.user,
              password: options.password,
              path: 'C:\\Windows\\System32\\taskkill.exe /im ',
              params: image_name,
            },
            callback
          );
          break;
        case known_OS_types.MAC:
        case known_OS_types.LINUX:
          this._executor(
            {
              vm: vm,
              user: options.user,
              password: options.password,
              path: 'sudo killall ',
              params: image_name,
            },
            callback
          );
          break;
      }
    });
  }

  _setVboxManageBinary() {
    this._logging.info(host_platform);
    if (/^win/.test(host_platform)) {
      // Path may not contain VBoxManage.exe but it provides this environment variable
      const vBoxInstallPath =
        process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH;
      this._vBoxManageBinary = `${vBoxInstallPath}VBoxManage.exe`;
    } else if (/^darwin/.test(host_platform) || /^linux/.test(host_platform)) {
      // Mac OS X and most Linux use the same binary name, in the path
      this._vBoxManageBinary = 'vboxmanage';
    } else {
      // Otherwise (e.g., SunOS) hope it's in the path
      this._vBoxManageBinary = 'vboxmanage';
    }
  }

  _detectVboxVersion() {
    this._executor(this._vBoxManageBinary, ['--version']).then(
      ({ error, stdout }) => {
        if (error) {
          throw error;
        } else {
          this._vboxVersion = stdout.split('.')[0];
          this._logging.info(
            'Virtualbox version detected as %s',
            this._vboxVersion
          );
        }
      }
    );
  }
}

class VboxStorage {
  constructor(logging, executor, vBoxManageBinary) {
    this._logging = logging;
    this._executor = executor;
    this._vBoxManageBinary = vBoxManageBinary;
    this.vboxmanage = defaultvboxmanage;
  }

  addCtl(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      device_name = options.perhiperal_name || 'IDE',
      type = options.type || 'ide';
    this._logging.info(
      'Adding "%s" controller named "%s" to %s',
      type,
      device_name,
      vm
    );
    var cmd = ['storagectl', vm, '--name', device_name, '--add', type];
    this.vboxmanage(cmd, callback);
  }

  attach(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      device_name = options.perhiperal_name || 'IDE',
      port = options.port || '0',
      device = options.device || '0',
      type = options.type || 'dvddrive',
      medium = options.medium;
    this._logging.info(
      'Mounting "%s" to controller named "%s" on %s',
      medium,
      device_name,
      vm
    );
    var cmd = [
      'storageattach',
      vm,
      '--storagectl',
      device_name,
      '--port',
      port,
      '--device',
      device,
      '--type',
      type,
      '--medium',
      medium,
    ];
    this.vboxmanage(cmd, callback);
  }
}

class VboxGuestProperty {
  constructor(logging, executor, vBoxManageBinary) {
    this._logging = logging;
    this._executor = executor;
    this._vBoxManageBinary = vBoxManageBinary;
    this.os_type = null;
    this.vboxmanage = defaultvboxmanage;
  }

  get(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    this.os(vm, (os_type) => {
      this.vboxmanage(['guestproperty', 'get', vm, key], function (
        error,
        stdout
      ) {
        if (error) {
          throw error;
        }
        var value = stdout.substr(stdout.indexOf(':') + 1).trim();
        if (value === 'No value set!') {
          value = undefined;
        }
        callback(value);
      });
    });
  }

  os(vmname, callback) {
    if (this.os_type) {
      return callback(this.os_type);
    }

    try {
      this.vboxmanage(
        ['showvminfo', '--machinereadable', vmname],
        (error, stdout, _) => {
          if (error) {
            throw error;
          }

          // The ostype is matched against the ID attribute of 'vboxmanage list ostypes'
          if (stdout.indexOf('ostype="Windows') !== -1) {
            this.os_type = known_OS_types.WINDOWS;
          } else if (
            ['ostype="MacOS', 'ostype="Mac OS machine'].includes(stdout)
          ) {
            this.os_type = known_OS_types.MAC;
          } else {
            this.os_type = known_OS_types.LINUX;
          }
          this._logging.debug('Detected guest OS as: ' + this.os_type);
          callback(this.os_type);
        }
      );
    } catch (e) {
      this._logging.error(e);
      this._logging.info('Could not showvminfo for %s', vmname);
    }
  }

  /**
   * Function to return an array of this object:
   * {
   *    "key": "ResumeCounter",
   *    "value": 0,
   *    "namespace": "VMInfo",
   *    "timestamp": 1596902741176896000,
   *    "flags": ["TRANSIENT", "RDONLYGUEST"]
   * }
   * @param {String} vmname The name of the VM to enumerate guest properties on.
   * @param {Function} callback The callback to handle the output.
   * @returns {void} The output of stdout will be an array of properties objects.
   */
  enumerate(vmname, callback) {
    this.vboxmanage(
      ['guestproperty', 'enumerate', vmname],
      (err, stdout, _) => {
        if (err) {
          throw err;
        }
        const arrOfProps = stdout.split('\n');
        const nameRegex = /(?<=Name: ).+?(?=\,)/;
        const valueRegex = /(?<=value: ).+?(?=\,)/;
        const timestampRegex = /(?<=timestamp: ).+?(?=\,)/;
        const flagsRegex = /(?<=flags: ).*/;

        const arrOfPropsParsed = [];
        arrOfProps
          .filter((prop) => !!prop)
          .forEach((prop) => {
            const nameMatch = prop.match(nameRegex).shift(),
              value = prop.match(valueRegex).shift(),
              timestamp = prop.match(timestampRegex).shift(),
              flags = prop
                .match(flagsRegex)
                .shift()
                .split(',')
                .map((flag) => flag.replace(' ', '')),
              nameMatchSplit = nameMatch
                .split('/')
                .filter((name) => name !== ''),
              key = nameMatchSplit[2],
              namespace = nameMatchSplit[1];
            arrOfPropsParsed.push({
              key,
              value,
              namespace,
              timestamp,
              flags,
            });
          });
        callback(err, arrOfPropsParsed);
      }
    );
  }
}

class VboxExtraData {
  constructor(logging, executor, vBoxManageBinary) {
    this._logging = logging;
    this._executor = executor;
    this._vBoxManageBinary = vBoxManageBinary;
    this.vboxmanage = defaultvboxmanage;
  }

  get(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    this.vboxmanage(['getextradata', vm, key], function (error, stdout) {
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
  }

  set(options, callback) {
    var vm = options.vm || options.name || options.vmname || options.title,
      key = options.key,
      value = options.defaultValue || options.value;

    var cmd = ['setextradata', vm, key, value];
    this.vboxmanage(cmd, function (error, stdout) {
      callback(error);
    });
  }
}

// module.exports = {
//   'exec': vmExec,
//   'kill': vmKill,
//   'list': list,
//   'pause': pause,
//   'reset': reset,
//   'resume': resume,
//   'start': start,
//   'stop': stop,
//   'savestate': savestate,
//   'export': vmExport,
//   'poweroff': poweroff,
//   'acpisleepbutton': acpisleepbutton,
//   'acpipowerbutton': acpipowerbutton,
//   'modify': modify,
//   'guestproperty': guestproperty,
//   'keyboardputscancode': keyboardputscancode,
//   'snapshotList': snapshotList,
//   'snapshotTake': snapshotTake,
//   'snapshotDelete': snapshotDelete,
//   'snapshotRestore': snapshotRestore,
//   'isRunning': isRunning,
//   'extradata': extradata,
//   'clone': clone,
//   'storage': storage,

//   'SCAN_CODES': require('./scan-codes')
// };

module.exports = new Virtualbox();
module.exports.create = Virtualbox.create;
module.exports.Virtualbox = Virtualbox;
