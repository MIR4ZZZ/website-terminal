const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { embedCode, toCommandName } = require('./builder.js');

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

function node() {
  return {
    dataset: {},
    style: {},
    value: '',
    append() {},
    addEventListener() {},
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

console.log('builder checks passed');
