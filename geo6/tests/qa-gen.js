// בדיקת מחוללים: אלפי שאלות לכל שיעור ורמה – תשובה אחת נכונה, אין כפילויות באפשרויות, מלכודות ≠ תשובה, אין NaN/undefined
global.window = global;
require('../solid3d.js'); require('../prism-a.js'); require('../prism-b.js'); require('../prism-c.js');
const G6 = global.G6, N = +process.argv[2] || 300;
const all = G6.LESSONS; // 9 שיעורים
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
// מבנה השיעור: חמשת השלבים קיימים, ושאלות ההקניה והסיכום תקינות
const chkQ = (q, id) => { if (!q) return; if (q.type === 'choice') { if (q.choices.filter(c => c.ok).length !== 1) bad('teach q correct count', q, id); q.choices.forEach(c => { if (!c.ok && !c.why) bad('teach q no why', q, id); }); } else if (typeof q.ans !== 'number') bad('teach q ans', q, id); };
for (const L of all) {
  ['open', 'teach', 'rule', 'sum', 'nb', 'hands'].forEach(k => { if (!L[k]) bad('missing ' + k, null, L.id); });
  if (!L.open.ask || L.open.ask.length < 2) bad('few open questions', null, L.id);
  if (!L.sum.check || !L.sum.oral) bad('sum check/oral', null, L.id);
  chkQ(L.sum.check, L.id + ' sum'); L.teach.forEach((t, i) => chkQ(t.q, L.id + ' teach' + i));
  if (!L.nb.task || !L.nb.check || typeof L.nb.model !== 'function') bad('nb', null, L.id); else if (/NaN|undefined/.test(L.nb.model())) bad('nb model NaN', null, L.id);
  if (/NaN|undefined/.test(JSON.stringify([L.open.html, L.teach.map(t => t.html + (t.reveal || '')), L.rule]))) bad('lesson text NaN/undefined', null, L.id);
}
console.log('lessons:', all.map(L => `${L.no}:${L.teach.length}`).join(' '));
console.log(`generated ${total} questions, failures: ${fail}`);
process.exit(fail ? 1 : 0);
