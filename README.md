# puptron

[![tests][test.svg]][test.link]
[![npm-downloads][npm-downloads.svg]][npm.link]
[![npm-version][npm-version.svg]][npm.link]

[test.svg]: https://github.com/catdad/puptron/workflows/test/badge.svg
[test.link]: https://github.com/catdad/puptron/actions?query=workflow%3Atest
[npm-downloads.svg]: https://img.shields.io/npm/dm/puptron.svg
[npm.link]: https://www.npmjs.com/package/puptron
[npm-version.svg]: https://img.shields.io/npm/v/puptron.svg

> 🐶 automate your [Electron](https://www.electronjs.org/) application with [Puppeteer](https://pptr.dev/)

Puptron is a handy library to bootstrap the end-to-end test automation of your Electron application. It allows you to launch your application on-demand, instrumented with an instance of `puppeteer`, allowing you to use your favorite test framework to test your application. Puptron does not place any requirements on your application. That means that your applicationd does not need to enable node integration or the remote module, it does not need to expose the `require` method, and it does not need to disable context isolation. Your application can run the same way that your end users will run it.

> 🚨 This module is in early development, but I already use it in a few of my projects. Do know that this API may change. If you find any issues or have any feedback, please [submit an issue](https://github.com/catdad/puptron/issues/new).

## Install

```bash
npm install --development puptron
```

## API

```javascript
const { launch } = require('puptron');
```

### `launch(args, [options = {}])` → `Promise`

This method launches the instrumented application. It has the following arguments:
* `args` _Array&lt;String&gt;_: the arguments to be passed to the Electron application. Think: the arguments that you use to launch the application from the command line. Example: `['.']`
* `[options]` _Object_: options for the Electron process being launched. This object and all its properties are optional. These include:
  ** `cwd` _String_: The current working directory for the application.
  ** `env` _Object_: A key-value pair of environment variables to included when launching the process.

This method will return a promise that resolved to an instance of the Puppeteer [`browser`](https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser) object.

> 📝 _Note that some method, such as `newPage`, may not work. Use your best judgement on what you realisticaly expect a particular method to do in Electron._

## Examples

You can use any test frameworks and tools that you would like, but here are some good choices:

Using [`mocha`](https://mochajs.org/) and [`pptr-testing-library`](https://github.com/testing-library/pptr-testing-library):

```javascript
const path = require('path');
const { launch } = require('puptron');
const { getDocument, queries } = require('pptr-testing-library');

describe('my application', () => {
  let app;

  beforeEach(async () => {
    app = await launch(['.'], {
      // assuming your app is at the root / and your tests are in /test
      cwd: path.resolve(__dirname, '..'),
      env: {
        // some variable your app uses, like a custom test config file
        MY_APP_CONFIG: path.resolve('/path/to/custom/config')
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('does something', async () => {
    // get the main BrowserWindow page
    const [page] = await app.pages();

    // do some testing... this part is up to you
    const $document = await getDocument(page);
    const $button = await queries.getByTestId($document, 'my-button');
    await $button.click();
  });
});
```
