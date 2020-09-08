const electron = require('./electron-process.js');
const puppeteer = require('./connect-puppeteer.js');

const launch = async (args, options = {}) => {
  const { start: startElectron, stop: stopElectron, getLogs } = electron(args, options);
  const { start: startPuppeteer, stop: stopPuppeteer } = puppeteer();

  const { browserWSEndpoint } = await startElectron();
  const { browser } = await startPuppeteer({ browserWSEndpoint });

  return new Proxy(browser, {
    get: (target, key, receiver) => {
      if (key === 'close') {
        return async () => {
          await stopPuppeteer();
          await stopElectron();
        };
      }

      if (key === 'getLogs') {
        return () => getLogs();
      }

      return Reflect.get(target, key, receiver);
    },
    set: (target, key, value, receiver) => {
      if (['close', 'getLogs'].includes(key)) {
        throw new Error(`cannot set read-only "${key}" property`);
      }

      Reflect.set(target, key, value, receiver);
    }
  });
};

module.exports = { launch };
