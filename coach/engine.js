/* =========================================================
   מנוע: מבדק אבחון מסתגל, בניית מסלול, קוד המשך, שמירה ודיווח
   לא יודע כלום על שברים – מקבל את הקורס כנתונים.
   ========================================================= */
(function () {
  const C = window.COACH = window.COACH || {};
  const VER = '1.1';
  C.VER = VER;

  /* ---------- מבדק אבחון ----------
     מיומנות "נשלטת" אחרי 2 תשובות נכונות, "עדיין לא" אחרי 2 שגויות או "עוד לא למדתי",
     "לא ברור" אם אחרי 3 שאלות אין הכרעה. תשובה נכונה עם "ניחשתי" לא נספרת.
     שאלה נכונה אחת מספיקה כשמיומנות גבוהה יותר (7) כבר נשלטת. */
  function diagStart(course) {
    return { ev: {}, status: {}, asked: [], tags: {}, course: course.id };
  }
  const evOf = (ds, s) => (ds.ev[s] = ds.ev[s] || { c: 0, w: 0, n: 0 });
  const decided = (ds, s) => !!ds.status[s];
  function settle(ds) {
    [5, 6].forEach(s => {
      const e = ds.ev[s];
      if (!decided(ds, s) && e && e.n === 1 && e.c === 1 && ds.status[7] === 'mastered') ds.status[s] = 'mastered';
    });
  }
  function nextSkill(ds) {
    settle(ds);
    const n = s => evOf(ds, s).n;
    if (!decided(ds, 5) && n(5) === 0) return 5;
    if (!decided(ds, 7) && n(7) === 0) return 7;
    if (!decided(ds, 7)) return 7;
    settle(ds);
    if (!decided(ds, 5)) return 5;
    if (ds.status[5] === 'notyet' && !decided(ds, 6)) ds.status[6] = 'notyet';
    if (!decided(ds, 6)) return 6;
    settle(ds);
    const top = [5, 6, 7].every(s => ds.status[s] === 'mastered');
    if (top) {
      if (!decided(ds, 8)) return 8;
      [1, 2, 3, 4].forEach(s => { ds.status[s] = 'mastered'; ds.inferred = true; });
      return null;
    }
    if (!decided(ds, 4)) return 4;
    if (ds.status[4] === 'mastered') { [1, 2, 3].forEach(s => { ds.status[s] = 'mastered'; }); return null; }
    for (const s of [1, 2, 3]) if (!decided(ds, s)) return s;
    return null;
  }
  const MAX_Q = 12; // תקרה: מבדק קצר גם כשהתשובות לא חד-משמעיות
  function diagNext(ds, course) {
    let s = nextSkill(ds);
    if (s != null && ds.asked.length >= MAX_Q) {
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
  // הטעות העיקרית בהרחבה – קובעת את תוכן יחידת החיזוק
  function mainTag(tags) {
    if ((tags.additive || 0) > 0) return 'additive';
    if ((tags.denomOnly || 0) > 0) return 'denomOnly';
    return 'none';
  }

  /* ---------- מסלול ---------- */
  const RANK = { notyet: 0, unclear: 1, unknown: 2, mastered: 3 };
  function buildPath(course, skills, done) {
    const path = [];
    course.UNITS.forEach(u => {
      if (done && done[u.id]) { path.push({ id: u.id, ver: 'teach' }); return; }
      if (u.deep) {
        if ([5, 6, 7].every(s => skills[s] === 'mastered')) path.push({ id: u.id, ver: 'deep', optional: true });
        return;
      }
      const worst = u.skills.map(s => skills[s] || 'unknown').sort((a, b) => RANK[a] - RANK[b])[0];
      if (worst === 'mastered') return;
      path.push({ id: u.id, ver: worst === 'notyet' ? 'teach' : worst === 'unclear' ? 'reinforce' : (u.id === 'u7' ? 'teach' : 'reinforce') });
    });
    return path;
  }

  /* ---------- קוד המשך: 8 תווים, בלי שם ובלי פרטים אישיים ---------- */
  const AB = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const ST = ['unknown', 'notyet', 'unclear', 'mastered'];
  const TG = ['none', 'additive', 'denomOnly'];
  const BADGES = ['persist', 'fix', 'explain', 'master'];
  function chk(p) { let h = 7; while (p > 0) { h = (h * 31 + p % 32) % 128; p = Math.floor(p / 32); } return h; }
  function encode(st, course) {
    let p = 1; // גרסת הקוד
    for (let s = 1; s <= 8; s++) p = p * 4 + Math.max(0, ST.indexOf(st.skills[s] || 'unknown'));
    course.UNITS.forEach(u => { p = p * 2 + (st.done[u.id] ? 1 : 0); });
    BADGES.forEach(b => { p = p * 2 + (st.badges[b] ? 1 : 0); });
    p = p * 4 + Math.max(0, TG.indexOf(st.tag || 'none'));
    let v = p * 128 + chk(p), out = '';
    for (let i = 0; i < 8; i++) { out = AB[v % 32] + out; v = Math.floor(v / 32); }
    return out.slice(0, 4) + '-' + out.slice(4);
  }
  function decode(code, course) {
    const s = String(code || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
    if (!/^[0-9A-Z]{8}$/.test(s)) return null;
    let v = 0;
    for (const ch of s) { const d = AB.indexOf(ch); if (d < 0) return null; v = v * 32 + d; }
    const c = v % 128; let p = Math.floor(v / 128);
    if (chk(p) !== c) return null;
    const st = { skills: {}, done: {}, badges: {} };
    st.tag = TG[p % 4] || 'none'; p = Math.floor(p / 4);
    [...BADGES].reverse().forEach(b => { if (p % 2) st.badges[b] = true; p = Math.floor(p / 2); });
    [...course.UNITS].reverse().forEach(u => { if (p % 2) st.done[u.id] = true; p = Math.floor(p / 2); });
    for (let k = 8; k >= 1; k--) { st.skills[k] = ST[p % 4]; p = Math.floor(p / 4); }
    if (p !== 1) return null;
    return st;
  }

  /* ---------- שמירה לזמן המפגש בלבד (לא בין מחשבים) ---------- */
  const KEY = 'coach:equiv';
  const store = {
    load() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } },
    save(st) { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* לא חובה */ } },
    clear() { try { sessionStorage.removeItem(KEY); } catch (e) { /* לא חובה */ } }
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
      const body = new URLSearchParams({ [TRACK.f.device]: 'מאמן v' + VER, [TRACK.f.grade]: '6', [TRACK.f.name]: name || '', [TRACK.f.action]: 'מאמן: ' + action, [TRACK.f.detail]: String(detail).slice(0, 200) });
      fetch(TRACK.form, { method: 'POST', mode: 'no-cors', body, keepalive: true }).catch(() => {});
    } catch (e) { /* לא חובה */ }
  }
  const MARK = { mastered: '✓', notyet: '✗', unclear: '?', unknown: '–' };
  const skillLine = skills => [1, 2, 3, 4, 5, 6, 7, 8].map(s => s + MARK[skills[s] || 'unknown']).join(' ');

  C.E = { diagStart, diagNext, diagAnswer, mainTag, buildPath, encode, decode, store, teacher, track, skillLine, URLP, BADGES };
})();
