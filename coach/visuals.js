/* =========================================================
   המחשות: ביטויים מתמטיים (שבר מאונך) וציורים ב-SVG
   פס שבר, עיגול, ריבוע, כוס מדידה, ישר מספרים
   ========================================================= */
(function () {
  const C = window.COACH = window.COACH || {};
  const INK = '#1f1e1c', FILL = '#e07aa5', FILL2 = '#f6d4e2';

  // ---------- הקראה של מתמטיקה ----------
  const ONE = { 2: 'חצי', 3: 'שליש', 4: 'רבע', 5: 'חמישית', 6: 'שישית', 7: 'שביעית', 8: 'שמינית', 9: 'תשיעית', 10: 'עשירית' };
  const MANY = { 2: 'חצאים', 3: 'שלישים', 4: 'רבעים', 5: 'חמישיות', 6: 'שישיות', 7: 'שביעיות', 8: 'שמיניות', 9: 'תשיעיות', 10: 'עשיריות' };
  function fracSay(n, d) {
    if (n === '?' && d === '?') return 'כמה חלקי כמה';
    if (n === '?') return `כמה חלקי ${d}`;
    if (d === '?') return `${n} חלקי כמה`;
    const N = +n, Dn = +d;
    if (N === 1 && ONE[Dn]) return ONE[Dn];
    if (MANY[Dn]) return `${n} ${MANY[Dn]}`;
    return `${n} חלקי ${d}`;
  }
  const OPS = { '=': 'שווה', '≠': 'לא שווה', '×': 'כפול', '+': 'ועוד', '−': 'פחות', '-': 'פחות', ':': 'חלקי' };

  // ---------- ביטוי מתמטי: "3/4 = ?/12" ----------
  // opts.input = true → כל "?" הופך לתיבת הקלדה
  function M(expr, opts = {}) {
    const toks = String(expr).trim().split(/\s+/);
    const say = [];
    const html = toks.map(t => {
      const m = t.match(/^(\d+|\?)\/(\d+|\?)$/);
      if (m) {
        say.push(fracSay(m[1], m[2]));
        const cell = v => v === '?' ? (opts.input ? `<input class="slot" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="המספר החסר">` : '<span class="qbox">?</span>') : v;
        return `<span class="fr"><span>${cell(m[1])}</span><span>${cell(m[2])}</span></span>`;
      }
      if (t === '?') { say.push('כמה'); return opts.input ? `<input class="slot" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="המספר החסר">` : '<span class="qbox">?</span>'; }
      say.push(OPS[t] || t);
      return `<span class="op">${t}</span>`;
    }).join('');
    return `<span class="mx" dir="ltr" data-say="${say.join(' ')}">${html}</span>`;
  }
  // טקסט עם ⟦…⟧ בתוכו
  const R = (s, opts) => String(s || '').replace(/⟦([^⟧]*)⟧/g, (_, e) => M(e, opts));

  // ---------- ציורים ----------
  function bar(f) {
    const w = f.w || 300, h = f.h || 46, n = f.n || 0;
    const widths = f.widths || Array.from({ length: f.d }, () => 1 / f.d);
    const g = f.g || 1;
    let x = 2, out = '';
    widths.forEach((p, i) => {
      const pw = p * w;
      out += `<rect data-i="${i}" x="${x}" y="2" width="${pw}" height="${h}" fill="${i < n ? FILL : '#fff'}" stroke="${INK}" stroke-width="1.2"/>`;
      x += pw;
    });
    if (g > 1) for (let i = 0; i <= widths.length; i += g) { const xx = 2 + i * (w / widths.length); out += `<line x1="${xx}" x2="${xx}" y1="2" y2="${h + 2}" stroke="${INK}" stroke-width="3"/>`; }
    out += `<rect x="2" y="2" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    return `<svg class="fig bar" viewBox="0 0 ${w + 4} ${h + 4}" width="${w + 4}" height="${h + 4}" role="img" aria-label="פס שבר">${out}</svg>`;
  }
  function pie(f) {
    const r = f.r || 40, d = f.d, n = f.n || 0, g = f.g || 1, c = r + 3;
    let out = '';
    for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      const p = (a) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
      out += `<path d="M${c} ${c} L${p(a0)} A${r} ${r} 0 ${d === 1 ? 1 : 0} 1 ${p(a1)} Z" fill="${i < n ? FILL : '#fff'}" stroke="${INK}" stroke-width="1.2"/>`;
    }
    if (g > 1) for (let i = 0; i < d; i += g) { const a = -Math.PI / 2 + i * 2 * Math.PI / d; out += `<line x1="${c}" y1="${c}" x2="${(c + r * Math.cos(a)).toFixed(2)}" y2="${(c + r * Math.sin(a)).toFixed(2)}" stroke="${INK}" stroke-width="3"/>`; }
    out += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    return `<svg class="fig pie" viewBox="0 0 ${2 * c} ${2 * c}" width="${2 * c}" height="${2 * c}" role="img" aria-label="עיגול מחולק">${out}</svg>`;
  }
  function grid(f) {
    const s = 44; let out = '';
    [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j], k) => { out += `<rect x="${2 + i * s}" y="${2 + j * s}" width="${s}" height="${s}" fill="${k < f.n ? FILL : '#fff'}" stroke="${INK}" stroke-width="1.2"/>`; });
    out += `<rect x="2" y="2" width="${2 * s}" height="${2 * s}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    return `<svg class="fig grid" viewBox="0 0 ${2 * s + 4} ${2 * s + 4}" width="${2 * s + 4}" height="${2 * s + 4}" role="img" aria-label="ריבוע מחולק">${out}</svg>`;
  }
  function cup(f) {
    const w = 90, h = 170, d = f.d, n = f.n; let out = '';
    const step = h / d;
    out += `<rect x="20" y="${10 + h - n * step}" width="${w}" height="${n * step}" fill="${FILL2}"/>`;
    for (let i = 1; i < d; i++) out += `<line x1="20" x2="40" y1="${10 + h - i * step}" y2="${10 + h - i * step}" stroke="${INK}" stroke-width="1.5"/>`;
    out += `<path d="M20 10 V${10 + h} H${20 + w} V10" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    out += `<line x1="14" x2="${26 + w}" y1="${10 + h - n * step}" y2="${10 + h - n * step}" stroke="${FILL}" stroke-width="3"/>`;
    return `<svg class="fig cup" viewBox="0 0 ${w + 40} ${h + 20}" width="${w + 40}" height="${h + 20}" role="img" aria-label="כוס מדידה">${out}</svg>`;
  }
  // ישר מספרים 0…1 (0 משמאל, 1 מימין – כמו בספרי המתמטיקה)
  function line(f) {
    const w = f.w || 340, x0 = 24, x1 = x0 + w, y = 40, d = f.d;
    let out = `<line x1="${x0 - 10}" x2="${x1 + 10}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="2.4"/>`;
    for (let k = 0; k <= d; k++) {
      const x = x0 + k * w / d, big = k === 0 || k === d;
      if (f.click) out += `<rect class="hit" data-k="${k}" x="${x - 14}" y="${y - 26}" width="28" height="52" fill="transparent"/>`;
      out += `<line x1="${x}" x2="${x}" y1="${y - (big ? 14 : 10)}" y2="${y + (big ? 14 : 10)}" stroke="${INK}" stroke-width="${big ? 2.4 : 1.6}" pointer-events="none"/>`;
      if (big) out += `<text x="${x}" y="${y + 34}" text-anchor="middle" font-size="18" fill="${INK}" pointer-events="none">${k === 0 ? 0 : 1}</text>`;
    }
    if (f.mark != null) { const x = x0 + f.mark * w / d; out += `<circle cx="${x}" cy="${y}" r="7" fill="${FILL}" stroke="${INK}" stroke-width="2"/>`; }
    if (f.sel != null) { const x = x0 + f.sel * w / d; out += `<circle class="sel" cx="${x}" cy="${y}" r="8" fill="${FILL}" stroke="${INK}" stroke-width="2" pointer-events="none"/>`; }
    return `<svg class="fig line" viewBox="0 0 ${w + 48} 84" width="${w + 48}" height="84" role="img" aria-label="ישר מספרים">${out}</svg>`;
  }
  const KINDS = { bar, pie, grid, cup, line };
  function fig(f) {
    if (!f) return '';
    if (Array.isArray(f)) return `<div class="figs">${f.map(fig).join('')}</div>`;
    const svg = (KINDS[f.k] || bar)(f);
    return f.label ? `<figure class="figl">${svg}<figcaption>${R(f.label)}</figcaption></figure>` : svg;
  }

  C.V = { M, R, fig, bar, pie, line, fracSay, FILL };
})();
