import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, User } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { facultyService } from '../lib/facultyService'

interface AuthUser extends User {
  role?: 'admin' | 'faculty'
  name?: string
  department?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string, expectedRole?: 'admin' | 'faculty') => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, department: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await fetchUserProfile(fbUser)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchUserProfile = async (authUser: User) => {
    try {
      const ref = doc(db, 'users', authUser.uid)
      const snap = await getDoc(ref)
      const data = snap.exists() ? snap.data() as { role?: 'admin'|'faculty'; name?: string; department?: string } : {}

      setUser({ ...authUser, role: data.role, name: data.name, department: data.department })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(authUser as AuthUser)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string, expectedRole?: 'admin' | 'faculty') => {
    try {
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }
      
      let userCredential: any
      let user: any

      try {
        // Try to sign in with existing Firebase Auth user
        userCredential = await signInWithEmailAndPassword(auth, email, password)
        user = userCredential.user
      } catch (authError: any) {
        console.log('Auth error:', authError.code, authError.message)
        // If user doesn't exist in Firebase Auth, check if they're in faculty collection
        if ((authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') && expectedRole === 'faculty') {
          console.log('User not found, checking faculty collection for:', email)
          // Check if faculty exists in our database
          const facultyData = await facultyService.getFacultyByEmail(email)
          console.log('Faculty data found:', facultyData)
          
          if (!facultyData) {
            throw new Error('Faculty account not found. Please contact your administrator.')
          }

          // Verify the password matches the initial password set by admin
          if (facultyData.initialPassword !== password) {
            throw new Error('Invalid password. Please use the password provided by your administrator.')
          }

          console.log('Creating Firebase Auth user for faculty:', email)
          // Create Firebase Auth user
          userCredential = await createUserWithEmailAndPassword(auth, email, password)
          user = userCredential.user

          console.log('Creating user document in Firestore')
          // Create user document in Firestore
          await setDoc(doc(db, 'users', user.uid), {
            role: 'faculty',
            name: facultyData.name,
            email: facultyData.email,
            department: facultyData.department,
            createdAt: new Date().toISOString(),
          })

          console.log('Marking faculty as activated')
          // Mark faculty as activated
          await facultyService.updateFaculty(facultyData.id, { isActivated: true })
        } else {
          throw authError
        }
      }
      
      // Check if this is the admin user and ensure they have admin role
      if (email === 'obe.highereducation2025@gmail.com') {
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)
        
        if (!userSnap.exists() || userSnap.data()?.role !== 'admin') {
          // Create or update admin role
          await setDoc(userRef, {
            role: 'admin',
            name: 'Admin User',
            email: email,
            department: 'Administration',
            createdAt: new Date().toISOString(),
          }, { merge: true })
        }
      }

      // Enforce selected toggle role
      if (expectedRole) {
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        let actualRole: 'admin' | 'faculty' | undefined = snap.exists() ? (snap.data()?.role as any) : undefined

        // If no role set in DB, check if it's admin email or faculty in faculty collection
        if (!actualRole) {
          if (email === 'obe.highereducation2025@gmail.com') {
            actualRole = 'admin'
          } else {
            // Check if email exists in faculty collection
            const facultyData = await facultyService.getFacultyByEmail(email)
            actualRole = facultyData ? 'faculty' : 'faculty' // Default to faculty if not found
          }
        }

        if (actualRole !== expectedRole) {
          await fbSignOut(auth)
          throw new Error(`Please switch to ${actualRole === 'admin' ? 'Admin' : 'Faculty'} Login to continue`)
        }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string, department: string) => {
    try {
      // Enforce admin-set initial password for faculty (non-admin) accounts
      const isAdminEmail = email === 'obe.highereducation2025@gmail.com'
      if (!isAdminEmail) {
        // Lookup faculty record by email
        const facRef = collection(db, 'faculty')
        const q = query(facRef, where('email', '==', email))
        const snap = await getDocs(q)
        if (snap.empty) {
          throw new Error('Your email is not pre-registered by admin. Please contact admin.')
        }
        const facDoc = snap.docs[0]
        const facData = facDoc.data() as any
        const expected = facData.initialPassword || ''
        const activated = !!facData.isActivated
        if (activated) {
          throw new Error('Account already activated. Please sign in instead.')
        }
        if (!expected) {
          throw new Error('Primary password not set by admin. Please contact admin.')
        }
        if (expected !== password) {
          throw new Error('Invalid primary password. Use the password set by admin to register.')
        }
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = cred.user.uid
      await setDoc(doc(db, 'users', uid), {
        // Auto-set admin for your fixed admin email
        role: isAdminEmail ? 'admin' : 'faculty',
        name,
        department,
        email,
        createdAt: new Date().toISOString(),
      })
      // Mark faculty as activated in faculty collection (and optionally clear initialPassword)
      if (!isAdminEmail) {
        const facRef = collection(db, 'faculty')
        const q = query(facRef, where('email', '==', email))
        const snap = await getDocs(q)
        if (!snap.empty) {
          await updateDoc(doc(db, 'faculty', snap.docs[0].id), {
            isActivated: true
          })
        }
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await fbSignOut(auth)
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}