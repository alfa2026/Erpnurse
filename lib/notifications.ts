import { collection, addDoc, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

export interface Notification {
  id?: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  titleAr: string
  message: string
  messageAr: string
  read: boolean
  createdAt: Date
  readAt?: Date
  actionUrl?: string
}

// Create notification
export async function createNotification(data: Omit<Notification, 'id' | 'createdAt'>) {
  try {
    const notificationsRef = collection(db, 'notifications')
    const docRef = await addDoc(notificationsRef, {
      ...data,
      createdAt: new Date(),
    })
    return { success: true, id: docRef.id }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { success: false, error: error.message }
  }
}

// Get user notifications
export function subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        readAt: doc.data().readAt?.toDate(),
      })) as Notification[]

      // Sort by date (newest first)
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      callback(notifications)
    })

    return unsubscribe
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return () => {}
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const notifRef = doc(db, 'notifications', notificationId)
    await updateDoc(notifRef, {
      read: true,
      readAt: new Date(),
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }
}

// Send email notification
export async function sendEmailNotification(data: {
  email: string
  subject: string
  subject_ar: string
  template: 'welcome' | 'approval' | 'rejection' | 'password_reset'
  variables?: Record<string, string>
}) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) throw new Error('Failed to send email')
    return { success: true }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

// Send approval notification
export async function sendApprovalNotification(userId: string, userName: string, userEmail: string, isAr: boolean) {
  // In-app notification
  await createNotification({
    userId,
    type: 'success',
    title: 'Account Approved',
    titleAr: 'تمت الموافقة على حسابك',
    message: 'Your account has been approved by an administrator',
    messageAr: 'تمت الموافقة على حسابك من قبل المسؤول',
    read: false,
    actionUrl: '/dashboard',
  })

  // Email notification
  await sendEmailNotification({
    email: userEmail,
    subject: 'Account Approved - PRO Nurse',
    subject_ar: 'تمت الموافقة على حسابك - PRO Nurse',
    template: 'approval',
    variables: {
      name: userName,
      date: new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
  })
}

// Send rejection notification
export async function sendRejectionNotification(userId: string, userName: string, userEmail: string, reason: string, isAr: boolean) {
  // In-app notification
  await createNotification({
    userId,
    type: 'error',
    title: 'Application Rejected',
    titleAr: 'تم رفض الطلب',
    message: `Your application was rejected. Reason: ${reason}`,
    messageAr: `تم رفض طلبك. السبب: ${reason}`,
    read: false,
  })

  // Email notification
  await sendEmailNotification({
    email: userEmail,
    subject: 'Application Status - PRO Nurse',
    subject_ar: 'حالة الطلب - PRO Nurse',
    template: 'rejection',
    variables: {
      name: userName,
      reason,
      date: new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
  })
}

// Send password reset notification
export async function sendPasswordResetNotification(email: string, resetLink: string, isAr: boolean) {
  await sendEmailNotification({
    email,
    subject: 'Password Reset - PRO Nurse',
    subject_ar: 'إعادة تعيين كلمة المرور - PRO Nurse',
    template: 'password_reset',
    variables: {
      resetLink,
      expiryTime: '24 hours',
    },
  })
}
