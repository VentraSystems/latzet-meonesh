# 🔒 Security Guide

This document explains how your app credentials are protected.

## ✅ What's Protected

### 1. Firebase Credentials
Your Firebase API keys and configuration are stored in `.env` file, which is:
- ❌ **NOT committed to Git** (blocked by .gitignore)
- ❌ **NOT shared publicly**
- ✅ **Only on your computer**

### 2. Environment Variables
The app uses `react-native-dotenv` to load credentials from `.env` file:

```typescript
// src/config/firebase.ts
import { FIREBASE_API_KEY } from '@env';  // Loaded from .env
```

## 📂 Important Files

### `.env` - Your Secret Credentials
**NEVER commit this file to Git!**
```bash
FIREBASE_API_KEY=AIzaSy...  # Your real API key
FIREBASE_PROJECT_ID=latzet-meonesh
# ... other credentials
```

### `.env.example` - Template (Safe to Commit)
This file shows the format but **doesn't contain real credentials**:
```bash
FIREBASE_API_KEY=your_api_key_here  # Placeholder, not real
```

### `.gitignore` - Protection Guard
This file ensures `.env` is never committed:
```bash
.env          # Blocks your real credentials
.env*.local   # Blocks all local env files
```

## 🚨 If You Accidentally Commit Credentials

If you ever accidentally commit your `.env` file or credentials to Git:

1. **Immediately rotate your Firebase API keys** at https://console.firebase.google.com/
2. **Remove the commit from Git history**:
   ```bash
   git rm --cached .env
   git commit --amend -m "Remove credentials"
   ```
3. **Force push** (only if you haven't shared the repo):
   ```bash
   git push --force
   ```

## ✅ Security Checklist

- [x] `.env` file created with real credentials
- [x] `.env` added to `.gitignore`
- [x] `.env.example` created as template
- [x] `firebase.ts` uses environment variables
- [x] Credentials removed from source code
- [ ] GitHub repository is **PRIVATE** (when you create it)
- [ ] Never share `.env` file with anyone
- [ ] Never commit `.env` to Git

## 🎯 Best Practices

### DO ✅
- Keep GitHub repository **PRIVATE**
- Use `.env` for all sensitive data
- Share `.env.example` as template
- Rotate keys if exposed

### DON'T ❌
- Never hardcode credentials in source code
- Never commit `.env` file
- Never make repository public (if it has credentials)
- Never share `.env` in messages/screenshots

## 📱 For App Store/Google Play Submission

When building for production with Expo EAS:
1. EAS Build uses environment variables securely
2. Credentials are injected during build time
3. Not stored in the final app bundle visibly

## ℹ️ More Info

- Firebase Security Rules: https://firebase.google.com/docs/rules
- Expo Environment Variables: https://docs.expo.dev/guides/environment-variables/
- React Native Dotenv: https://github.com/goatandsheep/react-native-dotenv

---

**Bottom line:** Your Firebase credentials are now protected and will NOT be committed to Git! 🎉
