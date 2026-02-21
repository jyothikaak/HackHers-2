"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  BarChart3,
  Activity,
  Brain,
  ListChecks,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react"
const navItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "risk-factors", label: "Risk Factors", icon: Activity },
  { id: "insights", label: "Insights", icon: Brain },
  { id: "action-plan", label: "Action Plan", icon: ListChecks },
  { id: "simulator", label: "Simulator", icon: SlidersHorizontal },
]

export function Sidebar() {
  const [activeSection, setActiveSection] = useState("overview")
  const [mobileOpen, setMobileOpen] = useState(false)

  // Track active section via IntersectionObserver
  useEffect(() => {
    const ids = navItems.map((item) => item.id)
    const observers: IntersectionObserver[] = []

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id)
            }
          })
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  function handleNavClick(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="p-5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
            <span className="text-sm font-bold text-primary">E</span>
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Equilibria
            </span>
            <p className="text-[11px] text-muted-foreground">Burnout Radar</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="mt-4 flex flex-col gap-1 px-3" aria-label="Dashboard sections">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-glass-highlight hover:text-foreground border-l-2 border-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Privacy badge */}
      <div className="p-4">
        <Badge
          variant="secondary"
          className="flex w-full items-center justify-center gap-1.5 bg-glass-highlight py-1.5 text-[11px] font-medium text-muted-foreground"
        >
          <Shield className="h-3 w-3" />
          <span>Data stays local (demo)</span>
        </Badge>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg glass text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] glass transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] glass lg:flex lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  )
}
