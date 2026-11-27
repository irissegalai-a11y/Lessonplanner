// בדיקה מורחבת: 1,000 לוחות לכל גודל ולכל רמה (או כמה שמבקשים)
// node qa-1000.js <כמות> [סוגים מופרדים בפסיק, למשל k6,9]
// לכל לוח: חוקי סודוקו בפתרון · נתונים = פתרון · כלובים: כיסוי, קשירות, בלי חזרה, סכום נכון ·
// פתרון יחיד (פותר בלתי תלוי, נכתב בנפרד מהמנוע) · רמה אמיתית · ציור קווי הכלובים תואם בדיוק לגבולות הכלובים
global.self = global;
const E = require('../engine.js'); global.SDK = E; require('../board.js');
const B = global.SBD;
const M = +process.argv[2] || 1000, only = process.argv[3] ? process.argv[3].split(',') : null;
const SH = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

/* פותר בלתי תלוי: ביטים, בחירת המשבצת עם הכי מעט אפשרויות, וגבולות סכום בכלובים */
function indep(n, grid, cages, limit) {
  const [br, bc] = SH[n], N = n * n, ALL = (1 << (n + 1)) - 2;
  const box = i => Math.floor(Math.floor(i / n) / br) * (n / bc) + Math.floor((i % n) / bc);
  const R = new Array(n).fill(0), Cm = new Array(n).fill(0), Bx = new Array(n).fill(0), g = grid.slice();
  const cg = new Array(N).fill(-1), used = [], rest = [], left = [];
  if (cages) cages.forEach((c, k) => { used.push(0); rest.push(c.sum); left.push(c.cells.length); c.cells.forEach(i => { cg[i] = k; }); });
  for (let i = 0; i < N; i++) if (g[i]) {
    const b = 1 << g[i], r = Math.floor(i / n), c = i % n;
    if ((R[r] | Cm[c] | Bx[box(i)]) & b) return 0;
    R[r] |= b; Cm[c] |= b; Bx[box(i)] |= b;
    if (cages) { const k = cg[i]; if (used[k] & b) return 0; used[k] |= b; rest[k] -= g[i]; left[k]--; }
  }
  const lo = (k, m) => { let s = 0; for (let d = 1; d <= n && k; d++) if (m >> d & 1) { s += d; k--; } return k ? 999 : s; };
  const hi = (k, m) => { let s = 0; for (let d = n; d >= 1 && k; d--) if (m >> d & 1) { s += d; k--; } return k ? -999 : s; };
  const opts = i => {
    let m = ALL & ~(R[Math.floor(i / n)] | Cm[i % n] | Bx[box(i)]);
    if (cages) { const k = cg[i]; m &= ~used[k]; let out = 0;
      for (let d = 1; d <= n; d++) if (m >> d & 1) { const r2 = rest[k] - d, l2 = left[k] - 1, av = ALL & ~used[k] & ~(1 << d);
        if (l2 === 0 ? r2 === 0 : (r2 >= lo(l2, av) && r2 <= hi(l2, av))) out |= 1 << d; }
      m = out; }
    return m;
  };
  let cnt = 0;
  (function go() {
    if (cnt >= limit) return;
    let best = -1, bm = 0, bc2 = 99;
    for (let i = 0; i < N; i++) if (!g[i]) { const m = opts(i); let c = 0, t = m; while (t) { t &= t - 1; c++; } if (c < bc2) { bc2 = c; best = i; bm = m; if (c <= 1) break; } }
    if (best < 0) { cnt++; return; }
    if (!bc2) return;
    const i = best, r = Math.floor(i / n), c = i % n, bx = box(i), k = cages ? cg[i] : -1;
    for (let d = 1; d <= n && cnt < limit; d++) if (bm >> d & 1) {
      const b = 1 << d; g[i] = d; R[r] |= b; Cm[c] |= b; Bx[bx] |= b; if (cages) { used[k] |= b; rest[k] -= d; left[k]--; }
      go();
      g[i] = 0; R[r] &= ~b; Cm[c] &= ~b; Bx[bx] &= ~b; if (cages) { used[k] &= ~b; rest[k] += d; left[k]++; }
    }
  })();
  return cnt;
}

