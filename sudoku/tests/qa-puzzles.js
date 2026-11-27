// בדיקת איכות: 100 חידות לכל שילוב נתמך. פותר בלתי תלוי (ברוט-פורס פשוט) לספירת פתרונות
const E = require('../engine.js');
const M = +process.argv[2] || 100, only = process.argv[3];
function indepCount(n, grid, cages, limit) {
  const SH = { 4: [2, 2], 6: [2, 3], 9: [3, 3] }[n], N = n * n, g = grid.slice();
  const cageOf = new Array(N).fill(-1); if (cages) cages.forEach((c, k) => c.cells.forEach(i => cageOf[i] = k));
  const ok = (i, d) => {
    const r = Math.floor(i / n), c = i % n;
    for (let j = 0; j < n; j++) { if (g[r * n + j] === d || g[j * n + c] === d) return false; }
    const r0 = r - r % SH[0], c0 = c - c % SH[1];
    for (let a = 0; a < SH[0]; a++) for (let b = 0; b < SH[1]; b++) if (g[(r0 + a) * n + c0 + b] === d) return false;
    if (cages) { const cg = cages[cageOf[i]]; let s = d, empty = 0; for (const x of cg.cells) { if (x === i) continue; if (g[x] === d) return false; if (g[x]) s += g[x]; else empty++; }
      if (s > cg.sum) return false; if (!empty && s !== cg.sum) return false; }
    return true;
  };
  let cnt = 0;
  (function rec(i) { if (cnt >= limit) return; while (i < N && g[i]) i++; if (i === N) { cnt++; return; } for (let d = 1; d <= n; d++) if (ok(i, d)) { g[i] = d; rec(i + 1); g[i] = 0; if (cnt >= limit) return; } })(0);
  return cnt;
}
function validSolution(n, sol, cages) {
  const g = E.geo(n);
  for (const u of g.units) { const s = new Set(u.cells.map(i => sol[i])); if (s.size !== n || [...s].some(d => d < 1 || d > n)) return 'unit'; }
  if (cages) { const cov = new Array(n * n).fill(0);
    for (const c of cages) { const ds = c.cells.map(i => sol[i]); if (new Set(ds).size !== ds.length) return 'cage-dup'; if (ds.reduce((a, b) => a + b, 0) !== c.sum) return 'cage-sum'; c.cells.forEach(i => cov[i]++);
      // קשירות הכלוב
      const set = new Set(c.cells), seen = new Set([c.cells[0]]), st = [c.cells[0]];
      while (st.length) { const i = st.pop(); for (const j of [i - n, i + n, i % n ? i - 1 : -1, (i + 1) % n ? i + 1 : -1]) if (set.has(j) && !seen.has(j)) { seen.add(j); st.push(j); } }
      if (seen.size !== set.size) return 'cage-split'; }
    if (cov.some(x => x !== 1)) return 'cover'; }
  return '';
}
const report = [];
for (const t of Object.keys(E.TYPES)) for (const lv of E.LEVELS) {
  if (!E.supported(t, lv) || (only && only !== t)) continue;
  const t0 = Date.now(); let bad = [], keys = new Set(), giv = [], strat = {}, nulls = 0, steps = [], dup = 0;
  for (let s = 0; s < M; s++) {
    const p = E.generateSafe(t, lv, 'qa' + s);
    if (!p) { nulls++; continue; }
    if (keys.has(p.key)) dup++; keys.add(p.key);
    const ctx = E.ctxOf(p.n, p.cages);
    if (indepCount(p.n, p.givens, p.cages, 2) !== 1) bad.push(p.id + ' not-unique');
    const v = validSolution(p.n, p.solution, p.cages); if (v) bad.push(p.id + ' ' + v);
    if (p.givens.some((d, i) => d && d !== p.solution[i])) bad.push(p.id + ' givens');
    // דירוג: הפותר הלוגי פותר עד השכבה המותרת, ולא פותר בשכבה שמתחת לרמה
    const mt = E.maxTierOf(p.n, lv, p.killer);
    const r = E.logicSolve(ctx, p.givens, { maxTier: mt });
    if (!r.solved || r.grid.join() !== p.solution.join()) bad.push(p.id + ' logic');
    if (lv > 1 && E.solvableUpTo(ctx, p.givens, E.maxTierOf(p.n, lv - 1, p.killer))) bad.push(p.id + ' too-easy');
    // כל צעד לוגי נכון: הצבות = הפתרון, מחיקות לא מוחקות את הספרה הנכונה
    for (const st of r.steps) { if (st.place && p.solution[st.place[0]] !== st.place[1]) { bad.push(p.id + ' bad-place ' + st.s); break; }
      if (st.elim && st.elim.some(([i, m]) => m >> p.solution[i] & 1)) { bad.push(p.id + ' bad-elim ' + st.s); break; } }
    // שחזור לפי מזהה
    if (s < 5) { const q = E.fromId(p.id); if (!q || q.key !== p.key) bad.push(p.id + ' id-replay'); }
    giv.push(p.givens.filter(x => x).length); steps.push(r.steps.length);
    for (const k in r.counts) strat[k] = (strat[k] || 0) + 1;
  }
  const ms = ((Date.now() - t0) / M).toFixed(0);
  const line = `${t} רמה ${lv}: ${M - nulls}/${M} נוצרו, כפולות ${dup}, תקלות ${bad.length}, נתונים ${Math.min(...giv)}–${Math.max(...giv)}, צעדים ${Math.min(...steps)}–${Math.max(...steps)}, ממוצע ${ms}ms | ` + Object.entries(strat).sort((a, b) => E.TIER(a[0]) - E.TIER(b[0])).map(([k, v]) => k + ':' + v).join(' ');
  console.log(line); if (bad.length) console.log('  ', bad.slice(0, 5).join(' ; '));
  report.push(line);
}
require('fs').writeFileSync(__dirname + '/qa-report.txt', report.join('\n'));
