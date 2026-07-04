# Recipes

Short copy paths for common setups.

## Plain HTML

Use the CDN snippet from the README. It is the fastest path because there is nothing to install.

## Static Site Generators

Astro, Eleventy, Hugo, Jekyll, and similar tools can use either path:

- CDN: paste the generated embed into a page/template.
- Local files: copy `terminal.css` and `terminal.js` to your public assets folder, then update the paths.

Example:

```html
<link rel="stylesheet" href="/terminal.css" />
<div id="site-terminal"></div>
<script src="/terminal.js"></script>
```

## Vite Or React

Keep it simple: put `terminal.css` and `terminal.js` in `public/`, then mount after the DOM node exists.

```jsx
import { useEffect } from 'react';

export function SiteTerminal() {
  useEffect(() => {
    window.WebsiteTerminal.mount('#site-terminal', {
      title: 'guest@site: ~',
      commands: {
        about: {
          description: 'what this site is',
          text: 'A small interactive terminal.',
        },
      },
    });
  }, []);

  return <div id="site-terminal" />;
}
```

Load the assets in `index.html`:

```html
<link rel="stylesheet" href="/terminal.css" />
<script src="/terminal.js"></script>
```

## Next.js

Use a client component and load the script once. The easiest path is still the CDN embed in a custom page section. If you use local files, put them in `public/`.

```jsx
'use client';

import Script from 'next/script';

export default function SiteTerminal() {
  return (
    <>
      <link rel="stylesheet" href="/terminal.css" />
      <div id="site-terminal" />
      <Script
        src="/terminal.js"
        onLoad={() => {
          window.WebsiteTerminal.mount('#site-terminal', {
            title: 'guest@site: ~',
            commands: {
              contact: {
                description: 'contact link',
                text: 'https://example.com/contact',
              },
            },
          });
        }}
      />
    </>
  );
}
```

## WordPress, Webflow, Framer, Carrd

Use the CDN mode from the builder and paste it into a custom HTML/embed block. If the platform strips `<script>` tags, this widget cannot run there without the platform's custom-code feature.

## Content Security Policy

If your site uses CSP, allow the chosen asset source:

```http
script-src 'self' https://cdn.jsdelivr.net;
style-src 'self' https://cdn.jsdelivr.net;
```

If inline scripts are blocked, move the `WebsiteTerminal.mount(...)` call into your own JavaScript file.

## What Not To Do

- Do not connect visitor input to a real shell.
- Do not render terminal output with `innerHTML`.
- Do not add a framework just for this widget.
