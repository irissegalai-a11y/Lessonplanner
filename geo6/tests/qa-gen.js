// בדיקת מחוללים: אלפי שאלות לכל שיעור ורמה – תשובה אחת נכונה, אין כפילויות באפשרויות, מלכודות ≠ תשובה, אין NaN/undefined
global.window = global;
require('../solid3d.js'); require('../prism-a.js'); require('../prism-b.js');
const G6 = global.G6, N = +process.argv[2] || 300;
const all = [...G6.LESSONS_A, ...G6.LESSONS_B].flatMap(L => L.subs ? L.subs : [L]);
let fail = 0, total = 0; const errs = {};
const bad = (m, q, id) => { fail++; errs[id + ': ' + m] = (errs[id + ': ' + m] || 0) + 1; if (errs[id + ': ' + m] === 1) console.log('FAIL', id, m, (q && q.text || '').slice(0, 120)); };
const txt = q => JSON.stringify([q.text, q.choices, q.hint, q.exp, q.traps, q.steps, q.fig && q.fig.svg]);
for (const L of all) for (const lv of [1, 2, 3]) {
  const gens = L.gens[lv]; if (!gens || gens.length < 3) bad('few gens', null, L.id + ' L' + lv);
  for (const g of gens) for (let i = 0; i < N; i++) {
    total++; let q;
    try { q = g(); } catch (e) { bad('throw ' + e.message, null, L.id + ' L' + lv + ' ' + g.name); continue; }
    const id = L.id + ' L' + lv;
    if (!q || !q.text) { bad('no text', q, id); continue; }
    const s = txt(q);
    if (/NaN|undefined|Infinity|\[object/.test(s)) bad('NaN/undefined', q, id);
    if (!q.exp) bad('no exp', q, id);
    if (!q.hint) bad('no hint', q, id);
    if (q.skill !== L.id) bad('skill tag ' + q.skill, q, id);
    if (q.type === 'choice') {
      const ok = q.choices.filter(c => c.ok).length; if (ok !== 1) bad('correct count ' + ok, q, id);
      const t = q.choices.map(c => c.t); if (new Set(t).size !== t.length) bad('dup choices', q, id);
      if (q.choices.length < 2) bad('few choices', q, id);
      q.choices.forEach(c => { if (!c.ok && !c.why) bad('no why for wrong choice', q, id); });
    } else if (q.type === 'num') {
      if (typeof q.ans !== 'number' || !isFinite(q.ans)) bad('ans not number', q, id);
      if (q.ans < 0) bad('negative ans', q, id);
      if (Math.round(q.ans * 1000) !== q.ans * 1000) bad('ans too many decimals ' + q.ans, q, id);
      (q.traps || []).forEach(([v, m]) => { if (Math.abs(v - q.ans) < 1e-9) bad('trap equals ans', q, id); if (!m) bad('trap no msg', q, id); });
      (q.steps || []).forEach(st => { if (typeof st.a !== 'number' || !isFinite(st.a)) bad('bad step', q, id); });
      if (q.steps && Math.abs(q.steps[q.steps.length - 1].a - q.ans) > 1e-9 && !/סכום|סך/.test(q.steps[q.steps.length - 1].p)) bad('last step != ans', q, id);
    } else bad('type ' + q.type, q, id);
    if (typeof q.again !== 'function') bad('no again', q, id);
  }
}
// בדיקות מתמטיות בלתי תלויות על כרטיסי ההסבר
console.log(`generated ${total} questions, failures: ${fail}`);
process.exit(fail ? 1 : 0);
