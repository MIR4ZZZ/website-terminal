const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { cdnAssets, embedCode, toCommandName } = require('./builder.js');

assert.equal(toCommandName(' My Projects! '), 'my-projects');
assert.equal(toCommandName('contact_me'), 'contact_me');

const code = embedCode({
  title: 'guest@test: ~',
  welcome: ['Ready.'],
  commands: {
    about: {
      description: 'safe output',
      text: '</script><img src=x onerror=alert(1)>',
    },
  },
});

assert.match(code, /WebsiteTerminal\.mount/);
assert.match(code, /<\\\/script>/);
assert.doesNotMatch(code, /text: '<\/script>/);
assert.match(embedCode({ title: 'x', welcome: [], commands: {} }, cdnAssets), /cdn\.jsdelivr\.net/);

function node() {
  return {
    dataset: {},
    listeners: {},
    style: {},
    value: '',
    append() {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    replaceChildren() {},
    select() {},
    setAttribute() {},
  };
}

const nodes = new Map();
const fakeDocument = {
  readyState: 'complete',
  addEventListener() {},
  createElement: node,
  execCommand() {},
  querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, node());
    return nodes.get(selector);
  },
};

assert.doesNotThrow(() => {
  vm.runInNewContext(fs.readFileSync('./builder.js', 'utf8'), {
    document: fakeDocument,
    module: { exports: {} },
    navigator: {},
    window: {
      document: fakeDocument,
      WebsiteTerminal: { mount() {} },
    },
  });
});

const copyNodes = new Map();
const copyDocument = {
  readyState: 'complete',
  addEventListener() {},
  createElement: node,
  execCommand() {
    return false;
  },
  querySelector(selector) {
    if (!copyNodes.has(selector)) copyNodes.set(selector, node());
    return copyNodes.get(selector);
  },
};

const copyContext = {
  document: copyDocument,
  module: { exports: {} },
  navigator: {},
  window: {
    document: copyDocument,
    WebsiteTerminal: { mount() {} },
  },
};
vm.runInNewContext(fs.readFileSync('./builder.js', 'utf8'), copyContext);
copyNodes.get('#copyButton').listeners.click();
assert.equal(copyNodes.get('#statusText').textContent, 'Copy failed. Select the code and copy manually.');

console.log('builder checks passed');
