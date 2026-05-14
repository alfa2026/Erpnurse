'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const DataContext = createContext<any>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [appData, setAppData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  // 1. سحب داتا البرنامج كله من السحاب أول ما يفتح
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const unsub = onSnapshot(doc(db, "hospital_records", user.uid), (doc) => {
        if (doc.exists()) {
          setAppData(doc.data())
        }
        setLoading(false)
      })
      return () => unsub()
    }
  }, [isAuthenticated, user?.uid])

  // 2. تحديث أي جزء في الـ 40 صفحة أوتوماتيكياً
  const updateData = async (key: string, newData: any) => {
    const updated = { ...appData, [key]: newData }
    setAppData(updated) // تحديث فوري على الشاشة
    
    if (user?.uid) {
      await setDoc(doc(db, "hospital_records", user.uid), updated, { merge: true })
    }
  }

  return (
    <DataContext.Provider value={{ appData, updateData, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useAppData = () => useContext(DataContext)
