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
  const classNames = new Set();
  return {
    attributes: {},
    children: [],
    classList: {
      add(name) {
        classNames.add(name);
      },
      remove(name) {
        classNames.delete(name);
      },
      contains(name) {
        return classNames.has(name);
      },
      toggle(name, force) {
        const shouldAdd = force ?? !classNames.has(name);
        if (shouldAdd) classNames.add(name);
        else classNames.delete(name);
        return shouldAdd;
      },
    },
    dataset: {},
    listeners: {},
    style: {},
    textContent: '',
    value: '',
    append(...children) {
      this.children.push(...children);
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    focus() {
      this.focused = true;
    },
    replaceChildren() {
      this.children = [];
    },
    select() {},
    setAttribute(name, value = '') {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
  };
}

const nodes = new Map();
const runCalls = [];
const previewInput = node();
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
      setTimeout(callback) {
        callback();
      },
      WebsiteTerminal: {
        mount() {
          return {
            input: previewInput,
            run(command) {
              runCalls.push(command);
              return { type: 'output', text: `ran ${command}` };
            },
          };
        },
      },
    },
  });
});

assert.equal(nodes.get('#commandCountStat').textContent, '3 commands');
assert.equal(nodes.get('#assetModeStat').textContent, 'CDN embed');
assert.equal(nodes.get('#previewStateStat').textContent, 'Preview synced');
const firstCommandActions = nodes.get('#commandList').children[0].children[1];
assert.equal(firstCommandActions.children[0].attributes['aria-label'], 'Run about in preview');
assert.equal(firstCommandActions.children[1].attributes['aria-label'], 'Edit about');
assert.equal(firstCommandActions.children[2].attributes['aria-label'], 'Remove about');
firstCommandActions.children[0].listeners.click();
assert.deepEqual(runCalls, ['about']);
assert.equal(nodes.get('#statusText').textContent, 'Ran "about" in preview.');
assert.equal(nodes.get('#previewStateStat').textContent, 'Ran about');
assert.match(nodes.get('#commandList').children[0].className, /is-selected/);
assert.equal(nodes.get('#commandList').children[0].attributes['aria-current'], 'true');
assert.equal(previewInput.focused, true);
firstCommandActions.children[1].listeners.click();
assert.equal(nodes.get('#commandInput').value, 'about');
assert.equal(nodes.get('#descriptionInput').value, 'what this is');
assert.match(nodes.get('#answerInput').value, /browser-only terminal/i);
assert.equal(nodes.get('#answerInput').focused, true);
assert.equal(nodes.get('#statusText').textContent, 'Editing "about". Save to update.');
nodes.get('#commandInput').value = 'pricing';
nodes.get('#descriptionInput').value = 'plans';
nodes.get('#answerInput').value = 'Custom plans.';
nodes.get('#builderForm').listeners.submit({ preventDefault() {} });
assert.equal(nodes.get('#commandCountStat').textContent, '4 commands');
assert.equal(nodes.get('#previewStateStat').textContent, 'Saved pricing');
assert.match(nodes.get('#commandList').children[3].className, /is-selected/);
assert.equal(nodes.get('#commandInput').focused, true);
while (!nodes.get('#commandList').children[0].className.includes('command-empty')) {
  nodes.get('#commandList').children[0].children[1].children[2].listeners.click();
}
assert.equal(nodes.get('#commandCountStat').textContent, '0 commands');
assert.match(nodes.get('#commandList').children[0].textContent, /No commands yet/);

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
    setTimeout(callback) {
      callback();
    },
    WebsiteTerminal: { mount() {} },
  },
};
vm.runInNewContext(fs.readFileSync('./builder.js', 'utf8'), copyContext);
copyNodes.get('#copyButton').listeners.click({ type: 'click' });
assert.equal(copyNodes.get('#statusText').textContent, 'Copy failed. Select the code and copy manually.');
assert.equal(copyNodes.get('#copyButton').textContent, '');
copyNodes.get('#viewEmbedButton').listeners.click();
assert.equal(copyNodes.get('#embedDialog').attributes.open, '');
assert.equal(copyNodes.get('#copyEmbedDialogButton').textContent, 'Copy code');
copyNodes.get('#copyEmbedDialogButton').listeners.click();
assert.equal(copyNodes.get('#statusText').textContent, 'Copy failed. Select the code and copy manually.');
assert.equal(copyNodes.get('#copyEmbedDialogButton').textContent, 'Select code');
assert.equal(copyNodes.get('#copyEmbedDialogButton').classList.contains('is-copied'), false);
copyNodes.get('#viewEmbedButton').listeners.click();
assert.equal(copyNodes.get('#copyEmbedDialogButton').textContent, 'Copy code');
assert.equal(copyNodes.get('#copyEmbedDialogButton').classList.contains('is-copied'), false);
copyNodes.get('#embedDialog').listeners.click({ target: copyNodes.get('#embedDialog') });
assert.equal(copyNodes.get('#embedDialog').attributes.open, undefined);
assert.equal(copyNodes.get('#viewEmbedButton').focused, true);
copyNodes.get('#viewEmbedButton').listeners.click();
copyNodes.get('#viewEmbedButton').focused = false;
copyNodes.get('#closeEmbedButton').listeners.click();
assert.equal(copyNodes.get('#embedDialog').attributes.open, undefined);
assert.equal(copyNodes.get('#viewEmbedButton').focused, true);
copyNodes.get('#viewEmbedButton').focused = false;
copyNodes.get('#embedDialog').listeners.close();
assert.equal(copyNodes.get('#viewEmbedButton').focused, true);

const throwCopyNodes = new Map();
const throwCopyDocument = {
  readyState: 'complete',
  addEventListener() {},
  createElement: node,
  execCommand() {
    throw new Error('copy failed');
  },
  querySelector(selector) {
    if (!throwCopyNodes.has(selector)) throwCopyNodes.set(selector, node());
    return throwCopyNodes.get(selector);
  },
};

vm.runInNewContext(fs.readFileSync('./builder.js', 'utf8'), {
  document: throwCopyDocument,
  module: { exports: {} },
  navigator: {},
  window: {
    document: throwCopyDocument,
    setTimeout(callback) {
      callback();
    },
    WebsiteTerminal: { mount() {} },
  },
});
assert.doesNotThrow(() => throwCopyNodes.get('#copyButton').listeners.click({ type: 'click' }));
assert.equal(throwCopyNodes.get('#statusText').textContent, 'Copy failed. Select the code and copy manually.');

console.log('builder checks passed');
