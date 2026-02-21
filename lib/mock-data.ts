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
/*  Scenarios — typed state objects for the segmented control          */
/* ------------------------------------------------------------------ */

export type Scenario = "balanced" | "midterms" | "allnighter"

export const SCENARIOS: Record<Scenario, DashboardData> = {
  balanced: {
    riskPercent: 28,
    statusColor: "low",
    factors: [
      { name: "Sleep", value: 0.18 },
      { name: "Deadlines", value: 0.25 },
      { name: "Stress", value: 0.22 },
      { name: "Workload", value: 0.30 },
      { name: "Sentiment", value: 0.15 },
    ],
    forecast: makeChart(24, 0.5),
    forecastBand: makeChart(24, 0.5),
    alertText:
      "Risk is well below the threshold. Keep up the good habits!",
    explanation:
      "You're averaging 7.8 hours of sleep and your deadline load is light this week. Stress and workload are both within healthy ranges. No immediate action needed -- just maintain the balance.",
    actions: [
      { id: "maintain", label: "Maintain current sleep schedule (7-8 hours)" },
      { id: "exercise", label: "Keep up regular exercise routine" },
      { id: "social", label: "Continue scheduling social time between tasks" },
      { id: "journal", label: "Optional: start a short daily reflection journal" },
    ],
  },
  midterms: {
    riskPercent: 72,
    statusColor: "high",
    factors: [
      { name: "Sleep", value: 0.82 },
      { name: "Deadlines", value: 0.75 },
      { name: "Stress", value: 0.68 },
      { name: "Workload", value: 0.55 },
      { name: "Sentiment", value: 0.32 },
    ],
    forecast: makeChart(48, 2.3),
    forecastBand: makeChart(48, 2.3),
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
  },
  allnighter: {
    riskPercent: 91,
    statusColor: "high",
    factors: [
      { name: "Sleep", value: 0.96 },
      { name: "Deadlines", value: 0.88 },
      { name: "Stress", value: 0.90 },
      { name: "Workload", value: 0.85 },
      { name: "Sentiment", value: 0.78 },
    ],
    forecast: makeChart(82, 1.1),
    forecastBand: makeChart(82, 1.1),
    alertText:
      "Risk is critically high and rising. Immediate intervention recommended.",
    explanation:
      "You've had less than 3 hours of sleep for two consecutive nights, with 6 deadlines stacking in the next 4 days. Every contributing factor is in the red zone. Prioritize sleep tonight -- even 5 hours will meaningfully reduce projected risk by ~15%.",
    actions: [
      { id: "sleep", label: "Sleep at least 5 hours tonight (non-negotiable)" },
      { id: "defer", label: "Defer or drop the lowest-priority deadline" },
      { id: "help", label: "Ask a classmate or TA for help on one assignment" },
      { id: "reach", label: "Reach out to counseling services or a trusted friend" },
    ],
  },
}

/* Default export for backward compatibility */
export const MOCK_DASHBOARD: DashboardData = SCENARIOS.midterms

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
