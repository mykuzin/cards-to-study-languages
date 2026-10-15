(() => {
  "use strict";

  // ---------- Config ----------
  const LANGS = {
    en: { label: "English", speech: "en-GB" },
    es: { label: "Español", speech: "es-ES" },
  };

  const TOPICS = [
    { id: "travel",  name: "Travel",  alt: { en: "Travel",  es: "Viajes" },  uk: "Подорожі" },
    { id: "cuisine", name: "Cuisine", alt: { en: "Cuisine", es: "Cocina" },  uk: "Кухня" },
    { id: "family",  name: "Family",  alt: { en: "Family",  es: "Familia" }, uk: "Сім’я" },
  ];

  const LEVELS = [
    { id: "beginner",     name: "Beginner",     cefr: "A1–A2", dots: 1 },
    { id: "intermediate", name: "Intermediate", cefr: "B1–B2", dots: 2 },
    { id: "advanced",     name: "Advanced",     cefr: "C1–C2", dots: 3 },
  ];

  const DECK_SIZE = 50;

  const ICONS = {
    travel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
    cuisine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
    family: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6.5" r="2.5"/><circle cx="16.5" cy="8" r="2"/><path d="M3.5 20v-3.5A4.5 4.5 0 0 1 8 12a4.5 4.5 0 0 1 4.5 4.5V20"/><path d="M14 20v-3a3 3 0 0 1 5.5-1.6"/><path d="M19.5 20v-2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="16" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".6" fill="currentColor"/><circle cx="3.5" cy="12" r=".6" fill="currentColor"/><circle cx="3.5" cy="18" r=".6" fill="currentColor"/></svg>',
    reveal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  // ---------- Persistence ----------
  const STORE_KEY = "kartky:v1";
  const store = (() => {
    let data = { lang: "en", topic: "travel", level: "beginner", progress: {}, autoReveal: false };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) data = Object.assign(data, JSON.parse(raw));
    } catch (_) { /* storage unavailable: run in-memory */ }
    return {
      data,
      save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (_) {} },
    };
  })();

  const deckKey = (lang, topic, level) => `${lang}/${topic}/${level}`;
  const progressFor = (key) => (store.data.progress[key] ||= {});
  const statusOf = (key, word) => (store.data.progress[key] || {})[word];

  function countStatus(key) {
    const p = store.data.progress[key] || {};
    let known = 0, learning = 0;
    for (const w in p) { if (p[w] === "known") known++; else if (p[w] === "learning") learning++; }
    return { known, learning };
  }

  // ---------- Data loading (script tags work over file://) ----------
  window.DECKS = window.DECKS || {};
  const loading = {};
  function loadDeck(lang, topic, level) {
    const key = deckKey(lang, topic, level);
    if (window.DECKS[key]) return Promise.resolve(window.DECKS[key]);
    if (loading[key]) return loading[key];
    loading[key] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `data/${lang}/${topic}-${level}.js`;
      s.onload = () => window.DECKS[key] ? resolve(window.DECKS[key]) : reject(new Error("Deck is empty"));
      s.onerror = () => { delete loading[key]; s.remove(); reject(new Error("Deck not found")); };
      document.head.appendChild(s);
    });
    return loading[key];
  }

  // ---------- Helpers ----------
  const $app = document.getElementById("app");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const highlight = (s) => esc(s).replace(/\*([^*]+)\*/g, "<mark>$1</mark>");
  const plain = (s) => String(s).replace(/\*/g, "");
  const topicById = (id) => TOPICS.find((t) => t.id === id);
  const levelById = (id) => LEVELS.find((l) => l.id === id);

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let voices = [];
  function refreshVoices() { voices = "speechSynthesis" in window ? speechSynthesis.getVoices() : []; }
  if ("speechSynthesis" in window) { refreshVoices(); speechSynthesis.onvoiceschanged = refreshVoices; }
  function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(plain(text));
    const tag = LANGS[lang].speech;
    u.lang = tag;
    u.voice = voices.find((v) => v.lang === tag) || voices.find((v) => v.lang.startsWith(lang)) || null;
    u.rate = 0.92;
    speechSynthesis.speak(u);
  }

  // ---------- State ----------
  const state = {
    view: "home",        // home | loading | study | done | error
    mode: "card",        // card | list
    deck: [],
    order: [],           // indices into deck
    pos: 0,
    revealed: false,
    shuffled: false,
    reviewOnly: false,
    listFilter: "all",
    enter: "",
  };

  const cur = () => ({ lang: store.data.lang, topic: store.data.topic, level: store.data.level });
  const curKey = () => deckKey(store.data.lang, store.data.topic, store.data.level);

  // ---------- Header language switch ----------
  const $langSwitch = document.getElementById("lang-switch");
  function renderLangSwitch() {
    $langSwitch.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === store.data.lang)));
  }
  $langSwitch.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lang]");
    if (!b || b.dataset.lang === store.data.lang) return;
    store.data.lang = b.dataset.lang;
    store.save();
    renderLangSwitch();
    if (state.view === "home") renderHome();
    else startStudy({ reviewOnly: false });
  });

  // ---------- Home ----------
  function renderHome() {
    state.view = "home";
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    const { lang, topic, level } = cur();

    const topicTiles = TOPICS.map((t) => {
      const { known } = countStatus(deckKey(lang, t.id, level));
      const pct = Math.round((known / DECK_SIZE) * 100);
      return `
        <button class="topic" role="radio" aria-checked="${t.id === topic}" data-topic="${t.id}">
          ${ICONS[t.id]}
          <span class="check">${ICONS.check}</span>
          <span class="topic-text">
            <span class="topic-name">${esc(t.alt[lang])}</span>
            <span class="topic-alt">${esc(t.uk)}</span>
          </span>
          <span class="topic-progress">
            <span class="bar"><i style="width:${pct}%"></i></span>
            <small>${known} of ${DECK_SIZE} known · ${levelById(level).name.toLowerCase()}</small>
          </span>
        </button>`;
    }).join("");

    const levelTiles = LEVELS.map((l) => `
      <button class="level" role="radio" aria-checked="${l.id === level}" data-level="${l.id}">
        <span><b>${l.name}</b> <small>${l.cefr}</small></span>
        <span class="dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= l.dots ? "on" : ""}"></i>`).join("")}</span>
      </button>`).join("");

    const { known, learning } = countStatus(curKey());
    const note = known + learning
      ? `${known} known · ${learning} learning in this set`
      : `${DECK_SIZE} cards · word, meaning, Ukrainian translation & 3 examples`;

    $app.innerHTML = `
      <section class="view home">
        <div class="hero">
          <h1>Learn <em>${lang === "es" ? "Spanish" : "English"}</em>,<br>one card at a time.</h1>
          <p>Pick a topic and your level. You’ll get ${DECK_SIZE} words with clear explanations, Ukrainian translations and everyday examples.</p>
        </div>

        <div class="step-label">Topic</div>
        <div class="topics" role="radiogroup" aria-label="Topic">${topicTiles}</div>

        <div class="step-label">Level</div>
        <div class="levels" role="radiogroup" aria-label="Level">${levelTiles}</div>

        <div class="start-row">
          <button class="btn btn--primary" data-action="start">Start studying ${ICONS.next}</button>
          <span class="note">${note}</span>
        </div>
      </section>`;
  }

  $app.addEventListener("click", (e) => {
    const t = e.target.closest("[data-topic], [data-level], [data-action]");
    if (!t) return;
    if (t.dataset.topic) { store.data.topic = t.dataset.topic; store.save(); renderHome(); return; }
    if (t.dataset.level) { store.data.level = t.dataset.level; store.save(); renderHome(); return; }
    handleAction(t.dataset.action, t, e);
  });

  document.querySelector('[data-action="home"]').addEventListener("click", (e) => { e.preventDefault(); goHome(); });

  function goHome() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    renderLangSwitch();
    renderHome();
    window.scrollTo(0, 0);
  }

  // ---------- Study ----------
  async function startStudy({ reviewOnly = false } = {}) {
    const { lang, topic, level } = cur();
    state.view = "loading";
    $app.innerHTML = `<div class="loading">Loading cards…</div>`;
    history.replaceState(null, "", `#${lang}/${topic}/${level}`);
    try {
      state.deck = await loadDeck(lang, topic, level);
    } catch (err) {
      state.view = "error";
      $app.innerHTML = `<div class="view error"><p>Couldn’t load this set (${esc(err.message)}).</p><button class="btn" data-action="home">Back to topics</button></div>`;
      return;
    }
    const key = curKey();
    let idx = state.deck.map((_, i) => i);
    if (reviewOnly) idx = idx.filter((i) => statusOf(key, state.deck[i].word) !== "known");
    state.reviewOnly = reviewOnly;
    state.order = state.shuffled ? shuffled(idx) : idx;
    state.pos = 0;
    state.revealed = store.data.autoReveal;
    state.view = "study";
    state.enter = "";
    renderStudy();
    window.scrollTo(0, 0);
  }

  function header() {
    const { lang, topic, level } = cur();
    const t = topicById(topic), l = levelById(level);
    return `
      <div class="study-head">
        <div class="crumbs">
          <button class="icon-btn" data-action="home" aria-label="Back to topics">${ICONS.back}</button>
          <div class="crumb-title">${esc(t.alt[lang])} <span>· ${l.name}${state.reviewOnly ? " · review" : ""}</span></div>
        </div>
        <div class="head-tools">
          <button class="icon-btn" data-action="toggle-shuffle" aria-pressed="${state.shuffled}" title="Shuffle">${ICONS.shuffle}</button>
          <button class="icon-btn" data-action="toggle-autoreveal" aria-pressed="${store.data.autoReveal}" title="Always show details">${ICONS.reveal}</button>
          <button class="icon-btn" data-action="toggle-mode" aria-pressed="${state.mode === "list"}" title="${state.mode === "list" ? "Card view" : "List of all words"}">${state.mode === "list" ? ICONS.cards : ICONS.list}</button>
        </div>
      </div>`;
  }

  function progressBar() {
    const { known, learning } = countStatus(curKey());
    const total = state.deck.length || DECK_SIZE;
    const pos = state.mode === "card" ? `${Math.min(state.pos + 1, state.order.length)} / ${state.order.length}` : `${known} / ${total} known`;
    return `
      <div class="progress" aria-label="${known} known, ${learning} learning">
        <div class="track"><i class="k" style="width:${(known / total) * 100}%"></i><i class="l" style="width:${(learning / total) * 100}%"></i></div>
        <div class="count">${pos}</div>
      </div>`;
  }

  function renderStudy() {
    if (state.mode === "list") return renderList();
    const card = state.deck[state.order[state.pos]];
    if (!card) return renderDone();
    const { lang } = cur();
    const status = statusOf(curKey(), card.word);
    const statusTag = status ? `<span class="status-tag ${status}">${status === "known" ? "Known" : "Learning"}</span>` : "";

    $app.innerHTML = `
      <section class="view study">
        ${header()}
        ${progressBar()}
        <article class="card ${state.revealed ? "is-revealed" : ""} ${state.enter}" tabindex="0" data-action="reveal" aria-label="Flashcard">
          <div class="card-top">
            <div class="card-top-left"><span class="pos">${esc(card.pos)}</span>${statusTag}</div>
            <button class="icon-btn" data-action="speak-word" aria-label="Pronounce">${ICONS.speak}</button>
          </div>
          <div class="word-wrap">
            <h2 class="word" lang="${lang}">${esc(card.word)}</h2>
            <div class="reveal-hint">Tap to see meaning, translation & examples</div>
            <div class="details">
              <p class="translation" lang="uk">${esc(card.translation)}</p>
              <p class="explanation" lang="${lang}">${esc(card.explanation)}</p>
              <p class="ex-label">${lang === "es" ? "Ejemplos" : "Examples"}</p>
              <ul class="examples" lang="${lang}">
                ${card.examples.map((ex, i) => `
                  <li><p>${highlight(ex)}</p><button class="icon-btn" data-action="speak-ex" data-i="${i}" aria-label="Read example aloud">${ICONS.speak}</button></li>`).join("")}
              </ul>
            </div>
          </div>
        </article>

        <div class="controls">
          <button class="btn nav-btn" data-action="prev" aria-label="Previous" ${state.pos === 0 ? "disabled" : ""}>${ICONS.back}</button>
          <button class="btn btn--learning ${status === "learning" ? "active" : ""}" data-action="mark-learning">Still learning</button>
          <button class="btn btn--known ${status === "known" ? "active" : ""}" data-action="mark-known">I know it</button>
          <button class="btn nav-btn" data-action="next" aria-label="Next">${ICONS.next}</button>
        </div>
        <div class="kbd-hint"><kbd>Space</kbd> reveal &nbsp; <kbd>←</kbd> <kbd>→</kbd> navigate &nbsp; <kbd>1</kbd> still learning &nbsp; <kbd>2</kbd> I know it &nbsp; <kbd>P</kbd> pronounce</div>
      </section>`;
    state.enter = "";
    attachSwipe($app.querySelector(".card"));
  }

  function renderList() {
    const key = curKey();
    const counts = countStatus(key);
    const unmarked = state.deck.length - counts.known - counts.learning;
    const filters = [
      ["all", "All", state.deck.length],
      ["learning", "Learning", counts.learning],
      ["known", "Known", counts.known],
      ["new", "Not marked", unmarked],
    ];
    const rows = state.deck
      .map((c, i) => ({ c, i, s: statusOf(key, c.word) }))
      .filter(({ s }) => state.listFilter === "all" || (state.listFilter === "new" ? !s : s === state.listFilter))
      .map(({ c, i, s }) => `
        <button class="row" data-action="open-card" data-i="${i}">
          <span class="n">${i + 1}</span>
          <span><span class="w">${esc(c.word)}</span><span class="t">${esc(c.translation)}</span></span>
          <span class="dot ${s || ""}" title="${s || "not marked"}"></span>
        </button>`).join("");

    $app.innerHTML = `
      <section class="view study">
        ${header()}
        ${progressBar()}
        <div class="filters">
          ${filters.map(([id, label, n]) => `<button class="chip" data-action="filter" data-filter="${id}" aria-pressed="${state.listFilter === id}">${label}<small>${n}</small></button>`).join("")}
        </div>
        <div class="list">${rows || `<div class="empty">Nothing here yet.</div>`}</div>
      </section>`;
  }

  function renderDone() {
    state.view = "done";
    const { known, learning } = countStatus(curKey());
    const unmarked = state.deck.length - known - learning;
    const toReview = learning + unmarked;
    $app.innerHTML = `
      <section class="view study">
        ${header()}
        <div class="done">
          <h2>${toReview === 0 ? "All 50 known!" : "Set complete"}</h2>
          <p>${toReview === 0 ? "Great work — try the next level or another topic." : "Here’s where you are with this set."}</p>
          <div class="stats">
            <div class="stat known"><b>${known}</b><span>known</span></div>
            <div class="stat learning"><b>${learning}</b><span>learning</span></div>
            <div class="stat"><b>${unmarked}</b><span>not marked</span></div>
          </div>
          <div class="done-actions">
            ${toReview ? `<button class="btn btn--primary" data-action="review">Review ${toReview} remaining ${ICONS.next}</button>` : ""}
            <button class="btn" data-action="restart">Go through all ${state.deck.length} again</button>
            <button class="btn btn--ghost" data-action="home">Choose another topic</button>
          </div>
        </div>
      </section>`;
  }

  function go(delta) {
    const next = state.pos + delta;
    if (next < 0) return;
    if (next >= state.order.length) { renderDone(); return; }
    state.pos = next;
    state.revealed = store.data.autoReveal;
    state.enter = delta > 0 ? "enter-next" : "enter-prev";
    renderStudy();
  }

  function mark(status) {
    const card = state.deck[state.order[state.pos]];
    if (!card) return;
    const p = progressFor(curKey());
    p[card.word] = status;
    store.save();
    go(1);
  }

  function handleAction(action, el, e) {
    const card = state.deck[state.order[state.pos]];
    switch (action) {
      case "home": e && e.preventDefault(); goHome(); break;
      case "start": state.mode = "card"; startStudy(); break;
      case "reveal":
        if (!state.revealed) { state.revealed = true; el.classList.add("is-revealed"); }
        break;
      case "speak-word": e.stopPropagation(); speak(card.word, store.data.lang); break;
      case "speak-ex": e.stopPropagation(); speak(card.examples[+el.dataset.i], store.data.lang); break;
      case "prev": go(-1); break;
      case "next": go(1); break;
      case "mark-known": mark("known"); break;
      case "mark-learning": mark("learning"); break;
      case "toggle-shuffle":
        state.shuffled = !state.shuffled;
        if (state.view === "study") {
          const current = state.order[state.pos];
          const rest = state.order.filter((i) => i !== current);
          state.order = [current, ...(state.shuffled ? shuffled(rest) : rest.sort((a, b) => a - b))];
          state.pos = 0;
          renderStudy();
        } else { el.setAttribute("aria-pressed", String(state.shuffled)); }
        break;
      case "toggle-autoreveal":
        store.data.autoReveal = !store.data.autoReveal;
        store.save();
        if (state.view === "study") { state.revealed = store.data.autoReveal; renderStudy(); }
        else el.setAttribute("aria-pressed", String(store.data.autoReveal));
        break;
      case "toggle-mode":
        state.mode = state.mode === "list" ? "card" : "list";
        state.view = "study";
        if (state.pos >= state.order.length) state.pos = 0;
        renderStudy();
        break;
      case "filter": state.listFilter = el.dataset.filter; renderList(); break;
      case "open-card": {
        const i = +el.dataset.i;
        let p = state.order.indexOf(i);
        if (p === -1) { state.order = state.deck.map((_, j) => j); state.reviewOnly = false; p = i; }
        state.pos = p;
        state.mode = "card";
        state.revealed = true;
        state.view = "study";
        renderStudy();
        window.scrollTo(0, 0);
        break;
      }
      case "review": state.mode = "card"; startStudy({ reviewOnly: true }); break;
      case "restart": state.mode = "card"; startStudy({ reviewOnly: false }); break;
    }
  }

  // ---------- Keyboard & touch ----------
  document.addEventListener("keydown", (e) => {
    if (state.view !== "study" || state.mode !== "card" || e.metaKey || e.ctrlKey || e.altKey) return;
    const onButton = e.target.closest && e.target.closest("button");
    switch (e.key) {
      case " ":
      case "Enter":
        if (onButton) return;
        e.preventDefault();
        if (!state.revealed) { state.revealed = true; $app.querySelector(".card").classList.add("is-revealed"); }
        else go(1);
        break;
      case "ArrowRight": go(1); break;
      case "ArrowLeft": go(-1); break;
      case "1": mark("learning"); break;
      case "2": mark("known"); break;
      case "p": case "P": speak(state.deck[state.order[state.pos]].word, store.data.lang); break;
    }
  });

  function attachSwipe(el) {
    if (!el) return;
    let x0 = null, y0 = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    });
  }

  // ---------- Boot ----------
  function bootFromHash() {
    const m = location.hash.match(/^#(en|es)\/(\w+)\/(\w+)$/);
    if (m && topicById(m[2]) && levelById(m[3])) {
      store.data.lang = m[1]; store.data.topic = m[2]; store.data.level = m[3];
      store.save();
      renderLangSwitch();
      state.mode = "card";
      startStudy();
    } else {
      renderLangSwitch();
      renderHome();
    }
  }
  bootFromHash();
})();
