'use client'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            "AIzaSyDn3xCSu5fh_hYcZNXSsYuG4mdHsfST7c4",
  authDomain:        "pronurse1.firebaseapp.com",
  projectId:         "pronurse1",
  storageBucket:     "pronurse1.firebasestorage.app",
  messagingSenderId: "1014206351110",
  appId:             "1:1014206351110:web:27c5949f8dc9a293ad4087",
}

let _app: any, _db: any, _auth: any, _storage: any

function getFirebaseApp() {
  if (!_app) _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return _app
}
export function getFirestoreDb() {
  if (!_db) {
    _db = getFirestore(getFirebaseApp())
    if (typeof window !== 'undefined') enableIndexedDbPersistence(_db).catch(()=>{})
  }
  return _db
}
export function getFirebaseAuth()   { if (!_auth)    _auth    = getAuth(getFirebaseApp());    return _auth }
export function getFirebaseStorage(){ if (!_storage) _storage = getStorage(getFirebaseApp()); return _storage }
export function isFirebaseConfigured() { return true }
export function getRealtimeDb() { return null as never }
export const app = _app, db = _db, auth = _auth, storage = _storage
