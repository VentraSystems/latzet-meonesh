# 🐛 Bugs Found & Testing Checklist

## 🔴 CRITICAL BUGS (Must Fix Before Launch)

### Bug #1: Alert.prompt() - Android Compatibility Issue ⚠️

**Severity:** CRITICAL
**Platform Affected:** Android
**File:** `src/screens/Parent/TaskApprovalScreen.tsx:87`

**Problem:**
The app uses `Alert.prompt()` which is **iOS-only**. On Android, this will either crash or not work at all.

**Location:**
```typescript
// Line 87 in TaskApprovalScreen.tsx
const handleReject = async (taskId: string) => {
  Alert.prompt(  // ❌ iOS-only!
    'דחיית משימה',
    'למה אתה דוחה את המשימה? (הילד יראה את ההודעה)',
    ...
  );
};
```

**Impact:**
- Parents on Android cannot reject tasks with a reason
- This breaks a core feature of the app
- Will cause confusion and bad user experience

**Solution:**
Create a custom modal component with TextInput that works on both platforms:

```typescript
// Create a new component: src/components/RejectTaskModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface RejectTaskModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}

export default function RejectTaskModal({ visible, onCancel, onSubmit }: RejectTaskModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason || 'המשימה לא בוצעה כראוי');
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>דחיית משימה</Text>
          <Text style={styles.description}>למה אתה דוחה את המשימה?</Text>

          <TextInput
            style={styles.input}
            placeholder="הילד יראה את ההודעה הזו"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleSubmit}>
              <Text style={styles.rejectButtonText}>דחה</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  rejectButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
```

Then update `TaskApprovalScreen.tsx`:
```typescript
// Replace handleReject function
const [showRejectModal, setShowRejectModal] = useState(false);
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

const handleReject = (taskId: string) => {
  setSelectedTaskId(taskId);
  setShowRejectModal(true);
};

const handleRejectSubmit = async (reason: string) => {
  if (!selectedTaskId) return;

  try {
    const task = punishment.tasks.find((t: any) => t.id === selectedTaskId);
    const updatedTasks = punishment.tasks.map((t: any) =>
      t.id === selectedTaskId
        ? { ...t, status: 'rejected', rejectedReason: reason }
        : t
    );

    await updateDoc(doc(db, 'punishments', punishmentId), {
      tasks: updatedTasks,
    });

    await notifyTaskRejected(
      punishment.childId,
      task.title,
      reason,
      punishmentId,
      selectedTaskId
    );

    await loadPunishment();
  } catch (error) {
    Alert.alert('שגיאה', 'לא הצלחנו לדחות את המשימה');
  } finally {
    setShowRejectModal(false);
    setSelectedTaskId(null);
  }
};

// Add to JSX before closing tag:
<RejectTaskModal
  visible={showRejectModal}
  onCancel={() => setShowRejectModal(false)}
  onSubmit={handleRejectSubmit}
/>
```

**Priority:** FIX IMMEDIATELY - This breaks Android functionality

---

### Bug #2: Firestore Rules Not Deployed 🔥

**Severity:** CRITICAL
**Status:** Rules file created but not deployed
**File:** `firestore.rules` (exists but not active)

**Problem:**
The Firestore security rules are written but not deployed to Firebase Console. Without these rules:
- Child linking will fail (permission denied)
- Punishment creation may fail
- Task submission/approval may fail
- All Firestore operations could be blocked

**Solution:**
See `DEPLOY-RULES-GUIDE.md` for step-by-step instructions.

**Priority:** DO THIS FIRST before any testing!

---

## 🟡 MEDIUM PRIORITY BUGS

### Bug #3: Deep Linking Not Implemented

**File:** `src/hooks/useNotifications.ts:141`
**Impact:** Tapping notifications doesn't navigate to relevant screens

**TODO Comment:**
```typescript
// TODO: Implement navigation based on notification type
// Examples:
// - taskSubmitted: navigate to TaskApprovalScreen
```

**Recommendation:**
Implement notification tap handling to navigate users to the right screen.

---

### Bug #4: Account Deletion Not Implemented

**File:** `src/screens/Parent/SettingsScreen.tsx:170`
**Impact:** "Delete Account" button doesn't actually delete the account

**TODO Comment:**
```typescript
// TODO: Implement account deletion
// This would require Cloud Functions to properly delete user data
```

**Recommendation:**
Either remove the "Delete Account" button or implement it with Firebase Cloud Functions to properly clean up user data.

---

### Bug #5: Google Sign-In Not Working

