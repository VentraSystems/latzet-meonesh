# 🚀 Getting Started with לצאת מעונש

## ✅ What's Been Completed

Your app is ready to run! Here's what we've built:

### Project Structure
```
get-out-of-punishment/
├── App.tsx                 # Main app entry point
├── src/
│   ├── config/
│   │   └── firebase.ts    # Firebase configuration (needs your credentials)
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Main navigation
│   │   ├── ParentNavigator.tsx   # Parent flow
│   │   └── ChildNavigator.tsx    # Child flow
│   ├── screens/
│   │   ├── RoleSelection.tsx     # Choose Parent or Child
│   │   ├── parent/
│   │   │   └── ParentHomeScreen.tsx  # Parent home with mock data
│   │   └── child/
│   │       └── ChildHomeScreen.tsx   # Child home with mock data
│   └── types/
│       └── index.ts       # TypeScript definitions
├── ROADMAP.md             # Full project roadmap
├── SETUP.md               # Setup instructions
└── start-app.bat          # Windows batch file to start the app
```

### Features Implemented
- ✅ Expo project with TypeScript
- ✅ Hebrew RTL support configured
- ✅ Firebase structure ready (awaiting your credentials)
- ✅ Navigation with Parent/Child flows
- ✅ Role selection screen
- ✅ Parent Home screen with:
  - Child status display (In Punishment / Free)
  - Progress tracking
  - Task counter
  - Recent activity feed
  - Action buttons
- ✅ Child Home screen with:
  - Punishment status
  - Progress bar
  - Task list with status indicators
  - Motivational messages
  - Freedom celebration screen

---

## 📱 How to Run the App

### Option 1: Using the Batch File (Easiest)
1. Double-click `start-app.bat` in the project folder
2. Wait for the QR code to appear in the terminal
3. Open **Expo Go** app on your iPhone
4. Scan the QR code
5. The app will load on your phone!

### Option 2: Using Command Line
1. Open **PowerShell** or **Command Prompt**
2. Navigate to the project:
   ```bash
   cd "C:\Users\LENOVO J\get-out-of-punishment"
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Wait for the QR code to appear
5. Scan it with **Expo Go** on your iPhone

### Option 3: Using VS Code (Recommended for Development)
1. Open the project folder in VS Code
2. Open the integrated terminal (Ctrl + `)
3. Run:
   ```bash
   npm start
   ```
4. The QR code will appear in the terminal
5. Scan with Expo Go

---

## 🔥 Next Steps: Firebase Setup

To enable real-time sync, follow these steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "latzet-meonesh"
3. Add a **Web app** to your project
4. Copy the configuration object
5. Open `src/config/firebase.ts`
6. Replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // Replace this
  authDomain: "YOUR_AUTH_DOMAIN",   // Replace this
  projectId: "YOUR_PROJECT_ID",     // Replace this
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace this
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace this
  appId: "YOUR_APP_ID"              // Replace this
};
```

7. In Firebase Console, enable these services:
   - **Authentication** > Sign-in method > Email/Password
   - **Firestore Database** > Create database (start in production mode)
   - **Cloud Messaging** (for push notifications)

---

## 🎯 Testing the App

### What You'll See:

1. **Role Selection Screen** - Choose "הורה" (Parent) or "ילד" (Child)

2. **Parent View:**
   - Header showing child name (יוסי)
   - Status card showing "בעונש" (In Punishment)
   - Progress: 2 out of 4 tasks completed
   - Progress bar (50%)
   - Pending task notification
   - Action buttons for:
     - Set new punishment
     - Approve tasks
     - Settings
   - Recent activity feed

3. **Child View:**
   - "אתה בעונש" header with sad emoji
   - Motivational message
   - Progress card with percentage
   - Task list showing:
     - ניקיון חדר (✅ Approved)
     - שיעורי בית (⏳ Pending approval)
     - סידור ארונות (✅ Approved)
     - חידון מתמטיקה (📝 Pending submission)
   - Encouragement message

### Current Limitations:
- All data is **mock data** (hardcoded)
- Buttons are **not functional** yet
- **No real-time sync** until Firebase is configured
- **No authentication** yet

---

## 🗺️ Full Roadmap

Check `ROADMAP.md` for the complete development plan including:
- Phase 2: Firebase Integration & Authentication
- Phase 3: Parent App Screens (Onboarding, Set Punishment, Task Approval, Settings)
- Phase 4: Child App Screens (Tasks, Quiz, Waiting, Freedom)
- Phase 5: Push Notifications
- Phase 6: UI/UX Polish
- Phase 7: Testing
- Phase 8: Advanced Features
- Phase 9: Deployment

---

## 🐛 Troubleshooting

### Port already in use
If you see "Port 8081 is being used":
```bash
# Stop all node processes and try again
npm start -- --port 8082
```

### QR code not appearing
- Make sure you're in the project directory
- Try clearing the cache: `npm start -- --clear`
- Check that no firewall is blocking Metro bundler

### Can't scan QR code on iPhone
- Make sure both devices are on the same WiFi network
- Try using tunnel mode: `npm start -- --tunnel` (slower but works across networks)

### RTL not working
- The app should display Hebrew right-to-left automatically
- If not, try reloading the app (shake iPhone > "Reload")

---

## 📞 Need Help?

- Check the console output for error messages
- Look at `ROADMAP.md` for the full project plan
- Review `SETUP.md` for Firebase setup details

---

**Current Status:** Phase 1 COMPLETE ✅

**Ready to move to Phase 2:** Firebase Integration!

Provide your Firebase credentials and we'll enable:
- Real-time data sync between Parent and Child apps
- User authentication
- Push notifications
- Data persistence

---

🎉 **Enjoy building לצאת מעונש!**
