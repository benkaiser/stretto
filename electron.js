var electronApp = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var mainWindow = null;
electronApp.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    electronApp.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electronApp.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, 'node-integration': false});

  // disable the menu entirely
  mainWindow.setMenu(null);

  // init the server
  var app = require(__dirname + '/app.js');

  // and load the music player page on the server
  mainWindow.loadUrl('http://localhost:' + app.get('port') + '/');

  // show the dev tool
  if (process.env.DEVTOOLS) {
    mainWindow.toggleDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
