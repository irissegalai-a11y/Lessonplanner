# App Prompt — "The Green Trail Across Israel" (working title, change as you like)

This document is a detailed prompt that can be handed off — to a developer, a studio, or an AI coding tool — to actually build the app. It covers concept, structure, game mechanics, progression, the educational feedback loop, and the required tech stack. It does **not** touch actual art direction: wherever a graphic asset is needed, the document only states *what* is needed (an item list), never *how* it should look.

> **Critical note for whoever implements this prompt (developer or AI tool):**
> Do not create, generate, or suggest any illustrations, characters, backgrounds, color palettes, fonts, or other art assets. Wherever a visual asset is required, use a plain neutral placeholder only (e.g., a gray rectangle/shape labeled "[art: banana peel]") and leave the slot empty. All graphics, illustrations, and animations will be created and added separately, by hand, by the app's creator.

---

## Short Version (quick-copy prompt)

> Build a native Android educational game app for children (roughly ages 5–10) that teaches environmental and recycling values through short, fun mini-games, built around one core idea: **clean = pleasant, dirty = unpleasant**. The app is structured as a journey along the Israel National Trail, on an illustrated map of Israel (from Mount Hermon in the north to Eilat in the south), where each stop on the map is a "level" set in a real, recognizable place, with its own visual atmosphere. Each level contains 10 short mini-games (about 30–60 seconds each) about cleaning up, collecting, and sorting litter: 6 of them are fixed core mechanics that repeat in every level and only get harder over time, and 4 of them are location-specific, with scenery, obstacles, and scenarios tailored to that spot. The rest of this document details all 10 game concepts, their mechanics, end conditions, and difficulty-scaling rules.
>
> **Build it natively in Java using Android Studio (standard Android SDK) — no cross-platform framework (no Flutter, React Native, Unity, etc.). Do not add any illustration, character, background, or graphic asset — use text-only placeholders wherever a visual asset is needed, since all artwork will be created separately by the app's creator.**

---

## 1. Target Audience & Core Educational Goal

- **Target audience:** children roughly ages 5–10 (also usable at kindergarten age with an adult nearby, up through the lower elementary grades). The age range can be tuned.
- **Core goal:** to instill in young children an intuitive, felt sense — not just dry recycling facts — built on one equation: **clean = pleasant, dirty = unpleasant**.
- **Guiding principle:** the message repeats across many different contexts (10 different game mechanics, a fresh set in every level) so the child internalizes it as a general principle about the environment, not a rule tied to one specific game.

## 2. Inspiration & Concept

- **Structural inspiration:** the kids' show "Room and a Half" (Cheder VaChetzi) — one world made of small, varied content "corners" inside a single unifying frame.
- **Mechanic inspiration:** Among Us (cleaning tasks), phone-tilt games, Crossy Road, Temple Run / Subway Surfers, "Where's Wally/Waldo" search-and-find books, Whac-a-Mole, and spot-the-difference games.
- **Central organizing idea:** a geographic, atmospheric journey along the Israel National Trail, from the north (Mount Hermon) to the south (Eilat), where each recognizable stop "hosts" one level.

## 3. Level Map Structure

The home screen is an illustrated map of Israel (the illustration itself is yours to create) with a winding path connecting level nodes, similar to level-select screens in common mobile games. Each level node is a real, recognizable place in Israel that conveys an atmosphere (vibe, tones, local natural elements) matching that place.

Here is an **example route** (fully open to change — order, number of levels, and station names all included):

| # | Stop | General mood/atmosphere (direction only, not an art brief) |
|---|------|--------------------------------------------------------------|
| 1 | Mount Hermon & the Golan Heights | mountains, snow, rocks, springs |
| 2 | The Sea of Galilee & Tzfat | water, boats, rural-mountain scenery |
| 3 | Jezreel Valley & the Carmel (Haifa) | green fields, forest, sea view from the Carmel |
| 4 | The Sharon & Caesarea | seashore, ancient ruins |
| 5 | Tel Aviv–Jaffa | urban, boardwalk, city beach |
| 6 | Jerusalem & the Judean Hills | terraced mountains, pine forests |
| 7 | The Judean Desert & the Dead Sea | cliffs, salt, wadis |
| 8 | The Negev & Ramon Crater | desert, craters, desert wildlife |
| 9 | The Arava | dry riverbeds, desert vegetation |
| 10 | Eilat & the Red Sea | coral reef, tropical coastline |

