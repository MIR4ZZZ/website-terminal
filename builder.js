(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WebsiteTerminalBuilder = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const defaultConfig = {
    title: 'guest@your-site: ~',
    welcome: ['Website terminal ready.', 'Type "help" for available commands.'],
    commands: {
      about: {
        description: 'what this is',
        text: 'A browser-only terminal element for a normal website.',
      },
      features: {
        description: 'what it can do',
        text: '1. Add custom commands\n2. Preview visitor responses\n3. Copy a safe embed snippet',
      },
      contact: {
        description: 'contact path',
        text: 'Replace this with your contact form, email, or social link.',
      },
    },
  };
  const localAssets = {
    css: './terminal.css',
    js: './terminal.js',
  };
  const cdnAssets = {
    css: 'https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.10/terminal.css',
    js: 'https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.10/terminal.js',
  };

  function cloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }

  function toCommandName(value) {
    return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  }

  function embedCode(config, assets = localAssets) {
    const json = JSON.stringify(config, null, 2).replace(/<\/script/gi, '<\\/script');
    return `<link rel="stylesheet" href="${assets.css}" />
<div id="site-terminal"></div>
<script src="${assets.js}"></script>
<script>
  WebsiteTerminal.mount('#site-terminal', ${json});
</script>`;
  }

  function textNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function init() {
    if (!root.document || !root.WebsiteTerminal) return;

    const titleInput = document.querySelector('#titleInput');
    const welcomeInput = document.querySelector('#welcomeInput');
    const commandInput = document.querySelector('#commandInput');
    const descriptionInput = document.querySelector('#descriptionInput');
    const answerInput = document.querySelector('#answerInput');
    const assetSourceInput = document.querySelector('#assetSourceInput');
    const commandList = document.querySelector('#commandList');
    const embedOutput = document.querySelector('#embedCode');
    const statusText = document.querySelector('#statusText');
    const form = document.querySelector('#builderForm');
    const resetButton = document.querySelector('#resetButton');
    const copyButton = document.querySelector('#copyButton');
    let config = cloneConfig(defaultConfig);

    function selectedAssets() {
      return assetSourceInput.value === 'cdn' ? cdnAssets : localAssets;
    }

    function syncBaseConfig() {
      config.title = titleInput.value.trim() || defaultConfig.title;
      config.welcome = welcomeInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!config.welcome.length) config.welcome = cloneConfig(defaultConfig.welcome);
    }

    function fillBaseFields() {
      titleInput.value = config.title;
      welcomeInput.value = config.welcome.join('\n');
    }

    function refresh() {
      root.WebsiteTerminal.mount('#site-terminal', config);
      embedOutput.value = embedCode(config, selectedAssets());
      commandList.replaceChildren();

      Object.entries(config.commands).forEach(([name, command]) => {
        const item = document.createElement('li');
        item.className = 'command-item';
        const text = document.createElement('div');
        text.append(textNode('div', 'command-name', name));
        text.append(textNode('div', 'command-description', command.description || 'No description'));

        const remove = document.createElement('button');
        remove.className = 'secondary remove-button';
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
          delete config.commands[name];
          statusText.textContent = `Removed "${name}".`;
          refresh();
        });

        item.append(text, remove);
        commandList.append(item);
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      syncBaseConfig();
      const name = toCommandName(commandInput.value);

      if (!name) {
        statusText.textContent = 'Enter a command name.';
        return;
      }
      if (name === 'help' || name === 'clear') {
        statusText.textContent = `"${name}" is built in. Use another command name.`;
        return;
      }

      config.commands[name] = {
        description: descriptionInput.value.trim() || 'custom command',
        text: answerInput.value.trim() || 'No answer yet.',
      };
      commandInput.value = '';
      descriptionInput.value = '';
      answerInput.value = '';
      statusText.textContent = `Saved "${name}". Type it in the terminal preview.`;
      refresh();
    });

    [titleInput, welcomeInput].forEach((input) => {
      input.addEventListener('input', () => {
        syncBaseConfig();
        refresh();
      });
    });

    assetSourceInput.addEventListener('change', refresh);

    resetButton.addEventListener('click', () => {
      config = cloneConfig(defaultConfig);
      fillBaseFields();
      statusText.textContent = 'Reset to the demo commands.';
      refresh();
    });

    copyButton.addEventListener('click', async () => {
      syncBaseConfig();
      embedOutput.value = embedCode(config, selectedAssets());
      embedOutput.select();
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(embedOutput.value);
        else document.execCommand('copy');
      } catch (error) {
        document.execCommand('copy');
      }
      statusText.textContent = 'Embed code copied.';
    });

    fillBaseFields();
    refresh();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  return { cdnAssets, defaultConfig, embedCode, localAssets, toCommandName };
});
