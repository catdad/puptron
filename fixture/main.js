/* eslint-disable no-console */

const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow () {
  const env = process.env.TEST_TEXT || '';
  const arg = process.argv.slice(-1)[0] || '';

  mainWindow = new BrowserWindow({width: 400, height: 400});
  mainWindow.loadURL(`file://${__dirname}/index.html?env=${env}&arg=${arg}`);

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
