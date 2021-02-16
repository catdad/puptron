const http = require('http');
const path = require('path');

const { expect } = require('chai');
const getPort = require('get-port');
const waitForThrowable = require('wait-for-throwable');

const { launch } = require('../');

const { productName } = require('../fixture/package.json');
const fixtureUnpacked = ({
  win32: `win-unpacked/${productName}.exe`,
  darwin: `mac/${productName}.app`,
  linux: `linux-unpacked/${productName}`
})[process.platform];
const fixtureExec = path.resolve(__dirname, '../temp', fixtureUnpacked);

describe('launch', () => {
  let browser;

  const cleanup = async () => {
    if (browser) {
      await browser.close();
    }
  };

  beforeEach(cleanup);
  afterEach(cleanup);

  describe('opening a web page', () => {
    let port, server;
    const text = `pineapples ${Math.random()}`;

    beforeEach(async () => {
      port = await getPort();
      server = http.createServer((req, res) => {
        // close all connections immediately so that the
        // server can be stopped quickly
        res.writeHead(200, { 'connection': 'close' });
        res.end(`<p>${text}</p>`);
      });

      await new Promise(r => server.listen(port, () => r()));
    });

    afterEach(async () => {
      if (server) {
        await new Promise(r => server.close(() => r()));
        server = null;
        port = null;
      }
    });

    it('launches and allows inspecting the page', async () => {
      browser = await launch([`http://localhost:${port}`]);

      const pages = await browser.pages();

      expect(pages).to.be.an('array').and.to.have.lengthOf(1);

      const page = pages[0];

      const $p = await page.waitForSelector('p');
      const actualText = await $p.evaluate(p => p.innerText);

      expect(actualText).to.equal(text);
    });
  });

  const appTests = [{
    name: 'opening a sample application from source code',
    execPath: require('electron'),
    opts: {}
  }];

  if (process.platform !== 'darwin') {
    appTests.push({
      name: 'opening a sample built application',
      execPath: fixtureExec,
      opts: {
        execPath: fixtureExec
      }
    });
  }

  for (const { name, execPath, opts } of appTests) {
    describe(name, () => {
      const varText = `gouda ${Math.random()}`;
      const argText = `jarlsberg ${Math.random()}`;

      it('launches and allows inspecting the page', async () => {
        browser = await launch(['.', argText], {
          cwd: path.resolve(__dirname, '../fixture'),
          env: {
            TEST_TEXT: varText
          },
          ...opts
        });

        const pages = await browser.pages();

        expect(pages).to.be.an('array').and.to.have.lengthOf(1);

        const page = pages[0];

        const [$env, $arg, $execPath] = await waitForThrowable(async () => {
          const $ps = await page.$$('p');

          expect($ps).to.be.an('array').and.to.have.lengthOf(3);

          return $ps;
        });

        expect(await $env.evaluate(p => p.innerText)).to.equal(varText);
        expect(await $arg.evaluate(p => p.innerText)).to.equal(argText);
        expect(await $execPath.evaluate(p => p.innerText)).to.equal(execPath);
      });
    });
  }
});
