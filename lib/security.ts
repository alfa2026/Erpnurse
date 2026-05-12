import { collection, addDoc, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

// Login attempt tracking for brute force protection
export interface LoginAttempt {
  id?: string
  email: string
  ipAddress: string
  success: boolean
  timestamp: Date
}

const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

// Record login attempt
export async function recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
  try {
    const attemptsRef = collection(db, 'login_attempts')
    await addDoc(attemptsRef, {
      email: email.toLowerCase(),
      ipAddress,
      success,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error recording login attempt:', error)
  }
}

// Check if account is locked due to too many failed attempts
export async function isAccountLocked(email: string): Promise<{ locked: boolean; remainingTime?: number }> {
  try {
    const attemptsRef = collection(db, 'login_attempts')
    const cutoffTime = new Date(Date.now() - ATTEMPT_WINDOW)

    const q = query(
      attemptsRef,
      where('email', '==', email.toLowerCase()),
      where('timestamp', '>=', cutoffTime),
      where('success', '==', false)
    )

    const snapshot = await getDocs(q)
    const failedAttempts = snapshot.size

    if (failedAttempts >= MAX_ATTEMPTS) {
      const oldestAttempt = snapshot.docs[0]?.data().timestamp
      const remainingTime = Math.ceil((oldestAttempt.toDate().getTime() + ATTEMPT_WINDOW - Date.now()) / 1000)
      return { locked: true, remainingTime: Math.max(0, remainingTime) }
    }

    return { locked: false }
  } catch (error) {
    console.error('Error checking account lock:', error)
    return { locked: false }
  }
}

// Clear old login attempts
export async function clearOldLoginAttempts(email: string) {
  try {
    const attemptsRef = collection(db, 'login_attempts')
    const cutoffTime = new Date(Date.now() - ATTEMPT_WINDOW * 2)

    const q = query(
      attemptsRef,
      where('email', '==', email.toLowerCase()),
      where('timestamp', '<', cutoffTime)
    )

    const snapshot = await getDocs(q)
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref)
    }
  } catch (error) {
    console.error('Error clearing old login attempts:', error)
  }
}

// Session management
export interface Session {
  userId: string
  email: string
  loginTime: Date
  lastActivity: Date
  ipAddress: string
  userAgent: string
  expiresAt: Date
}

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const SESSION_MAX_DURATION = 8 * 60 * 60 * 1000 // 8 hours

// Create session
export async function createSession(userId: string, email: string, ipAddress: string, userAgent: string): Promise<Session> {
  const now = new Date()
  return {
    userId,
    email,
    loginTime: now,
    lastActivity: now,
    ipAddress,
    userAgent,
    expiresAt: new Date(now.getTime() + SESSION_TIMEOUT),
  }
}

// Check if session is expired
export function isSessionExpired(session: Session): boolean {
  const now = new Date()
  
  // Check inactivity timeout
  if (now.getTime() - session.lastActivity.getTime() > SESSION_TIMEOUT) {
    return true
  }

  // Check max session duration
  if (now.getTime() - session.loginTime.getTime() > SESSION_MAX_DURATION) {
    return true
  }

  return false
}

// Update session activity
export function updateSessionActivity(session: Session): Session {
  return {
    ...session,
    lastActivity: new Date(),
    expiresAt: new Date(new Date().getTime() + SESSION_TIMEOUT),
  }
}

// Audit logging for security events
export interface AuditLog {
  id?: string
  userId: string
  action: string
  actionType: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'APPROVAL' | 'REJECTION' | 'USER_CREATION' | 'DATA_ACCESS'
  status: 'success' | 'failure'
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// Create audit log
export async function createAuditLog(data: Omit<AuditLog, 'id' | 'timestamp'>) {
  try {
    const auditRef = collection(db, 'audit_logs')
    await addDoc(auditRef, {
      ...data,
      timestamp: new Date(),
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error creating audit log:', error)
    return { success: false, error: error.message }
  }
}

// Get audit logs for user
export async function getUserAuditLogs(userId: string, limit = 50) {
  try {
    const auditRef = collection(db, 'audit_logs')
    const q = query(
      auditRef,
      where('userId', '==', userId)
    )

    const snapshot = await getDocs(q)
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as AuditLog[]

    // Sort by date (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return logs.slice(0, limit)
  } catch (error) {
    console.error('Error getting audit logs:', error)
    return []
  }
}

// Password reset token management
export interface PasswordResetToken {
  id?: string
  email: string
  token: string
  expiresAt: Date
  used: boolean
  createdAt: Date
}

// Generate password reset token
export function generateResetToken(): string {
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)
}

// Create password reset request
export async function createPasswordResetRequest(email: string) {
  try {
    const token = generateResetToken()
    const resetRef = collection(db, 'password_resets')
    
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Valid for 24 hours

    const docRef = await addDoc(resetRef, {
      email: email.toLowerCase(),
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    })

    return { success: true, token }
  } catch (error: any) {
    console.error('Error creating password reset request:', error)
    return { success: false, error: error.message }
  }
}

// Verify password reset token
export async function verifyPasswordResetToken(email: string, token: string): Promise<boolean> {
  try {
    const resetRef = collection(db, 'password_resets')
    const now = new Date()

    const q = query(
      resetRef,
      where('email', '==', email.toLowerCase()),
      where('token', '==', token),
      where('used', '==', false),
      where('expiresAt', '>=', now)
    )

    const snapshot = await getDocs(q)
    return snapshot.size > 0
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return false
  }
}

// Mark password reset token as used
export async function markPasswordResetAsUsed(email: string, token: string) {
  try {
    const resetRef = collection(db, 'password_resets')
    const q = query(
      resetRef,
      where('email', '==', email.toLowerCase()),
      where('token', '==', token)
    )

    const snapshot = await getDocs(q)
    for (const doc of snapshot.docs) {
      const docRef = doc.ref
      const updateData = { used: true }
      await fetch('/api/firestore/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: 'password_resets', docId: doc.id, data: updateData }),
      })
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error marking reset token as used:', error)
    return { success: false, error: error.message }
  }
}
