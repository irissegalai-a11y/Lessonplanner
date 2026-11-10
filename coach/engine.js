/* =========================================================
   מנוע: מבדק אבחון מסתגל, בניית מסלול, קוד המשך, שמירה ודיווח
   לא יודע כלום על הנושא – מקבל כל קורס כנתונים (course.DIAG, UNITS, MAIN_TAGS…).
   ========================================================= */
(function () {
  const C = window.COACH = window.COACH || {};
  const VER = '3.9';
  C.VER = VER;
  // סדר קבוע! המיקום ברשימה נכנס לקוד ההמשך. קורס חדש מוסיפים רק בסוף.
  C.COURSE_IDS = ['equiv', 'dec', 'pct', 'fracop', 'area', 'mult', 'frac'];

  /* ---------- מבדק אבחון ----------
     מיומנות "נשלטת" אחרי 2 תשובות נכונות, "עדיין לא" אחרי 2 שגויות או "עוד לא למדתי",
     "לא ברור" אם אחרי 3 שאלות אין הכרעה. תשובה נכונה עם "ניחשתי" לא נספרת.
     course.DIAG = { top, apply, mid, base, infer, deps }:
     top – מיומנויות העוגן (נבדקות ראשונות, לפי הסדר); apply – יישום (רק אם כל העוגן נשלט);
     mid – שלב ב'; base – יסודות. infer[s] – תשובה נכונה אחת מספיקה אם אחת מאלה כבר נשלטת.
     deps[s] – אם אחת מאלה "עדיין לא", גם s "עדיין לא" בלי לשאול. */
  function diagStart(course) {
    return { ev: {}, status: {}, asked: [], tags: {}, course: course.id };
  }
  const evOf = (ds, s) => (ds.ev[s] = ds.ev[s] || { c: 0, w: 0, n: 0 });
  function nextSkill(ds, course) {
    const D = course.DIAG, st = s => ds.status[s];
    const settle = () => Object.entries(D.infer || {}).forEach(([s, by]) => {
      const e = ds.ev[s];
      if (!st(s) && e && e.n === 1 && e.c === 1 && by.some(b => st(b) === 'mastered')) ds.status[s] = 'mastered';
    });
    const depFail = s => (D.deps && D.deps[s] || []).some(b => st(b) === 'notyet');
    const walk = list => {
      for (const s of list) {
        settle();
        if (!st(s) && depFail(s)) ds.status[s] = 'notyet';
        if (!st(s)) return s;
      }
      return null;
    };
    let s = walk(D.top);
    if (s != null) return s;
    if (D.top.every(x => st(x) === 'mastered')) {
      if (D.apply && !st(D.apply)) return D.apply;
      D.mid.concat(D.base).forEach(x => { if (!st(x)) ds.status[x] = 'mastered'; });
      return null;
    }
    s = walk(D.mid);
    if (s != null) return s;
    if (D.mid.length && D.mid.every(x => st(x) === 'mastered')) { D.base.forEach(x => { if (!st(x)) ds.status[x] = 'mastered'; }); return null; }
    return walk(D.base);
  }
  const MAX_Q = 12; // תקרה: מבדק קצר גם כשהתשובות לא חד-משמעיות (קורס יכול לקבוע DIAG.maxQ)
  function diagNext(ds, course) {
    let s = nextSkill(ds, course);
    if (s != null && ds.asked.length >= (course.DIAG.maxQ || MAX_Q)) {
      Object.keys(ds.ev).forEach(k => { if (!ds.status[k] && ds.ev[k].n > 0) ds.status[k] = 'unclear'; });
      s = null;
    }
    if (s == null) return null;
    const id = course.DIAG_ORDER[s][evOf(ds, s).n];
    return course.D[id];
  }
  // res: { correct, tag, sure: 'sure'|'unsure'|'guess', skip }
  function diagAnswer(ds, item, res) {
    const s = item.skill, e = evOf(ds, s);
    e.n++;
    ds.asked.push({ id: item.id, ok: !!res.correct, tag: res.tag || '', sure: res.sure || '', skip: !!res.skip });
    if (res.tag) ds.tags[res.tag] = (ds.tags[res.tag] || 0) + 1;
    if (res.skip) { ds.status[s] = 'notyet'; return; }
    if (res.correct && res.sure !== 'guess') e.c++;
    else if (!res.correct) e.w++;
    if (e.c >= 2) ds.status[s] = 'mastered';
    else if (e.w >= 2) ds.status[s] = 'notyet';
    else if (e.n >= 3) ds.status[s] = 'unclear';
  }
  // הטעות העיקרית – קובעת את תוכן החיזוק ואת משפט הפתיחה של המאמן
  function mainTag(course, tags) {
    return (course.MAIN_TAGS || ['none']).slice(1).find(t => (tags[t] || 0) > 0) || 'none';
  }

  /* ---------- מסלול ---------- */
  const RANK = { notyet: 0, unclear: 1, unknown: 2, mastered: 3 };
  function buildPath(course, skills, done) {
    const path = [];
    course.UNITS.forEach(u => {
      if (done && done[u.id]) { path.push({ id: u.id, ver: 'teach' }); return; }
      if (u.deep) {
        if (course.DIAG.top.every(s => skills[s] === 'mastered')) path.push({ id: u.id, ver: 'deep', optional: true });
        return;
      }
      const worst = u.skills.map(s => skills[s] || 'unknown').sort((a, b) => RANK[a] - RANK[b])[0];
      if (worst === 'mastered') return;
      path.push({ id: u.id, ver: worst === 'notyet' ? 'teach' : worst === 'unclear' ? 'reinforce' : (u.id === course.APPLY_UNIT ? 'teach' : 'reinforce') });
    });
    return path;
  }

  /* ---------- קוד המשך: 10 תווים (קורס + מצב), בלי שם ובלי פרטים אישיים ----------
     גרסה 3: עד 32 קורסים, 10 מיומנויות, 12 שיעורים (לפי מספר השיעור u1…u12, לא לפי סדר התצוגה).
     קודים ישנים: 8 תווים = שברים שקולים (גרסה 1); 9 תווים = גרסה 2. שניהם עדיין נקראים. */
  const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const ST = ['unknown', 'notyet', 'unclear', 'mastered'];
  const BADGES = ['persist', 'fix', 'explain', 'master'];
  function chk(p) { let h = 7; while (p > 0) { h = (h * 31 + p % 32) % 128; p = Math.floor(p / 32); } return h; }
  const tagsOf = course => (course.MAIN_TAGS || ['none']).concat(['none', 'none', 'none']).slice(0, 4);
  function packBody(p, st, course, nUnits) {
    for (let s = 1; s <= 8; s++) p = p * 4 + Math.max(0, ST.indexOf(st.skills[s] || 'unknown'));
    for (let i = 0; i < nUnits; i++) { const u = course.UNITS[i]; p = p * 2 + (u && st.done[u.id] ? 1 : 0); }
    BADGES.forEach(b => { p = p * 2 + (st.badges[b] ? 1 : 0); });
    return p * 4 + Math.max(0, tagsOf(course).indexOf(st.tag || 'none'));
  }
  function unpackBody(p, course, nUnits) {
    const st = { skills: {}, done: {}, badges: {} };
    st.tag = tagsOf(course)[p % 4] || 'none'; p = Math.floor(p / 4);
    [...BADGES].reverse().forEach(b => { if (p % 2) st.badges[b] = true; p = Math.floor(p / 2); });
    for (let i = nUnits - 1; i >= 0; i--) { const u = course.UNITS[i]; if (p % 2 && u) st.done[u.id] = true; p = Math.floor(p / 2); }
    for (let k = 8; k >= 1; k--) { st.skills[k] = ST[p % 4]; p = Math.floor(p / 4); }
    return { st, rest: p };
  }
  function encode(st, course) {
    let p = 3 * 32 + C.COURSE_IDS.indexOf(course.id);
    for (let s = 1; s <= 10; s++) p = p * 4 + Math.max(0, ST.indexOf(st.skills[s] || 'unknown'));
    for (let i = 1; i <= 12; i++) p = p * 2 + (st.done['u' + i] ? 1 : 0);
    BADGES.forEach(b => { p = p * 2 + (st.badges[b] ? 1 : 0); });
    p = p * 4 + Math.max(0, tagsOf(course).indexOf(st.tag || 'none'));
    let v = p * 32 + chk(p) % 32, out = '';
    for (let i = 0; i < 10; i++) { out = AB[v % 32] + out; v = Math.floor(v / 32); }
    return out.slice(0, 5) + '-' + out.slice(5);
  }
  function decode3(v) {
    const c = v % 32; let p = Math.floor(v / 32);
    if (chk(p) % 32 !== c) return null;
    const ids = C.COURSE_IDS;
    let q = p; const tagI = q % 4; q = Math.floor(q / 4);
    const badges = {}; [...BADGES].reverse().forEach(b => { if (q % 2) badges[b] = true; q = Math.floor(q / 2); });
    const done = {}; for (let i = 12; i >= 1; i--) { if (q % 2) done['u' + i] = true; q = Math.floor(q / 2); }
    const skills = {}; for (let k = 10; k >= 1; k--) { skills[k] = ST[q % 4]; q = Math.floor(q / 4); }
    const ci = q % 32, ver = Math.floor(q / 32);
    const course = C.courses[ids[ci]];
    if (ver !== 3 || !course) return null;
    return { courseId: course.id, skills, done, badges, tag: tagsOf(course)[tagI] || 'none' };
  }
  // מחזיר { courseId, ...מצב } או null
  function decode(code) {
    const s = String(code || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
    if (!/^[0-9A-Z]{8,10}$/.test(s)) return null;
    let v = 0;
    for (const ch of s) { const d = AB.indexOf(ch); if (d < 0) return null; v = v * 32 + d; }
    if (s.length === 10) return decode3(v);
    const c = v % 128; const p = Math.floor(v / 128);
    if (chk(p) !== c) return null;
    if (s.length === 8) { // גרסה 1: שברים שקולים
      const course = C.courses.equiv; if (!course) return null;
      const r = unpackBody(p, course, course.UNITS.length);
      return r.rest === 1 ? Object.assign(r.st, { courseId: 'equiv' }) : null;
    }
    // גרסה 2: ננסה לפי הקורס שבקוד
    const head = q => q; // לנוחות קריאה
    const tryCourse = id => { const course = C.courses[id]; if (!course) return null; const r = unpackBody(p, course, 8); return r.rest === head(2 * 16 + C.COURSE_IDS.indexOf(id)) ? Object.assign(r.st, { courseId: id }) : null; };
    for (const id of C.COURSE_IDS) { const r = tryCourse(id); if (r) return r; }
    return null;
  }

  /* ---------- שמירה לזמן המפגש בלבד (לא בין מחשבים) ---------- */
  const KEY = 'coach:state';
  const store = {
    load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    save(st) { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* לא חובה */ } },
    clear() { try { sessionStorage.removeItem(KEY); sessionStorage.removeItem('coach:equiv'); } catch (e) { /* לא חובה */ } }
  };

  /* ---------- תפקידים (אותם מפתחות כמו באתר התרגול) ---------- */
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const URLP = new URLSearchParams(location.search);
  const irisOk = () => lsGet('math-book-key') === 'e1050f14' || lsGet('math-teacher-key') === '3d9bf467';
  const staffOn = () => !irisOk() && lsGet('math-role') === 't' && lsGet('math-staff-key') === '1a9e025e';
  const teacher = () => (irisOk() || staffOn()) && lsGet('math-role') !== 's' && lsGet('math-preview') !== '1';

  /* ---------- דיווח לאתר הבקרה (אותו טופס כמו באתר התרגול) ---------- */
  const TRACK = { form: 'https://docs.google.com/forms/d/e/1FAIpQLScbU-3oB6Sx3hsec4cxoQQUWUfSnuvGH8X7DOKLR5hldhe6CA/formResponse',
    f: { device: 'entry.218291459', grade: 'entry.2065505054', name: 'entry.1804780443', action: 'entry.285567241', detail: 'entry.1501454704' } };
  function track(name, action, detail) {
    if (!TRACK.form || URLP.has('teacher') || URLP.has('notrack') || irisOk() || staffOn()) return;
    try {
      const body = new URLSearchParams({ [TRACK.f.device]: 'קורסים v' + VER, [TRACK.f.grade]: URLP.get('grade') || '', [TRACK.f.name]: name || '', [TRACK.f.action]: 'קורס: ' + action, [TRACK.f.detail]: String(detail).slice(0, 200) });
      fetch(TRACK.form, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => {});
    } catch (e) { /* לא חובה */ }
  }
  const MARK = { mastered: '✓', notyet: '✗', unclear: '?', unknown: '–' };
  const skillLine = (skills, course) => Object.keys(course.SKILLS).map(Number).filter(s => s <= 10).map(s => s + MARK[skills[s] || 'unknown']).join(' ');

  C.E = { diagStart, diagNext, diagAnswer, mainTag, buildPath, encode, decode, store, teacher, track, skillLine, URLP, BADGES };
})();
