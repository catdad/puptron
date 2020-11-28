const electron = require('./electron-process.js');
const puppeteer = require('./connect-puppeteer.js');

const launch = async (args, options = {}) => {
  const { start: startElectron, stop: stopElectron, getLogs } = electron(args, options);
  const { start: startPuppeteer, stop: stopPuppeteer } = puppeteer();

  let browser;

  try {
    const { browserWSEndpoint } = await startElectron();
    browser = (await startPuppeteer({ browserWSEndpoint })).browser;
  } catch (err) {
    const error = new Error('failed to start the application');
    error._raw = err;
    error._logs = getLogs();

    await stopPuppeteer();
    await stopElectron();

    throw error;
  }

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
