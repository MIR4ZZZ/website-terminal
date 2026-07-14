# Website Terminal

[![Checks](https://github.com/MIR4ZZZ/website-terminal/actions/workflows/checks.yml/badge.svg)](https://github.com/MIR4ZZZ/website-terminal/actions/workflows/checks.yml)
[![GitHub stars](https://img.shields.io/github/stars/MIR4ZZZ/website-terminal?style=social)](https://github.com/MIR4ZZZ/website-terminal/stargazers)
![MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![No dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![Vanilla JS](https://img.shields.io/badge/vanilla-JS-f7df1e.svg)

![Website Terminal builder](assets/demo.png)

Add a safe, fake terminal to any normal website. Visitors type commands like `about`, `features`, or `contact`; your site prints the answers you define.

[Live builder](https://mir4zzz.github.io/website-terminal/) · [CDN example](https://mir4zzz.github.io/website-terminal/examples/cdn.html) · [Minimal example](https://mir4zzz.github.io/website-terminal/examples/minimal.html) · [MIT license](LICENSE)

If this saves you time, star the repo so other people can find it.

## Why Use It

- Vanilla HTML, CSS, and JavaScript
- No build step
- No dependencies
- Browser-only: it never runs real shell commands
- Built-in `help` and `clear`
- ArrowUp and ArrowDown command history
- Ctrl+L keyboard clear
- Escape clears the current input
- Labeled input for screen readers
- Scoped CSS for safer copy-paste embeds
- Command arguments for callback commands
- Safe fallback if a custom command throws
- Deduplicated built-in command names in `help`
- Forgiving `welcome` config for common copy-paste mistakes
- Builder UI that generates the embed code for you

## Fastest Start

Open the [live builder](https://mir4zzz.github.io/website-terminal/), add your commands and answers, then copy the generated embed code.

| If you want to... | Use this |
| --- | --- |
| Add a terminal to a live site quickly | [Live builder](https://mir4zzz.github.io/website-terminal/) |
| Paste one snippet into a custom HTML block | CDN mode |
| Keep all assets in your own repo | Local files mode |
| Fork the whole starter and customize it | [Use this template](https://github.com/new?template_name=website-terminal&template_owner=MIR4ZZZ) |

Want the smallest possible page? Open `examples/minimal.html`. Want a no-download embed? Open `examples/cdn.html`.

The builder can generate CDN links that work anywhere, or local paths when you want to copy `terminal.css` and `terminal.js` into your project.

## Copy Into Any Site

### CDN

Paste this anywhere:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.16/terminal.css" />

<div id="site-terminal"></div>

<script src="https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.16/terminal.js"></script>
<script>
  WebsiteTerminal.mount('#site-terminal', {
    title: 'guest@your-site: ~',
    welcome: ['Website terminal loaded.', 'Type "help" for commands.'],
    commands: {
      about: {
        description: 'what this site is',
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

### Local Files

Or copy these two files beside your page:

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
        description: 'what this site is',
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

## Commands

`help` and `clear` are built in. Add your own commands in the `commands` object:

```js
WebsiteTerminal.mount('#site-terminal', {
  commands: {
    contact: {
      description: 'contact link',
      text: 'https://example.com/contact',
    },
    time: {
      description: 'browser time',
      run: () => new Date().toLocaleString(),
    },
  },
});
```

Command output is rendered with `textContent`, not `innerHTML`, so visitor input cannot inject HTML.

## API Reference

Mount the widget with `WebsiteTerminal.mount(target, options)`.

| Option | Type | Default |
| --- | --- | --- |
| `target` | CSS selector or DOM element | Required |
| `title` | string | `guest@website: ~` |
| `prompt` | string | `$` |
| `placeholder` | string | `Type "help" and press Enter...` |
| `welcome` | string or string[] | `['Website terminal loaded.', 'Type "help" for commands.']` |
| `commands` | object | `{}` |

Command names are matched case-insensitively. If the full typed line is not a command, the first word is matched as the command and the full line is passed to callbacks. `help` and `clear` stay reserved for the built-in help list and screen clear action.

Each command can be a plain string, a function, or an object:

```js
commands: {
  about: 'A short static answer.',
  time: () => new Date().toLocaleString(),
  contact: {
    description: 'contact link',
    text: 'https://example.com/contact',
  },
  echo: {
    description: 'repeat the raw command',
    run: (rawCommand) => `You typed: ${rawCommand}`,
  },
}
```

Callback return values and object `text` values are converted to text before rendering.

## Customize

Change the terminal colors with CSS variables:

```css
.website-terminal {
  --wt-bg: rgba(6, 8, 10, 0.95);
  --wt-border: rgba(255, 255, 255, 0.12);
  --wt-panel: rgba(255, 255, 255, 0.055);
  --wt-text: #f5f7fa;
  --wt-muted: #aeb7b2;
  --wt-accent: #8fe6bf;
  --wt-prompt: #f6c177;
}
```

## Development

```bash
npm test
```

The tests check syntax, command behavior, and the builder embed generator. There is no package install step.

## Safety Model

This is a fake terminal. It only matches commands from your allowlist and prints text in the browser. Do not wire raw visitor input to a real shell.

## License

MIT
