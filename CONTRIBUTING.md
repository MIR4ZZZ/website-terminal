# Contributing

Keep the widget dependency-free and easy to copy.

Before opening a pull request:

```bash
npm test
```

Rules:

- Do not execute real shell commands.
- Do not render user-provided command text with `innerHTML`.
- Keep `terminal.css` and `terminal.js` usable without a build step.
