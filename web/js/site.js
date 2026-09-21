(() => {
  const scriptElement = document.currentScript;
  const storagePrefix = 'aade-r6:';
  const completionIndexKey = `${storagePrefix}completion-index`;

  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const defaults = {
    default_locale: 'en',
    enabled_locales: ['en', 'uk'],
    locale_labels: { en: 'EN', uk: 'УКР' },
    ui_visibility: {
      locale_switch: true,
      locale_landing: true,
      progress_controls: true,
      self_checks: true,
      troubleshooting: true,
      expected_results: true,
      checkpoints: true,
      workbook_navigation: true,
      visual_maps: true,
      copy_templates: true,
      day_self_checks: true,
      reading_progress: true,
      day_completion: true
    },
    redirect_disabled_locale: true
  };

  const fallbackStrings = {
    en: {
      copy: 'Copy', copied: 'Copied', copy_failed: 'Copy failed',
      show_help: 'Show help', hide_help: 'Hide help',
      check_answer: 'Check answer', choose_answer: 'Choose an answer first.',
      correct: 'Correct.', incorrect: 'Not yet.',
      mark_complete: 'Mark complete', completed: 'Completed',
      reset_progress: 'Reset progress', progress_reset: 'Local progress reset.'
    },
    uk: {
      copy: 'Копіювати', copied: 'Скопійовано', copy_failed: 'Не вдалося скопіювати',
      show_help: 'Показати підказку', hide_help: 'Сховати підказку',
      check_answer: 'Перевірити відповідь', choose_answer: 'Спочатку оберіть відповідь.',
      correct: 'Правильно.', incorrect: 'Ще ні.',
      mark_complete: 'Позначити виконаним', completed: 'Виконано',
      reset_progress: 'Скинути прогрес', progress_reset: 'Локальний прогрес скинуто.'
    }
  };

  function equivalentLocaleUrl(targetLocale, currentLocale) {
    const url = new URL(window.location.href);
    const marker = `/${currentLocale}/`;
    if (url.pathname.includes(marker)) {
      url.pathname = url.pathname.replace(marker, `/${targetLocale}/`);
      return url.href;
    }
    return new URL(`${targetLocale}/`, url).href;
  }

  function renderLocaleSwitch(runtime, currentLocale) {
    const fallbackLink = document.querySelector('.lang-link');
    if (!fallbackLink) return;

    const enabled = runtime.enabled_locales;
    if (!runtime.ui_visibility.locale_switch || enabled.length < 2 || !enabled.includes(currentLocale)) {
      fallbackLink.remove();
      return;
    }

    const group = document.createElement('nav');
    group.className = 'locale-switch';
    group.setAttribute('aria-label', currentLocale === 'uk' ? 'Мова' : 'Language');

    enabled.forEach((locale, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'locale-switch-separator';
        separator.setAttribute('aria-hidden', 'true');
        separator.textContent = '/';
        group.appendChild(separator);
      }

      const label = runtime.locale_labels?.[locale] || locale.toUpperCase();
      if (locale === currentLocale) {
        const current = document.createElement('span');
        current.className = 'locale-switch-item is-current';
        current.setAttribute('aria-current', 'true');
        current.textContent = label;
        group.appendChild(current);
      } else {
        const link = document.createElement('a');
        link.className = 'locale-switch-item';
        link.href = equivalentLocaleUrl(locale, currentLocale);
        link.hreflang = locale;
        link.lang = locale;
        link.textContent = label;
        group.appendChild(link);
      }
    });

    fallbackLink.replaceWith(group);
  }

  function applyLandingConfig(runtime) {
    const landing = document.querySelector('.locale-landing');
    if (!landing) return false;

    document.querySelectorAll('[data-locale-option]').forEach((option) => {
      const locale = option.getAttribute('data-locale-option');
      option.hidden = !runtime.enabled_locales.includes(locale);
    });

    const shouldRedirect = !runtime.ui_visibility.locale_landing || runtime.enabled_locales.length === 1;
    if (shouldRedirect) {
      const target = runtime.enabled_locales.includes(runtime.default_locale)
        ? runtime.default_locale
        : runtime.enabled_locales[0];
      if (target) {
        window.location.replace(new URL(`${target}/`, window.location.href).href);
        return true;
      }
    }
    return false;
  }

  function redirectDisabledLocale(runtime, currentLocale) {
    if (!currentLocale || runtime.enabled_locales.includes(currentLocale) || !runtime.redirect_disabled_locale) {
      return false;
    }

    const target = runtime.enabled_locales.includes(runtime.default_locale)
      ? runtime.default_locale
      : runtime.enabled_locales[0];

    if (!target) return false;
    window.location.replace(equivalentLocaleUrl(target, currentLocale));
    return true;
  }

  function scriptRelativeUrl(path) {
    const scriptUrl = scriptElement?.src ? new URL(scriptElement.src) : new URL('js/site.js', window.location.href);
    return new URL(path, scriptUrl);
  }

  async function loadRuntimeConfig() {
    let runtime = structuredClone(defaults);

    try {
      const response = await fetch(scriptRelativeUrl('../data/site.json'), { cache: 'no-store' });
      if (response.ok) {
        const config = await response.json();
        const supplied = config.runtime_config || {};
        runtime = {
          ...defaults,
          ...supplied,
          locale_labels: {
            ...defaults.locale_labels,
            ...(supplied.locale_labels || {})
          },
          ui_visibility: {
            ...defaults.ui_visibility,
            ...(supplied.ui_visibility || {})
          }
        };
      }
    } catch (_) {
      // The static site remains usable if configuration loading fails.
    }

    runtime.enabled_locales = Array.isArray(runtime.enabled_locales)
      ? runtime.enabled_locales.filter(Boolean)
      : [...defaults.enabled_locales];

    return runtime;
  }

  async function loadUiStrings(locale) {
    const fallback = fallbackStrings[locale] || fallbackStrings.en;
    try {
      const response = await fetch(scriptRelativeUrl(`../data/ui.${locale}.json`), { cache: 'no-store' });
      if (!response.ok) return fallback;
      return { ...fallback, ...(await response.json()) };
    } catch (_) {
      return fallback;
    }
  }

  async function loadWorkbookContent(locale) {
    try {
      const response = await fetch(scriptRelativeUrl(`../data/workbook.${locale}.json`), { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function applyFeatureVisibility(runtime) {
    document.querySelectorAll('[data-feature]').forEach((element) => {
      const feature = element.getAttribute('data-feature');
      if (Object.prototype.hasOwnProperty.call(runtime.ui_visibility, feature)) {
        element.hidden = runtime.ui_visibility[feature] === false;
      }
    });
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    if (!ok) throw new Error('copy failed');
  }

  function initialiseCopyButtons(strings) {
    document.querySelectorAll('[data-copy-button]').forEach((button) => {
      const targetSelector = button.getAttribute('data-copy-target');
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      const status = button.parentElement?.querySelector('[data-copy-status]');
      button.textContent = strings.copy;

      button.addEventListener('click', async () => {
        const text = target?.textContent ?? button.getAttribute('data-copy-value') ?? '';
        try {
          await copyText(text.trim());
          button.textContent = strings.copied;
          if (status) status.textContent = strings.copied;
          window.setTimeout(() => { button.textContent = strings.copy; }, 1600);
        } catch (_) {
          if (status) status.textContent = strings.copy_failed;
        }
      });
    });
  }

  function initialiseRevealControls(strings) {
    document.querySelectorAll('[data-reveal-control]').forEach((button) => {
      const target = document.getElementById(button.getAttribute('aria-controls'));
      if (!target) return;

      const sync = () => {
        const open = !target.hidden;
        button.setAttribute('aria-expanded', String(open));
        button.textContent = open ? strings.hide_help : strings.show_help;
      };

      sync();
      button.addEventListener('click', () => {
        target.hidden = !target.hidden;
        sync();
      });
    });
  }

  function initialiseSelfChecks(strings) {
    document.querySelectorAll('[data-self-check]').forEach((container) => {
      const submit = container.querySelector('[data-self-check-submit]');
      const feedback = container.querySelector('[data-self-check-feedback]');
      if (!submit || !feedback) return;
      submit.textContent = strings.check_answer;

      submit.addEventListener('click', () => {
        const selected = container.querySelector('input[type="radio"]:checked');
        if (!selected) {
          feedback.textContent = strings.choose_answer;
          feedback.className = 'self-check-feedback';
          return;
        }

        const correct = selected.value === container.getAttribute('data-correct');
        const detail = correct
          ? container.getAttribute('data-correct-feedback')
          : container.getAttribute('data-incorrect-feedback');
        feedback.textContent = `${correct ? strings.correct : strings.incorrect}${detail ? ` ${detail}` : ''}`;
        feedback.className = `self-check-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
      });
    });
  }

  function readCompletionIndex() {
    try {
      const parsed = JSON.parse(localStorage.getItem(completionIndexKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function registerCompletionKey(key) {
    try {
      const keys = new Set(readCompletionIndex());
      keys.add(key);
      localStorage.setItem(completionIndexKey, JSON.stringify([...keys]));
    } catch (_) {
      // Completion remains optional if storage is unavailable.
    }
  }

  function initialiseCompletionControls(strings) {
    document.querySelectorAll('[data-completion-id]').forEach((button) => {
      const id = button.getAttribute('data-completion-id');
      const key = `${storagePrefix}${id}`;

      const sync = () => {
        let complete = false;
        try { complete = localStorage.getItem(key) === 'complete'; } catch (_) {}
        button.classList.toggle('is-complete', complete);
        button.setAttribute('aria-pressed', String(complete));
        button.textContent = complete ? strings.completed : strings.mark_complete;
      };

      sync();
      button.addEventListener('click', () => {
        try {
          const complete = localStorage.getItem(key) === 'complete';
          if (complete) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, 'complete');
            registerCompletionKey(key);
          }
        } catch (_) {}
        sync();
      });
    });

    document.querySelectorAll('[data-reset-progress]').forEach((button) => {
      const status = button.parentElement?.querySelector('[data-reset-status]');
      button.textContent = strings.reset_progress;
      button.addEventListener('click', () => {
        try {
          readCompletionIndex().forEach((key) => localStorage.removeItem(key));
          localStorage.removeItem(completionIndexKey);
        } catch (_) {}
        document.querySelectorAll('[data-completion-id]').forEach((control) => {
          control.classList.remove('is-complete');
          control.setAttribute('aria-pressed', 'false');
          control.textContent = strings.mark_complete;
        });
        if (status) status.textContent = strings.progress_reset;
      });
    });
  }

  function initialiseInteractions(strings) {
    initialiseCopyButtons(strings);
    initialiseRevealControls(strings);
    initialiseSelfChecks(strings);
    initialiseCompletionControls(strings);
  }

  function getDayNumber() {
    const match = window.location.pathname.match(/\/day-(\d+)\.html$/);
    return match ? match[1] : null;
  }

  function ensureWorkbookStylesheet() {
    if (document.querySelector('link[data-workbook-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = scriptRelativeUrl('../css/workbook.css').href;
    link.setAttribute('data-workbook-css', 'true');
    document.head.appendChild(link);
  }

  function decorateGuidedSteps(main) {
    main.querySelectorAll('ol').forEach((list) => list.classList.add('guided-steps'));
  }

  function buildWorkbookNavigation(main, headings, labels) {
    if (!headings.length) return { nav: null, links: [] };

    const navElement = document.createElement('nav');
    navElement.className = 'workbook-nav';
    navElement.setAttribute('data-feature', 'workbook_navigation');
    navElement.setAttribute('aria-label', labels.on_this_page);

    const title = document.createElement('p');
    title.className = 'workbook-nav-title';
    title.textContent = labels.on_this_page;
    navElement.appendChild(title);

    const linksContainer = document.createElement('div');
    linksContainer.className = 'workbook-nav-links';
    const links = [];

    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `workbook-section-${index + 1}`;
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      linksContainer.appendChild(link);
      links.push(link);
    });

    navElement.appendChild(linksContainer);
    const hero = main.querySelector('.hero');
    hero?.insertAdjacentElement('afterend', navElement);
    return { nav: navElement, links };
  }

  function buildReadingProgress(main, headings, labels, navElement) {
    if (!headings.length) return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'workbook-progress';
    wrapper.setAttribute('data-feature', 'reading_progress');

    const row = document.createElement('div');
    row.className = 'workbook-progress-row';
    const name = document.createElement('strong');
    name.textContent = labels.workbook_progress;
    const section = document.createElement('span');
    section.textContent = `${labels.section_progress} 1 / ${headings.length}`;
    row.append(name, section);

    const track = document.createElement('div');
    track.className = 'workbook-progress-track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', labels.workbook_progress);
    track.setAttribute('aria-valuemin', '1');
    track.setAttribute('aria-valuemax', String(headings.length));
    track.setAttribute('aria-valuenow', '1');
    const bar = document.createElement('div');
    bar.className = 'workbook-progress-bar';
    track.appendChild(bar);
    wrapper.append(row, track);

    if (navElement) navElement.insertAdjacentElement('beforebegin', wrapper);
    else main.querySelector('.hero')?.insertAdjacentElement('afterend', wrapper);

    return { wrapper, section, track };
  }

  function observeWorkbookSections(headings, links, progress, labels) {
    const setCurrent = (index) => {
      links.forEach((link, linkIndex) => link.classList.toggle('is-current', linkIndex === index));
      if (progress) {
        const current = index + 1;
        progress.section.textContent = `${labels.section_progress} ${current} / ${headings.length}`;
        progress.track.setAttribute('aria-valuenow', String(current));
        progress.wrapper.style.setProperty('--workbook-progress', `${(current / headings.length) * 100}%`);
      }
    };

    setCurrent(0);
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const index = headings.indexOf(visible[0].target);
      if (index >= 0) setCurrent(index);
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });

    headings.forEach((heading) => observer.observe(heading));
  }

  function injectVisualMap(main, dayData, labels, anchor) {
    if (!dayData?.map?.length) return;
    const section = document.createElement('section');
    section.className = 'visual-map';
    section.setAttribute('data-feature', 'visual_maps');

    const header = document.createElement('div');
    header.className = 'visual-map-header';
    header.innerHTML = `<h2>${labels.learning_map}</h2><p>${labels.learning_map_note}</p>`;

    const flow = document.createElement('div');
    flow.className = 'visual-map-flow';
    dayData.map.forEach((item) => {
      const node = document.createElement('div');
      node.className = 'visual-map-node';
      const strong = document.createElement('strong');
      strong.textContent = item.title;
      const note = document.createElement('span');
      note.textContent = item.note || '';
      node.append(strong, note);
      flow.appendChild(node);
    });

    section.append(header, flow);
    anchor?.insertAdjacentElement('afterend', section);
  }

  function injectTemplates(main, dayNumber, dayData, labels, anchor) {
    if (!dayData?.templates?.length) return;
    const deck = document.createElement('section');
    deck.className = 'practice-deck';
    deck.setAttribute('data-feature', 'copy_templates');

    const title = document.createElement('h2');
    title.className = 'practice-deck-title';
    title.textContent = labels.practice_tools;
    deck.appendChild(title);

    dayData.templates.forEach((template, index) => {
      const card = document.createElement('article');
      card.className = 'template-card';
      const header = document.createElement('div');
      header.className = 'template-card-header';
      const heading = document.createElement('h3');
      heading.textContent = template.title;
      header.appendChild(heading);

      const row = document.createElement('div');
      row.className = 'command-row';
      const pre = document.createElement('pre');
      pre.className = 'command-box';
      const code = document.createElement('code');
      code.id = `workbook-template-${dayNumber}-${index + 1}`;
      code.textContent = template.text;
      pre.appendChild(code);
      const button = document.createElement('button');
      button.className = 'control-button';
      button.type = 'button';
      button.setAttribute('data-copy-button', '');
      button.setAttribute('data-copy-target', `#${code.id}`);
      const status = document.createElement('span');
      status.className = 'inline-status';
      status.setAttribute('data-copy-status', '');
      status.setAttribute('aria-live', 'polite');
      row.append(pre, button, status);
      card.append(header, row);
      deck.appendChild(card);
    });

    anchor?.insertAdjacentElement('afterend', deck);
  }

  function injectDaySelfCheck(main, dayNumber, locale, dayData, labels) {
    const check = dayData?.check;
    if (!check?.options?.length) return;

    const section = document.createElement('section');
    section.className = 'interaction self-check workbook-quick-check';
    section.setAttribute('data-feature', 'day_self_checks');
    section.setAttribute('data-self-check', '');
    section.setAttribute('data-correct', check.correct);
    section.setAttribute('data-correct-feedback', check.correct_feedback || '');
    section.setAttribute('data-incorrect-feedback', check.incorrect_feedback || '');

    const title = document.createElement('h2');
    title.textContent = labels.quick_check;
    section.appendChild(title);

    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = check.question;
    fieldset.appendChild(legend);
    check.options.forEach((option) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `workbook-check-${dayNumber}-${locale}`;
      input.value = option.value;
      label.append(input, document.createTextNode(` ${option.label}`));
      fieldset.appendChild(label);
    });

    const button = document.createElement('button');
    button.className = 'control-button';
    button.type = 'button';
    button.setAttribute('data-self-check-submit', '');
    const feedback = document.createElement('p');
    feedback.className = 'self-check-feedback';
    feedback.setAttribute('data-self-check-feedback', '');
    feedback.setAttribute('aria-live', 'polite');
    section.append(fieldset, button, feedback);

    const callouts = main.querySelectorAll('.callout');
    const anchor = callouts.length ? callouts[callouts.length - 1] : null;
    if (anchor) anchor.insertAdjacentElement('beforebegin', section);
    else main.appendChild(section);
  }

  function injectDayCompletion(main, dayNumber, labels) {
    const section = document.createElement('section');
    section.className = 'day-completion';
    section.setAttribute('data-feature', 'day_completion');
    const heading = document.createElement('h2');
    heading.textContent = labels.day_completion;
    const note = document.createElement('p');
    note.textContent = labels.day_completion_note;
    const button = document.createElement('button');
    button.className = 'control-button';
    button.type = 'button';
    button.setAttribute('data-completion-id', `day-${dayNumber}-workbook`);
    button.setAttribute('aria-pressed', 'false');
    section.append(heading, note, button);
    main.appendChild(section);
  }

  async function enhanceWorkbookPage(runtime, locale) {
    const dayNumber = getDayNumber();
    if (!dayNumber) return;

    const main = document.querySelector('main');
    if (!main) return;
    const workbook = await loadWorkbookContent(locale);
    const dayData = workbook?.days?.[dayNumber];
    if (!dayData) return;

    document.body.classList.add('workbook-page');
    ensureWorkbookStylesheet();
    decorateGuidedSteps(main);

    const originalHeadings = [...main.querySelectorAll(':scope > h2')];
    const navigation = buildWorkbookNavigation(main, originalHeadings, workbook.labels);
    const progress = buildReadingProgress(main, originalHeadings, workbook.labels, navigation.nav);
    observeWorkbookSections(originalHeadings, navigation.links, progress, workbook.labels);

    const visualAnchor = navigation.nav || progress?.wrapper || main.querySelector('.hero');
    injectVisualMap(main, dayData, workbook.labels, visualAnchor);

    const map = main.querySelector('.visual-map');
    injectTemplates(main, dayNumber, dayData, workbook.labels, map || visualAnchor);
    injectDaySelfCheck(main, dayNumber, locale, dayData, workbook.labels);
    injectDayCompletion(main, dayNumber, workbook.labels);
  }

  async function initialise() {
    const runtime = await loadRuntimeConfig();
    if (applyLandingConfig(runtime)) return;

    const currentLocale = document.documentElement.lang || runtime.default_locale;
    if (redirectDisabledLocale(runtime, currentLocale)) return;

    renderLocaleSwitch(runtime, currentLocale);

    if (runtime.enabled_locales.includes(currentLocale)) {
      try {
        localStorage.setItem(`${storagePrefix}preferred-locale`, currentLocale);
      } catch (_) {
        // Storage is optional; navigation remains functional without it.
      }
    }

    const strings = await loadUiStrings(currentLocale);
    await enhanceWorkbookPage(runtime, currentLocale);
    applyFeatureVisibility(runtime);
    initialiseInteractions(strings);
  }

  initialise();
})();