**File:** `src/contexts/AuthContext.tsx:102`
**Impact:** Google Sign-In button shows alert instead of signing in

**Current Code:**
```typescript
const signInWithGoogle = async () => {
  alert('Google Sign-In will be implemented in the next phase!');
};
```

**Recommendation:**
Either:
1. Remove Google Sign-In button from UI, OR
2. Implement it using `expo-auth-session` and Firebase Google Auth

---

## ✅ TESTING CHECKLIST

### Phase 1: Pre-Testing Setup

- [ ] Deploy Firestore rules to Firebase Console
- [ ] Fix Alert.prompt() bug for Android compatibility
- [ ] Verify Firebase credentials in `.env` file
- [ ] Install app on test device via Expo Go

---

### Phase 2: Authentication Testing

- [ ] **Sign Up - Parent**
  - [ ] Create parent account with email/password
  - [ ] Verify account created in Firebase Console
  - [ ] Check user document in Firestore

- [ ] **Sign Up - Child**
  - [ ] Create child account with simplified onboarding
  - [ ] Verify auto-login works
  - [ ] Check user document created

- [ ] **Login**
  - [ ] Parent can log in
  - [ ] Child can log in
  - [ ] Wrong password shows error
  - [ ] App remembers logged-in user

- [ ] **Logout**
  - [ ] Logout works
  - [ ] Returns to login screen
  - [ ] Can log back in

---

### Phase 3: Parent-Child Linking

- [ ] **Generate Code (Parent)**
  - [ ] Parent can generate 6-digit code
  - [ ] Code is displayed clearly
  - [ ] Code is stored in Firestore
  - [ ] Code expires after 10 minutes

- [ ] **Enter Code (Child)**
  - [ ] Child can enter 6-digit code
  - [ ] Invalid code shows error
  - [ ] Expired code shows error
  - [ ] Valid code links successfully
  - [ ] Success message appears

- [ ] **Linking Verification**
  - [ ] Parent sees child name on home screen
  - [ ] Child sees they are linked
  - [ ] Firestore shows bidirectional link
  - [ ] Linking code is deleted after use

---

### Phase 4: Punishment Creation (Parent)

- [ ] **Task Presets**
  - [ ] Can select from chore presets
  - [ ] Can select from homework presets
  - [ ] Can select from behavior presets
  - [ ] Can select multiple tasks

- [ ] **Quiz Presets**
  - [ ] Can add Math quiz
  - [ ] Can add Hebrew quiz
  - [ ] Can add Science quiz
  - [ ] Can add General Knowledge quiz

- [ ] **Custom Tasks**
  - [ ] Can add custom task
  - [ ] Custom task name accepts Hebrew text

- [ ] **Create Punishment**
  - [ ] Punishment name input works
  - [ ] At least one task required
  - [ ] Creates successfully
  - [ ] Stored in Firestore
  - [ ] Child sees it immediately (real-time)

---

### Phase 5: Child Task Completion

- [ ] **View Punishment**
  - [ ] Child sees active punishment
  - [ ] Punishment name displays correctly
  - [ ] Progress bar shows 0%
  - [ ] All tasks are listed

- [ ] **Regular Tasks**
  - [ ] Can open task detail
  - [ ] Can mark as complete
  - [ ] Can add note/comment
  - [ ] Submit button works
  - [ ] Task status changes to "submitted"
  - [ ] Parent receives push notification

- [ ] **Quiz Tasks**
  - [ ] Quiz opens correctly
  - [ ] Questions display properly
  - [ ] Can select answers
  - [ ] Timer works (if applicable)
  - [ ] Score calculated correctly
  - [ ] Pass threshold is 60%
  - [ ] Shows correct answers after completion
  - [ ] Submits to parent automatically

- [ ] **Real-Time Updates**
  - [ ] Parent sees submitted tasks immediately
  - [ ] Pending tasks counter updates
  - [ ] No need to refresh

---

### Phase 6: Parent Task Approval

- [ ] **View Submitted Tasks**
  - [ ] Pending tasks list shows correctly
  - [ ] Can see child's note
  - [ ] Task details display properly

- [ ] **Approve Task**
  - [ ] Approve button works
  - [ ] Confirmation dialog appears
  - [ ] Task status changes to "approved"
  - [ ] Child receives push notification
  - [ ] Progress bar updates immediately

- [ ] **Reject Task**
  - [ ] Reject button works
  - [ ] ⚠️ TEST ON BOTH iOS AND Android
  - [ ] Can enter rejection reason
  - [ ] Task status changes to "rejected"
  - [ ] Child receives notification with reason
  - [ ] Child can see rejection reason

