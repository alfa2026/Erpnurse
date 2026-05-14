'use client'

import { useEffect, useState } from 'react'
import { db, storage } from '@/lib/firebase'
import { doc, onSnapshot, setDoc, collection, query, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export function useGlobalSync() {
  // دالة لحفظ أي بيانات لأي موديول (موظفين، مخازن، إلخ)
  const saveToCloud = async (collectionName: string, id: string, data: any) => {
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Error saving to cloud:", e);
    }
  };

  // دالة لرفع الملفات للسحابة (الصور، الـ PDF)
  const uploadFile = async (file: File, folder: string) => {
    const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // دالة لجلب البيانات حية (Live Stream)
  const subscribeToData = (collectionName: string, callback: Function) => {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  };

  return { saveToCloud, uploadFile, subscribeToData };
}
