const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createCommandHistory, mount, runCommand } = require('./terminal.js');

const commands = {
  about: { description: 'who this is', text: 'Browser-only terminal.' },
  time: { description: 'dynamic value', run: () => 'now' },
  broken: {
    description: 'throws',
    run: () => {
      throw new Error('private stack details');
    },
  },
};

assert.equal(runCommand('', commands).type, 'empty');
assert.equal(runCommand('clear', commands).type, 'clear');
assert.match(runCommand('help', commands).text, /about - who this is/);
assert.equal(runCommand('about', commands).text, 'Browser-only terminal.');
assert.equal(runCommand('about', { About: 'Uppercase key works.' }).text, 'Uppercase key works.');
assert.equal(runCommand('echo hello world', { echo: (rawCommand) => rawCommand }).text, 'echo hello world');
assert.equal(runCommand('count', { count: () => 0 }).text, '0');
assert.equal(runCommand('time', commands).text, 'now');
assert.equal(runCommand('broken', commands).text, 'Command failed.');
assert.match(runCommand('missing', commands).text, /Command not found/);
assert.match(runCommand('toString', commands).text, /Command not found/);
assert.match(runCommand('help').text, /help/);
assert.deepEqual(
  runCommand('help', { help: 'custom help', clear: 'custom clear' }).text.match(/\b(help|clear)\b/g),
  ['help', 'clear'],
);
assert.equal(runCommand().type, 'empty');
assert.match(runCommand(404, { 404: 'Not found.' }).text, /Not found/);

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
    focused: 0,
    listeners: {},
    append(...nodes) {
      this.children.push(...nodes);
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    focus() {
      this.focused += 1;
    },
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
  const host = fakeNode();
  const terminal = mount(host);
  assert.equal(terminal.input.attributes['aria-label'], 'Terminal command');
  assert.equal(typeof host.children[0].listeners.click, 'function');
  host.children[0].listeners.click();
  assert.equal(terminal.input.focused, 1);
  const body = host.children[0].children[1];
  assert.equal(body.children.length, 2);
  let prevented = false;
  terminal.input.listeners.keydown({
    key: 'l',
    ctrlKey: true,
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(body.children.length, 0);
  terminal.input.value = 'draft command';
  let escapePrevented = false;
  terminal.input.listeners.keydown({
    key: 'Escape',
    preventDefault() {
      escapePrevented = true;
    },
  });
  assert.equal(escapePrevented, true);
  assert.equal(terminal.input.value, '');
  assert.equal(body.children.length, 0);
  assert.doesNotThrow(() => mount(fakeNode(), { welcome: 'Ready.' }));
} finally {
  global.document = previousDocument;
}

const css = fs.readFileSync('./terminal.css', 'utf8');
assert.match(css, /\.website-terminal,\s*\.website-terminal \*\s*{[^}]*box-sizing:\s*border-box;/);

const unscopedWidgetSelectors = css
  .split('{')
  .slice(0, -1)
  .flatMap((block) => block.split('}').pop().split(','))
  .map((selector) => selector.trim())
  .filter((selector) => selector.startsWith('.wt-'));

assert.deepEqual(unscopedWidgetSelectors, []);

console.log('terminal checks passed');
