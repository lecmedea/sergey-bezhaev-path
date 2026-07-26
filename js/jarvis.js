/**
 * Path JARVIS — full voice assistant layer (Bezhaev Industries)
 * GIF fab, Web Speech STT+TTS, offline KB + Gemini, gestures/live links
 */
(() => {
  'use strict';

  const KEY_LS = 'GEMINI_API_KEY';
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

  function getApiKey() {
    try {
      return localStorage.getItem(KEY_LS) || localStorage.getItem('jarvis_gemini_key') || '';
    } catch {
      return '';
    }
  }

  function setApiKey(k) {
    try {
      if (k) localStorage.setItem(KEY_LS, k.trim());
      else localStorage.removeItem(KEY_LS);
    } catch { /* */ }
  }

  function speak(text, lang) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang || document.documentElement.lang || 'ru-RU';
      if (u.lang.length === 2) u.lang = u.lang + '-' + u.lang.toUpperCase();
      if (u.lang.startsWith('ru')) u.lang = 'ru-RU';
      if (u.lang.startsWith('en')) u.lang = 'en-US';
      u.rate = 1.02;
      u.pitch = 0.95;
      window.speechSynthesis.speak(u);
    } catch { /* */ }
  }

  const KB = [
    { keys: [/кто ты|who are you|jarvis|джарвис|помощник|assistant/i], a: 'I am JARVIS for Bezhaev Industries — voice control, chat, navigation, gestures, Gemini Live.' },
    { keys: [/бежаев|bezhaev|сергей|sergey/i], a: 'Sergey Bezhaev — AI · digital · build. Cases: Azimut Clinic, Grillz Customs, Elena Shop. lecmedea@gmail.com · @notoruis' },
    { keys: [/азимут|azimut/i], a: 'Azimut Clinic — digital product case on the Path. Bay Cases.' },
    { keys: [/grillz|гриллз/i], a: 'Grillz Customs — constructor and product site.' },
    { keys: [/елена|elena/i], a: 'Elena Shop — brand e-com case.' },
    { keys: [/жест|gesture|руками|hands|камера/i], a: 'Gesture control: open Settings → enable camera. Wave L/R to move, clap for home. Near range ~2 meters.' },
    { keys: [/язык|language|english|русский/i], a: 'Language: Settings → Language. 30 languages including CIS.' },
    { keys: [/контакт|contact|telegram|email|почт/i], a: 'Email lecmedea@gmail.com · Telegram @notoruis · channel t.me/iicnica' },
    { keys: [/привет|hello|hi|здрав/i], a: 'Online. Say: next, back, home, cases, status — or ask about projects.' },
    { keys: [/помощь|help|команд/i], a: 'Voice: home, next, back, cases, status, theme void/violet, gestures, live. Chat works with optional Gemini key.' }
  ];

  function offlineReply(text) {
    const t = (text || '').trim();
    if (!t) return 'Empty input.';
    for (const row of KB) {
      if (row.keys.some((re) => re.test(t))) return row.a;
    }
    if (/солнц|home|домой|начало|origin/i.test(t)) return '__CMD__:home';
    if (/дальше|вперёд|вперед|next|вправо|right/i.test(t)) return '__CMD__:next';
    if (/назад|prev|влево|left/i.test(t)) return '__CMD__:prev';
    if (/кейс|cases|проекты|projects/i.test(t)) return '__CMD__:cases';
    if (/статус|status/i.test(t)) return '__CMD__:status';
    if (/жест|gesture/i.test(t)) return '__CMD__:gestures';
    if (/void/i.test(t)) return '__CMD__:theme-void';
    if (/violet|фиолет/i.test(t)) return '__CMD__:theme-violet';
    return 'Offline KB: navigation + cases. Add Gemini API key for full conversational voice.';
  }

  async function geminiTextReply(text, key) {
    const lang = document.documentElement.lang || 'ru';
    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
      encodeURIComponent(key);
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'You are JARVIS voice assistant on Sergey Bezhaev portfolio (Bezhaev Industries only, never Stark). ' +
                'Reply short in language code: ' + lang + '. ' +
                'Site has horizontal bays: Origin, Profile, Azimut, Grillz, Elena, Software, AI/BB, Gallery, Legal, Contact. ' +
                'Can suggest voice cmds: home/next/back. User: ' + text
            }
          ]
        }
      ],
      generationConfig: { maxOutputTokens: 400, temperature: 0.55 }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('').trim() || 'Empty model reply.';
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

    const liveHref = jarvisBase();

    const hud = document.createElement('div');
    hud.className = 'jarvis-hud is-on';
    hud.id = 'jarvisHud';
    hud.innerHTML = `
      <div class="jarvis-hud__corner jarvis-hud__corner--tl" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--tr" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--bl" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--br" aria-hidden="true"></div>
      <div class="jarvis-hud__status" id="jarvisStatus" aria-live="polite">
        <div>JARVIS · BEZHAEV INDUSTRIES</div>
        <div id="jarvisClock">--:--:--</div>
        <div id="jarvisBay">BAY —</div>
      </div>
    `;
    document.body.appendChild(hud);

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'jarvis-hud__fab jarvis-hud__fab--gif';
    fab.id = 'jarvisFab';
    fab.setAttribute('aria-label', 'JARVIS — voice assistant');
    fab.title = 'JARVIS voice (J)';
    fab.innerHTML = '<img src="assets/ui/jarvis-fab.gif" alt="" width="72" height="72" decoding="async">';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'jarvis-hud__panel';
    panel.id = 'jarvisPanel';
    panel.setAttribute('role', 'dialog');
    panel.innerHTML = `
      <h3>J.A.R.V.I.S. · Voice</h3>
      <div class="jarvis-hud__log" id="jarvisLog">Voice assistant ready. Mic · chat · gestures · Live.</div>
      <div class="jarvis-hud__cmds">
        <button type="button" data-jcmd="listen">🎤 Слушать</button>
        <button type="button" data-jcmd="home">Солнце</button>
        <button type="button" data-jcmd="next">Дальше</button>
        <button type="button" data-jcmd="prev">Назад</button>
        <button type="button" data-jcmd="cases">Кейсы</button>
        <button type="button" data-jcmd="status">Статус</button>
        <button type="button" data-jcmd="gestures">Жесты</button>
        <button type="button" data-jcmd="theme-void">Тема void</button>
        <button type="button" data-jcmd="theme-violet">Тема violet</button>
        <button type="button" data-jcmd="live">Live · Gemini</button>
        <button type="button" data-jcmd="speak-hello">Сказать привет</button>
      </div>
      <div class="jarvis-hud__links">
        <a href="${liveHref}" target="_blank" rel="noopener">Gemini Live ↗</a>
        <a href="${liveHref}chat.html" target="_blank" rel="noopener">Chatbot ↗</a>
      </div>
      <div class="jarvis-hud__chat">
        <div class="jarvis-hud__chat-log" id="jarvisChatLog" aria-live="polite"></div>
        <form id="jarvisChatForm" autocomplete="off">
          <input id="jarvisChatInput" type="text" maxlength="800" placeholder="Спросить голосом или текстом…" />
          <button type="submit">→</button>
        </form>
      </div>
      <div class="jarvis-hud__key">
        <label for="jarvisKeyInput">Gemini API key (localStorage)</label>
        <input id="jarvisKeyInput" type="password" autocomplete="off" placeholder="AIza… for full voice AI" />
      </div>
    `;
    document.body.appendChild(panel);

    const log = (msg) => { const el = $('#jarvisLog'); if (el) el.textContent = msg; };
    const chatLog = $('#jarvisChatLog');
    const appendChat = (who, text) => {
      if (!chatLog) return;
      const d = document.createElement('div');
      d.className = who === 'me' ? 'me' : 'bot';
      d.textContent = (who === 'me' ? 'You: ' : 'J: ') + text;
      chatLog.appendChild(d);
      chatLog.scrollTop = chatLog.scrollHeight;
    };
    appendChat('bot', 'Full voice layer. Offline KB always; Gemini with key. Try mic.');

    const clock = () => {
      const el = $('#jarvisClock');
      if (el) el.textContent = new Date().toLocaleTimeString(document.documentElement.lang || 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    clock();
    setInterval(clock, 1000);
    setInterval(() => {
      const bay = $('#bayIndex');
      const st = $('#jarvisBay');
      if (st && bay) st.textContent = 'BAY ' + (bay.textContent || '—');
    }, 800);

    function handleCmd(cmd) {
      switch (cmd) {
        case 'home': window.PathAPI?.goHome?.() || $('#btnHome')?.click(); log('Origin.'); break;
        case 'next': window.PathAPI?.goNext?.() || $('#btnNext')?.click(); log('Next bay.'); break;
        case 'prev': window.PathAPI?.goPrev?.() || $('#btnPrev')?.click(); log('Previous bay.'); break;
        case 'cases': window.PathAPI?.goToIndex?.(2) || document.querySelector('[data-go="2"]')?.click(); log('Cases.'); break;
        case 'status': log('Path ' + ($('#progressPct')?.textContent || '0%') + ' · systems nominal.'); speak('Path online. Bezhaev Industries.'); break;
        case 'theme-void': document.querySelector('.theme-card[data-theme="void"]')?.click(); log('Theme void.'); break;
        case 'theme-violet': document.querySelector('.theme-card[data-theme="violet"]')?.click(); log('Theme violet.'); break;
        case 'live': window.open(liveHref, '_blank', 'noopener'); log('Opening Live.'); break;
        case 'gestures': window.PathGestures?.toggle?.(); log('Gesture control toggled.'); break;
        case 'listen': startListen(); break;
        case 'speak-hello': speak('Bezhaev Industries online. I am JARVIS.'); break;
        default: log('Unknown command.');
      }
    }

    panel.querySelectorAll('[data-jcmd]').forEach((b) => {
      b.addEventListener('click', () => handleCmd(b.getAttribute('data-jcmd')));
    });

    const keyInput = $('#jarvisKeyInput');
    if (keyInput) {
      keyInput.value = getApiKey();
      keyInput.addEventListener('change', () => setApiKey(keyInput.value));
    }

    async function handleUserText(text) {
      appendChat('me', text);
      const offline = offlineReply(text);
      if (offline.startsWith('__CMD__:')) {
        handleCmd(offline.slice(8));
        appendChat('bot', 'Done.');
        speak('OK');
        return;
      }
      const key = getApiKey() || keyInput?.value?.trim() || '';
      if (key) {
        appendChat('bot', '…');
        try {
          const ans = await geminiTextReply(text, key);
          const last = chatLog?.lastElementChild;
          if (last && last.classList.contains('bot')) last.textContent = 'J: ' + ans;
          else appendChat('bot', ans);
          speak(ans);
        } catch (err) {
          const last = chatLog?.lastElementChild;
          const msg = offline + ' (' + (err.message || err) + ')';
          if (last && last.classList.contains('bot')) last.textContent = 'J: ' + msg;
          else appendChat('bot', msg);
          speak(offline);
        }
      } else {
        appendChat('bot', offline);
        speak(offline);
      }
    }

    $('#jarvisChatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#jarvisChatInput');
      const text = (input?.value || '').trim();
      if (!text) return;
      if (input) input.value = '';
      handleUserText(text);
    });

    fab.addEventListener('click', () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        log('Mic or type. J to toggle.');
        startListen();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'j' || e.key === 'J') && !e.target.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
        panel.classList.toggle('is-open');
      }
      if (e.key === 'Escape') panel.classList.remove('is-open');
    });

    let rec = null;
    function startListen() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        log('Speech recognition unavailable. Use chat.');
        return;
      }
      if (rec) { try { rec.stop(); } catch { /* */ } }
      rec = new SR();
      const lang = document.documentElement.lang || 'ru';
      rec.lang = lang.startsWith('en') ? 'en-US' : lang.startsWith('ru') ? 'ru-RU' : lang;
      rec.interimResults = false;
      rec.continuous = false;
      fab.classList.add('is-listening');
      log('Listening…');
      rec.onresult = (ev) => {
        const text = (ev.results[0][0].transcript || '').trim();
        log('Heard: «' + text + '»');
        handleUserText(text);
      };
      rec.onerror = () => { fab.classList.remove('is-listening'); log('Did not catch that.'); };
      rec.onend = () => fab.classList.remove('is-listening');
      try { rec.start(); } catch { log('Mic busy.'); }
    }

    log('JARVIS voice online.');
  }

  window.PathJarvis = { mount, getApiKey, setApiKey, speak, playWelcomeOnce };
  document.addEventListener('path-boot-complete', () => {
    mount();
    playWelcomeOnce();
  });
})();
