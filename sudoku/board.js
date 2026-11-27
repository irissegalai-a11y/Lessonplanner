/* ציור לוחות סודוקו – משותף למשחק ולהדפסה. עמודה 0 מוצגת מימין (RTL), שורה 0 למעלה.
   קווי כלובים (סודוקו סכומים) – מקווקווים, בתוך המשבצות; הסכום בפינה הימנית-העליונה של הכלוב. */
(function (root) {
  'use strict';
  const E = root.SDK;

  // משבצת שבה כותבים את סכום הכלוב: השורה העליונה, ובה המשבצת הימנית ביותר (עמודה 0 מימין)
  const anchor = (n, cells) => cells.reduce((a, i) => ((i / n | 0) < (a / n | 0) || ((i / n | 0) === (a / n | 0) && i % n < a % n)) ? i : a, cells[0]);

  /* קטעי קו של כלובים, ביחידות משבצת, בקואורדינטות תצוגה (x מימין לשמאל כבר הפוך) */
  function cageSegs(n, cages, d) {
    d = d == null ? 0.09 : d;
    const own = new Array(n * n).fill(-1); cages.forEach((c, k) => c.cells.forEach(i => { own[i] = k; }));
    const at = (r, c) => (r < 0 || c < 0 || r >= n || c >= n) ? -2 : own[r * n + c];
    const segs = [];
    for (let i = 0; i < n * n; i++) {
      const r = i / n | 0, c = i % n, k = own[i];
      const same = (rr, cc) => at(rr, cc) === k;
      // צד עליון/תחתון (קו אופקי), שמאל/ימין במודל (c-1 / c+1)
      [[-1, 0], [1, 0]].forEach(([dr]) => {
        if (same(r + dr, c)) return;
        const y = dr < 0 ? r + d : r + 1 - d;
        const ext = dc => same(r, c + dc) ? (same(r + dr, c + dc) ? d : 0) : -d; // הארכה לכיוון השכן
        const x0 = c - ext(-1), x1 = c + 1 + ext(1);
        segs.push([x0, y, x1, y]);
      });
      [[0, -1], [0, 1]].forEach(([, dc]) => {
        if (same(r, c + dc)) return;
        const x = dc < 0 ? c + d : c + 1 - d;
        const ext = dr => same(r + dr, c) ? (same(r + dr, c + dc) ? d : 0) : -d;
        const y0 = r - ext(-1), y1 = r + 1 + ext(1);
        segs.push([x, y0, x, y1]);
      });
    }
    return segs.map(([x0, y0, x1, y1]) => [n - x0, y0, n - x1, y1]); // היפוך לתצוגה מימין לשמאל
  }

  /* שכבת SVG של כלובים (למשחק – מעל רשת DOM). viewBox ביחידות משבצת */
  function cageLayer(n, cages, opt) {
    opt = opt || {};
    const segs = cageSegs(n, cages, opt.inset);
    const sw = opt.sw || 0.035, fs = opt.fs || 0.27;
    let s = `<svg class="${opt.cls || 'cages'}" viewBox="0 0 ${n} ${n}" aria-hidden="true" preserveAspectRatio="none">`;
    s += `<g stroke="${opt.color || '#5b5f7a'}" stroke-width="${sw}" stroke-dasharray="${opt.dash || '0.09 0.06'}" fill="none" stroke-linecap="butt">`;
    segs.forEach(([a, b, c, d]) => { s += `<line x1="${a.toFixed(3)}" y1="${b.toFixed(3)}" x2="${c.toFixed(3)}" y2="${d.toFixed(3)}"/>`; });
    s += '</g>';
    cages.forEach(cg => {
      const i = anchor(n, cg.cells), r = i / n | 0, c = i % n, xr = n - c - 0.06, y = r + 0.06;
      const w = (String(cg.sum).length * 0.55 + 0.25) * fs;
      s += `<rect x="${(xr - w).toFixed(3)}" y="${(y - 0.02).toFixed(3)}" width="${w.toFixed(3)}" height="${(fs * 1.05).toFixed(3)}" fill="${opt.bg || '#fff'}"/>`;
      s += `<text x="${(xr - w / 2).toFixed(3)}" y="${(y + fs * 0.85).toFixed(3)}" font-size="${fs}" text-anchor="middle" font-weight="700" fill="${opt.ink || '#2d3250'}" font-family="Assistant, Arial, sans-serif">${cg.sum}</text>`;
    });
    return s + '</svg>';
  }

  /* לוח סטטי להדפסה: SVG שלם. values = מה לכתוב, givens = מה מודגש. size במ"מ */
  function boardSVG(puz, opt) {
    opt = opt || {};
    const n = puz.n, g = E.geo(n), vals = opt.values || puz.givens, giv = puz.givens;
    const size = opt.size || 100, line = opt.line || '#9aa0b8', thick = opt.thick || '#1d2433', ink = opt.ink || '#111';
    const fill = opt.fill || '#fff', boxFill = opt.boxFill; // פסטל: צבע לאזורים לסירוגין
    let s = `<svg class="sbd" width="${size}mm" height="${size}mm" viewBox="-0.04 -0.04 ${n + 0.08} ${n + 0.08}" xmlns="http://www.w3.org/2000/svg">`;
    s += `<rect x="0" y="0" width="${n}" height="${n}" fill="${fill}"/>`;
    if (boxFill) for (let b = 0; b < n; b++) {
      const br = Math.floor(b / (n / g.bc)), bcI = b % (n / g.bc);
      if ((br + bcI) % 2) s += `<rect x="${n - (bcI + 1) * g.bc}" y="${br * g.br}" width="${g.bc}" height="${g.br}" fill="${boxFill}"/>`;
    }
    if (opt.mark) opt.mark.forEach((i, k) => { s += `<rect x="${n - i % n - 1}" y="${i / n | 0}" width="1" height="1" fill="${(opt.markFills && opt.markFills[k]) || opt.markFill || '#ffe9a8'}"/>`; });
    for (let k = 1; k < n; k++) {
      const vt = k % g.bc === 0, ht = k % g.br === 0;
      if (!vt) s += `<line x1="${k}" y1="0" x2="${k}" y2="${n}" stroke="${line}" stroke-width="0.025"/>`;
      if (!ht) s += `<line x1="0" y1="${k}" x2="${n}" y2="${k}" stroke="${line}" stroke-width="0.025"/>`;
    }
    if (puz.cages) s += cageLayer(n, puz.cages, { fs: n === 9 ? 0.26 : 0.24, bg: fill, sw: 0.03, color: '#555', ink: '#222' }).replace(/^<svg[^>]*>|<\/svg>$/g, '');
    for (let k = 1; k < n; k++) {
      if (k % g.bc === 0) s += `<line x1="${k}" y1="0" x2="${k}" y2="${n}" stroke="${thick}" stroke-width="0.07"/>`;
      if (k % g.br === 0) s += `<line x1="0" y1="${k}" x2="${n}" y2="${k}" stroke="${thick}" stroke-width="0.07"/>`;
    }
    s += `<rect x="0" y="0" width="${n}" height="${n}" fill="none" stroke="${thick}" stroke-width="0.09"/>`;
    const fsz = puz.cages ? 0.5 : 0.6;
    for (let i = 0; i < n * n; i++) {
      if (!vals[i]) continue;
      const x = n - i % n - 0.5, y = (i / n | 0) + 0.5 + fsz * 0.36, isG = !!giv[i];
      s += `<text x="${x}" y="${y.toFixed(3)}" font-size="${fsz}" text-anchor="middle" font-family="Assistant, Arial, sans-serif" font-weight="${isG ? 700 : 400}" fill="${isG ? ink : (opt.solInk || '#5a5a5a')}">${vals[i]}</text>`;
    }
    return s + '</svg>';
  }

  root.SBD = { anchor, cageSegs, cageLayer, boardSVG };
})(typeof self !== 'undefined' ? self : this);
