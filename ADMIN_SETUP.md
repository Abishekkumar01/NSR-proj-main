# Admin Login Setup Guide

## Issues Identified and Solutions

### 1. Missing Environment Variables
Your Firebase configuration is trying to read from environment variables, but there's no `.env` file.

**Solution:**
1. Create a `.env` file in your project root with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

### 2. Admin User Not Created
The admin user `obe.highereducation2025@gmail.com` doesn't exist in Firebase Authentication.

**Solution:**
You have two options:

#### Option A: Use Firebase Console (Recommended)
1. Go to your Firebase Console
2. Navigate to Authentication > Users
3. Click "Add user"
4. Enter email: `obe.highereducation2025@gmail.com`
5. Enter password: `admin@nsr2025`
6. Create the user
7. Go to Firestore Database
8. Create a document in the `users` collection with the user's UID
9. Set the document data:
```json
{
  "role": "admin",
  "name": "Admin User",
  "email": "obe.highereducation2025@gmail.com",
  "department": "Administration",
  "createdAt": "2025-01-27T00:00:00.000Z"
}
```

#### Option B: Use the Setup Script
1. Update the Firebase config in `setup-admin.js` with your actual credentials
2. Run: `node setup-admin.js`

### 3. Firebase Rules
Your Firebase rules are correct and don't need changes.

## Steps to Fix Admin Login

1. **Set up environment variables:**
   - Create `.env` file with your Firebase credentials
   - Restart your development server

2. **Create admin user:**
   - Use Firebase Console (Option A) or setup script (Option B)

3. **Test login:**
   - Go to your app
   - Select "Admin Login"
   - Use email: `obe.highereducation2025@gmail.com`
   - Use password: `admin@nsr2025`

## Verification

After setup, you should be able to:
- Login as admin
- See admin-only features (Course Management, Assessment Management)
- Access all sections of the application

## Troubleshooting

If you still can't login:
1. Check browser console for errors
2. Verify Firebase credentials are correct
3. Ensure the user exists in Firebase Authentication
4. Check that the user document exists in Firestore with `role: 'admin'`
5. Verify Firebase rules are deployed

## Security Note

The admin credentials are hardcoded for development. In production, consider:
- Using environment variables for admin credentials
- Implementing proper admin invitation system
- Adding additional security measures
