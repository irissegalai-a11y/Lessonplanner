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
  const OPS = { '=': 'שווה', '≠': 'לא שווה', '×': 'כפול', '+': 'ועוד', '−': 'פחות', '-': 'פחות', ':': 'חלקי', '>': 'גדול מ', '<': 'קטן מ', '%': 'אחוז' };

  // ---------- ביטוי מתמטי: "3/4 = ?/12" ----------
  // opts.input = true → כל "?" הופך לתיבת הקלדה
  // מספר מעורב: 2_1/2 · מכפלה במונה/במכנה: 4×8/5×8
  // גורם מחוק: ~8 (צמצום מונה-מכנה באותו שבר), ^4 (צמצום באלכסון); ~32>4 = מחוק, ומעליו 4
  const FAC = /^[~^]?(\d+|\?)(>\d+)?$/;
  const isPart = s => s.split('×').every(f => FAC.test(f));
  function M(expr, opts = {}) {
    const toks = String(expr).trim().split(/\s+/);
    const say = [];
    const slot = () => opts.input ? `<input class="slot" inputmode="decimal" autocomplete="off" maxlength="7" aria-label="המספר החסר">` : '<span class="qbox">?</span>';
    const part = s => s.split('×').map(f => {
      const m = f.match(/^([~^]?)(\d+|\?)(?:>(\d+))?$/);
      const v = m[2] === '?' ? slot() : m[2];
      if (!m[1]) return v;
      return `<span class="xo ${m[1] === '~' ? 'xa' : 'xb'}"><span class="xv">${v}</span>${m[3] ? `<span class="xn">${m[3]}</span>` : ''}</span>`;
    }).join('<span class="op">×</span>');
    const plain = s => s.replace(/[~^]/g, '').replace(/>\d+/g, '');
    const html = toks.map(t => {
      const m = t.match(/^(?:(\d+)_)?([^/]+)\/([^/]+)$/);
      if (m && isPart(m[2]) && isPart(m[3])) {
        const n = plain(m[2]), d = plain(m[3]);
        const simple = /^(\d+|\?)$/.test(n) && /^(\d+|\?)$/.test(d);
        say.push((m[1] ? m[1] + ' ו' : '') + (simple ? fracSay(n, d) : `${n.replace(/×/g, ' כפול ')} חלקי ${d.replace(/×/g, ' כפול ')}`));
        return `${m[1] ? `<span class="wh">${m[1]}</span>` : ''}<span class="fr"><span>${part(m[2])}</span><span>${part(m[3])}</span></span>`;
      }
      if (t === '?') { say.push('כמה'); return opts.input ? `<input class="slot" inputmode="decimal" autocomplete="off" maxlength="7" aria-label="המספר החסר">` : '<span class="qbox">?</span>'; }
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
      if (big) out += `<text x="${x}" y="${y + 34}" text-anchor="middle" font-size="18" fill="${INK}" pointer-events="none">${k === 0 ? (f.from != null ? f.from : 0) : (f.to != null ? f.to : 1)}</text>`;
    }
    if (f.mark != null) { const x = x0 + f.mark * w / d; out += `<circle cx="${x}" cy="${y}" r="7" fill="${FILL}" stroke="${INK}" stroke-width="2"/>`; }
    if (f.sel != null) { const x = x0 + f.sel * w / d; out += `<circle class="sel" cx="${x}" cy="${y}" r="8" fill="${FILL}" stroke="${INK}" stroke-width="2" pointer-events="none"/>`; }
    return `<svg class="fig line" viewBox="0 0 ${w + 48} 84" width="${w + 48}" height="84" role="img" aria-label="ישר מספרים">${out}</svg>`;
  }
  // ריבוע של 100 משבצות; הצביעה לפי עמודות (כל עמודה = עשירית)
  function hund(f) {
    const c = f.c || 17, n = f.n || 0; let out = '';
    for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
      const i = col * 10 + row;
      const on = f.rc ? (col < f.rc[0] && row < f.rc[1]) : i < n;
      out += `<rect x="${2 + col * c}" y="${2 + row * c}" width="${c}" height="${c}" fill="${on ? FILL : '#fff'}" stroke="#9aa3b5" stroke-width="0.8"/>`;
    }
    out += `<rect x="2" y="2" width="${10 * c}" height="${10 * c}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    return `<svg class="fig hund" viewBox="0 0 ${10 * c + 4} ${10 * c + 4}" width="${10 * c + 4}" height="${10 * c + 4}" role="img" aria-label="ריבוע של 100 משבצות">${out}</svg>`;
  }
  // לוח ערך המקום: { k:'pv', n:'3.45' }
  function pv(f) {
    const [a, b = ''] = String(f.n).split('.');
    const ints = a.split(''), decs = b.split('');
    const names = { i: ['אחדות', 'עשרות', 'מאות'], d: ['עשיריות', 'מאיות', 'אלפיות'] };
    const head = [...ints.map((_, i) => names.i[ints.length - 1 - i] || ''), '', ...decs.map((_, i) => names.d[i] || '')];
    const cells = [...ints, '.', ...decs];
    return `<table class="pvt" dir="ltr"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr><tr>${cells.map(c => `<td${c === '.' ? ' class="pt"' : ''}>${c}</td>`).join('')}</tr></table>`;
  }
  // תרגיל במאונך: { k:'vert', rows:['3.50','1.25'], op:'+', res:'4.75' } – הנקודות מיושרות
  function vert(f) {
    const w = Math.max(...f.rows.concat(f.res || '').map(r => r.length));
    const line = (r, op) => `<tr><td class="op">${op || ''}</td>${r.padStart(w, ' ').split('').map(ch => `<td${ch === '.' ? ' class="pt"' : ''}>${ch === ' ' ? '' : ch}</td>`).join('')}</tr>`;
    return `<table class="vert" dir="ltr">${f.rows.map((r, i) => line(r, i === f.rows.length - 1 ? f.op : '')).join('')}${f.res != null ? `<tr class="res"><td></td>${f.res.padStart(w, ' ').split('').map(ch => `<td${ch === '.' ? ' class="pt"' : ''}>${ch === ' ' ? '' : ch}</td>`).join('')}</tr>` : ''}</table>`;
  }
  // מערך: r שורות × c עמודות של עיגולים. split = קו אחרי שורה (פירוק), hl = כמה שורות ראשונות בצבע אחר
  function arr(f) {
    const r = f.r, c = f.c, g = f.g || (c > 8 || r > 8 ? 22 : 30), rad = g * 0.36, gap = f.split ? 14 : 0;
    const W = c * g + 8, H = r * g + 8 + gap; let out = '';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const y = 4 + i * g + g / 2 + (f.split && i >= f.split ? gap : 0);
      out += `<circle cx="${4 + j * g + g / 2}" cy="${y}" r="${rad}" fill="${f.hl && i < f.hl ? FILL2 : FILL}" stroke="${INK}" stroke-width="1"/>`;
    }
    if (f.split) out += `<line x1="0" x2="${W}" y1="${4 + f.split * g + gap / 2}" y2="${4 + f.split * g + gap / 2}" stroke="${INK}" stroke-width="2" stroke-dasharray="6 4"/>`;
    return `<svg class="fig arr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${r} שורות של ${c}">${out}</svg>`;
  }
  // קבוצות שוות: g קבוצות (עיגולים גדולים), בכל אחת n עיגולים קטנים
  function groups(f) {
    const g = f.g, n = f.n, per = Math.ceil(Math.sqrt(n)), cell = 16, box = per * cell + 18, W = g * (box + 10) + 6, H = box + 10;
    let out = '';
    for (let k = 0; k < g; k++) {
      const x0 = 6 + k * (box + 10), cx = x0 + box / 2, cy = 5 + box / 2;
      out += `<circle cx="${cx}" cy="${cy}" r="${box / 2}" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
      const rows = Math.ceil(n / per);
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - row * per);
        out += `<circle cx="${cx + (col - (inRow - 1) / 2) * cell}" cy="${cy + (row - (rows - 1) / 2) * cell}" r="5.5" fill="${FILL}" stroke="${INK}" stroke-width="0.8"/>`;
      }
    }
    return `<svg class="fig groups" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${g} קבוצות של ${n}">${out}</svg>`;
  }
  // מודל שטח לכפל שברים: { k:'area', a:[n1,d1], b:[n2,d2], only:'a' }
  // השלם = מלבן. a – עמודות (צבע ורוד בהיר), b – שורות (תכלת). החפיפה (ורוד מלא) = המכפלה.
  function area(f) {
    const W = f.w || 240, H = f.h || 150, [n1, d1] = f.a, [n2, d2] = f.b || [0, 1], cw = W / d1, rh = H / d2;
    let out = '';
    for (let i = 0; i < d1; i++) for (let j = 0; j < d2; j++) {
      const inA = i < n1, inB = f.only !== 'a' && j < n2;
      // inOnly – מסמנים את השורות רק בתוך החלק הצבוע (המוסכמה של כפל שבר בשבר: "חלק מתוך חלק")
      const col = inA && inB ? FILL : inA ? FILL2 : inB && !f.inOnly ? '#d6e4ff' : '#fff';
      out += `<rect x="${2 + i * cw}" y="${2 + j * rh}" width="${cw}" height="${rh}" fill="${col}" stroke="${INK}" stroke-width="1"/>`;
      if (f.inOnly && inA && inB) out += `<path d="M${2 + i * cw} ${2 + (j + 1) * rh} L${2 + (i + 1) * cw} ${2 + j * rh}" stroke="${INK}" stroke-width="1.2" opacity="0.55"/>`;
    }
    // קווי השורות עוברים לאורך כל השלם – כך רואים שכל המשבצות שוות
    if (f.only !== 'a') for (let j = 1; j < d2; j++) out += `<line x1="2" x2="${W + 2}" y1="${2 + j * rh}" y2="${2 + j * rh}" stroke="${INK}" stroke-width="1.6"/>`;
    out += `<rect x="2" y="2" width="${W}" height="${H}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    return `<svg class="fig area" viewBox="0 0 ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}" role="img" aria-label="מלבן מחולק">${out}</svg>`;
  }
  // פירוק לשני גורמים: { k:'tree', n:32, a:4, b:8, hl:'b' } – המספר למעלה, שני הגורמים למטה
  function tree(f) {
    const W = 170, H = 112, cx = W / 2;
    const t = (x, y, v, on) => `${on ? `<circle cx="${x}" cy="${y - 8}" r="20" fill="${FILL2}" stroke="${FILL}" stroke-width="2"/>` : ''}<text x="${x}" y="${y}" text-anchor="middle" font-size="24" font-weight="700" fill="${INK}">${v}</text>`;
    let out = `<line x1="${cx - 8}" y1="36" x2="${cx - 48}" y2="74" stroke="${INK}" stroke-width="2"/><line x1="${cx + 8}" y1="36" x2="${cx + 48}" y2="74" stroke="${INK}" stroke-width="2"/>`;
    out += t(cx, 26, f.n) + t(cx - 56, 100, f.a, f.hl === 'a') + t(cx + 56, 100, f.b, f.hl === 'b');
    out += `<text x="${cx}" y="100" text-anchor="middle" font-size="22" fill="${INK}">×</text>`;
    return `<svg class="fig tree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${f.n} שווה ${f.a} כפול ${f.b}">${out}</svg>`;
  }
  // קנקן מיץ: L ליטר, cut[p] = לכמה חלקים מחולק הליטר ה-p (מלמטה), fill(k) = צבע החלק (null = ריק)
  const JUICE = '#f5a524', JUICE2 = '#fbd38d';
  function jugSvg(o) {
    const L = o.L, cut = o.cut, lh = o.lh || (L <= 1 ? 150 : L === 2 ? 90 : 64), x0 = 50, bw = 92, top = 16, bot = top + L * lh;
    let out = '', k = 0;
    for (let p = 0; p < L; p++) {
      const D = cut[p] || 1, sh = lh / D;
      for (let s = 0; s < D; s++, k++) {
        const y = bot - p * lh - (s + 1) * sh, c = o.fill(k, p, s);
        out += `<rect class="${o.click ? 'ck' : ''}" ${D > 1 || o.parts ? `data-k="${k}"` : `data-p="${p}"`} x="${x0}" y="${y.toFixed(2)}" width="${bw}" height="${sh.toFixed(2)}" fill="${c || '#fff'}" stroke="${INK}" stroke-width="${D > 1 ? 1 : 0}" ${D > 1 ? 'stroke-dasharray="4 3"' : ''}/>`;
        if (o.num && o.num(k) != null) out += `<text x="${x0 + bw / 2}" y="${(y + sh / 2 + 5).toFixed(1)}" text-anchor="middle" font-size="${Math.min(15, sh + 2)}" font-weight="700" pointer-events="none">${o.num(k)}</text>`;
      }
      const yl = bot - (p + 1) * lh;
      out += `<line x1="${x0 - 10}" x2="${x0 + bw}" y1="${yl}" y2="${yl}" stroke="${INK}" stroke-width="2.4" pointer-events="none"/><text x="${x0 - 26}" y="${yl + 5}" text-anchor="middle" font-size="13" pointer-events="none">${p + 1} ליטר</text>`;
    }
    if (o.g) for (let q = o.g; q < k; q += o.g) { let kk = 0, y = bot; for (let p = 0; p < L; p++) { const D = cut[p] || 1; for (let s = 0; s < D; s++, kk++) if (kk === q) y = bot - p * lh - s * lh / D; } out += `<line x1="${x0}" x2="${x0 + bw}" y1="${y}" y2="${y}" stroke="${INK}" stroke-width="3" pointer-events="none"/>`; }
    out += `<path d="M${x0 - 12} ${top - 8} L${x0} ${top + 6} V${bot} H${x0 + bw} V${top - 8}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" pointer-events="none"/>`;
    out += `<path d="M${x0 + bw} ${top + 18} C${x0 + bw + 36} ${top + 18} ${x0 + bw + 36} ${bot - 22} ${x0 + bw} ${bot - 22}" fill="none" stroke="${INK}" stroke-width="5" pointer-events="none"/>`;
    const W = x0 + bw + 40, H = bot + 6;
    return `<svg class="fig jug${o.click ? ' cake' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="קנקן מיץ, ${L} ליטר">${out}</svg>`;
  }
  // כוס: parts = צבעי החלקים שבתוכה (מלמטה), cap = כמה חלקים נכנסים בכוס מלאה, sh = גובה חלק
  function cupSvg(o) {
    const w = 46, sh = o.sh, h = o.cap * sh, top = 8, bot = top + h, x0 = 8;
    let out = '';
    o.parts.forEach((c, i) => { out += `<rect x="${x0}" y="${(bot - (i + 1) * sh).toFixed(2)}" width="${w}" height="${sh.toFixed(2)}" fill="${c}" stroke="${INK}" stroke-width="1" stroke-dasharray="4 3"/>`; });
    out += `<path d="M${x0 - 3} ${top - 4} L${x0} ${bot} H${x0 + w} L${x0 + w + 3} ${top - 4}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    if (o.label != null) out += `<text x="${x0 + w / 2}" y="${bot + 18}" text-anchor="middle" font-size="13" font-weight="700">${o.label}</text>`;
    return `<svg class="fig cupg" viewBox="0 0 ${w + 16} ${bot + 24}" width="${w + 16}" height="${bot + 24}" role="img" aria-label="כוס">${out}</svg>`;
  }
  // ציור סטטי: קנקן עם L ליטר, כל ליטר מחולק ל-d, n חלקים מלאים; g = קו עבה כל g חלקים (כוסות)
  function jug(f) {
    const tones = [JUICE, JUICE2];
    return jugSvg({ L: f.L, cut: Array(f.L).fill(f.d), parts: true, fill: k => k < f.n ? (f.g ? tones[Math.floor(k / f.g) % 2] : JUICE) : null, g: f.g, lh: f.lh });
  }
  const KINDS = { bar, pie, grid, cup, line, hund, pv, vert, arr, groups, area, tree, jug };
  function fig(f) {
    if (!f) return '';
    if (Array.isArray(f)) return `<div class="figs">${f.map(fig).join('')}</div>`;
    const svg = (KINDS[f.k] || bar)(f);
    // whole – כיתוב מעל הציור ("שלם", "עוגה שלמה"): השלם תמיד מוגדר
    if (f.whole) return `<figure class="figl figw"><figcaption class="wlab">${R(f.whole)}</figcaption>${svg}${f.label ? `<figcaption>${R(f.label)}</figcaption>` : ''}</figure>`;
    return f.label ? `<figure class="figl">${svg}<figcaption>${R(f.label)}</figcaption></figure>` : svg;
  }

  C.V = { M, R, fig, bar, pie, line, area, fracSay, FILL, FILL2, INK, jugSvg, cupSvg, JUICE, JUICE2 };
})();