- [ ] **Complete Punishment**
  - [ ] When all tasks approved, punishment auto-completes
  - [ ] Status changes to "completed"
  - [ ] Child sees Freedom screen
  - [ ] Parent receives completion notification

---

### Phase 7: Freedom/Celebration Screen

- [ ] **Automatic Trigger**
  - [ ] Appears when last task approved
  - [ ] 500ms delay for smooth transition

- [ ] **Animations**
  - [ ] Confetti animation plays
  - [ ] Bounce animation works
  - [ ] Fade animation works
  - [ ] Rotate animation works

- [ ] **Content**
  - [ ] "יצאת מעונש! 🎉" message displays
  - [ ] Task summary shows correctly
  - [ ] Statistics accurate
  - [ ] Motivational message appears

- [ ] **Notifications**
  - [ ] Parent notified automatically
  - [ ] Return to home button works

---

### Phase 8: Settings Screen

- [ ] **Profile Section**
  - [ ] Parent name displays
  - [ ] Avatar/emoji shows
  - [ ] Profile info correct

- [ ] **Child Management**
  - [ ] Shows linked child
  - [ ] Can view child info
  - [ ] Unlink option available (if applicable)

- [ ] **Notifications**
  - [ ] Toggle switch works
  - [ ] Preference saved
  - [ ] Actually enables/disables notifications

- [ ] **Dialogs**
  - [ ] Help dialog opens
  - [ ] About dialog opens (shows Ventra branding)
  - [ ] Privacy policy opens

- [ ] **Actions**
  - [ ] Rate Us opens app store (or shows message)
  - [ ] Logout works
  - [ ] Delete Account shows warning (not implemented yet)

---

### Phase 9: Push Notifications

- [ ] **Parent Receives:**
  - [ ] Child submitted a task
  - [ ] Child passed a quiz
  - [ ] Child completed all tasks

- [ ] **Child Receives:**
  - [ ] New punishment assigned
  - [ ] Task approved
  - [ ] Task rejected
  - [ ] Punishment lifted/completed

- [ ] **Notification Content**
  - [ ] Title correct
  - [ ] Message in Hebrew
  - [ ] Emoji included
  - [ ] Relevant information shown

- [ ] **Notification Behavior**
  - [ ] Appears on lock screen
  - [ ] Sound/vibration works
  - [ ] Badge count updates
  - [ ] ⚠️ Deep linking NOT implemented yet

---

### Phase 10: Edge Cases & Error Handling

- [ ] **No Internet**
  - [ ] App shows appropriate message
  - [ ] Doesn't crash
  - [ ] Syncs when reconnected

- [ ] **App Killed**
  - [ ] Authentication persists
  - [ ] Real-time listeners reconnect
  - [ ] Push token re-registers

- [ ] **Multiple Punishments**
  - [ ] Only shows active punishment
  - [ ] Can create multiple (sequentially)
  - [ ] History preserved

- [ ] **Rapid Actions**
  - [ ] Multiple quick task submissions handled
  - [ ] No duplicate approvals
  - [ ] No race conditions

- [ ] **Invalid Data**
  - [ ] Empty task name rejected
  - [ ] Empty punishment name rejected
  - [ ] Invalid code format rejected

- [ ] **Permissions**
  - [ ] Notification permission requested
  - [ ] Handles permission denial gracefully
  - [ ] Explains why permission needed

---

## 📊 Testing Progress

Track your testing progress here:

- [ ] Phase 1: Pre-Testing Setup
- [ ] Phase 2: Authentication (4 items)
- [ ] Phase 3: Linking (2 items)
- [ ] Phase 4: Punishment Creation (4 groups)
- [ ] Phase 5: Task Completion (3 groups)
- [ ] Phase 6: Task Approval (3 groups)
- [ ] Phase 7: Freedom Screen (4 groups)
- [ ] Phase 8: Settings (5 groups)
- [ ] Phase 9: Notifications (4 groups)
- [ ] Phase 10: Edge Cases (6 groups)

---

## 🚀 After All Testing:

1. Fix any bugs found
2. Test fixes
3. Build for TestFlight (iOS) or Internal Testing (Android)
4. Beta test with real users
5. Collect feedback
6. Final polish
7. Submit to App Store & Google Play!

---

**Last Updated:** February 15, 2026
**App Version:** 1.0.0 (Pre-Launch Testing)
**Status:** 99.8% Complete - Testing Phase 🧪
