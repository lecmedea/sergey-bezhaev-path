/**
 * JARVIS — Bezhaev Industries holographic voice lab
 * Male TTS, draggable FAB (GIF loop), STT + Gemini, cyan hologram panel.
 * Patterns inspired by open Jarvis projects (voice loop, status, commands).
 */
(() => {
  'use strict';

  const KEY_LS = 'GEMINI_API_KEY';
  const KEY_LS_ALT = 'jarvis_gemini_key';
  const POS_LS = 'sb_jarvis_fab_pos';
  const WELCOME_KEY = 'sb_path_welcome_played_v1';
  const $ = (s, r = document) => r.querySelector(s);

  function jarvisBase() {
    const path = location.pathname.replace(/\/[^/]*$/, '/');
    if (path.includes('/sergey-bezhaev-path')) {
      return path.endsWith('/') ? path + 'jarvis/' : path + '/jarvis/';
    }
    const m = location.pathname.match(/^(.*\/sergey-bezhaev-path\/)/);
    if (m) return m[1] + 'jarvis/';
    return new URL('jarvis/', location.href).pathname;
  }

  /** Resolve Gemini key: localStorage → window bootstrap (never hardcode in repo) */
  function getApiKey() {
    try {
      const fromLs =
        localStorage.getItem(KEY_LS) ||
        localStorage.getItem(KEY_LS_ALT) ||
        '';
      if (fromLs && fromLs.trim()) return fromLs.trim();
    } catch { /* */ }
    try {
      const fromWin = (window.__PATH_GEMINI_KEY || window.GEMINI_API_KEY || '').trim();
      if (fromWin) {
        // promote into localStorage so Sophia/Live share the same key
        setApiKey(fromWin);
        return fromWin;
      }
    } catch { /* */ }
    return '';
  }
  function setApiKey(k) {
    try {
      const v = (k || '').trim();
      if (v) {
        localStorage.setItem(KEY_LS, v);
        localStorage.setItem(KEY_LS_ALT, v);
      } else {
        localStorage.removeItem(KEY_LS);
        localStorage.removeItem(KEY_LS_ALT);
      }
    } catch { /* */ }
  }

  function looksLikeGeminiKey(k) {
    // Google AI Studio keys typically start with AIza
    return /^AIza[0-9A-Za-z_-]{20,}$/.test((k || '').trim());
  }

  /** One-time install from ?gemini_key= / #gk= then strip from URL (never log the secret) */
  function ingestKeyFromUrl() {
    try {
      const u = new URL(location.href);
      let raw = u.searchParams.get('gemini_key') || u.searchParams.get('gk') || '';
      if (!raw && location.hash && location.hash.indexOf('gk=') !== -1) {
        raw = decodeURIComponent(location.hash.replace(/^#/, '').split('gk=')[1] || '');
      }
      if (!raw) return;
      setApiKey(raw);
      u.searchParams.delete('gemini_key');
      u.searchParams.delete('gk');
      history.replaceState(null, '', u.pathname + u.search + (u.hash && !u.hash.includes('gk=') ? u.hash : ''));
    } catch { /* */ }
  }

  /** Prefer male voices (RU/EN) */
  function pickMaleVoice(langHint) {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;
    const lang = (langHint || document.documentElement.lang || 'ru').slice(0, 2).toLowerCase();
    const maleRe =
      /male|yuri|yury|dmitri|dimitri|pavel|paul|daniel|david|mark|alex|fred|thomas|google uk english male|microsoft david|microsoft mark|microsoft pavel|microsoft dmitry|milena/i;
    // avoid clearly female
    const femaleRe = /female|milena|irina|samantha|zira|victoria|karen|moira|fiona|tessa|siri|ellen/i;
    const scored = voices
      .map((v) => {
        let score = 0;
        const blob = (v.name + ' ' + v.voiceURI + ' ' + v.lang).toLowerCase();
        if (v.lang.toLowerCase().startsWith(lang)) score += 5;
        if (maleRe.test(blob)) score += 8;
        if (femaleRe.test(blob) && !/male/i.test(blob)) score -= 10;
        if (/ru/.test(lang) && /ru/.test(v.lang)) score += 3;
        if (/en/.test(lang) && /en/.test(v.lang)) score += 2;
        // prefer "compact" / local
        if (/premium|enhanced|neural/i.test(blob)) score += 1;
        return { v, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    // Prefer non-female among lang match
    const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
    const maleLang = langVoices.find((v) => maleRe.test(v.name + v.voiceURI) && !femaleRe.test(v.name));
    if (maleLang) return maleLang;
    // Russian: often only female defaults — pick lowest pitch via voiceURI hacks, or first non-female EN male
    if (scored[0]) return scored[0].v;
    const anyMale = voices.find((v) => maleRe.test(v.name) && !femaleRe.test(v.name));
    return anyMale || voices.find((v) => /en-us|en_gb|ru/i.test(v.lang)) || voices[0];
  }

  let cachedVoice = null;
  function ensureVoices(cb) {
    const run = () => {
      cachedVoice = pickMaleVoice();
      cb && cb();
    };
    const v = speechSynthesis.getVoices();
    if (v && v.length) run();
    else speechSynthesis.addEventListener('voiceschanged', run, { once: true });
  }

  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const lang = document.documentElement.lang || 'ru';
      u.lang = lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('en') ? 'en-US' : lang;
      u.rate = 1.08;
      u.pitch = 0.82; // lower = more male
      u.volume = 1;
      if (!cachedVoice) cachedVoice = pickMaleVoice(lang);
      if (cachedVoice) u.voice = cachedVoice;
      speechSynthesis.speak(u);
    } catch { /* */ }
  }

  function makeDraggable(el, storageKey) {
    let ox = 0;
    let oy = 0;
    let dragging = false;
    let moved = false;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
        el.style.left = saved.x + 'px';
        el.style.top = saved.y + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      }
    } catch { /* */ }

    const onDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true;
      moved = false;
      el.classList.add('is-dragging');
      const r = el.getBoundingClientRect();
      const pt = e.touches ? e.touches[0] : e;
      ox = pt.clientX - r.left;
      oy = pt.clientY - r.top;
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const x = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, pt.clientX - ox));
      const y = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, pt.clientY - oy));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      moved = true;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (moved) {
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) })
          );
        } catch { /* */ }
        el.dataset.dragged = '1';
        setTimeout(() => {
          el.dataset.dragged = '0';
        }, 50);
      }
    };
    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  const KB = [
    { keys: [/кто ты|who are you|jarvis|джарвис/i], a: 'JARVIS. Bezhaev Industries voice lab. Navigation, cases, gestures, Gemini.' },
    { keys: [/бежаев|bezhaev|sergey|сергей/i], a: 'Sergey Bezhaev — AI · digital · build. Azimut, Grillz, Elena. lecmedea@gmail.com' },
    { keys: [/азимут|azimut/i], a: 'Azimut Clinic — live case bay. Full digital clinic stack.' },
    { keys: [/grillz|гриллз/i], a: 'Grillz Customs Moscow — product site and constructor.' },
    { keys: [/елена|elena/i], a: 'Elena Shop — brand commerce flow.' },
    { keys: [/sophia|софи/i], a: 'Sophia is the second assistant — pink channel. Toggle her FAB.' },
    { keys: [/жест|gesture|hands/i], a: 'Settings → gestures. Wave L/R, clap home.' },
    { keys: [/привет|hello|hi/i], a: 'Systems online. Ready for commands.' },
    { keys: [/помощь|help/i], a: 'Commands: home, next, back, cases, status, gestures, live.' }
  ];

  function offlineReply(text) {
    const t = (text || '').trim();
    if (!t) return 'Empty.';
    for (const row of KB) if (row.keys.some((re) => re.test(t))) return row.a;
    if (/home|солнц|домой|origin/i.test(t)) return '__CMD__:home';
    if (/next|дальше|вперёд|вперед|right/i.test(t)) return '__CMD__:next';
    if (/prev|назад|left/i.test(t)) return '__CMD__:prev';
    if (/cases|кейс|проект/i.test(t)) return '__CMD__:cases';
    if (/status|статус/i.test(t)) return '__CMD__:status';
    if (/gesture|жест/i.test(t)) return '__CMD__:gestures';
    return 'Offline core. Add Gemini key for full conversation.';
  }

  async function geminiReply(text, key) {
    const lang = document.documentElement.lang || 'ru';
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
      encodeURIComponent(key);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'You are JARVIS (male British-tech tone, concise) for Bezhaev Industries / Sergey Bezhaev. Never Stark. Language: ' +
                  lang +
                  '. User: ' +
                  text
              }
            ]
          }
        ],
        generationConfig: { maxOutputTokens: 360, temperature: 0.5 }
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('').trim() || '…';
  }

  function playWelcomeOnce() {
    try {
      if (sessionStorage.getItem(WELCOME_KEY) === '1') return;
      sessionStorage.setItem(WELCOME_KEY, '1');
    } catch { /* */ }
    const a = new Audio('assets/ui/welcome.mp3');
    a.volume = 0.85;
    a.play().catch(() => {});
  }

  function mount() {
    if (document.getElementById('jarvisHud')) return;
    ingestKeyFromUrl();
    ensureVoices();

    const liveHref = jarvisBase();
    const hud = document.createElement('div');
    hud.className = 'jarvis-hud is-on';
    hud.id = 'jarvisHud';
    hud.innerHTML = `
      <div class="jarvis-hud__corner jarvis-hud__corner--tl"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--tr"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--bl"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--br"></div>
      <div class="jarvis-hud__status" id="jarvisStatus">
        <div>JARVIS · HOLO LINK</div>
        <div id="jarvisClock">--:--:--</div>
        <div id="jarvisBay">BAY —</div>
      </div>
    `;
    document.body.appendChild(hud);

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'jarvis-hud__fab jarvis-hud__fab--gif';
    fab.id = 'jarvisFab';
    fab.title = 'JARVIS · drag to move · click to open';
    fab.innerHTML = '<img src="assets/ui/jarvis-fab.gif" width="72" height="72" alt="JARVIS">';
    document.body.appendChild(fab);
    // drag handled by PathAssistDock (rope physics with panel)

    const panel = document.createElement('div');
    panel.className = 'jarvis-hud__panel jarvis-hud__panel--holo';
    panel.id = 'jarvisPanel';
    panel.innerHTML = `
      <div class="holo-scan" aria-hidden="true"></div>
      <div class="assist-panel__head">
        <h3>J.A.R.V.I.S. · Голограмма</h3>
        <button type="button" class="assist-panel__close" id="jarvisClose" aria-label="Свернуть">✕</button>
      </div>
      <div class="assist-panel__scroll">
        <div class="jarvis-hud__log" id="jarvisLog">Голосовое ядро · offline + Gemini · перетащите иконку.</div>
        <div class="jarvis-hud__cmds">
          <button type="button" data-jcmd="listen">🎤 Слушать</button>
          <button type="button" data-jcmd="home">Домой</button>
          <button type="button" data-jcmd="next">Дальше</button>
          <button type="button" data-jcmd="prev">Назад</button>
          <button type="button" data-jcmd="cases">Кейсы</button>
          <button type="button" data-jcmd="status">Статус</button>
          <button type="button" data-jcmd="gestures">Жесты</button>
          <button type="button" data-jcmd="live">Live</button>
          <button type="button" data-jcmd="speak-hello">Сказать</button>
        </div>
        <div class="jarvis-hud__chat">
          <div class="jarvis-hud__chat-log" id="jarvisChatLog"></div>
          <form id="jarvisChatForm" autocomplete="off">
            <input id="jarvisChatInput" type="text" maxlength="800" placeholder="Команда или вопрос…" />
            <button type="submit">→</button>
          </form>
        </div>
        <div class="jarvis-hud__key">
          <label for="jarvisKeyInput">Ключ Google Gemini (AI Studio)</label>
          <input id="jarvisKeyInput" type="text" inputmode="text" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" name="sb_gemini_token_x" placeholder="AIza… из aistudio.google.com/apikey" />
          <p class="jarvis-hud__key-hint" id="jarvisKeyHint">Ключ только в localStorage браузера. Не sk-…, а AIza…</p>
        </div>
        <div class="jarvis-hud__links">
          <a href="${liveHref}" target="_blank" rel="noopener">Gemini Live ↗</a>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    $('#jarvisClose')?.addEventListener('click', () => panel.classList.remove('is-open'));

    const log = (m) => {
      const el = $('#jarvisLog');
      if (el) el.textContent = m;
    };
    const chatLog = $('#jarvisChatLog');
    const append = (who, text) => {
      if (!chatLog) return;
      const d = document.createElement('div');
      d.className = who;
      d.textContent = (who === 'me' ? 'You: ' : 'J: ') + text;
      chatLog.appendChild(d);
      chatLog.scrollTop = chatLog.scrollHeight;
    };
    append('bot', 'Голографический канал онлайн. Мужской голос, если ОС его даёт.');

    setInterval(() => {
      const c = $('#jarvisClock');
      if (c) c.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const b = $('#jarvisBay');
      const bi = $('#bayIndex');
      if (b && bi) b.textContent = 'BAY ' + bi.textContent;
    }, 500);

    function cmd(c) {
      switch (c) {
        case 'home': window.PathAPI?.goHome?.(); break;
        case 'next': window.PathAPI?.goNext?.(); break;
        case 'prev': window.PathAPI?.goPrev?.(); break;
        case 'cases': window.PathAPI?.goToIndex?.(2); break;
        case 'status': log('Path ' + ($('#progressPct')?.textContent || '0%')); speak('Системы Path в норме.'); break;
        case 'gestures': window.PathGestures?.toggle?.(); break;
        case 'live': window.open(liveHref, '_blank', 'noopener'); break;
        case 'listen': listen(); break;
        case 'speak-hello': speak('Bezhaev Industries. Джарвис на связи.'); break;
        case 'close': panel.classList.remove('is-open'); break;
        default: break;
      }
    }

    panel.querySelectorAll('[data-jcmd]').forEach((b) => b.addEventListener('click', () => cmd(b.dataset.jcmd)));

    ingestKeyFromUrl();

    const keyInput = $('#jarvisKeyInput');
    const keyHint = $('#jarvisKeyHint');
    function refreshKeyUi() {
      const k = getApiKey();
      if (keyInput && !keyInput.matches(':focus')) {
        // never leave full secret visible after blur
        keyInput.value = k ? k.slice(0, 6) + '…' + k.slice(-4) : '';
        keyInput.dataset.full = k ? '1' : '0';
      }
      if (keyHint) {
        if (!k) {
          keyHint.textContent = 'Нет ключа. Возьми AIza… на aistudio.google.com/apikey и вставь сюда.';
          keyHint.style.color = '#ff8a90';
        } else if (!looksLikeGeminiKey(k)) {
          keyHint.textContent = 'Ключ сохранён, но формат не AIza… — Google Gemini, скорее всего, отвергнет (sk-… это не Gemini).';
          keyHint.style.color = '#ffb84d';
        } else {
          keyHint.textContent = 'Gemini подключён (ключ в localStorage этого браузера).';
          keyHint.style.color = '#64e888';
        }
      }
    }
    if (keyInput) {
      refreshKeyUi();
      keyInput.addEventListener('focus', () => {
        const k = getApiKey();
        if (k) keyInput.value = k;
      });
      keyInput.addEventListener('blur', () => {
        const v = keyInput.value.trim();
        // if user left masked value, don't overwrite
        if (v && !v.includes('…')) setApiKey(v);
        refreshKeyUi();
      });
      keyInput.addEventListener('change', () => {
        const v = keyInput.value.trim();
        if (v && !v.includes('…')) setApiKey(v);
        refreshKeyUi();
        log(getApiKey() ? 'Ключ Gemini сохранён локально.' : 'Ключ очищен.');
      });
    }

    async function handleText(text) {
      append('me', text);
      const off = offlineReply(text);
      if (off.startsWith('__CMD__:')) {
        cmd(off.slice(8));
        append('bot', 'Выполнено.');
        speak('Готово.');
        return;
      }
      const key = getApiKey() || keyInput?.value?.trim();
      if (key) {
        append('bot', '…');
        try {
          const ans = await geminiReply(text, key);
          const last = chatLog.lastElementChild;
          if (last) last.textContent = 'J: ' + ans;
          speak(ans);
        } catch (e) {
          const last = chatLog.lastElementChild;
          if (last) last.textContent = 'J: ' + off;
          speak(off);
        }
      } else {
        append('bot', off);
        speak(off);
      }
    }

    $('#jarvisChatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#jarvisChatInput');
      const t = (input?.value || '').trim();
      if (!t) return;
      input.value = '';
      handleText(t);
    });

    fab.addEventListener('click', () => {
      if (fab.dataset.dragged === '1') return;
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) listen();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'j' || e.key === 'J') && !e.target.matches('input,textarea,[contenteditable]')) {
        e.preventDefault();
        panel.classList.toggle('is-open');
      }
    });

    let rec = null;
    function listen() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        log('Speech API unavailable.');
        return;
      }
      if (rec) try { rec.stop(); } catch { /* */ }
      rec = new SR();
      const lang = document.documentElement.lang || 'ru';
      rec.lang = lang.startsWith('en') ? 'en-US' : 'ru-RU';
      rec.interimResults = false;
      fab.classList.add('is-listening');
      log('Listening…');
      rec.onresult = (ev) => {
        const text = (ev.results[0][0].transcript || '').trim();
        log('Heard: ' + text);
        handleText(text);
      };
      rec.onerror = () => {
        fab.classList.remove('is-listening');
        log('Mic error.');
      };
      rec.onend = () => fab.classList.remove('is-listening');
      try { rec.start(); } catch { log('Mic busy.'); }
    }

    log('JARVIS holo console ready.');
  }

  window.PathJarvis = { mount, speak, playWelcomeOnce, getApiKey, setApiKey };
  document.addEventListener('path-boot-complete', () => {
    mount();
    playWelcomeOnce();
    ensureVoices(() => {});
    // rope + drag after DOM nodes exist
    setTimeout(() => window.PathAssistDock?.rebind?.() || window.PathAssistDock?.init?.(), 50);
  });
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickMaleVoice();
    };
  }
})();
