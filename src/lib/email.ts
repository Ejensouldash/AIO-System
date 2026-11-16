import { prisma } from "@/lib/prisma"

type EmailPayload = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function getSMTPConfig() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ["SMTP_EMAIL", "SMTP_PASSWORD", "RESEND_API_KEY", "RESEND_FROM_EMAIL"],
        },
      },
    })

    const configMap: Record<string, string> = {}
    settings.forEach((s) => {
      configMap[s.key] = s.value
    })

    const resendApiKey = configMap["RESEND_API_KEY"]?.trim() || process.env.RESEND_API_KEY || ""
    const resendFrom = configMap["RESEND_FROM_EMAIL"]?.trim() || process.env.RESEND_FROM_EMAIL || "AIO System <noreply@aio-system.local>"

    return {
      resendApiKey,
      resendFrom,
      isConfigured: Boolean(resendApiKey),
    }
  } catch {
    return {
      resendApiKey: process.env.RESEND_API_KEY || "",
      resendFrom: process.env.RESEND_FROM_EMAIL || "AIO System <noreply@aio-system.local>",
      isConfigured: Boolean(process.env.RESEND_API_KEY),
    }
  }
}

export async function sendEmailNotification({ to, subject, html, from }: EmailPayload) {
  const config = await getSMTPConfig()
  const apiKey = (config.resendApiKey || process.env.RESEND_API_KEY || "").trim()
  const sender = from || config.resendFrom || "AIO System <noreply@aio-system.local>"

  if (!apiKey) {
    console.log(`[MOCK EMAIL SENT - NO RESEND API KEY]`)
    console.log(`From: ${sender} | To: ${to} | Subject: ${subject}`)
    return { success: true, mocked: true }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: sender,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: errText }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    console.error("Failed to send email notification:", error)
    return { success: false, error: error.message }
  }
}

export function generateCreditCheckRejectedEmail(bdName: string, poNumber: string, customerName: string, financeRemarks: string) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #dc2626;">PO Credit Hold Rejected: ${poNumber}</h2>
      <p>Hi ${bdName || "Sales Team"},</p>
      <p>Finance has reviewed the credit check case for <strong>${customerName}</strong> (PO No: <strong>${poNumber}</strong>) and marked it as <strong>REJECTED (Credit Not Released)</strong>.</p>
      <p><strong>Finance Remarks:</strong></p>
      <blockquote style="border-left: 4px solid #fca5a5; padding-left: 12px; color: #991b1b; background-color: #fef2f2; padding-top: 8px; padding-bottom: 8px;">
        ${financeRemarks}
      </blockquote>
      <p><strong>Action Required:</strong> Please follow up with the customer regarding outstanding payments or credit arrangements before the order can be processed.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">AIO System Sales Ordering - Automated Notification</p>
    </div>
  `
}
