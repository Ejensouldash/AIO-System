"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

function isSafeCallbackUrl(url: string | null): url is string {
  return !!url && url.startsWith("/") && !url.startsWith("//")
}

export async function loginWithCredentials(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const callbackUrl = formData.get("callbackUrl") as string | null

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: isSafeCallbackUrl(callbackUrl) ? callbackUrl : "/dashboard"
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." }
        default:
          return { success: false, error: "A server authentication error occurred. Please try again." }
      }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
