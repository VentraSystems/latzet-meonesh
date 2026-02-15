# 🔥 Deploy Firestore Rules - Quick Guide

## ⚠️ IMPORTANT: This MUST be done before testing the app!

Your Firestore security rules are created but not yet deployed. Without proper rules, the app won't work correctly.

## 📝 How to Deploy:

### Option 1: Firebase Console (Easiest - 2 minutes)

1. **Open Firebase Console**: https://console.firebase.google.com/

2. **Select Your Project**: Click on "latzet-meonesh"

3. **Navigate to Firestore Database**:
   - Click "Firestore Database" in the left sidebar
   - Click the "Rules" tab at the top

4. **Copy the Rules**:
   - Open the file `firestore.rules` in your project
   - Copy ALL the content (lines 1-50)

5. **Paste and Publish**:
   - Paste the rules into the Firebase Console editor
   - Click the blue "Publish" button
   - Wait for confirmation message

6. **Done!** ✅ Your rules are now active!

---

### Option 2: Firebase CLI (Better for future)

```bash
# Install Firebase CLI (one time only)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore in your project
cd get-out-of-punishment
firebase init firestore
# Select your project: latzet-meonesh
# Use default file names (press Enter)

# Deploy the rules
firebase deploy --only firestore:rules
```

---

## ✅ Verify Deployment:

After deploying, you should see a success message in Firebase Console. The rules will be active immediately.

---

## 🧪 Test After Deployment:

1. Try linking a child to parent (6-digit code)
2. Create a punishment
3. Submit a task from child device
4. Approve a task from parent device

If any of these fail, check the Firestore Rules tab for error messages.
