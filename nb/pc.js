/* =========================================================
   MathInClass – מרכז ההדפסה האחיד (גרסת ניסיון, כיתה ו')
   ---------------------------------------------------------
   עיקרון: אין כאן מחוללים ואין תבניות הדפסה משלנו.
   הדפים נוצרים במנוע ההדפסה הקיים – math6.html?print – בתוך מסגרת נסתרת באותו מקור:
   מסמנים את ההגדרות בטופס המקורי ולוחצים על הכפתור המקורי, כך שהתבניות, מדידת העמודים,
   דפי התשובות והמחוונים זהים לגמרי לדף ההדפסה המאושר.
   מה שנוסף (החלטות איריס 28.11): ניקוד והוראות במבחן, שחור-לבן, גופן גדול, מקום מורחב לפתרון,
   שאלות בכל עמוד, חלוקה ידנית בין נושאים, שילוב רמות, דף לכל רמה, שטחים מורכבים בגאומטריה,
   ומגבלת ההדפסה היומית – רק ברגע ההדפסה (לא ביצירה ולא בתצוגה מקדימה).
   ========================================================= */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ic = (n, c) => window.NB_ART.ic(n, c);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const noEmoji = s => String(s || '').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
  const GRADE = 6, ENG_W = 860;
  const F = $('eng'), stage = $('stage');
  let W = null, D = null, engMode = '', ready = null;

  /* ---------------- מצב ההגדרות (נשמר במכשיר, כדי לחזור להגדרות בלי לאבד בחירה) ---------------- */
  const KEY = 'pc6-v1';
  const DEF = {
    cat: 'nat', topics: ['place'], skills: {}, product: 'practice', level: 'mix', lvs: [1, 2, 3],
    count: 10, comp: 'auto', nWord: 2, tech: 12, examWord: 3, examThink: true, split: 'auto', manual: {}, whole: false,
    versions: 1, perPage: 0, pages: 0, space: 'normal', font: 'normal', twoCol: false,
    style: 'pastel', bw: false, title: '', tips: true, key: 'final', points: true, instr: true, general: false,
    drills: [], drillN: 30, packOpt: {}, tpl: null, adv: {}
  };
  let S = Object.assign({}, DEF);
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') S = Object.assign({}, DEF, s); } catch (e) { /* לא חובה */ }
  S.tpl = null; // תבנית מיוחדת לא נפתחת לבד
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* לא חובה */ } };

  // כניסה ממקום אחר באתר: ?topic=pct (נושא מסומן) / ?cat=frac / ?product=exam
  const U = new URLSearchParams(location.search);

  /* ---------------- נתונים מהמנוע ---------------- */
  let DATA = null; // { cats, topics, packs, drills }
  const DRILL_CAT = { fSimp: 'frac', fDiff: 'frac', fMul: 'frac', mFrW: 'frac', mMixW: 'frac', fDiv: 'frac', dAdd: 'dec', d10: 'dec', dMul: 'dec', pct: 'pct' };
  // תבניות מיוחדות – כל אחת נשארת בדיוק כמו שאושרה (הטופס המקורי שלה מוצג כמו שהוא)
  const TPL = [
    { id: 'wp', cat: 'word', name: 'שאלות מילוליות לפי פעולות', d: 'בוחרים פעולות וסוג מספרים; דף מדורג משלב אחד לשניים', card: 'wpcard', gate: true },
    { id: 'tz', cat: 'nat', name: 'פאזל התאמה – משולש', d: 'גוזרים ומרכיבים: כל תרגיל ליד התשובה שלו', card: 'tzcard', gate: true },
    { id: 'df', cat: 'nat', name: 'מעובדה אחת – הרבה עובדות', d: 'מעובדה ידועה לעובדות קרובות', h2: 'מעובדה אחת', gate: true },
    { id: 'kf', cat: 'nat', name: 'לוח הכפל והחילוק – לכיתה', d: 'אתגר דקה וכרטיסי בינגו', h2: 'לוח הכפל והחילוק', gate: true },
    { id: 'kfc', cat: 'frac', name: 'חילוק שברים – שיטת KFC', d: 'דף תרגול עם פיגומים לשיטה', card: 'kfccard', gate: true },
    { id: 'cmp', cat: 'geo', name: 'שטחים מורכבים – דף שתי דרכים וכרטיסי יציאה', d: 'הדף המיוחד, כמו שהוא', site: true },
    { id: 'pal', cat: 'exc', name: 'תבניות פלינדרומיות', card: 'palcard' },
    { id: 'cub', cat: 'exc', name: 'כמה קוביות?', card: 'cubcard' },
    { id: 'mag', cat: 'exc', name: 'ריבועי קסם', card: 'magcard' },
    { id: 'lg', cat: 'exc', name: 'חידות חשיבה', card: 'lgcard' },
    { id: 'grw', cat: 'exc', name: 'תבניות גדילה', card: 'grwcard' },
    { id: 'sdk', cat: 'exc', name: 'חוברות סודוקו', d: 'נפתח במרכז הסודוקו', href: 'sudoku.html?grade=6' },
    { id: 'g6', cat: 'sol', name: 'דפי עבודה וכרטיסי יציאה לשיעורי הגופים', d: 'נפתח בפרק המנסרה', href: 'geo6.html' }
  ];
  const PROD = [
    { id: 'drill', name: 'תרגילים בלבד', d: 'תרגיל אחרי תרגיל', i: 'list' },
    { id: 'practice', name: 'דף תרגול', d: 'תרגילים ושאלות', i: 'pencil' },
    { id: 'think', name: 'דף חשיבה', d: 'נימוק, הסקה, טעויות', i: 'spark' },
    { id: 'mixed', name: 'דף משולב', d: 'תרגול ובסופו חשיבה', i: 'cards' },
    { id: 'exam', name: 'מבחן', d: 'ניקוד, הוראות ומחוון', i: 'check' },
    { id: 'booklet', name: 'חוברת', d: 'שער, פרקים וקוד', i: 'book' }
  ];
  const LV = [['1', 'רמה 1'], ['2', 'רמה 2'], ['3', 'רמה 3'], ['mix', 'מדורג'], ['mixlv', 'שילוב רמות'], ['perlv', 'דף לכל רמה']];
  const LV_NAME = { 1: 'רמה 1 – בסיסית', 2: 'רמה 2 – בינונית', 3: 'רמה 3 – מאתגרת' };

  const packOf = t => DATA && DATA.packs.find(P => P.topic === t);
  const isPackOnly = () => S.topics.length === 1 && !!packOf(S.topics[0]);
  const prodOk = p => {
    if (p === 'think') return S.topics.length === 1 && S.topics[0] === 'frac';
    if (p === 'mixed') return S.topics.includes('frac');
    return true;
  };
  const skillsOf = t => { const P = packOf(t); if (!P) return []; const s = S.skills[t]; return Array.isArray(s) && s.length ? s.filter(id => P.skills.some(k => k.id === id)) : [P.skills[0].id]; };
  const pOpt = t => Object.assign({ order: 'alt', tip: (packOf(t) || {}).tipDef || 'concept', fig: true, est: false }, S.packOpt[t] || {});

  /* ---------------- המנוע: טעינה והתאמה ---------------- */
  const ENG_CSS = `
    @media screen {
      html.pc-eng, html.pc-eng body { background: transparent !important; }
      html.pc-eng body::before { display: none !important; }
      html.pc-eng body { margin: 0 !important; padding: 0 !important; min-height: 0 !important; overflow: hidden; }
      html.pc-eng #app { max-width: none !important; width: auto !important; padding: 6px 0 24px !important; margin: 0 !important; background: none !important; box-shadow: none !important; border: 0 !important; }
      html.pc-eng #app > .noprint, html.pc-eng .pk-bar, html.pc-eng footer.credit { display: none !important; }
      html.pc-eng #wsout:not(.measure) .ws-page { background: transparent !important; box-shadow: none !important; padding: 0 !important; margin: 0 auto !important; max-width: none !important; width: 210mm; border-radius: 0; }
      html.pc-eng #wsout:not(.measure) .ws-pg { background: #fff; width: 210mm; min-height: 297mm; padding: 12mm !important; box-sizing: border-box; margin: 0 auto 8mm !important; border: 0 !important; box-shadow: 0 2px 4px rgba(37,59,73,.10), 0 8px 22px rgba(37,59,73,.12); }
      html.pc-eng #wsout:not(.measure) .ws-pastel .ws-pg { background: #fffdfa; }
      html.pc-eng #wsout:not(.measure) .ws-page:not(:has(> .ws-pg)) { background: #fff !important; padding: 12mm !important; margin: 0 auto 8mm !important; box-sizing: border-box; box-shadow: 0 2px 4px rgba(37,59,73,.10), 0 8px 22px rgba(37,59,73,.12) !important; }
      html.pc-card:not(.pc-site) #app > .noprint { display: block !important; }
      html.pc-card:not(.pc-site) #app > .noprint > * { display: none !important; }
      html.pc-card:not(.pc-site) #app > .noprint > .pc-show { display: block !important; }
      html.pc-card #app { padding: 0 0 24px !important; }
      html.pc-card .pc-show { font-family: 'Heebo', 'Segoe UI', Arial, sans-serif; background: #fff !important; border: 1px solid #DCE2E6 !important; border-radius: 18px !important; box-shadow: none !important; margin: 0 0 14px !important; }
      html.pc-card .pc-show h2 { font-family: 'Heebo', 'Segoe UI', Arial, sans-serif !important; font-size: 1.15rem !important; }
      html.pc-card .pc-show button { border-radius: 999px !important; box-shadow: none !important; }
      html.pc-card #wsout:not(.measure) .ws-page { width: auto; max-width: 210mm; }
      html.pc-card #wsout:not(.measure) .ws-pg { width: auto; max-width: 210mm; min-height: 0; }
      html.pc-site body { overflow: hidden; }
      html.pc-site #app > .noprint { display: block !important; font-family: 'Heebo', 'Segoe UI', Arial, sans-serif; }
      html.pc-site #app { padding: 0 0 24px !important; }
    }
    .pc-instr { border: 1.5px solid #000; border-radius: 6px; padding: 5px 10px; margin: 0 0 10px; font-size: 0.92rem; line-height: 1.6; }
    .pc-pts { font-weight: 700; font-size: 0.85em; white-space: nowrap; }
    .pc-kpts { font-weight: 700; }
    .pc-knote { font-size: 0.9rem; margin: 0 0 6px; }
    #wsout.pc-bw { filter: grayscale(1); }
    #wsout.pc-bw .ws-page, #wsout.pc-bw .ws-pg, #wsout.pc-bw .wsq, #wsout.pc-bw .ex-q, #wsout.pc-bw .wstips { background-color: #fff !important; }
    #wsout.pc-bw .ws-pastel .wsnum { background: #fff !important; color: #000 !important; border: 1.6px solid #000 !important; }
    #wsout.pc-bw .ws-pastel .wsqs .wsq { border-color: #8a8a8a !important; }
    #wsout.pc-bw .ws-pastel .wshead h1, #wsout.pc-bw .ws-pastel .wsfoot, #wsout.pc-bw .ws-pastel.wskey h2 { color: #000 !important; }
    #wsout.pc-bw .ws-pastel .wshead::after { filter: grayscale(1) brightness(.6); }
    #wsout.pc-big .ws-page .qtext { font-size: 1.15rem !important; line-height: 1.75 !important; }
    #wsout.pc-big .wsans, #wsout.pc-big .wschoices, #wsout.pc-big .ex-choices { font-size: 1.12rem !important; }
    #wsout.pc-roomy .ex-grid { min-height: 3.6cm; } #wsout.pc-roomy .ex-grid.big { min-height: 4.6cm; } #wsout.pc-roomy .ex-grid.sm { min-height: 3cm; }
    #wsout.pc-roomy .ex-grid.xl { min-height: 7cm !important; } #wsout.pc-roomy .wsqs.dsk-dense .ex-grid { min-height: 2.6cm; }
  `;
  const loadEngine = mode => {
    if (engMode === mode && ready) return ready;
    engMode = mode;
    ready = new Promise(res => {
      F.onload = () => { try { W = F.contentWindow; D = W.document; patch(mode); } catch (e) { console.error('[pc]', e); } res(); };
      F.src = mode === 'site' ? 'math6.html?grade=6' : 'math6.html?print&grade=6';
    });
    return ready;
  };
  const ev = code => { try { return W.eval(code); } catch (e) { return undefined; } };

  let oPrint = null;
  function patch(mode) {
    const st = D.createElement('style'); st.id = 'pcx'; st.textContent = ENG_CSS; D.head.appendChild(st);
    D.documentElement.classList.add('pc-eng');
    if (mode === 'site') D.documentElement.classList.add('pc-card', 'pc-site');
    W.scrollTo = () => {}; W.scroll = () => {};
    W.Element.prototype.scrollIntoView = function () {};
    oPrint = W.print.bind(W);
    W.print = () => doPrint();
    new W.ResizeObserver(fit).observe(D.body);
    if (mode === 'site') return;
    // מגבלת ההדפסה עוברת לרגע ההדפסה (החלטה 10) – היצירה עצמה פתוחה
    W.wsGate = fn => fn();
    // שטחים מורכבים – חלק מגאומטריה במישור (החלטה 8). הנושא קיים במחוללים; כאן רק מוסיפים אותו לרשימת הנושאים של הדף
    const T = ev('TOPIC');
    if (T && T.composite) {
      if (!Array.isArray(T.composite.tips)) T.composite.tips = ['צורה מורכבת בנויה מכמה צורות פשוטות. שתי דרכים לשטח: מפרקים לחלקים, או משלימים למלבן גדול ומחסירים את מה שהוספנו.', 'היקף = סכום כל הצלעות מסביב. לפעמים צריך קודם להסיק צלע חסרה.'];
      const box = D.querySelector('.wstopics:not(.drtopics)');
      if (box && !box.querySelector('input[value="composite"]')) box.insertAdjacentHTML('beforeend', '<label class="chk"><input type="checkbox" value="composite"> שטחים מורכבים</label>');
    }
    const oBW = W.buildWorksheet, oWQ = W.buildWordQs, oPag = W.paginateSheets;
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // רמות לפי מקום: שילוב רמות = חלוקה שווה בין הרמות שנבחרו, בסדר מעורב; מדורג = מהקל אל הקשה
    const lvAt = (n, level, lvs) => lvs ? shuffle(Array.from({ length: n }, (_, i) => lvs[i % lvs.length])) : Array.from({ length: n }, (_, i) => level === 'mix' ? Math.min(3, 1 + Math.floor(3 * i / n)) : Number(level));
    const interleave = parts => { const out = [], L = parts.map(p => p.slice()); while (L.some(p => p.length)) { const tot = L.reduce((a, p) => a + p.length, 0); const p = L.reduce((b, x) => x.length / tot > (b ? b.length / tot : -1) ? x : b, null); out.push(p.shift()); } return out; };
    W.buildWorksheet = function (topics, level, count, drill, wholeOnly) {
      const X = W.PCX || {};
      if (!X.split && !X.lvs) return oBW(topics, level, count, drill, wholeOnly);
      let seq;
      if (X.split) { const parts = topics.map(t => Array(X.split[t] || 0).fill(t)); seq = X.group ? parts.flat() : interleave(parts); }
      else seq = Array.from({ length: count }, (_, i) => topics[i % topics.length]);
      const lvs = lvAt(seq.length, level, X.lvs), out = [], seen = new Set();
      seq.forEach((t, i) => { let q; for (let k = 0; k < 12; k++) { q = oBW([t], String(lvs[i]), 1, drill, wholeOnly)[0]; if (!seen.has(q.text)) break; } seen.add(q.text); out.push(q); });
      if (X.lvs && level === 'mix') out.sort((a, b) => (a.lv || 0) - (b.lv || 0));
      return out;
    };
    W.buildWordQs = function (topics, level, n, wholeOnly, strict) {
      const X = W.PCX || {};
      if (X.split && X.wordSplit) return topics.flatMap(t => X.split[t] ? oWQ([t], level, X.split[t], wholeOnly, true) : []);
      if (!X.lvs) return oWQ(topics, level, n, wholeOnly, strict);
      const per = X.lvs.map((_, i) => Math.floor(n / X.lvs.length) + (i < n % X.lvs.length ? 1 : 0));
      return shuffle(X.lvs.flatMap((lv, i) => per[i] ? oWQ(topics, String(lv), per[i], wholeOnly, strict) : []));
    };
    W.paginateSheets = function () { try { if (W.PCX && W.PCX.exam) examPre(); } catch (e) { console.warn('[pc] exam', e); } return oPag.apply(this, arguments); };
    // נתונים לממשק
    const cats = ev('TOPIC_CATS').map(c => ({ id: c.id, name: c.name }));
    const catOf = ev('catOf');
    const topics = ev('TOPICS').map(t => ({ id: t.id, name: t.name, cat: catOf(t.id) }));
    if (T && T.composite) topics.splice(topics.findIndex(t => t.id === 'geo') + 1, 0, { id: 'composite', name: 'שטחים מורכבים', cat: 'geo' });
    const packs = ev('SKP').filter(P => P.on()).map(P => ({ topic: P.topic, pfx: P.pfx, title: P.title, typed: !!P.typed,
      skills: P.skills.map(k => ({ id: k.id, name: k.name })), groups: P.groups ? P.groups.map(g => ({ name: g.name, ids: g.ids.filter(id => P.skills.some(k => k.id === id)) })).filter(g => g.ids.length) : null,
      tips: P.tipOpts.map(([v, t]) => [v, t]), tipDef: (P.tipOpts.find(x => x[2]) || P.tipOpts[0])[0] }));
    const drills = ev('DRILLS').filter(d => d.g.includes(GRADE)).map(d => ({ id: d.id, name: d.name, cat: DRILL_CAT[d.id] || 'nat' }));
    DATA = { cats, topics, packs, drills, drillCounts: ev('DRILL_COUNTS') || [12, 16, 20, 24, 30, 40, 48, 60], perDay: ev('WS_PER_DAY') || 2 };
  }

  // מבחן: הוראות, ניקוד (סה"כ 100) ושדה ציון – נוספים לפני מדידת העמודים, כדי שלא יגלשו
  function examPre() {
    const X = W.PCX.exam, out = D.getElementById('wsout');
    const secs = [...out.querySelectorAll(':scope > section.ws-page')].filter(s => !s.dataset.pcx);
    if (!secs.length) return;
    const groups = []; let cur = null;
    secs.filter(s => !s.classList.contains('wskey')).forEach(s => { if (s.querySelector('.wshead') || !cur) groups.push(cur = []); cur.push(s); });
    const keys = secs.filter(s => s.classList.contains('wskey'));
    groups.forEach((g, v) => {
      const qs = g.flatMap(s => [...s.querySelectorAll('.ex-q, .wsq')]);
      const pts = X.points ? points(qs) : null;
      const head = g[0].querySelector('.wshead');
      if (head) {
        if (X.points) { const m = head.querySelector('.wsmeta'); if (m) m.insertAdjacentHTML('beforeend', '<span>ציון: <span class="wsline"></span></span>'); }
        if (X.instr) head.insertAdjacentHTML('afterend', `<div class="pc-instr"><b>הוראות:</b> קראו כל שאלה בעיון. הציגו את דרך הפתרון במשבצות, וכתבו את התשובה הסופית במקום המיועד. במבחן ${qs.length} שאלות${pts ? ', ובסך הכול 100 נקודות – הניקוד של כל שאלה כתוב בסוגריים' : ''}. בהצלחה!</div>`);
      }
      g.forEach(s => s.querySelectorAll('.wsfoot').forEach(f => f.remove()));
      g.forEach(s => s.querySelectorAll('.wsskill').forEach(x => { x.innerHTML = x.innerHTML.replace(/ · (דף משולב|דף תרגול|דף חשיבה)/, ''); }));
      if (pts) qs.forEach((q, i) => { const t = q.querySelector('.qtext'); if (t) t.insertAdjacentHTML('beforeend', ` <span class="pc-pts" data-raw><bdi>(${pts[i]} נקודות)</bdi></span>`); });
      const k = keys[v];
      if (k && pts) {
        k.querySelectorAll(':scope > ol > li').forEach((li, i) => { if (pts[i] != null) li.insertAdjacentHTML('afterbegin', `<span class="pc-kpts" data-raw><bdi>(${pts[i]} נקודות)</bdi></span> `); });
        const h = k.querySelector(':scope > h2'); if (h) h.insertAdjacentHTML('afterend', '<p class="pc-knote">סה״כ 100 נקודות. הניקוד של כל שאלה כתוב בתחילת השורה. במשימות חשיבה – לפי המחוון.</p>');
      }
    });
    secs.forEach(s => { s.dataset.pcx = '1'; });
  }
  // ניקוד: משימת חשיבה כפולה, שאלה עם דרך פתרון (מילולית ארוכה) – פי 1.5; סכום מדויק 100
  function points(qs) {
    const w = qs.map(q => q.classList.contains('ex-open') || q.classList.contains('wsopenq') ? 4 : q.querySelector('.ex-work') ? 3 : 2);
    const tot = w.reduce((a, b) => a + b, 0) || 1;
    const p = w.map(x => Math.max(1, Math.round(100 * x / tot)));
    let diff = 100 - p.reduce((a, b) => a + b, 0);
    const ord = p.map((_, i) => i).sort((a, b) => w[b] - w[a] || a - b);
    for (let k = 0; diff && k < ord.length * 6; k++) { const i = ord[k % ord.length]; if (diff > 0) { p[i]++; diff--; } else if (p[i] > 1) { p[i]--; diff++; } }
    return p;
  }

  /* ---------------- התאמת המסגרת לתצוגה ---------------- */
  let card = false;
  function fit() {
    if (!D || !D.body) return;
    const wrap = stage.clientWidth || 800;
    const h = Math.max(200, D.documentElement.scrollHeight);
    if (card) { F.style.width = '100%'; F.style.height = h + 'px'; stage.style.height = ''; return; }
    const s = Math.min(1, wrap / ENG_W);
    F.style.width = ENG_W + 'px'; F.style.height = h + 'px';
    F.style.transform = `scale(${s})`;
    stage.style.height = Math.ceil(h * s) + 'px';
  }
  window.addEventListener('resize', fit);

  /* ---------------- יצירת הדפים ---------------- */
  let genId = 0, busyT = 0, lastOk = false;
  const busy = on => { $('busy').hidden = !on; };
  const msg = (html, cls) => { const m = $('msg'); m.className = 'pc-msg' + (cls ? ' ' + cls : ''); m.innerHTML = html || ''; };
  const schedule = (ms = 350) => { clearTimeout(busyT); busy(true); busyT = setTimeout(() => generate().catch(e => { console.error(e); busy(false); msg('משהו השתבש ביצירת הדף. נסו שוב או שנו הגדרה.', 'bad'); }), ms); };

  const setSel = (el, v, label) => {
    if (!el) return;
    v = String(v);
    let o = [...el.options].find(x => x.value === v && !x.dataset.pc);
    if (!o) { o = [...el.options].find(x => x.dataset.pc && x.value === v); if (!o) { o = D.createElement('option'); o.value = v; o.dataset.pc = '1'; el.appendChild(o); } o.textContent = label || v; }
    el.selectedIndex = [...el.options].indexOf(o);
  };
  const chk = (id, on) => { const x = D.getElementById(id); if (x) x.checked = !!on; };

  function formFor(level, titleSuffix) {
    const byId = id => D.getElementById(id);
    const P = S.product, exam = P === 'exam';
    const topics = S.topics.filter(t => DATA.topics.some(x => x.id === t));
    D.querySelectorAll('.wstopics:not(.drtopics) input').forEach(x => { x.checked = topics.includes(x.value); });
    // חבילות מיומנויות (שברים, חילוק שברים): אותו פאנל מקורי
    DATA.packs.forEach(pk => {
      const pn = byId(pk.pfx + 'Panel'); if (!pn) return;
      const sk = skillsOf(pk.topic), o = pOpt(pk.topic);
      pn.querySelectorAll('.dsk-skills input[type=checkbox][value]').forEach(x => { x.checked = sk.includes(x.value); });
      chk(pk.pfx + 'All', sk.length === pk.skills.length);
      const type = P === 'think' ? 'think' : P === 'mixed' ? 'mixed' : exam && S.examThink && pk.typed ? 'mixed' : 'practice';
      const r = pn.querySelector(`input[name="${pk.pfx}Type"][value="${type}"]`); if (r) r.checked = true;
      if (byId(pk.pfx + 'Order')) byId(pk.pfx + 'Order').value = o.order;
      const tip = byId(pk.pfx + 'Tip'); if (tip) tip.value = S.tips && !exam ? (P === 'think' && !S.packOpt[pk.topic] ? 'short' : o.tip) : 'none';
      chk(pk.pfx + 'Fig', o.fig); chk(pk.pfx + 'Est', o.est);
    });
    const lvLabel = level === 'mix' ? 'מדורגת – מהקל אל הקשה' : level === 'mixlv' ? 'שילוב רמות: ' + S.lvs.join(', ') : LV_NAME[level];
    setSel(byId('wl'), level === 'mixlv' ? 'mix' : level, level === 'mixlv' ? lvLabel : null);
    let count = S.count, wq = S.comp;
    if (exam) { count = Math.max(0, S.tech); wq = String(Math.max(0, S.examWord)); if (!count && S.examWord) { count = S.examWord; wq = 'only'; } else if (wq === '0') wq = '0'; }
    if (S.split === 'manual' && topics.length > 1 && !isPackOnly() && P !== 'think') {
      const sum = topics.reduce((a, t) => a + Math.max(0, S.manual[t] == null ? 0 : S.manual[t]), 0);
      if (wq === 'only') count = sum; else count = sum;
    }
    if (P === 'think') wq = 'auto';
    setSel(byId('wc'), count);
    setSel(byId('wwq'), wq, /^\d+$/.test(wq) ? `${wq} שאלות מילוליות (בסוף הדף, בנוסף לתרגילים)` : null);
    const defT = exam ? (topics.length === 1 && !isPackOnly() ? 'מבחן – ' + DATA.topics.find(t => t.id === topics[0]).name : isPackOnly() ? 'מבחן – ' + packOf(topics[0]).title : 'מבחן במתמטיקה') : '';
    byId('wt').value = (S.title.trim() || defT) + (titleSuffix || '') || (titleSuffix ? defaultTitle() + titleSuffix : '');
    setSel(byId('wstyle'), exam ? 'exam' : S.style);
    chk('wwhole', S.whole);
    chk('wgrid', exam || S.style === 'exam' || !S.twoCol);
    chk('wtips', S.tips && !exam);
    chk('wexp', S.key === 'full');
    setSel(byId('wv'), S.versions);
    chk('wkey', S.key !== 'none');
    return { count, topics };
  }
  // כותרת ברירת המחדל של דף התרגול (כמו בדף הקיים) – כדי להוסיף לה "רמה N" בדף לכל רמה
  function defaultTitle() {
    const t = S.topics, P = S.product;
    const base = P === 'think' ? 'דף חשיבה' : P === 'mixed' ? 'דף תרגול וחשיבה' : S.comp === 'only' ? 'שאלות מילוליות' : P === 'exam' ? 'מבחן' : 'דף תרגול';
    if (isPackOnly()) return `${base} – ${packOf(t[0]).title}`;
    return t.length === 1 ? `${base} – ${(DATA.topics.find(x => x.id === t[0]) || {}).name}` : `${base} במתמטיקה`;
  }

  async function generate() {
    await loadEngine('print');
    if (S.tpl) return; // בתבנית מיוחדת – הטופס המקורי פועל לבד
    const out = D.getElementById('wsout');
    out.className = [S.bw && 'pc-bw', S.font === 'big' && 'pc-big', S.space === 'roomy' && 'pc-roomy'].filter(Boolean).join(' ');
    const P = S.product, notes = [];
    lastOk = false; genId++;
    if (P === 'booklet') { await openTpl({ id: 'bk', name: 'חוברת לפי נושאים', card: 'bkcard' }, true); busy(false); return; }
    W.PCX = null;
    if (P === 'drill') {
      const ids = S.drills.filter(id => DATA.drills.some(d => d.id === id));
      if (!ids.length) { out.innerHTML = ''; done('בחרו לפחות תחום תרגילים אחד.'); return; }
      D.querySelectorAll('.drtopics input').forEach(x => { x.checked = ids.includes(x.value); });
      setSel(D.getElementById('drc'), S.drillN);
      setSel(D.getElementById('wv'), S.versions); chk('wkey', S.key !== 'none');
      out.innerHTML = '';
      D.getElementById('drgo').click();
      return done();
    }
    if (!S.topics.length && !(P === 'exam' && S.general)) { out.innerHTML = ''; done('בחרו לפחות נושא אחד באזור "תוכן".'); return; }
    const exam = P === 'exam';
    const X = { exam: exam ? { points: S.points, instr: S.instr } : null, split: null, lvs: null, wordSplit: false };
    if (exam) X.exam = { points: S.points, instr: S.instr };
    if (exam && S.general) {
      W.PCX = { exam: X.exam };
      D.getElementById('wt').value = S.title.trim();
      setSel(D.getElementById('wv'), S.versions); chk('wkey', S.key !== 'none'); chk('wexp', S.key === 'full');
      out.innerHTML = '';
      D.getElementById('wexam').click();
      return done();
    }
    if (S.split === 'manual' && S.topics.length > 1 && !isPackOnly() && P !== 'think') {
      X.split = {}; S.topics.forEach(t => { X.split[t] = Math.max(0, S.manual[t] == null ? 0 : S.manual[t]); });
      X.group = exam; X.wordSplit = !exam && S.comp === 'only';
      if (!Object.values(X.split).some(Boolean)) { out.innerHTML = ''; done('בחלוקה הידנית – כתבו כמה שאלות מכל נושא.'); return; }
    }
    if (S.level === 'mixlv') { if (!S.lvs.length) { out.innerHTML = ''; done('בחרו לפחות רמה אחת לשילוב.'); return; } X.lvs = S.lvs.slice().sort(); }
    W.PCX = (X.exam || X.split || X.lvs) ? X : null;
    if (S.level === 'perlv') {
      const lvs = (S.lvs.length ? S.lvs : [1, 2, 3]).slice().sort();
      let html = '', what = [];
      for (const lv of lvs) {
        formFor(String(lv), ` – רמה ${lv}`); out.innerHTML = '';
        if (!S.title.trim()) D.getElementById('wt').value = defaultTitle() + ` – רמה ${lv}`;
        D.getElementById('wgo').click();
        if (!out.innerHTML.trim()) { html = ''; break; }
        html += out.innerHTML; what.push(out.dataset.what || '');
        collectNotes(notes);
      }
      out.innerHTML = html;
      out.dataset.what = 'דף לכל רמה: ' + what.join(' | ');
    } else {
      formFor(S.level);
      out.innerHTML = '';
      D.getElementById('wgo').click();
      collectNotes(notes);
    }
    return done(null, notes);
  }
  function collectNotes(notes) {
    const t = noEmoji((D.getElementById('wmsg') || {}).textContent || '');
    (t.match(/\(([^)]{8,})\)/g) || []).forEach(x => { const s = x.slice(1, -1); if (!notes.includes(s)) notes.push(s); });
  }
  function done(err, notes = []) {
    const out = D.getElementById('wsout');
    busy(false);
    if (err || !out.innerHTML.trim()) {
      const t = err || noEmoji((D.getElementById('wmsg') || D.getElementById('drmsg') || {}).textContent || '') || 'לא נוצר דף. בדקו את ההגדרות.';
      msg(esc(t), 'warn'); pagesInfo(); fit(); return;
    }
    lastOk = true;
    out.dataset.what = 'מרכז ההדפסה · ' + (out.dataset.what || '');
    // שאלות בכל עמוד – חלוקה מחדש של דפי השאלות (לא של דף התשובות); אף פעם לא מצופפים: אם לא נכנס – עמוד חדש
    if (S.perPage > 0 && S.product !== 'drill') {
      const short = repage(S.perPage);
      if (short.length) notes.push(`בחלק מהעמודים נכנסו פחות מ-${S.perPage} שאלות, כי השאלות לא נכנסו בלי לצופף (${[...new Set(short)].join(', ')} בעמוד).`);
    }
    const pi = pagesInfo();
    if (S.pages > 0 && S.product !== 'drill' && pi.sheet !== S.pages) {
      const n = Math.round(D.getElementById('wsout').querySelectorAll('.ws-page:not(.wskey) .wsq, .ws-page:not(.wskey) .ex-q').length / Math.max(1, S.versions * (S.level === 'perlv' ? S.lvs.length : 1)));
      const sug = Math.max(1, Math.floor(n * S.pages / pi.sheet));
      notes.push(pi.sheet > S.pages
        ? `הדף יצא ${pi.sheet} עמודים ולא ${S.pages}. כדי להגיע ל-${S.pages}: אפשר להוריד לכ-${sug} שאלות${S.space === 'roomy' ? ', לבחור מקום רגיל לפתרון' : ''}${S.font === 'big' ? ', או גופן רגיל' : ''}.`
        : `הדף יצא ${pi.sheet} עמודים ולא ${S.pages}. אפשר להוסיף שאלות (בערך ${sug}) או לבחור מקום מורחב לפתרון.`);
    }
    msg(notes.map(esc).join('<br>'), notes.length ? 'warn' : '');
    fit();
  }
  function pagesInfo() {
    const out = D && D.getElementById('wsout');
    // רוב הדפים מחולקים לעמודים (.ws-pg); בחלק מהתבניות כל section הוא עמוד
    const cnt = sel => out ? [...out.querySelectorAll(sel)].reduce((a, s) => a + (s.querySelectorAll(':scope > .ws-pg').length || 1), 0) : 0;
    const all = cnt('section.ws-page'), key = cnt('section.ws-page.wskey');
    const v = Math.max(1, S.product === 'drill' || S.tpl ? 1 : S.versions * (S.level === 'perlv' ? Math.max(1, S.lvs.length) : 1));
    const sheet = Math.ceil((all - key) / v) || 0;
    $('pages').innerHTML = all ? `${all} עמודים <small>(${all - key} דפי שאלות${key ? `, ${key} דפי תשובות` : ''})</small>` : 'אין עדיין דף';
    $('print').disabled = !all; $('mPrint').disabled = !all;
    return { all, key, sheet };
  }
  // חלוקה מחדש לעמודים לפי מספר שאלות בעמוד – בלי לשנות שאלה, ציור או משבצות
  function repage(N) {
    const out = D.getElementById('wsout'), H = 270 * 96 / 25.4, short = [];
    out.classList.add('measure');
    out.querySelectorAll(':scope > section.ws-page:not(.wskey)').forEach(sec => {
      const pgs = [...sec.querySelectorAll(':scope > .ws-pg')]; if (!pgs.length) return;
      const isQW = el => el.matches('.wsqs, .ex-qs');
      const credit = pgs[0].querySelector('.wscredit');
      const first = [...pgs[0].children], wi = first.findIndex(isQW);
      if (wi < 0) return;
      const pre = first.slice(0, wi).filter(el => el !== credit);
      const qws = pgs.flatMap(p => [...p.children].filter(isQW)), proto = qws[0];
      const qs = qws.flatMap(w => [...w.children]);
      const foot = sec.querySelector('.wsfoot');
      sec.innerHTML = '';
      let page, box, n = 0;
      const np = () => { page = D.createElement('div'); page.className = 'ws-pg'; if (credit) page.appendChild(credit.cloneNode(true)); sec.appendChild(page); box = proto.cloneNode(false); page.appendChild(box); n = 0; };
      np(); pre.forEach(el => page.insertBefore(el, box));
      qs.forEach(q => {
        if (n >= N) np();
        box.appendChild(q); n++;
        if (n > 1 && page.getBoundingClientRect().height > H) { q.remove(); short.push(n - 1); np(); box.appendChild(q); n = 1; }
      });
      if (foot) { page.appendChild(foot); if (page.getBoundingClientRect().height > H) foot.remove(); }
    });
    out.classList.remove('measure');
    return short;
  }

  /* ---------------- תבניות מיוחדות: הטופס המקורי, כמו שאושר ---------------- */
  async function openTpl(t, fromProduct) {
    if (t.href) { window.open(t.href, '_blank', 'noopener'); return; }
    S.tpl = fromProduct ? null : t.id; card = true; stage.classList.add('card');
    $('tpl').hidden = false;
    $('tpl').innerHTML = `<b>${esc(t.name)}</b><span class="pc-note" style="margin:0">ההגדרות של התבנית נמצאות כאן, בתבנית המקורית. בלחיצה על "יצירה" שבה – הדף מופיע מתחת.</span>${fromProduct ? '' : `<button type="button" class="btn sec s" id="tplBack" style="margin-inline-start:auto">חזרה לדף הרגיל</button>`}`;
    if (!fromProduct) $('tplBack').onclick = () => closeTpl();
    msg('');
    if (t.site) {
      await loadEngine('site');
      try { W.cmpSheetHome(); } catch (e) { console.error(e); }
      gateNow = false; fit(); busy(false); render(); return;
    }
    await loadEngine('print');
    D.documentElement.classList.add('pc-card');
    setSel(D.getElementById('wv'), S.versions); chk('wkey', S.key !== 'none');
    const cards = [...D.querySelectorAll('#app > .noprint > .card.tform:not(.pk-common)')];
    const c = cards.find(x => t.card ? x.id === t.card : (x.querySelector('h2') || {}).textContent.includes(t.h2));
    cards.forEach(x => x.classList.toggle('pc-show', x === c));
    if (c) { const b = D.querySelector(`[data-pkgo="${c.dataset.pk}"]`); if (b) b.click(); }
    D.getElementById('wsout').innerHTML = ''; D.getElementById('wsout').className = '';
    gateNow = !!t.gate; genId++;
    watchOut();
    busy(false); pagesInfo(); fit(); render();
  }
  function closeTpl() {
    S.tpl = null; card = false; stage.classList.remove('card'); $('tpl').hidden = true;
    if (D) D.documentElement.classList.remove('pc-card');
    gateNow = true;
    if (engMode === 'site') { engMode = ''; ready = null; }
    render(); schedule(0);
  }
  let watched = null;
  function watchOut() {
    const out = D.getElementById('wsout'); if (!out || watched === out) return; watched = out;
    new W.MutationObserver(() => { if (card) { genId++; pagesInfo(); fit(); } }).observe(out, { childList: true });
  }

  /* ---------------- הדפסה: מגבלה יומית רק כאן ---------------- */
  let gateNow = true; const printed = new Set();
  const today = () => new Date().toLocaleDateString('en-CA');
  const used = () => { try { const u = JSON.parse(localStorage.getItem('math-ws-day')) || {}; return u.d === today() ? (u.n || 0) : 0; } catch (e) { return 0; } };
  const unlocked = () => { try { return !!W.bookOk(); } catch (e) { return false; } };
  function doPrint() {
    if (!D) return;
    const out = D.getElementById('wsout');
    const has = engMode === 'site' ? true : !!(out && out.innerHTML.trim());
    if (!has) { msg('אין עדיין דף להדפסה.', 'warn'); return; }
    const per = (DATA && DATA.perDay) || 2;
    if (gateNow && !printed.has(genId) && !unlocked()) {
      if (used() >= per) { lockMsg(per); return; }
      try { localStorage.setItem('math-ws-day', JSON.stringify({ d: today(), n: used() + 1 })); } catch (e) { /* לא חובה */ }
    }
    printed.add(genId);
    const touch = matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches;
    if (touch && engMode !== 'site') printWindow(); else { try { W.focus(); oPrint(); } catch (e) { printWindow(); } }
  }
  function lockMsg(per) {
    msg(`היום כבר הודפסו ${per} דפים במכשיר הזה. מחר אפשר להדפיס עוד – או להקליד קוד. (יצירה, שינוי הגדרות ותצוגה מקדימה – בלי הגבלה.)
      <div class="row"><input id="lkIn" type="password" inputmode="numeric" placeholder="קוד" autocomplete="off" aria-label="קוד"><button type="button" class="btn s" id="lkGo">פתיחה</button><span id="lkM"></span></div>`, 'warn');
    const go = () => {
      if (W.codeHash('book:' + $('lkIn').value.trim()) !== W.BOOK_HASH) { $('lkM').textContent = 'הקוד לא נכון.'; return; }
      try { localStorage.setItem('math-book-key', W.BOOK_HASH); } catch (e) { /* לא חובה */ }
      msg('הקוד נקלט. אפשר להדפיס.'); doPrint();
    };
    $('lkGo').onclick = go; $('lkIn').onkeydown = e => { if (e.key === 'Enter') go(); }; $('lkIn').focus();
  }
  // בטלפון ובטאבלט: מדפיסים מחלון נפרד (הדפסה של מסגרת לא תמיד עובדת שם). אותם עמודים ואותו עיצוב
  function printWindow() {
    const out = D.getElementById('wsout');
    try { W.trackSend('הדפסה', out.dataset.what || 'מרכז ההדפסה', true); } catch (e) { /* לא חובה */ }
    const styles = [...D.querySelectorAll('style, link[rel="stylesheet"]')].map(e => e.outerHTML).join('\n');
    const base = new URL('.', F.contentWindow.location.href).href;
    const w = window.open('', '_blank');
    if (!w) { msg('הדפדפן חסם חלון חדש. אפשר לאשר חלונות קופצים לאתר, או להדפיס ממחשב.', 'warn'); return; }
    w.document.open();
    w.document.write(`<!DOCTYPE html><html lang="he" dir="rtl" class="${D.documentElement.className}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${base}"><title>${esc(D.title)}</title>${styles}</head><body class="${D.body.className}"><div id="app" class="wrap"><div id="wsout" class="${out.className}">${out.innerHTML}</div></div><div class="pwm">${(D.querySelector('.pwm') || {}).innerHTML || ''}</div><script>addEventListener('load',function(){setTimeout(function(){print()},500)})<\/script></body></html>`);
    w.document.close();
  }

  /* ---------------- הממשק ---------------- */
  const area = (n, title, body, sum) => `<section class="pc-area"><h2><span class="n">${n}</span>${title}${sum ? `<span class="sum">${sum}</span>` : ''}</h2>${body}</section>`;
  const seg = (name, opts, cur) => `<div class="pc-seg" role="group">${opts.map(([v, t, dis]) => `<button type="button" data-set="${name}" data-v="${v}" aria-pressed="${String(cur) === String(v)}"${dis ? ' disabled' : ''}>${t}</button>`).join('')}</div>`;
  const tog = (name, label, on) => `<label class="pc-tog"><input type="checkbox" data-tog="${name}"${on ? ' checked' : ''}><span class="sw"></span>${label}</label>`;
  const num = (name, v, min, max) => `<span class="pc-num"><button type="button" data-step="${name}" data-d="-1" aria-label="פחות">−</button><input type="number" inputmode="numeric" data-num="${name}" value="${v}" min="${min}" max="${max}" aria-label="מספר"><button type="button" data-step="${name}" data-d="1" aria-label="יותר">+</button></span>`;
  const item = (attrs, on, text, meta, radio) => `<button type="button" class="pc-item${radio ? ' radio' : ''}" ${attrs} aria-pressed="${!!on}"><span class="bx">${ic('check')}</span><span class="t">${text}</span>${meta ? `<span class="m">${meta}</span>` : ''}</button>`;
  const adv = (id, body, label = 'אפשרויות נוספות') => `<details class="pc-adv" data-adv="${id}"${S.adv[id] ? ' open' : ''}><summary>${ic('chevD', 's')}${label}</summary>${body}</details>`;
  const catName = id => (DATA.cats.find(c => c.id === id) || {}).name || '';

  function contentArea() {
    const P = S.product;
    if (P === 'booklet') return area(1, 'תוכן', '<p class="pc-note">בחוברת בוחרים כמה שאלות מכל נושא בתוך טופס החוברת (בתצוגה). החוברת נפתחת בקוד, ונשמרת עם קוד ליצירה חוזרת של אותה חוברת בדיוק.</p>');
    const cats = DATA.cats.filter(c => (P === 'drill' ? DATA.drills : DATA.topics).some(t => t.cat === c.id) || TPL.some(t => t.cat === c.id));
    if (!cats.some(c => c.id === S.cat)) S.cat = cats[0].id;
    const sel = P === 'drill' ? S.drills : S.topics;
    const cnt = c => sel.filter(id => ((P === 'drill' ? DATA.drills : DATA.topics).find(t => t.id === id) || {}).cat === c).length;
    const tabs = `<div class="pc-cats" role="tablist">${cats.map(c => `<button type="button" role="tab" data-cat="${c.id}" aria-pressed="${c.id === S.cat}" style="--c:var(--c-${{ nat: 'sand', dec: 'teal', frac: 'blue', geo: 'sage', sol: 'teal', pct: 'clay', data: 'stone', word: 'wheat', exc: 'stone' }[c.id] || 'blue'})"><span class="sw"></span>${esc(c.name)}${cnt(c.id) ? `<span class="k">${cnt(c.id)}</span>` : ''}</button>`).join('')}</div>`;
    let body = '';
    if (P === 'exam') body += item('data-general="1"', S.general, 'מבחן כללי – כל נושאי הכיתה', '20 שאלות, כמו המבדק', true) + '<div style="height:6px"></div>';
    if (!(P === 'exam' && S.general)) {
      const picked = sel.map(id => (P === 'drill' ? DATA.drills : DATA.topics).find(t => t.id === id)).filter(Boolean);
      if (picked.length) body += `<div class="pc-picked">${picked.map(t => `<button type="button" class="pc-chip" data-${P === 'drill' ? 'drill' : 'topic'}="${t.id}" aria-label="הסרת ${esc(t.name)}">${esc(t.name)} ${ic('x')}</button>`).join('')}</div>`;
      body += tabs;
      if (P === 'drill') {
        const ds = DATA.drills.filter(d => d.cat === S.cat);
        body += ds.length ? `<div class="pc-list">${ds.map(d => item(`data-drill="${d.id}"`, S.drills.includes(d.id), esc(d.name))).join('')}</div>` : '<p class="pc-note">בקטגוריה הזו אין דף תרגילים בלבד. אפשר לבחור "דף תרגול" עם "תרגילים בלבד".</p>';
      } else {
        const ts = DATA.topics.filter(t => t.cat === S.cat);
        body += ts.length ? `<div class="pc-list">${ts.map(t => item(`data-topic="${t.id}"`, S.topics.includes(t.id), esc(t.name), packOf(t.id) ? 'לפי מיומנויות' : '') + (S.topics.includes(t.id) && packOf(t.id) ? packHTML(packOf(t.id)) : '')).join('')}</div>` : '<p class="pc-note">בקטגוריה הזו אין נושאים לדף תרגול – רק התבניות שלמטה.</p>';
      }
      const tp = TPL.filter(t => t.cat === S.cat);
      if (tp.length) body += `<div class="pc-h3">תבניות נוספות ב${esc(catName(S.cat))}</div><div class="pc-list">${tp.map(t => `<button type="button" class="pc-item go" data-tpl="${t.id}" aria-pressed="${S.tpl === t.id}"><span class="t">${esc(t.name)}${t.d ? `<br><span class="m">${esc(t.d)}</span>` : ''}</span>${ic(t.href ? 'fwd' : 'chevL', 's end')}</button>`).join('')}</div>`;
    }
    const n = P === 'drill' ? S.drills.length : P === 'exam' && S.general ? 'כל הנושאים' : S.topics.length;
    return area(1, 'תוכן', body, typeof n === 'number' ? (n ? `נבחרו ${n}` : 'לא נבחר') : n);
  }
  function packHTML(pk) {
    const sk = skillsOf(pk.topic), o = pOpt(pk.topic);
    const row = k => item(`data-skill="${pk.topic}:${k.id}"`, sk.includes(k.id), esc(k.name));
    const list = pk.groups ? pk.groups.map(g => `<details${g.ids.some(id => sk.includes(id)) || S.adv['g' + pk.topic + g.name] ? ' open' : ''} data-adv="g${pk.topic}${esc(g.name)}"><summary>${ic('chevD', 's')}${esc(g.name)} <span class="m">(${g.ids.length})</span></summary><div class="pc-list">${g.ids.map(id => row(pk.skills.find(k => k.id === id))).join('')}</div></details>`).join('') : `<div class="pc-list">${pk.skills.map(row).join('')}</div>`;
    const more = `<div class="pc-row"><span class="lb">תזכורת</span><select class="pc-sel" data-popt="${pk.topic}:tip">${pk.tips.filter(([v]) => v !== 'none').map(([v, t]) => `<option value="${v}"${o.tip === v ? ' selected' : ''}>${esc(noEmoji(t))}</option>`).join('')}</select></div>
      ${sk.length > 1 && pk.typed ? `<div class="pc-row"><span class="lb">כמה מיומנויות</span>${seg('popt:' + pk.topic + ':order', [['alt', 'לסירוגין'], ['block', 'גוש לכל מיומנות']], o.order)}</div>` : ''}
      ${tog('popt:' + pk.topic + ':fig', 'המחשה ליד תרגילי הרמה הקלה', o.fig)}
      ${pk.typed ? tog('popt:' + pk.topic + ':est', 'משימת סבירות אחת בדף התרגול', o.est) : ''}`;
    return `<div class="pc-sub"><h4>מיומנויות – ${esc(pk.title)}</h4>${item(`data-skall="${pk.topic}"`, sk.length === pk.skills.length, 'כל המיומנויות (תרגול מעורב)')}${list}${adv('pk' + pk.topic, more, 'הגדרות המיומנויות')}</div>`;
  }
  function productArea() {
    const tiles = PROD.filter(p => prodOk(p.id)).map(p => `<button type="button" class="pc-prod" data-prod="${p.id}" aria-pressed="${S.product === p.id && !S.tpl}">${ic(p.i)}<span>${p.name}</span><small>${p.d}</small></button>`).join('');
    const note = S.topics.includes('frac') ? '' : '<p class="pc-note">דף חשיבה ודף משולב – כשבוחרים שברים (לפי מיומנויות). בנושאים נוספים ייבנו בהדרגה.</p>';
    return area(2, 'סוג התוצר', `<div class="pc-prods">${tiles}</div>${S.product === 'booklet' || S.product === 'drill' ? '' : note}`);
  }
  function levelArea() {
    const P = S.product;
    if (P === 'drill' || P === 'booklet' || (P === 'exam' && S.general)) return '';
    const opts = LV.filter(([v]) => !(v === 'mixlv' && isPackOnly())).map(([v, t]) => [v, t]);
    let b = `<div class="pc-row">${seg('level', opts, S.level)}</div>`;
    if (S.level === 'mixlv' || S.level === 'perlv') b += `<div class="pc-row"><span class="lb">${S.level === 'perlv' ? 'אילו רמות?' : 'אילו רמות לשלב?'}</span><div class="pc-seg">${[1, 2, 3].map(l => `<button type="button" data-lv="${l}" aria-pressed="${S.lvs.includes(l)}">רמה ${l}</button>`).join('')}</div></div>`;
    b += `<p class="pc-note">${{ 1: 'רמה 1 – עיקרון אחד, בסיסי.', 2: 'רמה 2 – קשרים, הפוך ובחירת דרך.', 3: 'רמה 3 – הסקה, הכללה וחשיבה מורכבת (לא מספרים גדולים יותר).', mix: 'מדורג – בדף אחד, מהקל אל הקשה.', mixlv: 'שילוב רמות – שאלות מהרמות שנבחרו, בסדר מעורב.', perlv: 'דף לכל רמה – בלחיצה אחת דף נפרד לכל רמה, כל אחד עם כותרת ודף תשובות משלו. הרמות אינן מסלול חובה.' }[S.level] || ''}</p>`;
    if (P === 'exam') {
      const man = S.split === 'manual' && S.topics.length > 1 && !isPackOnly();
      b += `<div class="pc-split">${man ? '' : `<span>תרגילים טכניים</span>${num('tech', S.tech, 0, 40)}`}<span>שאלות מילוליות</span>${num('examWord', S.examWord, 0, 10)}</div>`;
      if (S.topics.includes('frac')) b += tog('examThink', 'משימות חשיבה בסוף (שברים – לפי המאגר)', S.examThink);
    } else if (P !== 'think') {
      b += `<div class="pc-row"><span class="lb">הרכב השאלות</span><select class="pc-sel" data-sel="comp">${[['auto', 'מעורב – תרגילים ושאלות מילוליות'], ['0', 'תרגילים בלבד'], ['only', 'שאלות מילוליות בלבד'], ...[1, 2, 3, 4, 5, 6, 8, 10].map(n => [String(n), `תרגילים ועוד ${n} שאלות מילוליות בסוף`])].map(([v, t]) => `<option value="${v}"${S.comp === v ? ' selected' : ''}>${t}</option>`).join('')}</select></div>`;
    }
    if (S.topics.length > 1 && !isPackOnly() && P !== 'think') {
      b += `<div class="pc-row"><span class="lb">חלוקה בין הנושאים</span>${seg('split', [['auto', 'אוטומטית ומאוזנת'], ['manual', 'ידנית']], S.split)}</div>`;
      if (S.split === 'manual') b += `<div class="pc-split">${S.topics.map(t => `<span>${esc((DATA.topics.find(x => x.id === t) || {}).name)}</span>${num('manual:' + t, S.manual[t] == null ? 0 : S.manual[t], 0, 30)}`).join('')}</div><p class="pc-note">סך הכול ${S.topics.reduce((a, t) => a + (S.manual[t] || 0), 0)} ${P === 'exam' ? 'תרגילים (השאלות המילוליות – בנוסף)' : 'שאלות'}.</p>`;
    }
    b += adv('lv', tog('whole', 'מספרים שלמים בלבד (בלי שברים, עשרוניים ואחוזים)', S.whole));
    return area(3, 'רמת קושי והרכב', b);
  }
  function amountArea() {
    const P = S.product;
    if (P === 'booklet') return '';
    let b = '';
    if (P === 'drill') b += `<div class="pc-row"><span class="lb">תרגילים בכל תחום</span><select class="pc-sel" data-sel="drillN">${DATA.drillCounts.map(n => `<option${n === S.drillN ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`;
    else if (P !== 'exam' && !(S.split === 'manual' && S.topics.length > 1 && !isPackOnly() && P !== 'think')) b += `<div class="pc-row"><span class="lb">${P === 'think' ? 'משימות' : 'שאלות'}</span>${num('count', S.count, 1, P === 'think' ? 6 : 50)}</div>`;
    b += `<div class="pc-row"><span class="lb">נוסחים</span>${seg('versions', [[1, 'נוסח אחד'], [2, '2 נוסחים'], [3, '3 נוסחים']], S.versions)}</div>`;
    if (P !== 'drill') {
      const exStyle = P === 'exam' || S.style === 'exam';
      b += adv('amt', `
        <div class="pc-row"><span class="lb">שאלות בכל עמוד</span><select class="pc-sel" data-sel="perPage"><option value="0"${!S.perPage ? ' selected' : ''}>אוטומטי (איזון)</option>${[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => `<option value="${n}"${S.perPage === n ? ' selected' : ''}>עד ${n}</option>`).join('')}</select></div>
        <div class="pc-row"><span class="lb">מספר עמודים רצוי</span><select class="pc-sel" data-sel="pages"><option value="0"${!S.pages ? ' selected' : ''}>לא חשוב</option>${[1, 2, 3, 4, 5, 6].map(n => `<option value="${n}"${S.pages === n ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="pc-row"><span class="lb">מקום לפתרון</span>${seg('space', [['normal', 'רגיל'], ['roomy', 'מורחב']], S.space)}</div>
        <div class="pc-row"><span class="lb">גודל גופן</span>${seg('font', [['normal', 'רגיל'], ['big', 'גדול']], S.font)}</div>
        ${exStyle ? '<p class="pc-note">במבחן ובתצורת מבחן המשבצות לפתרון תמיד מופיעות, ולא מכווצים אותן.</p>' : tog('twoCol', 'תרגילים קצרים בשני טורים (בלי משבצות ליד כל שאלה)', S.twoCol)}
        <p class="pc-note">הדף אף פעם לא מצופף: שאלה לא נחתכת בין עמודים, ציור נשאר עם השאלה. אם משהו לא נכנס – תופיע הצעה.</p>`, 'כמות בעמוד, גופן ומקום לפתרון');
    }
    return area(4, 'כמות ופריסה', b);
  }
  function designArea() {
    const P = S.product;
    if (P === 'booklet') return '';
    let b = '';
    if (P !== 'exam' && P !== 'drill') b += `<div class="pc-row"><span class="lb">עיצוב הדף</span>${seg('style', [['pastel', 'פסטל'], ['note', 'מחברת'], ['exam', 'תצורת מבחן']], S.style)}</div>${S.style === 'exam' ? '<p class="pc-note">דף תרגול בתצורת מבחן: מספור, משבצות לדרך הפתרון ומקום לתשובה. זה עדיין דף תרגול – לא מבחן (בלי ניקוד והוראות).</p>' : ''}`;
    b += tog('bw', 'שחור-לבן – חיסכון בדיו (אותו מבנה בדיוק)', S.bw);
    if (P !== 'drill') b += `<div class="pc-row"><span class="lb">כותרת</span><input class="pc-in" data-text="title" value="${esc(S.title)}" placeholder="${esc(DATA ? (P === 'exam' ? 'מבחן במתמטיקה' : defaultTitle()) : '')}"></div>`;
    if (P === 'exam') b += tog('points', 'ניקוד לכל שאלה (סה״כ 100) ושדה ציון', S.points) + tog('instr', 'הוראות בראש המבחן', S.instr);
    else if (P !== 'drill') b += tog('tips', 'תזכורת בראש הדף', S.tips);
    b += `<div class="pc-row"><span class="lb">דף תשובות</span>${seg('key', P === 'drill' ? [['none', 'בלי'], ['final', 'עם תשובות']] : [['none', 'בלי'], ['final', 'תשובות סופיות'], ['full', 'עם דרך הפתרון']], S.key)}</div>`;
    if (S.topics.includes('frac') || S.topics.includes('divfr')) b += '<p class="pc-note">בדפים לפי מיומנויות דף התשובות כולל תמיד שלבים, ובמשימות חשיבה – פתרון לדוגמה ומחוון.</p>';
    return area(5, 'עיצוב והגדרות נוספות', b);
  }
  function tplArea() {
    const t = TPL.find(x => x.id === S.tpl);
    return area(1, 'תבנית מיוחדת', `<p class="pc-note">${esc(t ? t.name : '')} – ההגדרות של התבנית מופיעות בתצוגה, כמו שאושרו.${t && t.site ? '' : ' כאן אפשר לבחור נוסחים ודף תשובות.'}</p>
      ${t && t.site ? '' : `<div class="pc-row"><span class="lb">נוסחים</span>${seg('versions', [[1, 'נוסח אחד'], [2, '2 נוסחים'], [3, '3 נוסחים']], S.versions)}</div>
      ${tog('tkey', 'דף תשובות', S.key !== 'none')}`}
      <div class="pc-row"><button type="button" class="btn sec s" data-act="closeTpl">חזרה להגדרות הדף הרגיל</button></div>`);
  }
  function render() {
    if (!DATA) return;
    if (!prodOk(S.product)) S.product = 'practice';
    if (S.level === 'mixlv' && isPackOnly()) S.level = 'mix';
    const el = $('set'), y = el.scrollTop;
    el.innerHTML = S.tpl ? tplArea() : contentArea() + productArea() + levelArea() + amountArea() + designArea();
    el.scrollTop = y;
    save();
  }

  /* ---------------- אירועים ---------------- */
  const regen = () => { render(); if (!S.tpl) schedule(); };
  const toggleIn = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
  $('set').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.cat) { S.cat = d.cat; render(); return; }
    if (d.topic) { S.topics = toggleIn(S.topics, d.topic); S.general = false; if (S.topics.length && !S.topics.some(t => (DATA.topics.find(x => x.id === t) || {}).cat === S.cat) && !b.classList.contains('pc-chip')) S.cat = (DATA.topics.find(x => x.id === d.topic) || {}).cat || S.cat; return regen(); }
    if (d.drill) { S.drills = toggleIn(S.drills, d.drill); return regen(); }
    if (d.general) { S.general = !S.general; return regen(); }
    if (d.skall) { const pk = packOf(d.skall); S.skills[d.skall] = skillsOf(d.skall).length === pk.skills.length ? [pk.skills[0].id] : pk.skills.map(k => k.id); return regen(); }
    if (d.skill) { const [t, id] = d.skill.split(':'); let s = toggleIn(skillsOf(t), id); if (!s.length) s = [id]; S.skills[t] = s; return regen(); }
    if (d.prod) {
      if (S.tpl) closeTplQuiet();
      S.product = d.prod;
      if (d.prod === 'drill' && !S.drills.length) S.drills = [DATA.drills.find(x => x.cat === S.cat) || DATA.drills[0]].map(x => x.id);
      if (d.prod === 'think') S.count = Math.min(S.count, 6);
      if (d.prod !== 'booklet' && card) { card = false; stage.classList.remove('card'); $('tpl').hidden = true; if (D) D.documentElement.classList.remove('pc-card'); }
      return regen();
    }
    if (d.tpl) { const t = TPL.find(x => x.id === d.tpl); if (t) openTpl(t); return; }
    if (d.act === 'closeTpl') { closeTpl(); return; }
    if (d.lv) { const l = Number(d.lv); S.lvs = toggleIn(S.lvs, l).sort(); if (!S.lvs.length) S.lvs = [l]; return regen(); }
    if (d.step) { const inp = $('set').querySelector(`[data-num="${d.step}"]`); const v = Math.min(Number(inp.max), Math.max(Number(inp.min), (Number(inp.value) || 0) + Number(d.d))); setNum(d.step, v); return regen(); }
    if (d.set) {
      const v = d.v;
      if (d.set.startsWith('popt:')) { const [, t, k] = d.set.split(':'); S.packOpt[t] = Object.assign(pOpt(t), { [k]: v }); return regen(); }
      if (d.set === 'versions') { S.versions = Number(v); if (S.tpl) { setSel(D.getElementById('wv'), S.versions); render(); return; } return regen(); }
      S[d.set] = v;
      return regen();
    }
  });
  const setNum = (k, v) => { if (k.startsWith('manual:')) S.manual[k.slice(7)] = v; else S[k] = v; };
  $('set').addEventListener('change', e => {
    const t = e.target, d = t.dataset;
    if (d.tog) {
      if (d.tog.startsWith('popt:')) { const [, tp, k] = d.tog.split(':'); S.packOpt[tp] = Object.assign(pOpt(tp), { [k]: t.checked }); return regen(); }
      if (d.tog === 'tkey') { S.key = t.checked ? 'final' : 'none'; chk('wkey', t.checked); save(); return; }
      S[d.tog] = t.checked; return regen();
    }
    if (d.num) { const v = Math.min(Number(t.max), Math.max(Number(t.min), Math.round(Number(t.value) || 0))); setNum(d.num, v); return regen(); }
    if (d.sel) { S[d.sel] = ['perPage', 'pages', 'drillN'].includes(d.sel) ? Number(t.value) : t.value; return regen(); }
    if (d.popt) { const [tp, k] = d.popt.split(':'); S.packOpt[tp] = Object.assign(pOpt(tp), { [k]: t.value }); return regen(); }
    if (d.text) { S[d.text] = t.value; return regen(); }
  });
  $('set').addEventListener('toggle', e => { const d = e.target.closest && e.target.closest('details[data-adv]'); if (d && e.target === d) { S.adv[d.dataset.adv] = d.open; save(); } }, true);
  function closeTplQuiet() { S.tpl = null; card = false; stage.classList.remove('card'); $('tpl').hidden = true; if (D) D.documentElement.classList.remove('pc-card'); gateNow = true; if (engMode === 'site') { engMode = ''; ready = null; } }

  $('again').onclick = () => { if (S.tpl || (S.product === 'booklet')) { msg('בתבנית הזו יוצרים גרסה חדשה בכפתור היצירה שבטופס.', ''); return; } schedule(0); };
  $('print').onclick = doPrint; $('mPrint').onclick = doPrint;
  $('mPrev').onclick = () => $('prev').scrollIntoView({ behavior: 'smooth' });

  /* ---------------- התחלה ---------------- */
  (async () => {
    busy(true);
    await loadEngine('print');
    const ut = (U.get('topic') || '').split(',').filter(id => DATA.topics.some(t => t.id === id));
    if (ut.length) { S.topics = ut; S.cat = DATA.topics.find(t => t.id === ut[0]).cat; S.general = false; if (!prodOk(S.product) || S.product === 'drill' || S.product === 'booklet') S.product = 'practice'; }
    if (U.get('cat') && DATA.cats.some(c => c.id === U.get('cat'))) S.cat = U.get('cat');
    if (U.get('product') && PROD.some(p => p.id === U.get('product'))) S.product = U.get('product');
    if (U.get('from') === 'teacher') $('pcBack').textContent = 'חזרה';
    if (!S.drills.length) S.drills = [DATA.drills[0].id];
    render();
    await generate();
  })();
  window.PC = { S, generate, render, get W() { return W; }, get D() { return D; }, doPrint, points };
})();
