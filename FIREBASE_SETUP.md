# Firebase Setup Guide

## Task Completed ✅

The faculty data is now properly connected to Firebase Firestore instead of local storage. Here's what has been implemented:

### 1. Firebase Security Rules Updated ✅

The `firebase.rules` file has been updated to include proper rules for the `faculty` collection:

```javascript
match /faculty/{id} {
  // Admin can read/write all faculty records
  allow read, write, delete: if isAdmin();
  // Faculty can read their own record
  allow read: if isSignedIn() && isCurrentFaculty(resource.data.email);
  // Faculty can read all faculty records for filtering purposes
  allow read: if isFaculty();
}
```

### 2. Faculty Service Already Connected ✅

The `facultyService.ts` is already using Firestore (not local storage) with these methods:
- `getFaculty()` - Get all faculty
- `getFacultyByEmail()` - Get faculty by email for login verification
- `addFaculty()` - Add new faculty
- `updateFaculty()` - Update faculty
- `deleteFaculty()` - Delete faculty

### 3. App Integration Working ✅

The App component properly loads faculty data from Firestore and filters students based on faculty assignments.

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication and Firestore Database

### Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web
4. Copy the Firebase configuration object

### Step 3: Create Environment File

Create a `.env` file in your project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### Step 4: Deploy Firebase Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore`
4. Deploy rules: `firebase deploy --only firestore:rules`

### Step 5: Create Admin User

#### Option A: Firebase Console (Recommended)
1. Go to Authentication > Users
2. Click "Add user"
3. Email: `obe.highereducation2025@gmail.com`
4. Password: `admin@nsr2025`
5. Create user

#### Option B: Setup Script
1. Update Firebase config in `setup-admin.js`
2. Run: `node setup-admin.js`

### Step 6: Create Admin User Document

In Firestore, create a document in the `users` collection with the admin's UID:

```json
{
  "role": "admin",
  "name": "Admin User",
  "email": "obe.highereducation2025@gmail.com",
  "department": "Administration",
  "createdAt": "2025-01-27T00:00:00.000Z"
}
```

## How It Works Now

### Admin Flow:
1. Admin logs in with `obe.highereducation2025@gmail.com`
2. Admin can access Faculty Management
3. Admin creates faculty with email, school, department, batches, sections, subjects
4. Faculty data is stored in Firestore `faculty` collection

### Faculty Flow:
1. Faculty logs in with their email (e.g., `sunil.patak@amity.edu`)
2. System checks if email exists in `faculty` collection
3. If found, faculty can see students assigned to their batches/sections
4. Student filtering is based on faculty's assigned batches and sections

### Data Flow:
- **Admin creates faculty** → Stored in Firestore `faculty` collection
- **Faculty logs in** → System reads from `faculty` collection to get assignments
- **Student filtering** → Based on faculty's batches and sections from Firestore
- **No more local storage** → All data is now in Firestore

## Testing the Complete Flow

1. **Start the app**: `npm run dev`
2. **Login as admin**: Use `obe.highereducation2025@gmail.com`
3. **Create faculty**: Go to Faculty Management, add faculty with email like `sunil.patak@amity.edu`
4. **Logout from admin**
5. **Login as faculty**: Use the faculty email you just created
6. **Verify students show**: Faculty should see students assigned to their batches/sections

## Troubleshooting

If faculty can't see students:
1. Check Firebase rules are deployed
2. Verify faculty email exists in `faculty` collection
3. Check browser console for errors
4. Ensure student data has matching batches/sections

## Security Notes

- Faculty can only read their own data and all faculty records (for filtering)
- Admin has full access to all faculty records
- Students are filtered based on faculty assignments
- All data is now stored in Firestore, not local storage

