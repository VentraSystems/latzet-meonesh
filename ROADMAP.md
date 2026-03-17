# Escape Challenge — Project Roadmap

## 🎯 Project Overview
**App Name:** Escape Challenge (לצאת מעונש)
**Target Market:** Parents and children (Hebrew/English bilingual)
**Core Concept:** Real-time synced Parent-Child app where children complete tasks to earn freedom from challenges/punishments
**Live URL:** https://escapechallenge.ventrasystems.com

---

## ✅ Phase 1: Foundation & Setup — COMPLETED
- [x] Environment setup (Node.js, Expo CLI, TypeScript)
- [x] Firebase project configured (Auth + Firestore)
- [x] React Navigation — Parent & Child navigator stacks
- [x] Hebrew RTL + English LTR support
- [x] Role selection screen (Parent / Child)
- [x] Bilingual i18n system (`en.ts` / `he.ts`) with `useLanguage` hook

---

## ✅ Phase 2: Authentication & Linking — COMPLETED
- [x] Email/password login for parents
- [x] Google Sign-In for parents
- [x] Auto-generated child accounts (random credentials)
- [x] 6-digit linking code — parent generates → child enters
- [x] Child reconnect flow (re-link existing child)
- [x] Multi-child support (parent linked to multiple children)
- [x] Firestore security rules
- [x] Auth context with `linkedUserIds` array

---

## ✅ Phase 3: Parent App — COMPLETED

### Home Dashboard
- [x] Multi-child cards — one card per linked child
- [x] Per-child progress bar, task stats (completed / total / pending)
- [x] Status pills: Free / In Challenge / Challenge Complete
- [x] Pending approval alert banner with count
- [x] Dynamic action buttons: Assign Challenge / Approve Tasks / Review / Unlock Phone
- [x] **➕ Add More Tasks button** — add tasks to an active challenge without creating a new one
- [x] Settings accessible even when no child connected
- [x] Reports & Analytics, Wallet & Rewards, Add Child shortcuts

### Set Challenge Screen
- [x] Challenge name input with **AI autofill** (auto-generates name from selected tasks)
- [x] Preset task library: Household Chores, Behavior tasks
- [x] Custom task input with optional photo
- [x] **AI Quiz generation** — select subject + difficulty + grade, generates 5-question quiz via API
- [x] **AI task suggestions** — "Surprise Me" generates 6 personalized tasks
- [x] **Homework assignment tasks** — attach photo of assignment sheet
- [x] **Mini-games** — Math Blitz, Memory Sequence with difficulty/grade settings
- [x] Per-task details: parent notes + up to 4 reference photos
- [x] Daily repeat option (task repeats N days, unlocks sequentially)
- [x] No-phone duration picker (minutes/hours)
- [x] **Add to existing challenge mode** — hides name field, uses `arrayUnion` to append tasks

### Task Approval Screen
- [x] Tabs: "Needs Approval" / "Completed"
- [x] Child's submitted note visible
- [x] Homework attachment photo viewable
- [x] Approve / Reject buttons with confirmation
- [x] Atomic Firestore write (single `updateDoc`) — fixes race condition where challenge appeared active-but-complete
- [x] All labels fully translated (no hardcoded Hebrew)

### Settings Screen
- [x] Profile info, connected children list
- [x] Disconnect child
- [x] Language switcher (English / Hebrew)
- [x] Push notification toggle

### Other Parent Screens
- [x] Link/Reconnect Child screen
- [x] Analytics & Reports screen
- [x] Wallet & Rewards screen
- [x] Punishment History screen

---

## ✅ Phase 4: Child App — COMPLETED

### Home Screen
- [x] Real-time challenge display (name, progress, task count)
- [x] Progress bar + "X more tasks and you are free!"
- [x] Stars ⭐ and trophy 🏆 counters in header
- [x] Task summary cards with status icons
- [x] Freedom state ("You are completely free! 🌟")

