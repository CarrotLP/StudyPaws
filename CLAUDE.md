@AGENTS.md
Haven — Project Rules for Claude Code
This file is your persistent context for this repo. Read it on every turn.

What this app is
Haven is a cozy study companion: a Pomodoro-style focus timer where students earn points and pixel-art accessories for a virtual cat (Mochi) by completing focus blocks and using their break time well. It is being built as a university coursework pitch, by a team of 4, over ~2 weeks, in Expo / React Native.
The product thesis matters because it constrains the design. The app addresses the cycle of students doomscrolling reels when tired, leaving the feed agitated, and getting stuck in a negative spiral. Haven rewards the alternatives (focus blocks, phone-off breaks, stretches, walks, water) rather than punishing scroll time. Haven must never reproduce the compulsion mechanics it is designed to counter. Several rules below follow directly from this.

The authoritative design target
The file haven_prototype.html in the repo root is the single source of truth for what the app should look and behave like. It is the working HTML/React/CSS prototype that the team has iterated on through multiple rounds of design.
When porting or extending the app:

If the on-disk haven_prototype.html ever conflicts with anything you remember from a previous read, the on-disk file wins. Re-read it from scratch when in doubt.
The prototype defines the visual style, the screen list, the state model, the timer logic, the chest mechanic, the calendar shape, and the copy. Replicate it faithfully unless the user explicitly asks for a deviation.
If a feature isn't in the prototype, it isn't part of the app. Don't invent features.

What the prototype is

Pixel-art aesthetic, inspired by a fantasy RPG spellbook. Leather book cover with gold inlay, parchment pages, chunky pixel borders, deep navy and warm cream palette.
Fonts: Press Start 2P (headers, labels, numbers) and VT323 (body text). These are loaded via @expo-google-fonts/press-start-2p and @expo-google-fonts/vt323.
Cat sprite: a 32×32 hand-placed pixel-art tabby cat, with separate awake and sleeping sprite arrays. Outfit layers are positioned pixel blocks placed on top.
Six chapters accessed via right-edge ribbon tabs: Home, Calendar, Dress, Treasure, Inventory, Buddies.

If the prototype shows it, replicate it. If it doesn't, don't add it.

Hard rules — never violate these
These are not stylistic preferences; they are load-bearing design commitments tied to the product thesis.
1. Pixel art is load-bearing. Do not "improve" it.
The sprite arrays in the prototype (cat awake, cat sleeping, treasure chest closed/open, item icons, buddy avatars) are hand-placed pixel art. They look chunky and "ugly" because pixel art is chunky. They are not bugs to be fixed.

Never redraw, smooth, anti-alias, or "tidy" any sprite array.
Never swap a sprite for an SVG, emoji, image asset, or icon library glyph.
Never reduce or expand a sprite's grid dimensions to "make it cleaner."
Port sprite arrays verbatim, character for character, from the prototype.
If a sprite character mapping looks off, ask the user — don't guess.

2. No gacha. No randomised compulsion mechanics.
The reward system is transparent treasure chests. Each chest displays the full pool of items it can contain. The user knows what they are working toward before they open it. The randomness is bounded (one of three or four known items), not open-ended.

Never add hidden item pools, "rare drops," weighted probabilities, or surprise reveals beyond what the prototype does.
Never add a separate "premium" or "paid" chest tier.
Never add pity timers, rolling jackpots, or any mechanic whose purpose is to extend the gambling loop.
The duplicate refund (25 points back if you already own the item) is intentional. Keep it.

3. No engagement-maximising patterns.
Haven is designed to be a short-session app. Success means the user finishes a focus block, claims a break habit, and closes the app — not that they stay scrolling through chapters.

Never add login streaks, daily-reward calendars, "don't break the chain" mechanics, or any FOMO-driven retention loop.
Never add push notifications encouraging the user to "come back."
Never add badges, achievements, levels, or XP systems that incentivise time-on-app.
Points accrue from real-world behaviour. They do not accrue from opening the app.

4. No false claims about what sensors detect.
The prototype is honest about what it measures. We reward putting the phone down for a focus block, not "studying." We reward phone-off duration during a break, not "rest quality."

