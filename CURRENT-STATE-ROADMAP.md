# Escape Challenge — Current State Roadmap
**Last updated: March 12, 2026**
**Web:** https://escapechallenge.ventrasystems.com/
**Project dir:** `C:\Users\LENOVO J\get-out-of-punishment`
**Stack:** React Native / Expo + Firebase + Express (ai-quiz-server.js on Hostinger VPS)

---

## ✅ WHAT IS 100% BUILT & WORKING

### Authentication
- Email/password login & signup
- Google Sign-In
- Child auto-account creation (no password needed for kids)
- Device-based auto-login for children
- Parent-Child linking via 6-digit codes
- Firestore security rules deployed

### Parent Screens
| Screen | Status | Notes |
|---|---|---|
| ParentHomeScreen | ✅ Done | **Multi-child dashboard** — card per child, real-time status, "🔓 Unlock Phone Now" when child completes |
| SetPunishmentScreen | ✅ Done | Full-featured (see below) |
| TaskApprovalScreen | ✅ Done | Approve/reject with reasons, cross-platform modal |
| LinkChildScreen | ✅ Done | Generate & share 6-digit codes |
| SettingsScreen | ✅ Done | Profile, **all linked children listed with individual unlink**, language toggle, notifications, logout, delete account |
| ParentAnalyticsScreen | ✅ Done | Task completion rates, quiz scores, chore vs homework breakdown |
| ParentWalletScreen | ✅ Done | Manage reward catalog, configure coin rates, approve redemptions |

### SetPunishmentScreen — Full Feature List
- Punishment name input
- Task presets: Chores, Homework, Behavior (Hebrew + English)
- AI task suggestions via `/api/suggest-tasks` (grade-aware, Claude-powered)
- Per-task detail panel: notes + reference photos (image upload to VPS)
- Task repeats/recurring: `unlockDate` field so tasks unlock day-by-day
- No-phone timer task (1–12 hour picker)
- Homework custom tasks with description + reference photo
- AI quizzes: 8 subjects (Math, Hebrew, English, Science, Bible, History, Geography, General Knowledge), 3 difficulty levels, grades 1–12
- Mini-game assignments: Math Blitz / Memory Sequence
- Send to Firestore + push notification to child

### Child Screens
| Screen | Status | Notes |
|---|---|---|
| ChildHomeScreen | ✅ Done | Real-time punishment display, progress bar, points/badges counters |
| TasksListScreen | ✅ Done | Submit tasks, add note, **photo upload proof** (camera + gallery) |
| QuizScreen | ✅ Done | Multiple choice, 60% pass threshold, shows correct answers after |
| FreedomScreen | ✅ Done | Confetti animation, celebration, stats summary |
| BadgesScreen | ✅ Done | Points total, badges grid (locked/unlocked), task & quiz counts |
| MiniGameScreen | ✅ Done | Math Blitz + Memory Sequence, grade-adaptive difficulty |
| ChildWalletScreen | ✅ Done | Coin balance, transaction history, redeem rewards |
| EnterLinkingCodeScreen | ✅ Done | Animated 6-digit code entry |

### Gamification System
- **Points:** earned per task type (quiz=25, homework=20, chore=15, behavior=15, custom=10)
- **Badges (8):** first_task, quiz_master, helper, brain_power, warrior, perfectionist, champion, free_bird
- **Coins/Wallet:** earned per task/quiz/game, customizable rates, parent-managed reward catalog
  - Default rewards: screen time, choose dinner, cash allowance, gaming time
  - Parent can add/remove/edit rewards
  - Child redeems → parent gets notification → parent fulfills
- **Mini-Games:** Math Blitz (timed arithmetic) + Memory Sequence
  - Grade-adaptive math (bands: Gr1-2, Gr3-4, Gr5-6, Gr7+)
  - 3 difficulty levels

### Backend (ai-quiz-server.js on VPS)
- `POST /api/generate-quiz` — Claude Haiku generates 5 questions per subject/difficulty/grade
- `POST /api/suggest-tasks` — AI suggests age-appropriate tasks for child
- `POST /api/upload-image` — Image upload for task reference photos & completion proof

### Infrastructure
- Firebase Firestore (real-time sync)
- Firebase Auth
- Push notifications (Expo Push API, tokens stored in Firestore)
- Multi-language: English + Hebrew, auto-detect from device locale, RTL support
- Web export deployed to escapechallenge.ventrasystems.com
- Android .aab & iOS .ipa built with EAS
- Both apps submitted: Google Play (Closed Testing Alpha) + TestFlight (Feb 18, 2026)
- Privacy Policy & Delete Account pages live on GitHub Pages

---

## 🔄 CURRENT TESTING APPROACH

**Testing via web browser at https://escapechallenge.ventrasystems.com/**
→ Once satisfied, push updated .aab/.ipa builds to stores

---

## 🟡 KNOWN GAPS / TODO (Priority Order)

### HIGH PRIORITY
1. ~~**Multi-child support**~~ ✅ **DONE (March 12, 2026)**
   - ParentHomeScreen redesigned as multi-child dashboard (one card per child)
   - Each card: real-time status, progress bar, task stats, context-aware action button
   - "🔓 Unlock Phone Now" button appears when child completes all tasks
   - SettingsScreen lists all children with individual unlink buttons
   - `linkedUserIds[]` fully wired in AuthContext, backward compatible

