'use client'

import { db, storage } from '@/lib/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export function useGlobalSync() {
  // دالة الحفظ الأوتوماتيك (بتستخدمها في أي مكان)
  const autoSave = async (collectionName: string, id: string, data: any) => {
    if (!id) return;
    try {
      await setDoc(doc(db, collectionName, id), {
        ...data,
        lastSync: new Date().toISOString()
      }, { merge: true });
      console.log("تم التزامن بنجاح");
    } catch (e) { console.error("Sync Error:", e); }
  };

  // دالة الرفع (للسحابة)
  const uploadFile = async (file: File) => {
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  return { autoSave, uploadFile };
}
