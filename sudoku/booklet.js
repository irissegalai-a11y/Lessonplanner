/* מחולל חוברות ודפי עבודה בסודוקו – למורים. A4, RTL, בלי חיתוך לוחות בין עמודים.
   המורה בוחרת: סוג תוצר, סוגי חידות × רמות × כמויות, תכנים נוספים, פריסה ועיצוב; רואה תצוגה מקדימה, עורכת ומדפיסה. */
(function (root) {
  'use strict';
  const E = root.SDK, C = root.SDKC, B = root.SBD;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* לא חובה */ } } };
  const TYPES = ['4', '6', '9', 'k4', 'k6', 'k9'], LV = E.LEVEL_NAME, STARS = l => '★'.repeat(l) + '☆'.repeat(4 - l);
  const TN = t => E.TYPES[t].name;

  /* ---------- הגדרות ---------- */
  const CONTENT = [
    ['cover', 'עמוד שער'], ['name', 'שם החוברת בכל עמוד'], ['student', 'שם התלמיד והכיתה'], ['rules', 'הסבר על כללי הסודוקו'],
    ['examples', 'דוגמה פתורה'], ['strategies', 'הסבר על אסטרטגיות פתרון'], ['guided', 'תרגול מונחה עם רמזים'], ['tasks', 'משימות חשיבה והנמקה'],
    ['space', 'מקום לכתיבת דרך החשיבה'], ['track', 'טבלת מעקב אישית'], ['sol', 'פתרונות בסוף החוברת'], ['solExp', 'פתרונות עם הסבר על האסטרטגיות']
  ];
  const zero = () => Object.fromEntries(TYPES.map(t => [t, { 1: 0, 2: 0, 3: 0, 4: 0 }]));
  const cnt = o => { const z = zero(); Object.keys(o).forEach(t => Object.assign(z[t], o[t])); return z; };
  const on = keys => Object.fromEntries(CONTENT.map(([k]) => [k, keys.includes(k)]));
  const PRESETS = {
    sheet: { n: 'דף עבודה בודד', title: 'דף סודוקו', counts: cnt({ '6': { 1: 2, 2: 2 } }), content: on(['student', 'sol']), layout: 'auto', order: 'graded' },
    learn: { n: 'חוברת לימוד', title: 'לומדים לפתור סודוקו', counts: cnt({ '4': { 1: 2, 2: 2 }, '6': { 1: 2, 2: 2 } }), content: on(['cover', 'name', 'student', 'rules', 'examples', 'strategies', 'guided', 'tasks', 'space', 'sol', 'solExp']), layout: 'auto', order: 'graded' },
    practice: { n: 'חוברת תרגול', title: 'מתרגלים סודוקו', counts: cnt({ '6': { 1: 2, 2: 2 }, '9': { 1: 2, 2: 2 } }), content: on(['cover', 'name', 'student', 'track', 'sol']), layout: 'auto', order: 'graded' },
    graded: { n: 'חוברת מדורגת', title: 'חושבים בהיגיון – חוברת סודוקו', counts: cnt({ '4': { 1: 2, 2: 2 }, '6': { 1: 1, 2: 1, 3: 1, 4: 1 }, '9': { 1: 1, 2: 1, 3: 1, 4: 1 } }), content: on(['cover', 'name', 'student', 'rules', 'sol']), layout: 2, order: 'graded' },
    excel: { n: 'חוברת מצוינות', title: 'אתגרי סודוקו – חוברת מצוינות', counts: cnt({ '6': { 4: 2 }, '9': { 3: 2, 4: 2 }, 'k6': { 2: 1, 3: 1 } }), content: on(['cover', 'name', 'student', 'strategies', 'tasks', 'space', 'sol', 'solExp']), layout: 'auto', order: 'graded', style: 'clean' },
    custom: { n: 'משולבת בהתאמה אישית' }
  };
  const DEF = () => Object.assign({ preset: 'graded', style: 'bw', seed: E.randSeed() }, JSON.parse(JSON.stringify(PRESETS.graded)));
  let cfg = Object.assign(DEF(), ls.get('sdk-bk-cfg', {}));
  const saveCfg = () => ls.set('sdk-bk-cfg', cfg);
  let items = []; // [{type, level, seed, puz, task, hint}]

  /* ---------- פריסה (מ"מ) ---------- */
  const PAGE = { w: 210, h: 297, m: 13, head: 9, foot: 8 };
  const CW = PAGE.w - 2 * PAGE.m, CH = PAGE.h - 2 * PAGE.m - PAGE.head - PAGE.foot;
  const MIN_CELL = { '4': 13, '6': 11, '9': 10, 'k4': 14, 'k6': 12, 'k9': 11 }; // מינימום לכתיבה ולסימון מועמדים
  const MAX_BOARD = { '4': 70, '6': 96, '9': 150, 'k4': 80, 'k6': 110, 'k9': 165 };
  const AUTO_PER = { '4': 4, '6': 4, '9': 2, 'k4': 4, 'k6': 2, 'k9': 1 };
  const EXTRA = () => 7 + (cfg.content.guided ? 7 : 0) + (cfg.content.tasks ? 14 : 0) + (cfg.content.space ? 21 : 0);
  function slotDims(per) { const rows = per === 4 ? 2 : per, cols = per === 4 ? 2 : 1; return { w: (CW - (cols - 1) * 4) / cols, h: (CH - (rows - 1) * 4) / rows }; }
  function boardSize(type, per) { const s = slotDims(per); return Math.min(MAX_BOARD[type], s.w - 4, s.h - EXTRA() - 3); }
  const fits = (type, per) => boardSize(type, per) / E.TYPES[type].n >= MIN_CELL[type];
  function perFor(type) {
    if (cfg.layout !== 'auto') return +cfg.layout;
    for (const p of [AUTO_PER[type], 2, 1].filter((v, i, a) => v <= AUTO_PER[type] && a.indexOf(v) === i)) if (fits(type, p)) return p;
    return 1;
  }
  function layoutWarnings() {
    const w = [];
    const used = [...new Set(items.length ? items.map(x => x.type) : TYPES.filter(t => Object.values(cfg.counts[t]).some(v => v > 0)))];
    used.forEach(t => { if (!fits(t, perFor(t))) w.push(`בפריסה של ${perFor(t) === 1 ? 'לוח אחד' : perFor(t) + ' לוחות'} בעמוד, המשבצות בלוחות ${TN(t)} יהיו קטנות מדי לכתיבה ולסימון מועמדים (${(boardSize(t, perFor(t)) / E.TYPES[t].n).toFixed(1)} מ"מ, צריך לפחות ${MIN_CELL[t]}). בחרו פחות לוחות בעמוד, פריסה אוטומטית או פחות תכנים נוספים.`); });
    return w;
  }

  /* ---------- יצירת החידות ---------- */
  function wanted() {
    const list = [];
    TYPES.forEach(t => E.LEVELS.forEach(l => { const k = +cfg.counts[t][l] || 0; for (let i = 0; i < k; i++) if (E.supported(t, l)) list.push({ type: t, level: l, k: i }); }));
    // מדורג: מהלוח הקטן לגדול, ובכל גודל – מהרמה הקלה לקשה (9×9 קל קשה יותר מ-4×4 בינוני)
    if (cfg.order === 'graded') list.sort((a, b) => E.TYPES[a.type].n - E.TYPES[b.type].n || (a.type[0] === 'k') - (b.type[0] === 'k') || a.level - b.level);
    return list;
  }
  function genItem(type, level, seed, keys) {
    for (let t = 0; t < 8; t++) {
      const s = t ? seed + 'x' + t : seed, p = E.generateSafe(type, level, s, 4);
      if (p && !keys.has(p.key)) { keys.add(p.key); return decorate({ type, level, seed: p.seed, puz: p }); }
    }
    return null;
  }
  function decorate(it) { it.task = cfg.content.tasks ? makeTask(it.puz, it.idx || 0) : null; it.hint = cfg.content.guided ? printHint(it.puz) : null; return it; }
  function buildAll(done) {
    const list = wanted(), keys = new Set(); items = [];
    const prog = $('bkProg');
    let i = 0;
    (function step() {
      if (i >= list.length) { items.forEach((it, k) => { it.idx = k; decorate(it); }); done(); return; }
      const w = list[i];
      if (prog) prog.textContent = `יוצרים חידה ${i + 1} מתוך ${list.length}…`;
      const it = genItem(w.type, w.level, cfg.seed + '-' + w.type + w.level + '-' + w.k, keys);
      if (it) items.push(it); else if (prog) prog.textContent = `לא נמצאה חידה מתאימה ל-${TN(w.type)} ${LV[w.level]} – דילגנו עליה.`;
      i++; setTimeout(step, 0);
    })();
  }

  /* ---------- רמזים ומשימות חשיבה ---------- */
  const posText = (n, i) => `שורה ${(i / n | 0) + 1} מלמעלה, עמודה ${i % n + 1} מימין`;
  // הצעד הראשון שמציב מספר (עם הסקות לפניו, בסכומים)
  function firstPlace(p, avoid) {
    const ctx = E.ctxOf(p.n, p.cages), S = E.newState(ctx, p.givens);
    for (let t = 0; t < 200; t++) {
      const st = E.findStep(ctx, S, 5, E.COACH_ORDER); if (!st) return null;
      if (st.place && !(avoid && avoid.includes(st.place[0]))) return { ctx, S: { v: S.v.slice(), c: S.c.slice() }, st };
      E.apply(ctx, S, st);
    }
    return null;
  }
  const toPrint = t => t.replace(/המודגשת/g, 'המוצללת').replace(/המודגש/g, 'המוצלל').replace(/המסומנות ב-✗/g, 'האחרות').replace(/המספרים המודגשים/g, 'המספרים').replace(/המודגשים/g, '');
  function unitCells(ctx, st) {
    if (st.unit != null) return ctx.units[st.unit].cells;
    if (st.cage != null) return ctx.cages[st.cage].cells;
    return [];
  }
  function printHint(p) {
    const f = firstPlace(p); if (!f) return null;
    const { st, ctx } = f, nm = C.NAME[st.s];
    const sh = unitCells(ctx, st);
    const where = st.s === 'nakedSingle' ? 'במשבצת המסומנת בכוכבית' : st.cage != null ? 'בכלוב המוצלל' : ctx.units[st.unit].t === 'r' ? 'בשורה המוצללת' : ctx.units[st.unit].t === 'c' ? 'בעמודה המוצללת' : 'באזור המוצלל';
    return { t: `רמז: התחילו ${where} – חפשו "${nm}".`, shade: sh, star: st.s === 'nakedSingle' ? [st.place[0]] : [] };
  }
  const KINDS = ['must', 'whyNot', 'claim', 'elim', 'which', 'enough', 'error', 'start'];
  function makeTask(p, k) {
    const n = p.n, ctx = E.ctxOf(n, p.cages), S0 = E.newState(ctx, p.givens), f = firstPlace(p);
    if (!f) return null;
    const L = C.ladder(f.ctx, f.S, f.st, p), noQ = t => t.split(/(?<=[.?!])\s+/).filter(x => !x.trim().endsWith('?')).join(' ');
    const why = (noQ(toPrint(L[2].t)) + ' ' + toPrint(L[3].t)).trim();
    const [ci, cd] = f.st.place;
    const empt = p.givens.map((v, i) => v ? -1 : i).filter(i => i >= 0);
    const kind = KINDS[k % KINDS.length];
    const R = E.rng(p.id + 't' + k), pick = a => a[Math.floor(R() * a.length)];
    if (kind === 'must') return { q: 'איזה מספר חייב להופיע במשבצת המסומנת? נמקו.', a: `${cd}. ${why}`, mark: [ci], shade: unitCells(f.ctx, f.st) };
    if (kind === 'which') return { q: 'איזו דרך מתאימה כדי למלא את המשבצת המסומנת: המספר החסר, האפשרות היחידה או המקום היחיד? הסבירו.', a: `${C.NAME[f.st.s]}${['fullHouse', 'nakedSingle', 'hiddenSingle'].includes(f.st.s) ? '' : ' (דרך מתקדמת)'}: ${why}`, mark: [ci] };
    if (kind === 'start') return { q: 'באיזו משבצת כדאי להתחיל לפתור? הקיפו אותה והסבירו למה.', a: `למשל ${posText(n, ci)}: ${why}`, ans: [ci] };
    if (kind === 'whyNot') {
      const opts = [];
      empt.forEach(i => ctx.peers[i].forEach(j => { if (S0.v[j] && S0.v[j] !== p.solution[i]) opts.push([i, S0.v[j], j]); }));
      if (!opts.length) return makeTask(p, k + 1);
      const [i, d, j] = pick(opts), g = ctx.g;
      const where = g.R[i] === g.R[j] ? 'באותה שורה' : g.C[i] === g.C[j] ? 'באותה עמודה' : g.B[i] === g.B[j] ? 'באותו אזור' : 'באותו כלוב';
      return { q: `מדוע המספר ${d} אינו יכול להופיע במשבצת המסומנת?`, a: `כי כבר יש ${d} ${where} של המשבצת (${posText(n, j)}). כל מספר מופיע פעם אחת בכל ${where.replace('באותה ', '').replace('באותו ', '')}.`, mark: [i] };
    }
    if (kind === 'elim') {
      const i = ci, ex = E.digs(ctx.g.FULL & ~S0.c[i] & ~(1 << p.solution[i]));
      if (ex.length < 2) return { q: 'איזה מספר חייב להופיע במשבצת המסומנת? נמקו.', a: `${cd}. ${why}`, mark: [ci] };
      return { q: 'אילו מספרים אפשר לפסול במשבצת המסומנת – ולמה?', a: `אפשר לפסול את ${C.list(ex)}: הם כבר מופיעים בשורה, בעמודה${p.cages ? ', באזור או בכלוב' : ' או באזור'} של המשבצת. ${E.digs(S0.c[i]).length > 1 ? `נשארים ${C.list(E.digs(S0.c[i]))}.` : ''}`, mark: [i] };
    }
    if (kind === 'enough') {
      const multi = empt.filter(i => E.pc(S0.c[i]) >= 2 && i !== ci);
      if (multi.length && R() < 0.7) { const i = pick(multi); return { q: 'האם יש מספיק מידע כדי לקבוע כבר עכשיו מה יהיה במשבצת המסומנת?', a: `עדיין אין מספיק מידע: בשלב הזה יכולים להיות בה ${C.list(E.digs(S0.c[i]))}. צריך קודם למלא משבצות אחרות.`, mark: [i] }; }
      return { q: 'האם יש מספיק מידע כדי לקבוע כבר עכשיו מה יהיה במשבצת המסומנת?', a: `כן. ${why}`, mark: [ci] };
    }
    if (kind === 'claim') {
      // לסירוגין: טענה שגויה (עם סתירה קצרה) או טענה נכונה
      if (R() < 0.6) {
        const cands = E.digs(S0.c[ci]).filter(d => d !== cd);
        for (const d of cands) {
          const g2 = p.givens.slice(); g2[ci] = d; const cx = C.contradiction(ctx, g2);
          if (cx && cx.chain.length <= 4) return { q: `תלמיד כתב ${d} במשבצת המסומנת. האם הוא צודק? נמקו.`, a: `לא. ${d} לא שובר כלל מיד, אבל הוא מוביל לסתירה בהמשך. במשבצת הזאת חייב להיות ${cd}: ${why}`, mark: [ci] };
        }
      }
      return { q: `תלמיד כתב ${cd} במשבצת המסומנת. האם הוא צודק? נמקו.`, a: `כן. ${why}`, mark: [ci] };
    }
    if (kind === 'error') {
      // מספר שגוי אחד בכתב דק שיוצר כפילות עם נתון
      const opts = [];
      empt.forEach(i => ctx.g.uOf[i].forEach(u => ctx.units[u].cells.forEach(j => { if (S0.v[j] && (S0.c[i] >> S0.v[j] & 1) === 0 && S0.v[j] !== p.solution[i]) opts.push([i, S0.v[j], u]); })));
      if (!opts.length) return makeTask(p, k + 1);
      const [i, d, u] = pick(opts), t = ctx.units[u].t;
      return { q: 'מישהו התחיל לפתור וכתב מספר אחד בכתב דק – אבל טעה. מצאו את הטעות והסבירו.', a: `ב${posText(n, i)} נכתב ${d}, אבל יש כבר ${d} ${t === 'r' ? 'באותה שורה' : t === 'c' ? 'באותה עמודה' : 'באותו אזור'}. צריך למחוק אותו (שם צריך להיות ${p.solution[i]}).`, wrong: [i, d], ans: [i] };
    }
    return null;
  }

  /* ---------- בניית העמודים ---------- */
  const STY = {
    bw: { boxFill: null, accent: '#222', soft: '#f1f1f1', mark: '#e6e6e6', shade: '#f0f0f0' },
    pastel: { boxFill: '#f4effc', accent: '#6b3fa0', soft: '#f6f1fd', mark: '#ffe9a8', shade: '#e8f3ff' },
    clean: { boxFill: null, accent: '#1f3a68', soft: '#eef2f8', mark: '#fde9b0', shade: '#eaf0f8' }
  };
  function boardOf(it, size, sol) {
    const st = STY[cfg.style] || STY.bw, p = it.puz, tk = it.task, hn = it.hint;
    let vals = sol ? p.solution : p.givens.slice();
    if (tk && tk.wrong && !sol) { vals = vals.slice(); vals[tk.wrong[0]] = tk.wrong[1]; }
    const mark = [...(tk && tk.mark || []), ...(sol && tk && tk.ans || [])];
    const shade = [...(hn ? hn.shade : []), ...(tk && tk.shade && sol ? tk.shade : [])].filter(i => !mark.includes(i));
    // צבעי סימון: בהיר לרמז (יחידה), כהה יותר למשבצת המשימה
    let svg = B.boardSVG(p, { values: vals, size, boxFill: st.boxFill, mark: [...shade, ...mark], markFills: [...shade.map(() => st.shade), ...mark.map(() => st.mark)], thick: cfg.style === 'clean' ? st.accent : '#1d2433' });
    // כוכבית במשבצת (רמז) + מסגרת כפולה למשבצת המשימה
    const n = p.n;
    const extra = [...(hn && !sol ? hn.star : []), ...mark].map(i => { const x = n - i % n - 1, y = i / n | 0; return `<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" fill="none" stroke="#333" stroke-width="0.05"/>${hn && hn.star.includes(i) && !sol ? `<text x="${x + 0.18}" y="${y + 0.3}" font-size="0.26" text-anchor="middle">★</text>` : ''}`; }).join('');
    return svg.replace('</svg>', extra + '</svg>');
  }
  function pageWrap(inner, cls, num) {
    const st = STY[cfg.style] || STY.bw;
    return `<section class="pg ${cls || ''} sty-${cfg.style}" style="--acc:${st.accent};--soft:${st.soft}">
      <div class="pg-h">${cfg.content.name ? `<span>${esc(cfg.title)}</span>` : '<span></span>'}${cfg.content.student && cls !== 'cover' ? '<span class="pg-nm">שם: ____________ כיתה: _____</span>' : ''}</div>
      <div class="pg-b">${inner}</div>
      <div class="pg-f"><span>mathinclass</span><span>${num ? 'עמוד ' + num : ''}</span></div></section>`;
  }
  function slotHTML(it, per, n) {
    const s = slotDims(per), size = boardSize(it.type, per);
    return `<div class="slot" style="width:${s.w}mm;height:${s.h}mm">
      <div class="sl-h"><b>חידה ${n}</b> · ${esc(TN(it.type))} · <span aria-label="רמה ${it.level}">${STARS(it.level)}</span> ${LV[it.level]}<span class="sl-id">${esc(it.puz.id)}</span></div>
      <div class="sl-b">${boardOf(it, size)}</div>
      ${it.hint ? `<div class="sl-hint">💡 ${B.eqWrap(esc(it.hint.t))}</div>` : ''}
      ${it.task ? `<div class="sl-task">🤔 ${B.eqWrap(esc(it.task.q))}</div>` : ''}
      ${cfg.content.space ? '<div class="sl-space"><span>דרך החשיבה שלי:</span><i></i><i></i><i></i></div>' : ''}
    </div>`;
  }
  function rulesPage() {
    const ex = E.generateSafe('4', 1, 'rules-sheet'), g = E.geo(4);
    const row = B.boardSVG(ex, { values: ex.solution, size: 42, mark: g.units[0].cells, markFill: '#ffe9a8' });
    const col = B.boardSVG(ex, { values: ex.solution, size: 42, mark: g.units[4].cells, markFill: '#ffe9a8' });
    const box = B.boardSVG(ex, { values: ex.solution, size: 42, mark: g.units[8].cells, markFill: '#ffe9a8' });
    const k = items.some(x => x.puz.killer);
    return `<h2>כללי הסודוקו</h2>
      <p>ממלאים את כל המשבצות הריקות כך שבכל <b>שורה</b>, בכל <b>עמודה</b> ובכל <b>אזור</b> (המלבן המוקף בקו עבה) – כל מספר יופיע <b>פעם אחת בדיוק</b>.</p>
      <p>בלוח 4×4 – המספרים 1 עד 4 · בלוח 6×6 – 1 עד 6 · בלוח 9×9 – 1 עד 9.</p>
      <div class="rl-figs"><figure>${row}<figcaption>שורה</figcaption></figure><figure>${col}<figcaption>עמודה</figcaption></figure><figure>${box}<figcaption>אזור</figcaption></figure></div>
      <h3>טיפים</h3><ul class="tips"><li>אין צורך לנחש. בכל חידה תמיד יש משבצת שאפשר להסיק בוודאות.</li><li>מתחילים מהמקומות שבהם כבר כתובים הרבה מספרים.</li><li>כשקשה – כותבים בעיפרון מספרים קטנים: כל מה שעוד אפשרי במשבצת.</li><li>בודקים כל מספר: האם הוא כבר מופיע בשורה, בעמודה או באזור?</li></ul>
      ${k ? `<h3>סודוקו סכומים</h3><p>כמו סודוקו רגיל – ועוד כלל: הלוח מחולק ל<b>כלובים</b> מקווקווים. המספר הקטן בפינת הכלוב הוא <b>סכום</b> המספרים בכלוב, ובתוך כלוב מספר לא חוזר על עצמו.</p>` : ''}`;
  }
  function examplePage() {
    const small = items.find(x => x.type === '4') ? '4' : items.find(x => x.type === '6') ? '6' : '4';
    const p = E.generateSafe(small, small === '4' ? 2 : 1, 'example-sheet'); if (!p) return '';
    const ctx = E.ctxOf(p.n, p.cages), S = E.newState(ctx, p.givens), steps = [];
    for (let t = 0; t < 60 && steps.length < 40; t++) { const st = E.findStep(ctx, S, 5, E.COACH_ORDER); if (!st) break; if (st.place) steps.push({ st, S: { v: S.v.slice(), c: S.c.slice() } }); E.apply(ctx, S, st); if (S.v.every(x => x)) break; }
    const order = {}; steps.forEach((x, k) => { order[x.st.place[0]] = k + 1; });
    const reason = x => {
      const [i, d] = x.st.place, s = x.st.s, u = x.st.unit != null ? ctx.units[x.st.unit] : null;
      const un = u ? (u.t === 'r' ? 'בשורה' : u.t === 'c' ? 'בעמודה' : 'באזור') : '';
      if (s === 'fullHouse') return `${d} – המספר החסר ${un}.`;
      if (s === 'nakedSingle') return `${d} – האפשרות היחידה: שאר המספרים כבר תפוסים בשורה, בעמודה ובאזור.`;
      if (s === 'hiddenSingle') return `${d} – המקום היחיד ${un} שבו ${d} יכול להיות.`;
      return `${d} – ${C.NAME[s]}.`;
    };
    const solved = B.boardSVG(p, { values: p.solution, size: 62 });
    const tagged = solved.replace('</svg>', Object.keys(order).map(i => { i = +i; const x = p.n - i % p.n - 1, y = i / p.n | 0; return `<text x="${x + 0.16}" y="${y + 0.27}" font-size="0.22" text-anchor="middle" fill="#a05a00" font-weight="700">${order[i]}</text>`; }).join('') + '</svg>');
    const half = Math.ceil(steps.length / 2);
    return `<h2>דוגמה פתורה – צעד אחר צעד</h2>
      <p>כך פותרים בלי לנחש: בכל צעד מוצאים משבצת שאפשר להיות בטוחים בה. המספר הקטן בפינה מראה את סדר הצעדים.</p>
      <div class="ex-figs"><figure>${B.boardSVG(p, { size: 62 })}<figcaption>החידה</figcaption></figure><figure>${tagged}<figcaption>הפתרון וסדר הצעדים</figcaption></figure></div>
      <div class="ex-steps"><ol>${steps.slice(0, half).map(x => `<li><b>${posText(p.n, x.st.place[0])}:</b> ${B.eqWrap(esc(reason(x)))}</li>`).join('')}</ol><ol start="${half + 1}">${steps.slice(half).map(x => `<li><b>${posText(p.n, x.st.place[0])}:</b> ${B.eqWrap(esc(reason(x)))}</li>`).join('')}</ol></div>`;
  }
  const EXKEY = { lockedPointing: 'locked', lockedClaiming: 'locked', cageSingle: 'krules', multiSum: 'unitSum' };
  function strategiesPage() {
    const used = new Set(); items.forEach(x => (x.puz.grade.strategies || []).forEach(s => used.add(s)));
    if (!used.size) ['fullHouse', 'nakedSingle', 'hiddenSingle'].forEach(s => used.add(s));
    const seen = new Set(), list = E.ORDER.filter(s => used.has(s)).filter(s => { const k = C.NAME[s]; if (seen.has(k)) return false; seen.add(k); return true; });
    return `<h2>אסטרטגיות פתרון</h2><p>אלה הדרכים שבהן תשתמשו בחידות שבחוברת – מהקלה אל המתקדמת.</p>
      <div class="strats">${list.map(s => { const ex = C.EXPLAIN[EXKEY[s] || s]; return `<div class="strat"><h3>${C.ICON[s]} ${esc(C.NAME[s])}</h3>${ex ? ex.map(l => `<p>${B.eqWrap(esc(l))}</p>`).join('') : `<p>${esc(C.SHORT[s])}</p>`}</div>`; }).join('')}</div>`;
  }
  function trackPage() {
    return `<h2>טבלת המעקב שלי</h2><table class="trk"><thead><tr><th>חידה</th><th>סוג</th><th>רמה</th><th>פתרתי ✓</th><th>לבד / עם עזרה</th><th>איך הרגשתי</th></tr></thead><tbody>${items.map((it, k) => `<tr><td>${k + 1}</td><td>${esc(TN(it.type))}</td><td>${LV[it.level]}</td><td></td><td></td><td>😊 😐 😕</td></tr>`).join('')}</tbody></table>`;
  }
  function solPages(startNum) {
    const per = 6, pages = [];
    for (let k = 0; k < items.length; k += per) {
      const chunk = items.slice(k, k + per);
      pages.push(`<h2>פתרונות${k ? ' (המשך)' : ''}</h2><div class="sol-grid">${chunk.map((it, j) => {
        const strat = (it.puz.grade.strategies || []).map(s => C.NAME[s]).filter((v, i, a) => a.indexOf(v) === i);
        const size = it.puz.n === 9 ? 60 : it.puz.n === 6 ? 52 : 42;
        return `<div class="sol"><div class="sol-h"><b>חידה ${k + j + 1}</b> · ${esc(TN(it.type))} · ${LV[it.level]}</div>${boardOf(it, size, true)}
          ${cfg.content.solExp ? `<div class="sol-t">אסטרטגיות: ${esc(strat.join(' · '))} · ${it.puz.grade.steps} צעדים</div>` : ''}
          ${it.task ? `<div class="sol-t"><b>תשובה למשימה:</b> ${B.eqWrap(esc(it.task.a))}</div>` : ''}${it.hint && cfg.content.solExp ? '' : ''}</div>`;
      }).join('')}</div>`);
    }
    return pages;
  }
  function coverPage() {
    const p = E.generateSafe('6', 1, 'cover-' + cfg.seed) || items[0].puz; // לוח קישוט שאינו אחת החידות
    const types = [...new Set(items.map(x => x.type))].map(t => `${items.filter(x => x.type === t).length} חידות ${TN(t)}`);
    const lv = [...new Set(items.map(x => x.level))].sort().map(l => LV[l]);
    return `<div class="cv"><div class="cv-t">${esc(cfg.title)}</div><div class="cv-s">חשיבה לוגית · הסקת מסקנות · התמדה</div>
      <div class="cv-b">${B.boardSVG(p, { size: 78, values: p.givens })}</div>
      ${cfg.content.student ? '<div class="cv-nm"><div>שם: ______________________</div><div>כיתה: __________</div></div>' : ''}
      <div class="cv-c">בחוברת: ${esc(types.join(' · '))}${lv.length ? ' · רמות: ' + esc(lv.join(', ')) : ''}</div></div>`;
  }
  function buildPages(onlySol) {
    const pages = []; // [{html, cls}]
    if (!onlySol) {
      if (cfg.content.cover) pages.push({ h: coverPage(), cls: 'cover' });
      if (cfg.content.rules) pages.push({ h: rulesPage() });
      if (cfg.content.examples) pages.push({ h: examplePage() });
      if (cfg.content.strategies) pages.push({ h: strategiesPage() });
      // חידות: קבוצות לפי מספר הלוחות בעמוד
      let cur = null, n = 0;
      items.forEach(it => {
        const per = perFor(it.type);
        if (!cur || cur.per !== per || cur.list.length >= per) { cur = { per, list: [] }; pages.push({ grp: cur }); }
        cur.list.push(slotHTML(it, per, ++n));
      });
      if (cfg.content.track) pages.push({ h: trackPage() });
    }
    if (cfg.content.sol || onlySol) solPages().forEach(h => pages.push({ h, cls: 'solp' }));
    return pages.map((p, k) => pageWrap(p.grp ? `<div class="slots per${p.grp.per}">${p.grp.list.join('')}</div>` : p.h, p.cls, k + 1));
  }

  /* ---------- ממשק ---------- */
  let host = null, back = null;
  function open(el, opt) { host = el; back = opt && opt.back; render(); }
  function render() {
    const warn = layoutWarnings(), total = wanted().length;
    const saved = ls.get('sdk-bk-saved', []);
    host.innerHTML = `<button class="back" id="bkBack">→ למרכז הסודוקו</button>
      <h1>🖨️ מחולל חוברות ודפי עבודה</h1>
      <p class="muted">בוחרים מה נכנס, רואים תצוגה מקדימה ומדפיסים (או שומרים כ-PDF). כל החידות נבדקות: פתרון אחד בלבד, ורמה לפי הדרכים שצריך כדי לפתור.</p>
      <div class="bk-grid">
      <div class="card bk-sec"><h3>1. סוג התוצר</h3><div class="bk-opts">${Object.entries(PRESETS).map(([k, v]) => `<label><input type="radio" name="bkp" value="${k}" ${cfg.preset === k ? 'checked' : ''}> ${v.n}</label>`).join('')}</div>
        <p style="margin-top:10px"><label>כותרת: <input id="bkTitle" value="${esc(cfg.title)}" style="font:inherit;padding:6px 10px;border:2px solid var(--line);border-radius:10px;width:min(420px,100%)"></label></p></div>
      <div class="card bk-sec"><h3>2. אילו חידות וכמה</h3>
        <div style="overflow-x:auto"><table class="bk-t"><thead><tr><th>סוג</th>${E.LEVELS.map(l => `<th>${LV[l]}<br><span class="small">${STARS(l)}</span></th>`).join('')}</tr></thead><tbody>
        ${TYPES.map(t => `<tr><td>${esc(TN(t))}</td>${E.LEVELS.map(l => E.supported(t, l) ? `<td><input type="number" min="0" max="20" inputmode="numeric" data-t="${t}" data-l="${l}" value="${cfg.counts[t][l] || 0}" aria-label="${esc(TN(t))} ${LV[l]}"></td>` : `<td class="na" title="השילוב הזה לא אפשרי באמת בגודל הזה">—</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="small muted">"—" = שילוב שלא ניתן ליצור באמת (למשל ב-4×4 תמיד יש "אפשרות יחידה", ולכן אין בו רמה מאתגרת). סה"כ: <b id="bkTot">${total}</b> חידות.</p>
        <div class="bk-bar"><span class="small">בחירה מהירה:</span>
          <select id="bkSameL" style="font:inherit;padding:4px 8px;border-radius:8px">${E.LEVELS.map(l => `<option value="${l}">${LV[l]}</option>`).join('')}</select>
          <button class="btn sec" id="bkSame" style="min-height:38px">כל החידות באותה רמה</button>
          <label class="small"><input type="checkbox" id="bkOrder" ${cfg.order === 'graded' ? 'checked' : ''}> סידור מדורג מהקל אל הקשה</label>
          <button class="btn ghost" id="bkZero" style="min-height:38px">איפוס</button></div></div>
      <div class="card bk-sec"><h3>3. מה עוד נכנס לחוברת</h3><div class="bk-opts">${CONTENT.map(([k, n]) => `<label><input type="checkbox" data-c="${k}" ${cfg.content[k] ? 'checked' : ''}> ${n}</label>`).join('')}</div></div>
      <div class="card bk-sec"><h3>4. פריסה ועיצוב</h3>
        <div class="bk-opts">${[['auto', 'אוטומטית לפי גודל הלוח'], [1, 'לוח אחד בעמוד'], [2, 'שני לוחות בעמוד'], [4, 'ארבעה לוחות בעמוד']].map(([v, n]) => `<label><input type="radio" name="bkl" value="${v}" ${String(cfg.layout) === String(v) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
        <div class="bk-opts" style="margin-top:8px">${[['bw', 'שחור-לבן (חסכוני)'], ['pastel', 'גווני פסטל'], ['clean', 'נקי – חוברת מצוינות']].map(([v, n]) => `<label><input type="radio" name="bks" value="${v}" ${cfg.style === v ? 'checked' : ''}> ${n}</label>`).join('')}</div>
        ${warn.map(w => `<div class="warn" role="alert">⚠️ ${esc(w)}</div>`).join('')}</div>
      <div class="card bk-sec"><h3>5. יצירה ותצוגה מקדימה</h3>
        <div class="bk-bar"><button class="btn" id="bkGo">✨ יצירת החידות</button><span id="bkProg" class="small muted" role="status"></span></div>
        <div id="bkPrev"></div></div>
      <div class="card bk-sec"><h3>הגדרות שמורות</h3><div class="bk-bar"><input id="bkSaveName" placeholder="שם להגדרות" style="font:inherit;padding:6px 10px;border:2px solid var(--line);border-radius:10px"><button class="btn sec" id="bkSave" style="min-height:40px">💾 שמירה</button></div>
        ${saved.length ? `<div class="chips" style="margin-top:8px">${saved.map((s, k) => `<span class="chip"><button class="btn ghost" data-load="${k}" style="min-height:30px;padding:0 6px">${esc(s.name)}</button><button class="btn ghost" data-del="${k}" aria-label="מחיקה" style="min-height:30px;padding:0 6px">✕</button></span>`).join('')}</div>` : '<p class="small muted">עוד אין הגדרות שמורות.</p>'}</div>
      </div>`;
    const q = s => host.querySelectorAll(s);
    $('bkBack').onclick = () => back && back();
    q('input[name=bkp]').forEach(r => { r.onchange = () => { cfg.preset = r.value; const P = PRESETS[r.value]; if (P.counts) { cfg.counts = JSON.parse(JSON.stringify(P.counts)); cfg.content = Object.assign({}, P.content); cfg.layout = P.layout; cfg.order = P.order; cfg.title = P.title; if (P.style) cfg.style = P.style; } items = []; saveCfg(); render(); }; });
    $('bkTitle').oninput = e => { cfg.title = e.target.value; saveCfg(); };
    q('table.bk-t input').forEach(inp => { inp.onchange = () => { cfg.counts[inp.dataset.t][inp.dataset.l] = Math.max(0, Math.min(20, +inp.value || 0)); cfg.preset = 'custom'; saveCfg(); render(); }; });
    $('bkSame').onclick = () => { const l = +$('bkSameL').value; TYPES.forEach(t => { const tot = E.LEVELS.reduce((a, x) => a + (+cfg.counts[t][x] || 0), 0); E.LEVELS.forEach(x => { cfg.counts[t][x] = 0; }); if (tot && E.supported(t, l)) cfg.counts[t][l] = tot; }); saveCfg(); render(); };
    $('bkOrder').onchange = e => { cfg.order = e.target.checked ? 'graded' : 'table'; saveCfg(); };
    $('bkZero').onclick = () => { cfg.counts = zero(); saveCfg(); render(); };
    q('input[data-c]').forEach(c => { c.onchange = () => { cfg.content[c.dataset.c] = c.checked; if (c.dataset.c === 'solExp' && c.checked) cfg.content.sol = true; saveCfg(); if (items.length) items.forEach(decorate); render(); if (items.length) preview(); }; });
    q('input[name=bkl]').forEach(r => { r.onchange = () => { cfg.layout = r.value === 'auto' ? 'auto' : +r.value; saveCfg(); render(); if (items.length) preview(); }; });
    q('input[name=bks]').forEach(r => { r.onchange = () => { cfg.style = r.value; saveCfg(); render(); if (items.length) preview(); }; });
    $('bkGo').onclick = () => { if (!wanted().length) { $('bkProg').textContent = 'בחרו לפחות חידה אחת בטבלה.'; return; } $('bkGo').disabled = true; buildAll(() => { $('bkGo').disabled = false; $('bkProg').textContent = ''; render(); preview(); }); };
    $('bkSave').onclick = () => { const nm = $('bkSaveName').value.trim() || cfg.title; const s = ls.get('sdk-bk-saved', []).filter(x => x.name !== nm); s.unshift({ name: nm, cfg: JSON.parse(JSON.stringify(cfg)) }); ls.set('sdk-bk-saved', s.slice(0, 12)); render(); if (items.length) preview(); };
    q('[data-load]').forEach(b => { b.onclick = () => { const s = ls.get('sdk-bk-saved', [])[+b.dataset.load]; if (s) { cfg = Object.assign(DEF(), JSON.parse(JSON.stringify(s.cfg))); items = []; saveCfg(); render(); } }; });
    q('[data-del]').forEach(b => { b.onclick = () => { const s = ls.get('sdk-bk-saved', []); s.splice(+b.dataset.del, 1); ls.set('sdk-bk-saved', s); render(); if (items.length) preview(); }; });
    if (items.length) preview();
  }
  function preview() {
    const box = $('bkPrev'); if (!box) return;
    const pages = buildPages(false), warn = layoutWarnings();
    box.innerHTML = `<p><b>${items.length}</b> חידות · <b>${pages.length}</b> עמודים צפויים${cfg.content.sol ? ` (מתוכם ${Math.ceil(items.length / 6)} של פתרונות)` : ''}.</p>
      <div class="bk-bar" style="margin-bottom:10px">
        <button class="btn" id="bkPrint" ${warn.length ? 'disabled title="יש לתקן את הפריסה"' : ''}>🖨️ הדפסה / שמירה כ-PDF</button>
        <button class="btn sec" id="bkSol">🖨️ פתרונות בלבד</button>
        <button class="btn sec" id="bkPages">👁️ בדיקת הפריסה</button></div>
      <p class="small muted">לשמירה כ-PDF: בחלון ההדפסה בוחרים "שמירה כ-PDF" (Save as PDF), גודל A4, שוליים: ללא.</p>
      <div class="bk-prev">${items.map((it, k) => `<div class="bk-item"><div><b>${k + 1}</b> · ${esc(TN(it.type))} · ${LV[it.level]}</div>${boardOf(it, 40)}${it.task ? `<div class="small muted">🤔 ${esc(it.task.q.slice(0, 40))}…</div>` : ''}
        <div class="bi-acts"><button data-a="up" data-k="${k}" aria-label="להזיז קדימה" ${k ? '' : 'disabled'}>▲</button><button data-a="dn" data-k="${k}" aria-label="להזיז אחורה" ${k < items.length - 1 ? '' : 'disabled'}>▼</button><button data-a="re" data-k="${k}" aria-label="להחליף חידה" title="חידה אחרת באותו סוג ורמה">🔄</button><button data-a="rm" data-k="${k}" aria-label="להסיר">✕</button></div></div>`).join('')}
        <div class="bk-item" style="display:flex;flex-direction:column;gap:6px;justify-content:center"><b>הוספת חידה</b>
          <select id="bkAddT" style="font:inherit">${TYPES.map(t => `<option value="${t}">${esc(TN(t))}</option>`).join('')}</select>
          <select id="bkAddL" style="font:inherit">${E.LEVELS.map(l => `<option value="${l}">${LV[l]}</option>`).join('')}</select>
          <button class="btn sec" id="bkAdd" style="min-height:36px">＋ הוספה</button></div></div>
      <div id="bkPagesBox"></div>`;
    $('bkPrint').onclick = () => doPrint(false);
    $('bkSol').onclick = () => doPrint(true);
    $('bkPages').onclick = () => { const b = $('bkPagesBox'); b.innerHTML = `<div class="pv-wrap">${buildPages(false).join('')}</div>`; b.scrollIntoView({ block: 'start' }); };
    box.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => {
      const k = +b.dataset.k, a = b.dataset.a;
      if (a === 'up' && k) [items[k - 1], items[k]] = [items[k], items[k - 1]];
      if (a === 'dn' && k < items.length - 1) [items[k + 1], items[k]] = [items[k], items[k + 1]];
      if (a === 'rm') items.splice(k, 1);
      if (a === 're') { const keys = new Set(items.map(x => x.puz.key)), it = items[k]; const nw = genItem(it.type, it.level, E.randSeed(), keys); if (nw) { nw.idx = it.idx; items[k] = decorate(nw); } }
      cfg.preset = 'custom'; render();
    }; });
    $('bkAdd').onclick = () => { const t = $('bkAddT').value, l = +$('bkAddL').value; if (!E.supported(t, l)) { $('bkProg').textContent = 'השילוב הזה לא קיים – בחרו רמה אחרת.'; return; } const nw = genItem(t, l, E.randSeed(), new Set(items.map(x => x.puz.key))); if (nw) { nw.idx = items.length; items.push(decorate(nw)); } render(); };
  }
  function doPrint(onlySol) {
    const pr = $('print');
    pr.innerHTML = buildPages(onlySol).join('');
    document.documentElement.classList.add('printing');
    const done = () => { document.documentElement.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }

  /* גישה ישירה (בדיקות והפקת חוברת לדוגמה) */
  root.SBK = { open, get cfg() { return cfg; }, set cfg(v) { cfg = Object.assign(DEF(), v); }, build: buildAll, pages: buildPages, get items() { return items; }, makeTask, printHint, layoutWarnings, PRESETS };
})(typeof self !== 'undefined' ? self : this);
