/**
 * Path i18n — 30 languages incl. CIS
 * Translates [data-i18n] keys + document lang. Preference: localStorage sb_path_lang
 */
(() => {
  'use strict';

  const LANG_LS = 'sb_path_lang';

  /** 30 popular languages + full CIS set */
  const LANGS = [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' },
    { code: 'uk', name: 'Українська' },
    { code: 'be', name: 'Беларуская' },
    { code: 'kk', name: 'Қазақша' },
    { code: 'uz', name: 'Oʻzbekcha' },
    { code: 'ky', name: 'Кыргызча' },
    { code: 'tg', name: 'Тоҷикӣ' },
    { code: 'tk', name: 'Türkmençe' },
    { code: 'hy', name: 'Հայերեն' },
    { code: 'az', name: 'Azərbaycan' },
    { code: 'mo', name: 'Moldovenească' },
    { code: 'ka', name: 'ქართული' },
    { code: 'zh', name: '中文' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ko', name: '한국어' },
    { code: 'it', name: 'Italiano' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'pl', name: 'Polski' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'th', name: 'ไทย' }
  ];

  // Base strings (ru) + en; others fall back to en then ru
  const STR = {
    ru: {
      hero_title: 'Bezhaev Industries',
      hero_credit: 'Sergey Bezhaev 2026',
      hero_sub: 'AI · Digital · Build',
      hero_lead:
        'Собираю системы из модулей: стратегия, код, контент, автоматизация. Не вертикальная лента — путь. Каждый кейс — блок, который щёлкает на место.',
      settings: 'Настройки',
      language: 'Язык',
      language_hint: 'Интерфейс Path · 30 языков · СНГ включены',
      theme_hint: 'Тема сайта · 5 скинов. Текущая — Void Path.',
      cases: 'Кейсы →',
      legal: 'Право · дисклеймер',
      write: 'Написать',
      soft: 'ПО',
      switch: 'Switch',
      gestures: 'Жесты · камера',
      gestures_on: 'Включить управление жестами',
      gestures_off: 'Выключить жесты',
      gestures_hint: 'Взмах влево/вправо · хлопок = домой · до ~2 м'
    },
    en: {
      hero_title: 'Bezhaev Industries',
      hero_credit: 'Sergey Bezhaev 2026',
      hero_sub: 'AI · Digital · Build',
      hero_lead:
        'I build systems from modules: strategy, code, content, automation. Not a vertical feed — a path. Each case is a block that clicks into place.',
      settings: 'Settings',
      language: 'Language',
      language_hint: 'Path UI · 30 languages · CIS included',
      theme_hint: 'Site theme · 5 skins. Current — Void Path.',
      cases: 'Cases →',
      legal: 'Legal · disclaimer',
      write: 'Contact',
      soft: 'Software',
      switch: 'Switch',
      gestures: 'Gestures · camera',
      gestures_on: 'Enable gesture control',
      gestures_off: 'Disable gestures',
      gestures_hint: 'Swipe L/R · clap = home · ~2 m range'
    }
  };

  // thin aliases for CIS / popular — fallback chain en→ru for missing
  ['uk', 'be', 'kk', 'uz', 'ky', 'tg', 'tk', 'hy', 'az', 'mo', 'ka'].forEach((c) => {
    STR[c] = Object.assign({}, STR.ru, {
      language: STR.ru.language,
      settings: STR.ru.settings
    });
  });
  ['es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'tr', 'vi', 'id', 'bn', 'hi', 'ar', 'zh', 'ja', 'ko', 'th'].forEach((c) => {
    if (!STR[c]) STR[c] = Object.assign({}, STR.en);
  });
  // a few native labels
  Object.assign(STR.uk, { settings: 'Налаштування', language: 'Мова', cases: 'Кейси →', write: 'Написати' });
  Object.assign(STR.be, { settings: 'Налады', language: 'Мова', cases: 'Кейсы →' });
  Object.assign(STR.kk, { settings: 'Баптаулар', language: 'Тіл' });
  Object.assign(STR.de, { settings: 'Einstellungen', language: 'Sprache', cases: 'Cases →', write: 'Schreiben' });
  Object.assign(STR.fr, { settings: 'Paramètres', language: 'Langue', cases: 'Projets →', write: 'Écrire' });
  Object.assign(STR.es, { settings: 'Ajustes', language: 'Idioma', cases: 'Casos →', write: 'Escribir' });
  Object.assign(STR.zh, { settings: '设置', language: '语言', cases: '案例 →', write: '联系' });
  Object.assign(STR.ja, { settings: '設定', language: '言語', cases: '事例 →', write: '連絡' });
  Object.assign(STR.ar, { settings: 'الإعدادات', language: 'اللغة', cases: 'المشاريع →', write: 'راسل' });

  function t(key, lang) {
    const L = lang || getLang();
    return (STR[L] && STR[L][key]) || (STR.en && STR.en[key]) || (STR.ru && STR.ru[key]) || key;
  }

  function getLang() {
    try {
      return localStorage.getItem(LANG_LS) || document.documentElement.lang || 'ru';
    } catch {
      return 'ru';
    }
  }

  function setLang(code) {
    try {
      localStorage.setItem(LANG_LS, code);
    } catch { /* */ }
    apply(code);
  }

  function apply(code) {
    const lang = code || getLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = t(key, lang);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = val;
      else el.textContent = val;
    });
    // settings button without data-i18n if marked
    const setBtn = document.querySelector('[data-acc="settings"]');
    if (setBtn) setBtn.textContent = t('settings', lang);
    const softBtn = document.querySelector('[data-acc="soft"]');
    if (softBtn) softBtn.textContent = t('soft', lang);
    const swBtn = document.querySelector('[data-acc="switch"]');
    if (swBtn) swBtn.textContent = t('switch', lang);
    const sel = document.getElementById('pathLangSelect');
    if (sel && sel.value !== lang) sel.value = lang;
    window.dispatchEvent(new CustomEvent('path-lang-change', { detail: { lang } }));
  }

  function mountSettingsUI() {
    const panel = document.getElementById('acc-settings');
    if (!panel || document.getElementById('pathLangBlock')) return;
    const block = document.createElement('div');
    block.id = 'pathLangBlock';
    block.className = 'path-lang-block';
    block.innerHTML = `
      <p class="acc__hint" data-i18n="language_hint">${t('language_hint')}</p>
      <label class="path-lang-label" for="pathLangSelect" data-i18n="language">${t('language')}</label>
      <select id="pathLangSelect" class="path-lang-select" aria-label="${t('language')}">
        ${LANGS.map((l) => `<option value="${l.code}">${l.name}</option>`).join('')}
      </select>
      <div class="path-gesture-block">
        <p class="acc__hint" data-i18n="gestures_hint">${t('gestures_hint')}</p>
        <button type="button" id="btnGestures" class="path-lang-btn" data-i18n="gestures_on">${t('gestures_on')}</button>
      </div>
    `;
    panel.appendChild(block);
    const sel = block.querySelector('#pathLangSelect');
    sel.value = getLang();
    sel.addEventListener('change', () => setLang(sel.value));
  }

  function init() {
    mountSettingsUI();
    // mark hero bits
    const h1 = document.querySelector('.h1-line');
    if (h1 && !h1.getAttribute('data-i18n')) h1.setAttribute('data-i18n', 'hero_title');
    const credit = document.querySelector('.hint-scroll');
    if (credit && !credit.getAttribute('data-i18n')) credit.setAttribute('data-i18n', 'hero_credit');
    const lead = document.querySelector('.lead');
    if (lead && !lead.getAttribute('data-i18n')) lead.setAttribute('data-i18n', 'hero_lead');
    const ctaCases = document.querySelector('.hero-cta [data-go="2"]');
    if (ctaCases) ctaCases.setAttribute('data-i18n', 'cases');
    const ctaLegal = document.querySelector('.hero-cta [data-go="8"]');
    if (ctaLegal) ctaLegal.setAttribute('data-i18n', 'legal');
    const ctaMail = document.querySelector('.hero-cta a[href^="mailto"]');
    if (ctaMail) ctaMail.setAttribute('data-i18n', 'write');
    apply(getLang());
  }

  window.PathI18n = { LANGS, t, getLang, setLang, apply, init };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
