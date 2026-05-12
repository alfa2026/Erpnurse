# PRO Nurse ERP - Quick Start Guide

## Current Status
✅ **Build Successful** - No errors  
✅ **Authentication System** - Enhanced with registration and password change  
✅ **Firestore Integration** - Real-time updates configured  
✅ **Demo Mode** - Removed, using live database  

---

## Next: Create Admin Account

### Option 1: Via Firebase Console (Fastest)
1. Go to [Firebase Console](https://console.firebase.google.com) → pronurse1 project
2. Click **Authentication** → **Create User**
3. Email: `admin@pronurse.com`
4. Password: `Admin@1234`
5. Click **Create**
6. Go to **Firestore Database** → **Collections** → Click **+ Create Collection** or add to existing **users**
7. Create document with ID = the newly created user's UID from step 5
8. Add these fields:
   ```
   name: "Ahmed Admin"
   nameAr: "أحمد الأدمن"
   email: "admin@pronurse.com"
   employeeCode: "ADM001"
   role: "super_admin"
   roleId: "super_admin"
   department: "Administration"
   departmentId: "admin"
   status: "active"
   hireDate: (current date)
   phone: ""
   photoURL: ""
   mustChangePassword: false
   createdAt: (current timestamp)
   updatedAt: (current timestamp)
   ```

### Option 2: Via Setup API
```bash
curl -X POST https://erpnurse1.vercel.app/api/init/setup-admin \
  -H "Authorization: Bearer YOUR_SETUP_TOKEN" \
  -H "Content-Type: application/json"
```
(Set `SETUP_TOKEN` environment variable in Vercel first)

---

## Test Login Flow

### 1. Test Employee Code Login
- Go to: `https://erpnurse1.vercel.app/login`
- Click **Employee** tab
- Enter:
  - Employee Code: `ADM001`
  - Password: `Admin@1234`
- Should redirect to `/dashboard`

### 2. Test Email Login  
- Click **Admin** tab
- Enter:
  - Email: `admin@pronurse.com`
  - Password: `Admin@1234`
- Should redirect to `/dashboard`

### 3. Test Google Sign-In
- Click **Google** tab
- Select your Google account
- If first time: Will show pending approval page (create as pending_approval user)
- If user exists: Will go to dashboard

### 4. Test Registration
- Click **Create New Account** button
- Fill in:
  - Full Name: Test name
  - Email: test@example.com
  - Password: testpass123
- Should redirect to pending approval page
- As admin, go to Users → Pending tab and approve this new user

---

## Verify Real-Time Sync

1. **Open 2 browser windows** side-by-side:
   - Window 1: Logged in as admin
   - Window 2: Also logged in as admin

2. In Window 1:
   - Go to Users page
   - Click "Add User"
   - Create a new user

3. In Window 2:
   - Watch the users list update automatically without manual refresh
   - New user appears in real-time

---

## Check Build Quality

```bash
cd /vercel/share/v0-project

# Run build
npm run build

# Should complete successfully with no errors
```

---

## Environment Variables Needed

**Already Set in Vercel**:
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`

**Optional to Add**:
- `SETUP_TOKEN` - Enable admin setup API

---

## Key Files for Understanding the System

```
app/
├── login/page.tsx              # Login with 3 methods
├── pending-approval/           # Approval workflow
├── (dashboard)/
│   ├── admin/users/page.tsx   # User management (Firestore-backed)
│   └── layout.tsx             # Main dashboard layout

contexts/
├── auth-context.tsx           # Auth logic (register, login, changePassword)
└── lang-context.tsx           # Language toggle (AR/EN)

hooks/
└── use-firestore.ts           # Real-time subscription hook

lib/
├── firebase.ts                # Firebase setup
└── firebase-services.ts       # CRUD operations

api/
└── init/
    └── setup-admin/route.ts   # Admin creation API
```

---

## Firestore Collections to Know

### users
- Stores user profiles
- Fields: name, nameAr, email, role, department, status, etc.
- Real-time updates via useFirestoreCollection

### pending-users  
- Stores registration requests awaiting approval
- Admin dashboard shows these for approval

### roles
- Permission definitions
- (Needs seed data)

### departments
- Hospital departments
- (Needs seed data)

### audit-logs
- Activity tracking
- Auto-populated on login/logout/user changes

---

## Common Issues & Solutions

### Issue: "Firebase not configured"
**Solution**: Check environment variables in Vercel Settings → Environment Variables. All FIREBASE_ vars must be set.

### Issue: Registration works but user can't login
**Solution**: Check Firestore users collection. User document should have same UID as Firebase Auth user.

### Issue: Real-time updates not working
**Solution**: Check browser console for errors. Verify Firestore rules allow read/write to users collection.

### Issue: Arabic text shows as unicode
**Solution**: Add Arabic font to `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
```

---

## Next Features to Build

After confirming admin account and login flow:

1. **Dashboard Statistics**
   - Total users count
   - Active/inactive breakdown
   - Department occupancy
   - Recent activity feed

2. **Department Management**
   - Create departments
   - Assign head nurses
   - Set bed counts
   - Configure staffing rules

3. **Scheduling System**
   - Create shifts
   - Assign staff
   - Manage shift templates
   - Swap/overtime tracking

4. **Attendance Tracking**
   - Check-in/check-out
   - Late tracking
   - Overtime calculation
   - Reports

5. **Leave Management**
   - Request leave
   - Approve/reject
   - Balance tracking
   - Calendar view

6. **Patient Management** (if required)
   - Admit/discharge patients
   - Track vital signs
   - SBAR handovers
   - Medical records

---

## Deployment to Production

```bash
# All changes should be committed to GitHub
git add .
git commit -m "Phase 1 complete: Auth system, Firestore integration, demo removal"
git push origin pro-nurse-erp-rebuild

# Create Pull Request to master
# After approval, Vercel will auto-deploy

# Verify at: https://erpnurse1.vercel.app
```

---

## Support Resources

- 📚 [Firebase Docs](https://firebase.google.com/docs)
- 📚 [Next.js Docs](https://nextjs.org/docs)
- 📚 [React Docs](https://react.dev)
- 🗂️ Project: pronurse1 (Firebase)
- 🌐 Live: erpnurse1.vercel.app
- 💾 Repo: alfa2026/Erpnurse

---

## What's Been Accomplished

✅ Fixed all TypeScript build errors  
✅ Removed hardcoded demo data  
✅ Enhanced authentication (register, change password, Google)  
✅ Set up real-time Firestore integration  
✅ Configured Firestore collections  
✅ Implemented user approval workflow  
✅ Added audit logging  
✅ Full Arabic/English support  

## What Needs Testing

⏳ Admin account creation  
⏳ Complete login flow with new admin  
⏳ User registration → approval → login  
⏳ Real-time data sync across windows  
⏳ Arabic font rendering  
⏳ Mobile responsiveness  
⏳ Error handling  

---

**Ready to launch!** 🚀 Create the admin account and test the login flow.
