"use client"

import { useState } from "react"
import { updateProfile, updateGlobalSettings } from "@/app/actions/settings"
import { Save, CheckCircle2, AlertTriangle, KeyRound, Building, User } from "lucide-react"

export function ProfileForm({ user }: { user: any }) {
  const [status, setStatus] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [clientError, setClientError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setClientError("")

    if (password) {
      if (password.length < 6) {
        setClientError("Password must be at least 6 characters long.")
        return
      }
      if (password !== confirmPassword) {
        setClientError("New password and confirmation password do not match.")
        return
      }
    }

    setIsSubmitting(true)
    setStatus("Saving...")
    const res = await updateProfile(new FormData(e.currentTarget))
    setIsSubmitting(false)
    if (res.success) {
      setStatus("Profile updated successfully!")
      setPassword("")
      setConfirmPassword("")
    } else {
      setStatus(`Error: ${res.error}`)
    }
    setTimeout(() => setStatus(""), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
        <input 
          type="text" 
          name="name" 
          defaultValue={user.name} 
          required 
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-zinc-800 placeholder:text-zinc-400" 
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email (Cannot be changed)</label>
        <input 
          type="email" 
          value={user.email} 
          disabled 
          className="w-full px-3.5 py-2.5 bg-zinc-100 border border-zinc-200 text-zinc-400 rounded-lg text-sm cursor-not-allowed" 
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">New Password (leave blank to keep current)</label>
        <input 
          type="password" 
          name="password" 
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (clientError) setClientError("")
          }}
          placeholder="••••••••" 
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-zinc-800 placeholder:text-zinc-400" 
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
        <input 
          type="password" 
          name="confirmPassword" 
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (clientError) setClientError("")
          }}
          placeholder="••••••••" 
          disabled={!password}
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-zinc-800 placeholder:text-zinc-400 disabled:bg-zinc-100 disabled:cursor-not-allowed" 
        />
      </div>
      {clientError && (
        <p className="text-sm text-red-500 font-semibold">{clientError}</p>
      )}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all px-4.5 py-2.5 rounded-lg text-sm font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
      {status && (
        <p className={`text-sm ${status.includes("Error") ? "text-red-500" : "text-emerald-600"} font-semibold mt-2`}>
          {status}
        </p>
      )}
    </form>
  )
}

export function GlobalSettingsForm({ settingsMap }: { settingsMap: Record<string, string> }) {
  const [status, setStatus] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("Saving...")
    const res = await updateGlobalSettings(new FormData(e.currentTarget))
    setIsSubmitting(false)
    setStatus(res.success ? "Global configuration saved successfully!" : `Error: ${res.error}`)
    setTimeout(() => setStatus(""), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Company Name</label>
        <input 
          type="text" 
          name="COMPANY_NAME" 
          defaultValue={settingsMap["COMPANY_NAME"] || "AIO System"} 
          required 
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-zinc-800" 
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Support Contact Email</label>
        <input 
          type="email" 
          name="SUPPORT_EMAIL" 
          defaultValue={settingsMap["SUPPORT_EMAIL"] || "support@aio-system.local"} 
          required 
          className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 text-zinc-800" 
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all px-4.5 py-2.5 rounded-lg text-sm font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="h-4 w-4 mr-2" /> {isSubmitting ? "Saving..." : "Save Global Settings"}
      </button>
      {status && (
        <p className={`text-sm ${status.includes("Error") ? "text-red-500" : "text-emerald-600"} font-semibold mt-2`}>
          {status}
        </p>
      )}
    </form>
  )
}
