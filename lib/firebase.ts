'use client'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDn3xCSu5fh_hYcZNXSsYuG4mdHsfST7c4",
  authDomain: "pronurse1.firebaseapp.com",
  projectId: "pronurse1",
  storageBucket: "pronurse1.firebasestorage.app",
  messagingSenderId: "1014206351110",
  appId: "1:1014206351110:web:27c5949f8dc9a293ad4087",
}

// إنشاء التطبيق
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// تصدير الأدوات الأساسية
export const db = getFirestore(app)
export const auth = getAuth(app)
export { app }

// ─── الدوال اللي المشروع محتاجها ومسحها الـ AI ──────────
// دي الدوال اللي سببت الـ 14 خطأ لأنها كانت ناقصة
export function getFirestoreDb(): Firestore {
  return db
}

export function getFirebaseAuth(): Auth {
  return auth
}

export function isFirebaseConfigured(): boolean {
  return true
}
