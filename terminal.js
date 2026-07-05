(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WebsiteTerminal = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const defaults = {
    title: 'guest@website: ~',
    prompt: '$',
    placeholder: 'Type "help" and press Enter...',
    welcome: ['Website terminal loaded.', 'Type "help" for commands.'],
    commands: {},
  };

  function commandNames(commands) {
    return [...new Set(['help', ...Object.keys(commands), 'clear'])];
  }

  function commandDescription(entry) {
    if (entry && typeof entry === 'object' && entry.description) return ` - ${entry.description}`;
    return '';
  }

  function commandText(entry, rawCommand) {
    if (typeof entry === 'function') return entry(rawCommand);
    if (entry && typeof entry.run === 'function') return entry.run(rawCommand);
    if (entry && typeof entry.text === 'string') return entry.text;
    return String(entry);
  }

  function runCommand(rawCommand, commands = {}) {
    commands = commands && typeof commands === 'object' ? commands : {};
    const rawInput = String(rawCommand ?? '').trim();
    const command = rawInput.toLowerCase();
    if (!command) return { type: 'empty' };
    if (command === 'clear') return { type: 'clear' };
    if (command === 'help') {
      return {
        type: 'output',
        text: `Available commands:\n${commandNames(commands)
          .map((name) => `  ${name}${commandDescription(commands[name])}`)
          .join('\n')}`,
      };
    }
    const commandKey = Object.prototype.hasOwnProperty.call(commands, command)
      ? command
      : Object.keys(commands).find((name) => name.toLowerCase() === command);
    if (commandKey !== undefined) {
      try {
        return { type: 'output', text: commandText(commands[commandKey], rawInput) };
      } catch (error) {
        return { type: 'output', text: 'Command failed.' };
      }
    }
    return { type: 'output', text: `Command not found: "${rawInput}". Type "help".` };
  }

  function createCommandHistory() {
    const entries = [];
    let index = 0;

    return {
      push(command) {
        const value = command.trim();
        if (!value) return;
        entries.push(value);
        index = entries.length;
      },
      previous() {
        if (!entries.length) return '';
        index = Math.max(0, index - 1);
        return entries[index] || '';
      },
      next() {
        if (!entries.length) return '';
        index = Math.min(entries.length, index + 1);
        return index === entries.length ? '' : entries[index];
      },
    };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function render(body, history) {
    body.replaceChildren();
    history.forEach((item) => {
      const row = el('div', 'wt-output', item.text);
      row.dataset.type = item.type;
      body.append(row);
    });
    body.scrollTop = body.scrollHeight;
  }

  function mount(target, options) {
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error('WebsiteTerminal target not found');

    const settings = { ...defaults, ...options };
    const welcome = Array.isArray(settings.welcome) ? settings.welcome : [settings.welcome];
    const history = welcome.filter((text) => text != null).map((text) => ({ type: 'system', text: String(text) }));
    const commandHistory = createCommandHistory();
    host.classList.add('website-terminal');
    host.replaceChildren();

    const windowNode = el('div', 'wt-window');
    const header = el('div', 'wt-header');
    const dots = el('div', 'wt-dots');
    ['red', 'yellow', 'green'].forEach((color) => dots.append(el('span', `wt-dot wt-dot-${color}`)));
    header.append(dots, el('div', 'wt-title', settings.title));

    const body = el('div', 'wt-body');
    body.setAttribute('aria-live', 'polite');

    const form = el('form', 'wt-input-row');
    const line = el('label', 'wt-line');
    const input = el('input', 'wt-input');
    input.type = 'text';
    input.placeholder = settings.placeholder;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Terminal command');
    line.append(el('span', 'wt-prompt', settings.prompt), input);
    form.append(line);
    windowNode.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        history.length = 0;
        render(body, history);
        return;
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      input.value = event.key === 'ArrowUp' ? commandHistory.previous() : commandHistory.next();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const rawCommand = input.value.trim();
      const result = runCommand(rawCommand, settings.commands);
      if (result.type === 'empty') return;
      commandHistory.push(rawCommand);
      if (result.type === 'clear') {
        history.length = 0;
      } else {
        history.push({ type: 'input', text: `${settings.prompt} ${rawCommand}` }, result);
      }
      input.value = '';
      render(body, history);
    });

    windowNode.append(header, body, form);
    host.append(windowNode);
    render(body, history);
    return { input, run: (command) => runCommand(command, settings.commands) };
  }

  return { createCommandHistory, mount, runCommand };
});
