const { spawn } = require('child_process');
const path = require('path');

const electron = require('electron');
const waitForThrowable = require('wait-for-throwable');
const fetch = require('node-fetch');
const getPort = require('get-port');
const fs = require('fs-extra');
const tempDir = require('temp-dir');

const once = async (ev, name) => await new Promise(r => ev.once(name, v => r(v)));
const tmp = () => path.resolve(tempDir, `puptron-${Math.random().toString(36).slice(2)}-user-data`);

module.exports = (args, { execPath = electron, env = {}, ...options }) => {
  let app, stdchunks = [];
  const userData = tmp();

  const getLogs = () => [].concat(stdchunks).map(c => c.toString());

  const stop = async () => {
    const _app = app;
    app = null;

    if (_app) {
      _app.kill();

      await once(_app, 'exit');
      stdchunks = [];
    }

    await fs.remove(userData);
  };

  const start = async () => {
    const browserWSEndpoint = await waitForThrowable(async () => {
      await stop();
      await fs.ensureDir(userData);

      const port = await getPort();

      app = spawn(execPath, [
        `--remote-debugging-port=${port}`,
        '--enable-logging',
        '-v=0',
        `--user-data-dir=${userData}`,
        ...args
      ], {
        ...options,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          // using all existing env variables is required for Linux
          ...process.env,
          ...env
        }
      });

      app.on('exit', code => {
        if (!app) {
          return;
        }

        /* eslint-disable-next-line no-console */
        console.error('Electron process unexpected exit:', `exited with code: ${code}`);
      });
      app.on('error', err => {
        if (!app) {
          return;
        }

        /* eslint-disable-next-line no-console */
        console.error('Electron process unexpected error:', err);
      });

      app.stdout.on('data', chunk => stdchunks.push(chunk));
      app.stderr.on('data', chunk => stdchunks.push(chunk));

      // watch for the logged message:
      // DevTools listening on ws://127.0.0.1:60030/devtools/browser/973afdb7-00af-4311-9663-c8833d51febb
      // also make sure that we can connect to the debug port
      return await waitForThrowable(async () => {
        const startedStr = getLogs().join('').indexOf(`:${port}/devtools/`);

        if (startedStr < 0) {
          throw new Error('devtools not listening yet');
        }

        const res = await fetch(`http://127.0.0.1:${port}/json/version`);

        if (!res.ok) {
          throw new Error(`BAD /json/version respose: ${res.status} "${res.statusText}"`);
        }

        const json = JSON.parse(await res.text());

        // technically, this is the same URL that we found when in the logs above
        return json.webSocketDebuggerUrl;
      }, { total: 5000 });
    }, { count: 3, total: Infinity });

    return { browserWSEndpoint };
  };

  return { start, stop, getLogs };
};
