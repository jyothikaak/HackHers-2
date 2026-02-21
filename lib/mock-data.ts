/* ------------------------------------------------------------------ */
/*  Shared types — these define the API contract between frontend     */
/*  and backend.  Person A: implement endpoints that return these.    */
/* ------------------------------------------------------------------ */

export interface Factor {
  name: string
  value: number
}

export interface ChartPoint {
  day: string
  forecast: number
  upper: number
  lower: number
}

export interface ActionItem {
  id: string
  label: string
}

/** GET /api/dashboard response */
export interface DashboardData {
  riskPercent: number
  statusColor: "low" | "medium" | "high"
  factors: Factor[]
  forecast: ChartPoint[]
  forecastBand: ChartPoint[] // same shape; upper/lower used for band
  alertText: string
  explanation: string
  actions: ActionItem[]
}

/** POST /api/whatif request body */
export interface WhatIfRequest {
  sleep_hours: number
  deadlines_next_7_days: number
  work_hours: number
}

/** POST /api/whatif response */
export interface WhatIfResponse {
  newRiskPercent: number
  deltaPercent: number
}

/* ------------------------------------------------------------------ */
/*  Mock helpers                                                       */
/* ------------------------------------------------------------------ */

function makeChart(base: number, slope: number): ChartPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const forecast = Math.min(100, Math.max(0, Math.round(base + slope * i)))
    return {
      day: `Day ${i + 1}`,
      forecast,
      upper: Math.min(100, forecast + 8 + i),
      lower: Math.max(0, forecast - 8 - i),
    }
  })
}

function statusColorFromRisk(risk: number): DashboardData["statusColor"] {
  if (risk < 35) return "low"
  if (risk <= 70) return "medium"
  return "high"
}

/* ------------------------------------------------------------------ */
/*  Mock dashboard (fallback when /api/dashboard is unavailable)       */
/* ------------------------------------------------------------------ */

const chart = makeChart(48, 2.3)

export const MOCK_DASHBOARD: DashboardData = {
  riskPercent: 72,
  statusColor: "high",
  factors: [
    { name: "Sleep", value: 0.82 },
    { name: "Deadlines", value: 0.75 },
    { name: "Stress", value: 0.68 },
    { name: "Workload", value: 0.55 },
    { name: "Sentiment", value: 0.32 },
  ],
  forecast: chart,
  forecastBand: chart,
  alertText:
    "Projected risk crosses 70% in 6 days. Consider taking preventive action.",
  explanation:
    "Your sleep dropped 2.1 hours below your baseline this week and upcoming deadlines have doubled compared to last week. These two factors are the primary drivers of the projected spike. Stress levels have also remained elevated, further compounding the risk.",
  actions: [
    { id: "blocks", label: "Schedule focus blocks (2h deep work, then break)" },
    { id: "tasks", label: "Break large tasks into smaller deliverables" },
    { id: "workload", label: "Reduce workload by deferring or delegating 1-2 items" },
    { id: "advisor", label: "Talk to advisor / RA about current load" },
  ],
}

/* ------------------------------------------------------------------ */
/*  Mock what-if computation (fallback for POST /api/whatif)            */
/* ------------------------------------------------------------------ */

export function computeMockWhatIf(
  req: WhatIfRequest,
  baselineRisk: number
): WhatIfResponse {
  const sleepEffect = (8 - req.sleep_hours) * 4
  const deadlineEffect = (req.deadlines_next_7_days - 2) * 3
  const workEffect = (req.work_hours - 40) * 0.8
  const raw = 30 + sleepEffect + deadlineEffect + workEffect
  const newRiskPercent = Math.max(0, Math.min(100, Math.round(raw)))
  return {
    newRiskPercent,
    deltaPercent: newRiskPercent - baselineRisk,
  }
}
