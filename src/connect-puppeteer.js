const puppeteer = require('puppeteer-core');
const waitForThrowable = require('wait-for-throwable');

module.exports = ({ rendererInterval = 5, rendererTimeout = 2000 }) => {
  let browser, stopped = false;

  const stopBrowser = async () => {
    if (browser) {
      await browser.disconnect();
      browser = null;
    }
  };

  const start = async ({ browserWSEndpoint }) => {
    stopped = false;

    await waitForThrowable(async () => {
      if (stopped) {
        return;
      }

      if (browser) {
        await stopBrowser();
      }

      browser = await puppeteer.connect({ browserWSEndpoint, dumpio: true });
      const pages = await browser.pages();

      if (pages.length < 1) {
        await stopBrowser();
        throw new Error('did not find a renderer when connecting to app');
      }
    }, { interval: rendererInterval, total: rendererTimeout });

    return { browser };
  };

  const stop = async () => {
    if (!stopped) {
      await stopBrowser();
      stopped = true;
    }
  };

  return { start, stop };
};
