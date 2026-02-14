# לצאת מעונש - Project Roadmap

## 🎯 Project Overview
**App Name:** לצאת מעונש (Get Out of Punishment)
**Target Market:** Israeli parents and children
**Core Concept:** Real-time synced Parent-Child app where children complete tasks to earn freedom from punishments

---

## 📱 Phase 1: Foundation & Setup ✅ (COMPLETED)
- [x] Environment setup (Node.js, npm, Expo CLI)
- [x] Create Expo project with TypeScript
- [x] Install dependencies (Firebase, React Navigation)
- [x] Configure Hebrew RTL support
- [x] Set up project structure
- [x] Create navigation flows (Parent/Child)
- [x] Build Role Selection screen
- [x] Build Parent Home screen (mockup)
- [x] Build Child Home screen (mockup)
- [x] Firebase config placeholder
- [x] Test with Expo Go on iPhone

---

## 🔥 Phase 2: Firebase Integration & Authentication
**Estimated Time:** 1-2 days

### Backend Setup
- [ ] Create Firebase project
- [ ] Enable Firebase Authentication (Email/Password)
- [ ] Set up Firestore Database structure:
  ```
  users/
    {userId}/
      - role: 'parent' | 'child'
      - name: string
      - email: string
      - linkedUserId: string (for parent-child connection)

  punishments/
    {punishmentId}/
      - name: string
      - parentId: string
      - childId: string
      - status: 'active' | 'completed'
      - createdAt: timestamp
      - completedAt: timestamp
      - requiredTasksCount: number
      - tasks: array

  tasks/
    {taskId}/
      - punishmentId: string
      - title: string
      - description: string
      - type: 'custom' | 'clean-room' | 'homework' | 'quiz'
      - status: 'pending' | 'submitted' | 'approved' | 'rejected'
      - submittedAt: timestamp
      - approvedAt: timestamp
      - childNote: string
      - rejectedReason: string
  ```
- [ ] Configure Firestore security rules
- [ ] Set up Firebase Cloud Messaging for push notifications

### Frontend Implementation
- [ ] Create authentication context/hook
- [ ] Build Login screen (both roles)
- [ ] Build Sign Up screen
- [ ] Implement linking mechanism (Parent generates code → Child enters code)
- [ ] Add Firebase real-time listeners
- [ ] Create data management hooks (usePunishment, useTasks, etc.)

---

## 👨‍👩‍👧‍👦 Phase 3: Parent App Screens
**Estimated Time:** 2-3 days

### Onboarding/Setup Screen
- [ ] Create account form
- [ ] Add child name and age
- [ ] Generate linking code
- [ ] Display code for child to enter
- [ ] Confirmation screen when child links

### Home Screen (Enhanced)
- [x] Status display (mockup done)
- [ ] Connect to real Firebase data
- [ ] Real-time updates when child submits tasks
- [ ] Push notification badge
- [ ] Pull-to-refresh

### Set Punishment Screen
- [ ] Punishment name input
- [ ] Task preset library:
  - ניקיון חדר (Clean room)
  - שיעורי בית (Homework)
  - חידון (Quiz)
  - עזרה בבית (Help at home)
  - קריאת ספר (Read a book)
- [ ] Add custom task button
- [ ] Task list with drag-to-reorder
- [ ] Set required tasks count (or all)
- [ ] Confirmation dialog
- [ ] Send to Firestore → instant sync to child

### Task Approval Screen
- [ ] List of pending tasks
- [ ] Task detail view
- [ ] View child's note/photo (if any)
- [ ] Approve button → updates Firestore
- [ ] Reject button → add reason
- [ ] Real-time counter update

### Settings Screen
- [ ] Parent profile
- [ ] Manage child profiles
- [ ] Notification preferences
- [ ] App language (Hebrew/English)
- [ ] About & Help
- [ ] Logout

---

## 👶 Phase 4: Child App Screens
**Estimated Time:** 2-3 days

### Home/Lock Screen (Enhanced)
- [x] Punishment display (mockup done)
- [ ] Connect to real Firebase data
- [ ] Real-time progress updates
- [ ] Motivational messages
- [ ] Animated progress bar
- [ ] Pull-to-refresh

### Tasks Screen
- [ ] List all assigned tasks
- [ ] Filter by status (pending/submitted/approved/rejected)
- [ ] Task detail modal
- [ ] Mark task as complete
- [ ] Add note/comment
- [ ] Upload photo (optional)
- [ ] Submit button → Firestore + notify parent

### Quiz Screen
- [ ] Quiz categories (Math, Hebrew, Science, etc.)
- [ ] Question display with timer
- [ ] Multiple choice answers
- [ ] Score calculation
- [ ] Submit results to parent
- [ ] Results screen with score

### Waiting Screen
- [ ] "ממתין לאישור ההורה" message
- [ ] Animated hourglass/spinner
- [ ] Real-time listener for approval
- [ ] Notification when approved/rejected

### Freedom Screen
- [ ] Celebration animation (confetti/fireworks)
- [ ] "!יצאת מעונש 🎉" message
- [ ] Summary of completed tasks
- [ ] Notify parent automatically
- [ ] Return to home

