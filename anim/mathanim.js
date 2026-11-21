/* =========================================================
   MathAnim – מנגן המחשות מתמטיות בשלבים (עצמאי: בלי תלות במאמן או באתר)
   נטען גם מ-coach.html וגם (בעתיד) מ-math6-v2.html.
   שימוש:  MathAnim.mount(el, 'tri', { n: 25 })   ·   MathAnim.open('ofqty', { p: 25, N: 80 })
   הגדרת המחשה: MathAnim.defs[id] = params => ({ title, steps: [step…], free? })
     step = { say: 'הסבר (HTML, מותר <b>, ופונקציות F/P/D)', stage: () => '<svg…>' ,
              pred?: { q, opts: [..], ans, right, wrong }, dur?: ms, audio?: 'url' }
   שליטה: הפעלה / עצירה, הבא, הקודם, מההתחלה; מקשים: רווח, חצים (← הבא, → הקודם), Home.
   "בלי תנועה": כפתור במנגן או prefers-reduced-motion – כל שלב מוצג מיד, בלי אנימציה.
   שמע: אם לשלב יש audio – מתנגן בכניסה לשלב (רשות; ההמחשה מובנת גם בלעדיו).
   ========================================================= */
(function () {
  const MA = window.MathAnim = window.MathAnim || {};
  MA.defs = MA.defs || {};
  const INK = '#1f1e1c', PINK = '#e07aa5', PINK2 = '#f6d4e2', ORANGE = '#f2a65a', GRID = '#9aa3b5', BLUE = '#6f8fd8';

  /* ---------- כתיבה מתמטית (LTR בתוך טקסט עברי) ---------- */
  const F = (n, d) => `<span class="ma-fr"><span>${n}</span><span>${d}</span></span>`;
  const P = n => `<span class="ma-m">${n}%</span>`;
  const M = s => `<span class="ma-m">${s}</span>`;
  const dec = n => { const v = Math.round(n * 100) / 10000; return String(+v.toFixed(4)); }; // n מאיות → עשרוני
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  MA.util = { F, P, M, dec, gcd };

  /* ---------- סגנון (מוזרק פעם אחת) ---------- */
  if (!document.getElementById('ma-css')) {
    const st = document.createElement('style'); st.id = 'ma-css';
    st.textContent = `
.ma { direction: rtl; border: 2px solid ${INK}; border-radius: 14px; padding: 12px; background: #fffdf8; margin: 10px 0; }
.ma h4 { margin: 0 0 6px; font-size: 1.1rem; }
.ma-stage { min-height: 120px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.ma-stage svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
.ma-say { font-size: 1.12rem; line-height: 1.7; min-height: 3.2em; margin: 8px 0; }
.ma-ctl { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; }
.ma-ctl button { color: ${INK}; font-family: inherit; box-shadow: none; min-width: 44px; min-height: 40px; font-size: 1rem; border: 2px solid ${INK}; border-radius: 10px; background: #fff; cursor: pointer; padding: 4px 10px; }
.ma-ctl button:focus-visible, .ma-pred button:focus-visible { outline: 3px solid ${BLUE}; outline-offset: 2px; }
.ma-ctl button[disabled] { opacity: .35; cursor: default; }
.ma-ctl .ma-play { background: #fbe3ec; font-weight: 700; }
.ma-free button, .ma-close { color: ${INK}; font-family: inherit; box-shadow: none; }
.ma-dots { display: flex; gap: 4px; justify-content: center; margin: 6px 0; }
.ma-dots i { width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid ${INK}; display: inline-block; }
.ma-dots i.on { background: ${PINK}; }
.ma-pred { background: #fff6d6; border: 2px dashed ${INK}; border-radius: 12px; padding: 8px 10px; margin: 6px 0; }
.ma-pred .opts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.ma-pred button { color: ${INK}; font-family: inherit; box-shadow: none; border: 2px solid ${INK}; border-radius: 10px; background: #fff; padding: 6px 12px; font-size: 1.05rem; cursor: pointer; }
.ma-pred button.sel { background: ${PINK2}; }
.ma-pred .ma-pfb { margin-top: 6px; }
.ma-fr { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.1; margin: 0 2px; direction: ltr; }
.ma-fr span:first-child { border-bottom: 2px solid currentColor; padding: 0 3px; }
.ma-m { direction: ltr; unicode-bidi: isolate; display: inline-block; white-space: nowrap; }
.ma-big { font-size: 1.35rem; display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; direction: ltr; margin: 6px 0; }
.ma-big .ma-box { border: 2px solid ${INK}; border-radius: 10px; padding: 4px 10px; background: #fff; text-align: center; min-width: 70px; }
.ma-big .ma-box small { display: block; font-size: .75rem; color: #555; direction: rtl; }
.ma-free { display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap; margin: 6px 0; }
.ma-free input[type=range] { width: 220px; max-width: 70vw; }
.ma-free select { font-size: 1rem; padding: 3px 6px; border: 2px solid ${INK}; border-radius: 8px; }
.ma .new { animation: maPop .45s ease-out both; }
@keyframes maPop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
.ma svg .new { transform-box: fill-box; transform-origin: center; }
.ma.still .new, .ma.still * { animation: none !important; transition: none !important; }
@media (prefers-reduced-motion: reduce) { .ma .new { animation: none; } }
`;
    document.head.appendChild(st);
  }

  /* ---------- ציורים משותפים ---------- */
  // ריבוע 100: on(i) → צבע או null; פריסה לפי עמודות (i = עמודה*10 + שורה); newFrom – משבצות שנכנסות עכשיו (אנימציה, מדורגת)
  MA.grid = function (o) {
    const c = o.c || 26, W = 10 * c + 4; let out = '';
    for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
      const i = col * 10 + row, color = o.on(i);
      const isNew = color && o.newFrom != null && i >= o.newFrom && i < o.newTo;
      const delay = isNew ? Math.min(1.6, (i - o.newFrom) * (1.6 / Math.max(1, o.newTo - o.newFrom))) : 0;
      out += `<rect ${o.click ? `class="ma-cell" data-i="${i}" ` : ''}x="${2 + col * c}" y="${2 + row * c}" width="${c}" height="${c}" fill="#fff" stroke="${GRID}" stroke-width="0.8"/>`;
      if (color) out += `<rect class="${isNew ? 'new' : ''}" style="${isNew ? `animation-delay:${delay.toFixed(2)}s` : ''}" x="${2 + col * c + 0.5}" y="${2 + row * c + 0.5}" width="${c - 1}" height="${c - 1}" fill="${color}" pointer-events="none"/>`;
    }
    if (o.cut) for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
      const p = MA.part(col, row, o.cut), x = 2 + col * c, y = 2 + row * c;
      if (col < 9 && MA.part(col + 1, row, o.cut) !== p) out += `<line x1="${x + c}" x2="${x + c}" y1="${y}" y2="${y + c}" stroke="${INK}" stroke-width="2.6" pointer-events="none"/>`;
      if (row < 9 && MA.part(col, row + 1, o.cut) !== p) out += `<line x1="${x}" x2="${x + c}" y1="${y + c}" y2="${y + c}" stroke="${INK}" stroke-width="2.6" pointer-events="none"/>`;
    }
    out += `<rect x="2" y="2" width="${10 * c}" height="${10 * c}" fill="none" stroke="${INK}" stroke-width="2.6" pointer-events="none"/>`;
    return `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" role="img" aria-label="ריבוע של 100 משבצות">${out}</svg>`;
  };
  MA.part = (col, row, cut) => ({ 2: col < 5 ? 0 : 1, 4: (row < 5 ? 0 : 2) + (col < 5 ? 0 : 1), 5: Math.floor(col / 2), 10: col, 20: col * 2 + (row < 5 ? 0 : 1), 25: Math.floor(col / 2) * 5 + Math.floor(row / 2) })[cut];

  /* ---------- המנגן ---------- */
  MA.mount = function (el, id, params, opt) {
    opt = opt || {};
    const def = MA.defs[id];
    if (!def) { el.innerHTML = ''; return null; }
    let A = def(params || {}), k = 0, playing = false, timer = null, audio = null, waiting = false;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let still = reduce || (function () { try { return localStorage.getItem('ma-still') === '1'; } catch (e) { return false; } })();
    el.innerHTML = `<div class="ma${still ? ' still' : ''}" tabindex="0" aria-label="המחשה: ${A.title.replace(/<[^>]+>/g, '')}">
      <h4>🎬 ${A.title}</h4>
      <div class="ma-stage" aria-hidden="false"></div>
      <div class="ma-say" aria-live="polite"></div>
      <div class="ma-predbox"></div>
      <div class="ma-dots"></div>
      <div class="ma-ctl">
        <button class="ma-restart" title="מההתחלה" aria-label="מההתחלה">⏮</button>
        <button class="ma-prev" title="שלב קודם" aria-label="שלב קודם">→ הקודם</button>
        <button class="ma-play" aria-label="הפעלה">▶ הפעלה</button>
        <button class="ma-next" title="שלב הבא" aria-label="שלב הבא">הבא ←</button>
        <button class="ma-still" aria-pressed="${still}">${still ? '🎞️ עם תנועה' : '⏸︎ בלי תנועה'}</button>
      </div></div>`;
    const root = el.querySelector('.ma'), $ = s => root.querySelector(s);
    const N = () => A.steps.length;
    function stopAudio() { if (audio) { try { audio.pause(); } catch (e) { /* */ } audio = null; } }
    function show(j, fromPlay) {
      k = Math.max(0, Math.min(N() - 1, j));
      const s = A.steps[k];
      clearTimeout(timer); stopAudio();
      $('.ma-stage').innerHTML = s.stage ? s.stage() : '';
      $('.ma-say').innerHTML = s.say || '';
      $('.ma-dots').innerHTML = A.steps.map((_, i) => `<i class="${i <= k ? 'on' : ''}"></i>`).join('');
      $('.ma-prev').disabled = k === 0;
      $('.ma-next').disabled = k === N() - 1;
      $('.ma-predbox').innerHTML = '';
      waiting = false;
      if (s.pred && !s.pred.done) {
        // עוצרים לניבוי: השלב הבא נפתח רק אחרי תשובה (כל תשובה מתקבלת – זו שאלת חשיבה)
        waiting = true;
        // סדר האפשרויות מסתובב לפי השאלה – כדי שהתשובה הנכונה לא תהיה תמיד ראשונה
        const L = s.pred.opts.length, rot = [...s.pred.q].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 0) % L, order = s.pred.opts.map((_, i) => (i + rot) % L);
        $('.ma-predbox').innerHTML = `<div class="ma-pred"><b>🤔 ${s.pred.q}</b><div class="opts">${order.map(i => `<button data-p="${i}">${s.pred.opts[i]}</button>`).join('')}</div><div class="ma-pfb" aria-live="polite"></div></div>`;
        $('.ma-next').disabled = true;
        root.querySelectorAll('.ma-pred [data-p]').forEach(b => b.onclick = () => {
          if (!waiting) return;
          const p = +b.dataset.p; b.classList.add('sel');
          s.pred.done = true; s.pred.chose = p; waiting = false;
          $('.ma-pfb').innerHTML = p === s.pred.ans ? `✓ ${s.pred.right || 'נכון! נראה בשלב הבא.'}` : `${s.pred.wrong || 'נבדוק בשלב הבא.'}`;
          $('.ma-next').disabled = k === N() - 1;
          if (opt.onPred) opt.onPred(id, k, p, p === s.pred.ans);
          if (playing) timer = setTimeout(() => show(k + 1, true), 1800);
        });
      }
      if (s.after) s.after(root);
      if (s.audio) { try { audio = new Audio(s.audio); audio.play().catch(() => {}); } catch (e) { audio = null; } }
      if (playing && !waiting) {
        if (k === N() - 1) setPlaying(false);
        else timer = setTimeout(() => show(k + 1, true), still ? Math.max(2500, (s.dur || 3600) - 800) : (s.dur || 3600));
      }
      if (k === N() - 1 && opt.onEnd) opt.onEnd(id);
    }
    function setPlaying(v) {
      playing = v; clearTimeout(timer);
      $('.ma-play').innerHTML = playing ? '⏸ עצירה' : '▶ המשך';
      $('.ma-play').setAttribute('aria-label', playing ? 'עצירה' : 'הפעלה');
      if (playing && !waiting) {
        if (k === N() - 1) show(0); else timer = setTimeout(() => show(k + 1, true), 900);
      }
    }
    $('.ma-play').onclick = () => setPlaying(!playing);
    $('.ma-next').onclick = () => { if (!waiting) show(k + 1); };
    $('.ma-prev').onclick = () => show(k - 1);
    $('.ma-restart').onclick = () => { A = def(params || {}); setPlaying(false); show(0); $('.ma-play').innerHTML = '▶ הפעלה'; };
    $('.ma-still').onclick = () => {
      still = !still; root.classList.toggle('still', still);
      try { localStorage.setItem('ma-still', still ? '1' : '0'); } catch (e) { /* */ }
      $('.ma-still').innerHTML = still ? '🎞️ עם תנועה' : '⏸︎ בלי תנועה'; $('.ma-still').setAttribute('aria-pressed', still);
      show(k);
    };
    root.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if ([' ', 'ArrowLeft', 'ArrowRight', 'Home'].includes(e.key)) e.stopPropagation();
      if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (!waiting) show(k + 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(k - 1); }
      else if (e.key === 'Home') { e.preventDefault(); $('.ma-restart').click(); }
    });
    show(0);
    return { stop: () => { clearTimeout(timer); stopAudio(); playing = false; }, go: show, get step() { return k; } };
  };

  // חלון קופץ עם המחשה (לשימוש מהמאמן או מכרטיסייה באתר)
  MA.open = function (id, params, opt) {
    const o = document.createElement('div');
    o.className = 'overlay ma-overlay';
    o.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:60;padding:10px';
    o.innerHTML = `<div role="dialog" aria-modal="true" style="background:#fffdf8;border-radius:16px;max-width:640px;width:100%;max-height:94vh;overflow:auto;padding:12px"><div class="ma-host"></div><div style="text-align:center"><button class="ma-close" style="min-height:40px;padding:4px 18px;border:2px solid ${INK};border-radius:10px;background:#fff;font-size:1rem">סגירה</button></div></div>`;
    document.body.appendChild(o);
    const pl = MA.mount(o.querySelector('.ma-host'), id, params, opt);
    const close = () => { if (pl) pl.stop(); o.remove(); };
    o.querySelector('.ma-close').onclick = close;
    o.addEventListener('click', e => { if (e.target === o) close(); });
    o.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    setTimeout(() => { const m = o.querySelector('.ma'); if (m) m.focus(); }, 30);
    return { close };
  };

  /* =========================================================
     המחשה: מהו אחוז / אחוז, שבר ועשרוני – ריבוע 100
     params: { n: 25, tri: true (שלושה ייצוגים), mistake: true (7% מול 70%) }
     ========================================================= */
  MA.defs.tri = function (p) {
    const n = p.n != null ? p.n : 25, tri = p.tri !== false;
    const g = (on, extra) => MA.grid(Object.assign({ on }, extra || {}));
    const three = m => `<div class="ma-big"><span class="ma-box"><small>אחוז</small>${m}%</span> = <span class="ma-box"><small>שבר</small>${F(m, 100)}</span>${tri ? ` = <span class="ma-box"><small>עשרוני</small>${dec(m)}</span>` : ''}</div>`;
    const cols = Math.floor(n / 10), rest = n % 10;
    const steps = [
      { say: 'ריבוע אחד – <b>השלם</b>. הוא מחולק ל-<b>100 משבצות שוות</b>.', stage: () => g(() => null) },
      { say: `משבצת אחת היא <b>אחת מתוך 100</b>: ${P(1)} = ${F(1, 100)}${tri ? ` = ${M('0.01')} (מאית אחת)` : ''}.`, stage: () => g(i => i === 0 ? PINK : null, { newFrom: 0, newTo: 1 }) + three(1), dur: 4200 },
      { say: `עמודה שלמה היא 10 משבצות: ${P(10)} = ${F(10, 100)}${tri ? ` = ${M('0.1')}` : ''}.`, stage: () => g(i => i < 10 ? PINK : null, { newFrom: 1, newTo: 10 }) + three(10), dur: 4200 },
      { say: `נצבע עכשיו ${n} משבצות.`, pred: { q: `${n} משבצות צבועות מתוך 100. איזה אחוז מהריבוע יהיה צבוע?`, opts: [P(n), P(100 - n), P(n / 10)].filter((v, i, a) => a.indexOf(v) === i), ans: 0, right: `נכון – ${n} מתוך 100.`, wrong: `בואו נראה: ${n} משבצות מתוך 100.` }, stage: () => g(() => null) },
      { say: `${cols ? `${cols} ${cols === 1 ? 'עמודה' : 'עמודות'} של 10` : ''}${cols && rest ? ', ועוד ' : ''}${rest ? `${rest} ${rest === 1 ? 'משבצת' : 'משבצות'}` : ''}: <b>${n} מתוך 100</b> = ${P(n)}.`, stage: () => g(i => i < n ? PINK : null, { newFrom: 0, newTo: n }) + three(n), dur: 5200 }
    ];
    if (tri) steps.push({ say: `אותו חלק בשלוש דרכים: ${P(n)} – "${n} מתוך 100", השבר ${F(n, 100)}, והמספר העשרוני ${M(dec(n))} – ${n} <b>מאיות</b>.`, stage: () => g(i => i < n ? PINK : null) + three(n), dur: 5600 });
    if (tri && p.mistake !== false) steps.push(
      { say: 'זהירות מטעות נפוצה!', pred: { q: `האם ${P(7)} = ${M('0.7')}?`, opts: ['כן', 'לא'], ans: 1, right: 'נכון, לא! נראה למה.', wrong: 'נראה בריבוע.' }, stage: () => g(i => i < 7 ? PINK : null) + three(7) },
      { say: `${P(7)} הן 7 משבצות = 7 <b>מאיות</b> = ${M('0.07')}. אבל ${M('0.7')} הן 7 <b>עשיריות</b> = 7 עמודות = 70 משבצות = ${P(70)}.`, stage: () => `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${MA.grid({ c: 15, on: i => i < 7 ? PINK : null })}${MA.grid({ c: 15, on: i => i < 70 ? ORANGE : null, newFrom: 7, newTo: 70 })}</div><div class="ma-big"><span class="ma-box">${P(7)} = ${M('0.07')}</span><span class="ma-box">${P(70)} = ${M('0.7')}</span></div>`, dur: 6500 });
    steps.push({ say: 'עכשיו אתם: הזיזו את הסרגל או לחצו על משבצת – וראו איך הייצוגים משתנים יחד.', stage: () => `<div class="ma-live"></div>`, after: root => live(root.querySelector('.ma-live'), n), dur: 999999 });
    function live(box, start) {
      let m = start;
      const draw = () => {
        box.innerHTML = `<div class="ma-free"><label>משבצות צבועות: <input type="range" min="0" max="100" value="${m}" aria-label="מספר המשבצות הצבועות"></label> <b>${m}</b></div>${MA.grid({ on: i => i < m ? PINK : null, click: true })}${three(m)}`;
        box.querySelector('input').oninput = e => { m = +e.target.value; draw(); const r = box.querySelector('input'); r.focus(); };
        box.querySelectorAll('.ma-cell').forEach(c => c.onclick = () => { const i = +c.dataset.i; m = (i + 1 === m) ? i : i + 1; draw(); });
      };
      draw();
    }
    return { title: tri ? 'אחוז, שבר ומספר עשרוני – אותו חלק' : 'מהו אחוז?', steps };
  };

  /* =========================================================
     המחשה: אחוז מכמות – מחלקים לקבוצות שוות
     params: { p: 25, N: 80, what: 'כדורים' }
     p חייב להיות k/d עם d ∈ {2,4,5,10,20} ו-N מתחלק ב-d. כמות עד 100 – נקודות; מעל 100 – מודל פס.
     ========================================================= */
  MA.pctFrac = p => { for (const d of [1, 2, 4, 5, 10, 20, 25, 50, 100]) if ((p * d) % 100 === 0) return [p * d / 100, d]; return null; };
  MA.defs.ofqty = function (p) {
    const pc = p.p || 25, N = p.N || 80, what = p.what || 'כדורים';
    const [k, d] = MA.pctFrac(pc), per = N / d, res = k * per;
    if (per % 1) throw new Error('N must divide by d');
    const W = 360;
    // נקודות: כל קבוצה במסגרת משלה; hl – כמה קבוצות מודגשות; split – האם כבר חילקנו
    function dots(split, hl, anim) {
      if (N > 100) return bar(split, hl);
      const G = split ? d : 1, gc = G <= 2 ? G : G <= 4 ? 2 : Math.min(G, 5), gr = Math.ceil(G / gc);
      const inG = split ? per : N, dc = Math.min(10, Math.ceil(Math.sqrt(inG * 2))), dr = Math.ceil(inG / dc);
      const bw = (W - 10) / gc, r = Math.max(3, Math.min(9, (bw - 16) / dc / 2.4)), step = r * 2.5;
      const bh = dr * step + 18, H = gr * (bh + 8) + 4; let out = '';
      for (let g = 0; g < G; g++) {
        const gx = 5 + (gc - 1 - (g % gc)) * bw, gy = 4 + Math.floor(g / gc) * (bh + 8), on = g < hl; // הקבוצה הראשונה מימין
        if (split) out += `<rect x="${gx + 2}" y="${gy}" width="${bw - 4}" height="${bh}" rx="8" fill="${on ? PINK2 : '#fff'}" stroke="${INK}" stroke-width="${on ? 2.6 : 1.4}"/>`;
        for (let i = 0; i < inG; i++) {
          const cx = gx + bw / 2 + ((dc - 1) / 2 - (i % dc)) * step, cy = gy + 10 + r + Math.floor(i / dc) * step;
          const delay = anim ? ((g * inG + i) / N * 1.2).toFixed(2) : 0;
          out += `<circle class="${anim ? 'new' : ''}" style="${anim ? `animation-delay:${delay}s` : ''}" cx="${cx}" cy="${cy}" r="${r}" fill="${on ? PINK : '#c9d6f2'}" stroke="${INK}" stroke-width="1"/>`;
        }
      }
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${N} ${what}">${out}</svg>`;
    }
    function bar(split, hl) {
      const H = 92, x0 = 10, w = W - 20, pw = w / d; let out = `<text x="${W / 2}" y="16" text-anchor="middle" font-size="15" fill="${INK}">${N}</text>`;
      for (let g = 0; g < (split ? d : 1); g++) {
        const x = split ? x0 + w - (g + 1) * pw : x0, ww = split ? pw : w, on = split && g < hl;
        out += `<rect x="${x}" y="26" width="${ww}" height="40" fill="${on ? PINK : '#c9d6f2'}" stroke="${INK}" stroke-width="2"/>`;
        if (split && d <= 10) out += `<text x="${x + ww / 2}" y="84" text-anchor="middle" font-size="13" fill="${INK}">${per}</text>`;
      }
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="פס של ${N}">${out}</svg>`;
    }
    const fracTxt = k === 1 ? F(1, d) : F(k, d);
    const name = { '1/2': 'חצי', '1/4': 'רבע', '3/4': 'שלושה רבעים', '1/5': 'חמישית', '1/10': 'עשירית', '1/20': 'חלק אחד מתוך 20' }[`${k}/${d}`] || `${k} חלקים מתוך ${d}`;
    const steps = [
      { say: `יש לנו <b>${N} ${what}</b> – זה השלם, ${P(100)}.`, stage: () => dots(false, 0, true), dur: 4000 },
      { say: `${P(pc)} הם ${pc} מתוך 100 – כלומר ${F(pc, 100)} = ${fracTxt}: <b>${name}</b>.`, stage: () => `<div style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap">${d <= 25 ? MA.grid({ c: 12, cut: d, on: i => MA.part(Math.floor(i / 10), i % 10, d) < k ? PINK : null }) : ''}<div class="ma-big">${P(pc)} = ${F(pc, 100)} = ${fracTxt}</div></div>`, dur: 5200 },
      { say: `איך נמצא ${name} מ-${N} ${what}?`, pred: { q: `לכמה קבוצות שוות נחלק את ${N}?`, opts: [...new Set([d, pc, k === 1 ? 100 : k])].map(String), ans: 0, right: `נכון – ${fracTxt} פירושו ${d} חלקים שווים.`, wrong: `${fracTxt}: המכנה ${d} אומר לכמה חלקים שווים מחלקים.` }, stage: () => dots(false, 0, false) },
      { say: `${M(`${N} : ${d} = ${per}`)} – בכל קבוצה <b>${per}</b> ${what}.`, stage: () => dots(true, 0, true), dur: 5200 },
      { say: `${P(pc)} = ${k === 1 ? 'קבוצה אחת' : `${k} קבוצות`} מתוך ${d}.`, stage: () => dots(true, k, false), dur: 4200 },
      { say: `${k === 1 ? `קבוצה אחת: <b>${res}</b>` : `${M(`${k} × ${per} = ${res}`)}`}. ${P(pc)} מ-${N} הם <b>${res}</b>.`, stage: () => dots(true, k, false) + `<div class="ma-big"><span class="ma-box">${pc}% × ${N} = ${res}</span></div>`, dur: 5200 },
      { say: `בדיקה: ${res} קטן מ-${N}, כי לקחנו רק <b>חלק</b> מהכמות. ${pc < 50 ? `וגם: פחות מחצי (${N / 2}).` : pc > 50 ? `וגם: יותר מחצי (${N / 2}).` : 'בדיוק חצי.'}`, stage: () => dots(true, k, false), dur: 5200 },
      { say: 'עכשיו אתם: בחרו אחוז וכמות, ולחצו "הצגה".', stage: () => `<div class="ma-live"></div>`, after: root => free(root.querySelector('.ma-live')), dur: 999999 }
    ];
    function free(box) {
      const PCS = [50, 25, 75, 20, 10, 5], NS = [20, 40, 60, 80, 100, 200, 400];
      box.innerHTML = `<div class="ma-free"><label>אחוז: <select class="ma-p">${PCS.map(x => `<option ${x === pc ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>מתוך: <select class="ma-n">${NS.map(x => `<option ${x === N ? 'selected' : ''}>${x}</option>`).join('')}</select></label><button class="ma-go" style="min-height:38px;border:2px solid ${INK};border-radius:10px;background:#fbe3ec;padding:2px 12px">הצגה</button></div><div class="ma-sub"></div>`;
      box.querySelector('.ma-go').onclick = () => {
        const p2 = +box.querySelector('.ma-p').value, n2 = +box.querySelector('.ma-n').value, f = MA.pctFrac(p2);
        const sub = box.querySelector('.ma-sub');
        if (!f || n2 % f[1]) { sub.innerHTML = `<p>את ${n2} אי אפשר לחלק ל-${f ? f[1] : '?'} קבוצות שוות של שלמים. בחרו כמות אחרת.</p>`; return; }
        MA.mount(sub, 'ofqty', { p: p2, N: n2, what });
      };
    }
    return { title: `אחוז מכמות: ${pc}% מ-${N}`, steps };
  };
})();
