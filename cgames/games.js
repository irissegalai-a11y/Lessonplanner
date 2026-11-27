/* =========================================================
   משחקי כיתה (אזור המורה → משחק לכל הכיתה) – נטען אחרי הסקריפט הראשי של math6
   ניהול קבוצות משותף (TM) · פיצוחים · בלשי הטעויות · בינגו (הרחבה) · כמה זה בערך? · מספר המטרה · מה לא שייך? · דומינו
   משתמש בפונקציות של האתר: app, $, ic, esc, M, F, fmt, TOPIC, GRADE, mk, lvGen, solHTML, chLet, chPics, navPush, home...
   ========================================================= */
(function () {
  if (typeof app === 'undefined' || typeof CG === 'undefined') return;
  const YOUNG = GRADE <= 2;
  const LET = 'אבגדהו';

  /* ---------------- ניהול קבוצות משותף ---------------- */
  // מצב המשחק הפעיל: cg = { game, mode: 'simple'|'full', teams:[{name,color,score,st}], turn, ... }
  let cg = null, cgStack = [];
  const CG_KEY = g => `cg-${g}-g${GRADE}`;
  const RENDER = {};
  const cgSave = () => { try { localStorage.setItem(CG_KEY(cg.game), JSON.stringify(cg)); } catch (e) { /* לא חובה */ } };
  const cgLoad = g => { try { const x = JSON.parse(localStorage.getItem(CG_KEY(g))); return x && x.game === g && !x.over ? x : null; } catch (e) { return null; } };
  const cgClear = g => { try { localStorage.removeItem(CG_KEY(g)); } catch (e) { /* לא חובה */ } };
  // לפני כל פעולה שמשנה את המשחק – צילום מצב (לביטול)
  const cgPush = () => { cgStack.push(JSON.stringify(cg)); if (cgStack.length > 40) cgStack.shift(); };
  const cgUndo = () => { if (!cgStack.length) return; cg = JSON.parse(cgStack.pop()); cgSave(); document.querySelectorAll('.overlay').forEach(o => o.remove()); RENDER[cg.game](); };
  const FULL = () => cg && cg.mode === 'full';
  const ST_NAMES = { ok: ['✓', 'תשובות נכונות'], reason: ['💬', 'הנמקות'], creative: ['💡', 'רעיונות מקוריים'], recover: ['🔁', 'התאוששות'], found: ['🔍', 'טעויות שאותרו'], fixed: ['🔧', 'תיקונים'], streak: ['🏅', 'רצף של 3'], cells: ['⬢', 'משושים'], cracks: ['🔨', 'פיצוחים'], ways: ['🛤️', 'דרכים שונות'], close: ['🎯', 'אומדנים מדויקים'], trapSeen: ['🪤', 'מלכודות שזוהו'] };
  const stAdd = (i, k, n = 1) => { const t = cg.teams[i]; t.st = t.st || {}; t.st[k] = (t.st[k] || 0) + n; };
  // נקודות לקבוצה (עם צילום מצב לביטול). kind – לסטטיסטיקה של מסך הסיום
  function tmAdd(i, pts, kind, noPush) { if (!noPush) cgPush(); cg.teams[i].score += pts; if (kind) stAdd(i, kind, pts > 0 ? 1 : -1); cgSave(); }
  const tmNext = () => { cg.turn = (cg.turn + 1) % cg.teams.length; };
  // לוח הניקוד: שם (לחיצה = תור), ניקוד, +/−, ⭐ הנמקה, סידור תורות, ביטול
  function tmBar(o = {}) {
    const ro = cg.reorder;
    return `<div class="jeo-score cg-score">${cg.teams.map((t, i) => `<div class="jeo-team${o.noTurn ? '' : i === cg.turn ? ' on' : ''}" style="--tc:${t.color}">
      ${ro ? `<span class="cg-ro"><button class="ghost" data-ro="${i}" data-d="-1" aria-label="להקדים" ${i ? '' : 'disabled'}>▶</button><button class="ghost" data-ro="${i}" data-d="1" aria-label="לאחר" ${i < cg.teams.length - 1 ? '' : 'disabled'}>◀</button></span>` : ''}
      <span class="jt-nm" data-turn="${i}" title="לחיצה – התור עובר לקבוצה">${esc(t.name)}</span><b data-raw>${o.val ? o.val(t, i) : t.score}</b>${o.sub ? `<span class="cg-sub">${o.sub(t, i)}</span>` : ''}
      ${o.noScore ? '' : `<span class="jt-adj"><button class="ghost" data-adj="${i}" data-d="-1" aria-label="הורדת נקודה">−</button><button class="ghost" data-adj="${i}" data-d="1" aria-label="הוספת נקודה">+</button><button class="ghost cg-rs" data-rs="${i}" title="נקודה על הנמקה או דרך פתרון">⭐ הנמקה</button></span>`}
    </div>`).join('')}</div>
    <div class="cg-tools">${o.noTurn ? '' : `<span class="muted small">לחיצה על שם – התור עובר לקבוצה.</span> <button class="ghost small" id="cgRo">${ro ? '✓ סיום סידור' : '⇄ סדר התורות'}</button>`}<button class="ghost small" id="cgUndo" ${cgStack.length ? '' : 'disabled'}>↶ ביטול הפעולה האחרונה</button>${o.noScore ? `<button class="ghost small" id="cgRs">⭐ הנמקה</button>` : ''}</div>`;
  }
  function tmBind(rerender, o = {}) {
    app.querySelectorAll('[data-turn]').forEach(n => n.onclick = () => { if (o.noTurn) return; cgPush(); cg.turn = Number(n.dataset.turn); cgSave(); rerender(); });
    app.querySelectorAll('[data-adj]').forEach(b => b.onclick = () => { tmAdd(Number(b.dataset.adj), Number(b.dataset.d), null); rerender(); });
    app.querySelectorAll('[data-rs]').forEach(b => b.onclick = () => { tmAdd(Number(b.dataset.rs), o.rsPts || 1, 'reason'); rerender(); });
    app.querySelectorAll('[data-ro]').forEach(b => b.onclick = () => { cgPush(); const i = Number(b.dataset.ro), j = i + Number(b.dataset.d), cur = cg.teams[cg.turn]; [cg.teams[i], cg.teams[j]] = [cg.teams[j], cg.teams[i]]; if (o.onSwap) o.onSwap(i, j); cg.turn = cg.teams.indexOf(cur); cgSave(); rerender(); });
    if ($('cgRo')) $('cgRo').onclick = () => { cg.reorder = !cg.reorder; rerender(); };
    if ($('cgUndo')) $('cgUndo').onclick = cgUndo;
    if ($('cgRs')) $('cgRs').onclick = () => { const ov = cgModal(`<h3>⭐ נקודת הנמקה</h3><p>איזו קבוצה הסבירה יפה את הדרך?</p><div class="jeo-award">${cg.teams.map((t, i) => `<button data-rq="${i}" style="--tc:${t.color}">${esc(t.name)}</button>`).join('')}</div><div class="actions" style="justify-content:center"><button class="ghost" data-x>סגירה</button></div>`); ov.querySelectorAll('[data-rq]').forEach(b => b.onclick = () => { cgPush(); stAdd(Number(b.dataset.rq), 'reason'); cg.teams[Number(b.dataset.rq)].bonus = (cg.teams[Number(b.dataset.rq)].bonus || 0) + 1; cgSave(); ov.remove(); rerender(); }); };
  }
  function cgModal(html, cls = '') {
    const ov = document.createElement('div'); ov.className = 'overlay jeo-ov';
    ov.innerHTML = `<div class="modal jeo-q ${cls}" role="dialog">${html}</div>`; document.body.appendChild(ov);
    ov.querySelectorAll('[data-x]').forEach(b => b.onclick = () => ov.remove());
    return ov;
  }
  const topbar = (icon, title, extra = '') => `<div class="topbar"><span class="title">${icon} ${title}</span><span class="toollinks">${extra}${fsBtnHTML()}<button class="secondary" id="cgExit">${ic('close')} יציאה</button></span></div>`;
  const bindTop = () => { fsBind(); if ($('cgExit')) $('cgExit').onclick = () => { if (!cg || cg.over || confirm('לצאת מהמשחק? המשחק נשמר, ואפשר להמשיך אחר כך.')) classSub('games'); }; };
  const modeName = m => m === 'full' ? 'משחק מלא' : 'משחק פשוט';

  // מסך פתיחה משותף: כמה קבוצות, שמות, משחק פשוט / מלא, הגדרות המשחק, המשך משחק שמור
  function cgSetup(o) {
    stopRace(); stopMemory(); stopJeoTimer(); state = null; lessonView = null; navPush('cls');
    const saved = cgLoad(o.game), names = JEO_TEAMS.map(t => t.name);
    let n = o.counts.includes(o.n || 2) ? (o.n || 2) : o.counts[0], mode = o.mode || 'full';
    const draw = () => {
      app.innerHTML = `${topbar(o.icon, o.title)}
        <div class="card race-intro"><p class="race-how">${o.how}</p>
          ${saved ? `<div class="jeo-resume"><span>יש משחק שלא הסתיים (${saved.teams.map(t => `${esc(t.name)} ${o.savedVal ? o.savedVal(saved, t) : t.score}`).join(' · ')})</span><button id="cgResume">להמשיך את המשחק ←</button></div>` : ''}</div>
        <h2>כמה קבוצות?</h2>
        <div class="name-row" style="justify-content:center"><span class="seg">${o.counts.map(k => `<button data-n="${k}" class="${k === n ? 'sel' : ''}">${k}</button>`).join('')}</span></div>
        <div class="jeo-teams">${JEO_TEAMS.slice(0, n).map((t, i) => `<label class="jeo-tname" style="--tc:${t.color}"><span class="jdot"></span><input data-tn="${i}" value="${esc(names[i])}" maxlength="16" aria-label="שם קבוצה ${i + 1}"></label>`).join('')}</div>
        <h2>איך משחקים?</h2>
        <div class="cg-modes">
          <button class="cg-mode${mode === 'simple' ? ' sel' : ''}" data-mode="simple"><b>משחק פשוט</b><span>${o.simple}</span></button>
          <button class="cg-mode${mode === 'full' ? ' sel' : ''}" data-mode="full"><b>משחק מלא</b><span>${o.full}</span></button>
        </div>
        <div id="cgOpts">${o.opts ? o.opts() : ''}</div>
        <p class="muted small center" id="cgMsg"></p>
        <div class="actions" style="justify-content:center"><button id="cgGo" class="race-go">${saved ? 'משחק חדש' : 'מתחילים!'} ←</button></div>`;
      bindTop();
      $('cgExit').onclick = () => classSub('games');
      const keep = () => app.querySelectorAll('[data-tn]').forEach(inp => { names[Number(inp.dataset.tn)] = inp.value.trim() || JEO_TEAMS[Number(inp.dataset.tn)].name; });
      app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { keep(); n = Number(b.dataset.n); draw(); });
      app.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { keep(); mode = b.dataset.mode; app.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('sel', x === b)); });
      if (o.bind) o.bind();
      if ($('cgResume')) $('cgResume').onclick = () => { cg = saved; cgStack = []; RENDER[o.game](); };
      $('cgGo').onclick = () => {
        keep();
        const teams = names.slice(0, n).map((nm, i) => ({ name: nm, color: JEO_TEAMS[i].color, score: 0, st: {} }));
        const err = o.start(teams, mode);
        if (err) { $('cgMsg').textContent = err; return; }
      };
    };
    draw(); window.scrollTo(0, 0);
  }
  const cgBegin = (game, teams, mode, extra) => { cg = Object.assign({ game, mode, teams, turn: 0 }, extra); cgStack = []; cgSave(); RENDER[game](); };
  // צ'יפים לבחירה
  const chips = (attr, list, cur, multi) => `<span class="seg cg-seg">${list.map(([v, t]) => `<button data-${attr}="${v}" class="${(multi ? cur.includes(v) : cur === v) ? 'sel' : ''}">${t}</button>`).join('')}</span>`;
  const bindChips = (attr, multi, set) => app.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => {
    if (multi) { b.classList.toggle('sel'); if (!app.querySelector(`[data-${attr}].sel`)) b.classList.add('sel'); }
    else app.querySelectorAll(`[data-${attr}]`).forEach(x => x.classList.toggle('sel', x === b));
    set([...app.querySelectorAll(`[data-${attr}].sel`)].map(x => x.dataset[attr]));
  });

  // מסך סיום: דירוג + הישגים של כל קבוצה (בלי "מקום אחרון")
  function tmEnd(icon, title, o = {}) {
    cg.over = true; cgSave(); cgClear(cg.game);
    const val = o.val || (t => t.score), ranked = cg.teams.map((t, i) => ({ t, i, v: val(t, i) })).sort((a, b) => b.v - a.v || (b.t.bonus || 0) - (a.t.bonus || 0));
    const top = ranked[0].v, win = ranked.filter(r => r.v === top);
    const ach = t => Object.entries(t.st || {}).filter(([k, v]) => v > 0 && ST_NAMES[k]).map(([k, v]) => `<span class="cg-ach">${ST_NAMES[k][0]} ${v} ${ST_NAMES[k][1]}</span>`).join('');
    app.innerHTML = `${topbar(icon, title)}
      <div class="card center race-end rec">
        ${o.banner || ''}
        <h2>${win.length > 1 ? 'תיקו!' : 'המנצחים:'}</h2>
        <div class="jeo-win">${win.map(r => `<span style="--tc:${r.t.color}">${esc(r.t.name)}</span>`).join(' ')}</div>
        <div class="cg-endlist">${ranked.map(r => `<div class="cg-endrow" style="--tc:${r.t.color}"><span class="jdot"></span><b>${esc(r.t.name)}</b><span class="cg-endv" data-raw>${o.show ? o.show(r.t, r.i) : r.v}</span><div class="cg-achs">${ach(r.t) || '<span class="cg-ach">💪 השתתפו עד הסוף</span>'}</div></div>`).join('')}</div>
        ${o.class ? `<p class="cg-classwin">${o.class}</p>` : ''}
        <p class="compare">כל הכבוד לכל הקבוצות – כל אחת תרמה למשחק!</p>
        <div class="actions" style="justify-content:center"><button id="cgUndoEnd" class="secondary">↶ חזרה למשחק</button><button id="cgNew">משחק חדש ←</button></div>
      </div>`;
    bindTop();
    $('cgUndoEnd').onclick = () => { cg.over = false; cgSave(); RENDER[cg.game](); };
    $('cgNew').onclick = () => o.again();
  }

  // שאלה מנושא באתר (כמו בג'פרדי) – לפיצוחים
  function siteQ(topics, lv, seen) {
    for (let g = 0; g < 40; g++) { const tid = pick(topics), T = TOPIC[tid]; if (!T) continue; const L = T.levels[lv] || T.levels[1]; if (!L || !L.length) continue; let q; try { q = mk(tid, lvGen(T, lv), lv); } catch (e) { continue; } const k = qKey(q); if (seen && seen.has(k) && g < 30) continue; if (seen) seen.add(k); return { type: q.type, text: q.text, fig: q.fig || '', choices: q.choices || null, ans: q.ans, unit: q.unit || '', exp: q.exp || '', form: q.form || null, topic: tid, lv }; }
    return null;
  }
  const qHTML = q => `<div class="jeo-qtext">${q.text}</div>${q.fig || ''}${q.type === 'choice' ? `<ol class="jeo-choices${chPics(q.choices) ? ' pics' : ''}">${q.choices.map((c, i) => `<li>${chLet(i)} <span>${c}</span></li>`).join('')}</ol>` : ''}`;

  // חלון הדפסה עצמאי (לוחות בינגו, ערכות דומינו)
  function printWin(title, body, css) {
    const w = window.open('', '_blank'); if (!w) { alert('הדפדפן חסם חלון חדש. אפשרו חלונות קופצים לאתר ונסו שוב.'); return; }
    w.document.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>
      @page { size: A4; margin: 10mm; } * { box-sizing: border-box; } body { font-family: Assistant, Arial, sans-serif; color: #000; margin: 0; }
      .m { direction: ltr; unicode-bidi: isolate; white-space: nowrap; display: inline-block; }
      .fr { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 .15em; line-height: 1.1; font-size: .95em; } .fr > span:first-child { border-bottom: 1.5px solid currentColor; padding: 0 .2em; }
      .pg { page-break-after: always; break-after: page; } .pg:last-child { page-break-after: auto; break-after: auto; }
      h1 { font-size: 18pt; margin: 0 0 4mm; } h2 { font-size: 14pt; margin: 3mm 0; } .small { font-size: 9pt; color: #333; }
      .bar { padding: 8px; background: #fff5d6; border-bottom: 1px solid #999; text-align: center; } .bar button { font-size: 16px; padding: 6px 18px; }
      @media print { .bar { display: none; } }
      ${css}</style></head><body><div class="bar"><button onclick="print()">🖨️ הדפסה</button></div>${body}<div class="small" style="text-align:center;margin-top:4mm">mathinclass</div></body></html>`);
    w.document.close();
  }

  /* =========================================================
     פיצוחים – לוח משושים. כובשים משושה בתשובה נכונה ובונים מסלול רציף מהצד שלכם לצד שמול.
     2 קבוצות: ימין↔שמאל מול למעלה↔למטה. 4 קבוצות: כל קבוצה מצד אחר, אל הצד שמולה.
     משחק מלא: משושים במרכז קשים יותר (💎), ⭐ נותן "פטיש פיצוח", פיצוח = כיבוש משושה של קבוצה אחרת בשאלת אתגר;
     פיצוח שנכשל – המשושה מוגן 🛡️. קבוצה שנחסמה תמיד יכולה לפצח. "רוח גבית" – פטיש לקבוצה שמפגרת.
     ========================================================= */
  const HX_SIDES = ['ימין', 'למעלה', 'שמאל', 'למטה'], HX_FROM = ['מימין', 'מלמעלה', 'משמאל', 'מלמטה'], HX_TO = ['שמאלה', 'למטה', 'ימינה', 'למעלה']; // קבוצה k – הבית שלה (ויעד: הצד שמול)
  const hxCrack = () => FULL() && !YOUNG;
  function hxHome() {
    let size = 'm', topics = null;
    cgSetup({ game: 'hx', icon: '⬢', title: 'פיצוחים', counts: [2, 4], n: 2,
      how: 'לוח משושים על הלוח. בכל תור הקבוצה בוחרת משושה ועונה על שאלה – תשובה נכונה כובשת אותו. <b>המטרה: מסלול רציף מהצד שלכם עד הצד שמולכם.</b> אפשר לחסום את המסלול של קבוצה אחרת – וגם לפצח את החסימה.',
      simple: 'כל המשושים באותה רמה. כובשים, חוסמים ומתחברים – בלי כלים מיוחדים.',
      full: YOUNG ? 'משושים קלים בשוליים וקשים במרכז. ⭐ משושה כוכב = תור נוסף.' : 'משושים קלים בשוליים וקשים 💎 במרכז. ⭐ נותן פטיש פיצוח: כובשים משושה של קבוצה אחרת בשאלת אתגר. קבוצה שמפגרת מקבלת "רוח גבית".',
      savedVal: (s, t) => `${s.own.filter(x => x === s.teams.indexOf(t)).length} ⬢`,
      opts: () => `<h2>גודל הלוח</h2><div class="name-row" style="justify-content:center">${chips('hs', [['s', 'קטן – משחק קצר'], ['m', 'בינוני'], ['l', 'גדול']], size)}</div>
        <h2>נושאי השאלות</h2>${topicChecks('hxt')}`,
      bind: () => { bindChips('hs', false, v => { size = v[0]; }); },
      start: (teams, mode) => {
        topics = [...app.querySelectorAll('[data-hxt]:checked')].map(c => c.dataset.hxt);
        if (!topics.length) return 'בחרו לפחות נושא אחד.';
        const n = (teams.length === 2 ? { s: 5, m: 6, l: 7 } : { s: 6, m: 7, l: 8 })[size] - (YOUNG && size === 'l' ? 1 : 0);
        cgBegin('hx', teams, mode, hxNew(n, teams.length, mode, topics));
      } });
  }
  function hxNew(n, k, mode, topics) {
    const N = n * n, lv = Array(N).fill(1), c0 = (n - 1) / 2;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const dq = c - c0, dr = r - c0, d = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; lv[r * n + c] = mode === 'simple' ? 2 : d <= n * 0.22 ? 3 : d <= n * 0.48 ? 2 : 1; }
    // כוכבים – במיקומים סימטריים (הוגן לכל הקבוצות): (r,c), (c,r), והסיבובים שלהם
    const star = [];
    if (mode === 'full') { const orb = (r, c) => [[r, c], [c, r], [n - 1 - r, n - 1 - c], [n - 1 - c, n - 1 - r]].map(([a, b]) => a * n + b);
      const cand = []; for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) if (lv[r * n + c] === 2) cand.push([r, c]);
      shuffle(cand).slice(0, k === 4 ? 2 : 1).forEach(([r, c]) => orb(r, c).forEach(i => { if (!star.includes(i)) star.push(i); })); }
    return { n, own: Array(N).fill(-1), lv, star, shield: [], tok: Array(k).fill(hxCrackOn(mode) ? 1 : 0), topics, seen: [], log: [], side: k === 2 ? [0, 1] : [0, 1, 2, 3], round: 0 };
  }
  const hxCrackOn = mode => mode === 'full' && !YOUNG;
  const hxNb = (i, n) => { const r = Math.floor(i / n), c = i % n, o = []; [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, -1]].forEach(([dr, dc]) => { const a = r + dr, b = c + dc; if (a >= 0 && b >= 0 && a < n && b < n) o.push(a * n + b); }); return o; };
  // בית/יעד לפי צד: 0 ימין (עמודה 0) → שמאל, 1 למעלה (שורה 0) → למטה, 2 שמאל → ימין, 3 למטה → למעלה
  const hxIsHome = (i, n, s) => { const r = Math.floor(i / n), c = i % n; return s === 0 ? c === 0 : s === 1 ? r === 0 : s === 2 ? c === n - 1 : r === n - 1; };
  const hxIsGoal = (i, n, s) => hxIsHome(i, n, (s + 2) % 4);
  const hxDepth = (i, n, s) => { const r = Math.floor(i / n), c = i % n; return s === 0 ? c : s === 1 ? r : s === 2 ? n - 1 - c : n - 1 - r; };
  // BFS: אפשר ללכת על תאים שהפונקציה ok מאשרת, מהבית ליעד
  function hxReach(H, t, ok) {
    const n = H.n, s = H.side[t], seen = new Set(), q = [];
    for (let i = 0; i < n * n; i++) if (hxIsHome(i, n, s) && ok(i)) { seen.add(i); q.push(i); }
    while (q.length) { const i = q.shift(); if (hxIsGoal(i, n, s)) return true; hxNb(i, n).forEach(j => { if (!seen.has(j) && ok(j)) { seen.add(j); q.push(j); } }); }
    return false;
  }
  const hxWon = (H, t) => hxReach(H, t, i => H.own[i] === t);
  // מצב המסלול: open – יש דרך דרך משושים פנויים; crack – רק בעזרת פיצוח; blocked
  function hxPath(H, t) {
    if (hxReach(H, t, i => H.own[i] === t || H.own[i] < 0)) return 'open';
    if (hxCrackOn(cg.mode) && hxReach(H, t, i => H.own[i] === t || H.own[i] < 0 || !H.shield.includes(i))) return 'crack';
    return 'blocked';
  }
  // התקדמות: הכי רחוק מהבית שהקבוצה הגיעה, ברצף שמתחיל בבית
  function hxProgress(H, t) {
    const n = H.n, s = H.side[t], seen = new Set(), q = []; let best = 0;
    for (let i = 0; i < n * n; i++) if (hxIsHome(i, n, s) && H.own[i] === t) { seen.add(i); q.push(i); }
    while (q.length) { const i = q.shift(); best = Math.max(best, hxDepth(i, n, s) + 1); hxNb(i, n).forEach(j => { if (!seen.has(j) && H.own[j] === t) { seen.add(j); q.push(j); } }); }
    return best;
  }
  const hxCells = (H, t) => H.own.filter(x => x === t).length;
  function hxSVG(H, clickable) {
    const n = H.n, R0 = 30, w = Math.sqrt(3) * R0, hgt = 1.5 * R0;
    // עמודה 0 מימין (RTL): x יורד עם העמודה; כל שורה זזה חצי משושה
    const X = (r, c) => (n - 1 - c) * w + (n - 1 - r) * w / 2 + w / 2 + 62, Y = r => r * hgt + R0 + 66;
    const W = (n - 1) * w + (n - 1) * w / 2 + w + 124, Hh = (n - 1) * hgt + 2 * R0 + 132;
    const poly = (x, y, rr) => [0, 1, 2, 3, 4, 5].map(k => { const a = Math.PI / 180 * (60 * k - 30); return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
    let s = '';
    // קווי הבית (מלא) והיעד (מקווקו) בצבע הקבוצה
    const edge = (side) => { const pts = []; for (let k = 0; k < n; k++) { const [r, c] = side === 0 ? [k, 0] : side === 1 ? [0, k] : side === 2 ? [k, n - 1] : [n - 1, k]; pts.push([X(r, c), Y(r)]); } return pts; };
    const off = (pts, side, f) => { const dx = side === 0 ? w * f : side === 2 ? -w * f : 0, dy = side === 1 ? -R0 * f * 1.65 : side === 3 ? R0 * f * 1.65 : 0; return pts.map(([x, y]) => `${(x + dx).toFixed(1)},${(y + dy).toFixed(1)}`).join(' '); };
    // בית = קו מלא צמוד ללוח; יעד = קו מקווקו (כשבאותו צד יש גם בית של קבוצה אחרת – מחוץ לקו הבית)
    H.side.forEach((sd, t) => {
      const gs = (sd + 2) % 4, taken = H.side.includes(gs);
      s += `<polyline points="${off(edge(sd), sd, 0.75)}" fill="none" stroke="${cg.teams[t].color}" stroke-width="9" stroke-linecap="round"/>`;
      s += `<polyline points="${off(edge(gs), gs, taken ? 1.2 : 0.75)}" fill="none" stroke="${cg.teams[t].color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 9"/>`;
    });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c, o = H.own[i], x = X(r, c), y = Y(r), lv = H.lv[i];
      const fill = o >= 0 ? cg.teams[o].color : lv === 3 ? '#efe3c4' : lv === 2 ? '#f6efdc' : '#fffdf8';
      s += `<g class="hx-c${o < 0 ? ' free' : ''}" data-hx="${i}" ${clickable ? 'role="button" tabindex="0"' : ''} aria-label="משושה ${r + 1}-${c + 1}"><polygon points="${poly(x, y, R0 - 1.5)}" fill="${fill}" stroke="#1f1e1c" stroke-width="2"/>`;
      if (o < 0 && cg.mode === 'full' && lv === 3) s += `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20">💎</text>`;
      if (H.star.includes(i) && o < 0) s += `<text x="${x}" y="${y + 8}" text-anchor="middle" font-size="22">⭐</text>`;
      if (H.shield.includes(i)) s += `<text x="${x}" y="${y + 8}" text-anchor="middle" font-size="20">🛡️</text>`;
      s += '</g>';
    }
    return `<svg class="hx-board" viewBox="0 0 ${W.toFixed(0)} ${Hh.toFixed(0)}" role="img" aria-label="לוח פיצוחים">${s}</svg>`;
  }
  RENDER.hx = function hxBoard() {
    navPush('cls'); document.querySelectorAll('.overlay').forEach(o => o.remove());
    const H = cg, t = cg.turn, team = cg.teams[t];
    const winner = cg.teams.findIndex((_, k) => hxWon(H, k));
    if (winner >= 0) return hxEnd(winner);
    const paths = cg.teams.map((_, k) => hxPath(H, k));
    if (paths.every(p => p === 'blocked') || H.own.every(x => x >= 0)) return hxEnd(-1);
    const st = { open: '🟢 הדרך פתוחה', crack: '🔨 צריך לפצח', blocked: '⛔ חסום' };
    app.innerHTML = `${topbar('⬢', 'פיצוחים', `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      <div class="jeo-turn">התור של: <b style="color:${team.color}">${esc(team.name)}</b> <span class="muted small">(${HX_FROM[H.side[t]]} ${HX_TO[H.side[t]]})</span></div>
      ${H.msg ? `<div class="cg-msg">${H.msg}</div>` : ''}
      <div class="hx-wrap">${hxSVG(H, true)}</div>
      <p class="center small muted">בחרו משושה פנוי${hxCrackOn(cg.mode) && H.tok[t] ? ' – או משושה של קבוצה אחרת כדי לפצח אותו (🔨)' : ''}. קו מלא = הבית של הקבוצה, קו מקווקו = היעד.${cg.mode === 'full' ? ' 💎 = שאלה קשה יותר.' : ''}</p>
      ${tmBar({ noScore: true, val: (tm, k) => `${hxCells(H, k)} ⬢`, sub: (tm, k) => `${HX_SIDES[H.side[k]]} → ${HX_SIDES[(H.side[k] + 2) % 4]} · ${st[paths[k]]}${hxCrackOn(cg.mode) ? ` · 🔨×${H.tok[k]}` : ''}` })}
      <div class="actions" style="justify-content:center"><button class="secondary" id="hxRules">📜 הכללים</button><button class="secondary" id="hxEnd">סיום המשחק</button></div>`;
    bindTop();
    tmBind(RENDER.hx, { onSwap: (i, j) => { [H.side[i], H.side[j]] = [H.side[j], H.side[i]]; [H.tok[i], H.tok[j]] = [H.tok[j], H.tok[i]]; H.own = H.own.map(x => x === i ? j : x === j ? i : x); } });
    $('hxEnd').onclick = () => hxEnd(-1);
    $('hxRules').onclick = () => cgModal(`<h3>📜 כללי פיצוחים</h3><ul class="cg-rules">
      <li>בכל תור הקבוצה בוחרת משושה פנוי ועונה על השאלה. תשובה נכונה – המשושה שלה. תשובה לא נכונה – המשושה נשאר פנוי, מסבירים יחד, והתור עובר.</li>
      <li>מנצחת הקבוצה הראשונה שבונה <b>מסלול רציף</b> של משושים שלה מהצד שלה (קו מלא) עד הצד שמולה (קו מקווקו). משושים נוגעים זה בזה בצלע.</li>
      ${cg.mode === 'full' ? `<li>💎 במרכז הלוח – שאלות קשות יותר. בשוליים – קלות יותר. בוחרים: לעקוף או להסתכן?</li>` : ''}
      ${hxCrackOn(cg.mode) ? `<li>⭐ מי שכובש משושה כוכב מקבל פטיש פיצוח 🔨. בפטיש אפשר לבחור משושה של קבוצה אחרת ולענות על <b>שאלת אתגר</b>: נכון – המשושה עובר אליכם; לא נכון – המשושה מקבל מגן 🛡️ ואי אפשר לפצח אותו יותר.</li>
      <li>🌬️ רוח גבית: בסוף כל סבב, קבוצה שיש לה לפחות 3 משושים פחות מהמובילה מקבלת פטיש.</li>
      <li>⛔ קבוצה שהמסלול שלה נחסם ממשיכה לשחק: היא יכולה לפצח, וכל משושה נספר בהתקדמות.</li>` : (cg.mode === 'full' ? `<li>⭐ מי שכובש משושה כוכב – מקבל תור נוסף.</li>` : '')}
      <li>אם אף קבוצה לא יכולה עוד להשלים מסלול, או שהמורה מסיימת – מנצחת הקבוצה שהמסלול שלה <b>הכי ארוך</b> (הכי רחוק מהבית), ובתיקו – שיש לה יותר משושים.</li></ul>
      <div class="actions" style="justify-content:center"><button data-x>סגירה</button></div>`);
    app.querySelectorAll('[data-hx]').forEach(g => { const go = () => hxPick(Number(g.dataset.hx)); g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  };
  function hxPick(i) {
    const H = cg, t = cg.turn, o = H.own[i];
    if (o === t) return;
    let crack = false;
    if (o >= 0) { if (!hxCrackOn(cg.mode)) return; if (H.shield.includes(i)) return hxToast('המשושה הזה מוגן 🛡️ – אי אפשר לפצח אותו.'); if (!H.tok[t]) return hxToast('אין לכם פטיש פיצוח 🔨. כבשו ⭐ או חכו לרוח גבית.'); crack = true; }
    const lv = crack ? 3 : H.lv[i], seen = new Set(H.seen);
    const ask = () => {
      const q = siteQ(H.topics, lv, seen);
      if (!q) return hxToast('לא נמצאה שאלה. בחרו נושאים אחרים.');
      const ov = cgModal(`<div class="jeo-qhead" style="--c:${cg.teams[t].color}"><span>${esc(cg.teams[t].name)} · ${crack ? `🔨 פיצוח משושה של ${esc(cg.teams[o].name)}` : 'כיבוש משושה'}</span><b>${['', 'קלה', 'בינונית', 'קשה 💎'][lv]}</b></div>
        ${qHTML(q)}
        <div id="hxAns" class="jeo-ans" hidden><div class="jeo-right">${solHTML(q)}</div>
          <div class="jeo-award"><button id="hxOk" style="--tc:${cg.teams[t].color}">✓ נכון – ${crack ? 'פיצחנו!' : 'כובשים'}</button><button class="secondary" id="hxNo">✗ לא נכון</button></div></div>
        <div class="actions" style="justify-content:center"><button id="hxShow">הצגת התשובה</button><button class="ghost" id="hxSwap">שאלה אחרת</button><button class="ghost" data-x>חזרה ללוח</button></div>`);
      ov.querySelector('#hxShow').onclick = () => { ov.querySelector('#hxAns').hidden = false; ov.querySelector('#hxShow').remove(); ov.querySelector('#hxSwap').remove(); };
      ov.querySelector('#hxSwap').onclick = () => { ov.remove(); ask(); };
      ov.querySelector('#hxOk').onclick = () => { cgPush(); H.seen.push(qKey(q)); hxDone(i, true, crack); };
      ov.querySelector('#hxNo').onclick = () => { cgPush(); H.seen.push(qKey(q)); hxDone(i, false, crack); };
    };
    ask();
  }
  function hxToast(m) { cg.msg = m; RENDER.hx(); cg.msg = ''; }
  function hxDone(i, ok, crack) {
    const H = cg, t = cg.turn; let extra = false; H.msg = '';
    if (crack) { H.tok[t]--; if (ok) { H.own[i] = t; stAdd(t, 'cracks'); stAdd(t, 'ok'); H.msg = `🔨 ${esc(cg.teams[t].name)} פיצחו משושה!`; } else { H.shield.push(i); H.msg = '🛡️ הפיצוח לא הצליח – המשושה מוגן מעכשיו.'; } }
    else if (ok) { H.own[i] = t; stAdd(t, 'ok'); if (H.star.includes(i)) { if (hxCrackOn(cg.mode)) { H.tok[t]++; H.msg = `⭐ ${esc(cg.teams[t].name)} קיבלו פטיש פיצוח 🔨!`; } else { extra = true; H.msg = `⭐ תור נוסף ל${esc(cg.teams[t].name)}!`; } H.star = H.star.filter(x => x !== i); } }
    else H.msg = 'לא הפעם – המשושה נשאר פנוי. התור עובר.';
    cg.teams.forEach((tm, k) => { tm.score = hxCells(H, k); });
    if (!extra) { tmNext(); if (cg.turn === 0) { H.round++; if (hxCrackOn(cg.mode)) { const c = cg.teams.map((_, k) => hxCells(H, k)), mx = Math.max(...c), lo = c.indexOf(Math.min(...c)); if (mx - c[lo] >= 3) { H.tok[lo]++; stAdd(lo, 'recover'); H.msg += ` 🌬️ רוח גבית: ${esc(cg.teams[lo].name)} קיבלו פטיש פיצוח.`; } } } }
    cgSave(); RENDER.hx();
  }
  function hxEnd(w) {
    const H = cg, prog = cg.teams.map((_, k) => hxProgress(H, k));
    cg.teams.forEach((t, k) => { t.st = t.st || {}; t.st.cells = hxCells(H, k); });
    tmEnd('⬢', 'פיצוחים', { val: (t, k) => (k === w ? 1000 : 0) + prog[k] * 100 + hxCells(H, k), show: (t, k) => k === w ? '🏁 השלימו מסלול!' : `מסלול באורך ${prog[k]} מתוך ${H.n}`,
      banner: w >= 0 ? `<div class="hx-wrap small">${hxSVG(H, false)}</div>` : '<p>אף קבוצה לא השלימה מסלול – מנצחת הקבוצה שהגיעה הכי רחוק.</p>', again: hxHome });
  }

  /* =========================================================
     בלשי הטעויות – פתרון של תלמיד דמיוני. מאתרים איפה הטעות, מסבירים למה, ומתקנים.
     משחק מלא: "חותמים" לפני הרמז = בונוס; תיק "אין טעות!" (מכיתה ג'); רצף של 3 תיקים מושלמים;
     משימה כיתתית – כשהכיתה מגיעה ליעד נפתח "התיק הסודי" (כפול) ובסוף – חקירה הפוכה.
     ========================================================= */
  function mdHome() {
    const all = CG.mdCases(GRADE), tops = [...new Set(all.map(c => c.topic))];
    let sel = tops.slice(), n = 6;
    cgSetup({ game: 'md', icon: '🔍', title: 'בלשי הטעויות', counts: [2, 3, 4, 5, 6], n: 4,
      how: 'על המסך – פתרון של תלמיד דמיוני, ויש בו טעות אופיינית. כל קבוצה צריכה לגלות: <b>באיזו שורה הטעות? למה זו טעות? איך מתקנים?</b> לא מספיק לומר "התשובה לא נכונה" – מחפשים את מקור הטעות.',
      simple: 'בכל תיק טעות אחת. נקודה על איתור, על הסבר ועל תיקון.',
      full: YOUNG ? 'כמו הפשוט, ומי שמגיע לרצף של 3 תיקים מושלמים מקבל תג בלש מומחה. הכיתה יחד פותחת תיק סודי.' : 'מי ש"חותם" על תשובה לפני הרמז מקבל בונוס. לפעמים מגיע תיק בלי טעות בכלל – צריך לבדוק היטב! רצף של 3 תיקים מושלמים = תג בלש מומחה. הכיתה יחד פותחת תיק סודי.',
      opts: () => `<h2>נושאים</h2><div class="name-row" style="justify-content:center">${chips('mdt', tops.map(k => [k, CG.MD_TOPICS[k]]), sel, true)}</div>
        <h2>כמה תיקים?</h2><div class="name-row" style="justify-content:center">${chips('mdn', [['4', '4'], ['6', '6'], ['8', '8'], ['10', '10']], String(n))}</div>`,
      bind: () => { bindChips('mdt', true, v => { sel = v; }); bindChips('mdn', false, v => { n = Number(v[0]); }); },
      start: (teams, mode) => {
        const L = all.filter(c => sel.includes(c.topic)); if (!L.length) return 'בחרו נושא.';
        const plan = []; let bag = []; while (plan.length < n) { if (!bag.length) bag = shuffle(L.slice()); plan.push(bag.pop()); }
        plan.sort((a, b) => a.lv - b.lv);
        const cases = plan.map(c => CG.mdMake(c, false));
        if (mode === 'full' && !YOUNG) { const k = R(2, Math.max(2, n - 2)); cases[k] = CG.mdMake(plan[k], true); }
        cgBegin('md', teams, mode, { cases, k: 0, ph: 0, seal: [], marks: {}, goal: Math.ceil(teams.length * n * 0.55), found: 0, secret: null, streak: teams.map(() => 0) });
      } });
  }
  // שלבי החשיפה: 0 חקירה · 1 רמז · 2 איפה · 3 למה · 4 תיקון ופתרון מלא (אחרי 2 – המורה מסמנת)
  RENDER.md = function mdDraw() {
    navPush('cls'); document.querySelectorAll('.overlay').forEach(o => o.remove());
    const G = cg, x = G.secret || G.cases[G.k], ph = G.ph, tw = x.twist, mk2 = G.marks;
    const crit = YOUNG ? [['found', '📍 מצאו'], ['fixed', '🔧 תיקנו']] : tw ? [['found', '✔ זיהו שאין טעות'], ['reason', '💬 נימקו']] : [['found', '📍 איתור'], ['reason', '💬 למה'], ['fixed', '🔧 תיקון']];
    const meter = FULL() ? `<div class="cg-meter" title="משימה כיתתית"><span>🗂️ משימה כיתתית: ${G.found} / ${G.goal} איתורים</span><i style="--p:${Math.min(100, G.found / G.goal * 100)}%"></i></div>` : '';
    app.innerHTML = `${topbar('🔍', 'בלשי הטעויות', `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      ${meter}
      <div class="card md-case">
        <div class="md-head"><b>${G.secret ? '🗝️ התיק הסודי (נקודות כפולות!)' : `תיק ${G.k + 1} מתוך ${G.cases.length}`}</b><span class="muted">${CG.MD_TOPICS[x.topic] || ''}</span></div>
        <div class="md-task">המשימה: ${x.task}</div>
        <div class="md-note"><div class="md-who">✏️ הפתרון של ${x.who}:</div>
          <ol class="md-steps">${x.steps.map((s, i) => `<li class="${ph >= 2 && i === x.at ? 'bad' : ''}"><span class="md-ln">שורה ${i + 1}</span><span>${s}</span>${ph >= 2 && i === x.at ? '<b class="md-x">✗</b>' : ''}</li>`).join('')}</ol></div>
        ${ph >= 1 && !tw ? `<div class="fb hint">💡 רמז: ${x.hint}</div>` : ph >= 1 && tw ? '<div class="fb hint">💡 רמז: בדקו כל שורה בנפרד – אולי הכול בסדר?</div>' : ''}
        ${ph >= 2 ? (tw ? '<div class="fb ok md-reveal">🎉 <b>אין טעות!</b> הפתרון הזה נכון. מי שבדק כל שורה ולא מיהר "למצוא" טעות – בלש אמיתי.</div>' : `<div class="fb bad md-reveal">📍 <b>הטעות בשורה ${x.at + 1}.</b>${ph >= 3 ? ` <b>למה?</b> ${x.why}` : ''}</div>`) : ''}
        ${ph >= 4 && !tw ? `<div class="md-fix"><div><b>🔧 התיקון:</b> ${x.fix}</div><div class="md-good"><b>הפתרון הנכון:</b><ol>${x.good.map(s => `<li>${s}</li>`).join('')}</ol></div><div class="muted small">סוג הטעות: ${x.idea}</div></div>` : ''}
        <div class="actions" style="justify-content:center">
          ${ph === 0 ? `<button class="secondary" id="mdHint">💡 רמז</button><button id="mdNext1">חשיפה: איפה הטעות?</button>` : ''}
          ${ph === 1 ? `<button id="mdNext1">חשיפה: איפה הטעות?</button>` : ''}
          ${ph === 2 && !tw ? `<button id="mdWhy">למה זו טעות?</button>` : ''}
          ${ph === 3 ? `<button id="mdFix">תיקון ופתרון מלא</button>` : ''}
          ${ph >= 2 ? `<button class="race-go" id="mdGo">${G.secret || G.k + 1 >= G.cases.length ? 'לסיום ←' : 'לתיק הבא ←'}</button>` : ''}
        </div>
      </div>
      ${FULL() && !YOUNG && ph === 0 ? `<div class="card md-seal"><b>🔒 חתמו על תשובה לפני הרמז?</b> <span class="muted small">קבוצה שכתבה תשובה – לוחצים על השם שלה. אם כל התשובה נכונה – בונוס נקודה.</span><div class="jeo-award">${cg.teams.map((t, i) => `<button data-seal="${i}" class="${G.seal.includes(i) ? 'sel' : ''}" style="--tc:${t.color}">${G.seal.includes(i) ? '🔒 ' : ''}${esc(t.name)}</button>`).join('')}</div></div>` : ''}
      ${ph >= 2 ? `<div class="card md-judge"><b>מה כל קבוצה הצליחה?</b> <span class="muted small">(כל סימון = נקודה${G.secret ? ', כפול בתיק הסודי' : ''})</span>
        <div class="md-rows">${cg.teams.map((t, i) => `<div class="md-row" style="--tc:${t.color}"><span class="jdot"></span><b>${esc(t.name)}</b>${crit.map(([k, lab]) => `<button class="cg-tg${(mk2[i] || []).includes(k) ? ' on' : ''}" data-mk="${i}" data-k="${k}">${lab}</button>`).join('')}${G.seal.includes(i) ? '<span class="cg-sealed">🔒 חתמו מוקדם</span>' : ''}${G.streak[i] >= 2 ? `<span class="cg-sealed">🔥 רצף ${G.streak[i]}</span>` : ''}</div>`).join('')}</div></div>` : ''}
      ${tmBar({ noTurn: true })}`;
    bindTop(); tmBind(RENDER.md, { noTurn: true });
    const adv = p => { cgPush(); G.ph = p; cgSave(); RENDER.md(); };
    if ($('mdHint')) $('mdHint').onclick = () => adv(1);
    if ($('mdNext1')) $('mdNext1').onclick = () => adv(2);
    if ($('mdWhy')) $('mdWhy').onclick = () => adv(3);
    if ($('mdFix')) $('mdFix').onclick = () => adv(4);
    app.querySelectorAll('[data-seal]').forEach(b => b.onclick = () => { cgPush(); const i = Number(b.dataset.seal); G.seal = G.seal.includes(i) ? G.seal.filter(x => x !== i) : [...G.seal, i]; cgSave(); RENDER.md(); });
    app.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.mk), k = b.dataset.k, L = mk2[i] = mk2[i] || [], on = L.includes(k), p = G.secret ? 2 : 1;
      cgPush(); if (on) { L.splice(L.indexOf(k), 1); cg.teams[i].score -= p; stAdd(i, k, -1); if (k === 'found') G.found--; } else { L.push(k); cg.teams[i].score += p; stAdd(i, k); if (k === 'found') G.found++; }
      cgSave(); RENDER.md();
    });
    if ($('mdGo')) $('mdGo').onclick = () => {
      cgPush();
      cg.teams.forEach((t, i) => { const L = mk2[i] || [], full = crit.every(([k]) => L.includes(k)); if (full && G.seal.includes(i)) { t.score += 1; stAdd(i, 'creative'); } G.streak[i] = full ? G.streak[i] + 1 : 0; if (G.streak[i] === 3) stAdd(i, 'streak'); });
      G.marks = {}; G.seal = []; G.ph = 0;
      if (G.secret) { cgSave(); return mdEnd(); }
      if (G.k + 1 >= G.cases.length) {
        if (FULL() && G.found >= G.goal && !G.secretDone) { const hard = CG.mdCases(GRADE).sort((a, b) => b.lv - a.lv)[0]; G.secret = CG.mdMake(pick(CG.mdCases(GRADE).filter(c => c.lv === hard.lv)), false); G.secretDone = true; cgSave(); return RENDER.md(); }
        cgSave(); return mdEnd();
      }
      G.k++; cgSave(); RENDER.md();
    };
  };
  function mdEnd() {
    const G = cg, done = FULL() && G.secretDone;
    tmEnd('🔍', 'בלשי הטעויות', { again: mdHome,
      class: FULL() ? (done ? `🗝️ הכיתה פתחה את התיק הסודי! ${G.found} איתורים יחד.` : `🗂️ המשימה הכיתתית: ${G.found} מתוך ${G.goal} איתורים.`) : '',
      banner: FULL() && !YOUNG ? `<div class="fb info" style="text-align:right"><b>🔄 חקירה הפוכה (משימת המשך):</b> כל קבוצה כותבת פתרון לתרגיל, ומחביאה בו טעות אחת "טובה" – טעות שתלמידים באמת עושים. מחליפים פתרונות עם קבוצה אחרת ומחפשים. נקודה על איתור, ונקודה לקבוצה שהטעות שלה הייתה הכי מלמדת.</div>` : '' });
  }

  /* =========================================================
     כמה זה בערך? – אומדן. ברירת מחדל: בלי שעון.
     משחק מלא: כל קבוצה בוחרת רשת – רחבה (בטוח, נקודה), צרה (2) או "בול" (3); "הכי קרובים" +1; הסבב האחרון – כפול.
     ========================================================= */
  function esHome() {
    let n = 6, sane = GRADE >= 3;
    cgSetup({ game: 'es', icon: '🎯', title: 'כמה זה בערך?', counts: [2, 3, 4, 5, 6], n: 4,
      how: 'על המסך – תרגיל או בעיה. <b>לא מחשבים בדיוק!</b> כל קבוצה כותבת אומדן ומסבירה איך הגיעה אליו (עיגול, מספרים נוחים, מספרי ייחוס). אחר כך משווים דרכים – ורק בסוף חושפים את התוצאה המדויקת.',
      simple: 'הקבוצה הכי קרובה – 2 נקודות. כל אומדן סביר (עד 25% מהתוצאה) – נקודה.',
      full: YOUNG ? 'כמו הפשוט, והסבב האחרון שווה כפול.' : 'כל קבוצה בוחרת כמה להסתכן: רשת רחבה (±25%, נקודה), צרה (±10%, 2) או "בול" (±5%, 3). הכי קרובים – עוד נקודה. הסבב האחרון – כפול!',
      opts: () => `<h2>כמה סבבים?</h2><div class="name-row" style="justify-content:center">${chips('esn', [['5', '5'], ['6', '6'], ['8', '8'], ['10', '10']], String(n))}</div>
        ${GRADE >= 3 ? `<div class="name-row" style="justify-content:center"><label class="chk"><input type="checkbox" id="esSane" ${sane ? 'checked' : ''}> לשלב גם "בדיקת סבירות" (האם החישוב של מישהו סביר?)</label></div>` : ''}`,
      bind: () => { bindChips('esn', false, v => { n = Number(v[0]); }); if ($('esSane')) $('esSane').onchange = e => { sane = e.target.checked; }; },
      start: (teams, mode) => {
        const items = [], seen = new Set(); for (let g = 0; items.length < n && g < 400; g++) { const it = CG.estItem(GRADE, sane); const k = it.html || it.claim; if (seen.has(k)) continue; seen.add(k); items.push(it); }
        cgBegin('es', teams, mode, { items, k: 0, ph: 0, guess: teams.map(() => ''), net: teams.map(() => 'w'), dots: null, hide: false });
      } });
  }
  const dotCloud = (n, seed) => { CG.seed(seed); const pts = []; for (let t = 0; pts.length < n && t < 5000; t++) { const x = 20 + CG.R(0, 560), y = 20 + CG.R(0, 260); if (pts.every(([a, b]) => (a - x) ** 2 + (b - y) ** 2 > 700)) pts.push([x, y]); } CG.unseed(); return `<svg viewBox="0 0 600 300" class="es-dots">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11"/>`).join('')}</svg>`; };
  RENDER.es = function esDraw() {
    navPush('cls');
    const G = cg, it = G.items[G.k], ph = G.ph, last = G.k === G.items.length - 1 && FULL(), mul = last ? 2 : 1, sane = it.kind === 'sane';
    if (it.kind === 'dots' && !it.seed) it.seed = R(1, 1e6);
    const res = ph >= 2 ? esScore() : null;
    app.innerHTML = `${topbar('🎯', 'כמה זה בערך?', `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      <div class="card es-card">
        <div class="md-head"><b>סבב ${G.k + 1} מתוך ${G.items.length}${last ? ' – <span class="cg-hot">כפול!</span>' : ''}</b><span class="muted">${sane ? 'בדיקת סבירות' : 'אומדן'}</span></div>
        ${sane ? `<div class="jeo-qtext">${it.claim}</div><p class="race-how">האם התוצאה <b>סבירה</b>? בלי לחשב בדיוק – הסבירו למה.</p>` : `<div class="jeo-qtext">${it.html}</div>`}
        ${it.kind === 'dots' ? (G.hide && ph < 2 ? '<div class="es-hid">הנקודות מוסתרות – מה האומדן שלכם?</div>' : dotCloud(it.dots, it.seed)) : ''}
        ${ph >= 1 ? `<div class="fb info"><b>🧠 דרכים לאמוד:</b><ul>${(sane ? [it.why] : it.ways).map(w => `<li>${w}</li>`).join('')}</ul><span class="muted small">גם דרך אחרת נכונה – אם היא מתאימה לשאלה. הקבוצות מציגות את הדרך שלהן.</span></div>` : ''}
        ${ph >= 2 ? `<div class="fb ok"><b>${sane ? (it.sane ? '✓ סביר' : '✗ לא סביר') : 'התוצאה המדויקת'}:</b> ${M(fmt(it.exact))}${it.approx ? ' (בערך)' : ''}</div>` : ''}
      </div>
      <div class="card"><b>${sane ? 'מה כל קבוצה חושבת?' : 'האומדנים של הקבוצות'}</b>
        <div class="es-rows">${cg.teams.map((t, i) => `<div class="md-row" style="--tc:${t.color}"><span class="jdot"></span><b>${esc(t.name)}</b>
          ${sane ? chips(`ess${i}`, [['1', 'סביר'], ['0', 'לא סביר']], G.guess[i]) : `<input class="es-in" data-g="${i}" inputmode="decimal" value="${esc(G.guess[i])}" placeholder="אומדן" ${ph >= 2 ? 'disabled' : ''}>`}
          ${!sane && FULL() && !YOUNG ? chips(`esn${i}`, CG.EST_NETS.map(x => [x.id, `${x.name} ±${x.pct}%`]), G.net[i]) : ''}
          ${res ? `<span class="es-res">${res[i].txt}</span>` : ''}</div>`).join('')}</div></div>
      <div class="actions" style="justify-content:center">
        ${it.kind === 'dots' && ph < 2 ? `<button class="secondary" id="esHide">${G.hide ? 'להציג שוב' : 'הסתרת הנקודות'}</button>` : ''}
        ${ph === 0 ? '<button id="esWays">מה האסטרטגיות?</button>' : ''}${ph <= 1 ? `<button class="race-go" id="esRev">חשיפת התוצאה${mul > 1 ? ' (כפול)' : ''}</button>` : `<button class="race-go" id="esNext">${G.k + 1 < G.items.length ? 'לסבב הבא ←' : 'לסיום ←'}</button>`}
      </div>
      ${tmBar({ noTurn: true })}`;
    bindTop(); tmBind(RENDER.es, { noTurn: true });
    app.querySelectorAll('[data-g]').forEach(inp => inp.oninput = () => { G.guess[Number(inp.dataset.g)] = inp.value; cgSave(); });
    cg.teams.forEach((_, i) => { bindChips(`ess${i}`, false, v => { G.guess[i] = v[0]; cgSave(); }); bindChips(`esn${i}`, false, v => { G.net[i] = v[0]; cgSave(); }); });
    if ($('esHide')) $('esHide').onclick = () => { G.hide = !G.hide; RENDER.es(); };
    if ($('esWays')) $('esWays').onclick = () => { G.ph = 1; cgSave(); RENDER.es(); };
    if ($('esRev')) $('esRev').onclick = () => { cgPush(); G.ph = 2; esScore().forEach((r, i) => { if (r.pts) { cg.teams[i].score += r.pts * mul; stAdd(i, 'ok'); } if (r.best) stAdd(i, 'close'); }); cgSave(); RENDER.es(); };
    if ($('esNext')) $('esNext').onclick = () => { cgPush(); if (G.k + 1 >= G.items.length) { cgSave(); return tmEnd('🎯', 'כמה זה בערך?', { again: esHome }); } G.k++; G.ph = 0; G.hide = false; G.guess = cg.teams.map(() => ''); cgSave(); RENDER.es(); };
  };
  function esScore() {
    const G = cg, it = G.items[G.k];
    if (it.kind === 'sane') return cg.teams.map((_, i) => { const ok = G.guess[i] !== '' && (G.guess[i] === '1') === it.sane; return { pts: ok ? 2 : 0, txt: G.guess[i] === '' ? '—' : ok ? '✓ +2' : '✗' }; });
    const v = G.guess.map(s => { const x = Number(String(s).replace(/[,\s]/g, '')); return String(s).trim() !== '' && isFinite(x) ? x : null; });
    const d = v.map(x => x == null ? Infinity : Math.abs(x - it.exact)), best = Math.min(...d);
    return cg.teams.map((_, i) => {
      if (v[i] == null) return { pts: 0, txt: '—' };
      const isBest = d[i] === best;
      if (!FULL() || YOUNG) { const pts = isBest ? 2 : CG.estHit(v[i], it.exact, 25) ? 1 : 0; return { pts, best: isBest, txt: `${pts ? `✓ +${pts}` : '✗ רחוק'}${isBest ? ' 🎯 הכי קרובים' : ''}` }; }
      const N = CG.EST_NETS.find(x => x.id === G.net[i]) || CG.EST_NETS[0], hit = CG.estHit(v[i], it.exact, N.pct), pts = (hit ? N.pts : 0) + (isBest ? 1 : 0);
      return { pts, best: isBest, txt: `${hit ? `✓ ברשת ה${N.name.replace('רשת ', '')}` : `✗ מחוץ לרשת`}${isBest ? ' 🎯 הכי קרובים' : ''}${pts ? ` +${pts}` : ''}` };
    });
  }

  /* =========================================================
     מספר המטרה – מגיעים למספר המטרה בעזרת המספרים הנתונים (כל מספר לכל היותר פעם אחת).
     משחק מלא: דרך שאף קבוצה אחרת לא מצאה +1, שימוש בכל המספרים +1, "כמעט" (עד 2) +1, קלף כוח אחד: מספר עזר 1.
     ========================================================= */
  function tgHome() {
    let lv = 2, n = 5;
    cgSetup({ game: 'tg', icon: '🎲', title: 'מספר המטרה', counts: [2, 3, 4, 5, 6], n: 4,
      how: 'על המסך – מספר מטרה ומספרים נתונים. כל קבוצה מחפשת דרך להגיע בדיוק למטרה, בפעולות המותרות. <b>יש יותר מדרך אחת!</b> המורה מקלידה את הביטוי של כל קבוצה – והמערכת בודקת.',
      simple: 'מגיעים למטרה – 2 נקודות. קרוב (עד 2) – נקודה.',
      full: 'מגיעים – 3 נקודות. דרך שאף קבוצה אחרת לא מצאה – בונוס. שימוש בכל המספרים – בונוס. לכל קבוצה קלף כוח אחד: "מספר עזר 1".',
      opts: () => `<h2>רמת אתגר</h2><div class="name-row" style="justify-content:center">${chips('tgl', [['1', 'קל – הרבה דרכים'], ['2', 'בינוני'], ['3', 'מאתגר – מעט דרכים']], String(lv))}</div>
        <h2>כמה סבבים?</h2><div class="name-row" style="justify-content:center">${chips('tgn', [['4', '4'], ['5', '5'], ['6', '6'], ['8', '8']], String(n))}</div>`,
      bind: () => { bindChips('tgl', false, v => { lv = Number(v[0]); }); bindChips('tgn', false, v => { n = Number(v[0]); }); },
      start: (teams, mode) => {
        const P = []; for (let g = 0; P.length < n && g < 50; g++) { const p = CG.tgtMake(GRADE, lv); if (p && !P.some(x => x.target === p.target && x.nums.join() === p.nums.join())) P.push(p); }
        if (P.length < n) return 'לא הצלחנו ליצור מספיק אתגרים – נסו רמה אחרת.';
        cgBegin('tg', teams, mode, { P, k: 0, ph: 0, ex: teams.map(() => ''), card: teams.map(() => FULL() || mode === 'full'), useCard: teams.map(() => false) });
      } });
  }
  const opName = o => ({ '+': '+', '-': '−', '×': '×', ':': ':' })[o];
  RENDER.tg = function tgDraw() {
    navPush('cls');
    const G = cg, P = G.P[G.k], ph = G.ph, full = FULL();
    const chk = G.ex.map((e, i) => e.trim() ? CG.tgtCheck(e, P.nums, P.ops, G.useCard[i] ? [1] : []) : null);
    const pts = tgScore(chk);
    app.innerHTML = `${topbar('🎲', 'מספר המטרה', `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      <div class="card center tg-card">
        <div class="md-head"><b>סבב ${G.k + 1} מתוך ${G.P.length}</b><span class="muted">פעולות: ${M(P.ops.split('').map(opName).join('  '))}${P.paren ? ' · מותר סוגריים' : ''}</span></div>
        <div class="tg-target">🎯 <b data-raw>${P.target}</b></div>
        <div class="tg-nums">${P.nums.map(x => `<span data-raw>${x}</span>`).join('')}</div>
        <p class="muted small">כל מספר – לכל היותר פעם אחת. ${GRADE <= 2 ? 'מחשבים לפי הסדר, משמאל לימין.' : ''}${full ? ' בונוס למי שמשתמש בכל המספרים.' : ''}</p>
        ${ph >= 1 ? `<div class="fb info" style="text-align:right"><b>דרכים אפשריות:</b><ul>${P.sols.slice(0, 5).map(s => `<li>${M(s.e.replace(/-/g, '−'))} ${M('= ' + P.target)}</li>`).join('')}</ul>${P.sols.length > 5 ? '<span class="small muted">ויש עוד…</span>' : ''}</div>` : ''}
      </div>
      <div class="card"><b>הדרכים של הקבוצות</b> <span class="muted small">(להקליד כמו: ${M(GRADE <= 2 ? '7 + 5 - 2' : '(6 + 2) × 3')}; אפשר x או * לכפל, / לחילוק)</span>
        <div class="es-rows">${cg.teams.map((t, i) => { const c = chk[i]; return `<div class="md-row" style="--tc:${t.color}"><span class="jdot"></span><b>${esc(t.name)}</b>
          <input class="tg-in" dir="ltr" data-e="${i}" value="${esc(G.ex[i])}" placeholder="הביטוי של הקבוצה" ${ph >= 2 ? 'disabled' : ''}>
          ${full && (G.card[i] || G.useCard[i]) ? `<button class="cg-tg${G.useCard[i] ? ' on' : ''}" data-card="${i}" ${ph >= 2 ? 'disabled' : ''} title="קלף כוח – פעם אחת במשחק: מותר להוסיף את המספר 1">🃏 מספר עזר 1</button>` : ''}
          <span class="es-res">${c ? (c.err ? `⚠️ ${c.err}` : `${M('= ' + fmt(CG.r6(c.v)))} ${Math.abs(c.v - P.target) < 1e-9 ? '✓' : Math.abs(c.v - P.target) <= 2 ? '≈ כמעט' : '✗'}`) : ''}${ph >= 2 && pts[i].pts ? ` <b>+${pts[i].pts}</b> ${pts[i].why}` : ''}</span></div>`; }).join('')}</div></div>
      <div class="actions" style="justify-content:center">${ph === 0 ? '<button class="secondary" id="tgWays">הצגת דרכים אפשריות</button>' : ''}${ph < 2 ? '<button class="race-go" id="tgScore">ניקוד הסבב</button>' : `<button class="race-go" id="tgNext">${G.k + 1 < G.P.length ? 'לסבב הבא ←' : 'לסיום ←'}</button>`}</div>
      ${tmBar({ noTurn: true })}`;
    bindTop(); tmBind(RENDER.tg, { noTurn: true });
    app.querySelectorAll('[data-e]').forEach(inp => { inp.onchange = () => { G.ex[Number(inp.dataset.e)] = inp.value; cgSave(); RENDER.tg(); }; });
    app.querySelectorAll('[data-card]').forEach(b => b.onclick = () => { const i = Number(b.dataset.card); G.useCard[i] = !G.useCard[i]; cgSave(); RENDER.tg(); });
    if ($('tgWays')) $('tgWays').onclick = () => { G.ph = 1; cgSave(); RENDER.tg(); };
    if ($('tgScore')) $('tgScore').onclick = () => {
      app.querySelectorAll('[data-e]').forEach(inp => { G.ex[Number(inp.dataset.e)] = inp.value; });
      const c2 = G.ex.map((e, i) => e.trim() ? CG.tgtCheck(e, P.nums, P.ops, G.useCard[i] ? [1] : []) : null);
      cgPush(); G.ph = 2; tgScore(c2).forEach((r, i) => { if (r.pts) { cg.teams[i].score += r.pts; stAdd(i, r.exact ? 'ok' : 'recover'); if (r.uniq) stAdd(i, 'ways'); } if (G.useCard[i]) G.card[i] = false; });
      cgSave(); RENDER.tg();
    };
    if ($('tgNext')) $('tgNext').onclick = () => { cgPush(); if (G.k + 1 >= G.P.length) { cgSave(); return tmEnd('🎲', 'מספר המטרה', { again: tgHome }); } G.k++; G.ph = 0; G.ex = cg.teams.map(() => ''); G.useCard = cg.teams.map(() => false); cgSave(); RENDER.tg(); };
  };
  function tgScore(chk) {
    const P = cg.P[cg.k], full = FULL(), ok = chk.map(c => c && !c.err && Math.abs(c.v - P.target) < 1e-9);
    return chk.map((c, i) => {
      if (!c || c.err) return { pts: 0, why: '' };
      if (ok[i]) { let p = full ? 3 : 2; const why = []; const uniq = full && !chk.some((d, j) => j !== i && ok[j] && d.norm === c.norm); if (uniq && ok.filter(Boolean).length > 1) { p++; why.push('דרך ייחודית'); } if (full && GRADE >= 3 && c.used.length >= P.nums.length) { p++; why.push('כל המספרים'); } return { pts: p, exact: true, uniq, why: why.join(' · ') }; }
      if (Math.abs(c.v - P.target) <= 2) return { pts: 1, why: 'כמעט!' };
      return { pts: 0, why: '' };
    });
  }

  /* =========================================================
     מה לא שייך? – ארבעה פריטים. בוחרים פריט ומנמקים. לפעמים יש יותר מתשובה אחת!
     משחק מלא: נימוק מקורי (שאף קבוצה אחרת לא אמרה) +1, "מצאנו עוד תשובה" +1.
     ========================================================= */
  function odHome() {
    const kinds = CG.ODD_KINDS(GRADE); let sel = kinds.map(k => k[0]), n = 6;
    cgSetup({ game: 'od', icon: '🧩', title: 'מה לא שייך?', counts: [2, 3, 4, 5, 6], n: 4,
      how: 'על המסך – ארבעה פריטים. כל קבוצה בוחרת <b>איזה מהם לא שייך</b> ומנמקת. אין רק תשובה אחת: מה שחשוב הוא הנימוק. בחשיפה מופיעים נימוקים אפשריים – והמורה יכולה לקבל גם נימוקים אחרים.',
      simple: 'נימוק נכון – 2 נקודות.',
      full: 'נימוק נכון – 2. נימוק שאף קבוצה אחרת לא אמרה – בונוס מקוריות. מצאתם עוד פריט שלא שייך, עם נימוק? – עוד נקודה.',
      opts: () => `<h2>מה יופיע?</h2><div class="name-row" style="justify-content:center">${chips('odk', kinds, sel, true)}</div>
        <h2>כמה סבבים?</h2><div class="name-row" style="justify-content:center">${chips('odn', [['4', '4'], ['6', '6'], ['8', '8']], String(n))}</div>`,
      bind: () => { bindChips('odk', true, v => { sel = v; }); bindChips('odn', false, v => { n = Number(v[0]); }); },
      start: (teams, mode) => {
        const S = []; for (let g = 0; S.length < n && g < 80; g++) { const k = sel[S.length % sel.length], multi = mode === 'full' || GRADE >= 3 || g % 2 === 1; const s = CG.oddMake(GRADE, k, multi && !(YOUNG && mode === 'simple')); if (s) S.push(s); }
        cgBegin('od', teams, mode, { S, k: 0, ph: 0, ch: teams.map(() => null), mk: {} });
      } });
  }
  RENDER.od = function odDraw() {
    navPush('cls');
    const G = cg, S = G.S[G.k], ph = G.ph, full = FULL();
    const crit = full ? [['ok', '✓ נימוק נכון', 2], ['creative', '💡 מקורי', 1], ['second', '➕ עוד תשובה', 1]] : [['ok', '✓ נימוק נכון', 2]];
    app.innerHTML = `${topbar('🧩', 'מה לא שייך?', `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      <div class="card"><div class="md-head"><b>סבב ${G.k + 1} מתוך ${G.S.length}</b><span class="muted">איזה פריט לא שייך? ולמה?</span></div>
        <div class="od-grid">${S.items.map((h, i) => `<div class="od-it${ph >= 1 && S.why[i].length ? ' ok' : ''}"><span class="od-l">${LET[i]}</span><div class="od-v">${h}</div>${ph >= 1 ? `<div class="od-why">${S.why[i].length ? S.why[i].map(w => `<div>✓ ${w}</div>`).join('') : '<div class="muted">אין נימוק ברשימה – אולי לכם יש?</div>'}</div>` : ''}</div>`).join('')}</div>
        ${ph >= 1 && S.why.filter(w => w.length).length > 1 ? '<div class="fb ok">🌈 בשאלה הזאת יש <b>יותר מתשובה אחת</b> – כל פריט עם נימוק מתאים נכון!</div>' : ''}
      </div>
      <div class="card"><b>מה בחרה כל קבוצה?</b>
        <div class="es-rows">${cg.teams.map((t, i) => `<div class="md-row" style="--tc:${t.color}"><span class="jdot"></span><b>${esc(t.name)}</b>${chips(`odc${i}`, S.items.map((_, k) => [String(k), LET[k]]), G.ch[i] == null ? '' : String(G.ch[i]))}
          ${ph >= 1 ? crit.map(([k, lab]) => `<button class="cg-tg${(G.mk[i] || []).includes(k) ? ' on' : ''}" data-om="${i}" data-k="${k}">${lab}</button>`).join('') : ''}</div>`).join('')}</div></div>
      <div class="actions" style="justify-content:center">${ph === 0 ? '<button class="race-go" id="odRev">חשיפת הנימוקים</button>' : `<button class="race-go" id="odNext">${G.k + 1 < G.S.length ? 'לסבב הבא ←' : 'לסיום ←'}</button>`}</div>
      ${tmBar({ noTurn: true })}`;
    bindTop(); tmBind(RENDER.od, { noTurn: true });
    cg.teams.forEach((_, i) => bindChips(`odc${i}`, false, v => { G.ch[i] = Number(v[0]); cgSave(); }));
    app.querySelectorAll('[data-om]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.om), k = b.dataset.k, L = G.mk[i] = G.mk[i] || [], p = crit.find(c => c[0] === k)[2], on = L.includes(k);
      cgPush(); if (on) { L.splice(L.indexOf(k), 1); cg.teams[i].score -= p; stAdd(i, k === 'second' ? 'ok' : k, -1); } else { L.push(k); cg.teams[i].score += p; stAdd(i, k === 'second' ? 'ok' : k); } cgSave(); RENDER.od();
    });
    if ($('odRev')) $('odRev').onclick = () => {
      cgPush(); G.ph = 1;
      // סימון אוטומטי: קבוצה שבחרה פריט שיש לו נימוק ברשימה – "נימוק נכון" (המורה יכולה לבטל או להוסיף)
      cg.teams.forEach((t, i) => { if (G.ch[i] != null && S.why[G.ch[i]].length) { G.mk[i] = ['ok']; t.score += 2; stAdd(i, 'ok'); } });
      cgSave(); RENDER.od();
    };
    if ($('odNext')) $('odNext').onclick = () => { cgPush(); if (G.k + 1 >= G.S.length) { cgSave(); return tmEnd('🧩', 'מה לא שייך?', { again: odHome }); } G.k++; G.ph = 0; G.ch = cg.teams.map(() => null); G.mk = {}; cgSave(); RENDER.od(); };
  };

  /* =========================================================
     דומינו מתמטי – שרשרת של ייצוגים שווים. לוח משותף בהקרנה, או ערכת קלפים להדפסה.
     בלוח: "שוק" של אריחים גלויים; הקבוצה בתור בוחרת אריח שמתאים לאחד הקצוות. משחק מלא: אריחי מלכודת 🪤.
     ========================================================= */
  function doHome() {
    const sets = CG.domSets(GRADE); let set = sets[0].id;
    cgSetup({ game: 'do', icon: '🁫', title: 'דומינו מתמטי', counts: [2, 3, 4, 5, 6], n: 4,
      how: 'בונים יחד שרשרת: כל אריח מתחבר לאריח שלידו רק אם <b>שני הצדדים הנוגעים שווים</b> – באותו ערך, בייצוג אחר (למשל ½ ו-0.5). הקבוצה בתור בוחרת אריח מהשוק ומסבירה למה הוא מתאים.',
      simple: 'אריח מתאים – נקודה. הסבר טוב – עוד נקודה.',
      full: 'בשוק יש גם אריחי מלכודת 🪤 – נראים מתאימים, אבל לא שווים! קבוצה שמזהה מלכודת ומסבירה – מקבלת נקודה. סוגרים את כל השרשרת – הכיתה ניצחה יחד.',
      opts: () => `<h2>איזו ערכה?</h2><div class="name-row" style="justify-content:center">${chips('dos', sets.map(s => [s.id, s.name]), set)}</div>
        <div class="actions" style="justify-content:center"><button class="secondary" id="doPrint">🖨️ ערכת קלפים להדפסה (לעבודה בקבוצות)</button></div>`,
      bind: () => { bindChips('dos', false, v => { set = v[0]; }); $('doPrint').onclick = () => doPrint(set); },
      start: (teams, mode) => {
        const D = CG.domMake(set, GRADE, mode === 'full' && GRADE >= 2 ? 2 : 0), start = R(0, D.tiles.length - 1);
        const pool = shuffle(D.tiles.filter(t => t.i !== start).concat(D.traps.map((t, k) => Object.assign(t, { i: 100 + k }))));
        cgBegin('do', teams, mode, { D: { name: D.name, tiles: D.tiles, traps: D.traps }, chain: [start], pool: pool.map(t => t.i), mkt: [], last: null });
        doFill(); cgSave(); RENDER.do();
      } });
  }
  const doTile = i => i >= 100 ? cg.D.traps[i - 100] : cg.D.tiles[i];
  const doEnds = () => { const C = cg.chain, first = doTile(C[0]), last = doTile(C[C.length - 1]); return { L: first.va, Rr: last.vb }; };
  const doFits = t => { const e = doEnds(); return !t.trap && (t.vb === e.L || t.va === e.Rr); };
  function doFill() {
    const G = cg, size = 6;
    while (G.mkt.length < size && G.pool.length) G.mkt.push(G.pool.shift());
    if (G.chain.length < G.D.tiles.length && !G.mkt.some(i => doFits(doTile(i)))) { const k = G.pool.findIndex(i => doFits(doTile(i))); if (k >= 0) { const j = G.mkt.findIndex(i => i < 100); const out = G.mkt.splice(j < 0 ? 0 : j, 1)[0]; G.mkt.push(G.pool.splice(k, 1)[0]); G.pool.push(out); } }
  }
  const tileHTML = (t, cls = '') => `<span class="do-t ${cls}"><span class="do-h">${t.a}</span><span class="do-h">${t.b}</span></span>`;
  RENDER.do = function doDraw() {
    navPush('cls');
    const G = cg, team = cg.teams[cg.turn], done = G.chain.length >= G.D.tiles.length;
    app.innerHTML = `${topbar('🁫', `דומינו – ${G.D.name}`, `<span class="cg-badge">${modeName(cg.mode)}</span>`)}
      <div class="jeo-turn">${done ? '🎉 השרשרת נסגרה – כל הכבוד לכל הכיתה!' : `התור של: <b style="color:${team.color}">${esc(team.name)}</b>`}</div>
      ${G.last ? `<div class="cg-msg">${G.last}</div>` : ''}
      <div class="card"><div class="muted small">השרשרת (${G.chain.length} מתוך ${G.D.tiles.length}). אריח חדש מתחבר באחד הקצוות.</div>
        <div class="do-chain">${G.chain.map(i => tileHTML(doTile(i))).join('<span class="do-join">=</span>')}</div></div>
      ${done ? '' : `<div class="card"><b>השוק</b> <span class="muted small">– לוחצים על האריח שהקבוצה בחרה:</span><div class="do-mkt">${G.mkt.map(i => `<button class="do-pick" data-dp="${i}">${tileHTML(doTile(i))}</button>`).join('')}</div></div>`}
      <div class="actions" style="justify-content:center">${done ? '<button class="race-go" id="doEnd">לסיום ←</button>' : '<button class="secondary" id="doEnd">סיום המשחק</button>'}</div>
      ${tmBar()}`;
    bindTop(); tmBind(RENDER.do);
    $('doEnd').onclick = () => tmEnd('🁫', 'דומינו מתמטי', { again: doHome, class: done ? '🔗 הכיתה סגרה את השרשרת יחד!' : '' });
    app.querySelectorAll('[data-dp]').forEach(b => b.onclick = () => doPlay(Number(b.dataset.dp)));
  };
  function doPlay(i) {
    const G = cg, t = doTile(i), e = doEnds(), k = cg.turn;
    cgPush();
    if (t.trap) {
      const ov = cgModal(`<h3>🪤 אריח מלכודת!</h3><div class="center">${tileHTML(t)}</div><p>${t.why}</p><p class="muted">האם הקבוצה זיהתה בעצמה שזו מלכודת והסבירה למה?</p>
        <div class="jeo-award"><button id="doTy" style="--tc:${cg.teams[k].color}">✓ זיהו והסבירו (+1)</button><button class="secondary" id="doTn">לא, ניסו לחבר</button></div>`);
      const fin = ok => { ov.remove(); if (ok) { cg.teams[k].score++; stAdd(k, 'trapSeen'); } G.mkt = G.mkt.filter(x => x !== i); G.last = '🪤 אריח המלכודת יצא מהמשחק.'; tmNext(); doFill(); cgSave(); RENDER.do(); };
      ov.querySelector('#doTy').onclick = () => fin(true); ov.querySelector('#doTn').onclick = () => fin(false);
      return;
    }
    if (t.vb === e.L) G.chain.unshift(i); else if (t.va === e.Rr) G.chain.push(i);
    else { G.last = `✗ האריח לא מתאים לאף קצה. מה צריך? בקצה אחד – משהו ששווה ל-${doTile(G.chain[0]).a}, ובקצה השני – ל-${doTile(G.chain[G.chain.length - 1]).b}.`; tmNext(); cgSave(); return RENDER.do(); }
    cg.teams[k].score++; stAdd(k, 'ok'); G.mkt = G.mkt.filter(x => x !== i); G.last = `✓ ${esc(cg.teams[k].name)} חיברו אריח! הסבירו לכיתה למה הצדדים שווים (⭐ הנמקה = עוד נקודה).`;
    tmNext(); doFill(); cgSave(); RENDER.do();
  }
  function doPrint(setId) {
    const nSets = Number(prompt('כמה ערכות להדפיס? (ערכה לכל קבוצה)', '4')) || 1, code = R(1000, 9999);
    CG.seed(code); const D = CG.domMake(setId, GRADE, 0); CG.unseed();
    const one = k => { CG.seed(code + k); const T = shuffle(D.tiles.slice()); CG.unseed(); return `<section class="pg"><h1>דומינו – ${D.name}</h1><div class="small">ערכה ${k + 1} · קוד ${code} · גוזרים לאורך הקווים המקווקווים. מתחילים מאריח כלשהו ומחברים אריחים שהצדדים הנוגעים בהם שווים. בסוף – שרשרת סגורה (מעגל)!</div><div class="tiles">${T.map(t => `<div class="tile"><div>${t.a}</div><div>${t.b}</div></div>`).join('')}</div></section>`; };
    const key = `<section class="pg"><h1>דף תשובות למורה – הסדר הנכון</h1><div class="small">קוד ${code}. כל ערכה מכילה אותם אריחים בסדר אחר.</div><ol class="key">${D.tiles.map(t => `<li><span>${t.a}</span> | <span>${t.b}</span></li>`).join('')}</ol><p class="small">אחרי האריח האחרון חוזרים לראשון – השרשרת סגורה.</p></section>`;
    printWin('דומינו מתמטי', Array.from({ length: Math.min(12, nSets) }, (_, k) => one(k)).join('') + key, `
      .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 4mm; }
      .tile { display: grid; grid-template-columns: 1fr 1fr; border: 1.2px dashed #555; min-height: 30mm; }
      .tile > div { display: flex; align-items: center; justify-content: center; text-align: center; padding: 2mm; font-size: 16pt; }
      .tile > div:first-child { border-left: 2px solid #000; }
      svg { max-width: 30mm; height: auto; } svg .on { fill: #888; } svg path, svg rect { fill: #fff; stroke: #000; stroke-width: 2; } svg path.on, svg rect.on { fill: #999; } .cg-dots circle { fill: #000; }
      .key li { font-size: 13pt; margin: 2mm 0; } .key svg { max-width: 14mm; vertical-align: middle; }`);
  }

  /* =========================================================
     בינגו – הרחבה של הבינגו הקיים: במחברת (כמו קודם) או לוחות מודפסים עם תשובות,
     3×3 / 4×4 / 5×5, מספר לוחות, תנאי ניצחון, בדיקת הכרזה לפי היסטוריית השאלות, דף בקרה, הדפסה בשחור-לבן.
     משחק מלא: הכיתה בוחרת בין שני תרגילים, משימה כיתתית שפותחת ג'וקר לכולם, הכרזה רק עם הסבר.
     ========================================================= */
  const oldBingoHome = window.bingoHome;
  let bgx = null;
  window.bingoHome = function bingoHome2() {
    stopRace(); stopMemory(); stopJeoTimer(); state = null; lessonView = null; navPush('bingo');
    const o = { how: 'print', src: (typeof BINGO_TRACKS !== 'undefined' && BINGO_TRACKS[0] ? BINGO_TRACKS[0].id : 'mul'), lv: '2', size: 4, count: 30, wins: ['row', 'col', 'diag'], mode: 'full', topic: GAME_PRE && TOPIC[GAME_PRE] ? GAME_PRE : '' };
    if (o.topic) o.src = 'topic';
    const draw = () => {
      app.innerHTML = `<div class="topbar"><span class="title">${ic('grid')} בינגו כיתתי</span><button class="secondary" id="bgHome">${ic('close')} יציאה</button></div>
        <div class="card race-intro"><p class="race-how">על המסך מופיעים תרגילים, ובלוחות של התלמידים – <b>התשובות</b>. כל אחד פותר ומסמן את התשובה בלוח שלו. המורה חושפת את התשובה ואת הדרך. <b>שורה, טור או אלכסון = בינגו!</b></p></div>
        <h2>איך משחקים?</h2>
        <div class="cg-modes"><button class="cg-mode${o.how === 'print' ? ' sel' : ''}" data-bh="print"><b>🖨️ לוחות מודפסים</b><span>לכל תלמיד לוח אחר עם תשובות. אפשר לבדוק כל הכרזה לפי מספר הלוח.</span></button>
          <button class="cg-mode${o.how === 'nb' ? ' sel' : ''}" data-bh="nb"><b>📓 במחברת</b><span>בלי הדפסה: כל אחד מצייר לוח וממלא מספרים מהרשימה (כמו קודם).</span></button></div>
        <h2>על מה משחקים?</h2>
        <div class="race-tracks">${BINGO_TRACKS.map(t => `<button class="race-track${o.src === t.id ? ' sel' : ''}" data-bsrc="${t.id}"><span class="nm">${t.name}</span></button>`).join('')}<button class="race-track${o.src === 'topic' ? ' sel' : ''}" data-bsrc="topic"><span class="nm">📚 נושא מהאתר</span></button></div>
        ${o.src === 'topic' ? `<div class="name-row" style="justify-content:center;flex-wrap:wrap"><select id="bgTopic" class="cg-sel"><option value="">בחרו נושא…</option>${gameTopics().map(t => `<option value="${t.id}" ${o.topic === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
          <span class="lbl2">רמה:</span>${chips('blv', [['1', 'רמה 1'], ['2', 'רמה 2'], ['3', 'רמה 3'], ['123', 'מדורג']], o.lv)}</div><p class="muted small center">רק שאלות עם תשובה מספרית ייכנסו לבינגו.</p>` : ''}
        <div class="name-row" style="justify-content:center;margin-top:10px"><span class="lbl2">גודל הלוח:</span>${chips('bsz', [['3', '3 × 3'], ['4', '4 × 4'], ...(o.how === 'print' ? [['5', '5 × 5']] : [])], String(o.size))}</div>
        ${o.how === 'print' ? `<div class="name-row" style="justify-content:center"><span class="lbl2">כמה לוחות להדפיס?</span><input id="bgCount" type="number" min="2" max="40" value="${o.count}" class="cg-num"></div>
          <div class="name-row" style="justify-content:center"><span class="lbl2">ניצחון:</span>${chips('bwin', Object.entries(CG.BINGO_WINS), o.wins, true)}</div>
          <h2>משחק פשוט או מלא?</h2>
          <div class="cg-modes"><button class="cg-mode${o.mode === 'simple' ? ' sel' : ''}" data-bm="simple"><b>משחק פשוט</b><span>תרגיל אחרי תרגיל, עד שמישהו אומר בינגו.</span></button>
            <button class="cg-mode${o.mode === 'full' ? ' sel' : ''}" data-bm="full"><b>משחק מלא</b><span>מדי פעם הכיתה בוחרת בין שני תרגילים. משימה כיתתית: כשרוב הכיתה צודקת – המד מתמלא ונפתח ג'וקר לכולם. מכריזים בינגו רק עם הסבר של תרגיל אחד.</span></button></div>` : ''}
        <p class="muted small center" id="bgMsg"></p>
        <div class="actions" style="justify-content:center"><button id="bgGo" class="race-go">${o.how === 'print' ? 'יצירת הלוחות ←' : 'ליצירת רשימת המספרים ←'}</button></div>`;
      $('bgHome').onclick = () => classSub('games');
      app.querySelectorAll('[data-bh]').forEach(b => b.onclick = () => { o.how = b.dataset.bh; if (o.how === 'nb' && o.size === 5) o.size = 4; draw(); });
      app.querySelectorAll('[data-bm]').forEach(b => b.onclick = () => { o.mode = b.dataset.bm; app.querySelectorAll('[data-bm]').forEach(x => x.classList.toggle('sel', x === b)); });
      app.querySelectorAll('[data-bsrc]').forEach(b => b.onclick = () => { o.src = b.dataset.bsrc; draw(); });
      if ($('bgTopic')) $('bgTopic').onchange = e => { o.topic = e.target.value; };
      bindChips('blv', false, v => { o.lv = v[0]; }); bindChips('bsz', false, v => { o.size = Number(v[0]); }); bindChips('bwin', true, v => { o.wins = v; });
      if ($('bgCount')) $('bgCount').onchange = e => { o.count = Math.max(2, Math.min(40, Number(e.target.value) || 30)); };
      $('bgGo').onclick = () => {
        const cells = o.size * o.size - (o.size === 5 ? 1 : 0), want = cells + (o.how === 'print' ? Math.max(6, Math.round(cells * 0.5)) : 0);
        const pool = bgPool(o, Math.max(want, o.size === 3 ? 18 : 30));
        if (o.how === 'nb') { const pre = o.src === 'topic' ? pool.map(q => ({ ans: q.ans, text: q.html, fig: '' })) : null; if (pre && pre.length < 11) { $('bgMsg').textContent = 'בנושא הזה אין מספיק שאלות עם תשובות שונות.'; return; } return bingoStart(o.src === 'topic' ? 'pre' : o.src, o.size, pre); }
        if (pool.length < cells + 2) { $('bgMsg').textContent = `בבחירה הזאת יש רק ${pool.length} תשובות שונות – צריך לפחות ${cells + 2} ללוח ${o.size} × ${o.size}. נסו לוח קטן יותר או נושא/רמה אחרים.`; return; }
        bgxStart(o, pool);
      };
    };
    draw(); window.scrollTo(0, 0);
  };
  // מאגר: תשובות שונות (מספריות), לכל אחת תרגיל
  function bgPool(o, want) {
    const byAns = new Map();
    if (o.src === 'topic') { const T = TOPIC[o.topic]; if (!T) return []; const lvs = o.lv === '123' ? [1, 2, 3] : [Number(o.lv)];
      for (let i = 0; i < 2500 && byAns.size < want; i++) { const lv = lvs[i % lvs.length], L = T.levels[lv]; if (!L || !L.length) continue; let q; try { q = mk(o.topic, lvGen(T, lv), lv); } catch (e) { continue; } if (!gameNum(q) || q.fig) continue; const k = String(CG.r6(q.ans)); if (!byAns.has(k)) byAns.set(k, { ans: q.ans, html: q.text, sol: q.exp || '', lv }); } }
    else for (let i = 0; i < 5000 && byAns.size < want; i++) { const q = raceQ(o.src); if (typeof q.ans !== 'number') continue; const k = String(CG.r6(q.ans)); if (!byAns.has(k)) byAns.set(k, { ans: q.ans, html: M(`${q.t} ${BOX}`), sol: M(`${q.t} ${fmt(q.ans)}`) }); }
    return [...byAns.values()];
  }
  function bgxStart(o, pool) {
    const code = R(1000, 9999), size = o.size, free = size === 5;
    const P = shuffle(pool.slice()).slice(0, Math.min(pool.length, size * size - (free ? 1 : 0) + Math.max(6, Math.round(size * size * 0.5))));
    const ans = P.map(q => String(CG.r6(q.ans))), boards = CG.bingoBoards(ans, size, o.count, code, free);
    bgx = { o, code, size, free, P, ans, boards, order: shuffle(P.map((_, i) => i)), k: -1, vote: null, meter: 0, joker: 0, hist: [] };
    bgxReady();
  }
  const bgName = o => o.src === 'topic' ? (TOPIC[o.topic] ? TOPIC[o.topic].name : '') : (BINGO_TRACKS.find(t => t.id === o.src) || { name: '' }).name;
  function bgxReady() {
    const B = bgx;
    app.innerHTML = `<div class="topbar"><span class="title">${ic('grid')} בינגו – ${bgName(B.o)}</span><span class="toollinks">${fsBtnHTML()}<button class="secondary" id="bgBack">${ic('close')} יציאה</button></span></div>
      <div class="card center"><h2>${B.o.count} לוחות מוכנים · קוד <span data-raw>${B.code}</span></h2>
        <p class="race-how">בכל לוח ${B.size * B.size - (B.free ? 1 : 0)} תשובות מתוך ${B.P.length} התרגילים במשחק${B.free ? ' (באמצע – משבצת חינם)' : ''}. לכל לוח יש מספר – כך אפשר לבדוק כל הכרזה.</p>
        <div class="actions" style="justify-content:center"><button class="secondary" id="bgPrint">🖨️ הדפסת הלוחות (שחור-לבן, חסכוני)</button><button class="secondary" id="bgCtl">🖨️ דף בקרה למורה</button></div>
        <div class="actions" style="justify-content:center"><button class="race-go" id="bgStart">כולם עם לוח? מתחילים! ←</button></div></div>`;
    fsBind();
    $('bgBack').onclick = () => bingoHome();
    $('bgPrint').onclick = bgPrintBoards; $('bgCtl').onclick = () => bgPrintCtl(false);
    $('bgStart').onclick = () => { bgx.k = 0; bgxDraw(); };
  }
  function bgCellHTML(v) { if (v === null) return '<div class="c free">★</div>'; const q = bgx.P[bgx.ans.indexOf(v)]; return `<div class="c">${M(fmt(q.ans))}</div>`; }
  function bgPrintBoards() {
    const B = bgx, per = B.size === 5 ? 2 : 4, pages = [];
    for (let i = 0; i < B.boards.length; i += per) pages.push(`<section class="pg"><div class="grid g${per}">${B.boards.slice(i, i + per).map((b, j) => `<div class="bd"><div class="hd"><b>בינגו – ${bgName(B.o)}</b><span>לוח מס' ${i + j + 1}</span></div><div class="cells s${B.size}">${b.map(bgCellHTML).join('')}</div><div class="nm">שם: ________________</div></div>`).join('')}</div></section>`);
    printWin('לוחות בינגו', pages.join(''), `.grid { display: grid; gap: 6mm; } .grid.g4 { grid-template-columns: 1fr 1fr; } .grid.g2 { grid-template-columns: 1fr; }
      .bd { border: 1.5px solid #000; padding: 3mm; } .hd { display: flex; justify-content: space-between; font-size: 11pt; margin-bottom: 2mm; }
      .cells { display: grid; border-top: 1px solid #000; border-right: 1px solid #000; } .cells.s3 { grid-template-columns: repeat(3, 1fr); } .cells.s4 { grid-template-columns: repeat(4, 1fr); } .cells.s5 { grid-template-columns: repeat(5, 1fr); }
      .c { border-left: 1px solid #000; border-bottom: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 18pt; font-weight: 700; } .g4 .c { height: 22mm; } .g2 .c { height: 21mm; } .s3 .c { height: 26mm; }
      .c.free { font-size: 22pt; color: #444; } .nm { font-size: 10pt; margin-top: 2mm; }`);
  }
  function bgPrintCtl() {
    const B = bgx, called = new Set(B.order.slice(0, B.k + 1));
    const rows = B.order.map((pi, k) => { const q = B.P[pi]; return `<tr><td>${k + 1}</td><td>${q.html}</td><td><b>${M(fmt(q.ans))}</b></td><td>${B.k >= 0 && called.has(pi) ? '✓' : ''}</td></tr>`; }).join('');
    const boards = B.boards.map((b, i) => `<div class="mini"><b>${i + 1}</b> ${b.map(v => v === null ? '★' : M(fmt(Number(v)))).join(' · ')}</div>`).join('');
    printWin('דף בקרה – בינגו', `<section class="pg"><h1>דף בקרה – בינגו (${bgName(B.o)})</h1><div class="small">קוד ${B.code} · ${B.o.count} לוחות ${B.size}×${B.size} · ניצחון: ${B.o.wins.map(w => CG.BINGO_WINS[w]).join(' / ')}</div>
      <h2>סדר התרגילים</h2><table><tr><th>#</th><th>תרגיל</th><th>תשובה</th><th>נקרא</th></tr>${rows}</table></section>
      <section class="pg"><h2>התשובות בכל לוח</h2>${boards}</section>`, `table { border-collapse: collapse; width: 100%; font-size: 11pt; } td, th { border: 1px solid #000; padding: 1.5mm 2mm; text-align: right; } .mini { font-size: 9.5pt; margin: 1mm 0; }`);
  }
  function bgxDraw() {
    navPush('bingo');
    const B = bgx, full = B.o.mode === 'full', pi = B.order[B.k], q = B.P[pi], doneN = B.k + 1;
    // בחירת הכיתה: בכל תרגיל רביעי – שני תרגילים, הכיתה מצביעה
    const vote = full && B.k > 0 && B.k % 4 === 0 && B.k + 1 < B.order.length && B.vote !== B.k;
    app.innerHTML = `<div class="topbar"><span class="title">${ic('grid')} בינגו – ${bgName(B.o)}</span><span class="toollinks">${fsBtnHTML()}<button class="secondary" id="bgBack">${ic('close')} יציאה</button></span></div>
      ${full ? `<div class="cg-meter"><span>🎯 משימה כיתתית: ${B.meter} / 5 – כשרוב הכיתה פותרת נכון, המד מתמלא. מד מלא = ג'וקר לכולם!</span><i style="--p:${B.meter * 20}%"></i></div>` : ''}
      ${B.jokerMsg ? `<div class="cg-msg">🃏 <b>ג'וקר לכולם!</b> כל תלמיד מסמן משבצת אחת לבחירתו – תחשבו איזו משבצת הכי מקרבת אתכם לבינגו.</div>` : ''}
      <div class="card center bg-call">
        ${vote ? `<div class="muted">🗳️ <b>הכיתה בוחרת!</b> איזה תרגיל נפתור עכשיו? (מצביעים – והשני יחכה)</div>
          <div class="bg-vote">${[pi, B.order[B.k + 1]].map((x, j) => `<button class="bg-vopt" data-vote="${j}"><span class="od-l">${LET[j]}</span><span class="bg-ex bg-q">${B.P[x].html}</span></button>`).join('')}</div>`
        : `<div class="muted">תרגיל ${doneN} מתוך ${B.order.length}</div><div class="bg-ex bg-q">${q.html}</div>
          ${B.show ? `<div class="fb ok">התשובה: <b>${M(fmt(q.ans))}</b>${q.sol && q.sol !== q.html ? `<div class="small">${q.sol}</div>` : ''}</div>` : ''}
          <div class="actions" style="justify-content:center">${B.show ? '' : '<button class="secondary" id="bgShow">חשיפת התשובה והדרך</button>'}
            ${full && B.show && !B.rated ? `<span class="lbl2">כמה צדקו?</span><button class="ghost" data-rate="2">רוב הכיתה</button><button class="ghost" data-rate="1">בערך חצי</button><button class="ghost" data-rate="0">מעטים – נסביר שוב</button>` : ''}
            ${B.k + 1 < B.order.length ? `<button id="bgNext" class="race-go">התרגיל הבא ←</button>` : '<b>אלה כל התרגילים!</b>'}</div>`}
      </div>
      <div class="card"><div class="actions" style="justify-content:center"><b>מישהו אמר בינגו?</b> <span class="lbl2">לוח מס':</span><input id="bgNo" type="number" min="1" max="${B.boards.length}" class="cg-num"><button id="bgCheck">🔎 בדיקה</button><button class="ghost" id="bgCtl2">🖨️ דף בקרה</button></div>
        <div class="muted small">התרגילים שכבר היו:</div>
        <div class="bg-hist">${B.order.slice(0, doneN).reverse().map((x, j) => `<span>${doneN - j}. ${M(fmt(B.P[x].ans))}</span>`).join('')}</div></div>`;
    fsBind();
    $('bgBack').onclick = () => { if (confirm('לצאת מהבינגו?')) bingoHome(); };
    $('bgCtl2').onclick = () => bgPrintCtl();
    app.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => { if (b.dataset.vote === '1') [B.order[B.k], B.order[B.k + 1]] = [B.order[B.k + 1], B.order[B.k]]; B.vote = B.k; bgxDraw(); });
    if ($('bgShow')) $('bgShow').onclick = () => { B.show = true; bgxDraw(); };
    app.querySelectorAll('[data-rate]').forEach(b => b.onclick = () => { B.rated = true; if (b.dataset.rate === '2') B.meter++; if (B.meter >= 5) { B.meter = 0; B.jokerMsg = true; B.joker++; } bgxDraw(); });
    if ($('bgNext')) $('bgNext').onclick = () => { B.k++; B.show = false; B.rated = false; B.jokerMsg = false; bgxDraw(); };
    $('bgCheck').onclick = () => bgCheck(Number($('bgNo').value));
  }
  function bgCheck(no) {
    const B = bgx; if (!(no >= 1 && no <= B.boards.length)) return;
    const called = new Set(B.order.slice(0, B.k + 1).map(i => B.ans[i])), b = B.boards[no - 1], r = CG.bingoCheck(b, B.size, called, B.o.wins);
    const ex = r.lines.length ? B.P[B.ans.indexOf(pick(r.lines[0].idx.map(i => b[i]).filter(v => v !== null)))] : null;
    cgModal(`<h3>🔎 בדיקת לוח מס' ${no}</h3>
      <div class="bg-chk s${B.size}">${b.map((v, i) => `<div class="${r.on[i] ? 'on' : ''}${r.lines.some(L => L.idx.includes(i)) ? ' win' : ''}">${v === null ? '★' : M(fmt(Number(v)))}</div>`).join('')}</div>
      ${r.lines.length ? `<div class="fb ok">🎉 <b>בינגו אמיתי!</b> ${r.lines.map(L => L.name).join(', ')}.${B.o.mode === 'full' && ex ? `<br>💬 לפני שמכריזים – הסבירו לכיתה איך פתרתם את: ${ex.html}` : ''}${B.joker ? '<br><span class="small">(אם התלמיד השתמש בג\'וקר – משבצת אחת יכולה להיות מסומנת בלי שנקראה.)</span>' : ''}</div>`
      : `<div class="fb hint">עוד לא בינגו. המשבצות הצבועות – תשובות שכבר נקראו. ${B.o.wins.includes('full') && B.o.wins.length === 1 ? `חסרות ${r.missing.length} משבצות.` : ''}${B.joker ? ' (אם השתמשו בג\'וקר – אפשר להוסיף משבצת אחת.)' : ''}</div>`}
      <div class="actions" style="justify-content:center"><button data-x>חזרה למשחק</button></div>`);
  }

  /* ---------------- כרטיסים באזור "משחק לכל הכיתה" ---------------- */
  window.cgCardsHTML = () => `
    <h3 class="games-sub">משחקים חדשים – חשיבה, הנמקה ואסטרטגיה</h3>
    <button class="game-card" id="hxGo"><span class="gc-ic" style="--gw:rgba(47,91,211,0.35)">⬢</span><span class="gc-nm">פיצוחים</span><span class="gc-ds">2 או 4 קבוצות על לוח משושים: כובשים בתשובה נכונה, בונים מסלול מצד לצד, חוסמים – ומפצחים חסימות.</span></button>
    <button class="game-card" id="mdGo"><span class="gc-ic" style="--gw:rgba(217,72,43,0.35)">🔍</span><span class="gc-nm">בלשי הטעויות</span><span class="gc-ds">פתרון של תלמיד דמיוני עם טעות אופיינית: איפה הטעות, למה, ואיך מתקנים? נקודות על איתור, הסבר ותיקון.</span></button>
    <button class="game-card" id="esGo"><span class="gc-ic" style="--gw:rgba(44,122,91,0.35)">🎯</span><span class="gc-nm">כמה זה בערך?</span><span class="gc-ds">אומדן ותובנה מספרית: עיגול, מספרים נוחים ומספרי ייחוס. בוחרים כמה להסתכן – רשת רחבה או "בול".</span></button>
    <button class="game-card" id="tgGo"><span class="gc-ic" style="--gw:rgba(226,179,87,0.6)">🎲</span><span class="gc-nm">מספר המטרה</span><span class="gc-ds">מגיעים למספר המטרה מהמספרים הנתונים. בונוס לדרך שאף קבוצה לא מצאה.</span></button>
    <button class="game-card" id="odGo"><span class="gc-ic" style="--gw:rgba(138,92,209,0.35)">🧩</span><span class="gc-nm">מה לא שייך?</span><span class="gc-ds">ארבעה פריטים – איזה לא שייך, ולמה? לעתים יש כמה תשובות נכונות, והנימוק הוא העיקר.</span></button>
    <button class="game-card" id="doGo"><span class="gc-ic" style="--gw:rgba(217,130,43,0.4)">🁫</span><span class="gc-nm">דומינו מתמטי</span><span class="gc-ds">שרשרת של ייצוגים שווים – על הלוח לכל הכיתה, או ערכת קלפים להדפסה לעבודה בקבוצות.</span></button>`;
  window.cgCardsBind = () => { const on = (id, f) => { if ($(id)) $(id).onclick = f; }; on('hxGo', hxHome); on('mdGo', mdHome); on('esGo', esHome); on('tgGo', tgHome); on('odGo', odHome); on('doGo', doHome); };
  Object.assign(window, { hxHome, mdHome, esHome, tgHome, odHome, doHome, cgDebug: () => ({ cg, bgx }) });
})();
