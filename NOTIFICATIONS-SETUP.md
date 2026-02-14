# 🔔 Push Notifications Setup Guide

## What We've Implemented

Push notifications are now fully integrated into your app! Here's what happens:

### Parent Receives Notifications:
- ✅ **Task Submitted** - When child submits a task
- ✅ **Quiz Passed** - When child completes a quiz successfully
- 🔄 **Punishment Completed** - When all tasks are approved (coming soon)

### Child Receives Notifications:
- ✅ **New Punishment** - When parent creates a new punishment
- ✅ **Task Approved** - When parent approves a task
- ✅ **Task Rejected** - When parent rejects a task with reason

---

## Setup Steps

### 1. Create Expo Account & Project ID

**IMPORTANT:** You need an Expo account to use push notifications.

1. Go to https://expo.dev/
2. Sign up or log in
3. Click "Create Project"
4. Note down your **Project ID** (looks like: `abc123-def456-ghi789`)

### 2. Update Your .env File

Add this line to your `.env` file:

```bash
EXPO_PROJECT_ID=your_expo_project_id_here
```

**Example:**
```bash
# Your existing Firebase config...
FIREBASE_API_KEY=AIzaSyC...
FIREBASE_AUTH_DOMAIN=latzet-meonesh.firebaseapp.com
FIREBASE_PROJECT_ID=latzet-meonesh
# ... rest of Firebase config

# Add this new line:
EXPO_PROJECT_ID=abc123-def456-ghi789
```

### 3. Update app.json

Your `app.json` has been updated with notification configuration. Make sure the `extra.eas.projectId` matches your Expo project ID:

```json
"extra": {
  "eas": {
    "projectId": "your-expo-project-id"
  }
}
```

Replace `"your-project-id"` with your actual Expo project ID.

---

## Testing Push Notifications

### Testing on Expo Go (Development)

**IMPORTANT:** Push notifications work differently on Expo Go vs production builds!

1. **Expo Go Limitations:**
   - Notifications may not show while app is in foreground
   - Requires internet connection
   - Notification taps may not work properly

2. **How to Test:**
   ```bash
   cd get-out-of-punishment
   npx expo start
   ```
   - Open app on your iPhone
   - Log in as Parent and Child (two different devices recommended)
   - Create a punishment on Parent device
   - Check if Child device receives notification
   - Submit a task on Child device
   - Check if Parent device receives notification

### Testing on Production Build (TestFlight)

For **full notification experience**, you need to build with EAS:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile preview
```

Then upload to TestFlight for testing.

---

## How It Works

### 1. Permission Request

When a user logs in, the app automatically:
- Requests notification permissions
- Gets a unique push token
- Saves the token to Firestore (in `users/{userId}/pushToken`)

### 2. Sending Notifications

When events happen (task submitted, approved, etc.), the app:
- Gets the recipient's push token from Firestore
- Sends a notification via Expo Push API
- Notification appears on the device

### 3. Notification Taps

When user taps a notification:
- App opens to relevant screen
- Navigation handled automatically

---

## Firestore Updates

Your Firestore `users` collection now stores:
```javascript
{
  name: "...",
  email: "...",
  role: "parent" | "child",
  pushToken: "ExponentPushToken[...]", // NEW!
  lastTokenUpdate: timestamp            // NEW!
}
```

---

## Files Modified

### New Files:
- `src/hooks/useNotifications.ts` - Notification hook for permissions & tokens
- `src/utils/notifications.ts` - Helper functions for sending notifications
- `NOTIFICATIONS-SETUP.md` - This file!

### Updated Files:
- `src/contexts/AuthContext.tsx` - Initialize notifications on login
- `src/screens/Parent/SetPunishmentScreen.tsx` - Send notification on punishment creation
- `src/screens/Parent/TaskApprovalScreen.tsx` - Send notification on approve/reject
- `src/screens/Child/TasksListScreen.tsx` - Send notification on task submission
- `src/screens/Child/QuizScreen.tsx` - Send notification on quiz pass
- `app.json` - Added notification configuration
- `.env.example` - Added EXPO_PROJECT_ID
- `src/types/env.d.ts` - Added EXPO_PROJECT_ID type

---

## Troubleshooting

### "Failed to get push token"
- Make sure you added `EXPO_PROJECT_ID` to your `.env` file
- Make sure you're testing on a physical device (not simulator)
- Check that you granted notification permissions

### "Notification not received"
- Check that both users have push tokens saved in Firestore
- Check console logs for errors
- Make sure the recipient is logged in and has opened the app at least once
- In Expo Go, notifications may not show while app is in foreground

### "Error: ProjectId is required"
- You forgot to add `EXPO_PROJECT_ID` to your `.env` file
- Restart the Expo server after adding the env variable

### Testing Tips
- Use two physical devices (one parent, one child) for best testing
- Check Firestore console to verify push tokens are being saved
- Check Expo console for push notification delivery status

---

## Next Steps

1. ✅ Add `EXPO_PROJECT_ID` to your `.env` file
2. ✅ Restart Expo server
3. ✅ Test on physical devices
4. 🔄 Build with EAS for full notification experience
5. 🔄 Add notification badge counts (Phase 6)
6. 🔄 Add notification sound customization (Phase 6)

---

## Production Checklist

Before publishing to App Store:

- [ ] Create Expo account and project
- [ ] Add EXPO_PROJECT_ID to .env
- [ ] Test notifications on physical devices
- [ ] Build with EAS (not Expo Go)
- [ ] Test notification taps and navigation
- [ ] Verify all notification types work
- [ ] Add app icon for notifications
- [ ] Configure notification sounds

---

**Push notifications are now ready!** 🎉

Once you add your Expo Project ID and restart the server, notifications will work automatically.
