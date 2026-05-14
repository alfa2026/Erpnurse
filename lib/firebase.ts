'use client'

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage' // أضفنا السحابة هنا

const firebaseConfig = {
  apiKey: "AIzaSyDn3xCSu5fh_hYcZNXSsYuG4mdHsfST7c4",
  authDomain: "pronurse1.firebaseapp.com",
  projectId: "pronurse1",
  storageBucket: "pronurse1.firebasestorage.app",
  messagingSenderId: "1014206351110",
  appId: "1:1014206351110:web:27c5949f8dc9a293ad4087",
}

// إنشاء التطبيق وتجنب التكرار
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// تصدير الأدوات الأساسية (الخدمات)
export const db = getFirestore(app)     // للبيانات (المخازن، الموظفين، إلخ)
export const auth = getAuth(app)         // لتسجيل الدخول
export const storage = getStorage(app)   // للسحابة (الصور والملفات)

export { app }

// ─── الدوال اللازمة لتوافق البرنامج ومنع الأخطاء ──────────

export function getFirestoreDb(): Firestore {
  return db
}

export function getFirebaseAuth(): Auth {
  return auth
}

export function getFirebaseStorage(): FirebaseStorage {
  return storage
}

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey
}
