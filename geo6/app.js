/* גופים ומעגל – כיתה ו': ממשק הפרק (רשימת שיעורים, הקניה, כלל, תרגול, מחברת, כרטיס יציאה, הדפסה).
   שני מצבים לאותו תוכן: "הקרנה בכיתה" (המורה חושפת הסברים ותשובות) ו"לומדים לבד" (משוב מיידי לפי סוג הטעות). */
(function () {
  'use strict';
  const S3 = window.S3, G6 = window.G6, COL = S3.COL;
  const { M, shuffle, fmt } = G6;
  const $ = id => document.getElementById(id);
  const app = $('app');
  const URLP = new URLSearchParams(location.search);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* לא חובה */ } } };
  const raw = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  // אותם מפתחות תפקידים כמו באתר ובמאמן
  const irisOk = () => raw('math-book-key') === 'e1050f14' || raw('math-teacher-key') === '3d9bf467';
  const staffOn = () => !irisOk() && raw('math-role') === 't' && raw('math-staff-key') === '1a9e025e';
  const teacher = () => (irisOk() || staffOn()) && raw('math-role') !== 's' && raw('math-preview') !== '1';
  const VER = document.querySelector('.ver') ? document.querySelector('.ver').textContent.replace(/[^\d.]/g, '') : '';

  /* ---------- דיווח לאתר הבקרה (אותו טופס כמו האתר) ---------- */
  const TRACK = { form: 'https://docs.google.com/forms/d/e/1FAIpQLScbU-3oB6Sx3hsec4cxoQQUWUfSnuvGH8X7DOKLR5hldhe6CA/formResponse', f: { device: 'entry.218291459', grade: 'entry.2065505054', name: 'entry.1804780443', action: 'entry.285567241', detail: 'entry.1501454704' } };
  const storeName = () => { try { return (JSON.parse(localStorage.getItem('math6-practice-v2') || '{}').name || '').trim(); } catch (e) { return ''; } };
  let NAME = storeName();
  function track(action, detail) {
    if (!TRACK.form || URLP.has('notrack') || irisOk() || URLP.get('exit') === 'o') return;
    try {
      const nm = staffOn() ? 'מורה: ' + (NAME || 'ללא שם') : NAME;
      const body = new URLSearchParams({ [TRACK.f.device]: 'גופים v' + VER, [TRACK.f.grade]: '6', [TRACK.f.name]: nm, [TRACK.f.action]: 'גופים: ' + action, [TRACK.f.detail]: String(detail).slice(0, 200) });
      fetch(TRACK.form, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => {});
    } catch (e) { /* לא חובה */ }
  }

  /* ---------- מבנה הפרקים ---------- */
  const CHAPTERS = [
    { id: 'prism', no: 1, title: 'מנסרה (כולל קובייה ותיבה)', icon: '🏛️', ready: true },
    { id: 'pyr', no: 2, title: 'פירמידה', icon: '🔺', site: [['גופים – הכרה ותכונות', 'solids'], ['גופים – פריסות', 'solidsN']] },
    { id: 'circle', no: 3, title: 'מעגל ועיגול', icon: '⭕' },
    { id: 'cyl', no: 4, title: 'גליל', icon: '🥫', site: [['גופים – פריסות', 'solidsN']] },
    { id: 'cone', no: 5, title: 'חרוט', icon: '🍦', site: [['גופים – פריסות', 'solidsN']] },
    { id: 'sphere', no: 6, title: 'כדור', icon: '⚽' },
    { id: 'reg', no: 7, title: 'גופים משוכללים + סיכום ואתגר', icon: '💎' }
  ];
  const LESSONS = [...G6.LESSONS_A, ...G6.LESSONS_B];
  const UNITS = LESSONS.flatMap(L => L.subs ? L.subs : [L]); // יחידות עם תוכן (שיעור 4 = 6 תת-יחידות)
  const unitById = id => UNITS.find(u => u.id === id);
  const parentOf = u => LESSONS.find(L => L.subs && L.subs.includes(u));
  const siteHref = t => `math6.html?grade=6&topic=${t}`;

  /* ---------- התקדמות (רק במכשיר) ---------- */
  let PROG = ls.get('geo6-prog', {});
  const P = id => (PROG[id] = PROG[id] || { teach: 0, rule: 0, lv: {}, nb: 0 });
  const saveP = () => ls.set('geo6-prog', PROG);
  const partsDone = id => { const p = PROG[id] || {}; return [!!p.teach, !!p.rule, Object.values(p.lv || {}).some(v => v >= 70), !!p.nb]; };
  const unitDone = id => partsDone(id).every(Boolean);

  /* ---------- מצב: הקרנה בכיתה / לומדים לבד ---------- */
  let MODE = ls.get('geo6-mode', null) || (teacher() ? 'class' : 'solo');
  const isClass = () => MODE === 'class';
  function setMode(m) { MODE = m; ls.set('geo6-mode', m); document.documentElement.classList.toggle('proj', m === 'class'); route(); }
  document.documentElement.classList.toggle('proj', isClass());
  const modeBar = () => `<div class="modes" role="group" aria-label="מצב שימוש"><button type="button" class="mb${isClass() ? ' on' : ''}" data-mode="class" aria-pressed="${isClass()}">🎦 הקרנה בכיתה</button><button type="button" class="mb${!isClass() ? ' on' : ''}" data-mode="solo" aria-pressed="${!isClass()}">🧑‍🎓 לומדים לבד</button></div>`;
  const bindModes = root => root.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));

  /* ---------- ניווט ---------- */
  let NAV = { v: 'chapter' };
  function go(v, push = true) { NAV = v; if (push) { try { history.pushState(v, '', urlOf(v)); } catch (e) { /* לא חובה */ } } route(); window.scrollTo(0, 0); }
  const urlOf = v => { const u = new URL(location.href); ['l', 'p', 'v'].forEach(k => u.searchParams.delete(k)); if (v.l) u.searchParams.set('l', v.l); if (v.p) u.searchParams.set('p', v.p); if (v.v && v.v !== 'chapter' && v.v !== 'lesson') u.searchParams.set('v', v.v); return u.pathname + u.search; };
  window.addEventListener('popstate', e => { NAV = e.state || { v: 'chapter' }; route(); });
  function route() {
    stopAll();
    if (NAV.v === 'home') return homeView();
    if (NAV.v === 'lesson' && unitById(NAV.l)) return lessonView(unitById(NAV.l), NAV.p || 'teach');
    if (NAV.v === 'exit') return exitView();
    if (NAV.v === 'review') return reviewView();
    if (NAV.v === 'chapters') return homeView();
    return chapterView();
  }
  let timers = [];
  const stopAll = () => { timers.forEach(t => clearInterval(t)); timers = []; };

  /* ---------- מסך הפרקים (7 פרקי "גופים ומעגל") ---------- */
  function homeView() {
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="math6.html?grade=6">mathinclass</a> › גאומטריה › גופים ומעגל</div>
      <h1>גופים ומעגל – כיתה ו'</h1><p class="muted">שבעה פרקים, לפי סדר הפרקים בספר "שבילים פלוס – גאומטריה לכיתה ו'". כרגע בנוי פרק 1; הפרקים האחרים בבנייה – בינתיים יש תרגול באתר.</p>
      <div class="chap-list">${CHAPTERS.map(c => `<div class="chap${c.ready ? '' : ' soon'}"><span class="chap-no">${c.no}</span><span class="chap-i" aria-hidden="true">${c.icon}</span><div class="chap-b"><b>${c.title}</b>${c.ready ? `<span class="muted"> · 5 שיעורים</span>` : '<span class="tag">בקרוב</span>'}
        ${c.site ? `<div class="chap-site">בינתיים באתר: ${c.site.map(([n, t]) => `<a href="${siteHref(t)}">${n}</a>`).join(' · ')}</div>` : ''}</div>${c.ready ? `<button type="button" class="btn" data-ch="${c.id}">לפרק ←</button>` : ''}</div>`).join('')}</div></div>`;
    app.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => go({ v: 'chapter' }));
  }

  /* ---------- מסך הפרק: רשימת השיעורים עם סימון התקדמות ---------- */
  const PARTS = [['teach', 'לומדים'], ['rule', 'מה גילינו?'], ['prac', 'תרגול'], ['nb', 'מחברת']];
  const dots = id => { const d = partsDone(id); return `<span class="dots" aria-label="${d.filter(Boolean).length} מתוך 4 חלקים">${PARTS.map((p, i) => `<span class="dot${d[i] ? ' on' : ''}" title="${p[1]}${d[i] ? ' ✓' : ''}"></span>`).join('')}</span>`; };
  function chapterView() {
    const row = (u, sub) => `<div class="lrow${sub ? ' sub' : ''}${unitDone(u.id) ? ' done' : ''}"><button type="button" class="lgo" data-l="${u.id}"><span class="lno">${u.no}</span><span class="li" aria-hidden="true">${u.icon}</span><span class="lt"><b>${u.title}</b><span class="muted small">${u.goal}</span></span>${dots(u.id)}${unitDone(u.id) ? '<span class="ok-badge">✓ הושלם</span>' : ''}</button>
      <div class="lparts">${PARTS.map(([p, n]) => `<button type="button" class="chip" data-l="${u.id}" data-p="${p}">${n}</button>`).join('')}<button type="button" class="chip ghost" data-print="${u.id}">🖨️ דף עבודה</button></div></div>`;
    const done = UNITS.filter(u => unitDone(u.id)).length;
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="math6.html?grade=6">mathinclass</a> › <a href="#" data-home>גופים ומעגל</a> › פרק 1</div>
      <div class="ch-head"><div><h1>פרק 1 – מנסרה</h1><p class="muted">כולל קובייה ותיבה · 5 שיעורים · בוחרים כל שיעור וכל חלק בחופשיות – בלי אבחון ובלי נעילה.</p></div>${modeBar()}</div>
      <div class="prog"><span class="mbar"><span style="width:${Math.round(done / UNITS.length * 100)}%"></span></span><span class="small muted">${done} מתוך ${UNITS.length} יחידות הושלמו</span></div>
      <p class="legend small muted">בכל שיעור 4 חלקים: <span class="dot on"></span> לומדים · מה גילינו? · תרגול · מחברת</p>
      <div class="lessons">${LESSONS.map(L => L.subs ? `<div class="lgroup"><div class="lgh"><span class="lno">${L.no}</span><span class="li">${L.icon}</span><b>${L.title}</b><span class="muted small"> – ${L.goal}</span></div>${L.subs.map(u => row(u, true)).join('')}</div>` : row(L)).join('')}</div>
      <div class="end-row"><button type="button" class="btn sec" data-review>🔁 תרגול סיכום הפרק</button><button type="button" class="btn" data-exit>🎫 כרטיס יציאה לפרק</button>${teacher() ? '<button type="button" class="btn ghost" data-exitp>🖨️ כרטיס יציאה וטבלת מעקב להדפסה</button>' : ''}</div>
      <p class="small muted src-note">התאמה: לפי סדר ונושאי הפרק "מנסרה" בספר שבילים פלוס (לפי תוכן העניינים – לא לפי דפי הספר) ותכנית הלימודים לכיתה ו' (עמ' 136–140). בכיתה ו' לומדים גופים ישרים בלבד.</p></div>`;
    bindModes(app);
    app.querySelector('[data-home]').onclick = e => { e.preventDefault(); go({ v: 'home' }); };
    app.querySelectorAll('[data-l]').forEach(b => b.onclick = () => go({ v: 'lesson', l: b.dataset.l, p: b.dataset.p || firstOpen(b.dataset.l) }));
    app.querySelectorAll('[data-print]').forEach(b => b.onclick = () => printSheet(unitById(b.dataset.print)));
    app.querySelector('[data-review]').onclick = () => go({ v: 'review' });
    app.querySelector('[data-exit]').onclick = () => go({ v: 'exit' });
    const ep = app.querySelector('[data-exitp]'); if (ep) ep.onclick = printExit;
  }
  const firstOpen = id => { const d = partsDone(id), i = d.indexOf(false); return PARTS[i < 0 ? 0 : i][0]; };

  /* ---------- מסך שיעור ---------- */
  function lessonView(u, part) {
    const i = UNITS.indexOf(u), prev = UNITS[i - 1], next = UNITS[i + 1], par = parentOf(u);
    app.innerHTML = `<div class="wrap lesson"><div class="crumbs"><a href="#" data-ch>פרק 1 – מנסרה</a> › ${par ? `שיעור ${par.no} › ` : ''}${u.no}</div>
      <div class="ch-head"><h1><span class="lno big">${u.no}</span> ${u.title}</h1>${modeBar()}</div>
      <p class="goal">🎯 ${u.goal}</p>
      <nav class="ptabs" role="tablist">${PARTS.map(([p, n], k) => `<button type="button" role="tab" class="ptab${p === part ? ' on' : ''}" aria-selected="${p === part}" data-p="${p}"><span class="pl">${'אבגד'[k]}</span> ${n}${partsDone(u.id)[k] ? ' ✓' : ''}</button>`).join('')}</nav>
      <section id="pbody"></section>
      <div class="lnav">${prev ? `<button type="button" class="btn ghost" data-go="${prev.id}">→ ${prev.no}. ${prev.title}</button>` : '<span></span>'}${next ? `<button type="button" class="btn ghost" data-go="${next.id}">${next.no}. ${next.title} ←</button>` : `<button type="button" class="btn ghost" data-exit>🎫 לכרטיס היציאה ←</button>`}</div></div>`;
    bindModes(app);
    app.querySelector('[data-ch]').onclick = e => { e.preventDefault(); go({ v: 'chapter' }); };
    app.querySelectorAll('.ptab').forEach(b => b.onclick = () => go({ v: 'lesson', l: u.id, p: b.dataset.p }));
    app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go({ v: 'lesson', l: b.dataset.go, p: 'teach' }));
    const ex = app.querySelector('[data-exit]'); if (ex) ex.onclick = () => go({ v: 'exit' });
    const body = $('pbody');
    if (part === 'teach') teachPart(u, body);
    else if (part === 'rule') rulePart(u, body);
    else if (part === 'prac') pracPart(u, body);
    else nbPart(u, body);
  }

  /* ----- א. לומדים (הקניה צעד-צעד) ----- */
  function teachPart(u, body) {
    let k = 0;
    const show = () => {
      const st = u.teach[k];
      body.innerHTML = `<div class="steps-bar">${u.teach.map((s, j) => `<button type="button" class="sdot${j === k ? ' on' : ''}${j < k ? ' past' : ''}" data-k="${j}" aria-label="שלב ${j + 1}: ${esc(s.t)}">${j + 1}</button>`).join('')}</div>
        <article class="tstep card"><h2>${st.t}</h2><div class="thtml">${st.html}</div><div class="tq"></div>
        ${st.reveal ? `<div class="reveal"><button type="button" class="btn sec rv-b">💡 מה גילינו?</button><div class="rv-t note" hidden>${st.reveal}</div></div>` : ''}</article>
        <div class="snav"><button type="button" class="btn ghost" data-prev ${k ? '' : 'disabled'}>→ הקודם</button><span class="muted small">שלב ${k + 1} מתוך ${u.teach.length}</span>${k < u.teach.length - 1 ? '<button type="button" class="btn" data-next>הבא ←</button>' : '<button type="button" class="btn" data-fin>לסיכום: מה גילינו? ←</button>'}</div>`;
      body.querySelectorAll('.sdot').forEach(b => b.onclick = () => { k = +b.dataset.k; show(); });
      const pv = body.querySelector('[data-prev]'); if (pv) pv.onclick = () => { k--; show(); };
      const nx = body.querySelector('[data-next]'); if (nx) nx.onclick = () => { k++; show(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      const fn = body.querySelector('[data-fin]'); if (fn) fn.onclick = () => { P(u.id).teach = 1; saveP(); track('לומדים', `מנסרה ${u.no}`); go({ v: 'lesson', l: u.id, p: 'rule' }); };
      const rb = body.querySelector('.rv-b'); if (rb) rb.onclick = () => { body.querySelector('.rv-t').hidden = false; rb.hidden = true; };
      if (st.q) mountQ(body.querySelector('.tq'), st.q, { teach: true, onDone: ok => { if (!isClass() && rb) { body.querySelector('.rv-t').hidden = false; rb.hidden = true; } } });
      if (st.setup) SETUPS[st.setup](body.querySelector('.thtml'), st, u);
      if (k === u.teach.length - 1) { P(u.id).teach = 1; saveP(); }
    };
    show();
  }

  /* ----- ב. מה גילינו? (כלל + דוגמה פתורה) ----- */
  function rulePart(u, body) {
    const ex = u.gens[1][0]();
    body.innerHTML = `<article class="card rule-card"><h2>📌 מה גילינו?</h2>${u.rule}</article>
      <article class="card"><h3>✏️ דוגמה פתורה</h3><div class="wq">${ex.text}</div>${figHTML(ex)}<div class="note">${ex.type === 'num' ? `<b>תשובה:</b> ${fmt(ex.ans)} ${ex.unit || ''}<br>` : `<b>תשובה:</b> ${ex.choices.find(c => c.ok).t}<br>`}${ex.exp}</div><button type="button" class="btn ghost" data-more>דוגמה נוספת</button></article>
      <div class="snav"><span></span><button type="button" class="btn" data-go>לתרגול ←</button></div>`;
    P(u.id).rule = 1; saveP();
    body.querySelector('[data-more]').onclick = () => rulePart(u, body);
    body.querySelector('[data-go]').onclick = () => go({ v: 'lesson', l: u.id, p: 'prac' });
  }

  /* ----- ג. תרגול: 3 רמות, 10 שאלות בסבב, משוב לפי סוג הטעות ----- */
  const LV_DESC = { 1: 'רמה 1 – עיקרון אחד, עם ציור', 2: 'רמה 2 – קשרים, חושבים הפוך, שאלות מילוליות', 3: 'רמה 3 – בדיקת טענה, ניתוח טעות, ניבוי והנמקה' };
  const ROUND = 10;
  function pracPart(u, body) {
    const best = (P(u.id).lv || {});
    body.innerHTML = `<article class="card"><h2>🎯 בוחרים רמה</h2><p class="muted">כל סבב – ${ROUND} שאלות רק על הנושא של השיעור. אפשר להתחיל מכל רמה.</p>
      <div class="lv-pick">${[1, 2, 3].map(l => `<button type="button" class="lvb" data-lv="${l}"><b>${'⭐'.repeat(l)} רמה ${l}</b><span>${LV_DESC[l].split(' – ')[1]}</span>${best[l] != null ? `<span class="best">הכי טוב: ${best[l]}%</span>` : ''}</button>`).join('')}
      <button type="button" class="lvb mixed" data-lv="0"><b>📶 מדורג</b><span>3 שאלות ברמה 1, 4 ברמה 2, 3 ברמה 3</span></button></div>
      ${u.site ? `<p class="small muted">עוד תרגול באתר: ${u.site.map(([n, t]) => `<a href="${siteHref(t)}">${n}</a>`).join(' · ')}</p>` : ''}</article>`;
    body.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => runRound(u, body, +b.dataset.lv));
  }
  // בניית סבב: מסבבים בין המחוללים של הרמה, בלי שאלה זהה פעמיים
  function buildRound(u, lv, n = ROUND) {
    const plan = lv ? Array(n).fill(lv) : [1, 1, 1, 2, 2, 2, 2, 3, 3, 3];
    const out = [], seen = new Set(), ptr = {};
    plan.forEach(l => {
      const gens = u.gens[l]; let q;
      for (let t = 0; t < 30; t++) { ptr[l] = (ptr[l] ?? Math.floor(Math.random() * gens.length)); const g = gens[ptr[l] % gens.length]; q = g(); if (!seen.has(q.text + (q.fig ? q.fig.svg || '' : ''))) break; }
      ptr[l]++; seen.add(q.text + (q.fig ? q.fig.svg || '' : '')); q.lv = l; out.push(q);
    });
    return out;
  }
  function runRound(u, body, lv, list, opts = {}) {
    const qs = list || buildRound(u, lv), res = [];
    let k = 0;
    const show = () => {
      const q = qs[k];
      body.innerHTML = `<div class="qhead"><span class="muted">${opts.title || (lv ? 'רמה ' + lv : 'מדורג')} · שאלה ${k + 1} מתוך ${qs.length}</span><span class="qbar"><span style="width:${k / qs.length * 100}%"></span></span>${q.lv ? `<span class="lvtag">רמה ${q.lv}</span>` : ''}</div><div class="qbox card"></div>`;
      mountQ(body.querySelector('.qbox'), q, Object.assign({}, opts, { onNext: r => { res.push(r); k++; if (k < qs.length) show(); else finish(); } }));
    };
    const finish = () => {
      const first = res.filter(r => r.first).length, pct = Math.round(first / qs.length * 100);
      if (!opts.exam && u) { const p = P(u.id); p.lv = p.lv || {}; const key = lv || 'm'; p.lv[key] = Math.max(p.lv[key] || 0, pct); saveP(); track('תרגול', `מנסרה ${u.no} · ${lv ? 'רמה ' + lv : 'מדורג'} · ${first}/${qs.length}`); }
      if (opts.onFinish) return opts.onFinish(res, qs, body);
      const kinds = {}; res.forEach((r, i) => { if (!r.first && r.why) kinds[r.why] = (kinds[r.why] || 0) + 1; });
      body.innerHTML = `<article class="card done-card"><h2>${pct >= 80 ? '🌟 מצוין!' : pct >= 60 ? '👍 יפה!' : '💪 ממשיכים להתאמן'}</h2>
        <p class="big-num">${first} / ${qs.length}</p><p class="muted">נכון בניסיון הראשון${res.some(r => r.helped) ? ` · נעזרתם בהסבר נוסף ב-${res.filter(r => r.helped).length} שאלות` : ''}</p>
        ${Object.keys(kinds).length ? `<div class="note"><b>שימו לב לטעויות שחזרו:</b><ul>${Object.entries(kinds).slice(0, 3).map(([w]) => `<li>${w}</li>`).join('')}</ul></div>` : ''}
        <div class="end-row"><button type="button" class="btn" data-again>סבב נוסף ברמה הזו</button>${lv && lv < 3 ? `<button type="button" class="btn sec" data-up>לרמה ${lv + 1} ←</button>` : ''}<button type="button" class="btn ghost" data-lvs>בחירת רמה</button>${u ? '<button type="button" class="btn ghost" data-nb>✏️ למשימת המחברת</button>' : ''}</div></article>`;
      body.querySelector('[data-again]').onclick = () => runRound(u, body, lv);
      const up = body.querySelector('[data-up]'); if (up) up.onclick = () => runRound(u, body, lv + 1);
      body.querySelector('[data-lvs]').onclick = () => pracPart(u, body);
      const nb = body.querySelector('[data-nb]'); if (nb) nb.onclick = () => go({ v: 'lesson', l: u.id, p: 'nb' });
    };
    show();
  }

  /* ----- שאלה: תצוגה, תשובה, משוב, סולם עזרה ----- */
  function figHTML(q, big) {
    if (!q.fig) return '';
    return `<figure class="qfig${big ? ' big' : ''}">${q.fig.svg}${q.fig3 || (q.fig.m && !q.noRot) ? '<button type="button" class="s3b rot-b" title="לסובב את הגוף">🔄 לסובב</button>' : ''}</figure>`;
  }
  const parseNum = s => { const t = String(s).replace(/[,\s]/g, '').replace('٫', '.'); return t === '' || isNaN(+t) ? null : +t; };
  function mountQ(el, q, o = {}) {
    let tries = 0, helped = false, finished = false, lastWhy = '';
    const cls = isClass() && !o.exam;
    el.innerHTML = `<div class="qtext">${q.text}</div>${figHTML(q)}
      <div class="qans">${q.type === 'choice' ? `<div class="opts${q.choices.length > 3 ? '' : ' few'}">${q.choices.map((c, i) => `<button type="button" class="opt" data-i="${i}"><span class="ol">${'אבגדהו'[i]}</span> <span>${c.t}</span></button>`).join('')}</div>`
        : `<div class="numrow"><input class="numin" inputmode="decimal" autocomplete="off" aria-label="תשובה" dir="ltr"><span class="unit">${q.unit || ''}</span>${cls ? '' : '<button type="button" class="btn" data-chk>בדיקה</button>'}</div>`}</div>
      <div class="fb" aria-live="polite"></div>
      <div class="qtools">${o.exam ? '' : `${cls ? '<button type="button" class="btn sec" data-reveal>👁️ חשיפת התשובה</button><button type="button" class="btn ghost" data-hint>💡 רמז</button>' : ''}<button type="button" class="btn ghost" data-help>🧭 צריכים הסבר נוסף?</button>`}${(o.onNext && (cls || o.teach)) ? '' : ''}</div>
      <div class="help" hidden></div><div class="qnext"></div>`;
    const fb = el.querySelector('.fb'), helpEl = el.querySelector('.help'), nextEl = el.querySelector('.qnext');
    const rot = el.querySelector('.rot-b');
    if (rot) rot.onclick = () => { const f = el.querySelector('.qfig'); const spec = q.fig3 || { m: q.fig.m, o: q.fig.o }; f.innerHTML = '<div class="v3"></div>'; S3.viewer(f.firstChild, spec.m, Object.assign({ tools: ['rot', 'views', 'see'] }, spec.o, { W: 300, H: 240 })); };
    const answerText = () => q.type === 'choice' ? q.choices.find(c => c.ok).t : `${fmt(q.ans)} ${q.unit || ''}`;
    const showNext = () => {
      if (!o.onNext) return;
      nextEl.innerHTML = `<button type="button" class="btn" data-nx>הבא ←</button>`;
      nextEl.querySelector('[data-nx]').onclick = () => o.onNext({ first: tries === 1 && correct && !helped, helped, why: lastWhy });
      nextEl.querySelector('[data-nx]').focus({ preventScroll: true });
    };
    let correct = false;
    const finish = (ok, why) => {
      finished = true; correct = ok;
      el.querySelectorAll('.opt').forEach(b => { b.disabled = true; const c = q.choices[+b.dataset.i]; if (c.ok) b.classList.add('right'); });
      const inp = el.querySelector('.numin'); if (inp) inp.disabled = true;
      const ck = el.querySelector('[data-chk]'); if (ck) ck.disabled = true;
      if (o.onDone) o.onDone(ok);
      showNext();
    };
    // בדיקת תשובה
    const judge = v => {
      if (q.type === 'choice') { const c = q.choices[v]; return { ok: c.ok, why: c.why }; }
      if (v == null) return { none: true };
      if (Math.abs(v - q.ans) < 1e-6) return { ok: true };
      const t = (q.traps || []).find(([x]) => Math.abs(x - v) < 1e-6);
      if (t) return { ok: false, why: t[1] };
      const r = v / q.ans;
      if (Math.abs(r - 1000) < 1e-6 || Math.abs(r - 0.001) < 1e-6) return { ok: false, why: 'שימו לב ליחידות: נראה שהתבלבלתם בהמרה (פי 1,000).' };
      if (Math.abs(r - 2) < 1e-6) return { ok: false, why: 'התשובה גדולה פי 2 מהנכונה. בדקו אם כפלתם ב-2 מיותר (או שכחתם לחלק ב-2).' };
      if (Math.abs(r - 0.5) < 1e-6) return { ok: false, why: 'התשובה היא חצי מהנכונה. אולי חילקתם ב-2 בלי צורך, או ספרתם רק חצי מהפאות?' };
      return { ok: false, why: '' };
    };
    const onAnswer = v => {
      if (finished) return;
      const j = judge(v);
      if (j.none) { fb.innerHTML = '<div class="fb-n">כתבו מספר.</div>'; return; }
      tries++;
      if (o.exam) { lastWhy = j.why || ''; correct = j.ok; finished = true; el.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (+b.dataset.i === v) b.classList.add('sel'); }); const inp = el.querySelector('.numin'); if (inp) inp.disabled = true; fb.innerHTML = '<div class="fb-n">התשובה נשמרה.</div>'; return o.onNext && (nextEl.innerHTML = '<button type="button" class="btn" data-nx>הבא ←</button>', nextEl.querySelector('[data-nx]').onclick = () => o.onNext({ first: j.ok, why: j.why, q })); }
      if (j.ok) {
        fb.innerHTML = `<div class="fb-ok">✓ נכון! ${tries > 1 ? '' : ''}</div><div class="exp">${q.exp}</div>`;
        if (q.type === 'choice') el.querySelector(`.opt[data-i="${v}"]`).classList.add('right');
        return finish(true);
      }
      lastWhy = j.why || '';
      if (q.type === 'choice') { const b = el.querySelector(`.opt[data-i="${v}"]`); b.classList.add('wrong'); b.disabled = true; }
      if (tries === 1) {
        fb.innerHTML = `<div class="fb-bad">✗ עוד לא.</div>${j.why ? `<div class="why">${j.why}</div>` : `<div class="why">${q.hint}</div>`}<div class="muted small">נסו שוב${q.type === 'choice' ? ' – בחרו תשובה אחרת' : ''}.</div>`;
        const inp = el.querySelector('.numin'); if (inp) { inp.select(); }
      } else {
        fb.innerHTML = `<div class="fb-bad">✗ ${j.why ? j.why : 'לא נכון.'}</div><div class="exp"><b>התשובה:</b> ${answerText()}<br>${q.exp}</div>`;
        finish(false);
      }
    };
    // מצב כיתה: בחירה מסמנת בלבד; המורה חושפת
    if (cls) {
      let sel = null;
      el.querySelectorAll('.opt').forEach(b => b.onclick = () => { el.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.i; });
      el.querySelector('[data-hint]').onclick = () => { fb.innerHTML = `<div class="note">💡 ${q.hint}</div>`; helped = true; };
      el.querySelector('[data-reveal]').onclick = () => {
        tries = 1;
        const allWhy = q.type === 'choice' ? `<ul class="whys">${q.choices.map((c, i) => `<li class="${c.ok ? 'r' : 'w'}"><b>${'אבגדהו'[i]}. ${c.t}</b> – ${c.ok ? '✓ נכון' : c.why}</li>`).join('')}</ul>` : (q.traps && q.traps.length ? `<div class="small"><b>טעויות נפוצות:</b><ul class="whys">${q.traps.map(([v, m]) => `<li class="w"><b>${fmt(v)}</b> – ${m}</li>`).join('')}</ul></div>` : '');
        const typed = q.type === 'num' ? parseNum(el.querySelector('.numin').value) : sel;
        const j = typed == null ? null : judge(typed);
        fb.innerHTML = `${j ? (j.ok ? '<div class="fb-ok">✓ הכיתה צדקה!</div>' : `<div class="fb-bad">✗ התשובה של הכיתה לא נכונה.</div>${j.why ? `<div class="why">${j.why}</div>` : ''}`) : ''}<div class="exp"><b>התשובה:</b> ${answerText()}<br>${q.exp}</div>${allWhy}`;
        finish(j ? j.ok : true);
      };
    } else {
      el.querySelectorAll('.opt').forEach(b => b.onclick = () => onAnswer(+b.dataset.i));
      const ck = el.querySelector('[data-chk]'), inp = el.querySelector('.numin');
      if (ck) { ck.onclick = () => onAnswer(parseNum(inp.value)); inp.onkeydown = e => { if (e.key === 'Enter') ck.click(); }; }
    }
    const hb = el.querySelector('[data-help]');
    if (hb) hb.onclick = () => { helped = true; helpEl.hidden = false; helpLadder(helpEl, q); hb.hidden = true; };
    if (!o.teach && !o.exam && !cls) { const inp = el.querySelector('.numin'); if (inp && matchMedia('(min-width: 700px)').matches) inp.focus({ preventScroll: true }); }
  }

  /* ----- סולם העזרה (כמו במאמן האישי): רמז → המחשה → דוגמה דומה → פותרים יחד. בלי לחשוף את התשובה ----- */
  function helpLadder(el, q) {
    const H = q.help || {};
    const steps = [['💡 רמז', 'hint'], ['👀 המחשה', 'vis'], ['📝 דוגמה דומה', 'ex']];
    if (q.steps && q.steps.length > 1) steps.push(['👣 פותרים יחד', 'walk']);
    el.innerHTML = `<div class="ladder"><div class="lad-tabs">${steps.map(([n, k], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-h="${k}" ${i ? 'disabled' : ''}>${n}</button>`).join('')}</div><div class="lad-body"></div><p class="small muted">כל שלב נפתח אחרי הקודם. התשובה לא נחשפת – פותרים בעצמכם.</p></div>`;
    const bodyEl = el.querySelector('.lad-body'), tabs = [...el.querySelectorAll('[data-h]')];
    const open = i => {
      tabs.forEach((t, j) => { t.classList.toggle('on', j === i); if (j <= i + 1) t.disabled = false; });
      const k = steps[i][1];
      if (k === 'hint') bodyEl.innerHTML = `<div class="note">💡 ${q.hint}</div><button type="button" class="btn ghost" data-more>עדיין קשה? להמחשה ←</button>`;
      if (k === 'vis') { bodyEl.innerHTML = `<div class="note">${H.say || 'התבוננו בהמחשה – אפשר לסובב, לקפל ולשנות.'}</div><div class="hvis"></div><button type="button" class="btn ghost" data-more>לדוגמה דומה ←</button>`; mountVis(bodyEl.querySelector('.hvis'), q); }
      if (k === 'ex') {
        let ex = null; if (q.again) for (let t = 0; t < 12; t++) { const c = q.again(); if (c.text !== q.text || (c.fig && q.fig && c.fig.svg !== q.fig.svg)) { ex = c; if (c.text !== q.text) break; } }
        bodyEl.innerHTML = ex ? `<div class="ex-box"><div class="muted small">דוגמה דומה – עם פתרון:</div><div class="wq">${ex.text}</div>${figHTML(Object.assign({}, ex, { noRot: true, fig3: null, fig: ex.fig && { svg: ex.fig.svg } }))}<div class="note"><b>פתרון:</b> ${ex.type === 'num' ? fmt(ex.ans) + ' ' + (ex.unit || '') : ex.choices.find(c => c.ok).t}<br>${ex.exp}</div><p class="small">עכשיו חזרו לשאלה שלכם ופתרו באותה דרך.</p></div>` : `<div class="note">חזרו לכלל של השיעור (חלק ב') ופתרו לפיו.</div>`;
        if (steps[3]) bodyEl.innerHTML += '<button type="button" class="btn ghost" data-more>לפתור יחד צעד-צעד ←</button>';
      }
      if (k === 'walk') walk(bodyEl, q);
      const m = bodyEl.querySelector('[data-more]'); if (m) m.onclick = () => open(i + 1);
    };
    tabs.forEach((t, i) => t.onclick = () => open(i));
    open(0);
  }
  // פותרים יחד: כל הצעדים חוץ מהאחרון – התשובה הסופית נשארת לתלמיד
  function walk(el, q) {
    const st = q.steps.slice(0, -1);
    el.innerHTML = `<ol class="walk">${st.map((s, i) => `<li data-w="${i}"${i ? ' hidden' : ''}><span>${s.p}</span> <input class="numin sm" inputmode="decimal" dir="ltr" aria-label="צעד ${i + 1}"> <button type="button" class="btn sm">✓</button><span class="wfb"></span></li>`).join('')}<li data-w="${st.length}" hidden><b>${q.steps[q.steps.length - 1].p}</b> – את הצעד האחרון כתבו בתשובה למעלה.</li></ol>`;
    el.querySelectorAll('li[data-w]').forEach(li => {
      const i = +li.dataset.w, b = li.querySelector('button'), inp = li.querySelector('input'); if (!b) return;
      let n = 0;
      b.onclick = () => { const v = parseNum(inp.value); if (v != null && Math.abs(v - st[i].a) < 1e-6) { li.querySelector('.wfb').innerHTML = ' ✓'; inp.disabled = true; b.disabled = true; el.querySelector(`li[data-w="${i + 1}"]`).hidden = false; } else { n++; li.querySelector('.wfb').innerHTML = n >= 2 ? ` <span class="muted">(${fmt(st[i].a)})</span>` : ' ✗ נסו שוב'; if (n >= 2) { inp.value = st[i].a; b.click(); } } };
    });
  }
  // המחשה לשאלה – לפי מה שהמחולל הגדיר
  function mountVis(el, q) {
    const H = q.help || {};
    if (H.vis) return S3.viewer(el, H.vis.m, Object.assign({ W: 300, H: 240 }, H.vis.o));
    if (H.layers) return layerBuilder(el, { fixed: H.layers });
    if (H.net) { const net = S3.gridNet(H.net); return S3.netPlayer(el, net, { fill: i => H.txt ? ['#f6c4b8', '#bfe0c9', '#c6d4f5', '#f6e2a6', '#e2c8ef', '#bfe6ea'][i % 6] : '#e8edff', onT: (t, bad) => t > 0.97 ? (bad.size ? '❌ <b>לא נסגרה קובייה</b> – משבצות נופלות זו על זו (באדום).' : '✅ <b>נסגרה קובייה!</b>') : '' }); }
    if (H.pnet) return S3.netPlayer(el, H.pnet, { onT: (t, bad) => t > 0.97 ? (bad.size ? '❌ שתי פאות נופלות על אותו מקום – וצד אחר נשאר פתוח.' : '✅ המנסרה נסגרה.') : '' });
    if (H.half) return halfVis(el, H.half);
    if (H.tank) return tankVis(el, H.tank);
    if (H.saNet) return saNetVis(el, H.saNet);
    if (q.fig3) return S3.viewer(el, q.fig3.m, Object.assign({ W: 300, H: 240, tools: ['rot', 'views', 'see'] }, q.fig3.o));
    if (q.fig && q.fig.m) return S3.viewer(el, q.fig.m, Object.assign({}, q.fig.o, { W: 300, H: 240, tools: ['rot', 'views', 'see'] }));
    const u = unitById(q.skill); el.innerHTML = `<div class="rule-mini">${u ? u.rule : ''}</div>`;
  }

  /* ----- ד. משימת מחברת ----- */
  function nbPart(u, body) {
    const nb = u.nb;
    body.innerHTML = `<article class="card nb-card"><h2>✏️ משימת מחברת</h2><div class="nb-task">${nb.task}</div>
      <p class="muted small">כותבים במחברת דרך מסודרת: שרטוט, תרגיל, תשובה עם יחידות, ומשפט הסבר.</p>
      <button type="button" class="btn" data-done>סיימתי לכתוב – לבדיקה עצמית</button>
      <div class="nb-check" hidden><h3>בדיקה עצמית – סמנו מה יש אצלכם:</h3><ul class="chk">${nb.check.map((c, i) => `<li><label><input type="checkbox" data-c="${i}"> ${c}</label></li>`).join('')}</ul>
      <details class="nb-model-d"><summary>👀 פתרון לדוגמה</summary>${nb.model()}</details>
      <p class="small muted">חסר משהו? תקנו במחברת בצבע אחר – זה חלק מהלמידה.</p><button type="button" class="btn" data-fin>✓ סיימתי את המשימה</button></div></article>`;
    body.querySelector('[data-done]').onclick = e => { e.target.hidden = true; body.querySelector('.nb-check').hidden = false; };
    body.querySelector('[data-fin]').onclick = () => { const n = body.querySelectorAll('[data-c]:checked').length; P(u.id).nb = 1; saveP(); track('מחברת', `מנסרה ${u.no} · ${n}/${nb.check.length}`); body.querySelector('[data-fin]').outerHTML = `<div class="fb-ok">✓ נשמר. ${unitDone(u.id) ? 'סיימתם את כל ארבעת החלקים של השיעור! 🌟' : ''}</div>`; };
  }

  /* ---------- תרגול סיכום הפרק ---------- */
  function reviewView() {
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="#" data-ch>פרק 1 – מנסרה</a> › תרגול סיכום</div><div class="ch-head"><h1>🔁 תרגול סיכום הפרק</h1>${modeBar()}</div><p class="muted">שאלה מכל שיעור – רמות 1–2. עם עזרה ומשוב.</p><section id="pbody"></section></div>`;
    bindModes(app); app.querySelector('[data-ch]').onclick = e => { e.preventDefault(); go({ v: 'chapter' }); };
    const qs = shuffle(UNITS).slice(0, 10).map(u => { const l = Math.random() < 0.5 ? 1 : 2, g = G6.pick(u.gens[l]), q = g(); q.lv = l; return q; });
    runRound(null, $('pbody'), 0, qs, { title: 'סיכום', onFinish: (res, list, body) => { const n = res.filter(r => r.first).length; body.innerHTML = `<article class="card done-card"><h2>סיימתם את הסיכום</h2><p class="big-num">${n} / ${list.length}</p><div class="end-row"><button type="button" class="btn" data-exit>🎫 לכרטיס היציאה</button><button type="button" class="btn ghost" data-ch2>לרשימת השיעורים</button></div></article>`; body.querySelector('[data-exit]').onclick = () => go({ v: 'exit' }); body.querySelector('[data-ch2]').onclick = () => go({ v: 'chapter' }); } });
  }

  /* ---------- כרטיס יציאה לפרק: 8 שאלות, ניסיון אחד, בלי עזרה → דיווח לטבלת המעקב ---------- */
  function exitQs() { return G6.EXIT_SLOTS.map(([id, l]) => { const u = unitById(id), q = G6.pick(u.gens[l])(); q.lv = l; return q; }); }
  function exitView() {
    app.innerHTML = `<div class="wrap"><div class="crumbs"><a href="#" data-ch>פרק 1 – מנסרה</a> › כרטיס יציאה</div><h1>🎫 כרטיס יציאה – מנסרה</h1>
      <article class="card"><p>8 שאלות מכל שיעורי הפרק. <b>ניסיון אחד לכל שאלה, בלי רמזים.</b> בסוף תראו מה כדאי לחזור עליו${teacher() ? '' : ', והתוצאה תישלח למורה'}.</p>
      <label class="nm-l">שם מלא: <input id="exNm" value="${esc(NAME)}" autocomplete="off" maxlength="40"></label><button type="button" class="btn" data-start>מתחילים ←</button></article></div>`;
    app.querySelector('[data-ch]').onclick = e => { e.preventDefault(); go({ v: 'chapter' }); };
    app.querySelector('[data-start]').onclick = () => {
      const nm = $('exNm').value.trim(); if (!nm && !teacher()) { $('exNm').focus(); $('exNm').classList.add('need'); return; }
      NAME = nm || NAME; const qs = exitQs();
      app.querySelector('.card').outerHTML = '<section id="pbody"></section>';
      runRound(null, $('pbody'), 0, qs, { exam: true, title: 'כרטיס יציאה', onFinish: (res) => {
        const n = res.filter(r => r.first).length, miss = [...new Set(qs.filter((q, i) => !res[i].first).map(q => unitById(q.skill).no))];
        track('כרטיס יציאה', `מנסרה · ${n}/${qs.length}${miss.length ? ' · לחזרה: ' + miss.join(', ') : ''}`);
        const b = $('pbody');
        b.innerHTML = `<article class="card done-card"><h2>${n >= 7 ? '🌟 שולטים בפרק!' : n >= 5 ? '👍 כמעט שם' : '💪 כדאי לחזור על כמה שיעורים'}</h2><p class="big-num">${n} / ${qs.length}</p>
          <ol class="ex-res">${qs.map((q, i) => `<li class="${res[i].first ? 'r' : 'w'}">${res[i].first ? '✓' : '✗'} <span class="muted small">שיעור ${unitById(q.skill).no}</span> – ${q.text.replace(/<[^>]+>/g, '').slice(0, 70)}…${res[i].first ? '' : `<div class="small"><b>התשובה:</b> ${q.type === 'num' ? fmt(q.ans) + ' ' + (q.unit || '') : q.choices.find(c => c.ok).t}. ${res[i].why || ''}</div>`}</li>`).join('')}</ol>
          ${miss.length ? `<div class="note">כדאי לחזור על: ${miss.map(no => { const u = UNITS.find(x => x.no === no); return `<button type="button" class="chip" data-l="${u.id}">${no}. ${u.title}</button>`; }).join(' ')}</div>` : ''}
          <div class="end-row"><button type="button" class="btn ghost" data-ch2>לרשימת השיעורים</button></div></article>`;
        b.querySelectorAll('[data-l]').forEach(x => x.onclick = () => go({ v: 'lesson', l: x.dataset.l, p: 'prac' }));
        b.querySelector('[data-ch2]').onclick = () => go({ v: 'chapter' });
      } });
    };
  }

  /* ---------- הדפסה: דף עבודה לשיעור / כרטיס יציאה + טבלת מעקב ---------- */
  function printWrap(title, html) {
    const host = $('printout'); host.innerHTML = html; document.documentElement.classList.add('printing');
    track('הדפסה', title);
    const done = () => { document.documentElement.classList.remove('printing'); host.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }
  const qPrint = (q, i) => `<div class="pq"><div class="pqt"><b>${i + 1}.</b> ${q.text}</div>${q.fig ? `<div class="pfig">${q.fig.svg}</div>` : ''}${q.type === 'choice' ? `<ol class="pch">${q.choices.map(c => `<li>${c.t}</li>`).join('')}</ol>` : `<div class="pline">תשובה: ____________ ${q.unit || ''}</div>`}</div>`;
  const keyLine = (q, i) => `<li><b>${i + 1}.</b> ${q.type === 'num' ? fmt(q.ans) + ' ' + (q.unit || '') : q.choices.find(c => c.ok).t} – <span class="small">${q.exp}</span></li>`;
  function printSheet(u) {
    const qs = [...buildRound(u, 1, 3), ...buildRound(u, 2, 4), ...buildRound(u, 3, 3)];
    printWrap(`דף עבודה מנסרה ${u.no}`, `<section class="psheet"><header class="phead"><span class="brand">mathinclass</span><span>שם: ______________ כיתה: ____</span></header>
      <h1>${u.no}. ${u.title}</h1><div class="prule"><b>📌 מה גילינו?</b>${u.rule}</div>
      <h2>תרגול</h2>${qs.map(qPrint).join('')}<h2>✏️ משימת מחברת</h2><div class="nb-task">${u.nb.task}</div></section>
      <section class="psheet pkey"><h2>דף תשובות – ${u.no}. ${u.title}</h2><ol class="keys">${qs.map(keyLine).join('')}</ol><h3>משימת מחברת – פתרון לדוגמה</h3>${u.nb.model()}</section>`);
  }
  function printExit() {
    const qs = exitQs();
    printWrap('כרטיס יציאה מנסרה', `<section class="psheet"><header class="phead"><span class="brand">mathinclass</span><span>שם: ______________ כיתה: ____</span></header><h1>🎫 כרטיס יציאה – מנסרה</h1>${qs.map(qPrint).join('')}</section>
      <section class="psheet pkey"><h2>דף תשובות</h2><ol class="keys">${qs.map((q, i) => keyLine(q, i).replace('</li>', ` <span class="muted">(שיעור ${unitById(q.skill).no})</span></li>`)).join('')}</ol></section>
      <section class="psheet"><h2>טבלת מעקב – כרטיס יציאה מנסרה</h2><table class="track"><tr><th>שם</th>${qs.map((q, i) => `<th>${i + 1}<br><span class="small">${unitById(q.skill).no}</span></th>`).join('')}<th>ציון</th><th>לחזרה</th></tr>${Array(30).fill(0).map(() => `<tr><td></td>${qs.map(() => '<td></td>').join('')}<td></td><td></td></tr>`).join('')}</table></section>`);
  }

  /* =========================================================
     המחשות אינטראקטיביות לשלבי ההקניה
     ========================================================= */
  const NEUF = () => '#e8edff';
  function layerBuilder(el, o = {}) {
    const f = o.fixed || [4, 3, 3], target = o.target;
    let a = f[0], b = f[1], c = f[2] || 1, k = f[2] ? f[2] : 1;
    const fixed = !!o.fixed, maxC = target ? Math.max(8, Math.ceil(target / (a * b)) + 2) : c;
    el.innerHTML = `<div class="lb">${fixed ? '' : `<div class="lb-dims"><label>אורך <input type="number" min="1" max="6" value="${a}" data-d="a"></label><label>רוחב <input type="number" min="1" max="5" value="${b}" data-d="b"></label><label>שכבות <input type="number" min="1" max="6" value="${c}" data-d="c"></label></div>`}
      <div class="lb-fig"></div><label class="s3-range"><span>שכבה 0</span><input type="range" dir="rtl" min="0" max="${target ? maxC : c}" value="${target ? 0 : k}" aria-label="מספר השכבות"><span>${target ? maxC : c}</span></label>
      <div class="lb-say say" aria-live="polite"></div><div class="s3-tools"><button type="button" class="s3b" data-play>▶ בונים שכבה אחרי שכבה</button></div></div>`;
    const fig = el.querySelector('.lb-fig'), rng = el.querySelector('input[type=range]'), say = el.querySelector('.lb-say');
    if (target) k = 0;
    const draw = () => {
      const top = target ? maxC : c;
      fig.innerHTML = S3.cubesSVG(S3.boxCubes(a, b, k), { W: 300, H: 240, layerCol: true, bb: [[0, 0, 0], [a, b, top]], maxS: 34 });
      const n = a * b * k;
      say.innerHTML = `בכל שכבה ${M(`${a} × ${b} = ${a * b}`)} קוביות · ${k} שכבות · ביחד ${M(`${a * b} × ${k} = ${n}`)} קוביות${target ? (n === target ? ' – <b>הגענו ל-' + target + '!</b> ✓' : n > target ? ' – יותר מדי' : '') : ''}`;
    };
    rng.oninput = () => { k = +rng.value; draw(); };
    el.querySelectorAll('[data-d]').forEach(inp => inp.oninput = () => { const v = Math.max(1, Math.min(+inp.max, +inp.value || 1)); if (inp.dataset.d === 'a') a = v; if (inp.dataset.d === 'b') b = v; if (inp.dataset.d === 'c') { c = v; rng.max = c; el.querySelector('.s3-range span:last-child').textContent = c; } k = Math.min(k, c); rng.value = k; draw(); });
    el.querySelector('[data-play]').onclick = () => { k = 0; draw(); const top = target ? Math.ceil(target / (a * b)) : c; const t = setInterval(() => { k++; rng.value = k; draw(); if (k >= top || !el.isConnected) clearInterval(t); }, 650); timers.push(t); };
    draw();
  }
  function halfVis(el, [a, b, h]) {
    el.innerHTML = `<div class="two-figs"><figure>${G6.halfBoxSVG(a, b, h)}<figcaption>מנסרה משולשת = חצי תיבה</figcaption></figure><figure>${S3.render(S3.box(a, b, h), { W: 200, H: 170, labels: G6.boxLbl(a, b, h) })}<figcaption>התיבה כולה: ${M(`${a} × ${b} × ${h} = ${a * b * h}`)}</figcaption></figure></div>`;
  }
  function tankVis(el, [a, b, c, w]) {
    el.innerHTML = `<div class="tk-fig"></div><label class="s3-range"><span>ריק</span><input type="range" dir="rtl" min="0" max="${c}" value="${w}"><span>מלא</span></label><p class="say" aria-live="polite"></p>`;
    const f = el.querySelector('.tk-fig'), r = el.querySelector('input'), s = el.querySelector('.say');
    const draw = () => { const v = +r.value; f.innerHTML = S3.tankSVG(a, b, c, v, { lw: v || false }); s.innerHTML = `גובה המים ${v} ס"מ · נפח המים ${M(`${a} × ${b} × ${v} = ${fmt(a * b * v)}`)} סמ"ק = ${fmt(a * b * v / 1000)} ליטר`; };
    r.oninput = draw; draw();
  }
  function saNetVis(el, [a, b, c]) {
    const net = G6.boxNet(a, b, c), D = G6.boxFaceDims(a, b, c), shown = new Set();
    el.innerHTML = `<p class="small">לחצו על כל מלבן כדי לראות את השטח שלו:</p><div class="sa-f"></div><p class="say"></p>`;
    const f = el.querySelector('.sa-f'), s = el.querySelector('.say');
    const draw = () => { f.innerHTML = S3.flatSVG(net, { W: 280, H: 230, pick: true, txt: D.map((d, i) => shown.has(i) ? `${d[0]}×${d[1]}=${d[0] * d[1]}` : `${d[0]}×${d[1]}`), fs: 11 }); s.innerHTML = shown.size === 6 ? `ביחד: ${M(`2 × (${a * b} + ${a * c} + ${b * c}) = ${2 * (a * b + a * c + b * c)}`)} סמ"ר` : `נחשפו ${shown.size} מתוך 6`; };
    f.onclick = e => { const t = e.target.closest('[data-i]'); if (t) { shown.add(+t.dataset.i); draw(); } };
    draw();
  }

  const PAL6 = ['#f6c4b8', '#bfe0c9', '#c6d4f5', '#f6e2a6', '#e2c8ef', '#bfe6ea'];
  const SETUPS = {
    // שיעור 1 – מיון
    sort(root, st) {
      const host = root.querySelector('[data-sort]'), ids = st.sort, ans = {};
      host.innerHTML = `<div class="sort-grid">${ids.map(id => `<div class="sort-card" data-id="${id}"><div class="sc-fig">${S3.render(G6.SOLIDS[id].m(), { W: 150, H: 120, fill: NEUF, pad: 10, yaw: G6.SOLIDS[id].yaw ?? -32 })}</div><div class="sc-b"><button type="button" class="chip" data-v="1">מנסרה</button><button type="button" class="chip" data-v="0">לא מנסרה</button></div><div class="sc-fb small"></div></div>`).join('')}</div>
        <div class="s3-tools"><button type="button" class="btn sec" data-show>👁️ ${isClass() ? 'חשיפת התשובות' : 'בדיקה'}</button></div><p class="say" data-sum></p>`;
      const check = (card, reveal) => { const id = card.dataset.id, S = G6.SOLIDS[id], v = ans[id], fb = card.querySelector('.sc-fb'); card.classList.remove('r', 'w'); if (v == null && !reveal) return; const ok = v === S.p; if (v != null) card.classList.add(ok ? 'r' : 'w'); fb.innerHTML = `<b>${S.nm}</b> – ${S.p ? 'מנסרה' : 'לא מנסרה'}. ${S.p ? (S.lying ? 'היא רק שוכבת!' : '') : S.why}`; };
      host.querySelectorAll('.sort-card').forEach(card => card.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { ans[card.dataset.id] = b.dataset.v === '1'; card.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); if (!isClass()) check(card); }));
      host.querySelector('[data-show]').onclick = () => { host.querySelectorAll('.sort-card').forEach(c => check(c, true)); const n = ids.filter(id => ans[id] === G6.SOLIDS[id].p).length; const pr = ids.filter(id => G6.SOLIDS[id].p); host.querySelector('[data-sum]').innerHTML = `${Object.keys(ans).length ? `מיינתם נכון ${n} מתוך ${ids.length}. ` : ''}יש כאן ${pr.length} מנסרות: ${pr.map(id => G6.SOLIDS[id].nm).join(', ')}. שימו לב למנסרות השוכבות – ולגופים שנראים דומים אבל אינם מנסרות.`; };
    },
    parts(root) {
      const L = [5, 3, 6, 4], col = { b: false, l: false }; let i = 0, m = S3.regPrism(5, 1, 1.5);
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), m, { tools: ['rot', 'views', 'see'], fill: f => col[v ? v.st.m.K[f] : 'n'] ? COL[v.st.m.K[f]] : '#eef1f8' });
      root.querySelectorAll('[data-col]').forEach(b => b.onclick = () => { col[b.dataset.col] = !col[b.dataset.col]; b.classList.toggle('on', col[b.dataset.col]); v.draw(); });
      root.querySelector('[data-n]').onclick = () => { i = (i + 1) % L.length; const n = L[i]; v.set(n === 4 ? S3.box(2.2, 1.4, 1.6) : S3.regPrism(n, n > 5 ? 0.9 : 1.1, 1.5)); };
      v.draw();
    },
    pickBases(root) {
      const m = S3.lay(S3.regPrism(3, 1.6, 2.6)), msg = root.querySelector('[data-msg]');
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), m, { tools: ['rot', 'views', 'see'], pick: 'F', fill: f => v && v.st.marks.F.has(f) ? (m.K[f] === 'b' ? COL.b : '#f3a29a') : '#eef1f8', onPick: (k, i, marks) => {
        const sel = [...marks.F], b = sel.filter(f => m.K[f] === 'b').length, wrong = sel.filter(f => m.K[f] !== 'b').length;
        msg.innerHTML = wrong ? '❌ <b>זו פאה צדדית</b> (מלבן) – יש עוד 2 מלבנים כמוה. הבסיסים הם שתי הפאות <b>הזהות שאינן מלבנים</b>, שכל המלבנים מחברים ביניהן. לחצו שוב כדי לבטל.' : b === 2 ? '✅ <b>מצאתם!</b> שני המשולשים הם הבסיסים – הם זהים ומקבילים, גם כשהם לא למטה.' : b === 1 ? '👍 בסיס אחד. איפה השני? (סובבו את הגוף)' : '';
      } });
    },
    names(root) {
      const host = root.querySelector('[data-ns]'), say = root.querySelector('[data-say]'), L = [3, 4, 5, 6, 8];
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), S3.regPrism(3, 1.5, 1.6), { tools: ['rot', 'views'] });
      host.innerHTML = L.map(n => `<button type="button" class="tb" data-n="${n}">${G6.BASE[n]}</button>`).join('');
      const set = n => { v.set(S3.regPrism(n, n > 5 ? (n > 6 ? 0.7 : 0.9) : n === 3 ? 1.5 : 1.1, 1.6)); host.querySelectorAll('[data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); say.innerHTML = `בסיס ${G6.BASE[n]} (${n} צלעות) → <b>${G6.pName(n)}</b>${n === 4 ? ' (אם כל הפאות מלבנים – תיבה)' : ''} · ${n} פאות צדדיות`; };
      host.querySelectorAll('[data-n]').forEach(b => b.onclick = () => set(+b.dataset.n)); set(3);
    },
    boxPairs(root) {
      let base = 'p1', cube = false;
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), S3.box(3, 2, 1.5), { tools: ['rot', 'views'], fill: f => { const k = v ? v.st.m.K[f] : 'p1'; return k === base ? COL.b : COL[k]; } });
      root.querySelectorAll('[data-pair]').forEach(b => b.onclick = () => { base = b.dataset.pair; root.querySelectorAll('[data-pair]').forEach(x => x.classList.toggle('on', x === b)); v.draw(); });
      root.querySelector('[data-cube]').onclick = e => { cube = !cube; e.target.classList.toggle('on', cube); v.set(cube ? S3.cube(2) : S3.box(3, 2, 1.5)); };
      v.draw();
    },
    oblique(root) {
      root.querySelector('[data-f1]').innerHTML = S3.render(S3.regPrism(6, 0.9, 1.6), { W: 180, H: 160 }) + '<figcaption>מנסרה ישרה</figcaption>';
      root.querySelector('[data-f2]').innerHTML = S3.render(S3.shear(S3.regPrism(6, 0.9, 1.6), 0.55), { W: 180, H: 160 }) + '<figcaption>מנסרה לא ישרה (משופעת)</figcaption>';
    },
    // שיעור 2
    count3(root) { S3.viewer(root.querySelector('[data-v]'), S3.regPrism(3, 1.5, 1.6), { tools: ['rot', 'views', 'see', 'count'], countHint: 'לחצו שוב כדי לבטל' }); },
    table(root) {
      const rows = [3, 4, 5, 6], host = root.querySelector('[data-rows]'), tab = root.querySelector('[data-tab]'), got = {};
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), S3.regPrism(3, 1.4, 1.5), { tools: ['rot', 'see', 'count'] });
      host.innerHTML = rows.map(n => `<button type="button" class="tb" data-n="${n}">${n === 4 ? 'תיבה' : G6.pName(n)}</button>`).join('');
      const C = n => ({ V: 2 * n, E: 3 * n, F: n + 2 });
      tab.innerHTML = `<div class="tscroll"><table class="inv"><tr><th>מנסרה</th><th>צלעות בבסיס</th><th>קדקודים</th><th>מקצועות</th><th>פאות</th></tr>${rows.map(n => `<tr data-r="${n}"><td>${n === 4 ? 'תיבה' : G6.pName(n)}</td><td>${n}</td>${['V', 'E', 'F'].map(w => `<td><input class="numin sm" inputmode="numeric" dir="ltr" data-w="${w}" aria-label="${n} ${w}">${isClass() ? '' : '<span class="tfb"></span>'}</td>`).join('')}</tr>`).join('')}</table></div>${isClass() ? '<button type="button" class="btn sec" data-rev>👁️ חשיפת הטבלה</button>' : ''}`;
      host.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const n = +b.dataset.n; v.set(n === 4 ? S3.box(2.2, 1.4, 1.5) : S3.regPrism(n, n > 5 ? 0.9 : 1.2, 1.5)); host.querySelectorAll('[data-n]').forEach(x => x.classList.toggle('on', x === b)); });
      tab.querySelectorAll('input').forEach(inp => inp.onchange = () => {
        if (isClass()) return; const n = +inp.closest('tr').dataset.r, w = inp.dataset.w, val = +inp.value, fb = inp.nextElementSibling, c = C(n);
        if (val === c[w]) { fb.textContent = '✓'; fb.className = 'tfb ok'; inp.disabled = true; }
        else { fb.className = 'tfb bad'; fb.innerHTML = '✗'; fb.title = val === c[{ V: 'E', E: 'V', F: 'V' }[w]] ? 'התבלבלתם בין קדקודים למקצועות' : w === 'V' && val === n ? 'רק בסיס אחד' : w === 'E' && val === 2 * n ? 'שכחתם את המקצועות הצדדיים' : w === 'F' && val === n ? 'שכחתם את 2 הבסיסים' : 'ספרו שוב – הפעילו "שקוף"'; inp.setAttribute('aria-describedby', ''); fb.textContent = '✗ ' + fb.title; }
      });
      const rv = tab.querySelector('[data-rev]'); if (rv) rv.onclick = () => tab.querySelectorAll('tr[data-r]').forEach(tr => { const n = +tr.dataset.r; tr.querySelectorAll('input').forEach(inp => { inp.value = C(n)[inp.dataset.w]; inp.disabled = true; }); });
      host.querySelector('[data-n]').click();
    },
    predict(root) {
      const host = root.querySelector('[data-pred]'), vEl = root.querySelector('[data-v]');
      host.innerHTML = `<div class="pred-row">${['V', 'E', 'F'].map(w => `<label>${{ V: 'קדקודים', E: 'מקצועות', F: 'פאות' }[w]}: <input class="numin sm" inputmode="numeric" dir="ltr" data-w="${w}"></label>`).join('')}<button type="button" class="btn" data-ck>${isClass() ? '👁️ בודקים בציור' : 'בדיקה'}</button></div><div class="say" data-say></div>`;
      host.querySelector('[data-ck]').onclick = () => {
        const C = { V: 16, E: 24, F: 10 }, out = [];
        host.querySelectorAll('[data-w]').forEach(i => { const ok = +i.value === C[i.dataset.w]; if (i.value !== '') out.push(`${{ V: 'קדקודים', E: 'מקצועות', F: 'פאות' }[i.dataset.w]}: ${ok ? '✓' : '✗ (' + C[i.dataset.w] + ')'}`); });
        host.querySelector('[data-say]').innerHTML = (out.length ? out.join(' · ') + '<br>' : '') + `למנסרה מתומנת: ${M('2 × 8 = 16')} קדקודים, ${M('3 × 8 = 24')} מקצועות, ${M('8 + 2 = 10')} פאות. בדקו בספירה:`;
        vEl.hidden = false; S3.viewer(vEl, S3.regPrism(8, 0.7, 1.4), { tools: ['rot', 'see', 'count'] });
      };
    },
    groups(root) {
      let g = '0', n = 5; const bE = (m, k) => { const [a, b] = k.split(',').map(Number), N = m.n; const side = (a < N) !== (b < N); return side ? 's' : 'b'; };
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), S3.regPrism(n, 1, 1.5), { tools: ['rot', 'see'], see: true, edgeCol: (k) => g === '0' ? null : bE(v.st.m, k) === g ? (g === 'b' ? COL.E : COL.H) : null });
      root.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { g = b.dataset.g; root.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('on', x === b && g !== '0')); v.draw(); });
      root.querySelector('[data-n]').onclick = () => { n = n === 8 ? 3 : n === 6 ? 8 : n + 1; v.set(S3.regPrism(n, n > 5 ? 0.8 : 1.1, 1.5)); };
      v.draw();
    },
    // שיעור 3
    netOpen(root) {
      const ks = [['מנסרה משולשת', () => S3.unfold(S3.regPrism(3, 1, 1.5), S3.prismTree(3, 0, 1))], ['תיבה', () => G6.boxNet(1.6, 1, 0.8)], ['מנסרה מחומשת', () => S3.unfold(S3.regPrism(5, 1, 1.3), S3.prismTree(5, 2, 2))], ['מנסרה משושה', () => S3.unfold(S3.regPrism(6, 0.9, 1.3), S3.prismTree(6, 1, 4))], ['קובייה', () => S3.gridNet([[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]])]];
      const host = root.querySelector('[data-ks]'), np = root.querySelector('[data-np]');
      host.innerHTML = ks.map(([n], i) => `<button type="button" class="tb" data-k="${i}">${n}</button>`).join('');
      const set = i => { host.querySelectorAll('[data-k]').forEach((b, j) => b.classList.toggle('on', i === j)); const net = ks[i][1](); S3.netPlayer(np, net, { t: 1, fill: i2 => net.kind === 'cube' ? PAL6[i2 % 6] : null }); };
      host.querySelectorAll('[data-k]').forEach(b => b.onclick = () => set(+b.dataset.k)); set(2);
    },
    netTwo(root) {
      const a = G6.prismNet(5, 'ok', 1, 3), b = G6.prismNet(5, 'same', 1, 1);
      S3.netPlayer(root.querySelector('[data-np1]'), a, { W: 260, H: 220, onT: (t) => t > 0.97 ? '✅ נסגרה' : 'פריסה 1' });
      S3.netPlayer(root.querySelector('[data-np2]'), b, { W: 260, H: 220, onT: (t, bad) => t > 0.97 ? '❌ שני הבסיסים על אותו קצה (באדום) – והקצה השני פתוח' : 'פריסה 2' });
    },
    cubeNets(root) {
      const L = [['צלב', [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]]], ['1-4-1 באלכסון', [[0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [2, 3]]], ['מדרגות', [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]]], ['3-3', [[0, 0], [0, 1], [0, 2], [1, 2], [1, 3], [1, 4]]], ['5 בשורה', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 1]]], ['ריבוע 2×2', [[0, 0], [0, 1], [1, 0], [1, 1], [2, 1], [2, 2]]], ['צורת U', [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 3]]]];
      const host = root.querySelector('[data-cs]'), pq = root.querySelector('[data-pq]'), np = root.querySelector('[data-np]');
      host.innerHTML = L.map(([n], i) => `<button type="button" class="tb" data-k="${i}">${n}</button>`).join('');
      const set = i => {
        host.querySelectorAll('[data-k]').forEach((b, j) => b.classList.toggle('on', i === j));
        const net = S3.gridNet(L[i][1]), bad = S3.overlaps(net);
        np.innerHTML = '';
        pq.innerHTML = `<div class="pred-row"><span>ניבוי: תיסגר קובייה?</span><button type="button" class="chip" data-y="1">כן</button><button type="button" class="chip" data-y="0">לא</button></div>`;
        const open = () => { S3.netPlayer(np, net, { fill: k => PAL6[k % 6], onT: (t, b2) => t > 0.97 ? (b2.size ? '❌ <b>לא נסגרה</b> – משבצות נופלות זו על זו (באדום), ופאה אחרת נשארת פתוחה.' : '✅ <b>נסגרה קובייה!</b> כל משבצת – פאה אחרת.') : 'הזיזו את המחוון או לחצו "קפלו"' }); };
        pq.querySelectorAll('[data-y]').forEach(b => b.onclick = () => { const y = b.dataset.y === '1', ok = y === !bad.size; pq.innerHTML = `<div class="${isClass() ? 'say' : ok ? 'fb-ok' : 'fb-bad'}">${isClass() ? 'הכיתה ניבאה: ' + (y ? 'כן' : 'לא') + '. עכשיו מקפלים ובודקים!' : ok ? '✓ ניבוי נכון! קפלו ובדקו.' : '✗ הניבוי לא נכון – קפלו וראו למה.'}</div>`; open(); });
      };
      host.querySelectorAll('[data-k]').forEach(b => b.onclick = () => set(+b.dataset.k)); set(0);
    },
    dice(root) {
      const cells = [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]], txt = ['1', '3', '2', '4', '5', '6'];
      const net = S3.gridNet(cells);
      const host = root.querySelector('[data-np]');
      host.innerHTML = `<div class="two-figs"><figure>${S3.flatSVG(net, { W: 200, H: 160, maxS: 46, txt, fill: k => PAL6[k % 6] })}<figcaption>הפריסה עם המספרים</figcaption></figure><div class="np2"></div></div>`;
      S3.netPlayer(host.querySelector('.np2'), net, { W: 240, H: 200, fill: k => PAL6[k % 6], onT: t => t > 0.97 ? '1 מול 6 · 2 מול 5 · 3 מול 4' : '' });
    },
    boxNet(root) { const net = G6.boxNet(3, 2, 1.4); S3.netPlayer(root.querySelector('[data-np]'), net, { t: 0, onT: t => t > 0.97 ? 'כל זוג באותו צבע – פאות נגדיות זהות.' : '' }); },
    // שיעור 4
    layers(root) {
      const el = root.querySelector('[data-layers]'), f = el.dataset.fixed ? el.dataset.fixed.split(',').map(Number) : null, tg = el.dataset.target ? +el.dataset.target : null;
      layerBuilder(el, f ? { fixed: f[2] ? f : [f[0], f[1], 0], target: tg } : {});
    },
    boxBase(root) {
      const a = 5, b = 3, c = 2, host = root.querySelector('[data-bases]'), say = root.querySelector('[data-say]');
      let base = 'p1';
      const D = { p1: [a, b, c, 'אורך × רוחב'], p2: [a, c, b, 'אורך × גובה'], p3: [b, c, a, 'רוחב × גובה'] };
      let v = null; v = S3.viewer(root.querySelector('[data-v]'), S3.box(a, b, c), { tools: ['rot', 'views'], labels: G6.boxLbl(a, b, c), fill: f => { const k = v ? v.st.m.K[f] : 'p1'; return k === base ? COL.b : '#eef1f8'; } });
      host.innerHTML = Object.keys(D).map(k => `<button type="button" class="tb" data-k="${k}">בסיס ${D[k][0]} × ${D[k][1]}</button>`).join('');
      const set = k => { base = k; host.querySelectorAll('[data-k]').forEach(b2 => b2.classList.toggle('on', b2.dataset.k === k)); const [x, y, h] = D[k]; say.innerHTML = `שטח הבסיס ${M(`${x} × ${y} = ${x * y}`)}, גובה ${h}: נפח ${M(`${x * y} × ${h} = ${a * b * c}`)} סמ"ק`; v.draw(); };
      host.querySelectorAll('[data-k]').forEach(b2 => b2.onclick = () => set(b2.dataset.k)); set('p1');
    },
    cube(root) { S3.viewer(root.querySelector('[data-v]'), S3.cube(3), { tools: ['rot', 'views'], labels: G6.boxLbl(3, 3, 3) }); },
    half(root) {
      const el = root.querySelector('[data-half]');
      el.innerHTML = `<div class="two-figs"><figure>${S3.render(S3.box(4, 3, 3), { W: 200, H: 170, extra: (S, pr) => { const P = [[-2, -1.5, -1.5], [2, 1.5, -1.5], [2, 1.5, 1.5], [-2, -1.5, 1.5]].map(p => S(pr(p))); return `<polygon points="${P.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="#e0703a" fill-opacity=".3" stroke="#e0703a" stroke-width="2.5" stroke-dasharray="6 4"/>`; } })}<figcaption>חותכים באלכסון</figcaption></figure><figure>${G6.halfBoxSVG(4, 3, 3)}<figcaption>חצי – מנסרה משולשת</figcaption></figure></div>`;
    },
    triV(root) { const a = 4, b = 3, h = 5, m = S3.triPrism(a, b, h); S3.viewer(root.querySelector('[data-v]'), m, { tools: ['rot', 'views', 'lay'], yaw: -130, pitch: 36, labels: [{ a: m.V[3], b: m.V[4], t: a }, { a: m.V[3], b: m.V[5], t: b }, { a: m.V[1], b: m.V[4], t: h, c: COL.H }] }); },
    triLay(root) { const a = 4, b = 3, h = 6, m = S3.lay(S3.triPrism(a, b, h)); S3.viewer(root.querySelector('[data-v]'), m, { tools: ['rot', 'views'], yaw: -40, labels: [{ a: m.V[3], b: m.V[4], t: a }, { a: m.V[3], b: m.V[5], t: b }, { a: m.V[1], b: m.V[4], t: h, c: COL.H }], hgt: null }); },
    liter(root) {
      const el = root.querySelector('[data-liter]');
      el.innerHTML = `<div class="lb-fig"></div><label class="s3-range"><span>0</span><input type="range" dir="rtl" min="1" max="10" value="1" aria-label="שכבות"><span>10</span></label><p class="say"></p>`;
      const f = el.querySelector('.lb-fig'), r = el.querySelector('input'), s = el.querySelector('.say');
      const draw = () => { const k = +r.value; f.innerHTML = S3.cubesSVG(S3.boxCubes(10, 10, k), { W: 300, H: 250, bb: [[0, 0, 0], [10, 10, 10]], layerCol: true, sw: 0.5 }); s.innerHTML = `${k} שכבות של 100 סמ"ק = ${M(fmt(100 * k))} סמ"ק${k === 10 ? ' = <b>ליטר אחד</b>' : ''}`; };
      r.oninput = draw; draw();
    },
    m3(root) { root.querySelector('[data-m3]').innerHTML = `<div class="two-figs"><figure>${S3.cubesSVG(S3.boxCubes(10, 10, 10), { W: 220, H: 200, col: f => f.dir[2] === 1 ? '#bfe6ea' : '#c6d4f5', sw: 0.5 })}<figcaption>1 מ"ק = ${M('10 × 10 × 10')} ליטרים</figcaption></figure></div>`; },
    units(root) {
      const items = [['סמ"ר', 'area'], ['סמ"ק', 'vol'], ['ליטר', 'vol'], ['ס"מ', 'len'], ['מ"ק', 'vol'], ['מ"ר', 'area'], ['מ"ל', 'vol'], ['מטר', 'len']], el = root.querySelector('[data-units]');
      el.innerHTML = `<div class="u-sort">${shuffle(items).map(([u, k]) => `<div class="u-card" data-k="${k}"><b>${u}</b><span><button type="button" class="chip" data-v="len">אורך</button><button type="button" class="chip" data-v="area">שטח</button><button type="button" class="chip" data-v="vol">נפח</button></span><span class="ufb"></span></div>`).join('')}</div>${isClass() ? '<button type="button" class="btn sec" data-rv>👁️ חשיפה</button>' : ''}`;
      const name = { len: 'אורך', area: 'שטח', vol: 'נפח' };
      el.querySelectorAll('.u-card').forEach(c => c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { c.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); if (!isClass()) { const ok = b.dataset.v === c.dataset.k; c.querySelector('.ufb').innerHTML = ok ? '✓' : `✗ ${c.dataset.k === 'area' ? 'ריבועים – שטח' : c.dataset.k === 'vol' ? 'קוביות – נפח' : 'קו – אורך'}`; } }));
      const rv = el.querySelector('[data-rv]'); if (rv) rv.onclick = () => el.querySelectorAll('.u-card').forEach(c => { c.querySelector('.ufb').innerHTML = '→ ' + name[c.dataset.k]; });
    },
    tank(root) { tankVis(root.querySelector('[data-tank]'), [20, 10, 25, 0]); const el = root.querySelector('[data-tank]'), r = el.querySelector('input'), s = el.querySelector('.say'), f = el.querySelector('.tk-fig'); r.oninput = () => { const v = +r.value; f.innerHTML = S3.tankSVG(20, 10, 25, v, { lw: v || false }); s.innerHTML = `גובה המים ${v} ס"מ · ${M(`20 × 10 × ${v} = ${fmt(200 * v)}`)} סמ"ק = ${fmt(200 * v / 1000)} ליטר`; }; r.oninput(); },
    tank2(root) {
      const el = root.querySelector('[data-tank2]');
      el.innerHTML = `<div class="pair-btns"><button type="button" class="tb on" data-b="1">בסיס 20 × 20</button><button type="button" class="tb" data-b="2">בסיס 40 × 20</button></div><div class="tk-fig"></div><p class="say"></p>`;
      const draw = k => { const a = 20 * k, h = 8000 / (a * 20); el.querySelector('.tk-fig').innerHTML = S3.tankSVG(a, 20, 30, h, { lw: h }); el.querySelector('.say').innerHTML = `8 ליטר = 8,000 סמ"ק · ${M(`8,000 : ${a * 20} = ${h}`)} ס"מ`; el.querySelectorAll('[data-b]').forEach(b => b.classList.toggle('on', +b.dataset.b === k)); };
      el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => draw(+b.dataset.b)); draw(1);
    },
    // שיעור 5
    saFold(root) { const net = G6.boxNet(3, 2, 1.4); S3.netPlayer(root.querySelector('[data-np]'), net, { t: 1, onT: t => t < 0.03 ? 'הפריסה פרושה – השטח שלה הוא שטח הפנים.' : '' }); },
    saNet(root) {
      const a = 5, b = 3, c = 2, D = G6.boxFaceDims(a, b, c), net = G6.boxNet(a, b, c), el = root.querySelector('[data-sanet]'), got = {};
      el.innerHTML = `<div class="sa-f"></div><div class="sa-in" hidden><span class="sa-lbl"></span> <input class="numin sm" inputmode="numeric" dir="ltr"> סמ"ר <button type="button" class="btn sm">✓</button> <span class="sa-fb"></span></div><p class="say"></p>`;
      const f = el.querySelector('.sa-f'), box = el.querySelector('.sa-in'), inp = box.querySelector('input'), s = el.querySelector('.say'); let cur = -1;
      const draw = () => { f.innerHTML = S3.flatSVG(net, { W: 300, H: 240, pick: true, fs: 12, txt: D.map((d, i) => got[i] != null ? `${d[0] * d[1]}` : `${d[0]}×${d[1]}`), fill: i => got[i] != null ? COL[net.K[i]] : '#eef1f8' }); const n = Object.keys(got).length; s.innerHTML = n === 6 ? `כל 6 הפאות: ${M(`${D.map(d => d[0] * d[1]).join(' + ')} = ${2 * (a * b + a * c + b * c)}`)} סמ"ר. שימו לב – כל מספר מופיע <b>פעמיים</b>!` : `מילאתם ${n} מתוך 6`; };
      f.onclick = e => { const t = e.target.closest('[data-i]'); if (!t) return; cur = +t.dataset.i; if (got[cur] != null) return; box.hidden = false; box.querySelector('.sa-lbl').textContent = `שטח המלבן ${D[cur][0]} × ${D[cur][1]} =`; inp.value = ''; box.querySelector('.sa-fb').textContent = ''; inp.focus(); if (isClass()) { got[cur] = 1; box.hidden = true; draw(); } };
      const ck = () => { if (cur < 0 || got[cur] != null) return; const v = parseNum(inp.value), d = D[cur]; if (v === d[0] * d[1]) { got[cur] = v; box.hidden = true; draw(); } else box.querySelector('.sa-fb').textContent = v === d[0] + d[1] ? '✗ חיברתם – שטח מלבן = אורך × רוחב' : v === 2 * (d[0] + d[1]) ? '✗ זה ההיקף. שטח = אורך × רוחב' : '✗ נסו שוב'; };
      box.querySelector('button').onclick = ck; inp.onkeydown = e => { if (e.key === 'Enter') ck(); };
      draw();
    },
    saSort(root) {
      const items = [['נייר לעטיפת מתנה', 'sa'], ['מים באקווריום', 'v'], ['צבע לקירות חדר', 'sa'], ['חול בארגז', 'v'], ['בד לכיסוי ספה', 'sa'], ['אוויר בבלון', 'v']], el = root.querySelector('[data-sasort]');
      el.innerHTML = `<div class="u-sort">${items.map(([t, k]) => `<div class="u-card" data-k="${k}"><b>${t}</b><span><button type="button" class="chip" data-v="sa">שטח פנים</button><button type="button" class="chip" data-v="v">נפח</button></span><span class="ufb"></span></div>`).join('')}</div>${isClass() ? '<button type="button" class="btn sec" data-rv>👁️ חשיפה</button>' : ''}`;
      el.querySelectorAll('.u-card').forEach(c => c.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { c.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b)); if (!isClass()) c.querySelector('.ufb').innerHTML = b.dataset.v === c.dataset.k ? '✓' : (c.dataset.k === 'sa' ? '✗ מכסים מבחוץ – שטח פנים' : '✗ ממלאים מבפנים – נפח'); }));
      const rv = el.querySelector('[data-rv]'); if (rv) rv.onclick = () => el.querySelectorAll('.u-card').forEach(c => { c.querySelector('.ufb').innerHTML = '→ ' + (c.dataset.k === 'sa' ? 'שטח פנים' : 'נפח'); });
    }
  };
  G6.SETUPS = SETUPS; // לבדיקות

  /* ---------- כניסה ---------- */
  try { sessionStorage.setItem('math-cat', 'geo'); } catch (e) { /* לא חובה */ } // חזרה לאתר → קטגוריית הגאומטריה
  const l0 = URLP.get('l'), p0 = URLP.get('p'), v0 = URLP.get('v');
  NAV = l0 && unitById(l0) ? { v: 'lesson', l: l0, p: PARTS.some(x => x[0] === p0) ? p0 : 'teach' } : v0 === 'exit' ? { v: 'exit' } : v0 === 'review' ? { v: 'review' } : URLP.get('ch') === 'prism' || !URLP.has('ch') ? { v: URLP.has('ch') ? 'chapter' : 'home' } : { v: 'home' };
  try { history.replaceState(NAV, ''); } catch (e) { /* לא חובה */ }
  route();
  window.G6APP = { go, setMode, mountQ, buildRound, UNITS, P: () => PROG };
})();
