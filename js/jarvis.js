/**
 * Persistent JARVIS HUD — functional Stark tech layer (not merch).
 * Inspired by open Jarvis/HUD patterns: voice commands, system status,
 * arc-reactor control, bay navigation, theme switch — pure client-side.
 */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  function mount() {
    if (document.getElementById('jarvisHud')) return;

    const hud = document.createElement('div');
    hud.className = 'jarvis-hud is-on';
    hud.id = 'jarvisHud';
    hud.innerHTML = `
      <div class="jarvis-hud__corner jarvis-hud__corner--tl" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--tr" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--bl" aria-hidden="true"></div>
      <div class="jarvis-hud__corner jarvis-hud__corner--br" aria-hidden="true"></div>
      <div class="jarvis-hud__status" id="jarvisStatus" aria-live="polite">
        <div>JARVIS · STANDBY</div>
        <div id="jarvisClock">--:--:--</div>
        <div id="jarvisBay">BAY —</div>
      </div>
    `;
    document.body.appendChild(hud);

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'jarvis-hud__fab';
    fab.id = 'jarvisFab';
    fab.setAttribute('aria-label', 'JARVIS — голосовые команды');
    fab.title = 'JARVIS (или клавиша J)';
    fab.textContent = 'J';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'jarvis-hud__panel';
    panel.id = 'jarvisPanel';
    panel.innerHTML = `
      <h3>J.A.R.V.I.S.</h3>
      <div class="jarvis-hud__log" id="jarvisLog">Сэр, системы в норме. Скажите «солнце», «дальше», «тема void» или нажмите команду.</div>
      <div class="jarvis-hud__cmds">
        <button type="button" data-jcmd="home">Солнце</button>
        <button type="button" data-jcmd="next">Дальше</button>
        <button type="button" data-jcmd="prev">Назад</button>
        <button type="button" data-jcmd="status">Статус</button>
        <button type="button" data-jcmd="listen">Слушать</button>
        <button type="button" data-jcmd="theme-void">Тема void</button>
        <button type="button" data-jcmd="theme-violet">Тема violet</button>
      </div>
    `;
    document.body.appendChild(panel);

    const log = (msg) => {
      const el = $('#jarvisLog');
      if (el) el.textContent = msg;
    };

    const clock = () => {
      const el = $('#jarvisClock');
      if (!el) return;
      const d = new Date();
      el.textContent = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    clock();
    setInterval(clock, 1000);

    // Bay tracker from path.js global events / DOM
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
      log(delta > 0 ? 'Перемещаю вас вперёд по орбите.' : 'Откатываю путь на один узел.');
    }

    function goHome() {
      $('#btnHome')?.click();
      log('Возвращаю к Солнцу. Центр орбиты.');
    }

    function setTheme(name) {
      const btn = document.querySelector(`.theme-card[data-theme="${name}"]`);
      if (btn) {
        btn.click();
        log(`Тема «${name}» активирована. Эстетика обновлена.`);
      } else {
        document.documentElement.setAttribute('data-theme', name);
        log(`Тема «${name}» установлена напрямую.`);
      }
    }

    function status() {
      const pct = $('#progressPct')?.textContent || '0%';
      log(`Статус: Path ${pct}. Связь стабильна. Я здесь, если нужно.`);
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
        default: log('Команда не распознана. Попробуйте: дальше, назад, солнце, статус.');
      }
    }

    panel.querySelectorAll('[data-jcmd]').forEach((b) => {
      b.addEventListener('click', () => handleCmd(b.getAttribute('data-jcmd')));
    });

    fab.addEventListener('click', () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        log('Слушаю. Или нажмите команду. Клавиша J — тоже я.');
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
        log('Голосовой ввод недоступен в этом браузере. Используйте кнопки.');
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
        else if (/void|войд|тёмн/.test(text)) handleCmd('theme-void');
        else if (/violet|фиолет/.test(text)) handleCmd('theme-violet');
        else log('Не уверен. Скажите: солнце, дальше, назад, статус.');
      };
      rec.onerror = () => {
        fab.classList.remove('is-listening');
        log('Не расслышал. Повторите или нажмите команду.');
      };
      rec.onend = () => fab.classList.remove('is-listening');
      try {
        rec.start();
      } catch {
        log('Микрофон занят. Попробуйте снова.');
      }
    }

    log('Path OS online. Я JARVIS-слой этого сайта. Не декорация — пульт.');
  }

  window.PathJarvis = { mount };

  // If boot skipped
  document.addEventListener('path-boot-complete', () => mount());
})();
