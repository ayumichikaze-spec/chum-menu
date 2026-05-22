/* CHUM APARTMENT Menu — i18n (multi-language switcher).
   - Detects language: ?lang= > localStorage > navigator > 'ja'
   - Loads i18n/translations.json
   - Replaces every element marked with data-i18n
   - Updates <html lang>, the visible language label, and the flag emoji
   - \n in translations is rendered as <br>
*/
(function () {
  'use strict';

  const SUPPORTED = ['ja', 'en', 'fr', 'ko', 'zh-Hant', 'zh-Hans'];
  const DEFAULT_LANG = 'ja';
  const STORAGE_KEY = 'chum-menu-lang';
  const TRANSLATIONS_URL = 'i18n/translations.json';

  const NATIVE_LABELS = {
    'ja':      '日本語',
    'en':      'English',
    'fr':      'Français',
    'ko':      '한국어',
    'zh-Hant': '繁體中文',
    'zh-Hans': '简体中文'
  };
  const FLAGS = {
    'ja':      '🇯🇵',
    'en':      '🇺🇸',
    'fr':      '🇫🇷',
    'ko':      '🇰🇷',
    'zh-Hant': '🇹🇼',
    'zh-Hans': '🇨🇳'
  };

  function safeStorage(op) {
    try { return op(); } catch (e) { return null; }
  }

  function detectLang() {
    // 1. URL ?lang=xx
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;

    // 2. localStorage
    const stored = safeStorage(() => localStorage.getItem(STORAGE_KEY));
    if (stored && SUPPORTED.includes(stored)) return stored;

    // 3. navigator.language
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('en')) return 'en';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('ko')) return 'ko';
    // Chinese: traditional regions -> zh-Hant, others -> zh-Hans
    if (nav === 'zh-tw' || nav === 'zh-hk' || nav === 'zh-mo' || nav.indexOf('hant') !== -1) {
      return 'zh-Hant';
    }
    if (nav.startsWith('zh')) return 'zh-Hans';

    return DEFAULT_LANG;
  }

  function getPageSection() {
    // Normalize: strip trailing '.html' (Cloudflare Pages drops the extension
    // and redirects /foo.html -> /foo) and any trailing slash, so we match
    // '/drink', '/drink.html', and '/drink/' equivalently.
    const path = (location.pathname || '').toLowerCase()
      .replace(/\.html$/, '')
      .replace(/\/$/, '');
    if (path.endsWith('/drink'))    return 'drink';
    if (path.endsWith('/takeout'))  return 'takeout';
    if (path.endsWith('/campaign')) return 'campaign';
    return 'index';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function lookup(translations, section, key, lang) {
    const tryEntry = (s) => {
      const dict = translations[s];
      if (!dict) return null;
      const entry = dict[key];
      if (!entry) return null;
      return entry[lang] != null && entry[lang] !== ''
        ? entry[lang]
        : (entry[DEFAULT_LANG] || null);
    };
    return tryEntry(section) || tryEntry('common');
  }

  function applyTranslations(translations, lang) {
    const section = getPageSection();

    // Update <html lang>
    document.documentElement.lang = lang;

    // Update every annotated element
    const nodes = document.querySelectorAll('[data-i18n]');
    nodes.forEach((el) => {
      const key  = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr');
      const value = lookup(translations, section, key, lang);
      if (value == null) return;

      if (attr) {
        // Attribute mode (alt, content, aria-label, title, etc.)
        el.setAttribute(attr, value);
      } else {
        // Inner mode: \n -> <br>; escape everything else for safety
        el.innerHTML = escapeHtml(value).replace(/\n/g, '<br>');
      }
    });

    // Update the visible language label and flag in the switcher
    const currentLabel = document.querySelector('.lang-current');
    if (currentLabel) currentLabel.textContent = NATIVE_LABELS[lang] || lang;
    const flagEl = document.querySelector('.lang-switch > button .flag');
    if (flagEl) flagEl.textContent = FLAGS[lang] || '';

    // Mark the active item in the dropdown
    document.querySelectorAll('.lang-menu button[data-lang]').forEach((b) => {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
    });
  }

  function setLang(translations, lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    safeStorage(() => localStorage.setItem(STORAGE_KEY, lang));
    applyTranslations(translations, lang);
  }

  function wireSwitcher(translations) {
    const buttons = document.querySelectorAll('.lang-menu button[data-lang]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLang(translations, lang);
        // Close the dropdown (main.js owns the open/close state)
        const sw = document.querySelector('.lang-switch');
        if (sw) {
          sw.classList.remove('is-open');
          const trig = sw.querySelector('button[aria-haspopup]');
          if (trig) trig.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  async function init() {
    let translations;
    try {
      // Always revalidate translations against the server. Using 'force-cache'
      // here would serve a stale translations.json indefinitely whenever the
      // file changes (e.g. when a new page section like 'campaign' is added).
      const res = await fetch(TRANSLATIONS_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      translations = await res.json();
    } catch (e) {
      console.warn('[i18n] Failed to load translations:', e);
      return;
    }
    wireSwitcher(translations);
    applyTranslations(translations, detectLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