### Tasks List Screen
- [x] Full task list with status labels (Waiting / Waiting for approval ⏳ / Approved ✅ / Rejected ❌)
- [x] "Mark as done ✓" submit flow with optional note + proof photo
- [x] Photo upload with compression (ImageManipulator)
- [x] Edit/resubmit submitted tasks
- [x] **Retry rejected quiz** ("Retry Quiz 🧠" button)
- [x] **Retry rejected mini-game** ("Retry Game 🎮" button)
- [x] Parent reference photos viewable per task
- [x] Homework attachment photo viewable
- [x] Locked tasks with unlock date shown ("Available {date}")
- [x] Improved upload error messaging

### Quiz Screen
- [x] AI-generated multi-choice questions
- [x] **Green highlight for correct answers** (previously always red — fixed)
- [x] Red highlight for wrong answers
- [x] Score calculation + submit to Firestore

### Mini-Game Screen
- [x] Math Blitz — speed math game
- [x] Memory Sequence — pattern memory game
- [x] Difficulty-based scoring

### Other Child Screens
- [x] Freedom/Celebration screen (confetti, task summary)
- [x] Badges & Achievements screen
- [x] Wallet screen (coins/rewards)
- [x] Enter Linking Code screen (onboarding)

---

## ✅ Phase 5: Real-time Sync & Notifications — COMPLETED
- [x] Firestore real-time `onSnapshot` listeners (parent + child)
- [x] Push notification on new challenge assigned
- [x] Push notification on task approved/rejected
- [x] Pending count badge on parent home

---

## ✅ Phase 6: UI/UX Polish — COMPLETED
- [x] Dark theme throughout (`#1a1a2e` / `#1E2140` gradient)
- [x] Visible back button (white `headerTintColor` on dark header) — Parent & Child navigators
- [x] Linear gradients on all action buttons
- [x] Card-based layout with shadows
- [x] Loading states (ActivityIndicator) and empty states
- [x] RTL-aware text alignment throughout
- [x] Wallet icon in child header

---

## ✅ Phase 7: Bug Fixes & Language Consistency — COMPLETED
- [x] **All screens English-only when language = English** — removed all hardcoded Hebrew fallbacks
- [x] Task Approval screen tabs ("Needs Approval" / "Completed") fully translated
- [x] AI suggestion autofill — fixed `sg.id` → `sg._id` lookup bug
- [x] Challenge creation race condition — merged two `updateDoc` calls into one atomic write
- [x] Duplicate `hwPhotoLabel` StyleSheet property — renamed to `hwPhotoLabelFull`
- [x] Photo upload "failed to fetch" — better error detection for network errors
- [x] Quiz correct answer colour — green (`#27AE60`) instead of red
- [x] Settings accessible from no-child-connected screen

---

## ✅ Phase 8: Testing — COMPLETED
- [x] Playwright headless browser e2e tests on live VPS
- [x] Full parent → child → approval flow verified
- [x] Language consistency verified across all screens (zero Hebrew when set to English)
- [x] "Add More Tasks" flow verified (Firestore `arrayUnion` confirmed working)
- [x] Zero JS errors in production bundle

---

## 🔜 Phase 9: Upcoming / Backlog

### App Store Deployment
- [ ] EAS Build — iOS `.ipa` + Android `.apk`
- [ ] App Store Connect submission
- [ ] Google Play Console submission
- [ ] App icon + splash screen (final assets)
- [ ] App Store screenshots (Hebrew + English)
- [ ] Privacy policy & Terms of service pages

### Features
- [ ] Parent can add a rejection reason/message when rejecting a task (visible to child)
- [ ] Child can view the rejection reason before retrying
- [ ] Parent-child in-app messaging per task
- [ ] Streak / daily login bonus for children
- [ ] Parent can set a reward for completing the full challenge (e.g. "You get ice cream")
- [ ] Multiple simultaneous challenges per child
- [ ] Export challenge history as PDF/report

### Infrastructure
- [ ] Sentry error logging
- [ ] Firebase Analytics event tracking
- [ ] CI/CD pipeline (GitHub Actions → auto-deploy to VPS on push to main)
- [ ] Automated Playwright regression tests on every deploy

---

## 📊 Current Status — March 2026

**Production:** Live at https://escapechallenge.ventrasystems.com

**All core features shipped and tested.** The app supports the full parent-child challenge workflow end-to-end including AI quizzes, mini-games, homework tasks, photo uploads, multi-child management, bilingual support, and real-time sync.

**Next milestone:** App Store / Google Play submission.
