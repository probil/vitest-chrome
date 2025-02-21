[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner-direct-single.svg)](https://stand-with-ukraine.pp.ua)

---


# `vitest-chrome`

A complete mock of the Chrome API for Chrome extensions, for use
with Vitest.

TypeScript support is built in. Each function and event is based
on the
[`@types/chrome`](https://www.npmjs.com/package/@types/chrome)
package.

## Installation

```sh
npm i vitest-chrome -D
```

Set `chrome` in the global scope during setup so that it is
mocked in imported modules. Add a setup file to `vite.config.js`:

```javascript
// vitest.config.js

export default defineConfig({
  test: {
    // Add this line to your Vitest config (if you don't have it yet)
    setupFiles: './vitest.init.ts',
  }
})
```

Use the setup file to assign the mocked `chrome` object to the
`global` object:

```javascript
// vitest.init.js
import * as chrome from 'vitest-chrome'

// Add chrome object to global scope
Object.assign(global, chrome)
```

Import `chrome` from `vitest-chrome` for Intellisense and linting.
This is the same object as `chrome` in the global scope.

```javascript
import { chrome } from 'vitest-chrome'
```

## Usage

> All of the following code blocks come from
> [`tests/demo.test.ts`](tests/demo.test.ts).

### Events

Each mocked Event has all the normal methods (`addListener`,
`hasListener`, `hasListeners`, and `removeListener`) plus two
more: `callListeners` and `clearListeners`.

`callListeners` triggers a specific Event. Call `callListeners`
with the arguments you expect Chrome to pass to your event
listeners. Each event listener for that Event will be called with
those arguments.

`clearListeners` removes all listeners for a specific Event.

```javascript
import { vi, expect, test } from 'vitest'

test('chrome api events', () => {
  const listenerSpy = vi.fn()
  const sendResponseSpy = vi.fn()

  chrome.runtime.onMessage.addListener(listenerSpy)

  expect(listenerSpy).not.toBeCalled()
  expect(chrome.runtime.onMessage.hasListeners()).toBe(true)

  chrome.runtime.onMessage.callListeners(
    { greeting: 'hello' }, // message
    {}, // MessageSender object
    sendResponseSpy, // SendResponse function
  )

  expect(listenerSpy).toBeCalledWith(
    { greeting: 'hello' },
    {},
    sendResponseSpy,
  )
  expect(sendResponseSpy).not.toBeCalled()
})
```

### Synchronous functions

Some Chrome API functions are synchronous. Use these like any
mocked function:

```javascript
import { expect, test } from 'vitest'

test('chrome api functions', () => {
  const manifest = {
    name: 'my chrome extension',
    manifest_version: 2,
    version: '1.0.0',
  }

  chrome.runtime.getManifest.mockImplementation(() => manifest)

  expect(chrome.runtime.getManifest()).toEqual(manifest)
  expect(chrome.runtime.getManifest).toBeCalled()
})
```

### Functions with callbacks

Most Chrome API functions do something asynchronous. They use
callbacks to handle the result. The mock implementation should be
set to handle the callback.

> Mocked functions have no default mock implementation!

```javascript
import { vi, expect, test } from 'vitest'

test('chrome api functions with callback', () => {
  const message = { greeting: 'hello?' }
  const response = { greeting: 'here I am' }
  const callbackSpy = vi.fn()

  chrome.runtime.sendMessage.mockImplementation(
    (message, callback) => {
      callback(response)
    },
  )

  chrome.runtime.sendMessage(message, callbackSpy)

  expect(chrome.runtime.sendMessage).toBeCalledWith(
    message,
    callbackSpy,
  )
  expect(callbackSpy).toBeCalledWith(response)
})
```

### Callbacks and `chrome.runtime.lastError`

When something goes wrong in a callback, Chrome sets
`chrome.runtime.lastError` to an object with a message property.
If you need to test this, set and clear `lastError` in the mock
implementation.

> Remember that `lastError` is always undefined outside of a
> callback!

`lastError` is an object with a
[getter function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)
for the `message` property. If `message` is not checked, Chrome
will log the error to the console. To emulate this, simply set
`lastError` to an object with a getter that wraps a mock, as seen
below:

```javascript
import { vi, expect, test } from 'vitest'

test('chrome api functions with lastError', () => {
  const message = { greeting: 'hello?' }
  const response = { greeting: 'here I am' }

  // lastError setup
  const lastErrorMessage = 'this is an error'
  const lastErrorGetter = vi.fn(() => lastErrorMessage)
  const lastError = {
    get message() {
      return lastErrorGetter()
    },
  }

  // mock implementation
  chrome.runtime.sendMessage.mockImplementation(
    (message, callback) => {
      chrome.runtime.lastError = lastError

      callback(response)

      // lastError is undefined outside of a callback
      delete chrome.runtime.lastError
    },
  )

  // callback implementation
  const lastErrorSpy = vi.fn()
  const callbackSpy = vi.fn(() => {
    if (chrome.runtime.lastError) {
      lastErrorSpy(chrome.runtime.lastError.message)
    }
  })

  // send a message
  chrome.runtime.sendMessage(message, callbackSpy)

  expect(callbackSpy).toBeCalledWith(response)
  expect(lastErrorGetter).toBeCalled()
  expect(lastErrorSpy).toBeCalledWith(lastErrorMessage)

  // lastError has been cleared
  expect(chrome.runtime.lastError).toBeUndefined()
})
```

### Contributions

The `chrome` object is based on schemas from the Chromium
project, with thanks to
[`sinon-chrome`](https://github.com/acvetkov/sinon-chrome) for
compiling the schemas.

Special thanks to [@jacksteamdev](https://github.com/jacksteamdev)
the author of [`jest-chrome`](https://github.com/extend-chrome/jest-chrome) (which this project is based on)
