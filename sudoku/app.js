/* מרכז הסודוקו – ממשק: בית, משחק, מאמן, מרכז הדרכה, אתגר יומי, התקדמות. המשחק הוא העיקר. */
(function () {
  'use strict';
  const E = window.SDK, C = window.SDKC, B = window.SBD;
  const $ = id => document.getElementById(id);
  const app = $('app');
  const URLP = new URLSearchParams(location.search);
  const GRADE = URLP.get('grade') || '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- שמירה (רק במכשיר – בלי פרטים אישיים) ---------- */
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* לא חובה */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* לא חובה */ } }
  };
  const ST0 = () => ({ solved: {}, indep: {}, strat: {}, ask: {}, medals: {}, seen: {}, daily: {}, last: null });
  let ST = Object.assign(ST0(), ls.get('sdk-stats', {}));
  const saveST = () => ls.set('sdk-stats', ST);
  let SET = Object.assign({ instant: true, auto: false, same: true }, ls.get('sdk-set', {}));
  const saveSET = () => ls.set('sdk-set', SET);
  const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);

  const teacher = () => { const g = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const iris = g('math-book-key') === 'e1050f14' || g('math-teacher-key') === '3d9bf467';
    return (iris || (g('math-role') === 't' && g('math-staff-key') === '1a9e025e')) && g('math-role') !== 's' && g('math-preview') !== '1'; };

  /* ---------- טקסטים ---------- */
  const LV = E.LEVEL_NAME;
  const STARS = lv => '★'.repeat(lv) + '☆'.repeat(4 - lv);
  const TDESC = {
    '4': { 1: 'משלימים את המספר החסר', 2: 'מצליבים שורה, עמודה ואזור' },
    '6': { 1: 'אפשרות יחידה', 2: 'מקום יחיד', 3: 'מועמדים נעולים וזוגות', 4: 'כנף X, מזלג ושילובים' },
    '9': { 1: 'אפשרות יחידה', 2: 'מקום יחיד', 3: 'מועמדים נעולים וזוגות', 4: 'כנף X, מזלג ושילובים' },
    'k4': { 1: 'סכומים פשוטים', 2: 'פירוק לסכומים' },
    'k6': { 1: 'סכומים פשוטים', 2: 'פירוק לסכומים', 3: 'כלל הסכום וזוגות', 4: 'שילובים מתקדמים' },
    'k9': { 2: 'פירוק לסכומים', 3: 'כלל הסכום וזוגות' }
  };
  const TNAME = t => E.TYPES[t].name;
  const levelsOf = t => E.LEVELS.filter(l => E.supported(t, l));

  /* ---------- מדליות ומסלול ---------- */
  const anyKey = (o, f) => Object.keys(o || {}).some(k => o[k] > 0 && f(k));
  const kLv = k => +k.split('-')[1], kT = k => k.split('-')[0];
  const MEDALS = [
    { id: 'rules', i: '📏', n: 'כללי הסודוקו', d: 'פתרתם לוח ראשון', ok: s => sum(s.solved) > 0 },
    { id: 'elim', i: '🔍', n: 'פסילת אפשרויות', d: 'פתרתם לבד לוח שצריך בו "אפשרות יחידה" ו"מקום יחיד"', ok: s => s.strat.nakedSingle > 0 && s.strat.hiddenSingle > 0 },
    { id: 's4', i: '🟦', n: '4×4 בעצמי', d: 'פתרתם לבד 4×4 ברמה בינונית', ok: s => s.indep['4-2'] > 0 },
    { id: 's6', i: '🟪', n: '6×6 בעצמי', d: 'פתרתם לבד 6×6 ברמה בינונית ומעלה', ok: s => anyKey(s.indep, k => kT(k) === '6' && kLv(k) >= 2) },
    { id: 's9', i: '🟩', n: '9×9 בעצמי', d: 'פתרתם לבד לוח 9×9', ok: s => anyKey(s.indep, k => kT(k) === '9') },
    { id: 'adv', i: '🔒', n: 'אסטרטגיות מתקדמות', d: 'פתרתם לבד לוח מאתגר – מועמדים נעולים או זוגות', ok: s => anyKey(s.indep, k => kLv(k) >= 3) },
    { id: 'killer', i: '➕', n: 'סודוקו סכומים', d: 'פתרתם לבד סודוקו סכומים', ok: s => anyKey(s.indep, k => k[0] === 'k') },
    { id: 'expert', i: '🏆', n: 'מומחים', d: 'פתרתם לבד לוח ברמת מומחים', ok: s => anyKey(s.indep, k => kLv(k) === 4) }
  ];
  const PATH = [
    { n: 'מכירים את כללי המשחק', ok: s => s.seen.rules || sum(s.solved) > 0, go: () => guideCard('rules') },
    { n: 'פותרים 4×4 – המספר החסר', ok: s => s.solved['4-1'] > 0 || s.solved['4-2'] > 0, go: () => newGame('4', 1) },
    { n: 'פותרים 4×4 בינוני לבד – הצלבת מידע', ok: s => s.indep['4-2'] > 0, go: () => newGame('4', 2) },
    { n: 'פותרים 6×6 – האפשרות היחידה', ok: s => anyKey(s.solved, k => kT(k) === '6'), go: () => newGame('6', 1) },
    { n: 'פותרים 6×6 בינוני לבד – המקום היחיד', ok: s => anyKey(s.indep, k => kT(k) === '6' && kLv(k) >= 2), go: () => newGame('6', 2) },
    { n: 'פותרים 9×9 – לוח גדול', ok: s => anyKey(s.solved, k => kT(k) === '9'), go: () => newGame('9', 1) },
    { n: 'פותרים 9×9 בינוני לבד', ok: s => anyKey(s.indep, k => kT(k) === '9' && kLv(k) >= 2), go: () => newGame('9', 2) },
    { n: 'מועמדים נעולים וזוגות – לוח מאתגר', ok: s => anyKey(s.indep, k => k[0] !== 'k' && kLv(k) >= 3), go: () => newGame('9', 3) },
    { n: 'סודוקו סכומים', ok: s => anyKey(s.solved, k => k[0] === 'k'), go: () => newGame('k4', 1) },
    { n: 'מומחים – שילוב אסטרטגיות', ok: s => anyKey(s.indep, k => kLv(k) === 4), go: () => newGame('6', 4) }
  ];
  function awardMedals() { const got = []; MEDALS.forEach(m => { if (!ST.medals[m.id] && m.ok(ST)) { ST.medals[m.id] = new Date().toISOString().slice(0, 10); got.push(m); } }); return got; }

  /* ---------- ניווט ---------- */
  let screen = 'home';
  function nav(name, fn) { screen = name; closeMenu(); if (G && name !== 'game') save(); fn(); window.scrollTo(0, 0); }
  window.addEventListener('popstate', () => { const h = (history.state && history.state.s) || 'home'; route(h, true); });
  function push(s, arg) { try { history.pushState({ s, arg }, '', '#' + s); } catch (e) { /* קובץ מקומי */ } }
  function route(s, fromPop) {
    if (!fromPop) push(s);
    if (s === 'game' && G) return nav('game', gameScreen);
    if (s === 'play') return nav('play', () => playMenu(false));
    if (s === 'killer') return nav('killer', () => playMenu(true));
    if (s === 'daily') return nav('daily', dailyScreen);
    if (s === 'guide') return nav('guide', guideScreen);
    if (s === 'progress') return nav('progress', progressScreen);
    if (s === 'teach') return nav('teach', () => window.SBK.open(app, { back: () => route('home') }));
    return nav('home', homeScreen);
  }
  $('toSite').href = 'math6.html' + (GRADE ? '?grade=' + encodeURIComponent(GRADE) : '');
  $('toSite').addEventListener('click', () => { try { sessionStorage.setItem('math-cat', 'exc'); } catch (e) { /* לא חובה */ } });

  /* ---------- בית ---------- */
  function homeScreen() {
    const cur = ls.get('sdk-g-cur', null), live = cur && !cur.done;
    const today = todayStr(), dDone = E.LEVELS.concat(0).filter(l => ST.daily[today + '-' + l]).length;
    const rec = PATH.find(p => !p.ok(ST));
    const medals = Object.keys(ST.medals).length;
    app.innerHTML = `
      <div class="hero"><div class="ic" aria-hidden="true">🧩</div><h1>מרכז הסודוקו</h1><p class="muted">חושבים, מסיקים ופותרים – בקצב שלכם.</p>
        <div class="resume">${live ? `<button class="btn big" id="goResume">▶ להמשיך את הלוח <span class="small" style="font-weight:600">(${esc(TNAME(cur.puz.type))} · ${LV[cur.puz.level]})</span></button>` : `<button class="btn big" id="goQuick">▶ שחקו עכשיו</button>`}</div>
        ${live ? `<p class="small muted" style="margin-top:6px"><button class="btn ghost" id="goQuick">או לוח חדש</button></p>` : ''}
      </div>
      <div class="tiles">
        <button class="tile" style="--c:#6b3fa0" id="tPlay"><span class="ti" aria-hidden="true">🎮</span><span class="tn">משחקים</span><span class="td">4×4, 6×6 ו-9×9 – בוחרים גודל ורמה ומתחילים</span></button>
        <button class="tile" style="--c:#1e8a8a" id="tKiller"><span class="ti" aria-hidden="true">➕</span><span class="tn">סודוקו סכומים</span><span class="td">סודוקו עם חשבון: כל כלוב והסכום שלו</span></button>
        <button class="tile" style="--c:#d97706" id="tDaily"><span class="ti" aria-hidden="true">📅</span><span class="tn">האתגר היומי</span><span class="td">חידה חדשה בכל יום, בכל רמה</span><span class="tb">${dDone ? `✓ פתרתם היום ${dDone}` : 'החידה של היום מחכה'}</span></button>
        <button class="tile" style="--c:#2f8f55" id="tGuide"><span class="ti" aria-hidden="true">💡</span><span class="tn">לומדים לפתור</span><span class="td">טיפים קצרים והדגמות על לוח אמיתי</span></button>
        <button class="tile" style="--c:#c0397b" id="tProg"><span class="ti" aria-hidden="true">🏅</span><span class="tn">ההתקדמות שלי</span><span class="td">מסלול, מדליות ומה כבר יודעים</span><span class="tb">${medals ? `🏅 ${medals} מדליות` : ''}${rec ? (medals ? ' · ' : '') + 'הבא: ' + esc(rec.n) : ''}</span></button>
      </div>
      <div class="tiles" style="grid-template-columns:1fr;margin-top:14px">
        <button class="tile teach" id="tTeach"><span class="ti" aria-hidden="true">🖨️</span><span><span class="tn">למורים: חוברות ודפי עבודה</span><br><span class="td">בוחרים סוגים, רמות וכמויות – ומדפיסים${teacher() ? '' : ' (גם להורים)'}</span></span></button>
      </div>`;
    const q = $('goQuick'); if (q) q.onclick = quickStart;
    const r = $('goResume'); if (r) r.onclick = () => { G = cur; G.hist = G.hist || []; G.fut = G.fut || []; route('game'); };
    $('tPlay').onclick = () => route('play');
    $('tKiller').onclick = () => route('killer');
    $('tDaily').onclick = () => route('daily');
    $('tGuide').onclick = () => route('guide');
    $('tProg').onclick = () => route('progress');
    $('tTeach').onclick = () => route('teach');
  }
  // התחלה בקליק אחד: הלוח האחרון, ואם אין – לפי המסלול
  function quickStart() {
    if (ST.last && E.supported(ST.last.type, ST.last.level)) return newGame(ST.last.type, ST.last.level);
    const grade = +GRADE || 0;
    if (grade && grade <= 2) return newGame('4', 1);
    if (grade && grade <= 4) return newGame('6', 1);
    return newGame(grade ? '9' : '4', 1);
  }

  /* ---------- בחירת לוח ---------- */
  function miniIcon(t) {
    const n = E.TYPES[t].n, g = E.geo(n);
    let s = `<svg class="mini" viewBox="0 0 ${n} ${n}" aria-hidden="true" style="background:#fff">`;
    for (let k = 1; k < n; k++) { const v = k % g.bc === 0, h = k % g.br === 0; s += `<line x1="${k}" y1="0" x2="${k}" y2="${n}" stroke="${v ? '#2f3352' : '#ccd'}" stroke-width="${v ? .16 : .06}"/><line x1="0" y1="${k}" x2="${n}" y2="${k}" stroke="${h ? '#2f3352' : '#ccd'}" stroke-width="${h ? .16 : .06}"/>`; }
    if (E.TYPES[t].killer) s += `<rect x=".15" y=".15" width="${n / 2 - .3}" height="${1 - .3}" fill="none" stroke="#1e8a8a" stroke-width=".08" stroke-dasharray=".2 .12"/>`;
    return s + '</svg>';
  }
  /* ---------- הסבר מאויר: איך משחקים סודוקו סכומים ---------- */
  // כלוב קטן לאיור: משבצות בשורה, קו מקווקו וסכום בפינה הימנית. cells = ספרות ('' ריק, '?' לשאלה)
  function cageFig(cells, sum, opt) {
    opt = opt || {};
    const k = cells.length, W = k * 46 + 8;
    let s = `<svg class="kfig" viewBox="0 0 ${W} 54" width="${W}" height="54" aria-hidden="true">`;
    cells.forEach((d, i) => { const x = W - 4 - (i + 1) * 46; s += `<rect x="${x}" y="4" width="46" height="46" fill="${d === '?' ? '#fff3c4' : '#fff'}" stroke="#aab0c8" stroke-width="1"/>`;
      if (d) s += `<text x="${x + 21}" y="${d === '?' ? 38 : 39}" font-size="${d === '?' ? 22 : 21}" text-anchor="middle" font-weight="${d === '?' ? 800 : 700}" fill="${opt.bad ? '#b3261e' : d === '?' ? '#8a5a00' : '#1d2433'}" font-family="Assistant, Arial, sans-serif">${d}</text>`; });
    s += `<rect x="7" y="7" width="${W - 14}" height="40" fill="none" stroke="#1e8a8a" stroke-width="2" stroke-dasharray="5 3" rx="2"/>`;
    s += `<rect x="${W - 28}" y="4" width="22" height="15" fill="#fff"/><text x="${W - 17}" y="17" font-size="14" text-anchor="middle" font-weight="800" fill="#1e8a8a" font-family="Assistant, Arial, sans-serif">${sum}</text>`;
    return s + '</svg>';
  }
  function killerHowHTML() {
    const row = (fig, t) => `<div class="kh-row"><div class="kh-fig">${fig}</div><div class="kh-t">${t}</div></div>`;
    return `<div class="kh">
      ${row('<span class="kh-big" aria-hidden="true">🧩</span>', '<b>1. כמו סודוקו רגיל.</b> בכל שורה, בכל עמודה ובכל אזור – כל מספר פעם אחת.')}
      ${row(cageFig(['1', '2'], 3), '<b>2. כלוב = מסגרת מקווקווה.</b> המספר הקטן בפינה הוא <b>הסכום</b> של כל המספרים בכלוב. כאן: <span dir="ltr" class="eq">1 + 2 = 3</span>.')}
      ${row(cageFig(['2', '2'], 4, { bad: 1 }) + ' <span class="kh-x" aria-label="לא נכון">✗</span> ' + cageFig(['1', '3'], 4) + ' <span class="kh-v" aria-label="נכון">✓</span>', '<b>3. בתוך כלוב מספר לא חוזר.</b> סכום 4 בשתי משבצות הוא <span dir="ltr" class="eq">1 + 3</span>, ולא <span dir="ltr" class="eq">2 + 2</span>.')}
      ${row(cageFig(['3', '?'], 7), '<b>4. נשארה משבצת אחת בכלוב? מחסרים.</b> <span dir="ltr" class="eq">7 − 3 = 4</span>, אז במשבצת הצהובה יש 4.')}
      ${row(cageFig(['', ''], 3) + ' ' + cageFig(['', ''], 17), '<b>5. סכומים "מיוחדים" – רק דרך אחת.</b> שתי משבצות עם סכום 3: רק <span dir="ltr" class="eq">1 + 2</span>. עם סכום 17 (בלוח 9×9): רק <span dir="ltr" class="eq">8 + 9</span>. מתחילים מהכלובים האלה!')}
      ${row('<span class="kh-big" aria-hidden="true">∑</span>', '<b>6. טיפ לרמות הגבוהות:</b> סכום כל שורה, עמודה ואזור ידוע – ב-4×4 הוא 10, ב-6×6 הוא 21, וב-9×9 הוא 45.')}
      <p class="small muted" style="margin:8px 0 0">תקועים? לחצו 💡 רמז בתוך המשחק – המאמן יראה לכם מאיפה להתחיל.</p></div>`;
  }
  function playMenu(killer) {
    const types = killer ? ['k4', 'k6', 'k9'] : ['4', '6', '9'];
    app.innerHTML = `<button class="back" id="bk">→ למרכז הסודוקו</button>
      <h1>${killer ? '➕ סודוקו סכומים' : '🎮 בוחרים לוח'}</h1>
      ${killer ? `<details class="card khd" id="kHowBox"${ST.seen.krules ? '' : ' open'}><summary><b>❓ איך משחקים סודוקו סכומים?</b> <span class="small muted">(הסבר קצר עם דוגמאות)</span></summary>${killerHowHTML()}<p style="margin:10px 0 0"><button class="btn" id="kTry">▶ לנסות לוח ראשון (4×4 קל)</button> <button class="btn sec" id="kHow">הדגמה צעד-אחר-צעד</button></p></details><p class="muted">מתחילים בלוח 4×4 קל, ומשם ממשיכים.</p>` : `<p class="muted">לוחצים על רמה – והמשחק מתחיל. אפשר לעבור בין סוגים ורמות מתי שרוצים.</p>`}
      <div class="pick">${types.map(t => `<div class="pcard"><h2>${miniIcon(t)} ${TNAME(t)}</h2>
        <div class="lvls">${levelsOf(t).map(l => `<button class="lv" data-t="${t}" data-l="${l}"><span class="ln">${LV[l]}</span><span class="ls" aria-label="רמה ${l} מתוך 4">${STARS(l)}</span><span class="small muted">${TDESC[t][l]}</span>${ST.solved[t + '-' + l] ? `<span class="lc">✓ ${ST.solved[t + '-' + l]}</span>` : ''}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="codebox"><label for="pcode" class="small muted">יש לכם קוד חידה (מחוברת או מחבר/ה)?</label><input id="pcode" placeholder="9-2-abc12" autocomplete="off"><button class="btn sec" id="pgo">פתיחה</button></div>`;
    $('bk').onclick = () => route('home');
    app.querySelectorAll('.lv').forEach(b => { b.onclick = () => newGame(b.dataset.t, +b.dataset.l); });
    const k = $('kHow'); if (k) k.onclick = () => guideCard('krules');
    const kt = $('kTry'); if (kt) kt.onclick = () => newGame('k4', 1);
    if (killer && !ST.seen.krules) { ST.seen.krules = 1; saveST(); } // בפעם הבאה ההסבר מקופל
    $('pgo').onclick = () => { const id = $('pcode').value.trim(); const p = E.parseId(id); if (!p || !E.supported(p.type, p.level)) return toast('הקוד לא מוכר'); openById(id); };
  }

  /* ---------- המשחק ---------- */
  let G = null; // מצב הלוח הנוכחי
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function fresh(puz, mode, key) {
    const N = puz.n * puz.n, sel = puz.givens.findIndex(x => !x);
    return { puz, grid: puz.givens.slice(), notes: new Array(N).fill(0), known: new Array(N).fill(0), hist: [], fut: [], sel: sel < 0 ? 0 : sel, notesMode: false, hints: 0, puts: 0, mode: mode || 'free', key: key || '', done: false, checked: false, t0: Date.now() };
  }
  function save() { if (!G) return; const o = Object.assign({}, G, { hist: G.hist.slice(-60), fut: [], coach: null }); if (G.mode === 'daily') ls.set('sdk-d-' + G.key, o); else ls.set('sdk-g-cur', o); }
  function loading(msg) { app.innerHTML = `<div class="game" style="--bw:${bwFor(9)}px"><div class="loading">${msg || 'מכינים לוח…'}</div></div>`; }
  function newGame(type, level, opt) {
    opt = opt || {};
    loading();
    setTimeout(() => {
      const puz = E.generateSafe(type, level, opt.seed || E.randSeed());
      if (!puz) { app.innerHTML = `<div class="card"><p>לא הצלחנו להכין לוח שעומד בכל הדרישות. נסו שוב.</p><button class="btn" id="rt">ניסיון נוסף</button> <button class="btn sec" id="hm">למרכז הסודוקו</button></div>`; $('rt').onclick = () => newGame(type, level, opt); $('hm').onclick = () => route('home'); return; }
      if (!opt.mode) { ST.last = { type, level }; saveST(); }
      G = fresh(puz, opt.mode, opt.key);
      save(); route('game');
    }, 30);
  }
  function openById(id) {
    loading(); setTimeout(() => { const p = E.fromId(id); if (!p) { toast('לא הצלחנו לפתוח את החידה'); return route('play'); } G = fresh(p); save(); route('game'); }, 30);
  }
  function bwFor(n) {
    const w = Math.min(window.innerWidth - 20, n === 4 ? 380 : n === 6 ? 460 : 540);
    const h = window.innerHeight - 250;
    return Math.round(Math.max(280, Math.min(w, Math.max(h, 320))));
  }

  let BV = null; // תצוגת הלוח הנוכחי
  function gameScreen() {
    const P = G.puz, n = P.n, bw = bwFor(n);
    const title = G.mode === 'daily' ? `📅 האתגר היומי · ${TNAME(P.type)} · ${LV[P.level]}` : `${TNAME(P.type)} · ${LV[P.level]}`;
    app.innerHTML = `<div class="game" style="--bw:${bw}px">
      <div class="gbar"><button class="back" id="gBack" aria-label="חזרה">→</button><span class="gt">${title} <span class="small muted" aria-label="רמה ${P.level} מתוך 4">${STARS(P.level)}</span></span>
        <button class="icob" id="gMenu" aria-haspopup="true" aria-label="תפריט">⋯</button></div>
      <div class="bdw" id="bdw"></div>
      <div id="gMsg"></div>
      <div id="hintp"></div>
      <div class="pad" id="pad" style="--pn:${n}" role="group" aria-label="מספרים">${Array.from({ length: n }, (_, k) => `<button data-d="${k + 1}" aria-label="${k + 1}">${k + 1}<span class="left"></span></button>`).join('')}</div>
      <div class="tools" style="grid-template-columns:repeat(6,1fr)">
        <button id="tNotes" aria-pressed="false"><span class="i" aria-hidden="true">✏️</span>סימון</button>
        <button id="tErase"><span class="i" aria-hidden="true">⌫</span>מחיקה</button>
        <button id="tUndo"><span class="i" aria-hidden="true">↶</span>ביטול</button>
        <button id="tRedo"><span class="i" aria-hidden="true">↷</span>שחזור</button>
        <button id="tCheck"><span class="i" aria-hidden="true">✔</span>בדיקה</button>
        <button id="tHint"><span class="i" aria-hidden="true">💡</span>רמז</button>
      </div>
      ${P.cages ? `<details class="card khd" style="width:var(--bw);margin:0"><summary><b>❓ איך משחקים סודוקו סכומים?</b></summary>${killerHowHTML()}</details>` : ''}
      <div class="small muted" style="text-align:center">קוד החידה: <span dir="ltr">${esc(P.id)}</span></div>
    </div>`;
    BV = boardView($('bdw'), P, { interactive: true, onCell: i => { G.sel = i; G.checked = false; draw(); } });
    $('gBack').onclick = () => { save(); history.length > 1 && history.state ? history.back() : route('home'); };
    $('gMenu').onclick = e => openMenu(e.currentTarget);
    $('pad').onclick = e => { const b = e.target.closest('button'); if (b) input(+b.dataset.d); };
    $('tNotes').onclick = () => { G.notesMode = !G.notesMode; draw(); };
    $('tErase').onclick = erase;
    $('tUndo').onclick = undo; $('tRedo').onclick = redo;
    $('tCheck').onclick = check;
    $('tHint').onclick = askHint;
    draw();
    if (G.done) showWin([], true);
  }

  /* תצוגת לוח (גם למשחק וגם להדגמות במרכז ההדרכה) */
  function boardView(host, P, opt) {
    const n = P.n, g = E.geo(n), N = n * n;
    host.innerHTML = `<div class="bd n${n}${P.cages ? ' kl' : ''}" style="--n:${n}" role="grid" aria-label="לוח סודוקו ${n} על ${n}">${Array.from({ length: N }, (_, i) => {
      const r = i / n | 0, c = i % n, cls = ['cl'];
      if (c === n - 1) cls.push('ce'); else if ((c + 1) % g.bc === 0) cls.push('tbx');
      if (r === n - 1) cls.push('re'); else if ((r + 1) % g.br === 0) cls.push('tby');
      return `<button class="${cls.join(' ')}" data-i="${i}" tabindex="-1" role="gridcell"></button>`;
    }).join('')}</div>${P.cages ? B.cageLayer(n, P.cages, { fs: n === 9 ? 0.27 : 0.25 }) : ''}`;
    const cells = [...host.querySelectorAll('.cl')];
    if (opt.interactive) {
      host.querySelector('.bd').addEventListener('click', e => { const b = e.target.closest('.cl'); if (b) opt.onCell(+b.dataset.i); });
    } else cells.forEach(b => { b.disabled = true; b.style.cursor = 'default'; });
    function update(v) {
      // v: { grid, notes, auto, sel, bad:Set, hl, same }
      const hl = v.hl || {}, sel = v.sel, grid = v.grid;
      const huS = new Set(), hkS = new Set(), hcS = new Set(hl.cells || []), xS = new Set(hl.x || []), seen = new Set(hl.seen || []);
      (hl.units || []).forEach(u => g.units[u].cells.forEach(i => huS.add(i)));
      if (hl.cage != null) P.cages[hl.cage].cells.forEach(i => hkS.add(i));
      (hl.cages || []).forEach(k => P.cages[k].cells.forEach(i => hkS.add(i)));
      const sd = sel >= 0 && grid[sel] ? grid[sel] : 0;
      const hd = new Set(hl.digits || []);
      let autoC = null;
      if (v.auto) { const S = E.newState(E.ctxOf(n, P.cages), grid, v.known); autoC = S.c; }
      for (let i = 0; i < N; i++) {
        const el = cells[i], d = grid[i], cls = el.classList;
        cls.toggle('giv', !!P.givens[i]);
        cls.toggle('sel', i === sel && opt.interactive);
        const peer = opt.interactive && sel >= 0 && v.same !== false && i !== sel && (g.R[i] === g.R[sel] || g.C[i] === g.C[sel] || g.B[i] === g.B[sel]);
        cls.toggle('peer', !!peer && !huS.size);
        cls.toggle('same', !!d && ((v.same !== false && sd && d === sd && i !== sel) || hd.has(d)));
        cls.toggle('bad', !!(v.bad && v.bad.has(i)));
        cls.toggle('hu', huS.has(i)); cls.toggle('hk', hkS.has(i)); cls.toggle('hc', hcS.has(i)); cls.toggle('hs', seen.has(i));
        let html = '', lab = `שורה ${(i / n | 0) + 1}, עמודה ${i % n + 1}: `;
        if (d) { html = String(d); lab += d + (P.givens[i] ? ' (נתון)' : '') + (v.bad && v.bad.has(i) ? ', כדאי לבדוק' : ''); }
        else {
          const hc = hl.cand && hl.cand[i] != null ? hl.cand[i] : null;
          const um = v.notes ? v.notes[i] : 0;
          const m = hc != null ? hc : um || (autoC ? autoC[i] : 0);
          if (hl.put && hl.put[0] === i) { html = `<span class="gp">${hl.put[1]}</span>`; lab += 'רמז: ' + hl.put[1]; }
          else if (m) {
            const on = hl.on && hl.on[i] || 0, off = hl.off && hl.off[i] || 0;
            html = `<span class="nt">${Array.from({ length: n }, (_, k) => { const x = k + 1, has = m >> x & 1; const c2 = !has ? '' : off >> x & 1 ? 'off' : on >> x & 1 ? 'on' : hc != null && (on || off) ? 'dm' : (!um && hc == null ? 'au' : ''); return `<span class="${c2}">${has ? x : ''}</span>`; }).join('')}</span>`;
            lab += 'מועמדים ' + E.digs(m).join(' ');
          } else lab += 'ריקה';
        }
        if (xS.has(i)) html += '<span class="hx" aria-hidden="true">✗</span>';
        if (hl.tag && hl.tag[i]) html += `<span class="tg" aria-hidden="true">${hl.tag[i]}</span>`;
        if (el._h !== html) { el.innerHTML = html; el._h = html; }
        el.setAttribute('aria-label', lab);
        el.tabIndex = opt.interactive && i === sel ? 0 : -1;
      }
    }
    return { update, cells, focus: () => { const el = cells[G.sel]; if (el) el.focus({ preventScroll: true }); } };
  }

  const wrongSet = () => { const s = new Set(); if (!(SET.instant || G.checked)) return s; G.grid.forEach((d, i) => { if (d && !G.puz.givens[i] && d !== G.puz.solution[i]) s.add(i); }); return s; };
  function draw() {
    if (!G || screen !== 'game' || !BV) return;
    const co = G.coach, hl = co ? co.h.levels[co.lv].hl : null;
    BV.update({ grid: G.grid, notes: G.notes, auto: SET.auto, known: G.known, sel: G.sel, bad: wrongSet(), hl, same: SET.same });
    $('tNotes').setAttribute('aria-pressed', G.notesMode ? 'true' : 'false');
    $('pad').classList.toggle('notes', G.notesMode);
    $('tUndo').disabled = !G.hist.length; $('tRedo').disabled = !G.fut.length;
    const n = G.puz.n;
    $('pad').querySelectorAll('button').forEach(b => { const d = +b.dataset.d, left = n - G.grid.filter(x => x === d).length; b.querySelector('.left').textContent = left > 0 ? left : ''; b.classList.toggle('done', left <= 0); b.setAttribute('aria-label', `${d}${left > 0 ? `, נשארו ${left}` : ', הושלם'}`); });
    drawHint();
  }
  const snap = () => ({ g: G.grid.slice(), nt: G.notes.slice() });
  function commit(before) { G.hist.push(before); if (G.hist.length > 300) G.hist.shift(); G.fut = []; G.coach = null; G.checked = false; afterChange(); }
  function input(d) {
    if (!G || G.done) return;
    const i = G.sel; if (i < 0 || G.puz.givens[i]) return say('זו משבצת נתונה');
    const before = snap();
    if (G.notesMode) { if (G.grid[i]) return; G.notes[i] ^= 1 << d; }
    else if (G.grid[i] === d) { G.grid[i] = 0; }
    else {
      G.grid[i] = d; G.notes[i] = 0;
      E.ctxOf(G.puz.n, G.puz.cages).peers[i].forEach(p => { G.notes[p] &= ~(1 << d); }); // מוחקים את המספר מהסימונים של השכנים
      G.last = i;
    }
    commit(before);
  }
  function erase() { if (!G || G.done) return; const i = G.sel; if (i < 0 || G.puz.givens[i] || (!G.grid[i] && !G.notes[i])) return; const b = snap(); if (G.grid[i]) G.grid[i] = 0; else G.notes[i] = 0; commit(b); }
  function undo() { if (!G.hist.length || G.done) return; G.fut.push(snap()); const s = G.hist.pop(); G.grid = s.g; G.notes = s.nt; G.coach = null; afterChange(); }
  function redo() { if (!G.fut.length || G.done) return; G.hist.push(snap()); const s = G.fut.pop(); G.grid = s.g; G.notes = s.nt; G.coach = null; afterChange(); }
  function afterChange() {
    setMsg('');
    if (G.grid.every((d, i) => d === G.puz.solution[i])) return win();
    save(); draw();
  }
  function check() {
    if (G.done) return;
    const bad = G.grid.filter((d, i) => d && !G.puz.givens[i] && d !== G.puz.solution[i]).length;
    const empty = G.grid.filter(x => !x).length;
    G.checked = true; draw();
    setMsg(bad ? `יש ${bad === 1 ? 'משבצת אחת' : bad + ' משבצות'} שכדאי לבדוק שוב (מסומנות ב-!). רוצים רמז? לחצו 💡` : `הכול נכון עד עכשיו ✓ נשארו ${empty} משבצות.`, bad ? 'info' : 'ok');
  }
  function setMsg(t, k) { const m = $('gMsg'); if (!m) return; m.innerHTML = t ? `<div class="msg ${k || 'info'}" role="status">${t}</div>` : ''; }
  function say(t) { $('sr').textContent = t; }

  /* ---------- המאמן ---------- */
  function askHint() {
    if (!G || G.done) return;
    if (G.coach && G.coach.lv < G.coach.h.levels.length - 1) return moreHint();
    const h = C.hint(G.puz, G.grid, G.known, G.last);
    G.coach = { h, lv: 0 };
    G.hints++;
    if (h.kind === 'step') ST.ask[h.strategy] = (ST.ask[h.strategy] || 0) + 1, saveST();
    draw(); save();
  }
  function moreHint() { if (!G.coach) return; if (G.coach.lv < G.coach.h.levels.length - 1) { G.coach.lv++; G.hints++; } const h = G.coach.h; if (G.coach.lv === h.levels.length - 1 && h.kind === 'step' && h.step.elim) h.step.elim.forEach(([i, m]) => { G.known[i] |= m; }); draw(); save(); }
  function drawHint() {
    const box = $('hintp'); if (!box) return;
    const co = G && G.coach; if (!co) { box.innerHTML = ''; return; }
    const h = co.h, L = h.levels, l = L[co.lv], last = co.lv === L.length - 1;
    const head = h.kind === 'error' ? (h.sub === 'rule' ? '🔎 בודקים טעות' : '🔎 משהו לא מסתדר') : h.kind === 'step' ? `💡 רמז ${co.lv + 1} מתוך ${L.length}${last ? ` · ${C.ICON[h.strategy]} ${C.NAME[h.strategy]}` : ''}` : '💡';
    let acts = '';
    if (!last) acts += `<button class="btn" id="hMore">💡 רמז נוסף</button>`;
    if (last && l.hl.put) acts += `<button class="btn" id="hPut">✍️ כתבו לי ${l.hl.put[1]}</button>`;
    if (last && l.hl.elim) acts += `<button class="btn" id="hElim">📝 עדכנו לי את הסימונים</button>`;
    if (last && h.then) acts += `<button class="btn sec" id="hThen">ומה עכשיו? ›</button>`;
    if (l.erase != null) acts += `<button class="btn" id="hErase">🗑️ מחקו</button>`;
    acts += `<button class="btn ghost" id="hClose">סגירה</button>`;
    box.innerHTML = `<div class="hintp" role="status"><div class="hh"><span>${head}</span><span class="dots" aria-hidden="true">${L.length > 1 ? L.map((_, k) => k <= co.lv ? '●' : '○').join('') : ''}</span></div><div class="ht">${B.eqWrap(esc(co.then ? co.then.t : l.t))}</div><div class="ha">${co.then ? '<button class="btn ghost" id="hClose2">סגירה</button>' : acts}</div></div>`;
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on('hMore', moreHint);
    on('hClose', () => { G.coach = null; draw(); });
    on('hClose2', () => { G.coach = null; draw(); });
    on('hPut', () => { const [i, d] = l.hl.put; G.sel = i; G.puts++; G.notesMode = false; input(d); });
    on('hElim', () => { const b = snap(); l.hl.elim.forEach(([i, m]) => { G.known[i] |= m; if (G.notes[i]) G.notes[i] &= ~m; else if (!G.grid[i]) G.notes[i] = E.newState(E.ctxOf(G.puz.n, G.puz.cages), G.grid, G.known).c[i]; }); G.hist.push(b); G.fut = []; G.coach = null; save(); draw(); setMsg('הסימונים עודכנו. עכשיו יש פחות אפשרויות – נסו למצוא את הצעד הבא.', 'info'); });
    on('hErase', () => { G.sel = l.erase; const b = snap(); G.grid[l.erase] = 0; commit(b); });
    on('hThen', () => { const t = h.then; G.coach = { h: { kind: 'step', strategy: t.step.s, step: t.step, levels: [{ t: t.t, hl: t.hl }] }, lv: 0 }; draw(); });
  }

  /* ---------- ניצחון ---------- */
  function win() {
    G.done = true; G.coach = null;
    const P = G.puz, k = P.type + '-' + P.level, indep = G.hints === 0;
    ST.solved[k] = (ST.solved[k] || 0) + 1;
    if (indep) { ST.indep[k] = (ST.indep[k] || 0) + 1; (P.grade.strategies || []).forEach(s => { ST.strat[s] = (ST.strat[s] || 0) + 1; }); }
    if (G.mode === 'daily') ST.daily[G.key] = 1;
    const got = awardMedals(); saveST(); save();
    draw(); showWin(got);
  }
  function showWin(got, again) {
    const P = G.puz, host = $('bdw'); if (!host) return;
    const next = E.supported(P.type, P.level + 1) ? P.level + 1 : 0;
    const w = document.createElement('div'); w.className = 'win'; w.setAttribute('role', 'status');
    const strat = (P.grade.strategies || []).filter(s => E.TIER(s) >= 2).map(s => C.NAME[s]);
    w.innerHTML = `<div class="wi" aria-hidden="true">🎉</div><h2>${G.mode === 'daily' ? 'פתרתם את האתגר של היום!' : 'פתרתם את הלוח!'}</h2>
      <p>${G.hints === 0 ? 'פתרון עצמאי – בלי אף רמז. מעולה!' : `השתמשתם ב-${G.hints} רמזים – וכך לומדים. בפעם הבאה נסו עם פחות.`}</p>
      ${strat.length ? `<p class="small muted">בלוח הזה השתמשתם ב: ${esc([...new Set(strat)].join(' · '))}</p>` : ''}
      ${(got || []).map(m => `<div class="medal-new">${m.i} מדליה חדשה: ${esc(m.n)}</div>`).join('')}
      <div class="acts">${G.mode === 'daily' ? '<button class="btn" id="wDaily">לאתגרים של היום</button>' : `<button class="btn" id="wMore">▶ עוד לוח כזה</button>${next ? `<button class="btn sec" id="wNext">⬆ רמה ${LV[next]}</button>` : ''}`}<button class="btn ghost" id="wHome">למרכז הסודוקו</button>${again ? '<button class="btn ghost" id="wSee">לראות את הלוח</button>' : ''}</div>`;
    host.appendChild(w);
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on('wMore', () => newGame(P.type, P.level)); on('wNext', () => newGame(P.type, next));
    on('wDaily', () => route('daily')); on('wHome', () => route('home')); on('wSee', () => w.remove());
    say('פתרתם את הלוח!');
  }

  /* ---------- תפריט המשחק ---------- */
  let menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function openMenu(btn) {
    if (menuEl) return closeMenu();
    const r = btn.getBoundingClientRect();
    menuEl = document.createElement('div'); menuEl.className = 'menu'; menuEl.setAttribute('role', 'menu');
    menuEl.style.top = (r.bottom + window.scrollY + 6) + 'px'; menuEl.style.left = Math.max(8, r.left + window.scrollX) + 'px';
    menuEl.innerHTML = `
      <label><input type="checkbox" id="mInst" ${SET.instant ? 'checked' : ''}> משוב מיידי על טעויות</label>
      <label><input type="checkbox" id="mAuto" ${SET.auto ? 'checked' : ''}> מצב מונחה: להציג מועמדים</label>
      <label><input type="checkbox" id="mSame" ${SET.same ? 'checked' : ''}> הדגשת שורה, עמודה ומספרים זהים</label>
      <div class="sep"></div>
      <button id="mRestart">⟲ להתחיל את הלוח מחדש</button>
      ${G.mode === 'daily' ? '' : '<button id="mNew">🆕 לוח חדש באותה רמה</button>'}
      <button id="mCopy">🔗 קוד החידה: <span dir="ltr">${esc(G.puz.id)}</span></button>`;
    document.body.appendChild(menuEl);
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    $('mInst').onchange = e => { SET.instant = e.target.checked; saveSET(); draw(); };
    $('mAuto').onchange = e => { SET.auto = e.target.checked; saveSET(); draw(); };
    $('mSame').onchange = e => { SET.same = e.target.checked; saveSET(); draw(); };
    on('mRestart', () => { closeMenu(); const b = snap(); G.grid = G.puz.givens.slice(); G.notes = G.notes.map(() => 0); G.known = G.known.map(() => 0); G.done = false; commit(b); gameScreen(); });
    on('mNew', () => { closeMenu(); newGame(G.puz.type, G.puz.level); });
    on('mCopy', () => { closeMenu(); try { navigator.clipboard.writeText(G.puz.id); toast('הקוד הועתק'); } catch (e) { toast(G.puz.id); } });
    setTimeout(() => document.addEventListener('click', outside, { once: true }), 0);
    function outside(e) { if (menuEl && !menuEl.contains(e.target)) closeMenu(); else if (menuEl) document.addEventListener('click', outside, { once: true }); }
  }

  /* ---------- מקלדת ---------- */
  document.addEventListener('keydown', e => {
    if (screen !== 'game' || !G || e.target.closest && e.target.closest('input, textarea, select, .menu')) return;
    const n = G.puz.n, i = G.sel, r = i / n | 0, c = i % n;
    let ni = -1;
    if (e.key === 'ArrowUp') ni = r > 0 ? i - n : i; else if (e.key === 'ArrowDown') ni = r < n - 1 ? i + n : i;
    else if (e.key === 'ArrowRight') ni = c > 0 ? i - 1 : i; else if (e.key === 'ArrowLeft') ni = c < n - 1 ? i + 1 : i; // עמודה 0 מימין
    if (ni >= 0) { e.preventDefault(); G.sel = ni; draw(); BV.focus(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); return redo(); }
    const d = parseInt(e.key, 10);
    if (d >= 1 && d <= n) { e.preventDefault(); input(d); return; }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { e.preventDefault(); erase(); return; }
    if (e.key === 'n' || e.key === 'N' || e.key === 'מ') { G.notesMode = !G.notesMode; draw(); }
    if (e.key === 'h' || e.key === 'H' || e.key === 'י') askHint();
  });
  window.addEventListener('resize', () => { if (screen === 'game' && G) { const bw = bwFor(G.puz.n); const gm = app.querySelector('.game'); if (gm) gm.style.setProperty('--bw', bw + 'px'); } });

  /* ---------- האתגר היומי ---------- */
  const DAILY_LV = [[0, 'מתחילים', '4×4'], [1, 'קלה', '6×6'], [2, 'בינונית', '9×9'], [3, 'מאתגרת', '9×9'], [4, 'מומחים', '9×9']];
  function dailyScreen() {
    const d = todayStr();
    app.innerHTML = `<button class="back" id="bk">→ למרכז הסודוקו</button><h1>📅 האתגר היומי</h1>
      <p class="muted">${new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} · אותה חידה לכולם, כל היום. בלי שעון ובלי לחץ – אפשר להפסיק ולהמשיך מאוחר יותר.</p>
      <div class="daily">${DAILY_LV.map(([lv, nm, sz]) => { const key = d + '-' + lv, done = ST.daily[key], prog = ls.get('sdk-d-' + key, null);
        return `<button class="lv" data-l="${lv}"><span class="ti" aria-hidden="true" style="font-size:1.5rem">${done ? '✅' : prog ? '⏸️' : '🧩'}</span><span class="dn"><span class="ln">${nm}</span> <span class="small muted">· ${sz}</span><br><span class="small muted">${done ? 'פתרתם – כל הכבוד!' : prog ? 'התחלתם – לחצו להמשיך' : 'עוד לא התחלתם'}</span></span><span class="ls" aria-hidden="true">${lv ? STARS(lv) : '★☆☆☆'}</span></button>`; }).join('')}</div>`;
    $('bk').onclick = () => route('home');
    app.querySelectorAll('.daily .lv').forEach(b => { b.onclick = () => openDaily(+b.dataset.l); });
  }
  function openDaily(lv) {
    const d = todayStr(), key = d + '-' + lv, prog = ls.get('sdk-d-' + key, null);
    if (prog) { G = prog; G.hist = G.hist || []; G.fut = []; return route('game'); }
    const di = E.dailyId(d, lv);
    newGame(di.type, di.level, { seed: di.seed, mode: 'daily', key });
  }

  /* ---------- מרכז ההדרכה ---------- */
  const GUIDE = [
    { id: 'rules', grp: 0, i: '📏', n: 'כללי המשחק', d: 'שורה, עמודה ואזור – כל מספר פעם אחת' },
    { id: 'fullHouse', grp: 0, ex: ['4', 1], play: ['4', 1] },
    { id: 'nakedSingle', grp: 0, ex: ['6', 1], play: ['6', 1] },
    { id: 'hiddenSingle', grp: 0, ex: ['9', 2], play: ['9', 2] },
    { id: 'notes', grp: 0, i: '✏️', n: 'סימון מועמדים', d: 'מספרים קטנים: מה עוד אפשרי במשבצת', play: ['6', 2] },
    { id: 'locked', grp: 1, ex: ['9', 3], st: 'lockedPointing', play: ['9', 3] },
    { id: 'nakedPair', grp: 1, ex: ['9', 3], play: ['9', 3] },
    { id: 'hiddenPair', grp: 1, ex: ['9', 3], play: ['9', 3] },
    { id: 'xWing', grp: 1, ex: ['9', 4], play: ['9', 4] },
    { id: 'xyWing', grp: 1, ex: ['6', 4], play: ['6', 4] },
    { id: 'krules', grp: 2, i: '➕', n: 'איך משחקים סודוקו סכומים', d: 'כלובים, סכומים ומספרים שונים', ex: ['k4', 1], st: 'cageSingle', play: ['k4', 1] },
    { id: 'cageCombo', grp: 2, ex: ['k4', 2], play: ['k4', 2] },
    { id: 'unitSum', grp: 2, ex: ['k6', 3], play: ['k6', 3] }
  ];
  const GRP = ['מתחילים כאן', 'אסטרטגיות מתקדמות', 'סודוקו סכומים'];
  const EXPLAIN = C.EXPLAIN;
  const gInfo = g => ({ i: g.i || C.ICON[g.st || g.id], n: g.n || C.NAME[g.st || g.id], d: g.d || C.SHORT[g.st || g.id] });
  function guideScreen() {
    app.innerHTML = `<button class="back" id="bk">→ למרכז הסודוקו</button><h1>💡 לומדים לפתור</h1>
      <p class="muted">טיפים קצרים עם הדגמה על לוח אמיתי. לא חייבים לעבור על הכול – אפשר לשחק מתי שרוצים, ולבקש רמז בכל לוח.</p>
      ${GRP.map((nm, k) => `<h2 class="ghead">${nm}</h2><div class="gcards">${GUIDE.filter(g => g.grp === k).map(g => { const x = gInfo(g); return `<button class="gcard${ST.seen[g.id] ? ' seen' : ''}" data-g="${g.id}"><span class="gi" aria-hidden="true">${x.i}</span><span><span class="gn">${esc(x.n)}</span><br><span class="gd">${esc(x.d)}</span></span></button>`; }).join('')}</div>`).join('')}`;
    $('bk').onclick = () => route('home');
    app.querySelectorAll('.gcard').forEach(b => { b.onclick = () => guideCard(b.dataset.g); });
  }
  // דוגמאות לכל טיפ: הראשונה מודרכת, הבאות – לבד. k = מספר הדוגמה
  const EXS = {};
  function findExample(g, k) {
    k = k || 0;
    const c = EXS[g.id] || (EXS[g.id] = { list: [], s: 0 });
    const st = g.id === 'locked' ? 'locked' : g.st || g.id;
    while (c.list.length <= k && c.s < 40 + k * 25) {
      const s = c.s++, p = E.generateSafe(g.ex[0], g.ex[1], 'ex' + g.id + s, 2); if (!p) continue;
      const x = C.exampleState(p, st) || C.exampleState(p, st, E.ORDER); if (x) c.list.push({ p, x });
    }
    return c.list[k] || null;
  }
  function guideCard(id) {
    const g = GUIDE.find(x => x.id === id); if (!g) return;
    screen = 'guide'; push('guide');
    ST.seen[id] = 1; saveST();
    const x = gInfo(g), lines = EXPLAIN[id] || [];
    app.innerHTML = `<button class="back" id="bk">→ לכל הטיפים</button>
      <div class="exp"><h1>${x.i} ${esc(x.n)}</h1>${id === 'krules' ? killerHowHTML() + '<h2 style="margin-top:14px">הדגמה על לוח אמיתי</h2>' : lines.map(l => `<p>${B.eqWrap(esc(l))}</p>`).join('')}</div>
      <div class="demo" id="demo"><div class="loading" style="--bw:${Math.min(bwFor(9), 420)}px;width:${Math.min(bwFor(9), 420)}px">מכינים דוגמה…</div></div>
      <div class="stepper" style="margin-top:12px">${g.play ? `<button class="btn" id="gPlay">▶ לשחק לוח ${esc(TNAME(g.play[0]))} ${LV[g.play[1]]}</button>` : ''}<button class="btn sec" id="gAll">לכל הטיפים</button></div>`;
    $('bk').onclick = () => route('guide'); $('gAll').onclick = () => route('guide');
    const pl = $('gPlay'); if (pl) pl.onclick = () => newGame(g.play[0], g.play[1]);
    setTimeout(() => { if (id === 'rules') rulesDemo(); else if (id === 'notes') notesDemo(); else stepDemo(g); }, 20);
  }
  function demoShell(n) { const bw = Math.min(bwFor(n), n === 9 ? 440 : 380); const d = $('demo'); if (!d) return null; d.style.setProperty('--bw', bw + 'px'); return d; }
  /* הדגמה מודרכת עם התנסות פעילה:
     דוגמה 1 – צופים בשלבי ההסבר (1–3), ואז התלמיד מבצע בעצמו את המהלך; דוגמאות נוספות – לבד, עם רמז לפי בקשה.
     משוב מיידי על כל לחיצה, והסבר מדויק במקרה של טעות */
  const UNIT_W = { r: 'שורה', c: 'עמודה', b: 'אזור' };
  function stepDemo(g, k) {
    k = k || 0;
    const d = $('demo'); if (!d) return;
    const ex = findExample(g, k);
    if (!ex) { d.innerHTML = k ? '<p class="muted">אין כרגע דוגמה נוספת. אפשר לשחק לוח – ולתרגל שם.</p>' : '<p class="muted">לא נמצאה דוגמה כרגע. נסו לשחק לוח – ולבקש רמז כשתגיעו למצב כזה.</p>'; return; }
    const { p, x } = ex, st = x.step, ctx = E.ctxOf(p.n, p.cages), S = E.newState(ctx, x.grid, x.known), L = C.ladder(ctx, S, st, p), n = p.n;
    const place = !!st.place, target = place ? [st.place[0]] : [...new Set(st.elim.map(e => e[0]))];
    const elimOf = {}; if (!place) st.elim.forEach(([i, m]) => { elimOf[i] = (elimOf[i] || 0) | m; });
    const pattern = new Set(st.cells || []);
    const guided = k === 0;
    let phase = guided ? 'watch' : 'try', lv = guided ? 0 : -1, sel = -1, tries = 0;
    const found = new Set(); let put = null;
    demoShell(n);
    const task = place ? 'עכשיו תורכם: לחצו על המשבצת שאפשר למלא בוודאות, ובחרו את המספר שחייב להיות בה.'
      : `עכשיו תורכם: לחצו על כל המשבצות שמהן אפשר למחוק מועמדים (${target.length === 1 ? 'משבצת אחת' : target.length + ' משבצות'}).`;
    d.innerHTML = `${guided ? '' : `<p style="text-align:center;margin:0"><b>דוגמה ${k + 1} – לבד.</b> <span class="muted">אותה דרך, בלוח אחר. אפשר לבקש רמז.</span></p>`}
      <div class="bdw" id="dbd"></div>
      <div class="hintp" style="width:var(--bw)"><div class="hh"><span id="dstep"></span></div><div class="ht" id="dtxt"></div><div id="dmsg" role="status" aria-live="polite"></div>
        <div class="pad" id="dpad" style="--pn:${n};width:100%;margin:8px 0" hidden role="group" aria-label="בחירת מספר">${Array.from({ length: n }, (_, j) => `<button data-d="${j + 1}">${j + 1}</button>`).join('')}</div>
        <div class="stepper" id="dbtns"></div></div>`;
    const bv = boardView($('dbd'), p, { interactive: true, onCell: tap });
    window.SDKAPP.demo = { place, target, step: st, grid: x.grid, n, elim: elimOf }; // לבדיקות אוטומטיות
    const msg = (t, kind) => { $('dmsg').innerHTML = t ? `<div class="msg ${kind}" style="width:100%;margin-top:6px;text-align:right">${B.eqWrap(esc(t))}</div>` : ''; };
    // מדוע ספרה e לא יכולה להיות במשבצת i (שכן עם אותה ספרה / הסקה קודמת)
    function why(i, e) {
      const j = ctx.peers[i].find(q => x.grid[q] === e);
      if (j !== undefined) { const gg = ctx.g; const w = gg.R[j] === gg.R[i] ? 'שורה' : gg.C[j] === gg.C[i] ? 'עמודה' : gg.B[j] === gg.B[i] ? 'אזור' : 'כלוב'; return `כבר יש ${e} באות${w === 'אזור' || w === 'כלוב' ? 'ו' : 'ה'} ${w} (מסומן בקו).`; }
      if (x.known[i] >> e & 1) return `${e} כבר נפסל במשבצת הזאת בהסקה קודמת.`;
      return null;
    }
    function hl() {
      let h;
      if (phase === 'watch') h = Object.assign({}, L[lv].hl);
      else if (lv >= 0) h = Object.assign({}, L[lv].hl);
      else h = place ? {} : { units: L[0].hl.units, cage: L[0].hl.cage, cand: L[1].hl.cand || L[2].hl.cand, on: L[1].hl.on, cells: L[1].hl.cells };
      delete h.put; delete h.elim;
      if (!place) { // משבצות שנמצאו – מחיקה מסומנת בקו
        if (!h.cand) h.cand = L[2].hl.cand || L[1].hl.cand;
        if (phase !== 'watch') { h.off = {}; found.forEach(i => { h.off[i] = elimOf[i]; }); if (phase === 'done') target.forEach(i => { h.off[i] = elimOf[i]; }); }
      }
      if (put) h.put = put;
      if (sel >= 0 && phase === 'try') h.cells = [...(h.cells || []), sel];
      return h;
    }
    function show() {
      bv.update({ grid: x.grid, notes: null, auto: false, sel: -1, hl: hl(), same: false });
      $('dpad').hidden = !(phase === 'try' && place && sel === target[0]);
      let btn = '';
      if (phase === 'watch') {
        $('dstep').textContent = `צופים: שלב ${lv + 1} מתוך 3`; $('dtxt').innerHTML = B.eqWrap(esc(L[lv].t));
        btn = `<button class="btn sec" id="dPrev" ${lv ? '' : 'disabled'}>‹ הקודם</button><button class="btn" id="dNext">${lv < 2 ? 'הבא ›' : 'עכשיו אני ›'}</button>`;
      } else if (phase === 'try') {
        $('dstep').textContent = guided ? '✋ תורכם' : `✋ דוגמה ${k + 1} – לבד`;
        $('dtxt').innerHTML = B.eqWrap(esc(lv >= 0 && !guided ? `רמז: ${L[lv].t}` : task));
        btn = `${lv < 2 ? `<button class="btn sec" id="dHint">💡 ${guided ? 'עוד הסבר' : 'רמז'}</button>` : ''}${tries >= 3 ? '<button class="btn ghost" id="dShow">הצגת הפתרון</button>' : ''}`;
      } else {
        $('dstep').textContent = '✓ הצלחתם!'; $('dtxt').innerHTML = B.eqWrap(esc(L[3].t));
        btn = `<button class="btn" id="dMore">▶ דוגמה נוספת – לבד</button>${k ? '<button class="btn sec" id="dAgain">⟲ מההתחלה</button>' : ''}`;
      }
      $('dbtns').innerHTML = btn;
      const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
      on('dPrev', () => { lv--; show(); });
      on('dNext', () => { if (lv < 2) lv++; else { phase = 'try'; msg(''); } show(); });
      on('dHint', () => { lv = Math.min(2, lv + 1); if (guided) msg(L[lv].t, 'info'); show(); });
      on('dShow', () => finish(false));
      on('dMore', () => stepDemo(g, k + 1));
      on('dAgain', () => stepDemo(g, 0));
    }
    function wrong(t) { tries++; if (tries === 2 && lv < 2) lv++; msg('✗ ' + t, 'info bad-msg'); show(); }
    function finish(byKid) {
      phase = 'done'; sel = -1; if (place) put = st.place;
      msg(byKid ? `✓ נכון! ${tries ? '' : 'בניסיון הראשון – מצוין!'}` : 'הנה הפתרון – נסו את הדוגמה הבאה לבד.', byKid ? 'ok' : 'info');
      show();
    }
    function tap(i) {
      if (phase !== 'try') return;
      if (x.grid[i]) return wrong('במשבצת הזאת כבר כתוב מספר. בחרו משבצת ריקה.');
      if (place) {
        const [ti, td] = st.place;
        if (i === ti) { sel = i; msg('איזה מספר חייב להיות כאן? בחרו מהמספרים למטה.', 'info'); show(); const b = $('dpad').querySelector('button'); if (b) b.focus(); return; }
        sel = -1;
        // הסבר מותאם לאסטרטגיה: למה דווקא לא המשבצת הזאת
        if (st.s === 'hiddenSingle') {
          const inUnit = ctx.units[st.unit].cells.includes(i), U2 = UNIT_W[ctx.units[st.unit].t];
          return wrong(inUnit ? `${td} לא יכול להיות במשבצת הזאת: ${why(i, td) || 'בדקו את השורה, העמודה והאזור שלה.'}` : `חפשו בתוך ה${U2} המודגש${U2 === 'אזור' ? '' : 'ת'}: איפה יכול להיות בה ${td}?`);
        }
        if (st.s === 'nakedSingle') { const m = S.c[i]; return wrong(`במשבצת הזאת עדיין אפשריים ${E.digs(m).join(', ')} – יותר מאפשרות אחת. חפשו משבצת שנשארה בה אפשרות אחת בלבד.`); }
        if (st.s === 'fullHouse') return wrong('חפשו שורה, עמודה או אזור שנשארה בהם רק משבצת ריקה אחת.');
        if (st.s === 'cageSingle') return wrong('חפשו כלוב שנשארה בו רק משבצת ריקה אחת – או כלוב של משבצת אחת.');
        return wrong('זו לא המשבצת. היעזרו בהסבר או ברמז.');
      }
      // הדגמה של מחיקת מועמדים
      if (found.has(i)) { msg('את המשבצת הזאת כבר מצאתם. חפשו עוד.', 'info'); return; }
      if (elimOf[i]) {
        found.add(i);
        if (found.size === target.length) return finish(true);
        msg(`✓ נכון! מכאן נמחק ${E.digs(elimOf[i]).join(', ')}. ${target.length - found.size === 1 ? 'נשארה עוד משבצת אחת.' : `נשארו עוד ${target.length - found.size}.`}`, 'ok'); show(); return;
      }
      if (pattern.has(i)) return wrong('זו אחת המשבצות של הדפוס עצמו – ממנה לא מוחקים. מוחקים ממשבצות אחרות שהדפוס "רואה".');
      const ds = st.digit ? [st.digit] : st.digits || [];
      if (st.cage != null && st.s === 'cageCombo') return wrong(ctx.cages[st.cage].cells.includes(i) ? 'כל המועמדים במשבצת הזאת מתאימים לאחד הצירופים – אין מה למחוק.' : 'המשבצת הזאת לא בכלוב המודגש.');
      if (ds.length && !ds.some(e => S.c[i] >> e & 1)) return wrong(`אין במשבצת הזאת את ${ds.join(' או ')} בכלל – אין מה למחוק.`);
      return wrong('מהמשבצת הזאת אי אפשר למחוק לפי הדפוס הזה: היא לא באותה שורה, עמודה או אזור שהדפוס "תופס".');
    }
    $('dpad').onclick = e => {
      const b = e.target.closest('button'); if (!b || phase !== 'try') return;
      const e2 = +b.dataset.d, [ti, td] = st.place;
      if (e2 === td) return finish(true);
      if (st.s === 'cageSingle') { const cg = ctx.cages[st.cage], have = cg.cells.filter(q => x.grid[q]).map(q => x.grid[q]), s2 = have.reduce((a, c) => a + c, 0); return wrong(have.length ? `בדקו את החשבון: הסכום ${cg.sum}, וכבר כתוב ${have.join(' + ')}. כמה חסר עד ${cg.sum}?` : `בכלוב של משבצת אחת המספר הוא הסכום עצמו: ${cg.sum}.`); }
      const r = why(ti, e2);
      if (r) return wrong(`${e2} לא יכול להיות כאן: ${r}`);
      if (st.s === 'hiddenSingle') return wrong(`${e2} לא שובר כלל כאן – אבל לא בטוח שהוא שם. שאלנו: איפה ב${UNIT_W[ctx.units[st.unit].t]} יכול להיות ${td}?`);
      return wrong(`${e2} לא מתאים כאן. בדקו שוב את השורה, העמודה והאזור.`);
    };
    show();
  }
  function rulesDemo() {
    const d = $('demo'); if (!d) return;
    const sol = E.randomSolution(4, E.rng('rules-demo')), p = { n: 4, givens: sol.slice(), solution: sol, cages: null };
    // טעות אחת: מחליפים מספר במספר שכבר קיים באותה שורה
    const bad = 5, wrongD = sol[6]; const grid = sol.slice(); grid[bad] = wrongD;
    p.givens = grid.map((v, i) => i === bad || i === 6 ? 0 : v);
    demoShell(4);
    d.innerHTML = `<p style="text-align:center"><b>נסו:</b> בלוח הזה יש טעות אחת. לחצו על משבצת שיש בה טעות.</p><div class="bdw" id="dbd"></div><div id="rmsg" class="msg info" role="status" style="width:var(--bw)">כל מספר – פעם אחת בשורה, בעמודה ובאזור.</div>`;
    let hl = {};
    const bv = boardView($('dbd'), p, { interactive: true, onCell: i => {
      const g = E.geo(4);
      if (i === bad || i === 6) { hl = { units: [g.R[bad]], cells: [bad, 6] }; $('rmsg').className = 'msg ok'; $('rmsg').textContent = `נכון! בשורה הזאת המספר ${wrongD} מופיע פעמיים. במקום אחד מהם צריך להיות ${sol[bad]}.`; }
      else { hl = { cells: [i] }; $('rmsg').className = 'msg info'; $('rmsg').textContent = 'במשבצת הזאת הכול בסדר. בדקו כל שורה: האם יש מספר שחוזר?'; }
      bv.update({ grid, sel: -1, hl, same: false });
    } });
    bv.update({ grid, sel: -1, hl, same: false });
  }
  function notesDemo() {
    const d = $('demo'); if (!d) return;
    const p = E.generateSafe('6', 2, 'notes-demo'); if (!p) return;
    demoShell(6);
    d.innerHTML = `<p style="text-align:center"><b>נסו:</b> כך נראים סימונים – בכל משבצת ריקה, המספרים שעוד אפשריים בה. לחצו על משבצת שנשאר בה רק מספר אחד.</p><div class="bdw" id="dbd"></div><div id="nmsg" class="msg info" role="status" style="width:var(--bw)">איפה יש רק מספר אחד קטן?</div>`;
    const grid = p.givens.slice(), cx6 = E.ctxOf(6); let S = E.newState(cx6, grid);
    const singles = () => S.c.filter(m => m && E.pc(m) === 1).length;
    const bv = boardView($('dbd'), p, { interactive: true, onCell: i => {
      const m = $('nmsg');
      if (grid[i]) { m.className = 'msg info'; m.textContent = 'במשבצת הזאת כבר כתוב מספר. בחרו משבצת עם מספרים קטנים.'; return; }
      if (E.pc(S.c[i]) === 1) { const d2 = E.low(S.c[i]); grid[i] = d2; S = E.newState(cx6, grid); m.className = 'msg ok'; m.textContent = `✓ נכון! נשאר רק ${d2} – אז כותבים אותו. ${grid.every(v => v) ? 'פתרתם את כל הלוח!' : singles() ? 'שימו לב: אחרי שכתבתם, נמחק ' + d2 + ' מהשכנות. מצאו עוד משבצת עם מספר אחד.' : ''}`; }
      else { m.className = 'msg info'; m.textContent = `✗ כאן עדיין אפשריים ${E.digs(S.c[i]).join(', ')} – יותר ממספר אחד, ולכן עוד אי אפשר להחליט.`; }
      bv.update({ grid, auto: true, sel: -1, hl: { cells: [i] }, same: false });
    } });
    bv.update({ grid, auto: true, sel: -1, hl: {}, same: false });
  }

  /* ---------- ההתקדמות שלי ---------- */
  function progressScreen() {
    const next = PATH.find(p => !p.ok(ST));
    const strat = Object.keys(C.NAME).filter((s, i, a) => a.findIndex(t => C.NAME[t] === C.NAME[s]) === i);
    const got = strat.filter(s => ST.strat[s] > 0 || (s === 'lockedPointing' && ST.strat.lockedClaiming > 0));
    const todo = strat.filter(s => !got.includes(s) && (ST.ask[s] > 0 || (s === 'lockedPointing' && ST.ask.lockedClaiming > 0)));
    const types = ['4', '6', '9', 'k4', 'k6', 'k9'];
    app.innerHTML = `<button class="back" id="bk">→ למרכז הסודוקו</button><h1>🏅 ההתקדמות שלי</h1>
      <p class="muted small">ההתקדמות נשמרת רק במכשיר הזה. "לבד" = פתרון בלי רמזים.</p>
      <div class="card"><h2>המסלול שלי</h2><ul class="path">${PATH.map(p => { const ok = p.ok(ST), nx = p === next; return `<li class="${ok ? 'done' : ''}${nx ? ' next' : ''}"><span class="ck" aria-hidden="true">${ok ? '✓' : ''}</span><span class="pt">${esc(p.n)}<span class="sr">${ok ? ' – הושלם' : ''}</span></span>${nx ? '<button class="btn" data-go="1">השלב הבא ›</button>' : ''}</li>`; }).join('')}</ul>
        ${next ? '' : '<p>השלמתם את כל המסלול! 🌟 אפשר להמשיך לשחק בכל רמה, ובאתגר היומי.</p>'}</div>
      <div class="card"><h2>מדליות</h2><div class="medals">${MEDALS.map(m => { const on = ST.medals[m.id]; return `<div class="medal${on ? '' : ' off'}"><div class="mi" aria-hidden="true">${m.i}</div><div class="mn">${esc(m.n)}</div><div class="md">${on ? '✓ ' + on.split('-').reverse().join('.') : esc(m.d)}</div></div>`; }).join('')}</div></div>
      <div class="card"><h2>אסטרטגיות</h2>
        <p class="small muted">אסטרטגיה "נרכשה" כשפתרתם לבד לוח שצריך אותה.</p>
        <p><b>כבר יודעים:</b> ${got.length ? `<span class="chips">${got.map(s => `<span class="chip ok">✓ ${esc(C.NAME[s])}</span>`).join('')}</span>` : '<span class="muted">עוד לא – זה יבוא עם הלוחות הראשונים.</span>'}</p>
        ${todo.length ? `<p><b>כדאי לתרגל עוד:</b> <span class="chips">${todo.map(s => `<span class="chip todo">${esc(C.NAME[s])}</span>`).join('')}</span></p>` : ''}</div>
      <div class="card"><h2>כמה לוחות פתרתי</h2><table class="st"><thead><tr><th>סוג</th>${E.LEVELS.map(l => `<th>${LV[l]}</th>`).join('')}</tr></thead><tbody>${types.map(t => `<tr><td>${esc(TNAME(t))}</td>${E.LEVELS.map(l => E.supported(t, l) ? `<td>${ST.solved[t + '-' + l] || 0}${ST.indep[t + '-' + l] ? ` <span class="small muted">(לבד ${ST.indep[t + '-' + l]})</span>` : ''}</td>` : '<td class="muted">—</td>').join('')}</tr>`).join('')}</tbody></table></div>`;
    $('bk').onclick = () => route('home');
    const b = app.querySelector('[data-go]'); if (b) b.onclick = () => next.go();
  }

  /* ---------- הודעה קצרה ---------- */
  function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }

  /* ---------- כניסה ---------- */
  window.SDKAPP = { newGame, route, get G() { return G; }, ST: () => ST, openDaily, guideCard };
  const pid = URLP.get('p');
  if (pid && E.parseId(pid)) { push('home'); openById(pid); }
  else if (URLP.has('teacher') || location.hash === '#teach') route('teach');
  else route('home');
})();
