/* =========================================================
   MathInClass – מעטפת "ספריית מחברות" (גרסת ניסיון, כיתה ו')
   העיקרון: האתר הקיים (math6.html) רץ כמו שהוא בתוך מסגרת, עם כל
   המחוללים, ההסברים, ההתקדמות והמשובים. המעטפת רק:
   (1) קוראת ממנו את הנושאים וההתקדמות (מה שהוא עצמו מציג),
   (2) מציגה אותם כספריית מחברות, ו-(3) "לוחצת" על הכפתורים המקוריים.
   אין כאן מחולל, ציון או חישוב התקדמות משלנו.
   ========================================================= */
(function () {
  'use strict';
  const GRADE = 6;
  const SITE = 'math6.html?grade=' + GRADE;
  const { ic, ART } = window.NB_ART;
  const GART = window.NB_GART;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const J = JSON.stringify;
  const clean = s => String(s || '').replace(/[\u200E\u200F\u2066-\u2069]/g, '').replace(/\s+/g, ' ').replace(/^[^\p{L}\p{N}(]+/u, '').trim(); // בלי אימוג'י בתחילת השם
  const view = $('#view'), stage = $('#stage'), F = $('#site'), toc = $('#toc'), shead = $('#shead');

  // צבע קבוע לכל משפחת נושאים
  // "צבעי אייפד" (איריס 28.11) – אותו צבע לכריכה, לחוצצים ולמחברת הפתוחה של הנושא
  const CAT = {
    nat: { c: '#E2B65C' }, dec: { c: '#4FA3A5' }, frac: { c: '#6E8FC4' }, geo: { c: '#79A88A' }, sol: { c: '#9DB660' },
    pct: { c: '#D88A6A' }, data: { c: '#8C8FB8' }, word: { c: '#C98FA8' }, exc: { c: '#34495E', dark: true }
  };
  const catColor = id => (CAT[id] || CAT.nat).c;
  const coverColor = catColor;

  /* ---------------- המסגרת: האתר הקיים ---------------- */
  let W = null, D = null, isSite = false, isCoach = false, data = null, quietUntil = 0;
  const run = code => { try { return W.eval(code); } catch (e) { console.warn('[nb]', e); return null; } };
  const SKIN_V = '281128h';
  function skin() {
    if (!D || !D.head || D.documentElement.classList.contains('nbskin')) return;
    if (isSite && /[?&]print/.test(W.location.search)) return; // דפי הדפסה – בלי שינוי (מדידת העמודים)
    if (!isSite && !isCoach) return;
    const f = D.createElement('link'); f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap'; D.head.appendChild(f);
    const l = D.createElement('link'); l.rel = 'stylesheet'; l.href = (isSite ? 'nb/skin.css' : 'nb/coach.css') + '?v=' + SKIN_V; D.head.appendChild(l);
    D.documentElement.classList.add('nbskin');
    frameTone();
  }
  // צבע התחום (כמו צבע החוצץ) ומצב המסך – על שורש המסגרת, כדי שהעור יצבע כותרות, התקדמות ובחירה בצבע התחום
  function frameTone() {
    if (!D || !D.documentElement) return;
    const r = D.documentElement, cat = mode.v === 'course' ? mode.ccat : mode.cat;
    r.style.setProperty('--cv', catColor(cat || 'frac'));
    r.classList.toggle('nb-topic', mode.v === 'topic');
    r.classList.toggle('nb-stage', stageModes.includes(mode.v));
  }
  let loadWait = [];
  F.addEventListener('load', () => {
    try { W = F.contentWindow; D = W.document; } catch (e) { W = D = null; return; }
    const p = W.location.pathname;
    isSite = /\/math6\.html$/.test(p) && !new URLSearchParams(W.location.search).has('print'); isCoach = /\/coach\.html$/.test(p);
    $('#loading').hidden = true;
    skin();
    syncFont();
    new W.MutationObserver(onFrame).observe(D.body, { childList: true, subtree: true });
    const w = loadWait; loadWait = []; w.forEach(f => f());
    if (isSite && !data) { scrape(); route(); return; }
    // חזרה מדף חיצוני (גופים, סודוקו, אוילר…) לאתר – חוזרים למחברת
    if (isSite && mode.v === 'ext') { scrape(); return go(mode.cat ? { v: 'notebook', cat: mode.cat } : { v: 'library' }); }
    if (!isSite && !isCoach && !['ext', 'course'].includes(mode.v)) { mode = { v: 'ext', cat: mode.cat, name: D.title || '' }; showStage(true); }
    onFrame();
  });
  const ensure = kind => new Promise(res => {
    const ok = kind === 'site' ? isSite : isCoach;
    if (ok && D && D.readyState !== 'loading') return res();
    loadWait.push(res);
    if (kind === 'site') { $('#loading').hidden = false; F.src = SITE; }
  });
  const atHome = () => !!(D && D.querySelector('#app .panels'));

  // קריאת הנתונים מהאתר: מציירים את דף הבית שלו (מוסתר) וקוראים ממנו – אותם מספרים שהתלמיד רואה שם
  let lastScrape = 0, classGames = null;
  const CG_SKIP = ['clsOpen', 'cmpSheetGo', 'clsBack']; // פתיח שיעור ודף עבודה – לא משחקים
  function scrape() {
    if (!isSite) return;
    lastScrape = Date.now();
    quietUntil = Date.now() + 400;
    run("topicBack = null; homeTab = 'practice'; home();");
    const A = D.getElementById('app');
    const tiles = [...A.querySelectorAll('.tcat-tile')].map(b => {
      const m = /catShow\('(\w+)'\)/.exec(b.getAttribute('onclick') || '');
      const bar = b.querySelector('.mbar span');
      return { id: m && m[1], name: clean(b.querySelector('.tt-nm').textContent), cnt: clean(b.querySelector('.tt-n').textContent), avg: bar ? parseFloat(bar.style.width) || 0 : 0 };
    }).filter(t => t.id);
    const items = {};
    A.querySelectorAll('.tcat-one').forEach(sec => {
      const list = [];
      sec.querySelectorAll('.geo-sub, .geo-sub2, .topic, .xt-tile, .tool-chip').forEach(e => {
        if (e.matches('.geo-sub, .geo-sub2')) return list.push({ k: 'sub', name: clean(e.textContent).replace(/:$/, '') });
        const nm = e.querySelector('.nm, .xt-nm'), ds = e.querySelector('.ds, .xt-ds'), bar = e.querySelector('.mbar span'), best = e.querySelector('.best');
        const base = { name: clean(nm ? nm.textContent : e.textContent), desc: ds ? clean(ds.textContent) : '' };
        if (e.matches('a')) return list.push(Object.assign(base, { k: 'link', href: e.getAttribute('href') }));
        if (e.dataset.t) return list.push(Object.assign(base, { k: 'topic', id: e.dataset.t, m: bar ? parseFloat(bar.style.width) || 0 : 0, best: best ? clean(best.textContent) : '' }));
        if (e.matches('.tool-chip')) return list.push(Object.assign(base, { k: 'tool', id: e.id }));
        if (e.id) list.push(Object.assign(base, { k: 'extra', id: e.id }));
      });
      items[sec.dataset.cat] = list;
    });
    const cont = A.querySelector('.card.cont');
    const tabs = [...A.querySelectorAll('.nb > .tabs .tab')].map(b => ({ id: b.dataset.tab || b.id, label: clean(b.textContent), go: !b.dataset.tab }));
    const lsAll = run('[...TOPICS, ...XTOPICS].map(t => [t.id, topicLessons(t.id).map(l => ({ id: l, name: LESSONS[l].name, k: learnedSet(l).size, all: cardsOf(l).length }))])') || [];
    // השערים (משחקים, מבדקים, אימון כפל, אזור המורה): הכפתורים המקוריים של האתר, לפי הסדר והכותרות שלו
    const gate = id => {
      const pn = A.querySelector(`[data-panel="${id}"]`); if (!pn) return null;
      const secs = [{ t: '', items: [] }];
      pn.querySelectorAll('h3.games-sub, button[id]').forEach(e => {
        if (e.matches('h3')) return secs.push({ t: clean(e.textContent), items: [] });
        if (e.closest('.champ-card, .champ-lock') || e.id === 'champGo') return;
        const nm = e.querySelector('.gc-nm, .kf-o-t'), ds = e.querySelector('.gc-ds, .desc, .kf-o-d');
        const name = clean(nm ? nm.textContent : [...e.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join(' '));
        secs[secs.length - 1].items.push({ id: e.id, name: name.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim(), desc: ds ? String(ds.textContent).replace(/[\u200E\u200F\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim() : '' });
      });
      return secs.filter(x => x.items.length);
    };
    const gates = {}; ['games', 'tests', 'kefel', 'teach'].forEach(id => { const g = gate(id); if (g) gates[id] = g; });
    // המשחקים הכיתתיים – כל משחק בנפרד, כפי שהם במסך "משחק לכל הכיתה" של האתר (למורה)
    if (run('teacherOn()') && !classGames) {
      run("classSub('games')");
      classGames = [...A.querySelectorAll('.game-card[id]')].filter(b => !CG_SKIP.includes(b.id)).map(b => ({ id: b.id, name: clean((b.querySelector('.gc-nm') || b).textContent).replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').trim(), desc: String((b.querySelector('.gc-ds') || {}).textContent || '').replace(/[\u200E\u200F\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim() }));
      run("topicBack = null; homeTab = 'practice'; home();");
    }
    data = {
      tiles, items, tabs, gates,
      lessons: Object.fromEntries(lsAll),
      allLessons: run('LESSON_ORDER.map(id => ({ id, name: LESSONS[id].name, t: lessonTopic(LESSONS[id]), cat: catOf(lessonTopic(LESSONS[id])) }))') || [],
      cont: cont && D.getElementById('contGo') ? { k: clean((cont.querySelector('.today-k') || {}).textContent), t: clean((cont.querySelector('.today-t') || {}).textContent), d: clean((cont.querySelector('.today-d') || {}).textContent), btn: clean(D.getElementById('contGo').textContent).replace(/[←\s]+$/, '') } : null,
      // אתגר אלופים – תנאי הפתיחה של האתר עצמו (champOpen: אחרי סבב של 5 שאלות ומעלה עם 80% ומעלה; מורה – תמיד), בלי שינוי
      champ: { open: !!run('champOpen()') },
      games: [...A.querySelectorAll('[data-panel="games"] .game-card[id]')].map(b => ({ id: b.id, name: clean((b.querySelector('.gc-nm') || b).textContent) })),
      teacher: !!run('teacherOn()'), cred: !!run('teacherCred()'),
      name: run('store.name') || '',
      ver: clean((D.querySelector('footer.credit .ver') || {}).textContent).replace(/^·\s*/, ''),
      tests: [D.getElementById('testPick') && { id: 'testPick', name: 'מבדק – 20 שאלות מכל הנושאים' }, D.getElementById('mkGo') && { id: 'mkGo', name: clean(D.getElementById('mkGo').firstChild.textContent || 'אימון לקראת המבדק') }].filter(Boolean)
    };
    data.catOfLesson = id => { const l = data.allLessons.find(x => x.id === id); return l ? l.cat : null; };
    renderChrome();
  }

  /* ---------------- מצב המסך ---------------- */
  // v: library | notebook(cat) | topics | courses | topic(id,cat) | act(cat,name,tab?) | area(tab) | course(id) | ext
  let mode = { v: 'library' };
  function go(m, push = true) {
    mode = m;
    if (push) { try { history.pushState({ nb: 1 }, '', '#' + routeKey(m)); } catch (e) { /* לא חובה */ } }
    render();
  }
  const routeKey = m => m.v === 'gate' ? 'g-' + m.g : m.v === 'notebook' ? 'nb-' + m.cat : ['library', 'topics', 'courses'].includes(m.v) ? (m.v === 'library' ? '' : m.v) : '';
  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith('nb-') && CAT[h.slice(3)]) mode = { v: 'notebook', cat: h.slice(3) };
    else if (h === 'topics' || h === 'courses') mode = { v: h };
    else if (h.startsWith('g-')) mode = { v: 'gate', g: h.slice(2) };
    else mode = { v: 'library' };
    render();
  }
  window.addEventListener('popstate', e => { if (e.state && e.state.nb) { leaveStage(); route(); } });

  const stageModes = ['topic', 'act', 'area', 'course', 'ext'];
  function render() {
    renderChrome();
    if (stageModes.includes(mode.v)) { showStage(true); updateStage(); return; }
    showStage(false);
    // הנתונים נקראים מחדש בכל כניסה למסך ספרייה (התקדמות, אתגר אלופים, שם)
    if (isSite && data && Date.now() - lastScrape > 300) scrape();
    if (!data) { view.innerHTML = '<div class="view-in"><p class="muted">טוענים את הספרייה…</p></div>'; return; }
    view.classList.toggle('lib', mode.v === 'library' || mode.v === 'gate' || mode.v === 'courses' || (mode.v === 'notebook' && mode.cat === 'exc'));
    view.innerHTML = '<div class="view-in">' + (mode.v === 'gate' ? gateHTML(mode.g) : mode.v === 'notebook' ? (mode.cat === 'exc' && data.items.exc ? excHTML() : notebookHTML(mode.cat)) : mode.v === 'topics' ? topicsHTML() : mode.v === 'courses' ? coursesHTML() : libraryHTML()) + '</div>';
    view.scrollTop = 0;
    bindView();
  }
  function showStage(on) {
    stage.classList.toggle('off', !on);
    view.hidden = on;
    stage.classList.remove('tocopen');
  }
  // יוצאים מהמסך הפנימי: אם באמצע סבב – אותה שאלה כמו באתר; האתר חוזר לדף הבית שלו (עוצר שעונים) ונקרא מחדש
  function leaveStage(ask) {
    if (isSite && ask && run('state && state.mode') && !confirm('לצאת מהסבב? ההתקדמות בסבב הזה לא תישמר.')) return false;
    if (isSite) scrape(); else ensure('site').then(() => { scrape(); if (!stageModes.includes(mode.v)) render(); });
    return true;
  }

  /* ---------------- אזור עליון וניווט ---------------- */
  const NAV = () => {
    const t = id => data && data.tabs.find(x => x.id === id);
    return [
      { id: 'home', label: 'דף הבית', icon: 'home', main: 1 },
      { id: 'topics', label: 'נושאים', icon: 'list', main: 0 },
      { id: 'courses', label: 'קורסים', icon: 'cap', main: 1 },
      { id: 'games', label: 'משחקים', icon: 'game', main: 1, on: !!t('games') },
      { id: 'tests', label: 'מבדקים', icon: 'check', main: 1, on: !!t('tests') },
      { id: 'exc', label: 'מצוינות', icon: 'spark', on: !!(data && data.items.exc) },
      { id: 'tools', label: 'כלי המחשה', icon: 'tool', on: !!(data && allTools().length) },
      { sep: 1 },
      { id: 'kefel', label: 'אימון כפל', icon: 'times', on: !!t('kefel') },
      { id: 'hiluk', label: 'אימון חילוק', icon: 'divide', on: !!t('hiluk') },
      { id: 'exitTab', label: 'כרטיס יציאה', icon: 'ticket', on: !!t('exitTab') },
      { id: 'print', label: 'הדפסה', icon: 'printer' },
      { id: 'teach', label: 'אזור המורה', icon: 'brief', on: !!t('teach') }
    ].filter(x => x.on !== false);
  };
  const activeNav = () => mode.v === 'library' ? 'home' : mode.v === 'topics' ? 'topics' : ['courses', 'course'].includes(mode.v) ? 'courses'
    : mode.v === 'gate' ? mode.g : mode.v === 'area' ? (mode.gate || (mode.tab === 'wp' ? 'home' : mode.tab)) : (mode.cat === 'exc' ? 'exc' : 'home');
  const nvBtn = (n, cur) => `<button type="button" class="nv" data-nav="${n.id}"${n.id === cur ? ' aria-current="page"' : ''}>${ic(n.icon)}<span>${n.label}</span></button>`;
  function renderChrome() {
    const nav = NAV(), cur = activeNav();
    $('#rail').innerHTML = nav.map(n => n.sep ? '<div class="sep" role="separator"></div>' : nvBtn(n, cur)).join('') + '<div class="sep" role="separator"></div>' + `<button type="button" class="nv" data-pop="help">${ic('help')}<span>עזרה</span></button>`;
    const main = nav.filter(n => n.main), more = nav.filter(n => !n.main && !n.sep);
    $('#tabbar').innerHTML = main.map(n => nvBtn(n, cur)).join('') + `<button type="button" class="nv" id="moreBtn" aria-haspopup="dialog"${more.some(n => n.id === cur) ? ' aria-current="page"' : ''}>${ic('more')}<span>עוד</span></button>`;
    const nm = data && data.name;
    $('#acts').innerHTML = `
      <button type="button" class="pill icon phone" data-pop="search" aria-label="חיפוש">${ic('search', 's')}</button>
      <button type="button" class="pill" data-pop="grade" aria-label="כיתה ו' – החלפת כיתה">כיתה ו' ${ic('chevD', 's')}</button>
      ${data && data.cred ? `<button type="button" class="pill role wide" data-pop="role">${ic(data.teacher ? 'brief' : 'users', 's')} ${data.teacher ? 'תצוגת מורה' : 'תצוגת תלמיד'}</button>` : ''}
      <button type="button" class="pill" data-pop="name" aria-label="השם שלי">${ic('user', 's')}<span class="wide">${nm ? esc(nm) : 'השם שלי'}</span></button>
      <button type="button" class="pill icon" data-pop="a11y" aria-label="נגישות וגודל כתב">${ic('type', 's')}</button>
      <button type="button" class="pill icon wide" data-pop="help" aria-label="איך משתמשים?">${ic('help', 's')}</button>`;
  }
  function navTo(id) {
    closePop();
    if (stageModes.includes(mode.v) && !leaveStage(true)) return;
    if (id === 'home') return go({ v: 'library' });
    if (id === 'topics') return go({ v: 'topics' });
    if (id === 'courses') return go({ v: 'courses' });
    if (id === 'exc') return go({ v: 'notebook', cat: 'exc' });
    if (id === 'print') return openPrint();
    if (id === 'tools' || (data && data.gates[id])) return go({ v: 'gate', g: id });
    openArea(id);
  }
  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nav]'); if (n) { e.preventDefault(); return navTo(n.dataset.nav); }
    const p = e.target.closest('[data-pop]'); if (p) { e.preventDefault(); return openPop(p.dataset.pop, p); }
    if (e.target.closest('#moreBtn')) return openMore();
    if (e.target.closest('#brand')) { e.preventDefault(); return navTo('home'); }
    if (!e.target.closest('.pop')) closePop();
    if (!e.target.closest('.search')) { $('#qres').hidden = true; $('#top').classList.remove('searching'); }
  });

  /* ---------------- חלונות קטנים: כיתה, שם, נגישות, עזרה, תפקיד ---------------- */
  let popEl = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; } document.querySelectorAll('.sheet, .sheet-bg').forEach(x => x.remove()); }
  function openPop(kind, btn) {
    const was = popEl && popEl.dataset.k === kind; closePop(); if (was) return;
    if (kind === 'search') { $('#top').classList.add('searching'); $('#q').focus(); return; }
    const el = document.createElement('div'); el.className = 'pop'; el.dataset.k = kind; el.setAttribute('role', 'dialog');
    const calm = document.documentElement.classList.contains('calm');
    if (kind === 'grade') el.innerHTML = `<h3>כיתה ו'</h3><p>גרסת הניסיון של העיצוב החדש בנויה לכיתה ו' בלבד.</p><div class="row"><a class="btn sec s" href="math.html?choose" target="_top">החלפת כיתה (באתר הרגיל)</a></div>`;
    if (kind === 'name') el.innerHTML = `<h3>השם שלי</h3><p>השם נשמר רק במכשיר הזה, כמו באתר.</p><input id="nmIn" value="${esc(data && data.name)}" placeholder="כתבו את השם שלכם" autocomplete="off"><div class="row"><button class="btn s" id="nmSave">שמירה</button></div>`;
    if (kind === 'a11y') el.innerHTML = `<h3>נגישות</h3><div class="row"><button class="btn sec s" id="calmT" aria-pressed="${calm}">${ic('eye', 's')} ${calm ? 'תצוגה רגילה' : 'תצוגה נגישה'}</button><button class="btn sec s" id="fontT">${ic('type', 's')} א+ גודל כתב</button></div><p>גודל הכתב מתחלף בין 3 גדלים, כמו באתר.</p>`;
    if (kind === 'role') el.innerHTML = `<h3>${data.teacher ? 'את/ה בתצוגת מורה' : 'את/ה רואה את האתר כמו תלמיד/ה'}</h3><div class="row"><button class="btn s" id="roleT">${data.teacher ? 'מעבר לתצוגת תלמיד' : 'חזרה לתצוגת מורה'}</button>${data.teacher ? '<button class="btn sec s" id="guideT">מדריך למורה</button>' : ''}</div>`;
    if (kind === 'help') el.innerHTML = `<h3>איך משתמשים?</h3><ol><li>בדף הבית – בוחרים מחברת (נושא).</li><li>במחברת – בוחרים נושא מתוכן העניינים.</li><li>בצד המחברת – השלבים: לומדים, מתרגלים, בודקים את עצמי.</li><li>הכפתור "חזרה" תמיד באותו מקום, למעלה מימין.</li></ol>
      <div class="row">${data && data.cred ? '<button class="btn sec s" id="guideT">מדריך למורה</button>' : ''}<button class="btn sec s" id="ctT">יצירת קשר</button><button class="btn sec s" id="pvT">פרטיות</button></div><p style="margin-top:10px">© איריס סגל · ${esc(data ? data.ver : '')} · תצוגת ניסיון</p>`;
    document.body.appendChild(el); popEl = el;
    const r = btn.getBoundingClientRect(), w = el.offsetWidth;
    el.style.top = Math.min(r.bottom + 8, innerHeight - el.offsetHeight - 8) + 'px';
    el.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    if (btn.closest('.rail')) { el.style.left = 'auto'; el.style.right = (innerWidth - r.left + 8) + 'px'; el.style.top = Math.max(8, r.top - el.offsetHeight + r.height) + 'px'; }
    const f = el.querySelector('input, button'); if (f) f.focus();
    const on = (id, fn) => { const b = el.querySelector('#' + id); if (b) b.onclick = fn; };
    on('nmSave', () => { const v = el.querySelector('#nmIn').value.trim(); ensure('site').then(() => { run(`store.name = ${J(v)}; saveStore(store);`); data.name = v; closePop(); renderChrome(); }); });
    const nmIn = el.querySelector('#nmIn'); if (nmIn) nmIn.onkeydown = e => { if (e.key === 'Enter') el.querySelector('#nmSave').click(); };
    on('calmT', () => { const v = !document.documentElement.classList.contains('calm'); document.documentElement.classList.toggle('calm', v); try { localStorage.setItem('math-calm', v ? '1' : '0'); } catch (e) { /* לא חובה */ } if (D) D.documentElement.classList.toggle('calm', v); closePop(); openPop('a11y', btn); });
    on('fontT', () => { if (isCoach && D) { const b = D.getElementById('bigBtn'); if (b) b.click(); return; } ensure('site').then(() => { run('cycleFont()'); syncFont(); }); });
    on('roleT', () => ensure('site').then(() => { if (stageModes.includes(mode.v) && !leaveStage(true)) return; run(`setPreview(${data.teacher ? 'true' : 'false'})`); closePop(); scrape(); go({ v: 'library' }); }));
    on('guideT', () => { closePop(); forward(() => run('guideHome()'), { v: 'area', tab: 'guide', name: 'מדריך למורה' }); });
    on('ctT', () => { closePop(); ensure('site').then(() => { const b = D.querySelector('footer.credit .ct-btn'); if (b) { b.click(); onFrame(); } }); });
    on('pvT', () => { closePop(); ensure('site').then(() => { const b = D.querySelector('footer.credit .pv-btn'); if (b) { b.click(); onFrame(); } }); });
  }
  function syncFont() { try { if (isSite) document.documentElement.style.fontSize = D.documentElement.style.fontSize || ''; } catch (e) { /* לא חובה */ } }
  function openMore() {
    closePop();
    const nav = NAV().filter(n => !n.main && !n.sep), cur = activeNav();
    const bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.onclick = closePop;
    const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-label', 'עוד אזורים');
    sh.innerHTML = `<div class="grab"></div><h3>עוד אזורים באתר</h3><div class="grid3">${nav.map(n => nvBtn(n, cur)).join('')}<button type="button" class="nv" data-pop="help">${ic('help')}<span>עזרה</span></button></div>`;
    document.body.append(bg, sh);
    sh.querySelector('button').focus();
  }

  /* ---------------- חיפוש ---------------- */
  function searchItems() {
    if (!data) return [];
    const out = [];
    data.tiles.forEach(t => out.push({ n: t.name, k: 'מחברת', c: catColor(t.id), f: () => go({ v: 'notebook', cat: t.id }) }));
    Object.entries(data.items).forEach(([cat, list]) => list.forEach(it => {
      if (it.k === 'sub') return;
      out.push({ n: it.name, d: it.desc, k: it.k === 'tool' ? 'כלי המחשה' : it.k === 'topic' ? 'נושא' : 'פעילות', c: catColor(cat), f: () => openItem(it, cat) });
    }));
    data.allLessons.forEach(l => out.push({ n: l.name, k: 'לומדים', c: catColor(l.cat), f: () => openTopic(l.t, l.cat, `[data-tl="${l.id}"]`) }));
    data.games.forEach(g => out.push({ n: g.name, k: 'משחק', c: '#C9D3DA', f: () => openArea('games', '#' + g.id, 'games') }));
    data.tests.forEach(t => out.push({ n: t.name, k: 'מבדק', c: '#C9D3DA', f: () => openArea('tests', '#' + t.id, 'tests') }));
    courses().forEach(c => out.push({ n: c.title, d: c.sub, k: 'קורס', c: catColor(c.cat), f: () => openCourse(c) }));
    return out;
  }
  let hits = [];
  $('#q').addEventListener('input', () => {
    const q = $('#q').value.replace(/["'.,!?]/g, '').trim(), box = $('#qres');
    if (!q) { box.hidden = true; return; }
    hits = searchItems().filter(it => (it.n + ' ' + (it.d || '')).includes(q)).slice(0, 14);
    box.hidden = false;
    box.innerHTML = hits.length ? hits.map((h, i) => `<button type="button" data-hit="${i}"><span class="sw" style="background:${h.c}"></span><span>${esc(h.n)}</span><span class="k">${h.k}</span></button>`).join('') : '<div class="none">לא נמצא. נסו מילה אחרת (למשל: שברים, זוויות, אחוז)</div>';
  });
  $('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { const b = $('#qres [data-hit]'); if (b) b.click(); } if (e.key === 'Escape') { $('#qres').hidden = true; } });
  $('#qres').addEventListener('click', e => {
    const b = e.target.closest('[data-hit]'); if (!b) return;
    const h = hits[+b.dataset.hit]; $('#q').value = ''; $('#qres').hidden = true; $('#top').classList.remove('searching');
    if (stageModes.includes(mode.v) && !leaveStage(true)) return;
    h.f();
  });

  /* ---------------- מסך 1: ספריית המחברות ---------------- */
  // כריכת מחברת (Goodnotes): כריכה אנכית 3:4 עם שדרה בימין ודפים בשוליים; תווית שם למעלה, איור במרכז.
  // כל המידע (כמה נושאים, כלים, התקדמות) – מתחת לכריכה, לא עליה.
  function bookHTML({ attr, cls, color, name, art, aria, meta, lock }) {
    return `<div class="book${cls ? ' ' + cls : ''}">
      <${attr ? 'button type="button" ' + attr : 'div role="img"'} class="nbook" style="--cv:${color}" aria-label="${esc(aria)}" title="${esc(aria)}">
        <span class="nbook-pages" aria-hidden="true"></span>
        <span class="nbook-cover" aria-hidden="true">
          <span class="nbook-spine"></span>
          <span class="nbook-label">${esc(name)}</span>
          <span class="nbook-art">${art}</span>
          ${lock ? `<span class="nbook-lock">${ic('lock')}</span>` : ''}
        </span>
      </${attr ? 'button' : 'div'}>
      ${meta ? `<div class="book-meta">${meta}</div>` : ''}
    </div>`;
  }
  function coverHTML(t) {
    const prog = t.avg > 0
      ? `<div class="meter" aria-label="שליטה ממוצעת ${Math.round(t.avg)}%"><span class="bar"><i style="width:${t.avg}%"></i></span><b>${Math.round(t.avg)}%</b></div>`
      : '';
    return bookHTML({ attr: `data-cat="${t.id}"`, cls: (CAT[t.id] || {}).dark ? 'dark' : '', color: coverColor(t.id), name: t.name, art: (ART[t.id] || ART.nat)(),
      aria: `מחברת ${t.name} – ${t.cnt}${t.avg > 0 ? ` – שליטה ממוצעת ${Math.round(t.avg)}%` : ''}`,
      meta: prog });
  }
  function champHTML() {
    const c = data.champ, open = c.open;
    return bookHTML({ attr: open ? 'data-champ="1"' : '', cls: 'gold' + (open ? '' : ' locked'), color: '#D4AA4A', name: 'אתגר אלופים', art: ART.champ(true), lock: !open,
      aria: `אתגר אלופים – ${open ? 'פתוח' : 'נעול. נפתח כשמסיימים סבב תרגול או מבחן (5 שאלות ומעלה) עם 80% תשובות נכונות ומעלה'}`,
      meta: open ? '' : '<div class="bm-note">נפתח אחרי סבב תרגול עם 80% ומעלה</div>' });
  }
  function libraryHTML() {
    return `<div class="vhead"><h1>${ic('library')} ספריית המחברות שלי</h1></div>
      <div class="books">${data.tiles.map(coverHTML).join('')}${champHTML()}</div>`;
  }

  /* ---------------- מסך 2: מחברת פתוחה ---------------- */
  function nextLesson(cat) {
    for (const it of (data.items[cat] || [])) {
      if (it.k !== 'topic') continue;
      for (const l of (data.lessons[it.id] || [])) if (l.k < l.all) return { topic: it.id, l };
    }
    return null;
  }
  function tocItem(it, n) {
    const isT = it.k === 'topic';
    return `<li><button type="button" class="it" data-item="${n}">
      <span class="n">${it.k === 'tool' ? ic('tool', 's') : it.k === 'link' ? ic('book', 's') : n + 1}</span>
      <span class="nm">${esc(it.name)}</span>
      ${isT ? `<span class="meter"><span class="bar"><i style="width:${it.m}%"></i></span><b>${Math.round(it.m)}%</b></span>` : it.desc ? `<span class="ds">${esc(it.desc.length > 90 ? it.desc.slice(0, 88) + '…' : it.desc)}</span>` : ''}
      <span class="go">${ic('chevL', 's')}</span></button></li>`;
  }
  function notebookHTML(cat) {
    const t = data.tiles.find(x => x.id === cat);
    if (!t) return libraryHTML();
    const list = data.items[cat] || [], cv = CAT[cat] || CAT.nat;
    const nl = nextLesson(cat), crs = courses().filter(c => c.cat === cat && c.fits);
    let i = 0, n = 0;
    const tocBody = list.map(it => it.k === 'sub' ? `</ol><div class="toc-sub">${esc(it.name)}</div><ol class="toc">` : (it.k === 'tool' ? '' : tocItem(it, (it.idx = i++, n++))))
      .join('');
    const tools = list.filter(it => it.k === 'tool');
    tools.forEach(it => { it.idx = i++; });
    const dfT = cat === 'nat' ? teachItem('dfT') : null;
    const act = (attr, icon, b, d) => `<button type="button" class="act" ${attr}><span class="ai">${ic(icon)}</span><span><b>${b}</b><span class="d">${d}</span></span></button>`;
    return `<nav class="crumbs" aria-label="איפה אני"><button type="button" class="home" data-nav="home">${ic('home', 's')} דף הבית</button><span class="sep">›</span><b>${esc(t.name)}</b></nav>
      <div class="spread" style="--cv:${cv.c}">
        <div class="tabs-edge" role="navigation" aria-label="מחברות אחרות">${data.tiles.map(x => `<button type="button" data-cat="${x.id}" class="${(CAT[x.id] || {}).dark ? 'dark' : ''}" style="--tc:${catColor(x.id)}"${x.id === cat ? ' aria-current="true"' : ''}>${esc(x.name)}</button>`).join('')}</div>
        <section class="pg r">
          <div class="nbhead"><div class="nbt"><span class="sw" aria-hidden="true"></span><div><h1>${esc(t.name)}</h1><div class="nbt-sub">${esc(t.cnt)}${t.avg > 0 ? ` · שליטה ממוצעת ${Math.round(t.avg)}%` : ''}</div></div></div>
          <div class="nb-art">${(ART[cat] || ART.nat)()}</div></div>
          <div class="nbacts"><h2>מה עושים כאן?</h2>
          <div class="acts4">
            ${nl ? act(`data-next="${nl.topic}" data-l="${nl.l.id}"`, 'book', 'ממשיכים ללמוד', `${esc(nl.l.name)} · ${nl.l.k} מתוך ${nl.l.all} כרטיסיות`) : act('data-focus-toc="1"', 'list', 'בוחרים נושא', 'מתוכן העניינים – לומדים, מתרגלים ובודקים')}
            ${crs.length ? act(`data-crs="${cat}"`, 'cap', 'קורסים בנושא', crs.map(c => esc(c.title)).join(' · ')) : act('data-nav="courses"', 'cap', 'קורסים', 'כל הקורסים ללמידה עצמית')}
            ${data.tabs.some(x => x.id === 'games') ? act('data-nav="games"', 'game', 'משחקים', 'משחקים בכל הנושאים') : ''}
            ${data.tabs.some(x => x.id === 'tests') ? act('data-nav="tests"', 'check', 'מבדקים', 'מבדק מכל הנושאים ואימון') : ''}
            ${list.some(it => it.k === 'topic') ? act(`data-print="${list.filter(it => it.k === 'topic').map(it => it.id).join(',')}" data-pfrom="nb:${cat}"`, 'printer', 'הדפסה', 'דפי תרגול בנושאי המחברת') : ''}
          </div></div>
        </section>
        <section class="pg l">
          <details class="tocbox" open id="tocbox"><summary>${ic('list')} תוכן העניינים ${ic('chevD', 'tg')}</summary>
            <ol class="toc">${tocBody}</ol>
            ${tools.length || dfT ? `<div class="toc-sub">כלי המחשה</div><div class="tools">${tools.map(it => `<button type="button" class="chip" data-item="${it.idx}">${ic('tool', 's')} ${esc(it.name)}</button>`).join('')}${dfT ? `<button type="button" class="chip" data-gopen="teach:dfT" data-gfrom="nb:${cat}">${ic('tool', 's')} ${esc(dfT.name)}</button>` : ''}</div>` : ''}
          </details>
        </section>
      </div>`;
  }

  /* ---------------- שערים: כל שער – "אפליקציה" משלו ---------------- */
  const GATE_T = { games: 'משחקים', tests: 'מבדקים', kefel: 'אימון כפל וחילוק', teach: 'אזור המורה', tools: 'כלי המחשה', exc: 'מצוינות' };
  const gateName = (g, id) => { for (const G of [data.gates[g] || [], ...Object.values(data.gates)]) for (const s of G) for (const it of s.items) if (it.id === id) return it.name; return ''; };
  // לאן חוזרים: שער, או מחברת ('nb:cat')
  const backTo = g => g && g.startsWith('nb:') ? { v: 'notebook', cat: g.slice(3) } : g ? { v: 'gate', g } : { v: 'library' };
  const backCrumb = g => g.startsWith('nb:') ? `<button type="button" data-cat="${g.slice(3)}">${esc((data.tiles.find(t => t.id === g.slice(3)) || {}).name || '')}</button>` : `<button type="button" data-nav="${g}">${esc(GATE_T[g] || '')}</button>`;
  // מרכז ההדפסה – נקודת כניסה אחת לכל המקומות (התפריט, אזור המורה, מחברת). topics – נושאים שיסומנו מראש
  function openPrint(topics, from) {
    if (stageModes.includes(mode.v) && !leaveStage(true)) return;
    mode = { v: 'ext', name: 'הדפסה', from, cat: null };
    $('#loading').hidden = false;
    if (topics && topics.length) F.addEventListener('load', () => {
      let n = 0; const t = setInterval(() => {
        const d = F.contentDocument, bx = d ? [...d.querySelectorAll('.wstopics:not(.drtopics) input[type=checkbox]')] : [];
        if (bx.length || ++n > 30) { clearInterval(t); bx.forEach(b => { if (b.checked !== topics.includes(b.value)) b.click(); }); }
      }, 100);
    }, { once: true });
    F.src = 'math6.html?print&grade=' + GRADE;
    isSite = false;
    render();
  }
  // משפט קצר מהתיאור של האתר: עד סוף המשפט הראשון (בלי לקטוע באמצע)
  function short(d) {
    d = String(d || '').trim();
    const re = /[.!?](?=\s)|(?<=\S): | – /g; let m, out = d;
    while ((m = re.exec(d))) { const cut = d.slice(0, m.index + (m[0] === '?' ? 1 : 0)); if (cut.trim().length >= 14) { out = cut; break; } }
    return out.replace(/[.\s–:]+$/, '');
  }
  // תרגיל בתוך משפט בעברית – תמיד משמאל לימין
  const mathLTR = h => h.replace(/\d[\d.,]*(?:\s*[:×=+−–-]\s*[\d?][\d.,]*)+/g, x => `<bdi dir="ltr">${x}</bdi>`);
  const crumbs = name => `<nav class="crumbs" aria-label="איפה אני"><button type="button" class="home" data-nav="home">${ic('home', 's')} דף הבית</button><span class="sep">›</span><b>${esc(name)}</b></nav>`;
  const gArt = (id, i) => `<span class="g-art" style="--ac:${GART.color(id, i)}" aria-hidden="true">${GART.art(id)}</span>`;
  function allTools() {
    if (!data) return [];
    const out = [];
    Object.entries(data.items).forEach(([cat, list]) => list.forEach(it => { if (it.k === 'tool') out.push({ it, cat }); }));
    return out;
  }
  // אתגר אלופים – רכיב זהב קומפקטי; אותו תנאי פתיחה של האתר (champOpen)
  function champRow() {
    const open = data.champ.open;
    return `<div class="champ-row${open ? '' : ' locked'}"><span class="cr-ic" aria-hidden="true">${ic(open ? 'trophy' : 'lock')}</span><span class="cr-tx"><b>אתגר אלופים</b>${open ? '' : '<span>נפתח אחרי סבב תרגול או מבחן (5 שאלות ומעלה) עם 80% ומעלה</span>'}</span>
      ${open ? `<button type="button" class="btn s" data-champ="1">לשחק ${ic('fwd', 's')}</button>` : ''}</div>`;
  }
  // משחקים: לשוניות לפי אופני המשחק שקיימים באתר בפועל
  const GT_CLASS = ['raceGo']; // מרוץ נגד השעון – יש לו מצב קבוצות (2–6), ואין לו כרטיס במסך המשחקים הכיתתיים
  let gTab = (() => { try { return sessionStorage.getItem('nb-gtab') || 'solo'; } catch (e) { return 'solo'; } })();
  function gamesHTML(G) {
    const all = G.flatMap(s => s.items), byId = id => all.find(x => x.id === id);
    const solo = G[0] ? G[0].items : [];
    const tabs = [
      { k: 'solo', t: 'משחקים אישיים', icon: 'user', items: solo },
      { k: 'class', t: 'משחקים כיתתיים', icon: 'board', items: data.teacher ? [...(classGames || []).map(x => Object.assign({ cls: 1 }, x)), ...GT_CLASS.map(byId)].filter(Boolean) : [] }
    ].filter(x => x.items.length);
    const cur = tabs.find(x => x.k === gTab) || tabs[0];
    const team = it => cur.k !== 'solo' && solo.includes(it);
    const open = data.champ.open;
    return `${crumbs('משחקים')}<div class="vhead"><h1>${ic('game')} משחקים</h1></div>
      ${tabs.length > 1 ? `<div class="seg-tabs" role="tablist" aria-label="סוגי משחקים">${tabs.map(x => `<button type="button" role="tab" data-gtab="${x.k}" aria-selected="${x === cur}">${ic(x.icon, 's')}<span>${x.t}</span></button>`).join('')}</div>` : ''}
      ${open && cur.k === 'solo' ? champRow() : ''}
      <div class="gapps" role="tabpanel">${cur.items.map((it, i) =>
        `<button type="button" class="gapp" ${it.cls ? `data-cgopen="${it.id}"` : `data-gopen="games:${it.id}"`} title="${esc(it.desc)}">${gArt(it.id, i)}<span class="gapp-tx"><b>${esc(it.name)}</b><span>${mathLTR(esc(short(it.desc)))}</span>${team(it) ? '<span class="gapp-tag">מצב קבוצות</span>' : ''}</span><span class="gapp-get" aria-hidden="true">לשחק</span></button>`).join('')}</div>
      ${!open && cur.k === 'solo' ? champRow() : ''}`;
  }
  function testsHTML(G) {
    const all = G.flatMap(s => s.items);
    return `${crumbs('מבדקים')}<div class="files-bar"><span class="fb-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z"/></svg></span><h1>מבדקים</h1><span class="fb-n">${all.length} פריטים</span></div>
      <div class="files">${all.map((it, i) => `<button type="button" class="file" data-gopen="tests:${it.id}">${gArt(it.id, i)}<b>${esc(it.name)}</b><span>${esc(it.desc)}</span></button>`).join('')}</div>`;
  }
  function kefelHTML(G) {
    const all = G.flatMap(s => s.items);
    return `${crumbs('אימון כפל וחילוק')}<div class="vhead"><h1>${ic('times')} אימון כפל וחילוק</h1></div>
      <div class="kf2">${all.map((it, i) => `<button type="button" class="kfc" data-gopen="kefel:${it.id}">${gArt(it.id, i)}<span class="kfc-tx"><b>${esc(it.name)}</b><span>${mathLTR(esc(it.desc))}</span></span><span class="btn s" aria-hidden="true">מתחילים ${ic('fwd', 's')}</span></button>`).join('')}</div>`;
  }
  // אזור המורה – שלוש קטגוריות פדגוגיות (בקשת איריס 28.11); "מעובדה אחת" עבר לכלי ההמחשה של הכפל
  const teachItem = id => { for (const s of (data.gates.teach || [])) for (const it of s.items) if (it.id === id) return it; return null; };
  const TCATS = [
    { t: 'תכנון והכנה לשיעור', c: '#3F7CC4', icon: 'plan', ids: ['lpTop'], extra: 'print' },
    { t: 'כלים להוראה בכיתה', c: '#2A9D8F', icon: 'board', ids: ['clsOpen', 'clsGames'], extra: 'tools' },
    { t: 'הערכת הלמידה בשיעור', c: '#D9874A', icon: 'check', ids: ['succTab', 'exitTab'] }
  ];
  const T_NAME = { lpTop: 'בניית מערך שיעור', clsOpen: 'פתיחי שיעור', clsGames: 'משחקים כיתתיים' }; // כיתובים שאיריס ביקשה (28.11)
  function teachHTML(G) {
    const known = new Set(['dfT', ...TCATS.flatMap(c => c.ids)]);
    const cats = TCATS.map(c => ({ ...c, items: c.ids.map(teachItem).filter(Boolean) }));
    G.forEach((s, k) => s.items.forEach(it => { if (!known.has(it.id)) cats[Math.min(k, 2)].items.push(it); })); // כלי חדש באתר – לפי הקבוצה שלו שם
    const row = (attr, art, name, d) => `<button type="button" class="ws-it" ${attr}>${art}<span class="ws-tx"><b>${esc(name)}</b><span>${esc(d)}</span></span>${ic('chevL', 's')}</button>`;
    const tl = allTools();
    const extra = x => x === 'print' ? row('data-print="" data-pfrom="teach"', gArt('printC', 0), 'מרכז ההדפסה', 'דפי תרגול ומבחנים, חוברות ושאלות מילוליות')
      : x === 'tools' && tl.length ? row('data-nav="tools"', gArt('toolsLib', 0), 'כלי המחשה', tl.slice(0, 2).map(t => t.it.name).join(', ') + (tl.length > 2 ? ' ועוד' : '')) : '';
    return `${crumbs('אזור המורה')}<div class="vhead"><h1>${ic('brief')} אזור המורה</h1></div>
      <div class="ws">${cats.map(c => `<section class="ws-col" style="--wc:${c.c}"><h2><span class="ws-hi" aria-hidden="true">${ic(c.icon)}</span>${esc(c.t)}</h2>
        ${c.items.map((it, i) => it.id === 'clsGames' ? row('data-gclass="1"', gArt(it.id, i), T_NAME[it.id], short(it.desc)) : row(`data-gopen="teach:${it.id}" title="${esc(it.desc)}"`, gArt(it.id, i), T_NAME[it.id] || it.name, short(it.desc))).join('')}${c.extra ? extra(c.extra) : ''}</section>`).join('')}</div>`;
  }
  function toolsHTML() {
    const dfT = data.teacher ? teachItem('dfT') : null;
    return `${crumbs('כלי המחשה')}<div class="vhead"><h1>${ic('tool')} כלי המחשה</h1></div>
      <div class="tools-lib">${allTools().map((t, i) => { const tn = (data.tiles.find(x => x.id === t.cat) || {}).name || '';
        return `<button type="button" class="tl" data-tool="${i}" title="${esc(t.it.desc)}">${gArt(t.it.id, i)}<span class="tl-tx"><b>${esc(t.it.name)}</b><span class="tl-cat" style="--tc:${catColor(t.cat)}">${esc(tn)}</span></span></button>`; }).join('')}
        ${dfT ? `<button type="button" class="tl" data-gopen="teach:dfT" data-gfrom="tools" title="${esc(dfT.desc)}">${gArt('dfT', 0)}<span class="tl-tx"><b>${esc(dfT.name)}</b><span class="tl-cat" style="--tc:${catColor('nat')}">${esc((data.tiles.find(x => x.id === 'nat') || {}).name || '')} · למורה</span></span></button>` : ''}</div>`;
  }
  // מצוינות – ספריית חידות ואתגרים
  function excHTML() {
    const list = data.items.exc; list.forEach((it, i) => { it.idx = i; });
    const tile = it => `<button type="button" class="pz" data-item="${it.idx}" title="${esc(it.desc)}">${gArt(it.id, it.idx)}<b>${esc(it.name)}</b><span class="pz-d">${esc(short(it.desc))}</span>${it.m > 0 ? `<span class="pz-m" aria-label="שליטה ${Math.round(it.m)}%"><i style="width:${it.m}%"></i></span>` : ''}</button>`;
    const pz = list.filter(it => it.k === 'topic'), more = list.filter(it => it.k !== 'topic' && it.k !== 'sub');
    const t = data.tiles.find(x => x.id === 'exc');
    return `${crumbs(t ? t.name : 'מצוינות')}<div class="vhead"><h1>${ic('spark')} ${esc(t ? t.name : 'מצוינות')}</h1></div>
      ${pz.length ? `<section class="g-sec"><h2 class="g-h">חידות</h2><div class="pzs">${pz.map(tile).join('')}</div></section>` : ''}
      ${more.length ? `<section class="g-sec"><h2 class="g-h">אתגרים ומשחקי חשיבה</h2><div class="pzs">${more.map(tile).join('')}</div></section>` : ''}`;
  }
  function gateHTML(g) {
    if (g === 'tools') return toolsHTML();
    const G = data.gates[g];
    if (!G) return libraryHTML();
    return g === 'games' ? gamesHTML(G) : g === 'tests' ? testsHTML(G) : g === 'kefel' ? kefelHTML(G) : teachHTML(G);
  }

  /* ---------------- "נושאים": תוכן העניינים של כל הספרייה ---------------- */
  function topicsHTML() {
    return `<div class="vhead"><h1>${ic('list')} כל הנושאים</h1><div class="sub">תוכן העניינים של כל המחברות. אפשר גם לחפש למעלה.</div></div>
      <div class="shelf" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${data.tiles.map(t => `<section class="paper" style="padding:14px 16px;border-top:8px solid ${catColor(t.id)}">
        <h2 style="font-size:var(--fs-l);display:flex;align-items:center;gap:8px"><button type="button" class="btn ghost s" data-cat="${t.id}" style="padding:0;font-size:inherit;font-weight:700">${esc(t.name)} ${ic('chevL', 's')}</button></h2>
        <ul style="list-style:none;margin:6px 0 0;padding:0">${(data.items[t.id] || []).map((it, k) => it.k === 'sub' ? '' : `<li><button type="button" class="btn ghost s" style="width:100%;justify-content:flex-start;font-weight:500" data-ti="${t.id}:${k}">${it.k === 'tool' ? ic('tool', 's') : ''}${esc(it.name)}</button></li>`).join('')}</ul></section>`).join('')}</div>`;
  }

  /* ---------------- מסך 3: ספריית הקורסים ---------------- */
  const PLANNED = { frac: { title: 'שברים פשוטים', sub: 'מה זה שבר, השוואת שברים, שבר מכמות', grades: [5, 6], cat: 'frac' }, area: { title: 'שטח והיקף', sub: 'שטח והיקף של מצולעים וצורות מורכבות', grades: [4, 6], cat: 'geo' } }; // כמו PLANNED ב-coach.html
  let crsCache = null;
  function activeCourse() {
    try { const st = JSON.parse(sessionStorage.getItem('coach:state') || 'null'); return st && st.phase !== 'end' && st.course ? st : null; } catch (e) { return null; }
  }
  function courses() {
    const C = window.COACH; if (!C || !data) return [];
    if (!crsCache) {
      const T = data.teacher;
      crsCache = C.COURSE_IDS.map(id => {
        const c = C.courses[id];
        if (c && c.hidden && !T) return null;
        if (c && (!c.draft || T)) {
          const site = c.SITE || {}, refs = Object.values(site).map(u => u.learn || u.topic).filter(Boolean);
          const cats = refs.length ? run(`${J(refs)}.map(x => LESSONS[x] ? catOf(lessonTopic(LESSONS[x])) : catOf(x))`) || [] : [];
          const cnt = {}; cats.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
          const cat = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || (/^f|equiv/.test(id) ? 'frac' : 'nat');
          return { id, title: c.title, sub: c.sub, grades: c.grades, cat, mods: c.MODULES.length, units: c.UNITS.length, draft: !!c.draft, ok: true };
        }
        const p = PLANNED[id]; return p ? Object.assign({ id, ok: false }, p) : null;
      }).filter(Boolean);
    }
    const st = activeCourse();
    return crsCache.map(c => {
      const fits = !c.grades || (GRADE >= c.grades[0] && GRADE <= c.grades[1]);
      let prog = null;
      if (st && st.course === c.id && Array.isArray(st.path)) {
        const core = st.path.filter(p => !p.optional), done = core.filter(p => st.done && st.done[p.id]).length;
        prog = { done, all: core.length, pct: core.length ? Math.round(done / core.length * 100) : 0 };
      }
      return Object.assign({}, c, { fits, active: !!(st && st.course === c.id), prog });
    });
  }
  let crsFilter = 'all', crsQ = '', crsAll = false;
  function courseCard(c) {
    const cv = CAT[c.cat] || CAT.nat;
    const btn = !c.ok ? '<span class="muted">בהכנה – בקרוב</span>' : `<button type="button" class="btn" data-course="${c.id}">${c.active ? 'המשך למידה' : 'התחלת למידה'} ${ic('fwd', 's')}</button>`;
    const meter = c.prog ? `<div class="meter"><span>ההתקדמות שלי</span><span class="bar"><i style="width:${c.prog.pct}%"></i></span><b>${c.prog.pct}%</b></div><div class="champ-note">${c.prog.done} מתוך ${c.prog.all} שיעורים במסלול שלך</div>` : c.active ? '<div class="champ-note">בתהליך למידה</div>' : '';
    const g = c.grades ? (c.grades[0] === c.grades[1] ? `כיתה ${'אבגדהו'[c.grades[0] - 1]}'` : `כיתות ${'אבגדהו'[c.grades[0] - 1]}'–${'אבגדהו'[c.grades[1] - 1]}'`) : '';
    return `<article class="crs${c.ok ? '' : ' soon'}">
      <div class="book mini${cv.dark ? ' dark' : ''}" aria-hidden="true"><div class="nbook" style="--cv:${cv.c}"><span class="nbook-pages"></span><span class="nbook-cover"><span class="nbook-spine"></span><span class="nbook-art">${(ART[c.cat] || ART.nat)()}</span>${c.active ? '<span class="bookmark"></span>' : ''}</span></div></div>
      <div><h2>${esc(c.title)}</h2><p class="cs">${esc(c.sub)}</p><div class="cm">${c.ok ? `<span class="tag">${c.mods} פרקים · ${c.units} שיעורים</span>` : ''}${g ? `<span class="tag">${g}</span>` : ''}${c.active ? `<span class="tag" style="background:#E4EDF4">${ic('book', 's')} בתהליך</span>` : ''}${c.draft ? '<span class="tag">טיוטה – רק מורים רואים</span>' : ''}</div></div>
      <div class="side">${meter}${btn}</div></article>`;
  }
  function coursesHTML() {
    const all = courses();
    const cats = [...new Set(all.map(c => c.cat))];
    const match = c => (crsFilter === 'all' || c.cat === crsFilter) && (!crsQ || (c.title + ' ' + c.sub).includes(crsQ));
    const sort = a => a.slice().sort((x, y) => (y.active - x.active) || (y.ok - x.ok));
    const mine = sort(all.filter(c => c.fits && match(c))), other = sort(all.filter(c => !c.fits && match(c)));
    const tname = id => (data.tiles.find(t => t.id === id) || {}).name || id;
    return `<div class="vhead"><h1>${ic('cap')} ספריית הקורסים שלי</h1></div>
      <div class="filters" role="group" aria-label="סינון לפי נושא">
        <button type="button" class="chip" data-cf="all" aria-pressed="${crsFilter === 'all'}">הכל</button>
        ${cats.map(c => `<button type="button" class="chip" data-cf="${c}" aria-pressed="${crsFilter === c}">${esc(tname(c))}</button>`).join('')}
        <span class="search2">${ic('search', 's')}<input id="cq" type="search" placeholder="חיפוש קורס…" value="${esc(crsQ)}" aria-label="חיפוש קורס"></span>
      </div>
      <p class="champ-note" style="margin:-4px 2px 12px">כבר התחלתם קורס במכשיר אחר? נכנסים לקורס ומקלידים את קוד ההמשך מהמחברת.</p>
      <div class="clist">${mine.map(courseCard).join('') || '<div class="paper" style="padding:16px">לא נמצא קורס כזה.</div>'}</div>
      ${other.length ? (crsAll ? `<h2 class="sect-h">קורסים לכיתות אחרות</h2><div class="clist">${other.map(courseCard).join('')}</div>` : `<div style="margin-top:16px"><button type="button" class="btn sec" id="allc">להציג גם קורסים לכיתות אחרות (${other.length})</button></div>`) : ''}
      ${data.teacher ? `<div style="margin-top:16px"><button type="button" class="btn sec" data-course="">${ic('printer', 's')} קטלוג הקורסים המלא למורה (מבדקי אמצע וסיכום להדפסה)</button></div>` : ''}`;
  }
  function openCourse(c) {
    const st = activeCourse();
    if (c.id && st && st.course !== c.id) {
      const cur = (crsCache || []).find(x => x.id === st.course);
      if (!confirm(`הקורס "${cur ? cur.title : ''}" פתוח עכשיו. לעבור לקורס "${c.title}"?\nכדי לחזור אליו אחר כך – קוד ההמשך מהמחברת.`)) return;
      try { sessionStorage.removeItem('coach:state'); sessionStorage.removeItem('coach:equiv'); } catch (e) { /* לא חובה */ }
    }
    mode = { v: 'course', id: c.id, name: c.title || 'קורסים', ccat: c.cat };
    $('#loading').hidden = false;
    F.src = 'coach.html?grade=' + GRADE + (c.id ? '&course=' + c.id : '');
    isSite = false; data && (crsCache = crsCache);
    render();
  }

  /* ---------------- כניסה לתוכן האתר ---------------- */
  // מפעילים פעולה באתר (לוחצים על הכפתור המקורי) ועוברים למסך הפנימי
  function forward(fn, m) {
    return ensure('site').then(() => {
      quietUntil = Date.now() + 600;
      mode = m;
      fn();
      render();
      onFrame();
    });
  }
  function openTopic(id, cat, stepSel) {
    forward(() => {
      run(`topicBack = null; topicHome(${J(id)})`);
      if (stepSel) { const b = D.querySelector('#app ' + stepSel); if (b) b.click(); }
    }, { v: 'topic', id, cat: cat || run(`catOf(${J(id)})`) });
  }
  function clickHome(sel) { run("topicBack = null; homeTab = 'practice'; home();"); const b = D.querySelector(sel); if (b) b.click(); return !!b; }
  function openItem(it, cat, from) {
    if (it.k === 'topic') return openTopic(it.id, cat);
    if (it.k === 'link') { mode = { v: 'ext', cat, name: it.name, from }; F.src = it.href; isSite = false; return render(); }
    if (it.id === 'xsdkGo') { mode = { v: 'ext', cat, name: it.name, from }; F.src = 'sudoku.html?grade=' + GRADE; isSite = false; return render(); }
    if (it.id === 'wpGo') return forward(() => clickHome('#wpGo'), { v: 'area', tab: 'wp', cat, name: it.name });
    forward(() => clickHome('#' + it.id), { v: 'act', cat, name: it.name, from });
  }
  function openClassGame(id) {
    const it = (classGames || []).find(x => x.id === id);
    forward(() => { run("topicBack = null; home(); classSub('games')"); const b = D.getElementById(id); if (b) b.click(); }, { v: 'area', tab: 'games', name: it ? it.name : 'משחקים כיתתיים', gate: 'games' });
  }
  function openArea(tab, after, gate) {
    const t = data && data.tabs.find(x => x.id === tab);
    const name = t ? t.label : tab;
    forward(() => {
      run("topicBack = null; home();");
      const b = t && t.go ? D.getElementById(tab) : D.querySelector(`.nb > .tabs .tab[data-tab="${tab}"]`);
      if (b) b.click();
      if (after) { const a = D.querySelector(after); if (a) a.click(); }
    }, { v: 'area', tab, name: gate && after ? gateName(gate, after.slice(1)) || name : name, gate });
  }

  /* ---------------- מסך 4: לומדים ומתרגלים בתוך המחברת ---------------- */
  function frameInfo() {
    if (!isSite) return {};
    const cr = D.querySelector('#app .crumbs');
    const tid = cr ? ((cr.querySelector('[data-crumb]:not([data-crumb=""])') || {}).dataset || {}).crumb : null;
    const b = cr ? clean((cr.querySelector('b') || {}).textContent) : '';
    const title = clean((D.querySelector('#app .topbar .title') || D.querySelector('#app h2') || {}).textContent);
    const active = run(`state ? (state.chk ? 'check' : state.mode === 'practice' ? 'lv' + state.level : state.mode) : lessonView ? 'l:' + lessonView.id : (document.querySelector('#app .tp-head') ? 'ov' : '')`) || '';
    return { tid, b, title, active };
  }
  function topicInfo(id) {
    return run(`(() => { const id = ${J(id)}, t = TOPIC[id]; if (!t) return null; const s = store.topics[id];
      return { name: t.name, desc: t.desc, m: s ? s.mastery : 0, started: !!s, cur: currentLevel(id), tags: [1, 2, 3].map(k => LEVEL_TAG[k]),
        ls: topicLessons(id).map(l => ({ id: l, name: LESSONS[l].name, k: learnedSet(l).size, all: cardsOf(l).length })),
        tools: TOOL_CARDS.filter(c => c.topics.includes(id)).map(c => ({ id: c.id, chip: c.chip })), exc: catOf(id) === 'exc', lbl: masteryLabel(s ? s.mastery : 0) }; })()`);
  }
  function updateStage() {
    const fi = frameInfo();
    // נושא אחר נפתח מתוך האתר (קישור בתוך שאלה וכו')
    if (mode.v === 'topic' && isSite) {
      let tid = fi.tid;
      if (!tid && fi.active === 'ov' && fi.b) tid = run(`(Object.values(TOPIC).find(t => t.name === ${J(fi.b)}) || {}).id`);
      if (!tid && fi.active.startsWith('l:')) tid = run(`lessonTopic(LESSONS[${J(fi.active.slice(2))}])`);
      if (!tid && /^lv|check/.test(fi.active)) tid = run('state.topicId') || null;
      if (tid && tid !== mode.id && tid !== 'test' && run(`!!TOPIC[${J(tid)}]`)) { mode.id = tid; mode.cat = run(`catOf(${J(tid)})`); }
    }
    const cat = mode.cat, catT = cat && data && data.tiles.find(t => t.id === cat);
    const info = mode.v === 'topic' && mode.id && mode.id !== 'champ' ? topicInfo(mode.id) : null;
    const full = !info;
    stage.classList.toggle('full', full);
    stage.style.setProperty('--cv', catColor(cat));
    // נתיב ניווט
    const parts = [`<button type="button" class="home" data-nav="home">${ic('home', 's')} דף הבית</button>`];
    const inUnit = mode.v === 'course' && isCoach && D && D.getElementById('ucard') && D.getElementById('back');
    const unitT = inUnit ? clean((D.querySelector('#ucard .lhead h2') || {}).textContent) : '';
    let here = mode.name || '';
    if (mode.v === 'course') { parts.push(`<button type="button" data-nav="courses">קורסים</button>`); if (unitT) { parts.push(`<button type="button" data-cplan="1">${esc(mode.name)}</button>`, `<b>${esc(unitT)}</b>`); here = unitT; } else parts.push(`<b>${esc(mode.name)}</b>`); }
    else if (mode.v === 'area' && mode.gate) parts.push(backCrumb(mode.gate), `<b>${esc(mode.name)}</b>`);
    else if (mode.v === 'area' && !cat) parts.push(`<b>${esc(mode.name)}</b>`);
    else if (mode.id === 'champ') parts.push('<b>אתגר אלופים</b>');
    else {
      if (mode.from) parts.push(backCrumb(mode.from));
      else if (catT) parts.push(`<button type="button" data-cat="${cat}">${esc(catT.name)}</button>`);
      const nm = info ? info.name : mode.name;
      let step = '';
      if (info) {
        const a = fi.active;
        step = a === 'check' ? 'בדיקת שליטה' : /^lv\d/.test(a) ? `תרגול · רמה ${a.slice(2)}` : a.startsWith('l:') ? 'לומדים' : a && a !== 'ov' ? (fi.title && fi.title !== nm ? fi.title : '') : '';
        if (!a && fi.title && fi.title !== nm) step = fi.title;
      } else if (mode.v === 'act' && fi.title && fi.title !== nm && !atHome()) step = fi.title;
      parts.push(step ? `<button type="button" data-step="ov">${esc(nm)}</button>` : `<b>${esc(nm)}</b>`);
      if (step) parts.push(`<b>${esc(step)}</b>`);
      here = step ? `${nm} · ${step}` : nm;
    }
    // כפתור חזרה אחד – תמיד רמה אחת למעלה (שיעור → תוכנית הקורס → ספריית הקורסים; תרגול/כרטיסיות → דף הנושא → המחברת)
    const upK = mode.v === 'course' ? (inUnit ? 'plan' : 'up') : info && fi.active && fi.active !== 'ov' ? 'ov' : 'up';
    const backTo = upK === 'plan' ? 'לתוכנית הקורס' : upK === 'ov' ? 'לדף הנושא' : mode.v === 'course' ? 'לספריית הקורסים' : cat && catT ? `למחברת ${catT.name}` : 'לדף הבית';
    const endB = mode.v === 'course' && isCoach && D && D.getElementById('endBtn');
    shead.innerHTML = `<button type="button" class="btn sec s backbtn" id="stBack" data-k="${upK}">${ic('back', 's')} <span>${esc(backTo)}</span></button>
      <nav class="crumbs" aria-label="איפה אני">${parts.join('<span class="sep" aria-hidden="true">›</span>')}</nav>
      <b class="here" aria-hidden="true">${esc(here)}</b>
      ${endB && !endB.hidden ? `<button type="button" class="btn sec s endbtn" id="stEnd">${ic('done', 's')} סיימתי להיום</button>` : ''}
      ${info ? `<button type="button" class="btn sec s tocbtn" id="tocBtn" aria-expanded="false">${ic('list', 's')} <span>שלבי הנושא</span></button>` : ''}`;
    stage.classList.toggle('tocmin', !!info && tocMin);
    frameTone();
    // תוכן העניינים של הנושא (עמוד ימין)
    if (info) {
      const a = fi.active, cur = x => a === x ? ' aria-current="step"' : '';
      const stI = (ok, on) => on ? ic('dot', 's') : ok ? ic('done', 's') : ic('circle', 's');
      toc.innerHTML = `<button type="button" class="tocfold" id="tocFold" aria-label="כיווץ תוכן העניינים" title="כיווץ תוכן העניינים">${ic('back', 's')}</button><div class="tt"><span class="sw"></span><h2>${esc(info.name)}</h2></div><div class="tsub">${esc(info.desc)}</div>
        <div class="meter" style="margin-bottom:6px"><span>שליטה</span><span class="bar"><i style="width:${info.m}%"></i></span><b>${info.m}%</b></div><div class="tsub">${esc(clean(info.lbl))}</div>
        <ol class="steps">
          <li><button type="button" data-step="ov"${cur('ov')}><span class="st">${ic('home', 's')}</span>דף הנושא – מה הצעד הבא</button></li>
          ${info.ls.length ? `<li class="grp">לומדים – כרטיסיות הסבר</li>${info.ls.map(l => `<li><button type="button" data-step="l:${l.id}"${cur('l:' + l.id)}><span class="st${l.k >= l.all ? ' ok' : ''}">${stI(l.k >= l.all, a === 'l:' + l.id)}</span>${esc(l.name)}<span class="x">${l.k}/${l.all}</span></button></li>`).join('')}` : ''}
          <li class="grp">מתרגלים – בוחרים רמה</li>
          ${[1, 2, 3].map(k => `<li><button type="button" data-step="lv${k}"${cur('lv' + k)}><span class="st">${stI(false, a === 'lv' + k)}</span>רמה ${k} – ${esc(info.tags[k - 1])}${k === info.cur ? `<span class="x">${info.started ? 'הרמה שלך' : 'מומלץ להתחלה'}</span>` : ''}</button></li>`).join('')}
          <li class="grp">בודקים את עצמי</li>
          <li><button type="button" data-step="check"${cur('check')}><span class="st">${stI(false, a === 'check')}</span>בדיקת שליטה עצמאית<span class="x">5 שאלות</span></button></li>
          ${info.exc ? `<li><button type="button" data-step="exam"${cur('sim')}><span class="st">${ic('circle', 's')}</span>מבחן לדוגמה<span class="x">20 דק'</span></button></li>` : ''}
          ${info.tools.length ? `<li class="grp">כלי המחשה</li>${info.tools.map(t => `<li><button type="button" data-step="tool:${t.id}"><span class="st">${ic('tool', 's')}</span>${esc(clean(t.chip))}</button></li>`).join('')}` : ''}
        </ol>`;
    } else toc.innerHTML = '';
    // חוצצים בשולי המחברת – רק מה שיש בנושא הזה; מובילים לאותם שלבים שבתוכן העניינים
    const divs = $('#divs');
    if (info) {
      const a = fi.active, crs = (courses() || []).find(c => c.ok && c.fits && c.cat === cat);
      const firstL = info.ls.find(l => l.k < l.all) || info.ls[0];
      const D2 = [
        info.ls.length && { k: 'learn', step: 'l:' + firstL.id, on: a.startsWith('l:'), icon: 'book', t: 'לומדים' },
        { k: 'prac', step: 'lv' + info.cur, on: /^lv/.test(a), icon: 'pencil', t: 'מתרגלים' },
        info.tools.length && { k: 'tool', step: 'tool:' + info.tools[0].id, on: false, icon: 'tool', t: 'כלי המחשה' },
        { k: 'chk', step: 'check', on: a === 'check' || a === 'sim', icon: 'check', t: 'מבדקים' },
        crs && { k: 'crs', crs: crs.id, on: false, icon: 'cap', t: 'קורס' }
      ].filter(Boolean);
      divs.innerHTML = D2.map((d, i) => `<button type="button" class="dv" style="--dl:${72 - i * 9}%" ${d.crs ? `data-dcourse="${d.crs}"` : `data-step="${d.step}"`}${d.on ? ' aria-current="true"' : ''}>${ic(d.icon, 's')}<span>${d.t}</span></button>`).join('');
    } else divs.innerHTML = '';
  }
  // תוכן העניינים בצד – אפשר לכווץ במחשב ולתת לתוכן את כל הרוחב (נשמר במכשיר)
  const wide = () => matchMedia('(min-width: 700px)').matches;
  let tocMin = false; try { tocMin = localStorage.getItem('nb-tocmin') === '1'; } catch (e) { /* לא חובה */ }
  function setTocMin(v) {
    tocMin = v; try { localStorage.setItem('nb-tocmin', v ? '1' : '0'); } catch (e) { /* לא חובה */ }
    stage.classList.toggle('tocmin', v && !stage.classList.contains('full'));
    const b = $('#tocBtn'); if (b) b.focus(); else if (!v) { const f = $('#tocFold'); if (f) f.focus(); }
  }
  function doStep(s) {
    stage.classList.remove('tocopen');
    if (mode.v !== 'topic') return;
    const sel = s === 'ov' ? null : s.startsWith('l:') ? `[data-tl="${s.slice(2)}"]` : s.startsWith('lv') ? `[data-pick="${s.slice(2)}"]` : s === 'check' ? '#tpCheck' : s === 'exam' ? '#tpExam' : s.startsWith('tool:') ? `[data-tool="${s.slice(5)}"]` : null;
    if (isSite && run('state && state.mode') && !confirm('לצאת מהסבב? ההתקדמות בסבב הזה לא תישמר.')) return;
    openTopic(mode.id, mode.cat, sel);
  }
  function stageBack(k) {
    if (k === 'ov') return doStep('ov');
    if (k === 'plan' && isCoach && D) { const b = D.getElementById('back'); if (b) { b.click(); return; } }
    if (mode.v === 'course') { mode = { v: 'courses' }; F.src = SITE; isSite = false; $('#loading').hidden = false; ensure('site').then(() => { scrape(); if (mode.v === 'courses') render(); }); crsCache = null; return render(); }
    const cat = mode.cat;
    if (!leaveStage(true)) return;
    if (mode.v === 'area' && mode.gate) return go(backTo(mode.gate));
    if (mode.from) { if (mode.v === 'ext') { F.src = SITE; isSite = false; } return go(backTo(mode.from)); }
    if (mode.v === 'ext') { F.src = SITE; isSite = false; }
    go(cat && CAT[cat] ? { v: 'notebook', cat } : { v: 'library' });
  }
  stage.addEventListener('click', e => {
    const sb = e.target.closest('#stBack'); if (sb) return stageBack(sb.dataset.k);
    if (e.target.closest('#stEnd')) { const b = D && D.getElementById('endBtn'); if (b) b.click(); return; }
    if (e.target.closest('[data-cplan]')) { const b = D && D.getElementById('back'); if (b) b.click(); return; }
    if (e.target.closest('#tocFold')) return setTocMin(true);
    if (e.target.closest('#tocBtn')) {
      if (wide() && tocMin) return setTocMin(false);
      const o = stage.classList.toggle('tocopen'); e.target.closest('#tocBtn').setAttribute('aria-expanded', o); return; }
    const s = e.target.closest('[data-step]'); if (s) return doStep(s.dataset.step);
    const dc = e.target.closest('[data-dcourse]'); if (dc) { const c = courses().find(x => x.id === dc.dataset.dcourse), cat = mode.cat; if (c && leaveStage(true)) { openCourse(c); mode.cat = cat; updateStage(); } return; }
    const c = e.target.closest('[data-cat]'); if (c) { if (!leaveStage(true)) return; return go({ v: 'notebook', cat: c.dataset.cat }); }
    if (e.target.closest('[data-nav]')) return; // מטופל למעלה
    if (stage.classList.contains('tocopen') && !e.target.closest('.side-toc')) stage.classList.remove('tocopen');
  });

  // שינוי בתוך המסגרת: חלון קופץ, חזרה לדף הבית של האתר, מעבר בין שלבים
  let frameT = 0;
  // אימוג'ים בממשק של המסכים הפנימיים → אייקונים קוויים (רק מראה: כפתורים, כותרות, תגיות; לא בתוך תוכן שיעור או שאלה)
  const EMO_IC = { '⭐': 'star', '🌟': 'star', '🔒': 'lock', '🔓': 'unlock', '🔐': 'lock', '✅': 'done', '✔': 'done', '📖': 'book', '📚': 'book', '📘': 'book', '🧰': 'tool', '🛠': 'tool', '🔧': 'tool',
    '📍': 'target', '🎯': 'target', '🏆': 'trophy', '🥇': 'medal', '🥈': 'medal', '🥉': 'medal', '🏅': 'medal', '➗': 'divide', '✖': 'times', '🖨': 'printer', '🎮': 'game', '🧩': 'cards', '🃏': 'cards',
    '💡': 'bulb', '👁': 'eye', '⏱': 'check', '📝': 'pencil', '✏': 'pencil', '📋': 'list', '👩‍🏫': 'users', '👥': 'users', '🔍': 'search', '🎓': 'cap', '📐': 'tool', '🧊': 'tool' };
  const EMO_SEL = '.topbar, .mmeter, .tp-next, .tp-lesson, .lvlchoice, .lockrow, .tp-check, .tp-exam, .tp-h, .game-card, .champ-lock, .champ-card, .lvl, .tab, .panel > h2, .tools button, .gbar button, .tcat-tile, .tcat-back, .card > h2, .card > h3, button.secondary, button.linkish, .xt-tile, .tool-chip';
  const EMO_SKIP = '.lessonbox, .lbody, .q, .choices, .fb, .qbox, .ltitle, [data-raw], .overlay .modal .lbody';
  const EMO_RE = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*️?)\s?/gu;
  function deEmoji() {
    if (!D || !D.body || !isSite) return;
    D.querySelectorAll(EMO_SEL).forEach(host => {
      if (host.closest(EMO_SKIP)) return;
      const w = D.createTreeWalker(host, NodeFilter.SHOW_TEXT), nodes = [];
      let n; while ((n = w.nextNode())) if (/\p{Extended_Pictographic}/u.test(n.nodeValue) && !n.parentElement.closest(EMO_SKIP)) nodes.push(n);
      nodes.forEach(t => {
        const frag = D.createDocumentFragment(); let last = 0, m, txt = t.nodeValue; EMO_RE.lastIndex = 0;
        while ((m = EMO_RE.exec(txt))) {
          if (m.index > last) frag.appendChild(D.createTextNode(txt.slice(last, m.index)));
          const base = m[1].replace(/️/g, ''), name = EMO_IC[base] || EMO_IC[base[0]] || (t.parentElement.closest('.gc-ic, .game-card') ? 'game' : '');
          if (name) { const sp = D.createElement('span'); sp.className = 'nbi'; sp.setAttribute('aria-hidden', 'true'); sp.innerHTML = ic(name); frag.appendChild(sp); }
          last = m.index + m[0].length;
        }
        if (last < txt.length) frag.appendChild(D.createTextNode(txt.slice(last)));
        t.parentNode.replaceChild(frag, t);
      });
    });
  }
  function onFrame() {
    clearTimeout(frameT);
    frameT = setTimeout(() => {
      if (!D || !D.body) return;
      try { deEmoji(); } catch (e) { /* מראה בלבד */ }
      const ov = [...D.body.children].some(e => e.classList && e.classList.contains('overlay') && !e.hidden);
      const hiddenStage = !stageModes.includes(mode.v);
      stage.classList.toggle('modal', ov && hiddenStage);
      if (D.documentElement) D.documentElement.classList.toggle('nb-modal-only', ov && hiddenStage);
      if (hiddenStage || Date.now() < quietUntil) { if (!hiddenStage) updateStage(); return; }
      if (isCoach && D.querySelector('#main .ccard') && mode.v === 'course') { crsCache = null; mode = { v: 'courses' }; return render(); }
      if (isSite && atHome()) {
        if (mode.v === 'area' && mode.gate && !ov) { scrape(); return go(backTo(mode.gate)); }
        const tab = run('homeTab');
        if (mode.v === 'act' && mode.from) { scrape(); return go(backTo(mode.from)); }
        if (mode.v === 'topic' || mode.v === 'act') { scrape(); return go(mode.cat && CAT[mode.cat] ? { v: 'notebook', cat: mode.cat } : { v: 'library' }); }
        if (mode.v === 'area' && tab !== mode.tab) {
          if (tab === 'practice' || tab === 'wp' && mode.tab !== 'wp') { scrape(); return go(mode.cat ? { v: 'notebook', cat: mode.cat } : { v: 'library' }); }
          const t = data && data.tabs.find(x => x.id === tab); mode.tab = tab; mode.name = t ? t.label : mode.name; renderChrome();
        }
      }
      if (mode.v === 'area' && isSite && !atHome() && mode.tab !== 'guide') { /* בתוך משחק/מבדק – נשארים באזור */ }
      updateStage();
    }, 60);
  }

  /* ---------------- אירועים בתצוגות ---------------- */
  function bindView() {
    view.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => go({ v: 'notebook', cat: b.dataset.cat }));
    view.querySelectorAll('[data-champ]').forEach(b => b.onclick = () => forward(() => { if (run('champOpen()')) run('champStart()'); }, { v: 'topic', id: 'champ', cat: null }));
    if ($('#contGo2')) $('#contGo2').onclick = () => forward(() => clickHome('#contGo'), { v: 'topic', id: null, cat: null });
    view.querySelectorAll('[data-item]').forEach(b => b.onclick = () => {
      const list = data.items[mode.cat] || [], it = list.find(x => x.idx === +b.dataset.item); if (it) openItem(it, mode.cat);
    });
    view.querySelectorAll('[data-gopen]').forEach(b => b.onclick = () => { const [tab, id] = b.dataset.gopen.split(':'); openArea(tab, '#' + id, b.dataset.gfrom || mode.g || tab); });
    view.querySelectorAll('[data-cgopen]').forEach(b => b.onclick = () => openClassGame(b.dataset.cgopen));
    view.querySelectorAll('[data-gclass]').forEach(b => b.onclick = () => { gTab = 'class'; try { sessionStorage.setItem('nb-gtab', 'class'); } catch (e) { /* לא חובה */ } go({ v: 'gate', g: 'games' }); });
    view.querySelectorAll('[data-gtab]').forEach(b => b.onclick = () => { gTab = b.dataset.gtab; try { sessionStorage.setItem('nb-gtab', gTab); } catch (e) { /* לא חובה */ } render(); const f = view.querySelector(`[data-gtab="${gTab}"]`); if (f) f.focus(); });
    view.querySelectorAll('[data-print]').forEach(b => b.onclick = () => openPrint(b.dataset.print ? b.dataset.print.split(',') : null, b.dataset.pfrom || null));
    view.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { const t = allTools()[+b.dataset.tool]; if (t) openItem(t.it, t.cat, 'tools'); });
    view.querySelectorAll('[data-ti]').forEach(b => b.onclick = () => { const [c, k] = b.dataset.ti.split(':'); openItem(data.items[c][+k], c); });
    view.querySelectorAll('[data-next]').forEach(b => b.onclick = () => openTopic(b.dataset.next, mode.cat, `[data-tl="${b.dataset.l}"]`));
    view.querySelectorAll('[data-focus-toc]').forEach(b => b.onclick = () => { const t = $('#tocbox'); t.open = true; t.scrollIntoView({ behavior: 'smooth', block: 'start' }); const f = t.querySelector('.it'); if (f) f.focus({ preventScroll: true }); });
    view.querySelectorAll('[data-crs]').forEach(b => b.onclick = () => { crsFilter = b.dataset.crs; go({ v: 'courses' }); });
    view.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => { crsFilter = b.dataset.cf; render(); });
    view.querySelectorAll('[data-course]').forEach(b => b.onclick = () => openCourse(b.dataset.course ? courses().find(c => c.id === b.dataset.course) : { id: '', title: 'קטלוג הקורסים' }));
    if ($('#allc')) $('#allc').onclick = () => { crsAll = true; render(); };
    const cq = $('#cq'); if (cq) cq.oninput = () => { crsQ = cq.value.trim(); const pos = cq.selectionStart; render(); const n = $('#cq'); n.focus(); n.setSelectionRange(pos, pos); };
    // בטלפון: תוכן העניינים במחברת מקופל כברירת מחדל? לא – פתוח, ואפשר לסגור
    const tb = $('#tocbox'); if (tb && matchMedia('(min-width: 900px)').matches) tb.querySelector('summary').addEventListener('click', e => e.preventDefault());
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); stage.classList.remove('tocopen'); } });

  /* ---------------- התחלה ---------------- */
  render();
  F.src = SITE;
  // לבדיקות אוטומטיות
  window.__nb = { get mode() { return mode; }, get data() { return data; }, go, openTopic, openArea, run: c => run(c) };
})();
