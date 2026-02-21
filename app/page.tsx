"use client"

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
import { MOCK_DASHBOARD } from "@/lib/mock-data"
import type { DashboardData } from "@/lib/mock-data"

/* ------------------------------------------------------------------ */
/*  SWR fetcher — falls back to mock data on any error                 */
/* ------------------------------------------------------------------ */

const fetcher = async (url: string): Promise<DashboardData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    fallbackData: undefined,
    onError: () => {
      /* errors are silently swallowed — we use MOCK_DASHBOARD below */
    },
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const dashboard = data ?? MOCK_DASHBOARD

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

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Two-column grid: stacked on mobile, side-by-side on lg */}
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              {/* ── Left column ──────────────────────────────────── */}
              <div className="flex flex-col gap-6">
                <RiskGaugeCard value={dashboard.riskPercent} />
                <ForecastCard data={dashboard.forecast} hero />
                <AlertCard
                  text={dashboard.alertText}
                  severity={dashboard.statusColor}
                />
              </div>

              {/* ── Right column ─────────────────────────────────── */}
              <div className="flex flex-col gap-6">
                <FactorsCard factors={dashboard.factors} />
                <ExplanationCard text={dashboard.explanation} />
                <ActionChecklistCard actions={dashboard.actions} />
              </div>
            </div>

            {/* ── Full-width bottom: What-If Simulator ──────────── */}
            <section className="mt-6">
              <WhatIfSimulatorCard baselineRisk={dashboard.riskPercent} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
