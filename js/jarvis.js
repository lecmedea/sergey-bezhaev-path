/**
 * Path JARVIS layer — Bezhaev Industries
 * - HUD + voice commands (Web Speech API)
 * - Light AI chatbot (rule-based + optional Gemini REST)
 * - Links into Gemini Live (addyosmani/jarvis build under /jarvis/)
 * No Stark branding.
 */
(() => {
  'use strict';

  const KEY_LS = 'GEMINI_API_KEY';
  const $ = (s, r = document) => r.querySelector(s);

  function jarvisBase() {
    // GH Pages project site or local root
    const path = location.pathname.replace(/\/[^/]*$/, '/');
    if (path.includes('/sergey-bezhaev-path')) {
      return path.endsWith('/') ? path + 'jarvis/' : path + '/jarvis/';
    }
    // relative from site root
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

  /* ── Light chatbot knowledge (Bezhaev Path) ── */
  const KB = [
    {
      keys: [/кто ты|кто вы|jarvis|джарвис|помощник/i],
      a: 'Я JARVIS-слой сайта Sergey Bezhaev / Bezhaev Industries: пульт навигации, лёгкий чат и вход в Gemini Live. Не декорация.'
    },
    {
      keys: [/бежаев|bezhaev|сергей|кто такой|автор/i],
      a: 'Sergey Bezhaev — AI · digital · build. Кейсы: Azimut Clinic, Grillz Customs, Elena Shop. Контакт: lecmedea@gmail.com · TG @notoruis.'
    },
    {
      keys: [/азимут|azimut/i],
      a: 'Azimut Clinic — digital/product кейс: сайт, UX, контент, инфраструктура. Листай bay «Кейсы» на Path.'
    },
    {
      keys: [/grillz|гриллз/i],
      a: 'Grillz Customs — конструктор капов, форма, аккаунт. Живой product, не витрина-заглушка.'
    },
    {
      keys: [/елена|elena|shop/i],
      a: 'Elena Shop — e-com / brand site. Смотри секцию кейсов на горизонтальном пути.'
    },
    {
      keys: [/тема|theme|void|violet/i],
      a: 'Темы: Void Path, Violet Core, СССР, USA mid-century, Japan, Paris. Меню «Настройки» сверху или команды «тема void / violet».'
    },
    {
      keys: [/live|голос|voice|gemini|мультимодал/i],
      a: 'Gemini Live (мультимодал: голос, поиск, картинки) — кнопка «Live · Gemini» или /jarvis/. Нужен ваш Google AI API key (хранится только в localStorage браузера).'
    },
    {
      keys: [/ключ|api.?key|gemini.?key/i],
      a: 'Вставьте Gemini API key в поле ниже. Ключ не уходит на сервер Path — только в localStorage и прямые запросы к Google GenAI.'
    },
    {
      keys: [/контакт|связ|telegram|почт|email|написать/i],
      a: 'Почта: lecmedea@gmail.com · Telegram: @notoruis · канал ИИчница: t.me/iicnica'
    },
    {
      keys: [/привет|hello|hi|здрав/i],
      a: 'На связи. Спросите про кейсы, темы, Live или скажите «дальше / солнце» — переведу по Path.'
    },
    {
      keys: [/помощь|help|команд/i],
      a: 'Команды: солнце · дальше · назад · статус · тема void/violet · Live. В чате — вопросы про Bezhaev Industries и сайт.'
    }
  ];

  function offlineReply(text) {
    const t = (text || '').trim();
    if (!t) return 'Пустой ввод. Напишите вопрос или команду.';
    for (const row of KB) {
      if (row.keys.some((re) => re.test(t))) return row.a;
    }
    if (/солнц|home|домой|начало/i.test(t)) return '__CMD__:home';
    if (/дальше|вперёд|вперед|next/i.test(t)) return '__CMD__:next';
    if (/назад|prev/i.test(t)) return '__CMD__:prev';
    if (/статус|status/i.test(t)) return '__CMD__:status';
    return 'Понял запрос. Offline-база Path отвечает по кейсам/навигации/Live. Для умного диалога вставьте Gemini API key — или откройте Live.';
  }

  async function geminiTextReply(text, key) {
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
                'Ты JARVIS на сайте портфолио Sergey Bezhaev (Bezhaev Industries). ' +
                'Отвечай кратко по-русски. Бренд: только Bezhaev / Bezhaev Industries, никогда Stark. ' +
                'Контекст: AI, digital, build; кейсы Azimut, Grillz Customs, Elena Shop; email lecmedea@gmail.com. ' +
                'Вопрос пользователя: ' +
                text
            }
          ]
        }
      ],
      generationConfig: { maxOutputTokens: 320, temperature: 0.6 }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error('Gemini HTTP ' + res.status + ' ' + err.slice(0, 120));
    }
    const data = await res.json();
    const out = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return out.trim() || 'Пустой ответ модели.';
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
    fab.className = 'jarvis-hud__fab';
    fab.id = 'jarvisFab';
    fab.setAttribute('aria-label', 'JARVIS — пульт и чат');
    fab.title = 'JARVIS (клавиша J)';
    fab.textContent = 'J';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'jarvis-hud__panel';
    panel.id = 'jarvisPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'JARVIS panel');
    panel.innerHTML = `
      <h3>J.A.R.V.I.S. · Bezhaev Industries</h3>
      <div class="jarvis-hud__log" id="jarvisLog">Path OS online. HUD · лёгкий чат · Gemini Live.</div>
      <div class="jarvis-hud__cmds">
        <button type="button" data-jcmd="home">Солнце</button>
        <button type="button" data-jcmd="next">Дальше</button>
        <button type="button" data-jcmd="prev">Назад</button>
        <button type="button" data-jcmd="status">Статус</button>
        <button type="button" data-jcmd="listen">Слушать</button>
        <button type="button" data-jcmd="theme-void">Тема void</button>
        <button type="button" data-jcmd="theme-violet">Тема violet</button>
        <button type="button" data-jcmd="live">Live · Gemini</button>
      </div>
      <div class="jarvis-hud__links">
        <a href="${liveHref}" target="_blank" rel="noopener">Gemini Live ↗</a>
        <a href="${liveHref}chat.html" target="_blank" rel="noopener">Лёгкий chatbot ↗</a>
      </div>
      <div class="jarvis-hud__chat" id="jarvisChat">
        <div class="jarvis-hud__chat-log" id="jarvisChatLog" aria-live="polite"></div>
        <form id="jarvisChatForm" autocomplete="off">
          <input id="jarvisChatInput" type="text" maxlength="500" placeholder="Спросить JARVIS…" aria-label="Сообщение чату" />
          <button type="submit">→</button>
        </form>
      </div>
      <div class="jarvis-hud__key">
        <label for="jarvisKeyInput">Gemini API key (localStorage only)</label>
        <input id="jarvisKeyInput" type="password" autocomplete="off" placeholder="AIza… (опционально для умного чата / Live)" />
      </div>
    `;
    document.body.appendChild(panel);

    const log = (msg) => {
      const el = $('#jarvisLog');
      if (el) el.textContent = msg;
    };

    const chatLog = $('#jarvisChatLog');
    const appendChat = (who, text) => {
      if (!chatLog) return;
      const d = document.createElement('div');
      d.className = who === 'me' ? 'me' : 'bot';
      d.textContent = (who === 'me' ? 'Вы: ' : 'J: ') + text;
      chatLog.appendChild(d);
      chatLog.scrollTop = chatLog.scrollHeight;
    };
    appendChat('bot', 'Лёгкий чат Path. Без ключа — offline-база; с ключом — Gemini 2.0 Flash.');

    const clock = () => {
      const el = $('#jarvisClock');
      if (!el) return;
      el.textContent = new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    clock();
    setInterval(clock, 1000);

    const bayWatch = () => {
      const bay = $('#bayIndex');
      const label = $('#sectionLabel');
      const st = $('#jarvisBay');
      if (st) {
        st.textContent = bay
          ? `BAY ${bay.textContent || '—'}${label ? ' · ' + label.textContent : ''}`
          : 'BAY —';
      }
    };
    setInterval(bayWatch, 800);

    function goBay(delta) {
      const btn = delta > 0 ? $('#btnNext') : $('#btnPrev');
      btn?.click();
      log(delta > 0 ? 'Вперёд по орбите.' : 'Назад на один узел.');
    }
    function goHome() {
      $('#btnHome')?.click();
      log('К Солнцу. Центр орбиты.');
    }
    function setTheme(name) {
      const btn = document.querySelector(`.theme-card[data-theme="${name}"]`);
      if (btn) {
        btn.click();
        log(`Тема «${name}» активна.`);
      } else {
        document.documentElement.setAttribute('data-theme', name);
        log(`Тема «${name}» установлена.`);
      }
    }
    function status() {
      const pct = $('#progressPct')?.textContent || '0%';
      log(`Path ${pct}. Bezhaev Industries · systems nominal.`);
    }
    function openLive() {
      window.open(liveHref, '_blank', 'noopener');
      log('Открываю Gemini Live (мультимодал).');
    }

    function handleCmd(cmd) {
      switch (cmd) {
        case 'home': goHome(); break;
        case 'next': goBay(1); break;
        case 'prev': goBay(-1); break;
        case 'status': status(); break;
        case 'theme-void': setTheme('void'); break;
        case 'theme-violet': setTheme('violet'); break;
        case 'listen': startListen(); break;
        case 'live': openLive(); break;
        default: log('Команда не распознана.');
      }
    }

    panel.querySelectorAll('[data-jcmd]').forEach((b) => {
      b.addEventListener('click', () => handleCmd(b.getAttribute('data-jcmd')));
    });

    const keyInput = $('#jarvisKeyInput');
    if (keyInput) {
      keyInput.value = getApiKey();
      keyInput.addEventListener('change', () => {
        setApiKey(keyInput.value);
        log(keyInput.value ? 'API key сохранён в localStorage.' : 'API key очищен.');
      });
    }

    const form = $('#jarvisChatForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#jarvisChatInput');
      const text = (input?.value || '').trim();
      if (!text) return;
      if (input) input.value = '';
      appendChat('me', text);

      const offline = offlineReply(text);
      if (offline.startsWith('__CMD__:')) {
        handleCmd(offline.slice(8));
        appendChat('bot', 'Выполняю команду…');
        return;
      }

      const key = getApiKey() || (keyInput && keyInput.value.trim()) || '';
      if (key) {
        appendChat('bot', 'Думаю…');
        try {
          const ans = await geminiTextReply(text, key);
          // replace last "thinking" bubble
          const last = chatLog?.lastElementChild;
          if (last && last.classList.contains('bot') && last.textContent === 'J: Думаю…') {
            last.textContent = 'J: ' + ans;
          } else {
            appendChat('bot', ans);
          }
        } catch (err) {
          const last = chatLog?.lastElementChild;
          const msg = offline + ' (Gemini: ' + (err.message || err) + ')';
          if (last && last.classList.contains('bot')) last.textContent = 'J: ' + msg;
          else appendChat('bot', msg);
        }
      } else {
        appendChat('bot', offline);
      }
    });

    fab.addEventListener('click', () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        log('Слушаю. Чат, команды или Live. Клавиша J.');
        $('#jarvisChatInput')?.focus();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'j' || e.key === 'J') {
        if (e.target.matches('input, textarea, [contenteditable]')) return;
        e.preventDefault();
        panel.classList.toggle('is-open');
      }
      if (e.key === 'Escape') panel.classList.remove('is-open');
    });

    let rec = null;
    function startListen() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        log('Голос недоступен. Используйте кнопки или чат.');
        return;
      }
      if (rec) {
        try { rec.stop(); } catch { /* */ }
      }
      rec = new SR();
      rec.lang = 'ru-RU';
      rec.interimResults = false;
      fab.classList.add('is-listening');
      log('Слушаю…');
      rec.onresult = (ev) => {
        const text = (ev.results[0][0].transcript || '').toLowerCase();
        log('Вы: «' + text + '»');
        if (/солнц|home|домой|начало/.test(text)) handleCmd('home');
        else if (/дальше|вперёд|вперед|next/.test(text)) handleCmd('next');
        else if (/назад|prev|previous/.test(text)) handleCmd('prev');
        else if (/статус|status|доклад/.test(text)) handleCmd('status');
        else if (/live|джарвис live|gemini/.test(text)) handleCmd('live');
        else if (/void|войд|тёмн/.test(text)) handleCmd('theme-void');
        else if (/violet|фиолет/.test(text)) handleCmd('theme-violet');
        else {
          // feed speech into chat path
          const input = $('#jarvisChatInput');
          if (input) {
            input.value = text;
            form?.requestSubmit();
          } else log('Не уверен. Скажите: солнце, дальше, live, статус.');
        }
      };
      rec.onerror = () => {
        fab.classList.remove('is-listening');
        log('Не расслышал. Повторите.');
      };
      rec.onend = () => fab.classList.remove('is-listening');
      try {
        rec.start();
      } catch {
        log('Микрофон занят.');
      }
    }

    log('Path OS online. JARVIS · Bezhaev Industries.');
  }

  window.PathJarvis = { mount, getApiKey, setApiKey };
  document.addEventListener('path-boot-complete', () => mount());
})();