2. **Daily bonus coins** — `dailyBonus: 5` is in `DEFAULT_WALLET_CONFIG` but never triggered. Need:
   - Daily claim button or auto-award on first app open per day
   - Store `lastBonusDate` in Firestore user doc

3. **Streak system** — Track consecutive days completing tasks. Bonus points for streaks.

4. ~~**Language switcher in UI**~~ ✅ **DONE** — Toggle buttons (🇺🇸 / 🇮🇱) live in SettingsScreen.

5. **Child grade in profile** — Grade is read from Firestore for AI quiz generation but never set by user. Need a grade selector in child profile/onboarding.

### MEDIUM PRIORITY
6. **More badges** — Only 8 badges. Ideas:
   - streak_3, streak_7 (3/7 day streak)
   - game_pro (win 5 mini-games)
   - speed_demon (complete task within 1 hour)
   - consistent (complete all tasks same day 3x)

7. **More mini-games** — Math Blitz + Memory Sequence exist. Ideas:
   - Word scramble (Hebrew/English)
   - Spelling challenge
   - Time table trainer

8. **Punishment history** — Parent/child can view past completed punishments & stats.
   ParentAnalyticsScreen exists but only shows aggregate stats, not per-punishment history.

9. **Pull-to-refresh** — Both ParentHomeScreen and ChildHomeScreen missing pull-to-refresh.

10. **Better empty states** — When no punishment active, screens are bare. Add illustration + motivational message.

### LOWER PRIORITY
11. **Deep linking** — Tapping a push notification should navigate to the right screen.

12. **Offline handling** — No graceful degradation when device has no internet.

13. **Loading skeletons** — Replace `ActivityIndicator` with skeleton screens for better UX.

14. **Haptic feedback** — Add on task submit, approval, badge unlock.

15. **More quiz categories** — Add: Art, Music, Civic Studies, English vocab expansion.

16. **Parent custom quiz builder** — Let parent create their own questions (not AI-generated).

17. **Voice notes** — Child can attach a voice note to task submission.

18. **Time-based tasks** — "Study for 30 minutes" with a built-in timer.

19. **Leaderboard** — If multiple children, rank them by points.

20. **Export reports** — Parent can export task/quiz history as PDF.

---

## 📁 KEY FILE LOCATIONS

```
C:\Users\LENOVO J\get-out-of-punishment\
├── src/
│   ├── screens/
│   │   ├── Parent/
│   │   │   ├── ParentHomeScreen.tsx        ← main parent dashboard
│   │   │   ├── SetPunishmentScreen.tsx     ← create punishments (biggest file)
│   │   │   ├── TaskApprovalScreen.tsx      ← approve/reject tasks
│   │   │   ├── SettingsScreen.tsx          ← settings + language toggle (TODO)
│   │   │   ├── ParentAnalyticsScreen.tsx   ← stats dashboard
│   │   │   └── ParentWalletScreen.tsx      ← manage rewards & coins
│   │   └── Child/
│   │       ├── ChildHomeScreen.tsx         ← main child dashboard
│   │       ├── TasksListScreen.tsx         ← submit tasks with photo
│   │       ├── QuizScreen.tsx              ← AI-powered quizzes
│   │       ├── MiniGameScreen.tsx          ← Math Blitz + Memory Sequence
│   │       ├── BadgesScreen.tsx            ← points & badges
│   │       ├── ChildWalletScreen.tsx       ← spend coins on rewards
│   │       └── FreedomScreen.tsx           ← celebration screen
│   ├── contexts/
│   │   ├── AuthContext.tsx                 ← auth + linkedUserId (needs multi-child)
│   │   └── LanguageContext.tsx             ← en/he toggle, RTL
│   ├── utils/
│   │   ├── badges.ts                       ← BADGES config + awardPointsAndBadges()
│   │   ├── wallet.ts                       ← awardCoins(), redeemReward()
│   │   └── notifications.ts               ← push notification helpers
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── ParentNavigator.tsx
│   │   └── ChildNavigator.tsx
│   └── i18n/
│       ├── en.ts                           ← English translations
│       └── he.ts                           ← Hebrew translations
├── ai-quiz-server.js                       ← Express server on VPS (Claude Haiku)
└── dist/                                   ← web build (deployed to Hostinger)
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Web (current testing method)
```bash
cd "C:\Users\LENOVO J\get-out-of-punishment"
npx expo export --platform web
# then upload dist/ to Hostinger VPS or use deploy script
```

### Mobile (when ready)
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android --latest   # → Google Play
eas submit --platform ios --latest       # → App Store Connect
```

### Server (VPS)
- Server runs at escapechallenge.ventrasystems.com
- ai-quiz-server.js handles /api/* routes
- Uses ANTHROPIC_API_KEY env var

---

## 📱 STORE STATUS (as of Feb 18, 2026)
- **Google Play:** Closed Testing (Alpha) — submitted, in review
- **App Store:** TestFlight — build uploaded, processing
- **Bundle ID:** com.latzet.meonesh
- **App ID (iOS):** 6759312028
- **Version:** 1.0.0

---

## 🎯 SUGGESTED NEXT SESSION FOCUS

Pick ONE of these to tackle next:

**Option A — Daily bonus + streak system** (increases daily engagement)
**Option B — Child grade selector in profile** (improves AI quiz quality)
**Option C — More mini-games** (word scramble, spelling, times table)
**Option D — Punishment history screen** (parents want to see past data)
**Option E — Pull-to-refresh on home screens** (quick win)
