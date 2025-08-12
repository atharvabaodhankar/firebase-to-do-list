# Firebase Setup Guide

## 1. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `to-do-list-f6681`
3. Go to **Authentication** → **Sign-in method**
4. Enable the following authentication methods:
   - **Email/Password** (for user accounts)
   - **Google** (for Google Sign-In)
   - **Anonymous** (for guest users)
5. For Google Sign-In:
   - Click on Google provider
   - Enable it
   - Add your project support email
   - Click **Save**
6. Click **Save** for each method

## 2. Set up Firestore Database

1. Go to **Firestore Database**
2. If not created, click **Create database**
3. Choose **Start in test mode** (for now)
4. Select a location (choose closest to your users)

## 3. Update Firestore Security Rules

Go to **Firestore Database** → **Rules** and replace with the rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users (including anonymous) to read/write their own todos
    match /todos/{document} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         request.auth.uid == request.resource.data.userId);
    }
  }
}
```

## 4. Features Available

### Authentication Options:

- **Email/Password**: Create account and sign in with email
- **Google Sign-In**: Sign in with your Google account (one-click)
- **Anonymous/Guest**: Use the app without creating an account
- **Sign Out**: Switch between accounts

### Data Security:

- Each user only sees their own todos
- Anonymous users get temporary data (may be lost)
- Email users get persistent data tied to their account

## 5. Test the Setup

After enabling all authentication methods:

1. Refresh your app
2. Try creating an account with email/password
3. Try signing in with Google
4. Try signing in as a guest
5. Add todos and verify they're saved
6. Sign out and sign back in to verify data persistence

## Troubleshooting

- **auth/configuration-not-found**: Email/Password, Google, or Anonymous auth not enabled
- **auth/popup-closed-by-user**: Google sign-in popup was closed
- **auth/popup-blocked**: Google sign-in popup was blocked by browser
- **permission-denied**: Firestore rules are too restrictive
- **auth/weak-password**: Password must be at least 6 characters
- **auth/email-already-in-use**: Account with this email already exists
- **index required error**: If you see "The query requires an index", the app now handles sorting on the client side to avoid this issue

## Optional: Create Firestore Index (Advanced)

If you want server-side sorting for better performance with large datasets, you can create the composite index:

1. If you see an index error, Firebase will provide a direct link to create it
2. Or manually go to Firestore → Indexes → Create Index
3. Collection: `todos`
4. Fields: `userId` (Ascending), `createdAt` (Descending)

The current app works without this index by sorting on the client side.
