import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy } from 'firebase/firestore'
import { getFirestoreDb, isFirebaseConfigured } from './firebase'

export type PendingStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'admin' | 'head_nurse' | 'supervisor' | 'staff'

export interface PendingUser {
  id: string; name: string; email: string; photoURL?: string
  requestedAt: string; status: PendingStatus; role?: UserRole
  department?: string; reviewedAt?: string; reviewedBy?: string
}

const COLLECTION = 'pending_users'

/** Now ASYNC — replaces localStorage. Update callers with await. */
export async function getPendingUsers(): Promise<PendingUser[]> {
  if (!isFirebaseConfigured()) return []
  try {
    const snap = await getDocs(query(collection(getFirestoreDb(), COLLECTION), orderBy('requestedAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingUser))
  } catch { return [] }
}

export async function getPendingUserById(id: string): Promise<PendingUser | undefined> {
  if (!isFirebaseConfigured()) return undefined
  try {
    const snap = await getDoc(doc(getFirestoreDb(), COLLECTION, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } as PendingUser : undefined
  } catch { return undefined }
}

export async function savePendingUsers(_list: PendingUser[]): Promise<void> {
  // No-op in cloud mode — each item is saved individually via upsertPendingUser
}

export async function upsertPendingUser(
  user: Omit<PendingUser, 'status' | 'requestedAt'> & { requestedAt?: string }
): Promise<PendingUser> {
  const entry: PendingUser = {
    ...user,
    requestedAt: user.requestedAt ?? new Date().toISOString(),
    status: 'pending',
  }
  if (!isFirebaseConfigured()) return entry
  try {
    const ref = doc(getFirestoreDb(), COLLECTION, entry.id)
    const existing = await getDoc(ref)
    if (existing.exists()) return { id: existing.id, ...existing.data() } as PendingUser
    await setDoc(ref, entry)
  } catch (err) { console.error('[PendingUsers]', err) }
  return entry
}

export async function updatePendingUser(
  id: string, updates: Partial<PendingUser>
): Promise<PendingUser | undefined> {
  if (!isFirebaseConfigured()) return undefined
  try {
    await updateDoc(doc(getFirestoreDb(), COLLECTION, id), { ...updates })
    const snap = await getDoc(doc(getFirestoreDb(), COLLECTION, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } as PendingUser : undefined
  } catch { return undefined }
}

export async function approvePendingUser(
  id: string, reviewedBy: string, role: UserRole, department: string
): Promise<void> {
  await updatePendingUser(id, { status: 'approved', role, department, reviewedBy, reviewedAt: new Date().toISOString() })
}

export async function rejectPendingUser(id: string, reviewedBy: string): Promise<void> {
  await updatePendingUser(id, { status: 'rejected', reviewedBy, reviewedAt: new Date().toISOString() })
}
