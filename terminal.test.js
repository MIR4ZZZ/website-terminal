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
assert.equal(runCommand('stock', { stock: { description: 'available units', text: 0 } }).text, '0');
assert.equal(runCommand('time', commands).text, 'now');
assert.equal(runCommand('broken', commands).text, 'Command failed.');
assert.match(runCommand('missing', commands).text, /Command not found/);
assert.match(runCommand('toString', commands).text, /Command not found/);
assert.match(runCommand('help').text, /help/);
assert.deepEqual(
  runCommand('help', { help: 'custom help', clear: 'custom clear' }).text.match(/\b(help|clear)\b/g),
  ['help', 'clear'],
);
const reservedHelp = runCommand('help', { Help: 'custom help', CLEAR: 'custom clear', About: 'Uppercase key' }).text;
assert.deepEqual(
  reservedHelp
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/, 1)[0]),
  ['help', 'About', 'clear'],
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
    classList: { add() {}, remove() {} },
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
  const terminal = mount(host, { animate: false });
  assert.equal(terminal.input.attributes['aria-label'], 'Terminal command');
  assert.equal(typeof host.children[0].listeners.click, 'function');
  host.children[0].listeners.click();
  assert.equal(terminal.input.focused, 1);
  const body = host.children[0].children[1];
  const liveStatus = host.children[0].children[3];
  assert.equal(body.attributes['aria-live'], undefined);
  assert.equal(liveStatus.attributes['aria-live'], 'polite');
  assert.equal(liveStatus.attributes['aria-atomic'], 'true');
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
  terminal.input.value = 'help';
  let submitted = false;
  host.children[0].children[2].listeners.submit({
    preventDefault() {
      submitted = true;
    },
  });
  assert.equal(submitted, true);
  assert.match(liveStatus.textContent, /Available commands/);
  terminal.input.value = 'clear';
  host.children[0].children[2].listeners.submit({
    preventDefault() {},
  });
  assert.equal(liveStatus.textContent, 'Terminal cleared.');
  const runResult = terminal.run('help');
  assert.equal(runResult.type, 'output');
  assert.match(liveStatus.textContent, /Available commands/);
  assert.equal(body.children[body.children.length - 2].textContent, '$ help');
  assert.doesNotThrow(() => mount(fakeNode(), { welcome: 'Ready.' }));

  const pendingTimers = [];
  const previousSetTimeout = global.setTimeout;
  const previousClearTimeout = global.clearTimeout;
  global.setTimeout = (callback) => {
    pendingTimers.push(callback);
    return callback;
  };
  global.clearTimeout = () => {};
  try {
    const animatedHost = fakeNode();
    const animated = mount(animatedHost, {
      welcome: [],
      commands: { about: 'Animated reply.' },
      commandTypeSpeed: 1,
      outputTypeSpeed: 1,
    });
    const animatedBody = animatedHost.children[0].children[1];
    const animatedStatus = animatedHost.children[0].children[3];
    const animatedResult = animated.run('about');
    assert.equal(animatedResult.type, 'output');
    assert.equal(animated.input.value, '');
    assert.equal(animatedBody.children.length, 0);
    pendingTimers.shift()();
    assert.equal(animated.input.value, 'a');
    while (pendingTimers.length) pendingTimers.shift()();
    assert.equal(animated.input.value, '');
    assert.equal(animatedStatus.textContent, 'Animated reply.');
    assert.equal(animatedBody.children.at(-2).textContent, '$ about');
    assert.equal(animatedBody.children.at(-1).textContent, 'Animated reply.');

    const manualHost = fakeNode();
    const manual = mount(manualHost, {
      welcome: [],
      commands: { about: 'Typed reply.' },
      outputTypeSpeed: 1,
    });
    const manualBody = manualHost.children[0].children[1];
    manual.input.value = 'about';
    manualHost.children[0].children[2].listeners.submit({ preventDefault() {} });
    assert.equal(manual.input.value, '');
    assert.equal(manualBody.children.at(-2).textContent, '$ about');
    assert.equal(manualBody.children.at(-1).textContent, '');
    while (pendingTimers.length) pendingTimers.shift()();
    assert.equal(manualBody.children.at(-1).textContent, 'Typed reply.');
  } finally {
    global.setTimeout = previousSetTimeout;
    global.clearTimeout = previousClearTimeout;
  }
} finally {
  global.document = previousDocument;
}

const css = fs.readFileSync('./terminal.css', 'utf8');
assert.match(css, /\.website-terminal,\s*\.website-terminal \*\s*{[^}]*box-sizing:\s*border-box;/);
assert.match(css, /\.website-terminal \.wt-input-row:focus-within\s*{/);

const unscopedWidgetSelectors = css
  .split('{')
  .slice(0, -1)
  .flatMap((block) => block.split('}').pop().split(','))
  .map((selector) => selector.trim())
  .filter((selector) => selector.startsWith('.wt-'));

assert.deepEqual(unscopedWidgetSelectors, []);

console.log('terminal checks passed');
