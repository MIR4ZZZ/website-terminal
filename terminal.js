(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.WebsiteTerminal = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const defaults = {
    title: 'guest@website: ~',
    prompt: '$',
    placeholder: '',
    welcome: ['Website terminal loaded.', 'Type "help" for commands.'],
    commands: {},
    animate: true,
    commandTypeSpeed: 22,
    outputTypeSpeed: 10,
  };

  function commandNames(commands) {
    const names = ['help'];
    Object.keys(commands).forEach((name) => {
      if (name.toLowerCase() !== 'help' && name.toLowerCase() !== 'clear') names.push(name);
    });
    names.push('clear');
    return names;
  }

  function commandDescription(entry) {
    if (entry && typeof entry === 'object' && entry.description) return ` - ${entry.description}`;
    return '';
  }

  function commandText(entry, rawCommand) {
    if (typeof entry === 'function') return String(entry(rawCommand));
    if (entry && typeof entry.run === 'function') return String(entry.run(rawCommand));
    if (entry && typeof entry === 'object' && 'text' in entry) return String(entry.text);
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
    const inputCommand = command.split(/\s+/, 1)[0];
    const commandKey =
      Object.keys(commands).find((name) => name.toLowerCase() === command) ??
      Object.keys(commands).find((name) => name.toLowerCase() === inputCommand);
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

  function render(body, history, revealIndex, revealText) {
    body.replaceChildren();
    history.forEach((item, index) => {
      const row = el('div', 'wt-output', item.text);
      row.dataset.type = item.type;
      if (index === revealIndex) {
        row.classList.add('wt-output-typing');
        revealText(row, item.text);
      }
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
    let timers = [];
    host.classList.add('website-terminal');
    host.replaceChildren();

    const windowNode = el('div', 'wt-window');
    const header = el('div', 'wt-header');
    const dots = el('div', 'wt-dots');
    ['red', 'yellow', 'green'].forEach((color) => dots.append(el('span', `wt-dot wt-dot-${color}`)));
    header.append(dots, el('div', 'wt-title', settings.title));

    const body = el('div', 'wt-body');
    const liveStatus = el('div', 'wt-live-status');
    liveStatus.setAttribute('aria-live', 'polite');
    liveStatus.setAttribute('aria-atomic', 'true');

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
        stopAnimations();
        render(body, history);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        return;
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      input.value = event.key === 'ArrowUp' ? commandHistory.previous() : commandHistory.next();
      input.setSelectionRange(input.value.length, input.value.length);
    });

    function stopAnimations() {
      timers.forEach((timer) => clearTimeout(timer));
      timers = [];
    }

    function schedule(callback, delay) {
      const timer = setTimeout(() => {
        timers = timers.filter((item) => item !== timer);
        callback();
      }, delay);
      timers.push(timer);
    }

    function revealText(row, text) {
      if (!settings.animate) return;
      if (!text.length) {
        row.classList.remove('wt-output-typing');
        return;
      }
      row.textContent = '';
      Array.from(text).forEach((character, index) => {
        schedule(() => {
          row.textContent += character;
          body.scrollTop = body.scrollHeight;
          if (index === text.length - 1) row.classList.remove('wt-output-typing');
        }, index * settings.outputTypeSpeed);
      });
    }

    function commitCommand(rawCommand, result, animateOutput = settings.animate) {
      if (result.type === 'empty') return result;
      const value = String(rawCommand ?? '').trim();
      commandHistory.push(value);
      if (result.type === 'clear') {
        history.length = 0;
        liveStatus.textContent = 'Terminal cleared.';
        render(body, history);
      } else {
        history.push({ type: 'input', text: `${settings.prompt} ${value}` }, result);
        liveStatus.textContent = result.text;
        render(body, history, animateOutput ? history.length - 1 : undefined, revealText);
      }
      return result;
    }

    function submitCommand(rawCommand, animateOutput = settings.animate) {
      return commitCommand(rawCommand, runCommand(rawCommand, settings.commands), animateOutput);
    }

    function typeCommand(rawCommand, done) {
      const value = String(rawCommand ?? '').trim();
      input.value = '';
      Array.from(value).forEach((character, index) => {
        schedule(() => {
          input.value += character;
          input.setSelectionRange?.(input.value.length, input.value.length);
        }, index * settings.commandTypeSpeed);
      });
      schedule(() => {
        input.value = '';
        done();
      }, value.length * settings.commandTypeSpeed + 80);
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      stopAnimations();
      const result = submitCommand(input.value);
      if (result.type !== 'empty') input.value = '';
    });

    windowNode.append(header, body, form, liveStatus);
    host.append(windowNode);
    render(body, history);
    return {
      input,
      run(command) {
        stopAnimations();
        render(body, history);
        const result = runCommand(command, settings.commands);
        if (result.type !== 'empty') {
          if (settings.animate) typeCommand(command, () => commitCommand(command, result));
          else commitCommand(command, result, false);
          input.value = '';
        }
        return result;
      },
    };
  }

  return { createCommandHistory, mount, runCommand };
});