A new level unlocks after the previous one is completed (or after collecting enough stars from it — see section 7).

## 4. Level Structure: 10 Games = 6 Recurring + 4 Location-Specific

Every level contains 10 mini-games, but the whole app really only needs **10 "game engines"** (the mechanics from the original list) — so instead of designing 100 different games, you build 10 mechanics that each take different parameters (difficulty) and different dressing (location) per level.

**6 recurring games** — the exact same mechanic in every level, only getting harder over time:
1. Trash Cleanup Task (Among Us–inspired)
2. Rolling Banana Peel (device tilt)
4. Black Beetle Trash Roller
6. Pop-Up Sort (whack-a-mole style)
9. Cleanup Runner (Temple Run–inspired)
10. Recycling Sort

*Why these:* these are skill-based mechanics that can "accept" new dressing (background, colors) without needing a whole new scenario designed each time, so they can stay structurally identical while difficulty ramps up cleanly. It matters that the sorting game (#10) stays consistent for educational reasons too — the child should learn one fixed rule (which bin takes which kind of trash) without it changing from version to version.

**4 location-specific games** — same base mechanic, but with a scenario/scenery/obstacles tailored to each specific stop:
3. Green Crossy Trail (walking through nature, collecting litter)
5. Where's the Litter? (spotting litter in a large scene of the place)
7. Act Natural (spotting who's littering among a group of characters)
8. Spot the Difference in the Backpack (scanning a bag before/after a site visit)

*Why these:* these already require a brand-new "scene" every time anyway (a full background, a group of characters, a backpack illustration) — so it makes sense to tailor them to each specific place, making every level feel tied to its spot on the map.

**Important:** this recurring/location-specific assignment is a default recommendation, not a hard rule — feel free to change it based on judgment or on what's practical to illustrate.

**Difficulty scaling between levels:** in each level, gradually raise 2–3 of the following parameters (across all 10 games): speed, number of obstacles/items, available time (decreasing), track length/area size, number of "distractors" (e.g., flowers/animals in the games where that applies). A moderate increase (roughly 10–15% per level) is recommended so young children don't get frustrated.

## 5. The Educational Feedback Loop (the heart of the game)

Every mini-game, regardless of its mechanic, should close a clear loop: **"before" — dirty and unpleasant → "after" — clean and pleasant.** A short, clear moment at the end of each mini-game where the screen/scene transitions from a dirty state to a clean state, paired with positive feedback. This way the "clean = pleasant" message repeats across all 10 games, not just in one specific one.

## 6. Detailed Breakdown of the 10 Games

### 1. Trash Cleanup Task (Among Us–inspired)
- **Goal:** clean up a spot littered with scattered trash.
- **Controls:** tap/drag each trash item into a bag/bin.
- **End condition:** all (or most) trash collected within the given time.
- **Difficulty scaling:** more trash items, wider spread, less time, items that drift slightly.
- **Assets needed (list only):** a few trash item types, a target bag/bin, a "dirty" background state and a "clean" background state.

### 2. Rolling Banana Peel
- **Goal:** guide a banana peel along a path to a trash can, dodging obstacles.
- **Controls:** tilt the device left/right (optionally forward/back too).
- **End condition:** reaching the trash can at the end of the path.
- **Difficulty scaling:** narrower path, more/faster obstacles, longer path.
- **Assets:** banana peel character, 3–4 obstacle types, trash can, path background.

### 3. Green Crossy Trail — location-specific
- **Goal:** move between "lanes" in nature (Crossy Road–style), collecting litter along the way (instead of coins), until the end of the sub-level.
- **Controls:** tap/swipe in four directions — forward, back, left, right — one step at a time.
- **End condition:** reaching the end of the path with at least the minimum litter collected (for a full score).
- **Difficulty scaling:** more obstacle "lanes," faster-moving obstacles, higher litter quota.
- **Assets:** a hiker character, obstacles specific to the location, ground/path art specific to the location, litter items.

### 4. Black Beetle
- **Goal:** move across a surface, collect litter and roll it into a growing ball, while avoiding touching flowers.
- **Controls:** virtual joystick/drag, or tilt.
- **End condition:** reaching a trash can and dropping the litter ball at the end.
- **Difficulty scaling:** more flowers (obstacles), a larger area, more litter required to fill the ball.
- **Assets:** beetle character, 2–3 ball-size states, flowers, litter items, trash can.

### 5. Where's the Litter? — location-specific
- **Goal:** find litter items hidden inside one large, busy scene of the specific place (inspired by "Where's Wally/Waldo").
- **Controls:** tap each litter item found.
- **End condition:** finding all/most items within the given time.
- **Difficulty scaling:** smaller/more camouflaged items, more visual distractors, less time.
- **Assets:** one large, detailed background scene per location, 6–10 "hidden" litter items within it.

### 6. Pop-Up Sort (whack-a-mole style)
- **Goal:** tap only the litter popping out of holes, without hitting the flowers/animals that pop up too.
- **Controls:** quick taps on the right hole at the right moment.
- **End condition:** time runs out, or a litter quota is reached.
- **Difficulty scaling:** faster pop-up rate, more holes active at once, a higher ratio of distractors to litter.
- **Assets:** hole/ground base art, a few flower/animal types, a few litter types.

### 7. Act Natural — location-specific
- **Goal:** watch a group of characters in a natural setting, spot who starts littering, then drag them out of the area.
- **Controls:** observation (no input), then tap + drag the littering character off-screen.
- **End condition:** removing the littering character(s) before they finish littering.
- **Difficulty scaling:** more characters on screen, a faster/subtler tell, more than one littering character at once.
- **Assets:** a handful of human characters (with a visual littering cue), a natural background scene specific to the location.

### 8. Spot the Difference in the Backpack — location-specific
- **Goal:** compare a "before" and "after" illustration of a backpack's contents and mark missing items (e.g., wrappers left behind in nature instead of packed back out).
- **Controls:** tap the differences/missing items.
- **End condition:** correctly marking all differences within the given time.
- **Difficulty scaling:** more items in the bag, subtler differences, less time.
- **Assets:** a matched pair of illustrations (before/after) of bag contents, per location; a scanner-style frame/background.

### 9. Cleanup Runner (Temple Run–inspired)
- **Goal:** run forward, collecting litter and dodging obstacles, ending at a trash can.
- **Controls:** swipe to change lanes / jump / duck.
- **End condition:** reaching the trash can at the end of the track (a finite track, not endless like the original).
- **Difficulty scaling:** faster run speed, more obstacles, more litter required, tighter lane-switch timing.
- **Assets:** a runner character, a track background specific to the location, obstacles, litter items, a trash can/finish marker.

### 10. Recycling Sort
- **Goal:** sort items by type into the correct bin. Based on Israel's standard system: green = glass, blue = paper, orange = packaging — worth double-checking against current local guidelines, since municipalities vary.
- **Controls:** drag an item to the matching bin (or tap an item, then tap a bin).
- **End condition:** all items that appeared have been sorted.
- **Difficulty scaling:** faster appearance rate, more items on screen at once, more "confusing" item pairs (e.g., a glass bottle vs. a plastic bottle), less decision time.
- **Assets:** three bins (green/blue/orange), a variety of product items (glass bottle, plastic bottle, cardboard box, newspaper, etc.).

## 7. Progression, Scoring & Rewards

- Each mini-game ends with a 1–3 star score (e.g., based on time, accuracy, and mistake count).
- Stars collected across all 10 games in a level unlock the next level on the map.
- At the end of each full level (all 10 games) — a short celebratory moment: a "before/after" transition of the whole location (dirty → clean and pleasant), sealing the message at the level level, not just per mini-game.
- **Optional idea:** a "Cleaner's Passport" — one stamp per completed region, as a travel souvenir, reinforcing the sense of a journey across the country.

## 8. Design Principles for Young Children

- Short play sessions per mini-game (roughly 30–60 seconds).
- Minimal text instructions — prefer a short demo/animation/icons over written explanation (part of the audience isn't reading fluently yet).
- No scary or punishing "failure" screens — encourage retrying, always in a positive, supportive tone.
- Positive feedback should dominate over negative feedback; even a mistake is shown gently (e.g., "Almost! Try again?").
- Touch targets large enough for small fingers, and clear color contrast (relevant once you design the actual graphics).

## 9. Optional Enrichment Ideas (not part of the original requirements — entirely your call)

- A recurring companion character throughout the journey (e.g., a native Israeli animal) that gives brief encouragement at the end of each game.
- The "Cleaner's Passport" described in section 7.
- A simple parent/teacher progress-overview screen — relevant if the app is also used in a classroom setting.
- A sound layer: short "clean" vs. "dirty" audio cues (not part of the graphics, but worth planning separately, the same way as the illustrations).
- A "parent/teacher" mode to manually pick a level, for classroom teaching purposes.

## 10. Technical Requirements (mandatory)

- **Language & platform:** native Android, written in **Java**, built and run in **Android Studio** with a standard Gradle build. No cross-platform framework (no Flutter, React Native, Unity, Cocos, etc.) and no Kotlin.
- **Orientation:** portrait, most likely.
- **Sensors:** game #2 needs `SensorManager` with `TYPE_ACCELEROMETER` (or the game rotation vector sensor) for tilt control.
- **Rendering approach:** these are simple 2D arcade mechanics, so a lightweight `SurfaceView`/custom `View` with a `Canvas`-based game loop is enough for the arcade-style games (banana peel, beetle, pop-up sort, runner, crossy trail) — no external game-engine dependency is needed. This also keeps placeholders trivial: draw plain shapes (`drawRect`/`drawCircle`/`drawText`) or a plain `Drawable`/`Bitmap` reference that can be swapped for real art later without touching game logic.
- **Suggested architecture:** one `Activity`/`Fragment` for the map screen, one that hosts a level's sequence of 10 mini-games, and a small base class/interface that each of the 10 mechanics implements, each configurable through a simple difficulty-parameters object (speed, obstacle count, time limit, litter quota, etc.) passed in per level — so the same mechanic class serves every level and every location without duplicating code.
- **Level/location config:** store each level's difficulty parameters and which 4 games are the location-specific ones for that level as simple config data (e.g., POJOs or a bundled JSON asset), so adding a new level later is a config + art change, not new game logic.
- **Progress storage:** `SharedPreferences` is enough for star ratings and level-unlock state — no database needed given how little data this is.
- **SDK versions:** a reasonable modern default (e.g., `minSdk` 24+, latest `targetSdk`) — not prescribed further here.
- **Placeholder convention:** wherever art is required, draw a plain shape/color via `Canvas` or use a plain colored `View`/`ImageView` with a text label naming the asset (e.g., "[art: banana peel]"), so real drawable resources can be dropped in later with no logic changes.

## Appendix — Consolidated Graphic Asset Checklist (for planning your illustration work only, not for implementation)

| Game | Key assets needed |
|------|--------------------|
| 1. Trash Cleanup Task | a few trash item types, bag/bin, dirty background + clean background |
| 2. Rolling Banana Peel | peel character, obstacles, trash can, path background |
| 3. Green Crossy Trail | hiker character, location-specific obstacles, location-specific ground, litter |
| 4. Black Beetle | beetle character, 2–3 litter-ball sizes, flowers, litter, trash can |
| 5. Where's the Litter? | one large location-specific background scene, hidden litter items |
| 6. Pop-Up Sort | holes/base art, a few flower/animal types, litter types |
| 7. Act Natural | a few human characters, location-specific natural background |
| 8. Spot the Difference in the Backpack | a before/after pair of bag-contents illustrations per location, scanner frame |
| 9. Cleanup Runner | runner character, location-specific track background, obstacles, litter, trash can |
| 10. Recycling Sort | 3 bins (green/blue/orange), a variety of product items |
| Level map | Israel map background, trail/route line, level-node icons (locked/unlocked/starred) |

---

This is a first-draft prompt — every detail in it (names, the example route, the 6/4 split, the difficulty percentages, the optional ideas) is fully open for you to change.
