const assert = require('node:assert/strict');
const { createCommandHistory, mount, runCommand } = require('./terminal.js');

const commands = {
  about: { description: 'who this is', text: 'Browser-only terminal.' },
  time: { description: 'dynamic value', run: () => 'now' },
};

assert.equal(runCommand('', commands).type, 'empty');
assert.equal(runCommand('clear', commands).type, 'clear');
assert.match(runCommand('help', commands).text, /about - who this is/);
assert.equal(runCommand('about', commands).text, 'Browser-only terminal.');
assert.equal(runCommand('time', commands).text, 'now');
assert.match(runCommand('missing', commands).text, /Command not found/);
assert.match(runCommand('toString', commands).text, /Command not found/);

const history = createCommandHistory();
assert.equal(history.previous(), '');
history.push('about');
history.push('projects');
assert.equal(history.previous(), 'projects');
assert.equal(history.previous(), 'about');
assert.equal(history.previous(), 'about');
assert.equal(history.next(), 'projects');
assert.equal(history.next(), '');
assert.equal(history.next(), '');

function fakeNode() {
  return {
    attributes: {},
    children: [],
    classList: { add() {} },
    dataset: {},
    append(...nodes) {
      this.children.push(...nodes);
    },
    addEventListener() {},
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

const previousDocument = global.document;
try {
  global.document = { createElement: fakeNode };
  const terminal = mount(fakeNode());
  assert.equal(terminal.input.attributes['aria-label'], 'Terminal command');
} finally {
  global.document = previousDocument;
}

console.log('terminal checks passed');