---

## 🔔 Phase 5: Push Notifications
**Estimated Time:** 1-2 days

### Notification Types
- [ ] **Parent receives:**
  - Child submitted a task
  - Child completed all tasks
  - Child opened the app

- [ ] **Child receives:**
  - New punishment assigned
  - Task approved
  - Task rejected
  - Punishment lifted

### Implementation
- [ ] Install expo-notifications
- [ ] Request notification permissions
- [ ] Get device push token
- [ ] Store tokens in Firestore
- [ ] Cloud Functions for sending notifications
- [ ] Handle notification taps (deep linking)
- [ ] Notification badge management

---

## 🎨 Phase 6: UI/UX Polish
**Estimated Time:** 2-3 days

### Visual Enhancements
- [ ] Custom app icon
- [ ] Splash screen animation
- [ ] Loading states and skeletons
- [ ] Error states with friendly messages
- [ ] Empty states with illustrations
- [ ] Haptic feedback on actions
- [ ] Smooth transitions and animations

### Hebrew Localization
- [ ] Verify all text is in Hebrew
- [ ] Right-to-left layout verification
- [ ] Hebrew number formatting
- [ ] Date/time formatting (Hebrew locale)

### Accessibility
- [ ] Increase touch target sizes
- [ ] Color contrast compliance
- [ ] Screen reader support
- [ ] Font scaling support

---

## 🧪 Phase 7: Testing & Bug Fixes
**Estimated Time:** 1-2 days

- [ ] Parent flow end-to-end testing
- [ ] Child flow end-to-end testing
- [ ] Real-time sync testing (parent + child simultaneously)
- [ ] Offline behavior testing
- [ ] Push notification testing
- [ ] Edge cases:
  - No internet connection
  - App killed in background
  - Multiple children
  - Rapid task submissions
- [ ] Fix bugs and crashes
- [ ] Performance optimization

---

## 🚀 Phase 8: Advanced Features (Future)
**Estimated Time:** 1-2 weeks

### Task Categories & Templates
- [ ] Pre-built task templates by age group
- [ ] Task difficulty levels
- [ ] Time-based tasks (e.g., read for 30 minutes)
- [ ] Location-based tasks (with geofencing)

### Gamification
- [ ] Points system
- [ ] Achievements/badges
- [ ] Streak counters
- [ ] Leaderboard (if multiple children)

### Quiz Builder
- [ ] Parent can create custom quizzes
- [ ] Question bank by subject
- [ ] Difficulty adjustment
- [ ] Timed quizzes

### Analytics & Insights
- [ ] Parent dashboard with statistics
- [ ] Task completion rates
- [ ] Average time to complete punishment
- [ ] Child behavior trends

### Multi-Child Support
- [ ] Parent can manage multiple children
- [ ] Switch between child profiles
- [ ] Compare progress

### Premium Features
- [ ] Custom themes
- [ ] Advanced task types
- [ ] AI-suggested tasks
- [ ] Export reports

---

## 📦 Phase 9: Deployment & Launch
**Estimated Time:** 1 week

### App Store Preparation
- [ ] Create App Store account
- [ ] Prepare app screenshots (Hebrew)
- [ ] Write app description (Hebrew)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App Store Optimization (ASO)

### Build & Submit
- [ ] Build iOS app with EAS Build
- [ ] Build Android app with EAS Build
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Wait for review approval

### Marketing
- [ ] Create landing page
- [ ] Social media accounts
- [ ] Launch video (Hebrew)
- [ ] Press release
- [ ] Reach out to parenting blogs/influencers

---

## 🛠️ Technical Debt & Maintenance
**Ongoing**

- [ ] Set up error logging (Sentry)
- [ ] Set up analytics (Firebase Analytics)
- [ ] Monitor performance (Firebase Performance)
- [ ] Set up CI/CD pipeline
- [ ] Automated testing
- [ ] Code documentation
- [ ] Regular dependency updates
- [ ] Monitor user feedback
- [ ] A/B testing framework

---

## 📊 Success Metrics

### Phase 1-2 (MVP)
- [ ] App runs on both iOS and Android
- [ ] Parent can create punishment
- [ ] Child can see and complete tasks
- [ ] Real-time sync works
- [ ] Push notifications work

### Phase 3 (Beta)
- [ ] 50 beta testers
- [ ] < 5% crash rate
- [ ] Average session length > 3 minutes
- [ ] Task completion rate > 70%

### Phase 4 (Launch)
- [ ] 500 downloads in first month
- [ ] 4+ star rating
- [ ] < 2% crash rate
- [ ] 30-day retention > 40%

---

## 🎯 Current Status
**Phase 1: COMPLETED ✅**

**Next Up: Phase 2 - Firebase Integration**

You now have a working Expo app with:
- Role selection (Parent/Child)
- Parent Home screen with mockup data
- Child Home screen with mockup data
- Hebrew RTL support
- Basic navigation structure
- TypeScript types defined

**To continue, provide your Firebase credentials and we'll move to Phase 2!**
