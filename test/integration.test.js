const http = require('http');

const { expect } = require('chai');
const getPort = require('get-port');

const { launch } = require('../');

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
    const text = 'pineapples';

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

      const $p = await page.waitFor('p');
      const actualText = await $p.evaluate(p => p.innerText);

      expect(actualText).to.equal(text);
    });
  });
});
