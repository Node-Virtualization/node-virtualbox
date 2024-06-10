# node-virtualbox

![NPM version](https://badge.fury.io/js/virtualbox.svg)
[![Build Status](https://travis-ci.org/Node-Virtualization/node-virtualbox.svg?branch=master)](https://travis-ci.org/Node-Virtualization/node-virtualbox)
[![DepShield Badge](https://depshield.sonatype.org/badges/Node-Virtualization/node-virtualbox/depshield.svg)](https://depshield.github.io)

A JavaScript library to interact with [VirtualBox](https://www.virtualbox.org/) virtual machines.

# Table of Contents

- [Installation](#installation)
- [Controlling Power and State](#controlling-power-and-state) - [Starting a cold machine: Two ways](#starting-a-cold-machine-two-ways) - [Stopping a machine](#stopping-a-machine) - [Pausing, Saving and Resuming a machine](#pausing-saving-and-resuming-a-machine)
- [Import a Machine](#import-a-machine)
- [Export a Machine](#export-a-machine)
- [Snapshot Manage](#snapshot-manage)
- [Cloning a VM](#cloning-vms)
- [Storage](#storage) - [Manage the IDE controller](#manage-the-ide-controller) - [Attach a disk image file](#attach-a-disk-image-file)
- [Controlling the guest OS](#controlling-the-guest-os) - [A note about security :warning:](#a-note-about-security) - [Running programs in the guest](#running-programs-in-the-guest) - [Executing commands as Administrators on Windows guests](#executing-commands-as-administrators-on-windows-guests) - [Killing programs in the guest](#killing-programs-in-the-guest) - [Sending keystrokes to a virtual machine](#sending-keystrokes-to-a-virtual-machine)
- [Meta information about machine](#meta-information-about-machine)
- [Putting it all together](#putting-it-all-together)
- [Available Methods](#available-methods)
- [Troubleshooting](#troubleshooting)
- [More Examples](#more-examples)
- [License (MIT)](#license)
- [Contributing](#contributing)
  - [Testing](#testing)

# Installation

Obtain the package

```bash
$ npm install virtualbox [--save] [-g]
```

and then use it

```javascript
var virtualbox = require('virtualbox');
```

The general formula for commands is:

> virtualbox. **API command** ( "**registered vm name**", **[parameters]**, **callback** );

Available API commands are listed at the end of this document.

# Controlling Power and State

`node-virtualbox` provides convenience methods to command the guest machine's power state in the customary ways.

## Starting a cold machine: Two ways

Virtual machines will _start headless by default_, but you can pass a boolean parameter to start them with a GUI:

```javascript
virtualbox.start('machine_name', true, function start_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine has started WITH A GUI!');
});
```

So as not to break pre-0.1.0 implementations, the old method still works (which also defaults to headless):

```javascript
virtualbox.start('machine_name', function start_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine has started HEADLESS!');
});
```

## Stopping a machine

**Note:** For historical reasons, `.stop` is an alias to `.savestate`.

```javascript
virtualbox.stop('machine_name', function stop_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine has been saved');
});
```

To halt a machine completely, you can use `poweroff` or `acpipowerbutton`:

```javascript
virtualbox.poweroff('machine_name', function poweroff_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine has been powered off!');
});
```

```javascript
virtualbox.acpipowerbutton('machine_name', function acpipower_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's ACPI power button was pressed.");
});
```

## Pausing, Saving and Resuming a machine

Noting the caveat above that `.stop` is actually an alias to `.savestate`...

```javascript
virtualbox.pause('machine_name', function pause_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine is now paused!');
});
```

```javascript
virtualbox.savestate('machine_name', function save_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine is now paused!');
});
```

And, in the same family, `acpisleepbutton`:

```javascript
virtualbox.acpisleepbutton('machine_name', function acpisleep_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's ACPI sleep button signal was sent.");
});
```

Note that you should probably _resume_ a machine which is in one of the above three states.

```javascript
virtualbox.resume('machine_name', function resume_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine is now paused!');
});
```

And, of course, a reset button method:

```javascript
virtualbox.reset('machine_name', function reset_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's reset button was pressed!");
});
```

## Import a machine

You can import an OVA or OVF file with the `vmImport` method:

```javascript
virtualbox.vmImport('ova_file_path', options, function import_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine was imported!');
});
```

The options object may contain optional parameters:
* `vmname`: the name of the new VM.
* `cpus`: the number of CPUs.
* `memory`: the amount of memory in megabytes.

## Export a machine

You can export with `vmExport` method:

```javascript
virtualbox.vmExport('machine_name', 'output', function export_callback(error) {
  if (error) throw error;
  console.log('Virtual Machine was exported!');
});
```

## Snapshot Manage

You can show snapshot list with `snapshotList` method:

```javascript
virtualbox.snapshotList('machine_name', function (
  error,
  snapshotList,
  currentSnapshotUUID
) {
  if (error) throw error;
  if (snapshotList) {
    console.log(
      JSON.stringify(snapshotList),
      JSON.stringify(currentSnapshotUUID)
    );
  }
});
```

And, you can take a snapshot:

```javascript
virtualbox.snapshotTake('machine_name', 'snapshot_name', function (
  error,
  uuid
) {
  if (error) throw error;
  console.log('Snapshot has been taken!');
  console.log('UUID: ', uuid);
});
```

Or, delete a snapshot:

```javascript
virtualbox.snapshotDelete('machine_name', 'snapshot_name', function (error) {
  if (error) throw error;
  console.log('Snapshot has been deleted!');
});
```

Or, restore a snapshot:

```javascript
virtualbox.snapshotRestore('machine_name', 'snapshot_name', function (error) {
  if (error) throw error;
  console.log('Snapshot has been restored!');
});
```

## Cloning VMs

Make a full clone (duplicate virtual hard drive) of a machine:

```javascript
virtualbox.clone('source_machine_name', 'new_machine_name', function (error) {
  if (error) throw error;
  console.log('Done fully cloning the virtual machine!');
});
```

Make a linked clone (interdependent-differentially stored virtual hard drive) of a machine:

```javascript
virtualbox.snapshotTake('machine_name', 'snapshot_name', function (
  error,
  uuid
) {
  if (error) throw error;
  console.log('Snapshot has been taken!');
  console.log('UUID: ', uuid);
  virtualbox.clone(
    'machine_name',
    'new_machine_name',
    'snapshot_name',
    function (error) {
      if (error) throw error;
      console.log('Done making a linked clone of the virtual machine!');
    }
  );
});
```

## Storage

### Manage the IDE controller

In case the VM doesn't have an IDE controller you can use the storagectl command to add one:

```javascript
virtualbox.storage.addCtl(
  {
    vm: 'machine_name',
    perhiperal_name: 'IDE', //optional
    type: 'ide', //optional
  },
  function () {
    console.log('Controller has been added!');
  }
);
```

### Attach a disk image file

Mount an ISO file to the added controller:

```javascript
virtualbox.storage.attach(
  {
    vm: 'machine_name',
    perhiperal_name: 'IDE', //optional
    port: '0', //optional
    device: '0', //optional
    type: 'dvddrive', //optional
    medium: 'X:Foldercontaining\the.iso',
  },
  function () {
    console.log('Image has been mounted!');
  }
);
```

The _medium_ parameter of the options object can be set to the **none** value to unmount.

# Controlling the guest OS

## A note about security :warning:

`node-virtualbox` is not opinionated: we believe that _you know best_ what _you_ need to do with _your_ virtual machine. Maybe that includes issuing `sudo rm -rf /` for some reason.

To that end, the `virtualbox` APIs provided by this module _take absolutely no steps_ to prevent you shooting yourself in the foot.

:warning: Therefore, if you accept user input and pass it to the virtual machine, you should take your own steps to filter input before it gets passed to `virtualbox`.

For more details and discussion, see [issue #29](https://github.com/Node-Virtualization/node-virtualbox/issues/29).

## Running programs in the guest

This method takes an options object with the name of the virtual machine, the path to the binary to be executed and any parameters to pass:

```javascript
var options = {
  vm: 'machine_name',
  cmd: 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
  params: 'https://google.com',
};

virtualbox.exec(options, function exec_callback(error, stdout) {
  if (error) throw error;
  console.log('Started Internet Explorer...');
});
```

### Executing commands as Administrators on Windows guests

Pass username and password information in an `options` object:

```javascript
var options = {
  vm: 'machine_name',
  user: 'Administrator',
  password: '123456',
  cmd: 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
  params: 'https://google.com',
};
```

## Killing programs in the guest

Tasks can be killed in the guest as well. In Windows guests this calls `taskkill.exe /im` and on Linux, BSD and OS X (Darwin) guests, it calls `sudo killall`:

```javascript
virtualbox.kill(
  {
    vm: 'machine_name',
    cmd: 'iexplore.exe',
  },
  function kill_callback(error) {
    if (error) throw error;
    console.log('Terminated Internet Explorer.');
  }
);
```

## Sending keystrokes to a virtual machine

Keyboard scan code sequences can be piped directly to a virtual machine's console:

```javascript
var SCAN_CODES = virtualbox.SCAN_CODES;
var sequence = [
  { key: 'SHIFT', type: 'make', code: SCAN_CODES['SHIFT'] },
  { key: 'A', type: 'make', code: SCAN_CODES['A'] },
  { key: 'SHIFT', type: 'break', code: SCAN_CODES.getBreakCode('SHIFT') },
  { key: 'A', type: 'break', code: SCAN_CODES.getBreakCode('A') },
];

virtualbox.keyboardputscancode(
  'machine_name',
  sequence,
  function keyscan_callback(err) {
    if (error) throw error;
    console.log('Sent SHIFT A');
  }
);
```

# Meta information about machine

List all registered machines, returns an array:

```javascript
virtualbox.list(function list_callback(machines, error) {
  if (error) throw error;
  // Act on machines
});
```

Obtaining a guest property by [key name](https://www.virtualbox.org/manual/ch04.html#guestadd-guestprops):

```javascript
var options = {
  vm: 'machine_name',
  key: '/VirtualBox/GuestInfo/Net/0/V4/IP',
};

virtualbox.guestproperty.get(options, function guestproperty_callback(machines, error) {
  if (error) throw error;
  // Act on machines
});
```

Obtaining an extra property by key name:

```javascript
var options = {
  vm: 'machine_name',
  key: 'GUI/Fullscreen',
};

virtualbox.extradata.get(options, function extradataget_callback(error, value) {
  if (error) throw error;
  console.log(
    'Virtual Machine "%s" extra "%s" value is "%s"',
    options.vm,
    options.key,
    value
  );
});
```

Writing an extra property by key name:

```javascript
var options = {
  vm: 'machine_name',
  key: 'GUI/Fullscreen',
  value: 'true',
};

virtualbox.extradata.set(options, function extradataset_callback(error) {
  if (error) throw error;
  console.log(
    'Set Virtual Machine "%s" extra "%s" value to "%s"',
    options.vm,
    options.key,
    options.value
  );
});
```

_Note: some properties are only available/effective if the Guest OS has the (https://www.virtualbox.org/manual/ch04.html)[Guest Additions] installed and running._

# Putting it all together

```javascript
var virtualbox = require('virtualbox');

virtualbox.start('machine_name', function start_callback(error) {
  if (error) throw error;

  console.log('VM "w7" has been successfully started');

  virtualbox.exec(
    {
      vm: 'machine_name',
      cmd: 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
      params: 'http://google.com',
    },
    function (error) {
      if (error) throw error;
      console.log('Running Internet Explorer...');
    }
  );
});
```

# Available Methods

`virtualbox`

- `.pause({vm:"machine_name"}, callback)`
- `.reset({vm:"machine_name"}, callback)`
- `.resume({vm:"machine_name"}, callback)`
- `.start({vm:"machine_name"}, callback)` and `.start({vm:"machine_name"}, true, callback)`
- `.stop({vm:"machine_name"}, callback)`
- `.savestate({vm:"machine_name"}, callback)`
- `.vmImport({input: "input"}, {options: "options"}, callback)`
- `.vmExport({vm:"machine_name"}, {output: "output"}, callback)`
- `.poweroff({vm:"machine_name"}, callback)`
- `.acpisleepbutton({vm:"machine_name"}, callback)`
- `.acpipowerbutton({vm:"machine_name"}, callback)`
- `.guestproperty.get({vm:"machine_name", property: "propname"}, callback)`
- `.exec(){vm: "machine_name", cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe", params: "http://google.com"}, callback)`
- `.exec(){vm: "machine_name", user:"Administrator", password: "123456", cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe", params: "http://google.com"}, callback)`
- `.keyboardputscancode("machine_name", [scan_codes], callback)`
- `.kill({vm:"machine_name"}, callback)`
- `.list(callback)`
- `.isRunning({vm:"machine_name"}, callback)`
- `.snapshotList({vm:"machine_name"}, callback)`
- `.snapshotTake({vm:"machine_name"}, {vm:"snapshot_name"}, callback)`
- `.snapshotDelete({vm:"machine_name"}, {vm:"snapshot_UUID"}, callback)`
- `.snapshotRestore({vm:"machine_name"}, {vm:"snapshot_UUID"}, callback)`
- `.clone({vm:"machine_name"}, {vm:"new_machine_name"}, callback)`
- `.storage.addCtl({vm: "machine_name", perhiperal_name: "IDE", type: "ide"}, callback)`
- `.storage.attach({vm: "machine_name", perhiperal_name: "IDE", port: "0", device: "0", type: "dvddrive", medium: "X:\Folder\containing\the.iso"}, callback)`
- `.extradata.get({vm:"machine_name", key:"keyname"}, callback)`
- `.extradata.set({vm:"machine_name", key:"keyname", value:"val"}, callback)`

# Troubleshooting

- Make sure that Guest account is enabled on the VM.
- Make sure your linux guest can `sudo` with `NOPASSWD` (at least for now).
- VMs start headlessly by default: if you're having trouble with executing a command, start the VM with GUI and observe the screen after executing same command.
- To avoid having "Concurrent guest process limit is reached" error message, execute your commands as an administrator.
- Don't forget that this whole thing is asynchronous, and depends on the return of `vboxmanage` _not_ the actual running state/runlevel of services within the guest. See <https://github.com/Node-Virtualization/node-virtualbox/issues/9>

# More Examples

- [npm tests](https://github.com/Node-Virtualization/node-virtualbox/tree/master/test)

# License

[MIT](https://github.com/Node-Virtualization/node-virtualbox/blob/master/LICENSE)

# Contributing

Please do!

- [File an issue](https://github.com/Node-Virtualization/node-virtualbox/issues)
- [Fork](https://github.com/Node-Virtualization/node-virtualbox#fork-destination-box) and send a pull request.

Please abide by the [Contributor Code of Conduct](https://github.com/Node-Virtualization/node-virtualbox/blob/master/code_of_conduct.md).

## Testing

We currently do not have a complete unit testing suite. However, example scripts and a Vagrantfile are provided. Test your changes by writing a new script and/or running through all the test scripts to make sure they behave as expected. To do this [install vagrant](https://www.vagrantup.com/docs/installation) and run `vagrant up` in this repository's root directory. Then run the example scripts by using node: `node test/integration/<script-name>.js`. Please be ready to provide test output upon opening a pull request.
