const assert = require('node:assert/strict');
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

console.log('builder checks passed');
