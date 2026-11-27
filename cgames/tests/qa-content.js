// בדיקת תוכן משחקי הכיתה: node cgames/tests/qa-content.js [N]
require('../content.js');
const C = globalThis.CG, N = Number(process.argv[2]) || 300;
let bad = 0, total = 0;
const fail = (what, x) => { bad++; if (bad < 25) console.log('✗', what, typeof x === 'string' ? x.slice(0, 300) : String(JSON.stringify(x)).slice(0, 300)); };
const junk = s => /undefined|NaN|null|\[object/.test(String(s));
const plain = s => String(s).replace(/<[^>]+>/g, '');

// --- בלשי הטעויות ---
for (let g = 1; g <= 6; g++) {
  const L = C.mdCases(g); if (L.length < 4) fail(`MD: מעט מקרים בכיתה ${g}`, L.length);
  L.forEach(c => { for (let i = 0; i < N; i++) { total++; const x = C.mdMake(c, i % 7 === 0);
    const all = [x.task, ...x.bad, ...x.good, x.why, x.fix, x.hint].join(' ');
    if (junk(all)) fail(`MD ${c.id} junk`, all);
    if (x.twist ? x.at !== -1 || x.steps !== x.good : !(x.at >= 0 && x.at < x.bad.length)) fail(`MD ${c.id} at`, x.at);
    const at = x.twist ? c.gen && null : x.at;
    if (x.bad.join() === x.good.join()) fail(`MD ${c.id} bad=good`, x.bad);
    if (!x.twist && x.bad[x.at] === x.good[x.at]) fail(`MD ${c.id} שלב הטעות זהה בשני הפתרונות`, x.bad[x.at]);
    if (/(?:^|[=(,]\s*)-\d/.test(plain(x.good.join(' ')))) fail(`MD ${c.id} מספר שלילי`, x.good);
  } });
}
// עשרוניים: בכיתה ד' אין, בכיתה ה' רק מושג (decLen, decFrac), חילוק שברים רק ו', ראשוניים ה'–ו'
const ids = g => C.mdCases(g).map(c => c.id);
if (ids(4).some(i => /^dec/.test(i))) fail('MD: עשרוני בכיתה ד', ids(4));
if (ids(5).some(i => ['decAdd', 'decMul', 'dec10'].includes(i))) fail('MD: פעולה בעשרוניים בכיתה ה', ids(5));
if (ids(5).includes('fracDiv')) fail('MD: חילוק שברים בכיתה ה', 1);
if (ids(4).includes('prime')) fail('MD: ראשוניים בכיתה ד', 1);

// --- אומדן ---
for (let g = 1; g <= 6; g++) for (let i = 0; i < N * 10; i++) { total++; const it = C.estItem(g, true);
  if (it.kind === 'sane') { if (junk(it.claim + it.why) || typeof it.sane !== 'boolean' || !isFinite(it.exact)) fail(`EST sane g${g}`, it); continue; }
  if (junk(it.html) || !isFinite(it.exact) || !(it.ways && it.ways.length) || it.ways.some(junk)) fail(`EST g${g}`, it);
  if (g <= 5 && /\d\.\d/.test(plain(it.html))) fail(`EST עשרוני בכיתה ${g}`, it.html);
}

// --- מספר המטרה ---
for (let g = 1; g <= 6; g++) for (const lv of [1, 2, 3]) for (let i = 0; i < Math.max(40, N / 3); i++) { total++; const P = C.tgtMake(g, lv);
  if (!P) { fail(`TGT null g${g} lv${lv}`, 0); continue; }
  if (!P.sols.length) fail(`TGT בלי פתרון g${g}`, P);
  P.sols.forEach(s => { const r = C.tgtCheck(s.e, P.nums, P.ops); if (r.err || Math.abs(r.v - P.target) > 1e-9) fail(`TGT פתרון שגוי g${g}`, { s, P, r }); });
  if (!P.paren && P.sols.some(s => /\(/.test(s.e))) fail('TGT סוגריים בכיתה צעירה', P);
}
// בדיקת הבודק
const t1 = C.tgtCheck('(6+2)x3', [2, 3, 6], '+-×'); if (t1.v !== 24 || !t1.all) fail('tgtCheck 24', t1);
if (!C.tgtCheck('6+6', [2, 3, 6], '+-×').err) fail('tgtCheck שימוש כפול', 0);
if (!C.tgtCheck('6:3', [2, 3, 6], '+-×').err) fail('tgtCheck פעולה אסורה', 0);

// --- מה לא שייך? ---
for (let g = 1; g <= 6; g++) C.ODD_KINDS(g).forEach(([k]) => [false, true].forEach(multi => { for (let i = 0; i < Math.max(60, N / 2); i++) { total++; const S = C.oddMake(g, k, multi);
  if (!S) { fail(`ODD null g${g} ${k} ${multi}`, 0); continue; }
  if (S.items.length !== 4 || new Set(S.items).size !== 4) fail(`ODD פריטים g${g} ${k}`, S.items);
  const n = S.why.filter(w => w.length).length; if (!n || (multi && k !== 'rep' && n < 2)) fail(`ODD נימוקים g${g} ${k}`, S.why);
  if (junk(S.items.join() + S.why.flat().join())) fail(`ODD junk g${g} ${k}`, S);
} }));
// בדיקה בלתי תלויה לייצוגים: ערך כל פריט
const val = h => { const p = plain(h).trim(); if (/%$/.test(p)) return Number(p.replace('%', '')) / 100; if (/עשיריות/.test(p)) return ({ אחת: 1, שתיים: 2, שלוש: 3, ארבע: 4, חמש: 5, שש: 6, שבע: 7, שמונה: 8, תשע: 9 })[p.split(' ')[0]] / 10; if (/מאיות/.test(p)) return ({ אחת: 1, שתיים: 2, שלוש: 3, ארבע: 4, חמש: 5, שש: 6, שבע: 7, שמונה: 8, תשע: 9 })[p.split(' ')[0]] / 100; const m = h.match(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span>/); if (m) return m[1] / m[2]; return Number(p); };
for (const g of [5, 6]) for (let i = 0; i < N; i++) { const S = C.oddReps(g), v = S.items.map(val).map(x => Math.round(x * 1e6)); const cnt = v.map(x => v.filter(y => y === x).length); if (cnt.filter(c => c === 3).length !== 3 || cnt.filter(c => c === 1).length !== 1) fail(`ODD rep ערכים g${g}`, { items: S.items.map(plain), v }); }

// --- דומינו ---
for (let g = 1; g <= 6; g++) C.domSets(g).forEach(S => { for (let i = 0; i < Math.max(60, N / 2); i++) { total++; const D = C.domMake(S.id, g, 2), T = D.tiles;
  if (T.length < 7) fail(`DOM קצר ${S.id}`, T.length);
  T.forEach((t, k) => { if (t.vb !== T[(k + 1) % T.length].va) fail(`DOM שרשרת ${S.id}`, k); if (junk(t.a + t.b)) fail(`DOM junk ${S.id}`, t); });
  if (new Set(T.map(t => t.va)).size !== T.length) fail(`DOM ערך כפול ${S.id}`, T.map(t => t.va));
  if (new Set(T.map(t => plain(t.b) + t.b.length)).size !== T.length && !/svg/.test(T[0].b)) fail(`DOM צד ב' כפול ${S.id}`, T.map(t => plain(t.b)));
  D.traps.forEach(x => { if (T.some(t => t.va === x.va)) fail(`DOM מלכודת מתאימה ${S.id}`, x); if (junk(x.a + x.b + x.why)) fail(`DOM מלכודת junk ${S.id}`, x); });
} });
if (C.domSets(4).some(s => /dec/.test(s.id))) fail('DOM עשרוני בכיתה ד', 1);

// --- בינגו ---
const ans = Array.from({ length: 30 }, (_, i) => String(i * 3 + 2));
const B = C.bingoBoards(ans, 5, 40, 1234, true), B2 = C.bingoBoards(ans, 5, 40, 1234, true);
if (JSON.stringify(B) !== JSON.stringify(B2)) fail('BINGO זרע לא קבוע', 0);
B.forEach(b => { const v = b.filter(x => x !== null); if (v.length !== 24 || new Set(v).size !== 24 || v.some(x => !ans.includes(x)) || b[12] !== null) fail('BINGO לוח', b); });
const ck = C.bingoCheck(B[0], 5, new Set(B[0].slice(0, 5)), ['row']); if (!ck.lines.length) fail('BINGO שורה', ck);
total += 80;

console.log(bad ? `✗ ${bad} בעיות` : '✓ הכול תקין', `(${total} פריטים)`);
process.exit(bad ? 1 : 0);
