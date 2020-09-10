/* eslint-disable no-console */

const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({width: 400, height: 400});
  mainWindow.loadURL(`file://${__dirname}/index.html#${process.env.TEST_TEXT || ''}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('main window open');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