function checkBoard(p) {
  const n = p.n, N = n * n, err = [], sol = p.solution, g = E.geo(n);
  for (const u of g.units) { const s = new Set(u.cells.map(i => sol[i])); if (s.size !== n || [...s].some(d => d < 1 || d > n)) { err.push('sudoku-rule'); break; } }
  if (p.givens.some((d, i) => d && d !== sol[i])) err.push('given≠solution');
  for (const u of g.units) { const ds = u.cells.map(i => p.givens[i]).filter(Boolean); if (new Set(ds).size !== ds.length) { err.push('given-dup'); break; } }
  if (p.cages) {
    const cov = new Array(N).fill(0);
    p.cages.forEach(c => {
      const ds = c.cells.map(i => sol[i]);
      if (!c.cells.length) err.push('empty-cage');
      if (new Set(ds).size !== ds.length) err.push('cage-dup');
      if (ds.reduce((a, b) => a + b, 0) !== c.sum) err.push('cage-sum');
      const gv = c.cells.map(i => p.givens[i]).filter(Boolean);
      if (new Set(gv).size !== gv.length) err.push('cage-given-dup');
      if (gv.reduce((a, b) => a + b, 0) > c.sum) err.push('cage-given-over');
      c.cells.forEach(i => cov[i]++);
      const set = new Set(c.cells), seen = new Set([c.cells[0]]), st = [c.cells[0]];
      while (st.length) { const i = st.pop(); for (const j of [i - n, i + n, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1]) if (set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } }
      if (seen.size !== set.size) err.push('cage-split');
    });
    if (cov.some(x => x !== 1)) err.push('cover');
    err.push(...drawCheck(n, p.cages));
  }
  if (indep(n, p.givens, p.cages, 2) !== 1) err.push('not-unique');
  const ctx = E.ctxOf(n, p.cages), lv = p.level;
  const r = E.logicSolve(ctx, p.givens, { maxTier: E.maxTierOf(n, lv, p.killer) });
  if (!r.solved || r.grid.join() !== sol.join()) err.push('level-not-solvable');
  if (lv > 1 && E.solvableUpTo(ctx, p.givens, E.maxTierOf(n, lv - 1, p.killer))) err.push('level-too-easy');
  for (const st of r.steps) {
    if (st.place && sol[st.place[0]] !== st.place[1]) { err.push('logic-bad-place'); break; }
    if (st.elim && st.elim.some(([i, m]) => m >> sol[i] & 1)) { err.push('logic-bad-elim'); break; }
  }
  return [...new Set(err)];
}

/* ציור הכלובים: בכל גבול בין שתי משבצות סמוכות יש קו מקווקו משני הצדדים אם הן בכלובים שונים, ואין קו אם הן באותו כלוב.
   גם לאורך שולי הלוח. בדיקה על הקטעים שהציור מייצר בפועל (אחרי ההיפוך לימין-לשמאל) */
function drawCheck(n, cages) {
  const d = 0.1, segs = B.cageSegs(n, cages, d), own = new Array(n * n).fill(-1), err = [];
  cages.forEach((c, k) => c.cells.forEach(i => { own[i] = k; }));
  const near = (a, b) => Math.abs(a - b) < 0.02;
  const vAt = (x, y) => segs.some(([x1, y1, x2, y2]) => near(x1, x2) && near(x1, x) && Math.min(y1, y2) <= y && Math.max(y1, y2) >= y);
  const hAt = (x, y) => segs.some(([x1, y1, x2, y2]) => near(y1, y2) && near(y1, y) && Math.min(x1, x2) <= x && Math.max(x1, x2) >= x);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c, X = n - c; // הצד הימני של המשבצת בתצוגה (עמודה 0 מימין)
    // ימין במודל (c+1) = שמאל בתצוגה, בקו X-1
    const nbR = c + 1 < n ? own[i + 1] : -2, nbD = r + 1 < n ? own[i + n] : -2, nbL = c ? own[i - 1] : -2, nbU = r ? own[i - n] : -2;
    const diffR = nbR !== own[i], diffL = nbL !== own[i], diffD = nbD !== own[i], diffU = nbU !== own[i];
    if (vAt(X - 1 + d, r + 0.5) !== diffR) err.push('draw-v');
    if (vAt(X - d, r + 0.5) !== diffL) err.push('draw-v');
    if (hAt(X - 0.5, r + 1 - d) !== diffD) err.push('draw-h');
    if (hAt(X - 0.5, r + d) !== diffU) err.push('draw-h');
  }
  // תווית הסכום בתוך הכלוב שלה, ואחת לכל כלוב
  const anchors = cages.map(c => B.anchor(n, c.cells));
  if (anchors.some((a, k) => own[a] !== k) || new Set(anchors).size !== anchors.length) err.push('draw-label');
  // צבעי כלובים שכנים שונים
  const col = B.cageColors(n, cages);
  for (let i = 0; i < n * n; i++) for (const j of [i % n < n - 1 ? i + 1 : -1, i + n < n * n ? i + n : -1]) if (j >= 0 && own[i] !== own[j] && col[own[i]] === col[own[j]]) err.push('draw-color');
  return [...new Set(err)];
}

const out = [];
if (require.main === module) for (const t of Object.keys(E.TYPES)) for (const lv of E.LEVELS) {
  if (!E.supported(t, lv) || (only && !only.includes(t))) continue;
  const t0 = Date.now(), bad = {}, keys = new Set(); let made = 0, dup = 0, ex = null;
  for (let s = 0; s < M; s++) {
    const p = E.generateSafe(t, lv, 'm' + s);
    if (!p) { bad['no-board'] = (bad['no-board'] || 0) + 1; continue; }
    made++; if (keys.has(p.key)) dup++; keys.add(p.key);
    const e = checkBoard(p); e.forEach(x => { bad[x] = (bad[x] || 0) + 1; }); if (e.length && !ex) ex = p.id + ' ' + e.join(',');
  }
  const line = `${t} רמה ${lv}: ${made}/${M} לוחות, שונים ${keys.size}, תקלות ${Object.values(bad).reduce((a, b) => a + b, 0)}${Object.keys(bad).length ? ' ' + JSON.stringify(bad) + ' לדוגמה ' + ex : ''} · ${((Date.now() - t0) / 1000).toFixed(0)} שנ'`;
  console.log(line); out.push(line);
}
module.exports = { indep, checkBoard, drawCheck };
