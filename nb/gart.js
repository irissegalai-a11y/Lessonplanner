/* MathInClass – איורים לשערים (משחקים, מבדקים, אזור המורה, אימון כפל, מצוינות, כלי המחשה).
   כל איור מראה את מהות הפעילות עצמה (לא קישוט): קו כהה על רקע בצבע, viewBox 100×100. */
(function () {
  const K = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const k = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const WF = 'fill="#fff" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"';
  const LF = 'fill="rgba(255,255,255,.55)" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"';
  const T = (x, y, t, s = 14, w = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="${s}" font-weight="${w}" fill="currentColor" direction="ltr">${t}</text>`;
  const svg = b => `<svg viewBox="0 0 100 100" aria-hidden="true">${b}</svg>`;
  const range = n => Array.from({ length: n }, (_, i) => i);
  // מרכז עם חיצים – "מעובדה אחת – הרבה עובדות"
  const hub = () => svg(`${range(6).map(i => { const a = i * Math.PI / 3 - Math.PI / 2, x = 50 + Math.cos(a) * 34, y = 52 + Math.sin(a) * 34, x1 = 50 + Math.cos(a) * 20, y1 = 52 + Math.sin(a) * 20, x2 = 50 + Math.cos(a) * 27, y2 = 52 + Math.sin(a) * 27;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" ${k}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" ${LF}/>`; }).join('')}
    <circle cx="50" cy="52" r="16" ${WF}/>${T(50, 57, '6×7', 12)}`);
  // ישר מספרים עם קפיצות
  const jumps = (n, lab, end) => svg(`<path d="M8 70h84" ${K}/>${range(n + 1).map(i => `<path d="M${12 + i * (76 / n)} 64v12" ${k}/>`).join('')}
    ${range(n).map(i => { const x = 12 + i * (76 / n), w = 76 / n; return `<path d="M${x + 1} 64q${w / 2 - 1} -${22} ${w - 2} 0" ${k} ${i === n - 1 ? 'stroke-dasharray="3 4"' : ''}/>`; }).join('')}
    ${T(12, 92, '0', 12, 600)}${T(88, 92, end, 12, 600)}<rect x="30" y="14" width="40" height="22" rx="6" ${WF}/>${T(50, 30, lab, 13)}`);
  // אבני בסיס עשר: לוח, מוטות, יחידות
  const blocks = () => svg(`<rect x="10" y="22" width="40" height="40" ${LF}/>${range(9).map(i => `<path d="M${14 + i * 4} 22v40M10 ${26 + i * 4}h40" stroke="currentColor" stroke-width=".8" opacity=".55"/>`).join('')}
    ${[0, 1].map(i => `<rect x="${56 + i * 8}" y="22" width="5" height="40" ${LF}/>`).join('')}${[0, 1, 2].map(i => `<rect x="${74 + (i % 2) * 8}" y="${50 - Math.floor(i / 2) * 8}" width="5" height="5" ${WF}/>`).join('')}
    <rect x="24" y="70" width="52" height="20" rx="6" ${WF}/>${T(50, 85, '1.23', 13)}`);
  // שתי קבוצות שוות של קלפים/נקודות
  const dots = (r, c, x0, y0, s) => range(r * c).map(i => `<circle cx="${x0 + (i % c) * s}" cy="${y0 + Math.floor(i / c) * s}" r="${s * 0.28}" fill="currentColor"/>`).join('');
  const team = () => svg(`<rect x="12" y="14" width="76" height="46" rx="6" ${LF}/>${range(3).map(i => `<path d="M${30 + i * 20} 22v30" stroke="currentColor" stroke-width="1.2" opacity=".5"/>`).join('')}
    ${[22, 50, 78].map((x, i) => `<circle cx="${x}" cy="72" r="6" ${WF}/><path d="M${x - 9} 92a9 8 0 0 1 18 0" ${WF}/>`).join('')}${T(50, 44, '★', 16)}`);
  const doc = (inner, tab) => svg(`<path d="M24 8h38l16 16v68H24z" ${WF}/><path d="M62 8v16h16" ${k}/>${inner}${tab ? `<rect x="18" y="74" width="34" height="16" rx="4" fill="currentColor"/><text x="35" y="86" text-anchor="middle" font-family="Heebo, Arial" font-size="10" font-weight="700" fill="#fff">${tab}</text>` : ''}`);
  const GA = {
    /* ---------- משחקים ---------- */
    // שעון עצר: רבע מסומן = חצי דקה
    raceGo: () => svg(`<circle cx="50" cy="56" r="32" ${WF}/><path d="M50 56V24a32 32 0 0 1 32 32z" fill="currentColor" opacity=".18"/><path d="M50 56V32M50 56l14 10" ${K}/><path d="M42 14h16M50 14v10M78 24l6-6" ${K}/>${range(12).map(i => { const a = i * Math.PI / 6; return `<path d="M${(50 + Math.sin(a) * 27).toFixed(1)} ${(56 - Math.cos(a) * 27).toFixed(1)}L${(50 + Math.sin(a) * 31).toFixed(1)} ${(56 - Math.cos(a) * 31).toFixed(1)}" stroke="currentColor" stroke-width="${i % 3 ? 1.2 : 2.5}"/>`; }).join('')}`),
    dfgGo: hub,
    // זוגות: שני קלפים גלויים שהם זוג, שניים הפוכים
    memGo: () => svg(`${[[10, 12], [54, 12], [10, 56], [54, 56]].map(([x, y], i) => i < 2 ? `<rect x="${x}" y="${y}" width="36" height="34" rx="6" ${WF}/>${T(x + 18, y + 22, i ? '12' : '3×4', i ? 15 : 12)}` : `<rect x="${x}" y="${y}" width="36" height="34" rx="6" fill="currentColor" opacity=".85"/><path d="M${x + 8} ${y + 8}l20 18M${x + 28} ${y + 8}l-20 18" stroke="#fff" stroke-width="1.5" opacity=".5"/>`).join('')}<path d="M46 29h8" ${K}/>`),
    // דלת עם מנעול ספרות
    erGo0: () => svg(`<path d="M22 92V18a6 6 0 0 1 6-6h30a6 6 0 0 1 6 6v74" ${WF}/><path d="M12 92h76" ${K}/><circle cx="56" cy="54" r="3" fill="currentColor"/>
      <rect x="58" y="30" width="34" height="44" rx="6" ${WF}/>${['4', '7', '?'].map((d, i) => `<rect x="62" y="${34 + i * 13}" width="26" height="10" rx="2" ${k}/>${T(75, 42 + i * 13, d, 9)}`).join('')}`),
    // גלגל עם 6 גזרות ומחוג
    whGo0: () => svg(`<circle cx="50" cy="54" r="36" ${WF}/>${range(6).map(i => { const a = i * Math.PI / 3; return `<path d="M50 54L${(50 + Math.sin(a) * 36).toFixed(1)} ${(54 - Math.cos(a) * 36).toFixed(1)}" ${k}/>`; }).join('')}
      <path d="M50 54L50 18A36 36 0 0 1 81.2 36z" fill="currentColor" opacity=".18"/><circle cx="50" cy="54" r="6" fill="currentColor"/><path d="M44 6h12l-6 12z" fill="currentColor"/>${T(62, 36, '8', 10)}${T(30, 64, '3', 10)}${T(70, 72, '5', 10)}`),
    // טענה ושני כפתורי החלטה
    tfGo0: () => svg(`<rect x="10" y="12" width="80" height="34" rx="8" ${WF}/>${T(50, 35, '7×8=54', 13)}<rect x="12" y="58" width="34" height="30" rx="8" ${LF}/><path d="M21 73l6 6 11-12" ${K}/><rect x="54" y="58" width="34" height="30" rx="8" ${LF}/><path d="M64 66l14 14M78 66 64 80" ${K}/>`),
    // מסלול משבצות עד לאוצר
    pathGo2: () => svg(`<path d="M14 84c14 0 14-22 30-22s12-24 28-24 12-20 14-20" ${k} stroke-dasharray="2 6"/>${[[14, 84], [44, 62], [72, 38]].map(([x, y]) => `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="4" ${WF}/>`).join('')}
      <path d="M72 10h20v14H72z" ${WF}/><path d="M72 16h20M82 16v8" ${k}/>`),
    // סולם פרסים
    milGo: () => svg(`${range(5).map(i => { const y = 12 + i * 16, on = i === 2; return `<rect x="16" y="${y}" width="68" height="12" rx="6" ${on ? 'fill="currentColor"' : WF}/><path d="M${on ? 26 : 26} ${y + 6}l4-4 4 4-4 4z" fill="${on ? '#fff' : 'currentColor'}"/><path d="M42 ${y + 6}h${30 - i * 3}" stroke="${on ? '#fff' : 'currentColor'}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}`),
    // שני קלפים והשוואה
    warGo1: () => svg(`<rect x="6" y="22" width="38" height="54" rx="7" ${WF}/>${T(25, 54, '3×8', 12)}<rect x="56" y="22" width="38" height="54" rx="7" ${WF}/>${T(75, 54, '5×5', 12)}<circle cx="50" cy="49" r="9" fill="currentColor"/><text x="50" y="54" text-anchor="middle" font-family="Heebo, Arial" font-size="13" font-weight="800" fill="#fff" direction="ltr">&lt;</text>`),
    dlGo: blocks,
    fjGo: () => jumps(4, '4 × ⅓', '1⅓'),
    fdGo: () => jumps(4, '3 : ¾', '3'),
    // עיר: מבנים על רשת, שטח מסומן
    cityGo: () => svg(`<path d="M8 88h84" ${K}/><rect x="14" y="44" width="22" height="44" ${WF}/>${range(5).map(i => `<path d="M14 ${52 + i * 8}h22M${18 + i * 4} 44v44" stroke="currentColor" stroke-width=".8" opacity=".45"/>`).join('')}
      <path d="M42 88V30l18-12 18 12v58z" ${LF}/><rect x="80" y="58" width="12" height="30" ${WF}/>${T(60, 66, 'S', 14)}`),
    // לוח מסמרים עם מצולע
    gbGo: () => svg(`${range(25).map(i => `<circle cx="${18 + (i % 5) * 16}" cy="${18 + Math.floor(i / 5) * 16}" r="2.4" fill="currentColor"/>`).join('')}<path d="M18 82 34 34h32l16 48z" fill="currentColor" fill-opacity=".14" ${K}/>`),
    // לוח ג'פרדי
    jeoGoG: () => svg(`${range(12).map(i => { const c = i % 3, r = Math.floor(i / 3); return `<rect x="${10 + c * 28}" y="${10 + r * 21}" width="24" height="17" rx="3" ${r === 2 && c === 1 ? 'fill="currentColor"' : WF}/>${r === 2 && c === 1 ? '' : T(22 + c * 28, 22 + r * 21, String((r + 1) * 100), 8, 700)}`; }).join('')}`),
    clsGamesG: team,
    /* ---------- אזור המורה ---------- */
    // מערך שיעור: ציר זמן בחלקים
    lpTop: () => svg(`<rect x="12" y="12" width="76" height="76" rx="8" ${WF}/>${[[18, 28, 14], [18, 42, 30], [18, 56, 44], [18, 70, 22]].map(([x, y, w], i) => `<rect x="${x + (i ? [0, 14, 44, 14][i] : 0)}" y="${y}" width="${w}" height="9" rx="4.5" ${i === 2 ? 'fill="currentColor"' : LF}/>`).join('')}<path d="M18 22h64" ${k} opacity=".5"/>`),
    // מסך הקרנה עם שקף
    clsOpen: () => svg(`<path d="M8 14h84" ${K}/><rect x="14" y="14" width="72" height="50" ${WF}/><path d="M50 64v12M38 90l12-14 12 14" ${K}/>${T(36, 44, '½', 18)}<path d="M52 32h24M52 42h18M52 52h22" ${k}/>`),
    clsGames: team,
    dfT: hub,
    // מבדקי הצלחה: 5 שורות קצרות עם סימון
    succTab: () => doc(`${range(5).map(i => `<rect x="31" y="${30 + i * 11}" width="7" height="7" rx="1.5" ${k}/>${i < 3 ? `<path d="M32 ${34 + i * 11}l2 2 4-5" ${k}/>` : ''}<path d="M43 ${34 + i * 11}h${22 - (i % 2) * 6}" ${k}/>`).join('')}`),
    exitTab: () => svg(`<path d="M10 30a8 8 0 0 0 0 16 8 8 0 0 1 0 16v10h80V62a8 8 0 0 1 0-16 8 8 0 0 0 0-16V20H10z" ${WF}/><path d="M66 22v48" ${k} stroke-dasharray="3 4"/><path d="M20 38h36M20 48h28M20 58h32" ${k}/>${T(78, 51, '?', 16)}`),
    /* ---------- מבדקים ---------- */
    testPick: () => doc(`${range(5).map(i => `${T(34, 37 + i * 11, String(i + 1), 8, 700)}<path d="M41 ${34 + i * 11}h${26 - (i % 3) * 5}" ${k}/>`).join('')}`, '20'),
    mkGo: () => doc(`<path d="M32 34h32M32 44h26M32 54h30" ${k}/><path d="M60 82l3-11 16-16 8 8-16 16z" ${WF}/>`),
    testLink: () => doc(`<path d="M32 34h32M32 44h26" ${k}/><g transform="translate(34 54)"><rect x="0" y="6" width="18" height="10" rx="5" ${k}/><rect x="12" y="6" width="18" height="10" rx="5" ${k}/></g>`),
    /* ---------- אימון כפל וחילוק ---------- */
    kfGoHome: () => svg(`<rect x="8" y="16" width="62" height="44" rx="6" ${WF}/>${dots(4, 6, 17, 25, 9)}<path d="M8 72h62" ${k}/>${T(39, 92, '4 × 6', 14)}<path d="M80 20v40" ${k}/>${T(88, 44, '4', 12)}`),
    kdGoHome: () => svg(`${[0, 1, 2].map(g => `<rect x="${8 + g * 30}" y="16" width="26" height="40" rx="8" ${WF}/>${dots(4, 2, 16 + g * 30, 24, 10)}`).join('')}${T(50, 86, '24 : 3', 14)}`),
    /* ---------- מצוינות – ספריית חידות ---------- */
    logic: () => svg(`${range(9).map(i => { const c = i % 3, r = Math.floor(i / 3), x = 14 + c * 25, y = 14 + r * 25, last = i === 6;
      return `<rect x="${x}" y="${y}" width="22" height="22" rx="4" ${last ? `${k} stroke-dasharray="3 3"` : WF}/>${last ? T(x + 11, y + 16, '?', 13) : `<path d="M${x + 11} ${y + 11}L${x + 11} ${y + 4}A7 7 0 ${c === 2 ? 1 : 0} 1 ${x + 11 + 7 * Math.sin((c + 1) * Math.PI / 2)} ${y + 11 - 7 * Math.cos((c + 1) * Math.PI / 2)}z" fill="currentColor" opacity="${.35 + r * .25}"/>`}`; }).join('')}`),
    lgSeq: () => svg(`${[0, 1, 2].map(i => `<rect x="${8 + i * 22}" y="${62 - (i + 1) * 9}" width="16" height="${(i + 1) * 9 + 8}" rx="3" ${WF}/>`).join('')}<rect x="74" y="26" width="18" height="44" rx="3" ${k} stroke-dasharray="3 3"/>${T(83, 54, '?', 14)}<path d="M8 84h84" ${k}/>`),
    lgAna: () => svg(`<path d="M50 10v80" ${k} stroke-dasharray="4 4"/><path d="M14 74V30l26 22z" ${WF}/><path d="M86 74V30L60 52z" ${LF}/><circle cx="22" cy="40" r="3" fill="currentColor"/><circle cx="78" cy="40" r="3" fill="currentColor"/>`),
    lgNum: () => svg(`<path d="M50 18v66M30 88h40M14 30h72" ${K}/><path d="M14 30 6 54h16zM86 30l-8 24h16z" ${k}/><path d="M4 54a10 6 0 0 0 20 0zM76 54a10 6 0 0 0 20 0z" ${WF}/><path d="M8 48l6-8 6 8z" fill="currentColor"/><rect x="80" y="40" width="10" height="9" fill="currentColor"/><circle cx="50" cy="18" r="4" fill="currentColor"/>`),
    lgFold: () => svg(`<path d="M12 18h44v64H12z" ${WF}/><path d="M56 18l32 10v64L56 82z" ${LF}/><path d="M56 18v64" ${k} stroke-dasharray="4 3"/><circle cx="34" cy="40" r="5" ${k}/><circle cx="72" cy="46" r="5" ${k} stroke-dasharray="2 2"/>`),
    lgAll: () => svg(`${[[12, 12], [54, 12], [12, 54], [54, 54]].map(([x, y]) => `<rect x="${x}" y="${y}" width="34" height="34" rx="7" ${WF}/>`).join('')}<circle cx="29" cy="29" r="9" ${k}/><path d="M71 20v18M62 29h18" ${k}/><path d="M20 80l9-18 9 18z" ${k}/><rect x="62" y="62" width="18" height="18" ${k}/>`),
    xpalGo: () => svg(`<rect x="8" y="34" width="84" height="32" rx="8" ${WF}/>${T(50, 57, '1 2 3 2 1', 15)}<path d="M18 28q32-22 64 0" ${k}/><path d="M78 22l4 6-7 1" ${k}/><path d="M18 72q32 22 64 0" ${k}/><path d="M22 78l-4-6 7-1" ${k}/>`),
    xeulerGo: () => svg(`<path d="M22 86V46h56v40zM22 46l28-28 28 28M22 46l56 40M78 46 22 86" ${K}/><circle cx="22" cy="86" r="5" fill="currentColor"/>`),
    xcubGo: () => svg(`${[[50, 30], [32, 50], [68, 50], [50, 70]].map(([x, y]) => `<path d="M${x} ${y - 16}l16 9v18l-16 9-16-9v-18z" ${WF}/><path d="M${x - 16} ${y - 7}l16 9 16-9M${x} ${y + 2}v18" ${k}/>`).join('')}`),
    xmagGo: () => svg(`<rect x="14" y="14" width="72" height="72" rx="6" ${WF}/><path d="M38 14v72M62 14v72M14 38h72M14 62h72" ${k}/>${[2, 7, 6, 9, 5, 1, 4, 3, 8].map((d, i) => T(26 + (i % 3) * 24, 32 + Math.floor(i / 3) * 24, d, 13)).join('')}`),
    xgrwGo: () => svg(`${[1, 2, 3].map((n, s) => { const x0 = 8 + [0, 18, 44][s]; return range(2 * n - 1).map(j => { const x = j < n ? x0 + j * 9 : x0, y = j < n ? 80 : 80 - (j - n + 1) * 9; return `<rect x="${x}" y="${y}" width="8" height="8" ${s === 2 ? 'fill="currentColor"' : WF}/>`; }).join(''); }).join('')}${T(86, 86, '…', 16)}${T(50, 30, '1, 3, 5', 13)}`),
    xsdkGo: () => svg(`<rect x="14" y="14" width="72" height="72" rx="4" ${WF}/><path d="M32 14v72M68 14v72M14 32h72M14 68h72" stroke="currentColor" stroke-width="1" opacity=".6"/><path d="M50 14v72M14 50h72" ${K}/>${[[0, 0, '1'], [1, 2, '3'], [2, 1, '4'], [3, 3, '2'], [0, 3, '4'], [3, 0, '3']].map(([r, c, d]) => T(23 + c * 18, 29 + r * 18, d, 11)).join('')}`),
    /* ---------- כלי המחשה ---------- */
    dfGo: hub,
    mulAreaGo: () => svg(`<rect x="12" y="20" width="76" height="60" ${WF}/><path d="M62 20v60M12 58h76" ${k}/><rect x="62" y="58" width="26" height="22" fill="currentColor" opacity=".18"/>${T(37, 14, '20', 10)}${T(75, 14, '3', 10)}${T(37, 44, '200', 11)}${T(75, 44, '30', 10)}${T(37, 73, '80', 11)}${T(75, 73, '12', 10)}`),
    dlTool: blocks,
    fjTool: () => jumps(4, '4 × ⅓', '1⅓'),
    fdTool: () => jumps(4, '3 : ¾', '3')
  };
  // צבע רקע לכל איור – צבעי הספרייה (חיים ובהירים); ברירת מחדל לפי סדר
  const PAL = ['#E2B65C', '#4FA3A5', '#6E8FC4', '#79A88A', '#D88A6A', '#8C8FB8', '#C98FA8', '#9DB660'];
  const GC = { raceGo: 0, dfgGo: 1, memGo: 2, erGo0: 5, whGo0: 4, tfGo0: 3, pathGo2: 0, milGo: 6, warGo1: 2, dlGo: 1, fjGo: 2, fdGo: 5, cityGo: 3, gbGo: 7, jeoGoG: 4, clsGamesG: 1,
    lpTop: 2, clsOpen: 1, clsGames: 4, dfT: 0, succTab: 3, exitTab: 6, testPick: 2, mkGo: 4, testLink: 1, kfGoHome: 0, kdGoHome: 1,
    logic: 2, lgSeq: 1, lgAna: 6, lgNum: 0, lgFold: 4, lgAll: 5, xpalGo: 3, xeulerGo: 7, xcubGo: 2, xmagGo: 0, xgrwGo: 1, xsdkGo: 5, dfGo: 0, mulAreaGo: 4, dlTool: 1, fjTool: 2, fdTool: 5 };
  const art = id => (GA[id] || GA.lgAll)();
  const color = (id, i) => PAL[GC[id] != null ? GC[id] : (i || 0) % PAL.length];
  window.NB_GART = { art, color, has: id => !!GA[id] };
})();
