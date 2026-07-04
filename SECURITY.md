# Security

Website Terminal is browser-only and fake by design. It must not execute real shell commands or send visitor input to a shell.

If you report a security issue, include:

- affected file
- reproduction steps
- expected impact

Avoid adding features that use `innerHTML` for command output. Use `textContent` or equivalent escaping.
