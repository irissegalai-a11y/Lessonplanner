/* MathInClass – אייקונים קוויים ואיורים מתמטיים (SVG) לשפה העיצובית החדשה.
   אייקונים בסגנון Lucide (קו 1.8, פינות מעוגלות), מצוירים כאן כדי לא לטעון ספרייה. */
(function () {
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    library: '<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="m16.5 5.2 3.8-1 3.2 15.4-3.8 1z" transform="translate(-2.5 0)"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5z"/><path d="M6 11.5V16c0 1.3 2.7 3 6 3s6-1.7 6-3v-4.5"/><path d="M22 9.5V15"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".9"/><circle cx="18" cy="13.8" r=".9"/>',
    check: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="m9 13 2 2 4-4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6"/>',
    type: '<path d="M4 7V5h10v2M9 5v14M7 19h4"/><path d="M14 12v-1h7v1M17.5 11v8M16 19h3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.7c2.1.6 3.5 2.3 3.5 5.3"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    fwd: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    done: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    dot: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    book: '<path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    tool: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z" transform="translate(-2 0)"/><path d="M4 20l3-3"/>',
    times: '<path d="M6 6l12 12M18 6 6 18"/>',
    divide: '<circle cx="12" cy="6" r="1.3"/><path d="M5 12h14"/><circle cx="12" cy="18" r="1.3"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4 2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3z" transform="translate(0 -1)"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
    play: '<path d="M7 5v14l12-7z"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.6 10.7 6 3h4l2 4.5L14 3h4l-2.6 7.7"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h4M7.5 17h7"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v3M8 21l4-2 4 2M7 8h6M7 11h9"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
  };
  const ic = (n, cls) => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- איורים מתמטיים לכריכות (מדויקים, לא קישוט) ---------- */
  const S = 'stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const hatch = id => `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(255,255,255,.55)"/><path d="M0 0v6" stroke="currentColor" stroke-width="1.4" opacity=".55"/></pattern>`;
  const T = (x, y, t, s = 18, w = 600) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-size="${s}" font-weight="${w}" fill="currentColor" direction="ltr">${t}</text>`;
  const frac = (x, y, a, b, s = 18) => `${T(x, y, a, s)}<path d="M${x - s * 0.45} ${y + 5}h${s * 0.9}" stroke="currentColor" stroke-width="1.8"/>${T(x, y + s + 6, b, s)}`;
  const ART = {
    // מבנה עשרוני: טבלת מקומות עם הספרות של 123,456
    nat: () => `<svg viewBox="0 0 180 100" aria-hidden="true">${['מ"א', 'ע"א', 'א', 'מ', 'ע', 'י'].map((h, i) => `<text x="${18 + i * 29}" y="24" text-anchor="middle" font-family="Heebo, Arial" font-size="11" fill="currentColor" opacity=".8">${h}</text>`).join('')}
      <rect x="4" y="32" width="174" height="40" rx="6" ${S}/>${[1, 2, 3, 4, 5].map(i => `<path d="M${4 + i * 29} 32v40" stroke="currentColor" stroke-width="${i === 3 ? 2 : 1}" opacity="${i === 3 ? 1 : .5}"/>`).join('')}
      ${['1', '2', '3', '4', '5', '6'].map((d, i) => T(18 + i * 29, 60, d, 22)).join('')}<path d="M90 80h0" ${S}/>${T(90, 96, '123,456', 13, 500)}</svg>`,
    // ישר מספרים 0.7–0.8 והנקודה 0.75
    dec: () => `<svg viewBox="0 0 180 100" aria-hidden="true">${T(90, 30, '0.75', 26)}<path d="M8 62h164" ${S}/>${Array.from({ length: 11 }, (_, i) => `<path d="M${15 + i * 15} ${i % 5 ? 56 : 52}v${i % 5 ? 12 : 20}" stroke="currentColor" stroke-width="${i % 5 ? 1.2 : 2}"/>`).join('')}
      <circle cx="90" cy="62" r="5" fill="currentColor"/>${T(15, 92, '0.7', 12, 500)}${T(165, 92, '0.8', 12, 500)}</svg>`,
    // שבר 3/4 ופס מחולק ל-4 חלקים שווים, 3 צבועים
    frac: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><defs>${hatch('hf')}</defs>${frac(36, 40, '3', '4', 22)}
      <rect x="72" y="34" width="72" height="34" fill="url(#hf)"/><rect x="144" y="34" width="24" height="34" fill="rgba(255,255,255,.8)"/><rect x="72" y="34" width="96" height="34" ${S}/>${[1, 2, 3].map(i => `<path d="M${72 + i * 24} 34v34" stroke="currentColor" stroke-width="1.6"/>`).join('')}</svg>`,
    // משולש עם גובה וזווית ישרה + תיבה
    // גאומטריה במישור: משולש ומקבילית, כל אחד עם גובה וזווית ישרה
    geo: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><defs>${hatch('hg')}</defs><path d="M10 86 64 22l40 64z" fill="url(#hg)"/><path d="M10 86 64 22l40 64z" ${S}/><path d="M64 22v64" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M64 78h8v8" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M116 86l18-52h40l-18 52z" ${S}/><path d="M134 34v52" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M134 78h8v8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`,
    // גופים ומעגל: תיבה (מקצועות נסתרים מקווקווים) ומעגל עם מרכז ורדיוס
    sol: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><path d="M12 42h46v46H12zM12 42l18-18h46L58 42M58 88l18-18V24" ${S}/><path d="M12 88l18-18h46M30 70V24" stroke="currentColor" stroke-width="1.3" stroke-dasharray="3 3" fill="none"/>
      <circle cx="134" cy="54" r="34" fill="rgba(255,255,255,.45)"/><circle cx="134" cy="54" r="34" ${S}/><circle cx="134" cy="54" r="3" fill="currentColor"/><path d="M134 54h34" stroke="currentColor" stroke-width="1.8"/>${T(151, 48, 'r', 14, 600)}</svg>`,
    // עיגול עם גזרה של 25%
    pct: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><defs>${hatch('hp')}</defs><circle cx="118" cy="52" r="38" fill="rgba(255,255,255,.55)"/><path d="M118 52V14a38 38 0 0 1 38 38z" fill="url(#hp)"/><circle cx="118" cy="52" r="38" ${S}/><path d="M118 14v38h38" ${S}/>${T(48, 66, '%', 46, 500)}${T(118, 78, '25%', 13)}</svg>`,
    // דיאגרמת עמודות עם צירים
    data: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><defs>${hatch('hd')}</defs><path d="M24 10v78h146" ${S}/>${[30, 52, 40, 66, 22].map((h, i) => `<rect x="${36 + i * 27}" y="${88 - h}" width="18" height="${h}" fill="${i === 3 ? 'url(#hd)' : 'rgba(255,255,255,.6)'}" stroke="currentColor" stroke-width="1.6"/>`).join('')}${[22, 44, 66].map(y => `<path d="M20 ${88 - y}h4" stroke="currentColor" stroke-width="1.5"/>`).join('')}</svg>`,
    // מודל פס (בעיה מילולית): שלם ידוע, חלק חסר
    word: () => `<svg viewBox="0 0 180 100" aria-hidden="true"><defs>${hatch('hw')}</defs><path d="M12 22c0-6 4-8 8-8h68c4 0 8 2 8 8" stroke="currentColor" stroke-width="1.6" fill="none"/>${T(54, 10, '120', 12)}
      <rect x="12" y="30" width="84" height="28" fill="url(#hw)"/><rect x="96" y="30" width="72" height="28" fill="rgba(255,255,255,.7)"/><rect x="12" y="30" width="156" height="28" ${S}/><path d="M96 30v28" stroke="currentColor" stroke-width="1.8"/>
      ${T(132, 50, '?', 18)}<path d="M12 66c0 6 4 8 8 8h140c4 0 8-2 8-8" stroke="currentColor" stroke-width="1.6" fill="none"/>${T(90, 94, '200', 13)}</svg>`,
    // חידת מטריצה 3×3 עם משבצת חסרה
    exc: () => `<svg viewBox="0 0 180 100" aria-hidden="true">${[0, 1, 2].map(r => [0, 1, 2].map(c => { const x = 51 + c * 28, y = 8 + r * 28; const last = r === 2 && c === 0; return `<rect x="${x}" y="${y}" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.6" fill="${last ? 'none' : 'rgba(255,255,255,.14)'}" ${last ? 'stroke-dasharray="3 3"' : ''}/>${last ? T(x + 12, y + 18, '?', 15) : `<circle cx="${x + 12}" cy="${y + 12}" r="${3 + ((r + c) % 3) * 2.5}" fill="${(r + 2 * c) % 3 === 0 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"/>`}`; }).join('')).join('')}</svg>`,
    // גביע ומנעול – אתגר אלופים
    champ: open => `<svg viewBox="0 0 180 100" aria-hidden="true"><path d="M70 14h40v24a20 20 0 0 1-40 0z" ${S}/><path d="M70 22H56a14 14 0 0 0 14 18M110 22h14a14 14 0 0 1-14 18" ${S}/><path d="M90 58v12M78 86h24M82 70h16v16H82z" ${S}/>
      ${open ? '' : `<g transform="translate(104 56)"><rect x="0" y="12" width="26" height="20" rx="4" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M5 12V8a8 8 0 0 1 16 0v4" ${S}/><circle cx="13" cy="22" r="2.2" fill="currentColor"/></g>`}</svg>`
  };
  // איור לכריכת קורס – לפי הקטגוריה
  window.NB_ART = { ic, ART, frac };
})();
