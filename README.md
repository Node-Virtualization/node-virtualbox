# node-virtualbox
A JavaScript library to interact with Virtualbox.

# Installation

```bash
$ npm install virtualbox
```

# Examples

### Starting and Running a program

```javascript
var virtualbox = require('virtualbox');

virtualbox.start("Win32", function(error){

  if(error) throw error;

  console.log('VM "w7" has been successfully started');

  virtualbox.exec({ vm: "win32", cmd: "C:\\Program Files\\Internet Explorer\\iexplore.exe", params: "http://google.com" },  function(error){

    if(error) throw error;

    console.log('Running Internet Explorer...');

  });

});
```

# Available Methods

* start
* stop
* exec
* reset
* pause
* resume

# Troubleshooting

* Make sure that Guest account is enabled on the VM.
* It starts VMs headlessly by default. If you're having with executing a command, start the VM with GUI and run observe the screen after executing same command.
* For the "Concurrent guest process limit is reached" error message, only solution I know is to reset the VM.

# Example Uses
* [tests](https://github.com/azer/node-virtualbox/tree/master/test)
* [Lowkick](http://github.com/azer/lowkick)
