const electron = require('./electron-process.js');
const puppeteer = require('./connect-puppeteer.js');

const launch = async (args, { execPath, env, cwd, rendererInterval, rendererTimeout } = {}) => {
  const { start: startElectron, stop: stopElectron, getLogs } = electron(args, { execPath, env, cwd });
  const { start: startPuppeteer, stop: stopPuppeteer } = puppeteer({
    rendererInterval,
    rendererTimeout
  });

  let browser;

  try {
    const { browserWSEndpoint } = await startElectron();
    browser = (await startPuppeteer({ browserWSEndpoint })).browser;
  } catch (err) {
    const error = new Error(`failed to start the application: ${err.message}`);
    error._raw = err;
    error._logs = getLogs();

    await stopPuppeteer();
    await stopElectron();

    throw error;
  }

  return Object.defineProperties(browser, {
    close: {
      get: () => async () => {
        await stopPuppeteer();
        await stopElectron();
      }
    },
    getLogs: {
      get: () => () => getLogs()
    }
  });
};

module.exports = { launch };
