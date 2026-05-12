# خطوات البدء السريعة - PRO Nurse ERP

## الخطوة 1: إنشاء حساب Admin (اختر طريقة واحدة)

### ✅ الطريقة الأولى (الأسهل) - عبر الواجهة
```
1. انتقل إلى: https://erpnurse1.vercel.app/admin-setup
2. ملأ النموذج بالبيانات التالية:
   ├─ الاسم بالعربية: أحمد الإداري
   ├─ الاسم بالإنجليزية: Ahmed Admin
   ├─ البريد الإلكتروني: admin@pronurse.com
   ├─ كلمة المرور: Admin@1234
   ├─ رمز الموظف: ADM001
   ├─ الدور: super_admin
   └─ الحالة: active
3. انقر "إنشاء حساب Admin"
4. انتظر الرسالة: "تم إنشاء الحساب بنجاح"
```

### 📝 الطريقة الثانية - يدويًا عبر Firebase Console

**1. إنشاء مستخدم في Authentication:**
```
اذهب إلى: https://console.firebase.google.com/project/pronurse1/authentication/users
└─ Click "Create user"
   ├─ Email: admin@pronurse.com
   ├─ Password: Admin@1234
   └─ Click "Create"
└─ انسخ UID الذي ظهر (مثلاً: abc123xyz)
```

**2. إنشاء بيانات في Firestore:**
```
اذهب إلى: https://console.firebase.google.com/project/pronurse1/firestore/data/users
└─ Click "Add document"
   ├─ Document ID: [الـ UID الذي نسخته]
   ├─ ثم اضغط "Auto ID" بعدها
   └─ أضف الحقول التالية:
```

**الحقول المطلوبة:**
```
name: "Ahmed Admin"
nameAr: "أحمد الإداري"
email: "admin@pronurse.com"
employeeCode: "ADM001"
role: "super_admin"
status: "active"
department: "الإدارة"
departmentId: "admin"
phone: "+966XXXXXXXXX"
hireDate: "2024-01-01"
createdAt: [اضغط Firestore timestamp]
updatedAt: [اضغط Firestore timestamp]
mustChangePassword: false
```

---

## الخطوة 2: اختبر تسجيل الدخول

**اذهب إلى:** https://erpnurse1.vercel.app

**ثلاث طرق للدخول:**

### 1️⃣ عبر البريد الإلكتروني
```
├─ اضغط Tab: "Email"
├─ البريد: admin@pronurse.com
├─ كلمة المرور: Admin@1234
└─ اضغط "Login"
→ يجب أن تصل إلى Dashboard
```

### 2️⃣ عبر رمز الموظف
```
├─ اضغط Tab: "Employee Code"
├─ رمز الموظف: ADM001
├─ كلمة المرور: Admin@1234
└─ اضغط "Login"
→ يجب أن تصل إلى Dashboard
```

### 3️⃣ عبر Google
```
├─ اضغط Tab: "Google"
├─ اختر حسابك على Google
└─ يجب أن تصل إلى صفحة "Pending Approval"
→ كـ Admin، وافق على الطلب
→ سيصل البريد الجديد إلى Dashboard
```

---

## الخطوة 3: اختبر التسجيل الجديد

**اضغط "Create New Account":**
```
├─ الاسم بالعربية: أحمد محمد
├─ الاسم بالإنجليزية: Ahmed Mohammed
├─ البريد: newuser@example.com
├─ القسم: العناية المركزة
├─ كلمة المرور: Test@1234
├─ تأكيد كلمة المرور: Test@1234
└─ اضغط "Register"
→ سيظهر: "تم إرسال طلبك للموافقة"
```

**ثم كـ Admin:**
```
├─ انتقل إلى: Admin Panel → Users → Pending Approvals
├─ اختر المستخدم الجديد
├─ اختر الدور والقسم
└─ اضغط "Approve"
→ المستخدم الجديد يمكنه الآن تسجيل الدخول
```

---

## الخطوة 4: اختبر نسيت كلمة المرور

**على صفحة البداية:**
```
├─ اضغط Tab: "Email"
├─ اضغط "Forgot password?"
├─ أدخل البريد الإلكتروني: admin@pronurse.com
├─ اضغط "Send"
└─ انتظر الرسالة على البريد الإلكتروني
→ اتبع الرابط لإعادة تعيين كلمة المرور
```

---

## الخطوة 5: لغة التطبيق

### تغيير إلى الإنجليزية:
```
اضغط الزر في الزاوية العلوية اليسرى: "EN" → الواجهة تنقلب LTR
```

### العودة إلى العربية:
```
اضغط الزر: "العربية" → الواجهة تصبح RTL
```

---

## نصائح مهمة

✅ **استخدم هذا البريد الاختباري:**
- Email: admin@pronurse.com
- Password: Admin@1234
- Employee Code: ADM001

✅ **كل عمليات تسجيل الدخول مأمونة:**
- Firebase Auth يقوم بتشفير كلمات المرور
- لا يتم حفظ كلمات المرور بشكل نصي

✅ **البيانات تُحفظ بشكل دائم:**
- كل إجراء يُخزن في Firestore
- عند التحديث، جميع الأجهزة ترى التغييرات فوراً

❌ **لا تنسى:**
- بعد الانتهاء من الاختبار، غيّر كلمة مرور Admin الحقيقية
- أضف مستخدمي الإنتاج الفعليين من قائمة الموارد البشرية
- قم بعمل نسخة احتياطية من البيانات بانتظام

---

## استكشاف الأخطاء

### المشكلة: "خطأ في بيانات المستخدم"
**الحل:** تأكد من:
- البريد الإلكتروني صحيح (admin@pronurse.com)
- كلمة المرور كاملة (Admin@1234)
- Firebase موصول (تحقق من Console)

### المشكلة: "لا يمكن قراءة البيانات"
**الحل:**
- افحص اتصال الإنترنت
- امسح cache المتصفح
- جرّب متصفح مختلف

### المشكلة: "الدعم الفني"
**التواصل:**
- البريد: support@pronurse.com
- الهاتف: +966-XXX-XXX-XXXX

---

**تم! النظام جاهز للاستخدام. ابدأ باختبار الآن! 🚀**
