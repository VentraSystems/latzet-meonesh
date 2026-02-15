# 📱 After Build Complete Guide

## 🎯 What to Do When Builds Finish

---

## 🤖 AFTER ANDROID BUILD COMPLETES

### Step 1: Download the .aab File

When you see: **"Build complete!"**

1. **Click the download link** in the terminal output, OR
2. **Go to:** https://expo.dev/accounts/combined/projects/get-out-of-punishment/builds
3. **Find the latest Android build**
4. **Click "Download"**
5. **Save the .aab file** (e.g., `get-out-of-punishment-1.0.0.aab`)

---

### Step 2: Upload to Google Play Console

1. **Go to:** https://play.google.com/console/
2. **Click "Create app"** (if first time)
   - App name: **לצאת מעונש**
   - Default language: **Hebrew**
   - App or game: **App**
   - Free or paid: **Free**
3. **Go to "Internal testing"** (left sidebar)
4. **Click "Create new release"**
5. **Upload the .aab file**
6. **Add release notes** (in Hebrew):
   ```
   גרסה ראשונה - בדיקה פנימית
   תכונות:
   - חיבור בין הורה לילד
   - יצירת עונשים ומשימות
   - מערכת חידונים חינוכיים
   - סנכרון בזמן אמת
   - התראות פוש
   ```
7. **Click "Review release"**
8. **Click "Start rollout to Internal testing"**

---

### Step 3: Add Testers (Optional)

1. **Go to "Internal testing" → "Testers"**
2. **Create a testers list**
3. **Add email addresses** of people to test
4. **They'll receive an invite link**

---

## 🍎 AFTER iOS BUILD COMPLETES

### Step 1: Download the .ipa File

When you see: **"Build complete!"**

1. **Click the download link**, OR
2. **Go to:** https://expo.dev/accounts/combined/projects/get-out-of-punishment/builds
3. **Find the latest iOS build**
4. **Click "Download"**
5. **Save the .ipa file**

---

### Step 2: Upload to App Store Connect

#### Option A: Using EAS Submit (Easiest!)

```bash
eas submit --platform ios
```

EAS will:
- Upload your .ipa automatically
- Configure TestFlight
- Handle everything for you!

#### Option B: Manual Upload

1. **Go to:** https://appstoreconnect.apple.com/
2. **Click "My Apps"**
3. **Click "+ " to create new app** (if first time)
   - Name: **לצאת מעונש**
   - Primary Language: **Hebrew**
   - Bundle ID: **com.latzet.meonesh**
   - SKU: **com-latzet-meonesh**
4. **Go to "TestFlight" tab**
5. **Click "+" under "iOS"**
6. **Use Xcode or Transporter app to upload .ipa**

---

### Step 3: Configure TestFlight

1. **Go to TestFlight tab**
2. **Select your build**
3. **Add "What to Test" notes:**
   ```
   First beta version for testing
   Features to test:
   - Parent-child linking
   - Punishment creation
   - Task submission and approval
   - Educational quizzes
   - Real-time sync
   - Push notifications
   ```
4. **Add internal testers** (up to 100 for free!)
   - Add by email
   - They get TestFlight invite
5. **Click "Start Testing"**

---

## 🧪 TESTING PHASE

### Internal Testing (1-3 days)

**Test with friends/family:**
- [ ] Parent signup & login
- [ ] Child signup & login
- [ ] Parent-child linking
- [ ] Create punishment
- [ ] Submit tasks
- [ ] Approve/reject tasks
- [ ] Complete quiz
- [ ] Real-time sync
- [ ] Push notifications
- [ ] Freedom screen

**Gather feedback:**
- Any bugs?
- Any confusing UI?
- Any missing features?
- Performance issues?

---

## 🚀 PRODUCTION DEPLOYMENT

### When Testing is Complete (No Critical Bugs)

### Android - Google Play:

1. **Go to Google Play Console**
2. **Go to "Production" track**
3. **Click "Create new release"**
4. **Select the tested .aab file** (or upload same one)
5. **Add release notes** (in Hebrew)
6. **Review and rollout**
7. **Submit for review**
8. **Wait 1-3 days for approval**
9. **App goes live!** 🎉

### iOS - App Store:

1. **Go to App Store Connect**
2. **Select your app**
3. **Click "+ Version" under "iOS App"**
4. **Fill in ALL required info:**
   - App name
   - Subtitle
   - Description (in Hebrew)
   - Keywords
   - Screenshots (all sizes)
   - Support URL
   - Privacy policy URL
   - Age rating
   - Price (Free)
   - Availability (Israel)
