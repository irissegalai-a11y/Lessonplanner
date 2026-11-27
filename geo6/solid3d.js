/* גופים במרחב – מנוע ציור תלת-ממדי (SVG, בלי ספריות).
   מודל = { V: קדקודים [x,y,z], F: פאות (רשימות אינדקסים, נגד כיוון השעון מבחוץ), K: סוג לכל פאה }
   סוגי פאות: 'b' בסיס · 'l' פאה צדדית · 'c' מעטפת עגולה (בלי קווים בין החלקים) · 'p1'/'p2'/'p3' זוגות פאות בתיבה
   מבט: yaw (סיבוב סביב הציר האנכי), pitch (הטיה – מסתכלים מלמעלה). ההטלה אורתוגרפית. */
(function () {
  'use strict';
  const S3 = {};
  const INK = '#23264a';
  // צבעים בעלי משמעות – אותם צבעים בכל הפרק
  const COL = {
    b: '#f6d77a',   // שני הבסיסים – צהוב-זהב
    l: '#c6d4f5',   // פאות צדדיות – כחול בהיר
    c: '#c6d4f5',
    p1: '#bfe0c9',  // תיבה: למעלה/למטה – ירוק
    p2: '#c6d4f5',  // תיבה: מלפנים/מאחור – כחול
    p3: '#f6c4b8',  // תיבה: ימין/שמאל – ורוד
    t: '#f6c4b8',   // משולשים בפירמידה
    n: '#eef1f8',   // ניטרלי
    w: '#8cc4ef',   // מים
    E: '#e0703a',   // מקצועות מודגשים – כתום
    V: '#d9482b',   // קדקודים – אדום
    H: '#7b4bc4'    // גובה הגוף – סגול
  };
  S3.COL = COL; S3.INK = INK;

  /* ---------- וקטורים ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cen = P => mul(P.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / P.length);
  // סיבוב נקודה p סביב ציר שעובר ב-o בכיוון u בזווית a (רודריגס)
  function rotAxis(p, o, u, a) {
    const v = sub(p, o), c = Math.cos(a), s = Math.sin(a);
    const r = add(add(mul(v, c), mul(cross(u, v), s)), mul(u, dot(u, v) * (1 - c)));
    return add(r, o);
  }
  S3.v = { sub, add, mul, dot, cross, unit, cen, rotAxis };

  /* ---------- בניית גופים ---------- */
  // מנסרה ישרה: בסיס במישור xy (נגד כיוון השעון), גובה h לאורך z
  function prism(base, h, o = {}) {
    const n = base.length, V = [...base.map(p => [p[0], p[1], 0]), ...base.map(p => [p[0], p[1], h])];
    const F = [[...Array(n).keys()].reverse(), [...Array(n).keys()].map(i => i + n)], K = ['b', 'b'];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; F.push([i, j, j + n, i + n]); K.push(o.curved ? 'c' : 'l'); }
    return center({ V, F, K, kind: o.curved ? 'cyl' : 'prism', n, h });
  }
  // מצולע משוכלל עם צלע באורך side, צלע תחתונה אופקית
  function regBase(n, side = 1) {
    const r = side / (2 * Math.sin(Math.PI / n));
    return [...Array(n)].map((_, i) => { const t = -Math.PI / 2 - Math.PI / n + i * 2 * Math.PI / n - (n === 3 ? Math.PI / 9 : 0); /* משולש – מסובב מעט כדי ששתי פאות צדדיות ייראו במבט הרגיל */ return [r * Math.cos(t), r * Math.sin(t)]; });
  }
  function pyramid(base, h) {
    const n = base.length, c = base.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
    const V = [...base.map(p => [p[0], p[1], 0]), [c[0], c[1], h]], F = [[...Array(n).keys()].reverse()], K = ['b'];
    for (let i = 0; i < n; i++) { F.push([i, (i + 1) % n, n]); K.push('t'); }
    return center({ V, F, K, kind: 'pyramid', n, h });
  }
  function cone(r, h, seg = 36) {
    const base = [...Array(seg)].map((_, i) => [r * Math.cos(i * 2 * Math.PI / seg), r * Math.sin(i * 2 * Math.PI / seg)]);
    const m = pyramid(base, h); m.K = m.K.map((k, i) => i ? 'c' : 'b'); m.kind = 'cone'; return m;
  }
  // תיבה a (אורך, x) × b (רוחב, y) × c (גובה, z) – זוגות הפאות הנגדיות בצבעים תואמים
  function box(a, b, c) {
    const m = prism([[0, 0], [a, 0], [a, b], [0, b]], c);
    m.K = ['p1', 'p1', 'p2', 'p3', 'p2', 'p3']; m.kind = 'box'; m.dims = [a, b, c];
    return m;
  }
  // ממקם את הגוף כך שמרכזו בראשית (לסיבוב נוח)
  function center(m) {
    const xs = m.V.map(p => p[0]), ys = m.V.map(p => p[1]), zs = m.V.map(p => p[2]);
    const c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
    m.V = m.V.map(p => sub(p, c)); return m;
  }
  // השכבה על הצד: מסובבים את הגוף 90° סביב ציר x (הבסיסים עומדים, הציר אופקי)
  function lay(m, ang = Math.PI / 2) {
    const c = Math.cos(ang), s = Math.sin(ang);
    return Object.assign({}, m, { V: m.V.map(([x, y, z]) => [x, y * c - z * s, y * s + z * c]), lying: true });
  }
  // הטיה (מנסרה לא ישרה – להערת דיוק בלבד)
  function shear(m, k) { return Object.assign({}, m, { V: m.V.map(([x, y, z]) => [x + k * z, y, z]), oblique: true }); }
  const scaleM = (m, k) => Object.assign({}, m, { V: m.V.map(p => mul(p, k)) });
  S3.prism = prism; S3.regBase = regBase; S3.pyramid = pyramid; S3.cone = cone; S3.box = box; S3.lay = lay; S3.shear = shear; S3.scale = scaleM;
  S3.regPrism = (n, side = 1, h = 1.4) => prism(regBase(n, side), h);
  S3.cylinder = (r, h, seg = 36) => prism([...Array(seg)].map((_, i) => [r * Math.cos(i * 2 * Math.PI / seg), r * Math.sin(i * 2 * Math.PI / seg)]), h, { curved: true });
  // גדם פירמידה (שני בסיסים מקבילים שאינם זהים) – "מלכודת" במיון: לא מנסרה
  S3.frustum = (n, side, k, h) => { const b = regBase(n, side), V = [...b.map(p => [p[0], p[1], 0]), ...b.map(p => [p[0] * k, p[1] * k, h])], F = [[...Array(n).keys()].reverse(), [...Array(n).keys()].map(i => i + n)], K = ['b', 'b']; for (let i = 0; i < n; i++) { const j = (i + 1) % n; F.push([i, j, j + n, i + n]); K.push('t'); } return center({ V, F, K, kind: 'frustum', n, h }); };
  S3.cube = a => { const m = box(a, a, a); m.kind = 'cube'; return m; };
  S3.triPrism = (a, b, h) => { const m = prism([[0, 0], [a, 0], [0, b]], h); m.kind = 'prism'; m.legs = [a, b]; return m; };
  S3.sphere = r => ({ V: [], F: [], K: [], kind: 'sphere', r });

  // מקצועות (זוגות קדקודים) והפאות שליד כל מקצוע
  function edgesOf(m) {
    if (m._E) return m._E;
    const map = new Map();
    m.F.forEach((f, fi) => f.forEach((a, i) => { const b = f[(i + 1) % f.length], k = a < b ? a + ',' + b : b + ',' + a; if (!map.has(k)) map.set(k, { a: Math.min(a, b), b: Math.max(a, b), f: [] }); map.get(k).f.push(fi); }));
    m._E = [...map.values()];
    return m._E;
  }
  // ספירה "אמיתית" (בלי קווי עזר של מעטפת עגולה)
  S3.count = m => {
    const E = edgesOf(m).filter(e => !e.f.every(f => m.K[f] === 'c'));
    const vs = new Set(); E.forEach(e => { vs.add(e.a); vs.add(e.b); });
    return { F: m.F.filter((_, i) => m.K[i] !== 'c').length + (m.K.includes('c') ? 1 : 0), E: E.length, V: m.kind === 'cyl' ? 0 : m.kind === 'cone' ? 1 : vs.size };
  };

  /* ---------- הטלה ---------- */
  const DEG = Math.PI / 180;
  function projector(view) {
    const cy = Math.cos(view.yaw * DEG), sy = Math.sin(view.yaw * DEG), cp = Math.cos(view.pitch * DEG), sp = Math.sin(view.pitch * DEG);
    // מחזיר [x על המסך, y על המסך (למטה חיובי), עומק (גדול = רחוק)]
    const rot = ([x, y, z]) => { const x1 = x * cy - y * sy, y1 = x * sy + y * cy; return [x1, y1 * cp - z * sp, y1 * sp + z * cp]; };
    return p => { const r = rot(p); return [r[0], -r[2], r[1]]; };
  }
  S3.projector = projector;
  const f1 = x => (Math.round(x * 10) / 10).toString();
  const ptsStr = P => P.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
  // הבהרת צבע לפי התאורה (פאה שפונה אלינו – בהירה יותר)
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = Math.max(0, Math.min(1, k));
    const m = (c, w) => Math.round(c * (1 - w) + 255 * w);
    const d = (c, w) => Math.round(c * (1 - w));
    const [R, G, B] = t >= 0.5 ? [m(r, (t - 0.5) * 0.7), m(g, (t - 0.5) * 0.7), m(b, (t - 0.5) * 0.7)] : [d(r, (0.5 - t) * 0.35), d(g, (0.5 - t) * 0.35), d(b, (0.5 - t) * 0.35)];
    return '#' + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
  }
  S3.shade = shade;

  /* ---------- ציור גוף ----------
     o: { yaw, pitch, W, H, pad, fill(fi)→צבע, plain (בלי הצללה), hidden: 'dash'|'none'|'show', see (שקוף),
          hlF: [פאות], hlE: [מקצועות כ-'a,b'], hlV: [קדקודים], marks: {F:Set, E:Set, V:Set}, pick: 'F'|'E'|'V' (שכבת לחיצה),
          labels: [{a, b, t, side}] – תווית מידה על מקצוע, hgt: [a, b] – קו גובה, extra: svg נוסף, cls, fit (מסגרת קבועה) } */
  function render(m, o = {}) {
    const view = { yaw: o.yaw ?? -32, pitch: o.pitch ?? 22 }, pr = projector(view);
    if (m.kind === 'sphere') return sphereSVG(m, o);
    const P = m.V.map(pr), W = o.W || 260, H = o.H || 210, pad = o.pad ?? 18;
    const fitPts = o.fit ? o.fit.map(pr) : P;
    const xs = fitPts.map(p => p[0]), ys = fitPts.map(p => p[1]);
    const mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / ((Mx - mx) || 1), (H - 2 * pad) / ((My - my) || 1));
    const ox = W / 2 - (mx + Mx) / 2 * s, oy = H / 2 - (my + My) / 2 * s;
    const S = p => [p[0] * s + ox, p[1] * s + oy];
    const Q = P.map(S);
    // נורמל בעולם המוטל: z של הנורמל במערכת המסך (שלילי = פונה אלינו כי y למטה... מחשבים לפי שטח מסומן)
    const area2 = f => { let a = 0; for (let i = 0; i < f.length; i++) { const p = Q[f[i]], q = Q[f[(i + 1) % f.length]]; a += p[0] * q[1] - q[0] * p[1]; } return a; };
    const front = m.F.map(f => area2(f) < -1e-6); // y על המסך למטה – פאה שפונה אלינו מסודרת עם כיוון השעון
    const depth = m.F.map(f => f.reduce((t, i) => t + P[i][2], 0) / f.length);
    // תאורה: נורמל במודל אחרי ההטלה
    const light = m.F.map((f, fi) => {
      const a = pr(m.V[f[0]]), b = pr(m.V[f[1]]), c = pr(m.V[f[2]]);
      const nrm = unit(cross(sub(b, a), sub(c, a)));
      return 0.55 + 0.45 * Math.max(-1, Math.min(1, -nrm[1] * 0.5 - nrm[2] * 0.85));
    });
    const see = !!o.see, hid = o.hidden || 'dash';
    const fillOf = fi => (o.fill && o.fill(fi)) || COL[m.K[fi]] || COL.n;
    const order = m.F.map((_, i) => i).sort((a, b) => depth[b] - depth[a]);
    let g = '';
    const hlF = new Set(o.hlF || []), mk = o.marks || {};
    for (const fi of order) {
      if (!front[fi] && !see) continue;
      const base = fillOf(fi), col = o.plain ? base : shade(base, light[fi]);
      const on = hlF.has(fi) || (mk.F && mk.F.has(fi));
      const op = see ? (front[fi] ? 0.55 : 0.35) : 1;
      g += `<polygon points="${ptsStr(m.F[fi].map(i => Q[i]))}" fill="${col}" fill-opacity="${op}" stroke="none"${on ? ' class="s3-on"' : ''}/>`;
      if (on) g += `<polygon points="${ptsStr(m.F[fi].map(i => Q[i]))}" fill="none" stroke="${COL.E}" stroke-width="4" stroke-linejoin="round" stroke-dasharray="${front[fi] ? '' : '6 4'}"/>`;
    }
    // מקצועות
    const E = edgesOf(m), hlE = new Set(o.hlE || []), mE = mk.E || new Set();
    let eg = '';
    for (const e of E) {
      const curved = e.f.every(f => m.K[f] === 'c'), vis = e.f.some(f => front[f]);
      if (curved && !(e.f.length === 2 && front[e.f[0]] !== front[e.f[1]])) continue; // במעטפת עגולה – רק קו המתאר
      const k = e.a + ',' + e.b, on = hlE.has(k) || mE.has(k);
      if (!vis && hid === 'none' && !on) continue;
      const a = Q[e.a], b = Q[e.b];
      const ec = o.edgeCol ? o.edgeCol(k, e) : null;
      eg += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${on ? COL.E : ec || INK}" stroke-width="${on ? 4.2 : ec ? 4 : 2.2}" stroke-linecap="round"${vis ? '' : ' stroke-dasharray="5 4"'}${!vis && !on ? ' stroke-opacity=".75"' : ''}/>`;
    }
    g += eg;
    // קו גובה
    if (o.hgt) { const [a, b] = o.hgt.map(p => S(pr(p))); g += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${COL.H}" stroke-width="3" stroke-dasharray="7 4"/>`; }
    // קדקודים
    const vset = new Set(), mV = mk.V || new Set(), hlV = new Set(o.hlV || []);
    E.forEach(e => { if (!e.f.every(f => m.K[f] === 'c')) { vset.add(e.a); vset.add(e.b); } });
    const vVis = i => m.F.some((f, fi) => front[fi] && f.includes(i));
    for (const i of vset) {
      if (!(hlV.has(i) || mV.has(i) || o.showV)) continue;
      const p = Q[i], v = vVis(i);
      g += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="6.5" fill="${v ? COL.V : '#fff'}" stroke="${COL.V}" stroke-width="2.4"/>`;
    }
    // תוויות מידה
    const C2 = (() => { const c = Q.reduce((t, p) => [t[0] + p[0], t[1] + p[1]], [0, 0]); return [c[0] / Q.length, c[1] / Q.length]; })();
    for (const L of o.labels || []) {
      const a = S(pr(L.a)), b = S(pr(L.b)), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let d = [mid[0] - C2[0], mid[1] - C2[1]]; const dl = Math.hypot(d[0], d[1]) || 1; d = [d[0] / dl, d[1] / dl];
      const off = L.off ?? 16, x = mid[0] + d[0] * off, y = mid[1] + d[1] * off + 5;
      g += `<text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-size="${L.fs || 15}" font-weight="800" fill="${L.c || INK}" paint-order="stroke" stroke="#fff" stroke-width="4">${L.t}</text>`;
    }
    if (o.extra) g += o.extra(S, pr);
    // שכבת לחיצה (ספירה / בחירה)
    if (o.pick === 'F') g += order.map(fi => front[fi] || see ? `<polygon data-pick="F" data-i="${fi}" points="${ptsStr(m.F[fi].map(i => Q[i]))}" fill="transparent" class="s3-hit"/>` : '').join('');
    if (o.pick === 'E') g += E.filter(e => !e.f.every(f => m.K[f] === 'c')).map(e => { const a = Q[e.a], b = Q[e.b]; return `<line data-pick="E" data-i="${e.a},${e.b}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="transparent" stroke-width="16" class="s3-hit"/>`; }).join('');
    if (o.pick === 'V') g += [...vset].map(i => `<circle data-pick="V" data-i="${i}" cx="${f1(Q[i][0])}" cy="${f1(Q[i][1])}" r="14" fill="transparent" class="s3-hit"/>`).join('');
    return `<svg class="s3 ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="${o.alt || 'ציור של גוף'}">${g}</svg>`;
  }
  function sphereSVG(m, o) {
    const W = o.W || 200, H = o.H || 180, r = Math.min(W, H) / 2 - 14, cx = W / 2, cy = H / 2;
    return `<svg class="s3 ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="כדור"><defs><radialGradient id="sg" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b9c6ea"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sg)" stroke="${INK}" stroke-width="2.2"/><path d="M${cx - r} ${cy} A${r} ${r * 0.3} 0 0 0 ${cx + r} ${cy}" fill="none" stroke="${INK}" stroke-width="1.8"/><path d="M${cx - r} ${cy} A${r} ${r * 0.3} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="5 4"/></svg>`;
  }
  S3.render = render;
  S3.edgesOf = edgesOf;

  /* ---------- מציג אינטראקטיבי: גרירה לסיבוב, כפתורי מבט, סימון וספירה ----------
     host – אלמנט. o: אפשרויות render + { tools: ['rot','views','lay','see','count'], onPick(kind, i, marks) } */
  S3.viewer = function (host, model, o = {}) {
    const st = { yaw: o.yaw ?? -32, pitch: o.pitch ?? 22, see: !!o.see, pick: o.pick || null, marks: { F: new Set(), E: new Set(), V: new Set() }, m: model, lying: false };
    const tools = o.tools || ['rot', 'views'];
    host.classList.add('s3v');
    host.innerHTML = `<div class="s3-stage" tabindex="0" aria-label="גוף – גררו כדי לסובב"></div><div class="s3-tools"></div><div class="s3-count" aria-live="polite"></div>`;
    const stage = host.querySelector('.s3-stage'), bar = host.querySelector('.s3-tools'), cnt = host.querySelector('.s3-count');
    // מסגרת קבועה בכל זווית: נקודות הקצה של כדור שחוסם את הגוף
    const fitFor = m => { const R = Math.max(...m.V.map(p => Math.hypot(...p))) || 1; const out = []; for (let i = 0; i < 3; i++) for (const s of [1, -1]) { const p = [0, 0, 0]; p[i] = R * s; out.push(p); } for (const a of [0.7, 0.7]) out.push([R * a, R * a, 0], [-R * a, -R * a, 0], [R * a, 0, R * a], [-R * a, 0, -R * a], [0, R * a, R * a], [0, -R * a, -R * a], [R * a, -R * a, 0], [-R * a, R * a, 0]); return out; };
    let fit = fitFor(model);
    const draw = () => {
      const opts = Object.assign({}, o, { yaw: st.yaw, pitch: st.pitch, see: st.see || !!st.pick && st.pick !== 'F', pick: st.pick, marks: st.marks, fit, W: o.W || 300, H: o.H || 250, showV: o.showV });
      stage.innerHTML = render(st.m, opts);
      if (st.pick) {
        const n = st.marks[st.pick].size, nm = { F: 'פאות', E: 'מקצועות', V: 'קדקודים' }[st.pick];
        cnt.innerHTML = `סימנתם <b>${n}</b> ${nm}${o.countHint ? ` · <span class="muted">${o.countHint}</span>` : ''}`;
      } else cnt.innerHTML = '';
      bar.querySelectorAll('[data-see]').forEach(b => b.setAttribute('aria-pressed', st.see));
    };
    const anim = (to, ms = 450) => {
      const from = { yaw: st.yaw, pitch: st.pitch }, t0 = performance.now();
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const step = now => {
        const t = reduce ? 1 : Math.min(1, (now - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        st.yaw = from.yaw + (to.yaw - from.yaw) * e; st.pitch = from.pitch + (to.pitch - from.pitch) * e; draw();
        if (t < 1 && host.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const B = (attr, label, title) => `<button type="button" class="s3b" ${attr} title="${title || label}">${label}</button>`;
    let h = '';
    if (tools.includes('rot')) h += B('data-r="-30"', '↻', 'סיבוב') + B('data-r="30"', '↺', 'סיבוב לצד השני');
    if (tools.includes('views')) h += B('data-v="front"', 'מלפנים') + B('data-v="top"', 'מלמעלה') + B('data-v="side"', 'מהצד') + B('data-v="iso"', 'אלכסון');
    if (tools.includes('lay')) h += B('data-lay', '🔄 להשכיב / להעמיד', 'מניחים את הגוף על פאה אחרת');
    if (tools.includes('see')) h += B('data-see aria-pressed="false"', '👓 שקוף', 'רואים גם את מה שמאחור');
    if (tools.includes('count')) h += B('data-pk="V"', '● קדקודים') + B('data-pk="E"', '╱ מקצועות') + B('data-pk="F"', '▱ פאות') + B('data-clr', '⌫ ניקוי');
    bar.innerHTML = h;
    bar.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.r) anim({ yaw: st.yaw + +b.dataset.r, pitch: st.pitch });
      if (b.dataset.v) anim({ front: { yaw: 0, pitch: 0 }, top: { yaw: 0, pitch: 89 }, side: { yaw: 90, pitch: 0 }, iso: { yaw: -32, pitch: 22 } }[b.dataset.v]);
      if (b.hasAttribute('data-lay')) { st.lying = !st.lying; st.m = st.lying ? lay(model) : model; fit = fitFor(st.m); draw(); }
      if (b.hasAttribute('data-see')) { st.see = !st.see; draw(); }
      if (b.dataset.pk) { st.pick = st.pick === b.dataset.pk ? null : b.dataset.pk; bar.querySelectorAll('[data-pk]').forEach(x => x.setAttribute('aria-pressed', x.dataset.pk === st.pick)); draw(); }
      if (b.hasAttribute('data-clr')) { st.marks = { F: new Set(), E: new Set(), V: new Set() }; draw(); }
    };
    // גרירה לסיבוב
    let drag = null, moved = 0;
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch }; moved = 0; });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      if (moved < 6) return;
      st.yaw = drag.yaw - dx * 0.6; st.pitch = Math.max(-80, Math.min(89, drag.pitch + dy * 0.5)); draw();
    });
    window.addEventListener('pointerup', () => { drag = null; });
    stage.style.touchAction = 'none';
    stage.addEventListener('keydown', e => {
      const k = { ArrowLeft: [15, 0], ArrowRight: [-15, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
      if (k) { e.preventDefault(); st.yaw += k[0]; st.pitch = Math.max(-80, Math.min(89, st.pitch + k[1])); draw(); }
    });
    stage.addEventListener('click', e => {
      if (moved >= 6) return;
      const t = e.target.closest('[data-pick]'); if (!t) return;
      const kind = t.dataset.pick, i = kind === 'E' ? t.dataset.i : +t.dataset.i, set = st.marks[kind];
      set.has(i) ? set.delete(i) : set.add(i);
      draw();
      if (o.onPick) o.onPick(kind, i, st.marks, st);
    });
    draw();
    return {
      st, draw, set(m2) { model = m2; st.m = st.lying ? lay(m2) : m2; fit = fitFor(st.m); st.marks = { F: new Set(), E: new Set(), V: new Set() }; draw(); },
      view(v) { anim(v); }, setPick(p) { st.pick = p; draw(); }, opts: o
    };
  };

  /* ---------- פריסות: פותחים וסוגרים ----------
     net = { P: מצולעים שטוחים [[x,y],...], K, par (אבא לכל פאה, -1 לשורש), hinge: [{a, b, ang}] (המקצוע המשותף עם האבא וזווית הקיפול) }
     בפריסה תקינה הקיפול סוגר את הגוף; בפריסה שגויה – רואים פאות נופלות זו על זו. */
  // פריסה מגוף + עץ (par[i] = הפאה שאליה מחוברת פאה i; השורש = -1). מחשבים זוויות קיפול מהגוף עצמו
  function unfold(m, par) {
    const nF = m.F.length, nrm = f => { const a = m.V[m.F[f][0]], b = m.V[m.F[f][1]], c = m.V[m.F[f][2]]; return unit(cross(sub(b, a), sub(c, a))); };
    const r = par.indexOf(-1);
    // מעבירים את פאת השורש למישור z=0 (פונה למטה = מונחת על השולחן)
    const n0 = nrm(r), down = [0, 0, -1];
    let ax = cross(n0, down); const ang = Math.acos(Math.max(-1, Math.min(1, dot(n0, down))));
    const c0 = cen(m.F[r].map(i => m.V[i]));
    ax = Math.hypot(...ax) < 1e-9 ? [1, 0, 0] : unit(ax);
    const z0 = rotAxis(m.V[m.F[r][0]], c0, ax, ang)[2];
    // M[f] – מעבירה נקודה מהגוף למקומה בפריסה (לנקודות של פאה f)
    const M = Array(nF), flat = Array(nF), hinge = Array(nF), done = new Set([r]);
    M[r] = q => { const z = rotAxis(q, c0, ax, ang); return [z[0], z[1], z[2] - z0]; };
    flat[r] = m.F[r].map(i => { const z = M[r](m.V[i]); return [z[0], z[1]]; });
    for (let guard = 0; done.size < nF && guard < 60; guard++) for (let c = 0; c < nF; c++) {
      const p = par[c]; if (done.has(c) || p < 0 || !done.has(p)) continue;
      const sh = m.F[c].filter(i => m.F[p].includes(i));
      const th = Math.acos(Math.max(-1, Math.min(1, dot(nrm(p), nrm(c)))));
      const A3 = M[p](m.V[sh[0]]), B3 = M[p](m.V[sh[1]]), u = unit(sub(B3, A3));
      const cc = M[p](cen(m.F[c].map(i => m.V[i]))), pc = cen(flat[p].map(x => [x[0], x[1], 0]));
      let best = th;
      for (const sg of [1, -1]) { const q = rotAxis(cc, A3, u, sg * th); if (Math.abs(q[2]) < 1e-5 && cross(u, sub(q, A3))[2] * cross(u, sub(pc, A3))[2] < 0) best = sg * th; }
      M[c] = (Mp => q => rotAxis(Mp(q), A3, u, best))(M[p]);
      flat[c] = m.F[c].map(i => { const z = M[c](m.V[i]); return [z[0], z[1]]; });
      hinge[c] = { a: [A3[0], A3[1]], b: [B3[0], B3[1]], ang: th };
      done.add(c);
    }
    return { P: flat, K: m.K.slice(), par: par.slice(), hinge, n: m.n, kind: m.kind };
  }
  // קיפול: t=0 שטוח, t=1 מקופל. כל פאה מסתובבת סביב הציר שלה בתוך המערכת של האבא, כלפי מעלה (z חיובי)
  function fold(net, t) {
    const nF = net.P.length, X = Array(nF), done = new Set();
    const r = net.par.indexOf(-1); X[r] = q => q; done.add(r);
    for (let guard = 0; done.size < nF && guard < 60; guard++) for (let c = 0; c < nF; c++) {
      const p = net.par[c]; if (done.has(c) || p < 0 || !done.has(p)) continue;
      const hg = net.hinge[c], A = [hg.a[0], hg.a[1], 0], u = unit(sub([hg.b[0], hg.b[1], 0], A));
      const cc = cen(net.P[c].map(q => [q[0], q[1], 0]));
      const sg = rotAxis(cc, A, u, 0.2)[2] > 0 ? 1 : -1, a = sg * hg.ang * t;
      X[c] = (Xp => q => Xp(rotAxis(q, A, u, a)))(X[p]);
      done.add(c);
    }
    return net.P.map((poly, i) => poly.map(q => X[i]([q[0], q[1], 0])));
  }
  S3.unfold = unfold; S3.fold = fold;
  // עץ פריסה למנסרה: פאות 0,1 בסיסים, 2..n+1 מלבנים. רצועה; בסיס 0 תלוי על מלבן i, בסיס 1 על מלבן j
  S3.prismTree = (n, i = 0, j = 0) => { const p = Array(n + 2).fill(0); p[2] = -1; for (let k = 3; k < n + 2; k++) p[k] = k - 1; p[0] = 2 + i; p[1] = 2 + j; return p; };
  // תיבה: פאות [0 למטה, 1 למעלה, 2 קדמית(y=0), 3 ימין(x=a), 4 אחורית, 5 שמאל]. צלב: למטה במרכז
  S3.boxCross = () => [-1, 4, 0, 0, 0, 0];
  S3.boxStrip = () => [2, 2, -1, 2, 3, 4];

  // פריסה של קובייה ממשבצות (כולל פריסות שגויות). cells = [[שורה, עמודה], ...]
  S3.gridNet = function (cells, s = 1) {
    const at = new Map(cells.map(([r, c], i) => [r + ',' + c, i])), par = Array(cells.length).fill(null), hinge = [], q = [0];
    par[0] = -1;
    while (q.length) {
      const i = q.shift(), [r, c] = cells[i];
      for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const j = at.get((r + dr) + ',' + (c + dc)); if (j === undefined || par[j] !== null) continue;
        par[j] = i; q.push(j);
        // המקצוע המשותף
        const x0 = c * s, y0 = r * s;
        const a = dc === 1 ? [x0 + s, y0] : dc === -1 ? [x0, y0] : dr === 1 ? [x0, y0 + s] : [x0, y0];
        const b = dc === 1 ? [x0 + s, y0 + s] : dc === -1 ? [x0, y0 + s] : dr === 1 ? [x0 + s, y0 + s] : [x0 + s, y0];
        hinge[j] = { a, b, ang: Math.PI / 2 };
      }
    }
    const P = cells.map(([r, c]) => [[c * s, r * s], [c * s + s, r * s], [c * s + s, r * s + s], [c * s, r * s + s]]);
    return { P, K: cells.map(() => 'n'), par, hinge, kind: 'cube' };
  };
  // פאות שנופלות על אותו מקום אחרי הקיפול (פריסה שגויה)
  S3.overlaps = function (net) {
    const F = fold(net, 1), C = F.map(f => cen(f)), bad = new Set();
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) if (Math.hypot(...sub(C[i], C[j])) < 1e-3) { bad.add(i); bad.add(j); }
    return bad;
  };
  // ציור פריסה במצב t (שטוח/מקופל) במבט נתון
  S3.netSVG = function (net, t, o = {}) {
    const F = fold(net, t), view = { yaw: o.yaw ?? -25, pitch: o.pitch ?? (t === 0 && o.flat !== false ? 90 : 48) };
    if (t === 0 && o.flat !== false && !o.view3) return flatSVG(net, o);
    const pr = projector(view), W = o.W || 300, H = o.H || 240, pad = o.pad ?? 14;
    const bb = o.bb || F.flat();
    const PB = bb.map(pr), xs = PB.map(p => p[0]), ys = PB.map(p => p[1]);
    const mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / ((Mx - mx) || 1), (H - 2 * pad) / ((My - my) || 1)), ox = W / 2 - (mx + Mx) / 2 * s, oy = H / 2 - (my + My) / 2 * s;
    const Q = F.map(f => f.map(p => { const q = pr(p); return [q[0] * s + ox, q[1] * s + oy, q[2]]; }));
    const bad = o.bad || new Set();
    const order = Q.map((f, i) => i).sort((a, b) => Q[b].reduce((t2, p) => t2 + p[2], 0) / Q[b].length - Q[a].reduce((t2, p) => t2 + p[2], 0) / Q[a].length);
    const g = order.map(i => `<polygon points="${ptsStr(Q[i])}" fill="${bad.has(i) && t > 0.97 ? '#f3a29a' : (o.fill && o.fill(i)) || COL[net.K[i]] || COL.n}" fill-opacity="${o.op ?? 0.9}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`).join('');
    return `<svg class="s3 s3net ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="${o.alt || 'פריסה'}">${g}</svg>`;
  };
  // תיבת גבולות קבועה לאנימציה (כל שלבי הקיפול)
  S3.netBB = net => { const out = []; for (const t of [0, 0.25, 0.5, 0.75, 1]) fold(net, t).forEach(f => f.forEach(p => out.push(p))); return out; };
  // פריסה שטוחה במבט מלמעלה, עם תוויות
  function flatSVG(net, o = {}) {
    const all = net.P.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const mx = Math.min(...xs), my = Math.min(...ys), w = Math.max(...xs) - mx || 1, h = Math.max(...ys) - my || 1, pad = o.pad ?? 10;
    const s = Math.min(((o.W || 280) - 2 * pad) / w, ((o.H || 220) - 2 * pad) / h, o.maxS || 1e9);
    const X = p => [(p[0] - mx) * s + pad, (p[1] - my) * s + pad];
    let g = net.P.map((poly, i) => `<polygon points="${ptsStr(poly.map(X))}" fill="${(o.fill && o.fill(i)) || COL[net.K[i]] || COL.n}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"${o.pick ? ` data-pick="N" data-i="${i}" class="s3-hit2"` : ''}/>`).join('');
    g += (o.txt || []).map((t, i) => { if (t == null || t === '') return ''; const c = X(cen(net.P[i].map(q => [q[0], q[1], 0]))); return `<text x="${f1(c[0])}" y="${f1(c[1] + 6)}" text-anchor="middle" font-size="${o.fs || 16}" font-weight="800" fill="${INK}" pointer-events="none">${t}</text>`; }).join('');
    g += (o.edgeLbl || []).map(L => { const a = X(L.a), b = X(L.b), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = L.d || [0, 0]; return `<text x="${f1(mid[0] + d[0] * 14)}" y="${f1(mid[1] + d[1] * 14 + 5)}" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="4">${L.t}</text>`; }).join('');
    const W = Math.round(w * s + 2 * pad), H = Math.round(h * s + 2 * pad);
    return `<svg class="s3 s3net ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="${o.alt || 'פריסה'}">${g}</svg>`;
  }
  S3.flatSVG = flatSVG;

  // נגן פריסה: מחוון פרוש↔מקופל, כפתור "קפלו", סיבוב בגרירה
  S3.netPlayer = function (host, net, o = {}) {
    const st = { t: o.t ?? 0, yaw: o.yaw ?? -25, pitch: o.pitch ?? 50 };
    const bb = S3.netBB(net), bad = o.checkBad === false ? new Set() : S3.overlaps(net);
    host.classList.add('s3v');
    host.innerHTML = `<div class="s3-stage"></div><label class="s3-range"><span>פרוש</span><input type="range" dir="rtl" min="0" max="100" value="${st.t * 100}" aria-label="קיפול הפריסה"><span>מקופל</span></label>
      <div class="s3-tools"><button type="button" class="s3b" data-go="1">▶ קפלו</button><button type="button" class="s3b" data-go="0">◀ פתחו</button></div><div class="s3-msg" aria-live="polite"></div>`;
    const stage = host.querySelector('.s3-stage'), rng = host.querySelector('input'), msg = host.querySelector('.s3-msg');
    const draw = () => {
      stage.innerHTML = S3.netSVG(net, st.t, Object.assign({}, o, { yaw: st.yaw, pitch: st.pitch, bb, bad, view3: true, W: o.W || 320, H: o.H || 250 }));
      if (o.onT) msg.innerHTML = o.onT(st.t, bad) || '';
    };
    let timer = null;
    const go = to => {
      cancelAnimationFrame(timer); const from = st.t, t0 = performance.now(), ms = 1600;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const step = now => { const k = reduce ? 1 : Math.min(1, (now - t0) / ms); st.t = from + (to - from) * k; rng.value = Math.round(st.t * 100); draw(); if (k < 1 && host.isConnected) timer = requestAnimationFrame(step); };
      timer = requestAnimationFrame(step);
    };
    rng.oninput = () => { st.t = +rng.value / 100; draw(); };
    host.querySelector('.s3-tools').onclick = e => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go); };
    let drag = null;
    stage.style.touchAction = 'none';
    stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch }; });
    window.addEventListener('pointermove', e => { if (!drag) return; st.yaw = drag.yaw - (e.clientX - drag.x) * 0.6; st.pitch = Math.max(5, Math.min(89, drag.pitch + (e.clientY - drag.y) * 0.5)); draw(); });
    window.addEventListener('pointerup', () => { drag = null; });
    draw();
    return { st, draw, go, bad };
  };

  /* ---------- קוביות יחידה ---------- */
  // cubes: רשימת [x,y,z] (מספרים שלמים). צובעים לפי שכבה (z) אם layerCol
  S3.cubesSVG = function (cubes, o = {}) {
    const view = { yaw: o.yaw ?? -35, pitch: o.pitch ?? 28 }, pr = projector(view);
    const key = (x, y, z) => x + ',' + y + ',' + z, has = new Set(cubes.map(c => key(...c)));
    const faces = [];
    const NB = [[[0, 0, -1], [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]], [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]], [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]], [[0, 1, 0], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]], [[-1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]], [[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]]];
    cubes.forEach(([x, y, z], ci) => NB.forEach(([d, q]) => {
      if (has.has(key(x + d[0], y + d[1], z + d[2]))) return;
      const P3 = q.map(p => [p[0] + x, p[1] + y, p[2] + z]), P = P3.map(pr);
      let a = 0; for (let i = 0; i < 4; i++) { const p = P[i], r = P[(i + 1) % 4]; a += p[0] * r[1] - r[0] * p[1]; }
      if (a >= 0) return; // y על המסך למטה – פאה גלויה בכיוון השעון
      faces.push({ P, d: P.reduce((t, p) => t + p[2], 0) / 4, z, dir: d, ci });
    }));
    const bbP = (o.bb || cubes.flatMap(([x, y, z]) => [[x, y, z], [x + 1, y + 1, z + 1], [x + 1, y, z], [x, y + 1, z + 1], [x, y + 1, z], [x + 1, y, z + 1], [x, y, z + 1], [x + 1, y + 1, z]])).map(pr);
    const xs = bbP.map(p => p[0]), ys = bbP.map(p => p[1]), W = o.W || 260, H = o.H || 220, pad = 10;
    const mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / ((Mx - mx) || 1), (H - 2 * pad) / ((My - my) || 1), o.maxS || 60), ox = W / 2 - (mx + Mx) / 2 * s, oy = H / 2 - (my + My) / 2 * s;
    faces.sort((a, b) => b.d - a.d);
    const LC = ['#f6e2a6', '#c6d4f5', '#bfe0c9', '#f6c4b8', '#e2c8ef', '#bfe6ea', '#f6d77a', '#d9e3c4'];
    const g = faces.map(f => {
      const base = o.col ? o.col(f) : o.layerCol ? LC[f.z % LC.length] : '#f6e2a6';
      const k = f.dir[2] === 1 ? 0.95 : f.dir[1] === -1 ? 0.62 : 0.4;
      return `<polygon points="${ptsStr(f.P.map(p => [p[0] * s + ox, p[1] * s + oy]))}" fill="${shade(base, k)}" stroke="${INK}" stroke-width="${o.sw || 1.3}" stroke-linejoin="round"/>`;
    }).join('');
    return `<svg class="s3 s3cubes ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="${o.alt || 'מבנה מקוביות'}">${g}${o.extra ? o.extra(p => { const q = pr(p); return [q[0] * s + ox, q[1] * s + oy]; }) : ''}</svg>`;
  };
  S3.boxCubes = (a, b, c) => { const out = []; for (let z = 0; z < c; z++) for (let y = 0; y < b; y++) for (let x = 0; x < a; x++) out.push([x, y, z]); return out; };

  // מכל (תיבה פתוחה) עם מים בגובה w. a×b בסיס, c גובה
  S3.tankSVG = function (a, b, c, w, o = {}) {
    const pr = projector({ yaw: o.yaw ?? -30, pitch: o.pitch ?? 24 }), W = o.W || 280, H = o.H || 230, pad = 26;
    const corners = []; for (const x of [0, a]) for (const y of [0, b]) for (const z of [0, c]) corners.push([x, y, z]);
    const P = corners.map(pr), xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys);
    const s = Math.min((W - 2 * pad) / (Mx - mx), (H - 2 * pad) / (My - my)), ox = W / 2 - (mx + Mx) / 2 * s, oy = H / 2 - (my + My) / 2 * s;
    const S = p => { const q = pr(p); return [q[0] * s + ox, q[1] * s + oy]; };
    const poly = (pts, fill, op, st = '') => `<polygon points="${ptsStr(pts.map(S))}" fill="${fill}" fill-opacity="${op}" stroke="${INK}" stroke-width="${st ? 1.2 : 2}" ${st} stroke-linejoin="round"/>`;
    let g = '';
    // דפנות אחוריות
    g += poly([[0, b, 0], [a, b, 0], [a, b, c], [0, b, c]], '#eef4fb', 0.9) + poly([[0, 0, 0], [0, b, 0], [0, b, c], [0, 0, c]], '#e5eef9', 0.9) + poly([[0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0]], '#dfe9f6', 0.9);
    if (w > 0) {
      g += poly([[0, 0, w], [a, 0, w], [a, b, w], [0, b, w]], COL.w, 0.75, 'stroke-dasharray="0"');
      g += poly([[0, 0, 0], [a, 0, 0], [a, 0, w], [0, 0, w]], '#6fb0e6', 0.55, 'stroke-dasharray="0"') + poly([[a, 0, 0], [a, b, 0], [a, b, w], [a, 0, w]], '#5aa0d8', 0.55, 'stroke-dasharray="0"');
    }
    // דפנות קדמיות שקופות
    g += poly([[0, 0, 0], [a, 0, 0], [a, 0, c], [0, 0, c]], '#ffffff', 0.12) + poly([[a, 0, 0], [a, b, 0], [a, b, c], [a, 0, c]], '#ffffff', 0.12);
    const T = (p, t, dx = 0, dy = 0, c2 = INK) => { const q = S(p); return `<text x="${f1(q[0] + dx)}" y="${f1(q[1] + dy)}" text-anchor="middle" font-size="14" font-weight="800" fill="${c2}" paint-order="stroke" stroke="#fff" stroke-width="4">${t}</text>`; };
    if (o.lbl !== false) {
      g += T([a / 2, 0, 0], o.la ?? a, 0, 20) + T([a, b / 2, 0], o.lb ?? b, 18, 14) + T([0, 0, c / 2], o.lc ?? c, -20, 4);
      if (w > 0 && o.lw !== false) g += T([a, 0, w], o.lw ?? ('מים: ' + w), 34, -4, '#1f5f99');
    }
    return `<svg class="s3 ${o.cls || ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" dir="ltr" role="img" aria-label="${o.alt || 'מכל עם מים'}">${g}</svg>`;
  };

  window.S3 = S3;
})();
