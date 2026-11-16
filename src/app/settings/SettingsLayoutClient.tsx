"use client"

import { useState } from "react"
import { ProfileForm, GlobalSettingsForm } from "./SettingsClient"
import { User, Settings } from "lucide-react"

type Tab = {
  id: string
  name: string
  description: string
  icon: any
  adminOnly?: boolean
}

export function SettingsLayoutClient({
  user,
  settingsMap,
  isSuperAdmin,
}: {
  user: any
  settingsMap: Record<string, string>
  notices?: any[]
  units?: any[]
  isSuperAdmin: boolean
  isTrueSuperAdmin: boolean
}) {
  const [activeTab, setActiveTab] = useState("PROFILE")

  const tabs: Tab[] = [
    {
      id: "PROFILE",
      name: "My Profile",
      description: "Manage personal profile and password",
      icon: User,
    },
    ...(isSuperAdmin
      ? [
          {
            id: "CONFIG",
            name: "Global Configuration",
            description: "Company branding and system settings",
            icon: Settings,
            adminOnly: true,
          },
        ]
      : []),
  ]

  const activeTabDetails = tabs.find((t) => t.id === activeTab) || tabs[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* ── Left Sidebar Navigation ── */}
      <div className="lg:col-span-1">
        <nav className="flex flex-col space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all outline-none select-none z-10 ${
                  isActive
                    ? "bg-zinc-100 text-zinc-950 font-bold border border-zinc-200/40"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 font-semibold"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-500"
                  }`}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] tracking-tight leading-tight">{tab.name}</span>
                  {tab.adminOnly && (
                    <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                      Admin
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Active Pane ── */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
              <activeTabDetails.icon className="h-5.5 w-5.5 text-zinc-800" />
              {activeTabDetails.name}
            </h2>
            <p className="text-xs font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
              {activeTabDetails.description}
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-100">
            {activeTab === "PROFILE" && <ProfileForm user={user} />}
            {activeTab === "CONFIG" && <GlobalSettingsForm settingsMap={settingsMap} />}
          </div>
        </div>
      </div>
    </div>
  )
}
