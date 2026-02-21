"use client"

import useSWR from "swr"
import { Sidebar } from "@/components/sidebar"
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

  // Use API data if available, otherwise fall back to mock
  const dashboard = data ?? MOCK_DASHBOARD

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content area — offset for sidebar on desktop */}
      <main className="min-h-screen px-4 pt-16 pb-16 lg:ml-[260px] lg:px-10 lg:pt-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Burnout Radar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personalized risk analysis and action recommendations.
          </p>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* SECTION: Overview — Chart + Gauge side by side */}
            <section id="overview" className="scroll-mt-8 mb-8">
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

            {/* SECTION: Risk Factors + Insights — 2 column */}
            <section id="risk-factors" className="scroll-mt-8 mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Risk Factors & Insights
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <FactorsCard factors={dashboard.factors} />
                <div id="insights" className="scroll-mt-8 flex flex-col gap-6">
                  <ExplanationCard text={dashboard.explanation} />
                </div>
              </div>
            </section>

            {/* SECTION: Action Plan */}
            <section id="action-plan" className="scroll-mt-8 mb-8">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
                Action Plan
              </h2>
              <ActionChecklistCard actions={dashboard.actions} />
            </section>

            {/* SECTION: Simulator */}
            <section id="simulator" className="scroll-mt-8 mb-8">
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
