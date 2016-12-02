var electron = require('electron');
var electronApp = electron.app;  // Module to control application life.
var BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
var Menu = electron.Menu;
var globalShortcut = electron.globalShortcut;

var mainWindow = null;
electronApp.on('window-all-closed', function () {
  electronApp.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electronApp.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  // set the config directory in the users applicatin settings location
  process.env.configDir = electronApp.getPath('userData');

  // let the app know via an env variable we are running electron
  process.env.ELECTRON_ENABLED = true;

  // init the server
  var app = require(__dirname + '/app.js');

  // and load the music player page on the server
  mainWindow.loadURL('http://localhost:' + app.get('port') + '/');

  // show the dev tool
  if (process.env.DEVTOOLS) {
    mainWindow.toggleDevTools();
  }

  // attach the keyboard shortucts
  globalShortcut.register('MediaPlayPause', function() { app.io.sockets.emit('command', {command: 'playpause'}); });
  globalShortcut.register('MediaNextTrack', function() { app.io.sockets.emit('command', {command: 'next'}); });
  globalShortcut.register('MediaPreviousTrack', function() { app.io.sockets.emit('command', {command: 'prev'}); });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // add menu to application
  var menu = [
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

  // hide the menu
  mainWindow.setMenuBarVisibility(false);
});
