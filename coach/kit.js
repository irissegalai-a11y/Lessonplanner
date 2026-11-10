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
    groups: (g, n, o) => Object.assign({ k: 'groups', g, n }, o || {})
  };
  // שאלת "נכון/לא נכון" קצרה עם משוב לתשובה השגויה
  C.yn = (id, q, yes, msgWrong, exp, o) => Object.assign({ id, type: 'choice', q, ans: yes ? 0 : 1, opts: [{ t: 'כן', msg: yes ? '' : msgWrong }, { t: 'לא', msg: yes ? msgWrong : '' }], exp }, o || {});
})();
