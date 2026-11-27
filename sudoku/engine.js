/* מנוע הסודוקו של mathinclass – יצירה, אימות פתרון יחיד, פותר לוגי ודירוג קושי.
   משותף למשחק, למרכז ההדרכה, לאתגר היומי ולמחולל החוברות. עובד גם ב-node (לבדיקות).
   מוסכמות: לוח = מערך באורך n*n, 0 = ריק. מועמדים = מסכת ביטים (ביט d = הספרה d).
   עמודה 0 מוצגת מימין (RTL) – רק בתצוגה; במנוע אין כיוון. */
(function (root, factory) {
  const E = factory();
  if (typeof module === 'object' && module.exports) module.exports = E; else root.SDK = E;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- אקראיות עם זרע (שחזור חידה לפי מזהה) ---------- */
  function seedInt(s) {
    s = String(s); let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^ h >>> 16) >>> 0;
  }
  function rng(seed) {
    let a = seedInt(seed);
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const shuffle = (a, rand) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

  /* ---------- ביטים ---------- */
  const pc = m => { let k = 0; while (m) { m &= m - 1; k++; } return k; };
  const digs = m => { const a = []; for (let d = 1; d < 10; d++) if (m >> d & 1) a.push(d); return a; };
  const low = m => { for (let d = 1; d < 10; d++) if (m >> d & 1) return d; return 0; };
  const bit = d => 1 << d;

  /* ---------- גאומטריה ---------- */
  const SHAPES = { 4: [2, 2], 6: [2, 3], 9: [3, 3] }; // [שורות באזור, עמודות באזור]
  const GEO = {};
  function geo(n) {
    if (GEO[n]) return GEO[n];
    const [br, bc] = SHAPES[n], N = n * n, bpr = n / bc;
    const R = [], C = [], B = [];
    for (let i = 0; i < N; i++) { const r = i / n | 0, c = i % n; R.push(r); C.push(c); B.push((r / br | 0) * bpr + (c / bc | 0)); }
    const units = [];
    for (let r = 0; r < n; r++) units.push({ t: 'r', k: r, cells: Array.from({ length: n }, (_, c) => r * n + c) });
    for (let c = 0; c < n; c++) units.push({ t: 'c', k: c, cells: Array.from({ length: n }, (_, r) => r * n + c) });
    for (let b = 0; b < n; b++) units.push({ t: 'b', k: b, cells: [] });
    for (let i = 0; i < N; i++) units[2 * n + B[i]].cells.push(i);
    const uOf = [], peers = [];
    for (let i = 0; i < N; i++) {
      uOf.push([R[i], n + C[i], 2 * n + B[i]]);
      const s = new Set();
      uOf[i].forEach(u => units[u].cells.forEach(j => { if (j !== i) s.add(j); }));
      peers.push([...s]);
    }
    return (GEO[n] = { n, br, bc, N, R, C, B, units, uOf, peers, FULL: ((1 << n) - 1) << 1, TOTAL: n * (n + 1) / 2 });
  }

  /* הקשר של חידה: גאומטריה + כלובים (בסודוקו סכומים). שותפים = שורה, עמודה, אזור וגם אותו כלוב */
  function ctxOf(n, cages) {
    const g = geo(n);
    if (!cages || !cages.length) return { g, n, cages: null, cageOf: null, peers: g.peers, units: g.units };
    const cageOf = new Array(g.N).fill(-1);
    cages.forEach((cg, k) => cg.cells.forEach(i => { cageOf[i] = k; }));
    const peers = g.peers.map((p, i) => { const s = new Set(p); cages[cageOf[i]].cells.forEach(j => { if (j !== i) s.add(j); }); return [...s]; });
    return { g, n, cages, cageOf, peers, units: g.units };
  }

  /* סכום מינימלי/מקסימלי של k ספרות שונות מתוך מסכה */
  function minS(k, m) { let s = 0; for (let d = 1; d < 10 && k; d++) if (m >> d & 1) { s += d; k--; } return k ? 1e9 : s; }
  function maxS(k, m) { let s = 0; for (let d = 9; d > 0 && k; d--) if (m >> d & 1) { s += d; k--; } return k ? -1e9 : s; }

  /* ---------- פותר ספירה (מנגנון אימות – נפרד מהפותר הלוגי) ---------- */
  function countSolutions(ctx, grid, limit, rand) {
    const { g, cages, cageOf } = ctx, N = g.N, n = g.n, FULL = g.FULL, R = g.R, C = g.C, B = g.B;
    const v = Array.from(grid), rm = new Int32Array(n), cm = new Int32Array(n), bm = new Int32Array(n);
    const K = cages ? cages.length : 0, cu = new Int32Array(K), cr = new Int32Array(K), cl = new Int32Array(K);
    for (let k = 0; k < K; k++) { cr[k] = cages[k].sum; cl[k] = cages[k].cells.length; }
    for (let i = 0; i < N; i++) {
      const d = v[i]; if (!d) continue; const b = 1 << d;
      if ((rm[R[i]] | cm[C[i]] | bm[B[i]]) & b) return { count: 0, sol: null };
      rm[R[i]] |= b; cm[C[i]] |= b; bm[B[i]] |= b;
      if (K) { const k = cageOf[i]; if (cu[k] & b) return { count: 0, sol: null }; cu[k] |= b; cr[k] -= d; cl[k]--; }
    }
    for (let k = 0; k < K; k++) if (cr[k] < 0 || (cl[k] === 0 && cr[k] !== 0)) return { count: 0, sol: null };
    const emp = []; for (let i = 0; i < N; i++) if (!v[i]) emp.push(i);
    let count = 0, sol = null;
    const opts = i => {
      let m = FULL & ~(rm[R[i]] | cm[C[i]] | bm[B[i]]);
      if (K && m) {
        const k = cageOf[i]; m &= ~cu[k];
        const left = cl[k] - 1, rem = cr[k]; let mm = 0;
        for (let d = 1; d <= n; d++) if (m >> d & 1) {
          const r2 = rem - d;
          if (left === 0 ? r2 === 0 : (r2 >= minS(left, FULL & ~cu[k] & ~(1 << d)) && r2 <= maxS(left, FULL & ~cu[k] & ~(1 << d)))) mm |= 1 << d;
        }
        m = mm;
      }
      return m;
    };
    function rec(depth) {
      if (depth === emp.length) { count++; if (!sol) sol = v.slice(); return count >= limit; }
      let bj = -1, bmask = 0, best = 99;
      for (let j = depth; j < emp.length; j++) { const m = opts(emp[j]), k = pc(m); if (k < best) { best = k; bj = j; bmask = m; if (k <= 1) break; } }
      if (best === 0) return false;
      const t = emp[depth]; emp[depth] = emp[bj]; emp[bj] = t;
      const i = emp[depth], ds = digs(bmask); if (rand) shuffle(ds, rand);
      const r = R[i], c = C[i], bx = B[i], k = K ? cageOf[i] : -1;
      let stop = false;
      for (const d of ds) {
        const b = 1 << d; v[i] = d; rm[r] |= b; cm[c] |= b; bm[bx] |= b; if (K) { cu[k] |= b; cr[k] -= d; cl[k]--; }
        stop = rec(depth + 1);
        v[i] = 0; rm[r] &= ~b; cm[c] &= ~b; bm[bx] &= ~b; if (K) { cu[k] &= ~b; cr[k] += d; cl[k]++; }
        if (stop) break;
      }
      emp[bj] = emp[depth]; emp[depth] = t;
      return stop;
    }
    rec(0);
    return { count, sol };
  }
  const isUnique = (ctx, grid) => countSolutions(ctx, grid, 2).count === 1;
  function randomSolution(n, rand) { return countSolutions(ctxOf(n), new Array(n * n).fill(0), 1, rand).sol; }

  /* ---------- צירופי סכום (סודוקו סכומים) ---------- */
  const COMBO = {};
  function combos(n, k, s) { // כל קבוצות של k ספרות שונות מ-1..n שסכומן s (מסכות)
    const key = n + ':' + k + ':' + s; if (COMBO[key]) return COMBO[key];
    const out = [];
    (function rec(d, kk, ss, m) { if (!kk) { if (!ss) out.push(m); return; } for (let x = d; x <= n && x <= ss; x++) rec(x + 1, kk - 1, ss - x, m | 1 << x); })(1, k, s, 0);
    return (COMBO[key] = out);
  }
  /* צמצום מועמדים בקבוצת משבצות שספרותיהן שונות וסכומן ידוע. מחזיר מסכות חדשות + הצירופים שנשארו אפשריים */
  function restrictSet(cands, sum) {
    const k = cands.length, res = new Array(k).fill(0), sets = new Set();
    const cur = new Array(k);
    (function rec(j, used, s) {
      if (j === k) { if (s === sum) { for (let t = 0; t < k; t++) res[t] |= 1 << cur[t]; sets.add(used); } return; }
      for (let d = 1; d < 10; d++) if ((cands[j] >> d & 1) && !(used >> d & 1) && s + d <= sum) { cur[j] = d; rec(j + 1, used | 1 << d, s + d); }
    })(0, 0, 0);
    return { masks: res, sets: [...sets].sort((a, b) => a - b) };
  }

  /* ---------- הפותר הלוגי (מדמה פותר אנושי ומתעד אסטרטגיות) ---------- */
  // מצב: v ערכים, c מועמדים (0 במשבצת מלאה)
  function newState(ctx, grid, known) {
    const N = ctx.g.N, FULL = ctx.g.FULL, v = Array.from(grid), c = new Array(N).fill(0);
    for (let i = 0; i < N; i++) if (!v[i]) {
      let m = FULL; for (const p of ctx.peers[i]) if (v[p]) m &= ~(1 << v[p]);
      if (known && known[i]) m &= ~known[i]; // הסקות שכבר נעשו (המאמן זוכר)
      c[i] = m;
    }
    return { v, c };
  }
  function apply(ctx, S, st) {
    if (st.place) {
      const [i, d] = st.place; S.v[i] = d; S.c[i] = 0;
      for (const p of ctx.peers[i]) S.c[p] &= ~(1 << d);
    }
    if (st.elim) st.elim.forEach(([i, m]) => { S.c[i] &= ~m; });
  }
  const emptiesOf = (S, cells) => cells.filter(i => !S.v[i]);
  const usedIn = (S, cells) => cells.reduce((m, i) => S.v[i] ? m | 1 << S.v[i] : m, 0);
  const elimList = (S, cells, m) => { const out = []; cells.forEach(i => { if (!S.v[i] && (S.c[i] & m)) out.push([i, S.c[i] & m]); }); return out; };

  const STRAT = {}; // id → { tier, fn }
  function def(id, tier, fn) { STRAT[id] = { id, tier, fn }; }

  // 1. המשבצת האחרונה ביחידה
  def('fullHouse', 1, (ctx, S) => {
    for (let u = 0; u < ctx.units.length; u++) {
      const cells = ctx.units[u].cells, e = emptiesOf(S, cells);
      if (e.length === 1) { const d = low(ctx.g.FULL & ~usedIn(S, cells)); if (d && (S.c[e[0]] >> d & 1)) return { place: [e[0], d], unit: u }; }
    }
    return null;
  });
  // 1. המשבצת האחרונה בכלוב (סודוקו סכומים)
  def('cageSingle', 1, (ctx, S) => {
    if (!ctx.cages) return null;
    for (let k = 0; k < ctx.cages.length; k++) {
      const cg = ctx.cages[k], e = emptiesOf(S, cg.cells);
      if (e.length !== 1) continue;
      const d = cg.sum - cg.cells.reduce((s, i) => s + S.v[i], 0);
      if (d >= 1 && d <= ctx.n && (S.c[e[0]] >> d & 1)) return { place: [e[0], d], cage: k };
    }
    return null;
  });
  // 1. האפשרות היחידה במשבצת
  def('nakedSingle', 2, (ctx, S) => {
    for (let i = 0; i < ctx.g.N; i++) if (!S.v[i] && pc(S.c[i]) === 1) return { place: [i, low(S.c[i])], cell: i };
    return null;
  });
  // 2. המקום היחיד ביחידה (הצלבת מידע). types: 'b' אזורים, 'rc' שורות ועמודות
  function hidden(types) {
    return (ctx, S) => {
      const n = ctx.n;
      for (let u = 0; u < ctx.units.length; u++) {
        if (!types.includes(ctx.units[u].t)) continue;
        const cells = ctx.units[u].cells, used = usedIn(S, cells);
        for (let d = 1; d <= n; d++) {
          if (used >> d & 1) continue;
          let pos = -1, cnt = 0;
          for (const i of cells) if (!S.v[i] && (S.c[i] >> d & 1)) { cnt++; pos = i; if (cnt > 1) break; }
          if (cnt === 1) return { place: [pos, d], unit: u, digit: d };
        }
      }
      return null;
    };
  }
  def('hiddenSingle', 3, hidden('brc'));
  STRAT.hiddenBox = { id: 'hiddenSingle', tier: 3, fn: hidden('b') };
  STRAT.hiddenLine = { id: 'hiddenSingle', tier: 3, fn: hidden('rc') };
  // 2. פירוק לסכומים – רק צירופים אפשריים בכלוב
  def('cageCombo', 3, (ctx, S) => {
    if (!ctx.cages) return null;
    for (let k = 0; k < ctx.cages.length; k++) {
      const cg = ctx.cages[k], e = emptiesOf(S, cg.cells); if (e.length < 2) continue;
      const rem = cg.sum - cg.cells.reduce((s, i) => s + S.v[i], 0);
      const { masks, sets } = restrictSet(e.map(i => S.c[i]), rem);
      const elim = []; e.forEach((i, t) => { const x = S.c[i] & ~masks[t]; if (x) elim.push([i, x]); });
      if (elim.length) return { elim, cage: k, cells: e, sets, rem };
    }
    return null;
  });
  // 3. מועמדים נעולים: באזור הספרה רק בשורה/עמודה אחת (pointing), או בשורה/עמודה רק באזור אחד (claiming)
  def('lockedPointing', 4, (ctx, S) => {
    const { g } = ctx, n = g.n;
    for (let b = 0; b < n; b++) {
      const cells = g.units[2 * n + b].cells;
      for (let d = 1; d <= n; d++) {
        const pos = cells.filter(i => !S.v[i] && (S.c[i] >> d & 1)); if (pos.length < 2) continue;
        for (const [t, key] of [['r', g.R], ['c', g.C]]) {
          if (pos.every(i => key[i] === key[pos[0]])) {
            const line = t === 'r' ? key[pos[0]] : n + key[pos[0]];
            const elim = elimList(S, g.units[line].cells.filter(i => g.B[i] !== b), 1 << d);
            if (elim.length) return { elim, unit: 2 * n + b, line, digit: d, cells: pos };
          }
        }
      }
    }
    return null;
  });
  def('lockedClaiming', 4, (ctx, S) => {
    const { g } = ctx, n = g.n;
    for (let u = 0; u < 2 * n; u++) {
      const cells = g.units[u].cells;
      for (let d = 1; d <= n; d++) {
        const pos = cells.filter(i => !S.v[i] && (S.c[i] >> d & 1)); if (pos.length < 2) continue;
        if (pos.every(i => g.B[i] === g.B[pos[0]])) {
          const box = 2 * n + g.B[pos[0]];
          const elim = elimList(S, g.units[box].cells.filter(i => !cells.includes(i)), 1 << d);
          if (elim.length) return { elim, unit: box, line: u, digit: d, cells: pos };
        }
      }
    }
    return null;
  });
  // 3–4. קבוצות גלויות (זוג/שלישייה): k משבצות שיש בהן יחד רק k מועמדים
  function nakedSet(k) {
    return (ctx, S) => {
      for (let u = 0; u < ctx.units.length; u++) {
        const cells = ctx.units[u].cells, e = emptiesOf(S, cells).filter(i => pc(S.c[i]) <= k);
        if (e.length < k) continue;
        const pick = [];
        const rec = (s, m) => {
          if (pick.length === k) {
            if (pc(m) !== k) return null;
            const elim = elimList(S, cells.filter(i => !pick.includes(i)), m);
            return elim.length ? { elim, unit: u, cells: pick.slice(), digits: digs(m) } : null;
          }
          for (let j = s; j < e.length; j++) { const m2 = m | S.c[e[j]]; if (pc(m2) > k) continue; pick.push(e[j]); const r = rec(j + 1, m2); pick.pop(); if (r) return r; }
          return null;
        };
        const r = rec(0, 0); if (r) return r;
      }
      return null;
    };
  }
  // 3–4. קבוצות סמויות: k ספרות שיכולות להיות רק באותן k משבצות
  function hiddenSet(k) {
    return (ctx, S) => {
      const n = ctx.n;
      for (let u = 0; u < ctx.units.length; u++) {
        const cells = ctx.units[u].cells, used = usedIn(S, cells);
        const pos = {}; const ds = [];
        for (let d = 1; d <= n; d++) if (!(used >> d & 1)) {
          const p = cells.filter(i => !S.v[i] && (S.c[i] >> d & 1));
          if (p.length >= 2 && p.length <= k) { pos[d] = p; ds.push(d); }
        }
        if (ds.length < k) continue;
        const pick = [];
        const rec = s => {
          if (pick.length === k) {
            const set = [...new Set(pick.flatMap(d => pos[d]))];
            if (set.length !== k) return null;
            const m = pick.reduce((a, d) => a | 1 << d, 0);
            const elim = set.filter(i => S.c[i] & ~m).map(i => [i, S.c[i] & ~m]);
            return elim.length ? { elim, unit: u, cells: set, digits: pick.slice() } : null;
          }
          for (let j = s; j < ds.length; j++) { pick.push(ds[j]); const r = rec(j + 1); pick.pop(); if (r) return r; }
          return null;
        };
        const r = rec(0); if (r) return r;
      }
      return null;
    };
  }
  def('nakedPair', 4, nakedSet(2));
  def('hiddenPair', 4, hiddenSet(2));
  // 3. כלל הסכום: סכום כל שורה/עמודה/אזור ידוע. מה שנשאר מחוץ לכלובים שבתוך היחידה – קבוצה עם סכום ידוע
  def('unitSum', 4, (ctx, S) => {
    if (!ctx.cages) return null;
    const { g } = ctx;
    for (let u = 0; u < g.units.length; u++) {
      const cells = g.units[u].cells, inSet = new Set(cells);
      let insideSum = 0; const rest = [];
      const seen = new Set();
      cells.forEach(i => { const k = ctx.cageOf[i]; if (seen.has(k)) return; seen.add(k); });
      const inside = [...seen].filter(k => ctx.cages[k].cells.every(i => inSet.has(i)));
      inside.forEach(k => { insideSum += ctx.cages[k].sum; });
      cells.forEach(i => { if (!inside.includes(ctx.cageOf[i])) rest.push(i); });
      if (!rest.length || rest.length === cells.length) continue;
      const e = emptiesOf(S, rest); if (!e.length) continue;
      const rem = g.TOTAL - insideSum - rest.reduce((s, i) => s + S.v[i], 0);
      if (e.length === 1) { if (rem >= 1 && rem <= g.n && (S.c[e[0]] >> rem & 1)) return { place: [e[0], rem], unit: u, rest, inside, sumRest: g.TOTAL - insideSum }; continue; }
      const { masks, sets } = restrictSet(e.map(i => S.c[i]), rem);
      const elim = []; e.forEach((i, t) => { const x = S.c[i] & ~masks[t]; if (x) elim.push([i, x]); });
      if (elim.length) return { elim, unit: u, rest, inside, cells: e, sets, rem, sumRest: g.TOTAL - insideSum };
    }
    return null;
  });
  def('nakedTriple', 5, nakedSet(3));
  def('hiddenTriple', 5, hiddenSet(3));
  // 4. כנף X: בשתי שורות הספרה רק באותן שתי עמודות (או להפך)
  def('xWing', 5, (ctx, S) => {
    const { g } = ctx, n = g.n;
    for (const [lines, cross] of [[0, n], [n, 0]]) {
      for (let d = 1; d <= n; d++) {
        const L = [];
        for (let a = 0; a < n; a++) {
          const p = g.units[lines + a].cells.filter(i => !S.v[i] && (S.c[i] >> d & 1));
          if (p.length === 2) L.push({ a, p, x: p.map(i => lines === 0 ? g.C[i] : g.R[i]) });
        }
        for (let s = 0; s < L.length; s++) for (let t = s + 1; t < L.length; t++) {
          if (L[s].x[0] !== L[t].x[0] || L[s].x[1] !== L[t].x[1]) continue;
          const corners = [...L[s].p, ...L[t].p];
          const elim = [];
          L[s].x.forEach(x => elim.push(...elimList(S, g.units[cross + x].cells.filter(i => !corners.includes(i)), 1 << d)));
          if (elim.length) return { elim, digit: d, cells: corners, lines: [lines + L[s].a, lines + L[t].a], cross: L[s].x.map(x => cross + x) };
        }
      }
    }
    return null;
  });
  // 4. מזלג (XY): ציר {x,y}, צבת {x,z} וצבת {y,z} – z לא יכול להיות במשבצת שרואה את שתי הצבתות
  def('xyWing', 5, (ctx, S) => {
    const { g } = ctx, P = ctx.peers;
    const bi = []; for (let i = 0; i < g.N; i++) if (!S.v[i] && pc(S.c[i]) === 2) bi.push(i);
    for (const pv of bi) {
      const m = S.c[pv], [x, y] = digs(m);
      const pins = P[pv].filter(j => !S.v[j] && pc(S.c[j]) === 2 && S.c[j] !== m && pc(S.c[j] & m) === 1);
      for (const a of pins) for (const b of pins) {
        if (a >= b) continue;
        const za = S.c[a] & ~m, zb = S.c[b] & ~m;
        if (za !== zb || (S.c[a] & m) === (S.c[b] & m)) continue;
        const z = low(za), Pa = new Set(P[a]);
        const elim = elimList(S, P[b].filter(j => Pa.has(j) && j !== pv), 1 << z);
        if (elim.length) return { elim, cells: [pv, a, b], digit: z, pivot: pv, digits: [x, y, z] };
      }
    }
    return null;
  });
  // 4. כלל הסכום בשתי יחידות סמוכות (שתי שורות/עמודות) – כשנשארת משבצת אחת
  def('multiSum', 5, (ctx, S) => {
    if (!ctx.cages) return null;
    const { g } = ctx, n = g.n;
    for (const base of [0, n]) for (let a = 0; a + 1 < n; a++) {
      const cells = [...g.units[base + a].cells, ...g.units[base + a + 1].cells], inSet = new Set(cells);
      const ks = [...new Set(cells.map(i => ctx.cageOf[i]))].filter(k => ctx.cages[k].cells.every(i => inSet.has(i)));
      const rest = cells.filter(i => !ks.includes(ctx.cageOf[i])), e = emptiesOf(S, rest);
      if (e.length !== 1) continue;
      const d = 2 * g.TOTAL - ks.reduce((s, k) => s + ctx.cages[k].sum, 0) - rest.reduce((s, i) => s + S.v[i], 0);
      if (d >= 1 && d <= n && (S.c[e[0]] >> d & 1)) return { place: [e[0], d], units: [base + a, base + a + 1], rest, inside: ks };
    }
    return null;
  });

  // סדר הדירוג: תמיד האסטרטגיה הקלה ביותר שזמינה
  const ORDER = ['fullHouse', 'cageSingle', 'nakedSingle', 'hiddenSingle', 'cageCombo', 'lockedPointing', 'lockedClaiming', 'nakedPair', 'hiddenPair', 'unitSum', 'nakedTriple', 'hiddenTriple', 'xWing', 'xyWing', 'multiSum'];
  // סדר "אנושי" למאמן: מקום יחיד באזור לפני אפשרות יחידה (קל יותר לראות בלוח גדול)
  const COACH_ORDER = ['fullHouse', 'cageSingle', 'hiddenBox', 'nakedSingle', 'hiddenLine', 'cageCombo', 'lockedPointing', 'lockedClaiming', 'nakedPair', 'hiddenPair', 'unitSum', 'nakedTriple', 'hiddenTriple', 'xWing', 'xyWing', 'multiSum'];
  const TIER = id => STRAT[id].tier;

  function findStep(ctx, S, maxTier, order) {
    for (const id of order || ORDER) {
      const s = STRAT[id]; if (s.tier > maxTier) continue;
      const st = s.fn(ctx, S);
      if (st) { st.s = s.id; st.tier = s.tier; return st; }
    }
    return null;
  }
  const broken = (ctx, S) => { for (let i = 0; i < ctx.g.N; i++) if (!S.v[i] && !S.c[i]) return true; return false; };

  /* פתרון לוגי מלא. מחזיר האם נפתר, הצעדים, השכבה הגבוהה ביותר וספירה לכל אסטרטגיה */
  function logicSolve(ctx, grid, opt) {
    opt = opt || {};
    const maxTier = opt.maxTier || 5, S = newState(ctx, grid, opt.known), steps = [], counts = {};
    let top = 0;
    for (let guard = 0; guard < 2000; guard++) {
      if (S.v.every(x => x)) break;
      const st = findStep(ctx, S, maxTier, opt.order);
      if (!st) break;
      apply(ctx, S, st);
      if (opt.record !== false) steps.push(st);
      counts[st.s] = (counts[st.s] || 0) + 1;
      if (st.tier > top) top = st.tier;
      if (broken(ctx, S)) return { solved: false, broken: true, steps, counts, top, grid: S.v };
    }
    return { solved: S.v.every(x => x), steps, counts, top, grid: S.v, state: S };
  }
  const solvableUpTo = (ctx, grid, t) => logicSolve(ctx, grid, { maxTier: t, record: false }).solved;

  /* ---------- סוגים, רמות ודירוג ----------
     שכבות אסטרטגיה: 1 מספר חסר (המשבצת האחרונה ביחידה/בכלוב) · 2 אפשרות יחידה · 3 מקום יחיד, פירוק לסכומים
     4 מועמדים נעולים, זוגות, כלל הסכום · 5 שלישיות, כנף X, מזלג XY, כלל הסכום בשתי יחידות.
     הרמה נקבעת לפי השכבה הגבוהה ביותר שהפותר הלוגי נזקק לה (תמיד מנסה קודם את הקלה ביותר) – מותאם לגודל הלוח:
     4×4 – בכל לוח 4×4 תמיד יש "אפשרות יחידה", ולכן יש בו רק קלה (מספר חסר) ובינונית (הצלבת מידע). */
  const LEVEL_OF_TIER = { 4: [0, 1, 2, 2, 3, 3], 6: [0, 1, 1, 2, 3, 4], 9: [0, 1, 1, 2, 3, 4] };
  const MAX_TIER = { 4: [0, 1, 3, 5, 5], 6: [0, 2, 3, 4, 5], 9: [0, 2, 3, 4, 5] }; // לרמה → השכבה המותרת
  // סודוקו סכומים: הכלובים מוסיפים מידע, ולכן גם ב-4×4 יש רמה מאתגרת (כלל הסכום) – אותו מיפוי לכל הגדלים
  const LEVEL_OF_TIER_K = [0, 1, 1, 2, 3, 4], MAX_TIER_K = [0, 2, 3, 4, 5];
  const levelOf = (n, top, killer) => (killer ? LEVEL_OF_TIER_K : LEVEL_OF_TIER[n])[top] || 0;
  const maxTierOf = (n, level, killer) => (killer ? MAX_TIER_K : MAX_TIER[n])[level];
  const LEVELS = [1, 2, 3, 4];
  const LEVEL_NAME = { 1: 'קלה', 2: 'בינונית', 3: 'מאתגרת', 4: 'מומחים' };
  const TYPES = {
    '4': { n: 4, killer: false, name: 'סודוקו 4×4' },
    '6': { n: 6, killer: false, name: 'סודוקו 6×6' },
    '9': { n: 9, killer: false, name: 'סודוקו 9×9' },
    'k4': { n: 4, killer: true, name: 'סכומים 4×4' },
    'k6': { n: 6, killer: true, name: 'סכומים 6×6' },
    'k9': { n: 9, killer: true, name: 'סכומים 9×9' }
  };
  // הגדרות יצירה לכל שילוב נתמך. min = מספר נתונים מינימלי (כדי שלוח קל יישאר מזמין), max = מקסימלי
  // שילוב שלא מופיע כאן – לא ניתן ליצור באמת, ולכן לא מוצג
  const CONF = {
    '4': { 1: { min: 8 }, 2: { min: 4 } },
    '6': { 1: { min: 18, sym: 1 }, 2: { min: 11, sym: 1 }, 3: { min: 7, att: 3000 }, 4: { min: 7, att: 3000 } },
    '9': { 1: { min: 38, sym: 1 }, 2: { min: 28, sym: 1 }, 3: { min: 23, sym: 1 }, 4: { min: 22, sym: 1, att: 200 } },
    // סכומים 4×4: רמה מאתגרת כמעט לא מתקבלת (כמעט תמיד מספיק פירוק לסכומים) – לכן רק קלה ובינונית
    'k4': { 1: { cage: [1, 3], giv: 4 }, 2: { cage: [2, 3], giv: 1 } },
    'k6': { 1: { cage: [2, 3], giv: 8 }, 2: { cage: [2, 4], giv: 3 }, 3: { cage: [2, 4], giv: 0 }, 4: { cage: [2, 5], giv: 0, att: 300 } },
    // סכומים 9×9 – רק בינונית ומאתגרת (רמת מומחים בלוח כזה מעבר למתאים לבית הספר היסודי, והיצירה איטית מדי)
    'k9': { 2: { cage: [2, 3], giv: 10 }, 3: { cage: [2, 4], giv: 4 } }
  };
  const supported = (type, level) => !!(CONF[type] && CONF[type][level]);

  function gradeOf(ctx, grid) {
    const r = logicSolve(ctx, grid, { maxTier: 5 });
    if (!r.solved) return { level: 0, solved: false, counts: r.counts, steps: r.steps.length };
    const strategies = Object.keys(r.counts).sort((a, b) => TIER(a) - TIER(b));
    const hard = r.steps.filter(s => s.tier >= 4).length;
    return { level: levelOf(ctx.n, r.top, !!ctx.cages), top: r.top, solved: true, counts: r.counts, strategies, steps: r.steps.length, hard };
  }

  /* ---------- יצירה ---------- */
  function digClassic(n, sol, rand, maxTier, minGivens, sym) {
    const ctx = ctxOf(n), N = n * n, p = sol.slice();
    const order = shuffle(Array.from({ length: N }, (_, i) => i).filter(i => !sym || i <= N - 1 - i), rand);
    let giv = N;
    for (const i of order) {
      const j = sym ? N - 1 - i : i, pair = i === j ? [i] : [i, j];
      if (giv - pair.length < minGivens) continue;
      pair.forEach(x => { p[x] = 0; });
      if (solvableUpTo(ctx, p, maxTier)) giv -= pair.length; else pair.forEach(x => { p[x] = sol[x]; });
    }
    return p;
  }

  // חלוקה לכלובים: מתחילים במשבצת פנויה ומגדלים לשכנות, בלי ספרה חוזרת בכלוב
  function makeCages(n, sol, rand, [lo, hi]) {
    const N = n * n, owner = new Array(N).fill(-1), cages = [];
    const nb = i => { const r = i / n | 0, c = i % n, a = []; if (r) a.push(i - n); if (r < n - 1) a.push(i + n); if (c) a.push(i - 1); if (c < n - 1) a.push(i + 1); return a; };
    const cells = shuffle(Array.from({ length: N }, (_, i) => i), rand);
    for (const s of cells) {
      if (owner[s] >= 0) continue;
      const k = cages.length, cg = [s]; owner[s] = k; let used = 1 << sol[s];
      const target = lo + Math.floor(rand() * (hi - lo + 1));
      while (cg.length < target) {
        const fr = shuffle([...new Set(cg.flatMap(nb))].filter(j => owner[j] < 0 && !(used >> sol[j] & 1)), rand);
        if (!fr.length) break;
        owner[fr[0]] = k; cg.push(fr[0]); used |= 1 << sol[fr[0]];
      }
      cages.push({ cells: cg.sort((a, b) => a - b), sum: cg.reduce((x, i) => x + sol[i], 0) });
    }
    // כלוב בודד (משבצת אחת) מתמזג לשכן אם אפשר – כדי שלא יהיו יותר מדי "מספרים נתונים בתחפושת"
    for (let k = 0; k < cages.length; k++) {
      const cg = cages[k]; if (cg.cells.length !== 1) continue;
      if (lo <= 1 && rand() < 0.5) continue; // ברמה קלה מותר להשאיר חלק מהכלובים הבודדים
      const i = cg.cells[0];
      const opts = shuffle(nb(i).map(j => owner[j]).filter(t => t !== k && cages[t].cells.length < hi + 1 && !cages[t].cells.some(x => sol[x] === sol[i])), rand);
      if (!opts.length) continue;
      const t = opts[0]; cages[t].cells.push(i); cages[t].cells.sort((a, b) => a - b); cages[t].sum += sol[i]; owner[i] = t; cg.cells = [];
    }
    return cages.filter(c => c.cells.length);
  }

  function genKiller(type, level, rand) {
    const T = TYPES[type], n = T.n, N = n * n, cf = CONF[type][level];
    for (let att = 0; att < (cf.att || 40); att++) {
      const sol = randomSolution(n, rand);
      const cages = makeCages(n, sol, rand, cf.cage);
      const ctx = ctxOf(n, cages);
      // נתונים: מתחילים מלוח ריק; אם אין פתרון יחיד/לוגי – מוסיפים נתון במקום שבו הפותר נתקע
      const p = new Array(N).fill(0);
      let ok = false;
      for (let add = 0; add <= N; add++) {
        const r = logicSolve(ctx, p, { maxTier: maxTierOf(n, level, true), record: false });
        if (r.solved) { ok = true; break; }
        const open = []; for (let i = 0; i < N; i++) if (!r.grid[i]) open.push(i);
        const i = open[Math.floor(rand() * open.length)]; p[i] = sol[i];
      }
      if (!ok) continue;
      // מדללים נתונים מיותרים
      for (const i of shuffle(Array.from({ length: N }, (_, i) => i).filter(i => p[i]), rand)) { p[i] = 0; if (!solvableUpTo(ctx, p, maxTierOf(n, level, true))) p[i] = sol[i]; }
      const giv = p.filter(x => x).length;
      if (giv > Math.max(cf.giv, 0) + (n === 9 ? 6 : n === 6 ? 3 : 1)) continue;
      // לוח קל מקבל עוד נתונים (עד הכמות שבהגדרה) כדי להיות מזמין
      if (giv < cf.giv) for (const i of shuffle(Array.from({ length: N }, (_, i) => i).filter(i => !p[i]), rand)) { if (p.filter(x => x).length >= cf.giv) break; p[i] = sol[i]; if (gradeOf(ctx, p).level !== level) p[i] = 0; }
      const gr = gradeOf(ctx, p);
      if (gr.level !== level) continue;
      return { p, sol, cages, gr };
    }
    return null;
  }

  /* יצירת חידה לפי סוג, רמה וזרע. מחזירה null אם לא נמצאה חידה שעומדת בכל הדרישות */
  function generate(type, level, seed) {
    if (!supported(type, level)) return null;
    const T = TYPES[type], n = T.n, rand = rng(type + '|' + level + '|' + seed);
    let res = null;
    if (T.killer) res = genKiller(type, level, rand);
    else {
      const cf = CONF[type][level];
      for (let att = 0; att < (cf.att || 80) && !res; att++) {
        const sol = randomSolution(n, rand);
        const p = digClassic(n, sol, rand, MAX_TIER[n][level], cf.min + (level <= 2 ? Math.floor(rand() * 3) : 0), cf.sym);
        const gr = gradeOf(ctxOf(n), p);
        if (gr.level === level) res = { p, sol, cages: null, gr };
      }
    }
    if (!res) return null;
    const ctx = ctxOf(n, res.cages);
    // אימות בלתי תלוי: פתרון יחיד, והפתרון שווה לפתרון שממנו נוצרה החידה
    const chk = countSolutions(ctx, res.p, 2);
    if (chk.count !== 1 || chk.sol.join('') !== res.sol.join('')) return null;
    return {
      id: makeId(type, level, seed), type, n, killer: T.killer, level, seed: String(seed),
      givens: res.p, solution: res.sol, cages: res.cages,
      grade: { level: res.gr.level, counts: res.gr.counts, strategies: res.gr.strategies, steps: res.gr.steps, hard: res.gr.hard },
      key: keyOf(res.p, res.cages)
    };
  }
  const keyOf = (p, cages) => p.join('') + (cages ? '|' + cages.map(c => c.cells.join('.') + ':' + c.sum).join(',') : '');

  /* מזהה קבוע: סוג-רמה-זרע. אותו מזהה → אותה חידה */
  function makeId(type, level, seed) { return type + '-' + level + '-' + seed; }
  function parseId(id) { const m = /^(k?[469])-([1-4])-([A-Za-z0-9_.]+)$/.exec(String(id || '').trim()); return m ? { type: m[1], level: +m[2], seed: m[3] } : null; }
  function fromId(id) { const p = parseId(id); return p ? generate(p.type, p.level, p.seed) : null; }
  const randSeed = () => Math.floor(Math.random() * 36 ** 5).toString(36);

  /* חידה ממזהה עם ניסיונות חוזרים (זרעים נגזרים) – אם זרע מסוים לא נתן חידה מתאימה */
  function generateSafe(type, level, seed, tries) {
    // זרעים 0–5 זהים לקודם; עוד ניסיונות רק אם לא נמצא לוח
    for (let t = 0; t < (tries || 12); t++) { const s = t ? seed + 'r' + t : seed; const p = generate(type, level, s); if (p) return p; }
    return null;
  }

  /* האתגר היומי: אותה חידה לכל רמה לאורך היום */
  const DAILY = { 1: '6', 2: '9', 3: '9', 4: '9', 0: '4' }; // 0 = מתחילים
  function dailyId(dateStr, lv) { const type = DAILY[lv], level = lv === 0 ? 2 : lv; return { type, level, seed: 'd' + dateStr.replace(/-/g, '') }; }

  return {
    rng, shuffle, seedInt, pc, digs, low, bit, geo, ctxOf, countSolutions, isUnique, randomSolution, combos, restrictSet,
    newState, apply, findStep, logicSolve, solvableUpTo, gradeOf, STRAT, ORDER, COACH_ORDER, TIER, levelOf, maxTierOf,
    LEVELS, LEVEL_NAME, TYPES, CONF, supported, generate, generateSafe, makeId, parseId, fromId, randSeed, keyOf, dailyId, DAILY, makeCages
  };
});