Never label a button or screen with a claim the underlying mechanism can't deliver.
Never add fake biometric or "AI-detected" claims.
If you're unsure whether a phrase overpromises, default to plainer language.

5. The leaderboard ranks habit effort, never items or wealth.
The Buddies chapter is competitive on healthy-habit count (focus blocks completed, break habits done). It is never competitive on points spent, items owned, outfit value, or aesthetic ranking.

Never sort Buddies by points balance or item count.
Never add a "best dressed" or "most popular space" leaderboard.


Coding style rules
Use the existing repo conventions
This repo was created with npx create-expo-app (TypeScript, Expo Router). Match its conventions:

TypeScript everywhere, no plain .js for new files.
File-based routing via Expo Router under app/.
Shared components under components/, constants under src/constants/.
Path alias @/ for repo-root-relative imports.

Don't restructure the project to match a different template you might prefer.
Don't touch what you don't own

The stock Expo src/constants/theme.ts is for the Expo template's light/dark mode. Do not modify it. Haven's tokens live in src/constants/havenTheme.ts.
Don't delete or rename files the user didn't ask you to touch.
Don't reformat unrelated files even if they're "messy."

Use the right install command

Native packages (anything that touches iOS/Android code: expo-font, expo-splash-screen, @react-native-async-storage/async-storage, react-native-reanimated, react-native-svg, etc.): npx expo install <pkg>.
Pure JS packages: npm install <pkg>.
Never use bare npm install for a native package — Expo SDK version constraints will silently break the build.

Timers must survive backgrounding
Haven's core mechanic is a Pomodoro timer. A setInterval or setTimeout loop pauses when the phone is locked or the app is backgrounded, which would break the entire app's value proposition.
The correct pattern: store the session's start timestamp and intended duration. On every render and on every app-state change to "active," compute secondsLeft = Math.max(0, duration - (now - start)). Persist start timestamp via AsyncStorage so the session survives an app kill.

Never rely on a JS interval as the source of truth for time elapsed.
Always treat wall-clock time as the truth.

Persist what the user has earned
Study history, owned items, current outfit, points balance, and earned-chest counts must survive app restarts. Use AsyncStorage via @react-native-async-storage/async-storage.
The HTML prototype seeds fake calendar data on first launch so the demo isn't empty. Replicate this: on first run, populate the previous ~5 weeks of study history with plausible random values. Detect "first run" by the absence of a sentinel key in AsyncStorage.
Animations
The HTML prototype uses CSS animations (breathe, sleeping Zzz, toast pop, chest glow, reveal pop). In React Native, port these using react-native-reanimated v3 worklets where possible, falling back to the built-in Animated API for very simple cases. Don't mix the two within a single component.
Don't load fonts inline
Use expo-font with useFonts() and hold the splash screen via expo-splash-screen until both Press Start 2P and VT323 are loaded. Rendering before fonts load causes a visible system-font flash that breaks the aesthetic.

The team's working style with you
The team works with you in small, gated steps:

One step per turn. Do what was asked, then stop. Don't anticipate the next step.
Report before mutating. When asked to read or summarise, do not modify code.
Ask before guessing. If two parts of the prototype seem to conflict, or if a spec is ambiguous, raise it before writing code. The team has explicitly thanked you for catching mismatches.
Don't bundle files. If asked to port the Home screen, port only the Home screen, not Home + Dress because they're "similar."

If you finish a step and the next obvious step seems small, still stop and confirm. The cost of an extra confirmation turn is low; the cost of redoing several wrong steps is high.

Things that will probably come up

"Just use an icon library for the items." No. Pixel item icons are part of the aesthetic. They're tiny sprite arrays in haven_prototype.html. Port them faithfully.
"Can we use a slot machine animation for chest opens?" No. The chest open is a fixed two-stage reveal (closed → glow → open with item inside). It is not a spinning reel. See Hard Rule 2.
"The cat should blink." Only if the prototype shows it. As of this writing it does not.
"Should we add haptic feedback to the timer?" Only if the user explicitly asks. Don't add unprompted polish that affects perceived "addictiveness."


When in doubt
Re-read haven_prototype.html. Then ask the user. In that order.