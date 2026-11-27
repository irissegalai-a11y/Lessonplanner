// בדיקת מנוע התלת-ממד: פריסה → קיפול סוגר את הגוף; פריסות קובייה; ספירות
global.window = global; require('../solid3d.js'); const S3 = global.S3;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function closes(m, par, name) {
  const net = S3.unfold(m, par), F = S3.fold(net, 1), F0 = S3.fold(net, 0);
  // שטוח: z=0
  ok(F0.every(f => f.every(p => Math.abs(p[2]) < 1e-6)), name + ' flat');
  // מקופל: כל קדקוד של הגוף – אותו מקום בכל הפאות שלו
  const pos = {}; let bad = 0;
  m.F.forEach((f, fi) => f.forEach((v, k) => { const p = F[fi][k]; if (pos[v]) { if (d(pos[v], p) > 1e-6) bad++; } else pos[v] = p; }));
  ok(bad === 0, name + ' closes (' + bad + ')');
  // אורכי צלעות נשמרים בפריסה
  m.F.forEach((f, fi) => f.forEach((v, k) => { const w = f[(k + 1) % f.length], L = d(m.V[v], m.V[w]), a = net.P[fi][k], b = net.P[fi][(k + 1) % f.length]; ok(Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1]) - L) < 1e-6, name + ' len'); }));
  // אין חפיפות בשטוח (בדיקה גסה: מרכזים שונים)
  ok(S3.overlaps(net).size === 0, name + ' no overlap folded');
  return net;
}
for (const n of [3, 4, 5, 6, 8]) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) closes(S3.regPrism(n, 1, 1.3), S3.prismTree(n, i, j), 'P' + n + ' ' + i + j);
closes(S3.box(3, 2, 1.5), S3.boxCross(), 'box cross'); closes(S3.box(3, 2, 1.5), S3.boxStrip(), 'box strip');
closes(S3.triPrism(3, 4, 2), S3.prismTree(3, 0, 1), 'tri');
// קובייה: 11 פריסות תקינות, ו-5 בשורה / 2×2 שגויות
const valid = [[[0,1],[1,0],[1,1],[1,2],[1,3],[2,1]], [[0,0],[1,0],[1,1],[1,2],[1,3],[2,3]], [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]], [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4]]];
const invalid = [[[0,0],[0,1],[0,2],[0,3],[0,4],[1,1]], [[0,0],[0,1],[1,0],[1,1],[2,1],[2,2]], [[0,0],[0,1],[0,2],[0,3],[1,0],[1,3]]];
valid.forEach((c, i) => ok(S3.overlaps(S3.gridNet(c)).size === 0, 'cube valid ' + i));
invalid.forEach((c, i) => ok(S3.overlaps(S3.gridNet(c)).size > 0, 'cube invalid ' + i));
// ספירות
for (const n of [3, 4, 5, 6, 7, 8]) { const c = S3.count(S3.regPrism(n)); ok(c.F === n + 2 && c.E === 3 * n && c.V === 2 * n, 'count ' + n); }
ok(S3.count(S3.cylinder(1, 2)).V === 0, 'cyl V');
// ציור לא נופל
for (const m of [S3.regPrism(5), S3.lay(S3.regPrism(3)), S3.box(2, 3, 4), S3.cylinder(1, 2), S3.cone(1, 2), S3.pyramid(S3.regBase(4), 1), S3.sphere(1)]) for (const yaw of [-170, -90, -32, 0, 45, 120]) for (const pitch of [-60, 0, 22, 89]) { const s = S3.render(m, { yaw, pitch, labels: [], pick: 'E', hidden: 'dash' }); ok(/<svg/.test(s) && !/NaN/.test(s), 'render ' + m.kind + yaw + ',' + pitch); }
ok(!/NaN/.test(S3.cubesSVG(S3.boxCubes(3, 2, 4), { layerCol: true })), 'cubes');
ok(!/NaN/.test(S3.tankSVG(30, 20, 25, 10)), 'tank');
console.log(fail ? 'FAILURES: ' + fail : 'engine OK');
