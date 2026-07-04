# Website Terminal

Add a fake terminal to a normal website. It runs only in the browser, prints text from an allowlist of commands, and never executes real shell commands.

## Copy Into Any Site

Copy these two files:

- `terminal.css`
- `terminal.js`

Add a mount point:

```html
<link rel="stylesheet" href="./terminal.css" />

<div id="site-terminal"></div>

<script src="./terminal.js"></script>
<script>
  WebsiteTerminal.mount('#site-terminal', {
    title: 'guest@your-site: ~',
    welcome: ['Website terminal loaded.', 'Type "help" for commands.'],
    commands: {
      about: {
        description: 'who this site is for',
        text: 'Replace this with your about text.',
      },
      contact: {
        description: 'how to reach you',
        text: 'Replace this with your contact link or email.',
      },
    },
  });
</script>
```

Open `index.html` to see the demo.

## Commands

`help` and `clear` are built in.

Add your own commands in the `commands` object:

```js
WebsiteTerminal.mount('#site-terminal', {
  commands: {
    projects: {
      description: 'current work',
      text: '1. Portfolio\n2. Local business software',
    },
    time: {
      description: 'browser time',
      run: () => new Date().toLocaleString(),
    },
  },
});
```

Command output is rendered with `textContent`, not `innerHTML`, so visitor input cannot inject HTML.

## Deploy

This repo is static. GitHub Pages can serve it directly from the repository root.

## License

MIT
