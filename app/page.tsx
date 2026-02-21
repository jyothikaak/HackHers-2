"use client"

import { useState } from "react"
import useSWR from "swr"
import { Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  RiskGaugeCard,
  ForecastCard,
  AlertCard,
  FactorsCard,
  ExplanationCard,
  ActionChecklistCard,
  WhatIfSimulatorCard,
} from "@/components/dashboard-cards"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { SCENARIOS } from "@/lib/mock-data"
import type { DashboardData, Scenario } from "@/lib/mock-data"

/* ------------------------------------------------------------------ */
/*  Scenario labels for the segmented control                          */
/* ------------------------------------------------------------------ */

const SCENARIO_OPTIONS: { value: Scenario; label: string }[] = [
  { value: "balanced", label: "Balanced Week" },
  { value: "midterms", label: "Midterms Week" },
  { value: "allnighter", label: "All-nighter Week" },
]

/* ------------------------------------------------------------------ */
/*  SWR fetcher — falls back to scenario mock data on any error        */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export default function DashboardPage() {
  const [scenario, setScenario] = useState<Scenario>("midterms")

  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    fallbackData: undefined,
    onError: () => {
      /* errors are silently swallowed — we use scenario data below */
    },
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  // Scenario mock data drives the UI; API data is used when available and
  // no scenario is actively selected (future: remove mock when real API ships)
  const dashboard = SCENARIOS[scenario]

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
              <span className="text-sm font-bold text-primary">E</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Equilibria
            </span>
          </div>
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground"
          >
            <Shield className="h-3 w-3" />
            <span>Privacy: data stays local (demo)</span>
          </Badge>
        </div>
      </header>

      {/* ── Scenario segmented control ────────────────────────── */}
      <div className="border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Scenarios
          </span>
          <div className="flex gap-1 rounded-lg bg-secondary/60 p-1">
            {SCENARIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScenario(opt.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  scenario === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Row 1: Forecast chart + Risk gauge side by side */}
            <section className="mb-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <ForecastCard data={dashboard.forecast} hero />
                <div className="flex flex-col gap-6">
                  <RiskGaugeCard value={dashboard.riskPercent} />
                  <AlertCard
                    text={dashboard.alertText}
                    severity={dashboard.statusColor}
                  />
                </div>
              </div>
            </section>

            {/* Row 2: Risk Factors + Explanation + Action Plan */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Risk Factors & Insights
              </h2>
              <div className="grid gap-6 lg:grid-cols-3">
                <FactorsCard factors={dashboard.factors} />
                <ExplanationCard text={dashboard.explanation} />
                <ActionChecklistCard actions={dashboard.actions} />
              </div>
            </section>

            {/* Row 3: Full-width What-If Simulator */}
            <section className="mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                What-If Simulator
              </h2>
              <WhatIfSimulatorCard baselineRisk={dashboard.riskPercent} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
