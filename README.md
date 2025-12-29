# Vimo Web App

A production-ready demo of a real-time communication app featuring Chat, Video/Audio calls, and Friend management.

## Features

- **Authentication:** Email/Password & Google Sign-In.
- **Chat:** Real-time messaging with Firebase Realtime Database.
- **Calls:** WebRTC 1-to-1 Video/Audio calls with Firebase Signaling.
- **Presence:** Online/Offline status indicators.
- **Admin Panel:** Delete messages and Ban users.
- **Responsive:** Mobile-first design using Tailwind CSS.

## Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project.
3. Enable **Authentication**:
   - Turn on Email/Password.
   - Turn on Google.
4. Enable **Firestore Database** (Start in Test Mode).
5. Enable **Realtime Database** (Start in Test Mode).
6. Copy config keys from Project Settings.

### 2. Configure Code
1. Open `services/firebase.ts`.
2. Replace the `firebaseConfig` object with your keys.
3. Add your UID to `ADMIN_UIDS` array for admin access.

### 3. Install & Run
```bash
npm install
npm start
```

### 4. Build for Production
```bash
npm run build
```

## Security Rules (Firebase)

**Realtime Database Rules:**
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "chats": {
      "$chatId": {
        // Only allow if user is part of the chat ID (uid1_uid2)
        ".read": "$chatId.contains(auth.uid)",
        ".write": "$chatId.contains(auth.uid)"
      }
    }
  }
}
```

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || request.auth.token.admin == true;
    }
  }
}
```

## Troubleshooting
* **Video Call Fails?** Ensure you are running on `localhost` or `https`. WebRTC does not work on `http` (except localhost).
* **Google Login Fails?** Add your domain to "Authorized Domains" in Firebase Auth settings.
