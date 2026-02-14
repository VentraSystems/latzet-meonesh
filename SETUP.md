# לצאת מעונש - Setup Instructions

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Add a web app to your project
4. Copy the Firebase configuration
5. Replace the configuration in `src/config/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

6. In Firebase Console, enable:
   - **Authentication** > Email/Password
   - **Firestore Database** > Create database in production mode
   - **Cloud Messaging** > For push notifications

## Running the App

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with Expo Go app on your iPhone

## Project Structure

```
src/
├── config/          # Firebase configuration
├── navigation/      # Navigation setup (Parent/Child flows)
├── screens/         # All app screens
│   ├── parent/     # Parent app screens
│   └── child/      # Child app screens
├── components/      # Reusable components
└── types/          # TypeScript type definitions
```

## Next Steps

- [ ] Add Firebase credentials
- [ ] Implement authentication
- [ ] Set up Firestore data structure
- [ ] Add push notifications
- [ ] Build remaining screens
- [ ] Implement real-time sync
