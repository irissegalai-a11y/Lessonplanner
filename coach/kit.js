/* =========================================================
   ערכת עזר לכתיבת קורסים: בניית יחידה משני חלקים (הקניה + חיזוק),
   וקיצורים לציורים. נטען לפני קובצי הקורסים.
   ========================================================= */
(function () {
  const C = window.COACH = window.COACH || {};
  C.courses = C.courses || {};
  // יחידה: מטרה → הסברים → תרגול מונחה → מחברת → בדיקה (א', ב') → סיכום
  // חיזוק: מטרה → תזכורת (ההסבר הראשון) → תרגול → מחברת → בדיקה (ב', ג') → סיכום
  C.mk = function (u) {
    const teach = [{ step: 1, kind: 'goal', html: u.goal }]
      .concat(u.explain.map(e => Object.assign({ step: 2, kind: 'info' }, e)))
      .concat([{ step: 2, kind: 'practice', title: 'מתרגלים יחד', items: u.practice },
        Object.assign({ step: 3, kind: 'notebook' }, u.notebook),
        { step: 4, kind: 'check', sets: ['A', 'B'] }, { step: 5, kind: 'summary' }]);
    const reinforce = [{ step: 1, kind: 'goal', html: u.goalR || 'נחזק את הנושא: תזכורת קצרה, ותרגול עד שזה יושב טוב.' },
      Object.assign({ step: 2, kind: 'info' }, u.explain[0], { title: 'תזכורת' }),
      { step: 2, kind: 'practice', title: 'תרגול ממוקד', items: u.practice },
      Object.assign({ step: 3, kind: 'notebook' }, u.notebook),
      { step: 4, kind: 'check', sets: ['B', 'C'] }, { step: 5, kind: 'summary' }];
    return { teach, reinforce, sets: { A: u.A, B: u.B, C: u.C }, alt: u.alt, simpler: u.simpler, waiting: u.waiting || [], skill: u.skill, learned: u.learned, did: u.did };
  };
  // שיעור במבנה החדש (v2): מבינים → לומדים את הכלל → מתרגלים (רמות + מחברת) → מראים שליטה → מה למדתי
  // u.quick – 3 שאלות לבדיקה הקצרה (מסלול מהיר: כולן נכונות → לכלל, ותרגול מרמה u.fastStart||3)
  // u.explore – מסך המחשה (kind:'cake' אינטראקטיבי, או kind:'info'); u.rule – { title, html, fig, item }
  // u.levels – [{ name, intro, items, gen(k) }]; u.fluency – { intro, gen(k), n } (סבב שטף למי שנעזר/טעה ברמות 2–3)
  // u.notebook – { title, html, checks:[items], model, modelText, selfcheck:[…] }. A,B,C – בדיקת שליטה (השאלה האחרונה = שאלת הבנה)
  C.mk2 = function (u) {
    const explore = [u.explore, u.explore2].filter(Boolean).map(x => Object.assign({ step: 1, kind: 'cake' }, x));
    const rule = Object.assign({ step: 2, kind: 'rule' }, u.rule);
    const lv = start => ({ step: 3, kind: 'levels', levels: u.levels, fluency: u.fluency, start, fastStart: u.fastStart || 3 });
    const nb = Object.assign({ step: 3, kind: 'notebook2' }, u.notebook);
    const teach = [{ step: 1, kind: 'intro', html: u.goal, quick: u.quick }].concat(explore, [rule, lv(1), nb, { step: 4, kind: 'check', sets: ['A', 'B'] }, { step: 5, kind: 'summary' }]);
    const reinforce = [{ step: 1, kind: 'intro', html: u.goalR || u.goal, quick: u.quick }, rule, lv(u.startR || 2), nb, { step: 4, kind: 'check', sets: ['B', 'C'] }, { step: 5, kind: 'summary' }];
    return { v2: true, teach, reinforce, sets: { A: u.A, B: u.B, C: u.C }, alt: u.alt, simpler: u.simpler, waiting: u.waiting || [], skill: u.skill, learned: u.learned, did: u.did };
  };
  // אתגר מומחים: 4 משימות, 3 נכונות בלי רמז
  C.mkDeep = function (u) {
    const teach = [{ step: 1, kind: 'goal', html: u.goal }, { step: 4, kind: 'check', sets: ['A', 'B'] }, { step: 5, kind: 'summary' }];
    return { deep: true, passNeed: 3, skill: [], did: 'פתרתם שאלות מומחים', learned: u.learned, teach, reinforce: teach, sets: { A: u.A, B: u.B }, waiting: [] };
  };
  C.f = {
    bar: (n, d, o) => Object.assign({ k: 'bar', n, d }, o || {}),
    pie: (n, d, o) => Object.assign({ k: 'pie', n, d, r: 52 }, o || {}),
    hund: (n, o) => Object.assign({ k: 'hund', n }, o || {}),
    line: (d, o) => Object.assign({ k: 'line', d }, o || {}),
    pv: n => ({ k: 'pv', n }),
    vert: (rows, op, res) => ({ k: 'vert', rows, op, res }),
    arr: (r, c, o) => Object.assign({ k: 'arr', r, c }, o || {}),
    groups: (g, n, o) => Object.assign({ k: 'groups', g, n }, o || {}),
    area: (a, b, o) => Object.assign({ k: 'area', a, b }, o || {}),
    tree: (n, a, b, o) => Object.assign({ k: 'tree', n, a, b }, o || {}),
    jug: (L, d, n, o) => Object.assign({ k: 'jug', L, d, n }, o || {})
  };
  // שאלות למבדק אמצע ולמבדק סיכום (K.EXAMS = { mid: [...], final: [...] }). u = השיעור שהשאלה בודקת.
  // בבחירה: התשובה הנכונה נכתבת ראשונה, והסדר מסתובב לפי המזהה – כדי שהיא לא תהיה תמיד במקום הראשון.
  const rot = (id, n) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997; return h % n; };
  C.ex = {
    ch: (u, id, q, opts, o) => {
      const list = opts.map(x => typeof x === 'string' ? { t: x } : x), k = rot(id, list.length);
      return Object.assign({ u, id, type: 'choice', q, ans: (list.length - k) % list.length, opts: list.slice(k).concat(list.slice(0, k)) }, o || {});
    },
    num: (u, id, q, ans, o) => Object.assign({ u, id, type: 'num', q: q.includes('bigmx') ? q : `${q}<div class="bigmx">⟦?⟧</div>`, ans }, o || {}),
    fr: (u, id, q, ans, o) => Object.assign({ u, id, type: 'frac', q, ans }, o || {}),
    mx: (u, id, q, ans, o) => Object.assign({ u, id, type: 'mixed', q, ans }, o || {})
  };
  // שאלת "נכון/לא נכון" קצרה עם משוב לתשובה השגויה
  C.yn = (id, q, yes, msgWrong, exp, o) => Object.assign({ id, type: 'choice', q, ans: yes ? 0 : 1, opts: [{ t: 'כן', msg: yes ? '' : msgWrong }, { t: 'לא', msg: yes ? msgWrong : '' }], exp }, o || {});
})();
