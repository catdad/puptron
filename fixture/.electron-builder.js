const path = require('path');
const { name, productName, version } = require('./package.json');
const { version: electronVersion } = require('electron/package.json');

const fileName = productName.replace(/\s/g, '');

const windows = {

};

module.exports = {
  productName,
  electronVersion,
  directories: {
    app: __dirname,
    output: path.resolve(__dirname, '..', 'temp'),
  },
  buildVersion: version,
  mac: {
    target: [
      'dir'
    ],
    darkModeSupport: true
  },
  win: {
    target: [
      'dir'
    ]
  },
  linux: {
    target: [
      'dir'
    ],
    executableName: productName,
    category: 'Network'
  }
};
