// Admin Setup Script
// Run this script to create the admin user in Firebase

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    // Create the admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'obe.highereducation2025@gmail.com', 
      'admin@nsr2025'
    );
    
    const user = userCredential.user;
    console.log('Admin user created successfully:', user.uid);
    
    // Set admin role in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      role: 'admin',
      name: 'Admin User',
      email: 'obe.highereducation2025@gmail.com',
      department: 'Administration',
      createdAt: new Date().toISOString(),
    });
    
    console.log('Admin role set in Firestore');
    console.log('Admin login is now ready!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Updating role...');
      
      // If user exists, just update the role
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          name: 'Admin User',
          email: 'obe.highereducation2025@gmail.com',
          department: 'Administration',
          createdAt: new Date().toISOString(),
        }, { merge: true });
        console.log('Admin role updated in Firestore');
      }
    } else {
      console.error('Error creating admin user:', error);
    }
  }
}

createAdminUser();