5. **Select the TestFlight build**
6. **Submit for review**
7. **Wait 1-3 days for approval**
8. **App goes live!** 🎉

---

## 📸 STORE ASSETS NEEDED

### Screenshots Required:

**iOS (all sizes needed):**
- 6.7" (iPhone 14 Pro Max, 15 Pro Max)
- 6.5" (iPhone 11 Pro Max, XS Max)
- 5.5" (iPhone 8 Plus, 7 Plus)

**Android (recommended):**
- Phone (1080 x 1920)
- 7-inch tablet (1200 x 1920)
- 10-inch tablet (1600 x 2560)

### How to Create Screenshots:

1. **Run app in iOS Simulator / Android Emulator**
2. **Navigate to key screens:**
   - Role selection
   - Parent home with active punishment
   - Task approval screen
   - Child home with punishment
   - Tasks list
   - Quiz screen
   - Freedom/celebration screen
3. **Take screenshots** (Cmd+S on iOS Simulator, button on Android)
4. **Upload to stores**

---

## 📝 STORE LISTING CONTENT

### App Name:
```
לצאת מעונש
```

### Subtitle (iOS, 30 chars):
```
אפליקציה למשפחה
```

### Short Description (Android, 80 chars):
```
אפליקציה לניהול עונשים בין הורים לילדים עם משימות וחידונים חינוכיים
```

### Full Description (Both, Hebrew):
```
לצאת מעונש - אפליקציה חדשנית למשפחות ישראליות

האפליקציה מחברת בין הורים לילדים ומאפשרת ניהול עונשים בצורה בונה וחינוכית.

תכונות עיקריות:

👨‍👩‍👧‍👦 חיבור בין הורה לילד
צרו חיבור מאובטח בין המכשירים באמצעות קוד בן 6 ספרות

🎯 יצירת עונשים ומשימות
הורים יכולים ליצור עונשים עם משימות מותאמות אישית או מתוך רשימת משימות מוכנות

📚 חידונים חינוכיים
הילדים יכולים להשתחרר מהעונש על ידי ביצוע משימות או מעבר חידונים במתמטיקה, עברית, מדעים וידע כללי

⚡ סנכרון בזמן אמת
כל השינויים מסתנכרנים מיידית בין מכשיר ההורה למכשיר הילד

🔔 התראות פוש
קבלו עדכונים כאשר משימות הוגשו או אושרו

🎉 חגיגת חופש
כאשר כל המשימות מאושרות, הילד מקבל מסך חגיגה מיוחד עם קונפטי!

🔒 מאובטח ופרטי
כל המידע מאובטח ומוגן על ידי Firebase Authentication ו-Firestore

תמיכה בעברית RTL
ממשק משתמש מלא בעברית עם תמיכה מלאה בכיוון כתיבה מימין לשמאל

מתאים למשפחות עם ילדים בגילאי 6-16

נבנה על ידי Ventra Software Systems LTD
```

### Keywords (iOS, comma-separated):
```
הורים, ילדים, עונש, משימות, חינוך, משפחה, חידון, למידה
```

### Category:
- iOS: **Lifestyle** or **Education**
- Android: **Parenting** or **Education**

---

## ⚙️ APP SETTINGS

### Privacy Policy:
**You MUST have a privacy policy URL!**

Create a simple page explaining:
- What data you collect (email, names, task data)
- How you use it (app functionality only)
- How it's stored (Firebase, secure)
- User rights (can delete data)

Host on:
- GitHub Pages (free)
- Google Sites (free)
- Your own website

### Support Email:
Provide an email for user support (required by both stores)

### Age Rating:
- Content: **4+ / Everyone** (no mature content)
- Parental controls: No

---

## 📊 AFTER LAUNCH

### Monitor:
- Download numbers
- User reviews
- Crash reports
- User feedback

### Respond to:
- User reviews (especially negative ones)
- Bug reports
- Feature requests

### Update regularly:
- Fix bugs
- Add features
- Improve performance
- Keep users engaged

---

## 🎉 CONGRATULATIONS!

You're ready to launch your app to the world!

**Next steps:**
1. Wait for builds to complete
2. Upload to TestFlight & Play Console
3. Test thoroughly
4. Fix any issues
5. Submit to stores
6. Wait for approval
7. **LAUNCH!** 🚀

---

**Questions? Issues?**
Check the other documentation files:
- SESSION-SUMMARY-FEB15-2026.md
- PRE-LAUNCH-CHECKLIST.md
- TESTING-GUIDE.md
- ROADMAP-UPDATED.md
