/**
 * SOPHIA — second holographic assistant (pink/violet)
 * Parallel channel to JARVIS; same Path API + Gemini; distinct voice/persona.
 * Future: multi-agent debate mode.
 */
(() => {
  'use strict';

  const KEY_LS = 'GEMINI_API_KEY';
  const POS_LS = 'sb_sophia_fab_pos';
  const $ = (s, r = document) => r.querySelector(s);

  function getApiKey() {
    try {
      return (
        localStorage.getItem(KEY_LS) ||
        localStorage.getItem('jarvis_gemini_key') ||
        (window.__PATH_GEMINI_KEY || '') ||
        ''
      ).trim();
    } catch {
      return '';
    }
  }

  function pickFemaleVoice() {
    const voices = speechSynthesis.getVoices() || [];
    const femaleRe = /female|milena|irina|samantha|zira|victoria|karen|moira|tessa|siri|ellen|google.*deutsch.*female|microsoft irina|microsoft milena/i;
    const lang = (document.documentElement.lang || 'ru').slice(0, 2);
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith(lang) && femaleRe.test(v.name + v.voiceURI)) ||
      voices.find((v) => femaleRe.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
      voices[0] ||
      null
    );
  }

  let voice = null;
  function speak(text) {
    try {
      if (!speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const lang = document.documentElement.lang || 'ru';
      u.lang = lang.startsWith('en') ? 'en-US' : 'ru-RU';
      u.rate = 1.05;
      u.pitch = 1.15;
      if (!voice) voice = pickFemaleVoice();
      if (voice) u.voice = voice;
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
      if (saved && typeof saved.x === 'number') {
        el.style.left = saved.x + 'px';
        el.style.top = saved.y + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      }
    } catch { /* */ }
    const down = (e) => {
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
    const move = (e) => {
      if (!dragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const x = Math.max(4, Math.min(innerWidth - el.offsetWidth - 4, pt.clientX - ox));
      const y = Math.max(4, Math.min(innerHeight - el.offsetHeight - 4, pt.clientY - oy));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      moved = true;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('is-dragging');
      if (moved) {
        try {
          localStorage.setItem(POS_LS, JSON.stringify({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) }));
        } catch { /* */ }
        el.dataset.dragged = '1';
        setTimeout(() => (el.dataset.dragged = '0'), 50);
      }
    };
    el.addEventListener('mousedown', down);
    el.addEventListener('touchstart', down, { passive: false });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
  }

  function offline(text) {
    const t = (text || '').trim();
    if (/привет|hello|hi|sophia|софи/i.test(t)) return 'Sophia online. Creative channel of Bezhaev Industries.';
    if (/jarvis|джарвис/i.test(t)) return 'JARVIS handles ops. I handle sparkle, critique, and second opinions.';
    if (/next|дальше/i.test(t)) return '__CMD__:next';
    if (/prev|назад/i.test(t)) return '__CMD__:prev';
    if (/home|домой/i.test(t)) return '__CMD__:home';
    return 'Sophia hears you. Add Gemini key for full replies — or ask JARVIS to argue with me later.';
  }

  async function gemini(text, key) {
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
                  'You are SOPHIA, a witty pink-channel AI assistant on Sergey Bezhaev / Bezhaev Industries portfolio. ' +
                  'Warm, sharp, slightly playful. Never Stark. Short reply. User: ' +
                  text
              }
            ]
          }
        ],
        generationConfig: { maxOutputTokens: 320, temperature: 0.7 }
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('').trim() || '…';
  }

  function mount() {
    if (document.getElementById('sophiaFab')) return;

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'sophia-hud__fab';
    fab.id = 'sophiaFab';
    fab.title = 'SOPHIA · drag · click';
    fab.innerHTML = '<img src="assets/ui/sophia-fab.gif" width="72" height="72" alt="Sophia">';
    // default position left of jarvis if not saved
    fab.style.right = '92px';
    fab.style.bottom = 'calc(var(--deck-h, 108px) + 16px)';
    document.body.appendChild(fab);
    // drag handled by PathAssistDock (rope + panel)

    const panel = document.createElement('div');
    panel.className = 'sophia-hud__panel';
    panel.id = 'sophiaPanel';
    panel.innerHTML = `
      <div class="holo-scan holo-scan--pink" aria-hidden="true"></div>
      <div class="assist-panel__head">
        <h3>S.O.P.H.I.A. · Розовый канал</h3>
        <button type="button" class="assist-panel__close assist-panel__close--pink" id="sophiaClose" aria-label="Свернуть">✕</button>
      </div>
      <div class="assist-panel__scroll">
        <div class="sophia-hud__log" id="sophiaLog">Второй разум. Потом поспорим с JARVIS.</div>
        <div class="sophia-hud__cmds">
          <button type="button" data-scmd="listen">🎤 Слушать</button>
          <button type="button" data-scmd="home">Домой</button>
          <button type="button" data-scmd="next">Дальше</button>
          <button type="button" data-scmd="prev">Назад</button>
          <button type="button" data-scmd="speak">Сказать</button>
        </div>
        <div class="sophia-hud__chat">
          <div class="sophia-hud__chat-log" id="sophiaChatLog"></div>
          <form id="sophiaChatForm">
            <input id="sophiaChatInput" type="text" maxlength="800" placeholder="Сказать Софии…" />
            <button type="submit">→</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('sophiaClose')?.addEventListener('click', () => panel.classList.remove('is-open'));

    const log = (m) => {
      const el = $('#sophiaLog');
      if (el) el.textContent = m;
    };
    const chatLog = $('#sophiaChatLog');
    const append = (who, text) => {
      const d = document.createElement('div');
      d.className = who;
      d.textContent = (who === 'me' ? 'You: ' : 'S: ') + text;
      chatLog.appendChild(d);
      chatLog.scrollTop = chatLog.scrollHeight;
    };
    append('bot', 'Розовый канал онлайн. Перетащите иконку куда угодно.');

    function cmd(c) {
      if (c === 'home') window.PathAPI?.goHome?.();
      if (c === 'next') window.PathAPI?.goNext?.();
      if (c === 'prev') window.PathAPI?.goPrev?.();
      if (c === 'speak') speak('София на связи. Bezhaev Industries.');
      if (c === 'listen') listen();
      if (c === 'close') panel.classList.remove('is-open');
    }
    panel.querySelectorAll('[data-scmd]').forEach((b) => b.addEventListener('click', () => cmd(b.dataset.scmd)));

    async function handle(text) {
      append('me', text);
      const off = offline(text);
      if (off.startsWith('__CMD__:')) {
        cmd(off.slice(8));
        append('bot', 'Сделано.');
        speak('Готово.');
        return;
      }
      const key = getApiKey();
      if (key) {
        append('bot', '…');
        try {
          const ans = await gemini(text, key);
          chatLog.lastElementChild.textContent = 'S: ' + ans;
          speak(ans);
        } catch {
          chatLog.lastElementChild.textContent = 'S: ' + off;
          speak(off);
        }
      } else {
        append('bot', off);
        speak(off);
      }
    }

    $('#sophiaChatForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#sophiaChatInput');
      const t = (input?.value || '').trim();
      if (!t) return;
      input.value = '';
      handle(t);
    });

    fab.addEventListener('click', () => {
      if (fab.dataset.dragged === '1') return;
      panel.classList.toggle('is-open');
    });

    let rec = null;
    function listen() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return log('No speech API');
      rec = new SR();
      rec.lang = (document.documentElement.lang || 'ru').startsWith('en') ? 'en-US' : 'ru-RU';
      fab.classList.add('is-listening');
      rec.onresult = (ev) => handle((ev.results[0][0].transcript || '').trim());
      rec.onend = () => fab.classList.remove('is-listening');
      rec.onerror = () => fab.classList.remove('is-listening');
      try { rec.start(); } catch { /* */ }
    }

    if (speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => {
        voice = pickFemaleVoice();
      };
    }
  }

  window.PathSophia = { mount, speak };
  document.addEventListener('path-boot-complete', () => {
    mount();
    setTimeout(() => window.PathAssistDock?.rebind?.() || window.PathAssistDock?.init?.(), 80);
  });
})();
