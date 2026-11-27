/* המאמן האישי של מרכז הסודוקו – מנתח את מצב הלוח בפועל ומחזיר סולם של 4 רמזים לצעד לוגי תקף.
   גם ניתוח טעויות: הפרה מיידית של כלל לעומת מספר שלא סותר כלל עכשיו אבל לא מוביל לפתרון.
   טקסטים בעברית. נשען על sudoku/engine.js (SDK). */
(function (root, factory) {
  const E = typeof module === 'object' && module.exports ? require('./engine.js') : root.SDK;
  const C = factory(E);
  if (typeof module === 'object' && module.exports) module.exports = C; else root.SDKC = C;
})(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';
  const { digs, pc, low } = E;

  /* ---------- שמות ---------- */
  const NAME = {
    fullHouse: 'המספר החסר', cageSingle: 'המשבצת האחרונה בכלוב', nakedSingle: 'האפשרות היחידה', hiddenSingle: 'המקום היחיד',
    cageCombo: 'פירוק לסכומים', lockedPointing: 'מועמדים נעולים', lockedClaiming: 'מועמדים נעולים', nakedPair: 'זוג גלוי', hiddenPair: 'זוג סמוי',
    unitSum: 'כלל הסכום', nakedTriple: 'שלישייה גלויה', hiddenTriple: 'שלישייה סמויה', xWing: 'כנף X', xyWing: 'מזלג XY', multiSum: 'כלל הסכום בשתי שורות'
  };
  const ICON = { fullHouse: '🧩', cageSingle: '➕', nakedSingle: '☝️', hiddenSingle: '🎯', cageCombo: '🔢', lockedPointing: '🔒', lockedClaiming: '🔒', nakedPair: '👯', hiddenPair: '🕵️', unitSum: '∑', nakedTriple: '🔺', hiddenTriple: '🔺', xWing: '✖️', xyWing: '🍴', multiSum: '∑' };
  const SHORT = {
    fullHouse: 'ביחידה נשארה משבצת ריקה אחת – כותבים בה את המספר שחסר.',
    cageSingle: 'בכלוב נשארה משבצת אחת – הסכום פחות מה שכבר כתוב.',
    nakedSingle: 'בודקים את השורה, העמודה והאזור של משבצת – ונשארת אפשרות אחת בלבד.',
    hiddenSingle: 'מספר שיכול להיכנס רק למשבצת אחת בשורה, בעמודה או באזור.',
    cageCombo: 'מפרקים את סכום הכלוב למספרים שונים – ומוחקים את מה שלא מתאים.',
    lockedPointing: 'כשמספר באזור "נעול" בשורה אחת – אפשר למחוק אותו משאר השורה.',
    lockedClaiming: 'כשמספר בשורה "נעול" באזור אחד – אפשר למחוק אותו משאר האזור.',
    nakedPair: 'שתי משבצות עם אותם שני מועמדים – הם שמורים להן.',
    hiddenPair: 'שני מספרים שיכולים להיות רק באותן שתי משבצות – שאר המועמדים שם נמחקים.',
    unitSum: 'סכום כל שורה, עמודה ואזור ידוע – מה שנשאר מחוץ לכלובים מחושב בחיסור.',
    nakedTriple: 'שלוש משבצות שיש בהן יחד רק שלושה מועמדים.', hiddenTriple: 'שלושה מספרים שיכולים להיות רק באותן שלוש משבצות.',
    xWing: 'מספר שבשתי שורות יכול להיות רק באותן שתי עמודות.', xyWing: 'שלוש משבצות עם שני מועמדים שיוצרות "מזלג".',
    multiSum: 'סכום שתי שורות יחד ידוע – ומשבצת אחת שנשארה בחוץ מחושבת בחיסור.'
  };

  // הסבר קצר לכל אסטרטגיה (מרכז ההדרכה, עמוד האסטרטגיות בחוברת)
  const EXPLAIN = {
    rules: ['בכל שורה, בכל עמודה ובכל אזור (המלבן עם הקו העבה) – כל מספר מופיע פעם אחת בדיוק.', 'בלוח 4×4 משתמשים במספרים 1–4, ב-6×6 – 1–6, וב-9×9 – 1–9.', 'אין צורך לנחש: בכל לוח טוב יש תמיד משבצת שאפשר להסיק בוודאות.'],
    fullHouse: ['כשבשורה, בעמודה או באזור נשארה רק משבצת ריקה אחת – חסר שם מספר אחד בלבד.', 'סופרים מה כבר יש, ומוצאים מה חסר.'],
    nakedSingle: ['בוחרים משבצת ובודקים: אילו מספרים כבר נמצאים בשורה שלה, בעמודה שלה ובאזור שלה?', 'אם נשאר רק מספר אחד שלא תפוס – הוא חייב להיות שם.'],
    hiddenSingle: ['הפעם שואלים על מספר: איפה יכול להיות 7 באזור הזה?', 'כל 7 בלוח "חוסם" את השורה ואת העמודה שלו. אם נשארה רק משבצת אחת שלא חסומה – ה-7 שם. זו הצלבת מידע.'],
    notes: ['כשקשה להחליט, כותבים במשבצת מספרים קטנים – כל המספרים שעוד אפשריים בה.', 'לוחצים על ✏️ סימון, ואז על מספרים. כשכותבים מספר גדול, הוא נמחק לבד מהסימונים של השכנים.', 'במצב מונחה (בתפריט ⋯) הסימונים מופיעים לבד – טוב להתחלה.'],
    locked: ['אם באזור מסוים מספר יכול להיות רק בשורה אחת – הוא "נעול" שם.', 'המספר הזה יהיה בשורה הזו בתוך האזור, ולכן בשאר השורה (מחוץ לאזור) הוא לא יכול להיות. אותו דבר עם עמודה.'],
    nakedPair: ['שתי משבצות באותה שורה (או עמודה או אזור) שבשתיהן אותם שני מועמדים בלבד, למשל 3 ו-8.', 'אחת תקבל 3 והשנייה 8 – ולכן 3 ו-8 לא יכולים להיות בשום משבצת אחרת באותה יחידה.'],
    hiddenPair: ['שני מספרים שיכולים להיות ביחידה רק באותן שתי משבצות.', 'המשבצות האלה "שמורות" לשני המספרים – אפשר למחוק מהן את כל שאר המועמדים.'],
    xWing: ['מספר שבשתי שורות יכול להיות רק בשתי משבצות – ובאותן שתי עמודות.', 'המספר יופיע בשתי פינות מנוגדות של המלבן, ולכן בשאר המשבצות של שתי העמודות הוא לא יכול להיות.'],
    xyWing: ['שלוש משבצות עם שני מועמדים בכל אחת: ציר {x,y} ושתי צבתות {x,z} ו-{y,z}.', 'מה שלא ייכתב בציר – באחת הצבתות יהיה z. לכן משבצת שרואה את שתי הצבתות לא יכולה להיות z.'],
    krules: ['כמו סודוקו רגיל, ועוד כלל: הלוח מחולק לכלובים מקווקווים.', 'המספר הקטן בפינה הוא סכום המספרים בכלוב, ובתוך כלוב מספר לא חוזר על עצמו.', 'כשבכלוב נשארה משבצת אחת – מחשבים: הסכום פחות מה שכבר כתוב.'],
    cageCombo: ['מפרקים את סכום הכלוב למספרים שונים. למשל, כלוב של שתי משבצות עם סכום 3 – רק 1 + 2.', 'מספר שלא מופיע באף פירוק אפשרי – לא יכול להיות בכלוב.'],
    unitSum: ['סכום כל שורה, עמודה ואזור ידוע: ב-6×6 הוא 21 (1+2+…+6), וב-9×9 – 45.', 'מחברים את הכלובים שנמצאים כולם בתוך השורה, ומה שחסר עד 21 – זה הסכום של המשבצות שנשארו.']
  };

  /* ---------- עזרי ניסוח ---------- */
  const list = a => { a = a.map(String); return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' ו-' + a[a.length - 1]; };
  const orList = a => { a = a.map(String); return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' או ' + a[a.length - 1]; };
  const plus = a => a.join(' + ');
  function U(ctx, u) { // שם יחידה + סיומת נקבה/זכר
    const t = ctx.units[u].t;
    return t === 'r' ? { n: 'השורה', b: 'בשורה', w: 'שורה', f: 'ת', the: 'הזאת', bh: 'בה', ot: 'אותה' } : t === 'c' ? { n: 'העמודה', b: 'בעמודה', w: 'עמודה', f: 'ת', the: 'הזאת', bh: 'בה', ot: 'אותה' } : { n: 'האזור', b: 'באזור', w: 'אזור', f: '', the: 'הזה', bh: 'בו', ot: 'אותו' };
  }
  const bold = U2 => 'המודגש' + U2.f; // המודגשת / המודגש
  const pos = (ctx, i) => `שורה ${(i / ctx.n | 0) + 1}, עמודה ${i % ctx.n + 1}`; // עמודה 1 = הימנית

  /* ---------- בדיקת טעויות ---------- */
  // הפרה מיידית של כלל: אותו מספר פעמיים ביחידה/בכלוב, או סכום כלוב שגוי
  function ruleErrors(ctx, grid, fixed) {
    const out = [];
    ctx.units.forEach((u, k) => {
      const by = {};
      u.cells.forEach(i => { if (grid[i]) (by[grid[i]] = by[grid[i]] || []).push(i); });
      for (const d in by) if (by[d].length > 1) out.push({ kind: 'dup', unit: k, digit: +d, cells: by[d], user: by[d].filter(i => !fixed[i]) });
    });
    if (ctx.cages) ctx.cages.forEach((cg, k) => {
      const by = {}; let s = 0, empty = 0;
      cg.cells.forEach(i => { if (grid[i]) { (by[grid[i]] = by[grid[i]] || []).push(i); s += grid[i]; } else empty++; });
      for (const d in by) if (by[d].length > 1) out.push({ kind: 'cageDup', cage: k, digit: +d, cells: by[d], user: by[d].filter(i => !fixed[i]) });
      if (s > cg.sum || (!empty && s !== cg.sum)) out.push({ kind: 'cageSum', cage: k, cells: cg.cells.filter(i => grid[i]), user: cg.cells.filter(i => grid[i] && !fixed[i]), s, sum: cg.sum, full: !empty });
    });
    return out.filter(e => e.user.length);
  }
  const wrongCells = (puz, grid) => { const a = []; grid.forEach((d, i) => { if (d && !puz.givens[i] && d !== puz.solution[i]) a.push(i); }); return a; };

  // מספר שלא סותר כלל עכשיו: מחפשים שרשרת קצרה של צעדים פשוטים שמובילה לסתירה
  const SIMPLE = ['fullHouse', 'cageSingle', 'hiddenBox', 'nakedSingle', 'hiddenLine', 'cageCombo'];
  function contradiction(ctx, grid) {
    const S = E.newState(ctx, grid), chain = [];
    for (let t = 0; t < 12; t++) {
      for (let i = 0; i < ctx.g.N; i++) if (!S.v[i] && !S.c[i]) return { chain, type: 'cell', cell: i };
      for (let u = 0; u < ctx.units.length; u++) {
        const cells = ctx.units[u].cells, used = cells.reduce((m, i) => S.v[i] ? m | 1 << S.v[i] : m, 0);
        for (let d = 1; d <= ctx.n; d++) if (!(used >> d & 1) && !cells.some(i => !S.v[i] && (S.c[i] >> d & 1))) return { chain, type: 'unit', unit: u, digit: d };
      }
      const st = E.findStep(ctx, S, 5, SIMPLE);
      if (!st) return null;
      // צעד שיוצר כפילות = סתירה
      if (st.place && ctx.peers[st.place[0]].some(p => S.v[p] === st.place[1])) return { chain, type: 'dup', cell: st.place[0], digit: st.place[1] };
      E.apply(ctx, S, st); chain.push(st);
    }
    return null;
  }

  /* ---------- סולם רמזים לצעד לוגי ---------- */
  // hl: units – יחידות להדגשה, cells – משבצות במסגרת, digits – הדגשת מופעי ספרה, x – משבצות "לא יכול" (✗),
  //     cand – מועמדים להצגה {i: mask}, on – מועמדים מודגשים, off – מועמדים שנמחקים, tag – תוויות {i: '①'}
  const TAGS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];

  function candMap(S, cells) { const m = {}; cells.forEach(i => { if (!S.v[i]) m[i] = S.c[i]; }); return m; }
  function elimMap(elim) { const m = {}; elim.forEach(([i, x]) => { m[i] = (m[i] || 0) | x; }); return m; }
  const from = k => k === 1 ? 'ממשבצת אחת' : 'מ-' + k + ' משבצות';
  function elimText(elim) {
    const by = {}; elim.forEach(([i, m]) => digs(m).forEach(d => { by[d] = (by[d] || 0) + 1; }));
    return Object.keys(by).map(d => `${d} (${from(by[d])})`).join(', ');
  }

  // מדוע ספרה d לא יכולה להיות במשבצת i (במצב S, אחרי הסקות ידועות)
  function whyNot(ctx, S, i, d, known) {
    const g = ctx.g;
    const seen = ctx.peers[i].find(p => S.v[p] === d);
    if (seen !== undefined) {
      if (g.R[seen] === g.R[i]) return 'r'; if (g.C[seen] === g.C[i]) return 'c'; if (g.B[seen] === g.B[i]) return 'b'; return 'k';
    }
    if (S.v[i]) return 'full';
    return 'logic';
  }

  function ladder(ctx, S, st, puz) {
    const n = ctx.n, L = [];
    const add = (t, hl) => L.push({ t, hl: hl || {} });
    const s = st.s;
    if (s === 'fullHouse') {
      const u = st.unit, u2 = U(ctx, u), [i, d] = st.place, cells = ctx.units[u].cells;
      const used = digs(cells.reduce((m, j) => S.v[j] ? m | 1 << S.v[j] : m, 0));
      add(`הסתכלו על ${u2.n} ${bold(u2)}. כמה משבצות ריקות נשארו ${u2.bh}?`, { units: [u] });
      add(`${u2.b} ${u2.the} נשארה רק משבצת ריקה אחת.`, { units: [u], cells: [i] });
      add(`${u2.b} כבר יש ${list(used)}. איזה מספר מ-1 עד ${n} עוד לא מופיע?`, { units: [u], cells: [i] });
      add(`חסר רק ${d} – ולכן במשבצת הריקה חייב להיות ${d}. בכל ${u2.w} כל מספר מופיע פעם אחת בדיוק.`, { units: [u], cells: [i], put: [i, d] });
    } else if (s === 'cageSingle') {
      const cg = ctx.cages[st.cage], [i, d] = st.place, have = cg.cells.filter(j => S.v[j]).map(j => S.v[j]);
      const sumHave = have.reduce((a, b) => a + b, 0);
      add(`הסתכלו על הכלוב ${have.length ? 'המודגש' : 'המודגש – יש בו משבצת אחת בלבד'}. הסכום שלו ${cg.sum}.`, { cage: st.cage });
      add(have.length ? `בכלוב נשארה רק משבצת ריקה אחת.` : `כלוב של משבצת אחת: המספר בה הוא הסכום עצמו.`, { cage: st.cage, cells: [i] });
      add(have.length ? `בכלוב כבר כתוב ${plus(have)}${have.length > 1 ? ' = ' + sumHave : ''}. כמה חסר עד ${cg.sum}?` : `הסכום של הכלוב הוא ${cg.sum}, ויש בו משבצת אחת.`, { cage: st.cage, cells: [i] });
      add(have.length ? `${cg.sum} − ${sumHave} = ${d}, ולכן במשבצת חייב להיות ${d}.` : `במשבצת חייב להיות ${d}.`, { cage: st.cage, cells: [i], put: [i, d] });
    } else if (s === 'nakedSingle') {
      const [i, d] = st.place, uo = ctx.g.uOf[i];
      const parts = [];
      const inU = u => digs(ctx.units[u].cells.reduce((m, j) => S.v[j] ? m | 1 << S.v[j] : m, 0));
      const names = ['בשורה', 'בעמודה', 'באזור'];
      uo.forEach((u, k) => { const a = inU(u); if (a.length) parts.push(`${names[k]}: ${list(a)}`); });
      if (ctx.cages) { const cg = ctx.cages[ctx.cageOf[i]], a = cg.cells.filter(j => S.v[j]).map(j => S.v[j]); if (a.length) parts.push(`בכלוב: ${list(a)}`); }
      const blockers = ctx.peers[i].filter(j => S.v[j]);
      const ex = digs(ctx.g.FULL & ~(1 << d));
      const logic = ex.filter(x => whyNot(ctx, S, i, x) === 'logic');
      add(`הסתכלו על המשבצת המסומנת. אילו מספרים יכולים להיות בה?`, { cells: [i], units: uo });
      add(`בדקו מה כבר כתוב בשורה, בעמודה ובאזור שלה – המספרים האלה תפוסים.`, { cells: [i], units: uo, seen: blockers });
      add(`${parts.join('. ')}.` + (logic.length ? ` ו-${list(logic)} כבר נפסלו בהסקות קודמות.` : '') + ` אז ${list(ex)} לא יכולים להיות כאן.`, { cells: [i], units: uo, seen: blockers });
      add(`נשאר רק ${d} – זו האפשרות היחידה. כתבו ${d}.`, { cells: [i], units: uo, put: [i, d] });
    } else if (s === 'hiddenSingle') {
      const u = st.unit, u2 = U(ctx, u), [i, d] = st.place, cells = ctx.units[u].cells;
      const blocked = cells.filter(j => !S.v[j] && j !== i);
      const why = { r: 0, c: 0, b: 0, k: 0, logic: 0 };
      blocked.forEach(j => { why[whyNot(ctx, S, j, d)]++; });
      const R = [];
      if (why.r) R.push(`יש ${d} באותה שורה`); if (why.c) R.push(`יש ${d} באותה עמודה`); if (why.b) R.push(`יש ${d} באותו אזור`); if (why.k) R.push(`יש ${d} באותו כלוב`);
      if (why.logic) R.push(`${d} כבר נפסל שם בהסקה קודמת`);
      const ds = []; for (let j = 0; j < ctx.g.N; j++) if (S.v[j] === d) ds.push(j);
      add(`הסתכלו על ${u2.n} ${bold(u2)}. המספר ${d} עוד חסר ${u2.bh} – איפה הוא יכול להיות?`, { units: [u] });
      add(`שימו לב למספרי ${d} המודגשים בלוח. כל אחד מהם "חוסם" את השורה, העמודה והאזור שלו.`, { units: [u], digits: [d], seen: ds });
      add(blocked.length ? `${d} לא יכול להיות במשבצות המסומנות ב-✗: ${R.length > 1 ? 'בחלק מהן ' + R.join(', ובחלק – ') : 'בכולן ' + R[0]}.` : `זו המשבצת הריקה היחידה ${u2.b}.`, { units: [u], digits: [d], seen: ds, x: blocked });
      add(`נשארה רק משבצת אחת ${u2.b} שבה ${d} יכול להיות – ושם הוא חייב להיות!`, { units: [u], digits: [d], x: blocked, cells: [i], put: [i, d] });
    } else if (s === 'cageCombo') {
      const cg = ctx.cages[st.cage], e = st.cells, k = e.length, have = cg.cells.length - k;
      const sets = st.sets.map(m => plus(digs(m)));
      add(`הסתכלו על הכלוב המודגש: ${cg.cells.length} משבצות, סכום ${cg.sum}.`, { cage: st.cage });
      add(have ? `נשארו בו ${k} משבצות ריקות שסכומן ${st.rem}. אילו מספרים שונים יכולים לתת ${st.rem}?` : `אילו ${k} מספרים שונים (מ-1 עד ${n}) נותנים יחד ${st.rem}?`, { cage: st.cage, cand: candMap(S, e) });
      add(`${sets.length === 1 ? 'יש רק צירוף אחד שמתאים' : 'הצירופים שמתאימים'}: ${sets.join(' · ')}. מספר שלא מופיע באף צירוף מתאים – לא יכול להיות שם.`, { cage: st.cage, cand: candMap(S, e), off: elimMap(st.elim) });
      add(`לכן אפשר למחוק מהכלוב: ${elimText(st.elim)}.`, { cage: st.cage, cand: candMap(S, e), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'lockedPointing' || s === 'lockedClaiming') {
      const d = st.digit, box = st.unit, line = st.line, bl = U(ctx, line);
      const pointing = s === 'lockedPointing';
      const area = pointing ? box : line, other = pointing ? line : box, A = U(ctx, area), O = U(ctx, other);
      const shown = [...st.cells, ...st.elim.map(x => x[0])];
      add(`הסתכלו על ${A.n} ${bold(A)} ועל המספר ${d}.`, { units: [area], digits: [d] });
      add(`${A.b} ${A.the} ${d} יכול להיות רק במשבצות המסומנות – וכולן ${pointing ? 'באותה ' + bl.w : 'באותו אזור'}.`, { units: [area], digits: [d], cand: candMap(S, st.cells), on: Object.fromEntries(st.cells.map(i => [i, 1 << d])) });
      add(`${d} של ${A.n} חייב להיות באחת מהן. לכן ${O.b} ${O.the} ${d} כבר "תפוס" – ואפשר למחוק את ${d} משאר המשבצות ${O.b}.`, { units: [area, other], digits: [d], cand: candMap(S, shown), on: Object.fromEntries(st.cells.map(i => [i, 1 << d])), off: elimMap(st.elim) });
      add(`מוחקים את ${d} ${from(st.elim.length)} – עכשיו יש שם פחות אפשרויות.`, { units: [area, other], cand: candMap(S, shown), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'nakedPair' || s === 'nakedTriple') {
      const u = st.unit, u2 = U(ctx, u), k = st.cells.length, ds = st.digits, w = k === 2 ? 'שתי' : 'שלוש';
      const shown = ctx.units[u].cells.filter(i => !S.v[i]);
      add(`הסתכלו על ${u2.n} ${bold(u2)}. יש ${u2.bh} ${w} משבצות מיוחדות.`, { units: [u], cand: candMap(S, shown) });
      add(`ב${w} המשבצות המסומנות יכולים להיות רק ${orList(ds)}.`, { units: [u], cells: st.cells, cand: candMap(S, shown), on: Object.fromEntries(st.cells.map(i => [i, S.c[i]])) });
      add(`${list(ds)} "שמורים" ל${w} המשבצות האלה – כל אחד מהם יהיה באחת מהן. לכן הם לא יכולים להיות במשבצות אחרות ${u2.b}.`, { units: [u], cells: st.cells, cand: candMap(S, shown), off: elimMap(st.elim) });
      add(`מוחקים: ${elimText(st.elim)}.`, { units: [u], cells: st.cells, cand: candMap(S, shown), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'hiddenPair' || s === 'hiddenTriple') {
      const u = st.unit, u2 = U(ctx, u), k = st.cells.length, ds = st.digits, w = k === 2 ? 'שתי' : 'שלוש';
      const shown = ctx.units[u].cells.filter(i => !S.v[i]), m = ds.reduce((a, d) => a | 1 << d, 0);
      add(`הסתכלו על ${u2.n} ${bold(u2)} ועל המספרים ${list(ds)}.`, { units: [u], cand: candMap(S, shown) });
      add(`${u2.b} ${u2.the} ${list(ds)} יכולים להיות רק ב${w} המשבצות המסומנות.`, { units: [u], cells: st.cells, cand: candMap(S, shown), on: Object.fromEntries(st.cells.map(i => [i, S.c[i] & m])) });
      add(`${w} המשבצות "תפוסות" בשביל ${list(ds)}, ולכן אין בהן מקום למספרים אחרים.`, { units: [u], cells: st.cells, cand: candMap(S, shown), on: Object.fromEntries(st.cells.map(i => [i, S.c[i] & m])), off: elimMap(st.elim) });
      add(`מוחקים מהן את שאר המועמדים: ${elimText(st.elim)}.`, { units: [u], cells: st.cells, cand: candMap(S, shown), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'xWing') {
      const d = st.digit, lines = st.lines, cross = st.cross, L0 = U(ctx, lines[0]), X0 = U(ctx, cross[0]);
      const shown = [...st.cells, ...st.elim.map(x => x[0])];
      const Lp = L0.w === 'שורה' ? 'השורות' : 'העמודות', Xp = X0.w === 'שורה' ? 'השורות' : 'העמודות';
      add(`הסתכלו על המספר ${d} בשתי ${Lp} המודגשות.`, { units: lines, digits: [d] });
      add(`בכל אחת מהן ${d} יכול להיות רק בשתי משבצות – ובשתיהן באותן ${Xp}.`, { units: lines, cand: candMap(S, st.cells), on: Object.fromEntries(st.cells.map(i => [i, 1 << d])) });
      add(`ה-${d} של שתי ${Lp} יתפסו את שתי ${Xp} האלה (באלכסון, כמו X). לכן בשאר המשבצות ב${Xp.slice(1)} האלה ${d} לא יכול להיות.`, { units: [...lines, ...cross], cand: candMap(S, shown), on: Object.fromEntries(st.cells.map(i => [i, 1 << d])), off: elimMap(st.elim) });
      add(`מוחקים את ${d} ${from(st.elim.length)}.`, { units: cross, cand: candMap(S, shown), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'xyWing') {
      const [pv, a, b] = st.cells, [x, y, z] = st.digits, shown = [...st.cells, ...st.elim.map(q => q[0])];
      add(`הסתכלו על שלוש המשבצות המסומנות – בכל אחת רק שני מועמדים.`, { cells: st.cells, cand: candMap(S, st.cells) });
      add(`במשבצת ${TAGS[0]}: ${x} או ${y}. ב-${TAGS[1]}: ${orList(digs(S.c[a]))}. ב-${TAGS[2]}: ${orList(digs(S.c[b]))}.`, { cells: st.cells, cand: candMap(S, st.cells), tag: { [pv]: TAGS[0], [a]: TAGS[1], [b]: TAGS[2] } });
      add(`אם ב-${TAGS[0]} יהיה ${digs(S.c[a] & S.c[pv])[0]}, אז ב-${TAGS[1]} יהיה ${z}. ואם יהיה ${digs(S.c[b] & S.c[pv])[0]}, אז ב-${TAGS[2]} יהיה ${z}. בכל מקרה ${z} יופיע באחת מהן – ולכן משבצת שרואה את שתיהן לא יכולה להיות ${z}.`, { cells: st.cells, cand: candMap(S, shown), tag: { [pv]: TAGS[0], [a]: TAGS[1], [b]: TAGS[2] }, off: elimMap(st.elim) });
      add(`מוחקים את ${z} ${from(st.elim.length)}.`, { cells: st.cells, cand: candMap(S, shown), off: elimMap(st.elim), elim: st.elim });
    } else if (s === 'unitSum' || s === 'multiSum') {
      const two = s === 'multiSum', us = two ? st.units : [st.unit], u2 = U(ctx, us[0]), T = ctx.g.TOTAL * us.length;
      const ins = st.inside.map(k => ctx.cages[k].sum), sIn = ins.reduce((a, b) => a + b, 0);
      const placed = st.rest.filter(i => S.v[i]).map(i => S.v[i]), e = st.rest.filter(i => !S.v[i]);
      const where = two ? `שתי ${u2.w === 'שורה' ? 'השורות' : 'העמודות'} המודגשות` : `${u2.n} ${bold(u2)}`;
      add(`הסתכלו על ${where}. סכום כל המספרים ${two ? 'בהן' : 'ב' + u2.w} הוא ${two ? ctx.g.TOTAL + ' + ' + ctx.g.TOTAL + ' = ' : ''}${T}.`, { units: us });
      add(`הכלובים שנמצאים כולם בפנים: ${plus(ins)}${ins.length > 1 ? ' = ' + sIn : ''}.`, { units: us, cages: st.inside });
      const restSum = T - sIn - placed.reduce((a, b) => a + b, 0);
      add(`לכן במשבצות המסומנות (מחוץ לכלובים האלה) הסכום הוא ${T} − ${sIn}${placed.length ? ' − ' + plus(placed) : ''} = ${restSum}.`, { units: us, cages: st.inside, cells: e, cand: st.place ? undefined : candMap(S, e), off: st.elim ? elimMap(st.elim) : undefined });
      if (st.place) add(`נשארה שם משבצת ריקה אחת – ולכן בה חייב להיות ${st.place[1]}.`, { units: us, cells: e, put: st.place });
      else add(`${st.sets.length === 1 ? 'יש רק צירוף אחד' : 'הצירופים האפשריים'}: ${st.sets.map(m => plus(digs(m))).join(' · ')}. מוחקים: ${elimText(st.elim)}.`, { units: us, cells: e, cand: candMap(S, e), off: elimMap(st.elim), elim: st.elim });
    }
    return L;
  }

  /* הרמז הבא. known = הסקות שהמאמן כבר הראה (מסכות למחיקה לכל משבצת), last = המשבצת האחרונה שנכתבה */
  function hint(puz, grid, known, last) {
    const ctx = E.ctxOf(puz.n, puz.cages), fixed = puz.givens.map(Boolean);
    // 1. הפרת כלל מיידית
    const errs = ruleErrors(ctx, grid, fixed);
    if (errs.length) {
      errs.sort((a, b) => (b.user.includes(last) ? 1 : 0) - (a.user.includes(last) ? 1 : 0));
      const e = errs[0], L = [];
      const bad = e.user.find(i => grid[i] !== puz.solution[i]) ?? e.user[0];
      if (e.kind === 'dup') {
        const u2 = U(ctx, e.unit);
        L.push({ t: `משהו לא מסתדר ${u2.b} ${bold(u2)}. בדקו ${u2.ot} שוב.`, hl: { units: [e.unit] } });
        L.push({ t: `המספר ${e.digit} מופיע ${u2.b} ${u2.the} פעמיים.`, hl: { units: [e.unit], cells: e.cells, digits: [e.digit] } });
        L.push({ t: `בכל ${u2.w} כל מספר מופיע רק פעם אחת – לכן אחד משני ה-${e.digit} לא במקום.`, hl: { units: [e.unit], cells: e.cells } });
        L.push({ t: `כדאי למחוק את ה-${e.digit} במשבצת המסומנת ולחשוב שוב.`, hl: { units: [e.unit], cells: [bad], x: [bad] }, erase: bad });
      } else if (e.kind === 'cageDup') {
        L.push({ t: `משהו לא מסתדר בכלוב המודגש.`, hl: { cage: e.cage } });
        L.push({ t: `המספר ${e.digit} מופיע בכלוב פעמיים.`, hl: { cage: e.cage, cells: e.cells } });
        L.push({ t: `בכלוב אסור שמספר יחזור על עצמו.`, hl: { cage: e.cage, cells: e.cells } });
        L.push({ t: `כדאי למחוק את המספר במשבצת המסומנת ולחשוב שוב.`, hl: { cage: e.cage, cells: [bad], x: [bad] }, erase: bad });
      } else {
        L.push({ t: `בדקו את הסכום בכלוב המודגש.`, hl: { cage: e.cage } });
        L.push({ t: `הסכום של הכלוב צריך להיות ${e.sum}, ועכשיו ${e.full ? 'יוצא' : 'כבר יש'} ${e.s}.`, hl: { cage: e.cage, cells: e.cells } });
        L.push({ t: e.s > e.sum ? `המספרים שכתובים כבר גדולים מדי – הם עוברים את ${e.sum}.` : `כשהכלוב מלא, הסכום חייב להיות בדיוק ${e.sum}.`, hl: { cage: e.cage, cells: e.cells } });
        L.push({ t: `כדאי למחוק את המספר במשבצת המסומנת ולחשוב שוב.`, hl: { cage: e.cage, cells: [bad], x: [bad] }, erase: bad });
      }
      return { kind: 'error', sub: 'rule', cell: bad, levels: L };
    }
    // 2. מספר שגוי שלא מפר כלל עכשיו
    const wrong = wrongCells(puz, grid);
    if (wrong.length) {
      const i = wrong.includes(last) ? last : wrong[0], d = grid[i];
      const g2 = grid.map((x, j) => (x && !fixed[j] && x !== puz.solution[j] && j !== i) ? 0 : x);
      const cx = contradiction(ctx, g2), L = [];
      L.push({ t: `כדאי לבדוק שוב את המשבצת המסומנת. ה-${d} שם לא שובר אף כלל כרגע – אבל האם הוא מתאים?`, hl: { cells: [i] } });
      L.push({ t: `נסו לחשוב: אם ${d} נשאר כאן, מה יקרה בהמשך?`, hl: { cells: [i] } });
      if (cx && cx.chain.length <= 6) {
        const tag = { [i]: '★' }; cx.chain.forEach((st, k) => { if (st.place) tag[st.place[0]] = TAGS[k]; });
        const steps = cx.chain.filter(st => st.place).map((st, k) => `${TAGS[k]} חייב להיות ${st.place[1]}`);
        const end = cx.type === 'cell' ? `במשבצת המסומנת ב-✗ לא נשאר אף מספר אפשרי!` : cx.type === 'dup' ? `יוצא ${cx.digit} פעמיים באותה יחידה!` : `${U(ctx, cx.unit).b} ${bold(U(ctx, cx.unit))} אין שום מקום למספר ${cx.digit}!`;
        const xs = cx.type === 'cell' || cx.type === 'dup' ? [cx.cell] : [];
        L.push({ t: `אם ${d} נמצא ב-★, אז ${steps.length ? steps.join(', ') + ' – ואז ' : ''}${end}`, hl: { cells: [i, ...cx.chain.filter(s => s.place).map(s => s.place[0])], tag, x: xs, units: cx.type === 'unit' ? [cx.unit] : [] } });
        L.push({ t: `יצאה סתירה – ולכן ${d} לא יכול להיות במשבצת הזאת. מחקו אותו ונסו מספר אחר.`, hl: { cells: [i], x: [i] }, erase: i });
      } else {
        L.push({ t: `המספר ${d} לא מתאים לפתרון של הלוח הזה, גם אם כרגע הוא לא סותר כלל. בהמשך הוא היה מוביל לסתירה.`, hl: { cells: [i] } });
        L.push({ t: `מחקו את ה-${d} – ובקשו רמז אם צריך, כדי למצוא את המספר שבאמת חייב להיות כאן.`, hl: { cells: [i], x: [i] }, erase: i });
      }
      return { kind: 'error', sub: 'path', cell: i, levels: L };
    }
    if (grid.every(x => x)) return { kind: 'done', levels: [{ t: 'הלוח מלא ונכון. כל הכבוד!', hl: {} }] };
    // 3. הצעד הלוגי הבא (במצב הנוכחי, עם ההסקות שכבר הוצגו)
    const S = E.newState(ctx, grid, known);
    const st = E.findStep(ctx, S, 5, E.COACH_ORDER);
    if (!st) return { kind: 'stuck', levels: [{ t: 'לא מצאתי צעד שאפשר להסביר בלי ניחוש. נסו לבדוק את הלוח.', hl: {} }] };
    const levels = ladder(ctx, S, st, puz);
    let then = null;
    if (st.elim) { // מה ההסקה מאפשרת מיד אחר כך
      const S2 = { v: S.v.slice(), c: S.c.slice() }; E.apply(ctx, S2, st);
      const nx = E.findStep(ctx, S2, 3, E.COACH_ORDER);
      if (nx && nx.place) { const L2 = ladder(ctx, S2, nx, puz); then = { step: nx, t: L2[L2.length - 1].t, hl: L2[L2.length - 1].hl }; }
    }
    return { kind: 'step', step: st, strategy: st.s, name: NAME[st.s], levels, then };
  }

  /* מצב לדוגמה למרכז ההדרכה: מריצים את הפתרון עד שמגיעים לצעד מהסוג המבוקש */
  function exampleState(puz, strategy, order) {
    const ctx = E.ctxOf(puz.n, puz.cages), S = E.newState(ctx, puz.givens);
    const known = new Array(ctx.g.N).fill(0);
    for (let t = 0; t < 400; t++) {
      const st = E.findStep(ctx, S, 5, order || E.COACH_ORDER);
      if (!st) return null;
      if (st.s === strategy || (strategy === 'locked' && /^locked/.test(st.s))) return { grid: S.v.slice(), known: known.slice(), step: st };
      if (st.elim) st.elim.forEach(([i, m]) => { known[i] |= m; });
      E.apply(ctx, S, st);
      if (S.v.every(x => x)) return null;
    }
    return null;
  }

  return { EXPLAIN, hint, ruleErrors, wrongCells, contradiction, ladder, exampleState, NAME, ICON, SHORT, TAGS, list };
});
