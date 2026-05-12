'use server'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, subject, subject_ar, template, variables } = await request.json()

    if (!email || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Email templates
    const templates = {
      welcome: (vars: any) => `
        <h2>Welcome to PRO Nurse!</h2>
        <p>Hello ${vars.name},</p>
        <p>Your account has been created successfully. Please wait for admin approval.</p>
      `,
      welcome_ar: (vars: any) => `
        <h2>مرحباً بك في PRO Nurse!</h2>
        <p>السلام عليكم ورحمة الله ${vars.name},</p>
        <p>تم إنشاء حسابك بنجاح. يرجى انتظار موافقة المسؤول.</p>
      `,
      approval: (vars: any) => `
        <h2>Account Approved</h2>
        <p>Hello ${vars.name},</p>
        <p>Your account has been approved! You can now login to PRO Nurse.</p>
        <p>Date: ${vars.date}</p>
      `,
      approval_ar: (vars: any) => `
        <h2>تمت الموافقة على حسابك</h2>
        <p>السلام عليكم ورحمة الله ${vars.name},</p>
        <p>تمت الموافقة على حسابك! يمكنك الآن تسجيل الدخول.</p>
        <p>التاريخ: ${vars.date}</p>
      `,
      rejection: (vars: any) => `
        <h2>Application Status</h2>
        <p>Hello ${vars.name},</p>
        <p>Unfortunately, your application was rejected.</p>
        <p>Reason: ${vars.reason}</p>
        <p>Please contact admin for more information.</p>
      `,
      rejection_ar: (vars: any) => `
        <h2>حالة الطلب</h2>
        <p>السلام عليكم ورحمة الله ${vars.name},</p>
        <p>للأسف، تم رفض طلبك.</p>
        <p>السبب: ${vars.reason}</p>
        <p>يرجى التواصل مع الإدارة للمزيد من المعلومات.</p>
      `,
      password_reset: (vars: any) => `
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${vars.resetLink}">Click here to reset your password</a></p>
        <p>This link expires in ${vars.expiryTime}.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      password_reset_ar: (vars: any) => `
        <h2>طلب إعادة تعيين كلمة المرور</h2>
        <p>تلقينا طلب لإعادة تعيين كلمة المرور.</p>
        <p><a href="${vars.resetLink}">اضغط هنا لإعادة تعيين كلمة المرور</a></p>
        <p>ينتهي صلاحية هذا الرابط في ${vars.expiryTime}.</p>
        <p>إذا لم تطلب هذا، يرجى تجاهل هذا البريد.</p>
      `,
    }

    // Get template
    const templateKey = template as keyof typeof templates
    const isAr = subject === subject_ar ? false : true
    const templateFunction = templates[isAr ? `${templateKey}_ar` : templateKey]

    if (!templateFunction) {
      return NextResponse.json({ error: 'Template not found' }, { status: 400 })
    }

    const htmlContent = templateFunction(variables || {})

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, just log the email
    console.log('[Email Service]')
    console.log('To:', email)
    console.log('Subject:', subject)
    console.log('HTML:', htmlContent)

    // In production, send actual email
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@pronurse.com',
    //   subject,
    //   html: htmlContent,
    // })

    return NextResponse.json({
      success: true,
      message: 'Email would be sent (email service not configured)',
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
