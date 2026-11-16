"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

/**
 * Update user self-service profile (name & password change).
 */
export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "Unauthorized. Please log in again." }

  const name = (formData.get("name") as string || "").trim()
  const password = formData.get("password") as string || ""
  const confirmPassword = formData.get("confirmPassword") as string || ""

  if (!name) {
    return { success: false, error: "Full Name is required." }
  }

  try {
    const updateData: { name: string; password?: string } = { name }

    if (password.trim()) {
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters long." }
      }
      if (password !== confirmPassword) {
        return { success: false, error: "New password and confirmation password do not match." }
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    revalidatePath("/settings")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile." }
  }
}

/**
 * Superadmin global system settings updates (Company Profile & Name).
 */
export async function updateGlobalSettings(formData: FormData) {
  const session = await auth()
  if (session?.user.role !== "SUPERADMIN") return { success: false, error: "Unauthorized" }

  const companyName = formData.get("COMPANY_NAME") as string
  const supportEmail = formData.get("SUPPORT_EMAIL") as string

  try {
    const upsertSetting = async (key: string, value: string | null) => {
      const val = value !== null && value !== undefined ? value.trim() : ""
      await prisma.setting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val }
      })
    }

    const tasks = [
      upsertSetting("COMPANY_NAME", companyName),
      upsertSetting("SUPPORT_EMAIL", supportEmail)
    ]

    await Promise.all(tasks)

    revalidatePath("/settings")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
