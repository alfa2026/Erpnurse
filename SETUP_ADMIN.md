# إنشاء حساب Admin - خطوات يدوية

إذا لم تنجح صفحة `/admin-setup`، اتبع هذه الخطوات اليدوية:

## الطريقة 1: استخدام صفحة Setup (الأسهل)

```
1. افتح: https://erpnurse1.vercel.app/admin-setup
2. اضغط "Create Admin Account"
3. انتظر النجاح
4. اذهب إلى /login وجرب
```

## الطريقة 2: Firebase Console (يدوي)

### الخطوة 1: إنشاء مستخدم Firebase Auth
```
1. اذهب إلى https://console.firebase.google.com/project/pronurse1
2. اختر "Authentication" من الجانب الأيسر
3. اضغط على tab "Users"
4. اضغط "Create user"
5. أدخل:
   - Email: admin@pronurse.com
   - Password: Admin@1234
6. اضغط "Create"
7. Copy UID (مثال: abc123xyz...)
```

### الخطوة 2: إنشاء وثيقة في Firestore
```
1. اذهب إلى "Firestore Database"
2. اضغط على collection "users"
3. اضغط "Add document"
4. في Document ID: ضع UID من الأعلى
5. أضف الحقول التالية:

name: Ahmed Admin
nameAr: أحمد الإداري
email: admin@pronurse.com
employeeCode: ADM001
role: super_admin
roleId: super_admin
status: active
department: الإدارة
departmentId: admin
phone: +966501234567
hireDate: 2024-01-01T00:00:00Z
mustChangePassword: false
createdAt: [اضغط على الساعة واختر "Server timestamp"]
updatedAt: [اضغط على الساعة واختر "Server timestamp"]
```

### الخطوة 3: تسجيل الدخول
```
1. افتح https://erpnurse1.vercel.app/login
2. اختر tab "Email"
3. أدخل:
   Email: admin@pronurse.com
   Password: Admin@1234
4. اضغط "Login"
```

## الطريقة 3: استخدام Firestore Data برمجياً

إذا أردت استخدام Firebase CLI:

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# إنشاء المستخدم
firebase auth:import users.json --project=pronurse1

# حيث users.json يحتوي على:
{
  "users": [
    {
      "email": "admin@pronurse.com",
      "password": "Admin@1234",
      "displayName": "Ahmed Admin"
    }
  ]
}
```

## اختبار تسجيل الدخول

بعد إنشاء الحساب:

```
1. اذهب إلى: https://erpnurse1.vercel.app/login
2. اختر أي من الـ 3 طرق (كود الموظف / البريد الإلكتروني / Google)
3. جرب البيانات

البيانات:
- Email: admin@pronurse.com
- Password: Admin@1234
- Employee Code: ADM001
```

## استكشاف الأخطاء

### خطأ: "Account not found"
- تأكد من إنشاء مستخدم Firestore بنفس UID

### خطأ: "Invalid credentials"
- تأكد من كتابة البيانات بشكل صحيح
- تحقق من caps lock

### خطأ: "Permission denied"
- تأكد من Firestore rules (يجب أن تسمح للمستخدمين المصرح لهم بالدخول)

## التالي

بعد إنشاء Admin، يمكنك:
1. تسجيل مستخدمين جدد من صفحة Login
2. الموافقة عليهم من لوحة التحكم
3. تعيين أدوار وأقسام لهم
