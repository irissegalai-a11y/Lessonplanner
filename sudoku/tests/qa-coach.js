// בדיקת המאמן: מצבי ביניים אקראיים → רמז; צעד נכון, טקסטים תקינים, זיהוי טעויות
const E = require('../engine.js'), C = require('../coach.js');
const M = +process.argv[2] || 20; let bad = [], n = 0, kinds = {}, strat = {}, sample = {};
for (const t of Object.keys(E.TYPES)) for (const lv of E.LEVELS) {
  if (!E.supported(t, lv)) continue;
  for (let s = 0; s < M; s++) {
    const p = E.generateSafe(t, lv, 'c' + s); if (!p) continue;
    const rand = E.rng('h' + s), N = p.n * p.n;
    // מצב ביניים: חלק מהמשבצות הריקות מולאו נכון
    const g = p.givens.slice(); const known = new Array(N).fill(0);
    const empt = [...Array(N).keys()].filter(i => !g[i]); E.shuffle(empt, rand);
    empt.slice(0, Math.floor(empt.length * rand() * 0.7)).forEach(i => g[i] = p.solution[i]);
    // משחקים עד הסוף רק עם רמזים – כל רמז חייב להיות נכון
    for (let k = 0; k < 400; k++) {
      const h = C.hint(p, g, known, -1); n++;
      kinds[h.kind] = (kinds[h.kind] || 0) + 1;
      if (h.kind === 'done') break;
      if (h.kind !== 'step') { bad.push(p.id + ' ' + h.kind); break; }
      if (h.levels.length !== 4 || h.levels.some(l => !l.t || /undefined|NaN|null/.test(l.t))) { bad.push(p.id + ' text ' + h.strategy + ' ' + h.levels.map(l => l.t).join(' | ')); break; }
      strat[h.strategy] = (strat[h.strategy] || 0) + 1;
      if (!sample[h.strategy]) sample[h.strategy] = h.levels.map(l => l.t);
      const st = h.step;
      if (st.place) { if (p.solution[st.place[0]] !== st.place[1]) { bad.push(p.id + ' wrong place'); break; } g[st.place[0]] = st.place[1]; }
      if (st.elim) { if (st.elim.some(([i, m]) => m >> p.solution[i] & 1)) { bad.push(p.id + ' wrong elim'); break; } st.elim.forEach(([i, m]) => known[i] |= m); }
    }
    if (g.join() !== p.solution.join()) bad.push(p.id + ' not finished');
    // טעות: מספר שגוי במשבצת ריקה
    const g2 = p.givens.slice(); const e = [...Array(N).keys()].filter(i => !g2[i]);
    const i = e[Math.floor(rand() * e.length)]; const wrongD = ((p.solution[i]) % p.n) + 1; g2[i] = wrongD;
    const h2 = C.hint(p, g2, null, i);
    if (h2.kind !== 'error' || h2.cell !== i) bad.push(p.id + ' error not found ' + h2.kind);
    else { kinds['err-' + h2.sub] = (kinds['err-' + h2.sub] || 0) + 1; if (!sample['err-' + h2.sub]) sample['err-' + h2.sub] = h2.levels.map(l => l.t); if (h2.levels.some(l => /undefined|NaN/.test(l.t))) bad.push(p.id + ' err text'); }
  }
}
console.log('hints', n, kinds, strat, 'bad', bad.length, bad.slice(0, 6));
require('fs').writeFileSync(require('os').tmpdir() + '/coach-samples.json', JSON.stringify(sample, null, 1));
