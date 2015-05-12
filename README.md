# node-virtualbox

A JavaScript library to interact with [VirtualBox](https://www.virtualbox.org/) virtual machines.

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

node-virtualbox provides convenience methods to command the guest machine's power state in the customary ways.

## Starting a cold machine: Two ways
Virtual machines will *start headless by default*, but you can pass a boolean parameter to start them with a GUI:

```javascript
virtualbox.start("machine_name", true, function start_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine has started WITH A GUI!");
});

```

So as not to break pre-0.1.0 implementations, the old method still works (which also defaults to headless):
```javascript
virtualbox.start("machine_name", function start_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine has started HEADLESS!");
});
```

## Stopping a machine
:warning: **Note:** For historical reasons, `.stop` is an alias to `.savestate`.
```javascript
virtualbox.stop("machine_name", function stop_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine has been saved");
});

```

To halt a machine completely, you can use `poweroff` or `acpipowerbutton`:
```javascript
virtualbox.poweroff("machine_name", function poweroff_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine has been powered off!");
});
```

```javascript
virtualbox.acpipowerbutton("machine_name", function acpipower_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's ACPI power button was pressed.");
});
```

## Pausing, Saving and Resuming a machine
Noting the caveat above that `.stop` is actually an alias to `.savestate`...
```javascript
virtualbox.pause("machine_name", function pause_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine is now paused!");
});
```

```javascript
virtualbox.savestate("machine_name", function save_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine is now paused!");
});
```

And, in the same family, `acpisleepbutton`:
```javascript
virtualbox.acpisleepbutton("machine_name", function acpisleep_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's ACPI sleep button signal was sent.");
});
```

Note that you should probably *resume* a machine which is in one of the above three states.
```javascript
virtualbox.resume("machine_name", function resume_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine is now paused!");
});
```

And, of course, a reset button method:
```javascript
virtualbox.reset("machine_name", function reset_callback(error) {
  if (error) throw error;
  console.log("Virtual Machine's reset button was pressed!");
});
```

# Controlling the guest OS

## Running programs in the guest
This method takes an options object with the name of the virtual machine, the path to the binary to be executed and any parameters to pass:
```javascript
var options = {
  vm: "machine_name",
  cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe",
  params: "https://google.com"
}

virtualbox.exec(options, function exec_callback(error) {
    if (error) throw error;
    console.log('Started Internet Explorer...');
});
```

### Executing commands as Administrators on Windows guests
Pass username and password information in an `options` object:

```javascript
var options = {
  vm: "machine_name",
  user:"Administrator",
  password: "123456",
  cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe",
  params: "https://google.com"
};
```

## Killing programs in the guest
Tasks can be killed in the guest as well. In Windows guests this calls `taskkill.exe /im` and on Linux, BSD and OS X (Darwin) guests, it calls `sudo killall`:
```javascript
virtualbox.kill({
    vm: "machine_name",
    cmd: "iexplore.exe"
}, function kill_callback(error) {
    if (error) throw error;
    console.log('Terminated Internet Explorer.');
});
```

## Sending keystrokes to a virtual machine
Keyboard scan code sequences can be piped directly to a virtual machine's console:
```javascript
var SCAN_CODES = virtualbox.SCAN_CODES;
var sequence = [
  { key: 'SHIFT', type: 'make',  code: SCAN_CODES['SHIFT']},
  { key: 'A',     type: 'make',  code: SCAN_CODES['A']},
  { key: 'SHIFT', type: 'break', code: SCAN_CODES.getBreakCode('SHIFT')},
  { key: 'A',     type: 'break', code: SCAN_CODES.getBreakCode('A')}
];

virtualbox.keyboardputscancode("machine_name", sequence, function keyscan_callback(err) {
    if (error) throw error;
    console.log('Sent SHIFT A');
});
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
  vm: "machine_name",
  key: "/VirtualBox/GuestInfo/Net/0/V4/IP"
}

virtualbox.guestproperty(function guestproperty_callback(machines, error) {
  if (error) throw error;
  // Act on machines
});
```

# Putting it all together

```javascript
var virtualbox = require('virtualbox');

virtualbox.start("machine_name", function start_callback(error) {

    if (error) throw error;

    console.log('VM "w7" has been successfully started');

    virtualbox.exec({
        vm: "machine_name",
        cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe",
        params: "http://google.com"
    }, function (error) {

        if (error) throw error;
        console.log('Running Internet Explorer...');

    });

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
  - `.poweroff({vm:"machine_name"}, callback)`
  - `.acpisleepbutton({vm:"machine_name"}, callback)`
  - `.acpipowerbutton({vm:"machine_name"}, callback)`
  - `.guestproperty({vm:"machine_name", property: "propname"}, callback)`
  - `.exec(){vm: "machine_name", cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe", params: "http://google.com"}, callback)`
  - `.exec(){vm: "machine_name", user:"Administrator", password: "123456", cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe", params: "http://google.com"}, callback)`
  - `.keyboardputscancode("machine_name", [scan_codes], callback)`
  - `.kill({vm:"machine_name"}, callback)`
  - `.list(callback)`

# Troubleshooting

 - Make sure that Guest account is enabled on the VM.
 - Make sure your linux guest can `sudo` with `NOPASSWD` (at least for now).
 - VMs start headlessly by default: if you're having trouble with executing a command, start the VM with GUI and observe the screen after executing same command.
 - To avoid having "Concurrent guest process limit is reached" error message, execute your commands as an administrator.
 - Don't forget that this whole thing is asynchronous, and depends on the return of `vboxmanage` *not* the actual running state/runlevel of services within the guest. See https://github.com/Node-Virtualization/node-virtualbox/issues/9

# More Examples
* [npm tests](https://github.com/Node-Virtualization/node-virtualbox/tree/master/test)
