const assert = require('node:assert/strict');
const { runCommand } = require('./terminal.js');

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

console.log('terminal checks passed');
