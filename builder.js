(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WebsiteTerminalBuilder = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const defaultConfig = {
    title: 'guest@your-site: ~',
    welcome: ['Website terminal ready.', 'Commands: about, features, contact', 'Type "help" to list everything.'],
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
    css: 'https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.16/terminal.css',
    js: 'https://cdn.jsdelivr.net/gh/MIR4ZZZ/website-terminal@v1.0.16/terminal.js',
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
    const viewEmbedButton = document.querySelector('#viewEmbedButton');
    const embedDialog = document.querySelector('#embedDialog');
    const copyEmbedDialogButton = document.querySelector('#copyEmbedDialogButton');
    const closeEmbedButton = document.querySelector('#closeEmbedButton');
    const previewPanel = document.querySelector('.preview-panel');
    const commandCountStat = document.querySelector('#commandCountStat');
    const assetModeStat = document.querySelector('#assetModeStat');
    const previewStateStat = document.querySelector('#previewStateStat');
    let config = cloneConfig(defaultConfig);
    let previewTerminal;
    let selectedCommand = '';

    function selectedAssets() {
      return assetSourceInput.value === 'local' ? localAssets : cdnAssets;
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

    function refreshEmbedOutput() {
      embedOutput.value = embedCode(config, selectedAssets());
      return embedOutput.value;
    }

    function updateStats(state = 'Preview synced') {
      const commandCount = Object.keys(config.commands).length;
      commandCountStat.textContent = `${commandCount} command${commandCount === 1 ? '' : 's'}`;
      assetModeStat.textContent = assetSourceInput.value === 'local' ? 'Local files' : 'CDN embed';
      previewStateStat.textContent = state;
    }

    function pulsePreview() {
      if (!previewPanel.classList || typeof root.setTimeout !== 'function') return;
      previewPanel.classList.add('is-refreshing');
      root.setTimeout(() => previewPanel.classList.remove('is-refreshing'), 360);
    }

    function syncSelectedCommandRows() {
      Array.from(commandList.children).forEach((item) => {
        const isSelected = item.dataset.command === selectedCommand;
        item.className = `command-item${isSelected ? ' is-selected' : ''}`;
        if (isSelected) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
    }

    function refresh() {
      previewTerminal = root.WebsiteTerminal.mount('#site-terminal', config);
      pulsePreview();
      refreshEmbedOutput();
      updateStats();
      commandList.replaceChildren();

      const commands = Object.entries(config.commands);
      if (!commands.length) {
        commandList.append(textNode('li', 'command-empty', 'No commands yet. Add one above to populate the terminal.'));
        return;
      }

      commands.forEach(([name, command]) => {
        const item = document.createElement('li');
        item.className = 'command-item';
        item.dataset.command = name;
        const text = document.createElement('div');
        text.append(textNode('div', 'command-name', name));
        text.append(textNode('div', 'command-description', command.description || 'No description'));

        const actions = document.createElement('div');
        actions.className = 'command-actions';

        const run = document.createElement('button');
        run.className = 'secondary run-button';
        run.type = 'button';
        run.textContent = 'Run';
        run.setAttribute('aria-label', `Run ${name} in preview`);
        run.addEventListener('click', () => {
          const result = previewTerminal.run(name);
          selectedCommand = name;
          statusText.textContent =
            result.type === 'output' ? `Ran "${name}" in preview.` : `Could not run "${name}".`;
          updateStats(`Ran ${name}`);
          previewTerminal.input?.focus?.();
          syncSelectedCommandRows();
          pulsePreview();
        });

        const edit = document.createElement('button');
        edit.className = 'secondary edit-button';
        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.setAttribute('aria-label', `Edit ${name}`);
        edit.addEventListener('click', () => {
          selectedCommand = name;
          commandInput.value = name;
          descriptionInput.value = command.description || '';
          answerInput.value = command.text || '';
          statusText.textContent = `Editing "${name}". Save to update.`;
          syncSelectedCommandRows();
          answerInput.focus?.();
        });

        const remove = document.createElement('button');
        remove.className = 'secondary remove-button';
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${name}`);
        remove.addEventListener('click', () => {
          delete config.commands[name];
          if (selectedCommand === name) selectedCommand = '';
          statusText.textContent = `Removed "${name}".`;
          refresh();
          updateStats(`Removed ${name}`);
        });

        actions.append(run, edit, remove);
        item.append(text, actions);
        commandList.append(item);
      });
      syncSelectedCommandRows();
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
      selectedCommand = name;
      commandInput.value = '';
      descriptionInput.value = '';
      answerInput.value = '';
      statusText.textContent = `Saved "${name}". Type it in the terminal preview.`;
      refresh();
      updateStats(`Saved ${name}`);
      commandInput.focus?.();
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
      selectedCommand = '';
      fillBaseFields();
      statusText.textContent = 'Reset to the demo commands.';
      refresh();
    });

    async function copyEmbedCode(feedbackButton) {
      syncBaseConfig();
      const code = refreshEmbedOutput();
      embedOutput.select();

      let copied = false;
      function fallbackCopy() {
        try {
          return document.execCommand('copy');
        } catch (error) {
          return false;
        }
      }
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(code);
          copied = true;
        } else {
          copied = fallbackCopy();
        }
      } catch (error) {
        copied = fallbackCopy();
      }
      statusText.textContent = copied
        ? 'Embed code copied.'
        : 'Copy failed. Select the code and copy manually.';
      if (feedbackButton) {
        feedbackButton.classList.toggle('is-copied', copied);
        feedbackButton.textContent = copied ? 'Copied' : 'Select code';
      }
    }

    copyButton.addEventListener('click', () => copyEmbedCode());
    copyEmbedDialogButton.addEventListener('click', () => copyEmbedCode(copyEmbedDialogButton));

    function closeEmbedDialog() {
      if (typeof embedDialog.close === 'function') embedDialog.close();
      else embedDialog.removeAttribute('open');
      viewEmbedButton.focus?.();
    }

    function openEmbedDialog() {
      syncBaseConfig();
      refreshEmbedOutput();
      copyEmbedDialogButton.classList.remove('is-copied');
      copyEmbedDialogButton.textContent = 'Copy code';
      if (typeof embedDialog.showModal === 'function') embedDialog.showModal();
      else embedDialog.setAttribute('open', '');
      embedOutput.select();
    }

    viewEmbedButton.addEventListener('click', openEmbedDialog);

    closeEmbedButton.addEventListener('click', closeEmbedDialog);
    embedDialog.addEventListener('click', (event) => {
      if (event.target === embedDialog) closeEmbedDialog();
    });
    embedDialog.addEventListener('close', () => viewEmbedButton.focus?.());

    fillBaseFields();
    refresh();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  return { cdnAssets, defaultConfig, embedCode, localAssets, toCommandName };
});
