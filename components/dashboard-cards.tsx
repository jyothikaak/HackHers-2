"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts"
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Minus,
  Loader2,
  Info,
  Sparkles,
} from "lucide-react"
import { computeMockWhatIf } from "@/lib/mock-data"
import type {
  Factor,
  ChartPoint,
  ActionItem,
  WhatIfRequest,
  WhatIfResponse,
} from "@/lib/mock-data"

/* ================================================================== */
/*  1. RiskGaugeCard                                                   */
/* ================================================================== */

function getRiskLevel(value: number) {
  if (value < 35) return { label: "Low", color: "text-risk-low" }
  if (value <= 70) return { label: "Medium", color: "text-risk-medium" }
  return { label: "High", color: "text-risk-high" }
}

function GaugeSVG({ value, size = 220 }: { value: number; size?: number }) {
  const risk = getRiskLevel(value)
  const startAngle = -225
  const endAngle = 45
  const totalAngle = endAngle - startAngle
  const currentAngle = startAngle + (value / 100) * totalAngle

  const cx = 100
  const cy = 100
  const r = 80

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const bgStart = polarToCartesian(startAngle)
  const bgEnd = polarToCartesian(endAngle)
  const bgLargeArc = totalAngle > 180 ? 1 : 0

  const valueEnd = polarToCartesian(currentAngle)
  const valueArc = currentAngle - startAngle
  const valueLargeArc = valueArc > 180 ? 1 : 0

  const strokeColor =
    value < 35
      ? "hsl(var(--risk-low))"
      : value <= 70
        ? "hsl(var(--risk-medium))"
        : "hsl(var(--risk-high))"

  const glowColor =
    value < 35
      ? "0 0 18px hsla(152,69%,46%,0.4)"
      : value <= 70
        ? "0 0 18px hsla(38,92%,55%,0.4)"
        : "0 0 18px hsla(0,72%,55%,0.4)"

  return (
    <svg
      viewBox="0 0 200 140"
      className="mx-auto w-full"
      style={{ maxWidth: size, filter: `drop-shadow(${glowColor})` }}
    >
      <path
        d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${bgLargeArc} 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {value > 0 && (
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 ${valueLargeArc} 1 ${valueEnd.x} ${valueEnd.y}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      {[0, 35, 70, 100].map((tick) => {
        const tickAngle = startAngle + (tick / 100) * totalAngle
        const inner = {
          x: cx + (r - 18) * Math.cos((tickAngle * Math.PI) / 180),
          y: cy + (r - 18) * Math.sin((tickAngle * Math.PI) / 180),
        }
        const outer = {
          x: cx + (r - 12) * Math.cos((tickAngle * Math.PI) / 180),
          y: cy + (r - 12) * Math.sin((tickAngle * Math.PI) / 180),
        }
        return (
          <line
            key={tick}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-sans"
        fontSize="34"
        fontWeight="700"
      >
        {value}%
      </text>
      <text
        x={cx}
        y={cy + 22}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
        fill={strokeColor}
      >
        {risk.label} Risk
      </text>
    </svg>
  )
}

interface RiskGaugeCardProps {
  value?: number
}

export function RiskGaugeCard({ value = 72 }: RiskGaugeCardProps) {
  return (
    <Card className="glass-subtle rounded-xl h-full">
      <CardContent className="flex h-full flex-col items-center justify-center p-5">
        <p className="mb-1 text-sm font-medium text-muted-foreground">
          Burnout Risk Score
        </p>
        <GaugeSVG value={value} size={200} />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-low" />
            <span>{"Low <35"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-medium" />
            <span>{"Med 35-70"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-risk-high" />
            <span>{">70 High"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  2. ForecastCard                                                    */
/* ================================================================== */

interface ForecastCardProps {
  data: ChartPoint[]
  hero?: boolean
}

export function ForecastCard({ data, hero = false }: ForecastCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(0)
  const chartHeight = hero ? 300 : 220

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setChartWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <Card className="glass-subtle rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            14-Day Projection
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full bg-primary" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-sm bg-primary/20" />
              <span>Confidence</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div ref={containerRef} className="w-full" style={{ height: chartHeight }}>
          {chartWidth > 0 && (
            <AreaChart
              width={chartWidth}
              height={chartHeight}
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(175,70%,42%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(175,70%,42%)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="forecastLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(175,70%,42%)" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="hsl(175,70%,42%)" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(175,70%,42%)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(215,20%,16%)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(215,14%,52%)" }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(215,14%,52%)" }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(215,25%,10%)",
                  border: "1px solid hsl(215,20%,16%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(210,20%,92%)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <ReferenceLine
                y={70}
                stroke="hsl(0,72%,55%)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "High risk",
                  position: "right",
                  fill: "hsl(0,72%,55%)",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stackId="band"
                stroke="none"
                fill="transparent"
              />
              <Area
                type="monotone"
                dataKey="upper"
                stackId="band"
                stroke="none"
                fill="url(#confidenceBand)"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="url(#forecastLine)"
                strokeWidth={2.5}
                fill="none"
                dot={false}
              />
            </AreaChart>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  3. AlertCard                                                       */
/* ================================================================== */

interface AlertCardProps {
  text: string
  severity: "low" | "medium" | "high"
}

const alertConfig = {
  low: {
    border: "border-risk-low/20",
    iconColor: "text-risk-low",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(152,69%,46%,0.15)]",
    Icon: CheckCircle2,
    title: "Looking Good",
  },
  medium: {
    border: "border-risk-medium/20",
    iconColor: "text-risk-medium",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(38,92%,55%,0.15)]",
    Icon: AlertCircle,
    title: "Moderate Risk Alert",
  },
  high: {
    border: "border-risk-high/20",
    iconColor: "text-risk-high",
    glowShadow: "shadow-[0_0_20px_-4px_hsl(0,72%,55%,0.15)]",
    Icon: AlertTriangle,
    title: "Risk Threshold Alert",
  },
}

export function AlertCard({ text, severity }: AlertCardProps) {
  const c = alertConfig[severity]
  const Icon = c.Icon

  return (
    <Card className={`glass-subtle rounded-xl ${c.border} ${c.glowShadow}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass-highlight">
          <Icon className={`h-4 w-4 ${c.iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{c.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  4. FactorsCard                                                     */
/* ================================================================== */

function getBarColor(value: number) {
  if (value < 0.35) return "hsl(var(--risk-low))"
  if (value <= 0.7) return "hsl(var(--risk-medium))"
  return "hsl(var(--risk-high))"
}

interface FactorsCardProps {
  factors: Factor[]
}

export function FactorsCard({ factors }: FactorsCardProps) {
  return (
    <Card className="glass-subtle rounded-xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Contributing Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {factors.map((factor) => (
            <div key={factor.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{factor.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {factor.value.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${factor.value * 100}%`,
                    backgroundColor: getBarColor(factor.value),
                    boxShadow: `0 0 8px ${getBarColor(factor.value)}40`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  5. ExplanationCard                                                 */
/* ================================================================== */

interface ExplanationCardProps {
  text: string
}

export function ExplanationCard({ text }: ExplanationCardProps) {
  return (
    <Card className="glass-subtle rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Plain-English Explanation
          </CardTitle>
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-primary/10 text-[11px] font-normal text-primary ring-1 ring-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            Gemini-assisted
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

/* ================================================================== */
/*  6. ActionChecklistCard                                             */
/* ================================================================== */

const FALLBACK_ACTIONS: ActionItem[] = [
  { id: "blocks", label: "Schedule focus blocks (2h deep work, then break)" },
  { id: "tasks", label: "Break large tasks into smaller deliverables" },
  { id: "workload", label: "Reduce workload by deferring or delegating 1-2 items" },
  { id: "advisor", label: "Talk to advisor / RA about current load" },
]

interface ActionChecklistCardProps {
  actions?: ActionItem[]
}

export function ActionChecklistCard({ actions }: ActionChecklistCardProps) {
  const actionList = actions ?? FALLBACK_ACTIONS
  const [items, setItems] = useState(actionList.map((a) => ({ ...a, checked: false })))

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const completed = items.filter((i) => i.checked).length

  return (
    <Card className="glass-subtle rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Action Plan
          </CardTitle>
          <span className="text-xs font-medium text-muted-foreground">
            {completed}/{items.length} done
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-glass-highlight"
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              <span
                className={`text-sm leading-relaxed ${
                  item.checked
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Not medical advice. Consult a professional for clinical concerns.</span>
        </div>
      </CardFooter>
    </Card>
  )
}

/* ================================================================== */
/*  7. WhatIfSimulatorCard                                             */
/* ================================================================== */

interface WhatIfSimulatorCardProps {
  baselineRisk?: number
}

export function WhatIfSimulatorCard({ baselineRisk = 72 }: WhatIfSimulatorCardProps) {
  const [sleepHours, setSleepHours] = useState([6])
  const [deadlines, setDeadlines] = useState([5])
  const [workHours, setWorkHours] = useState([50])
  const [result, setResult] = useState<WhatIfResponse>(() =>
    computeMockWhatIf(
      { sleep_hours: 6, deadlines_next_7_days: 5, work_hours: 50 },
      baselineRisk
    )
  )
  const [isComputing, setIsComputing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchWhatIf = useCallback(
    async (req: WhatIfRequest) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsComputing(true)
      try {
        const res = await fetch("/api/whatif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...req, baselineRisk }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data: WhatIfResponse = await res.json()
        setResult(data)
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setResult(computeMockWhatIf(req, baselineRisk))
      } finally {
        setIsComputing(false)
      }
    },
    [baselineRisk]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchWhatIf({
        sleep_hours: sleepHours[0],
        deadlines_next_7_days: deadlines[0],
        work_hours: workHours[0],
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [sleepHours, deadlines, workHours, fetchWhatIf])

  const newRisk = result.newRiskPercent
  const delta = result.deltaPercent
  const deltaSign = delta > 0 ? "+" : ""

  function getDeltaColor(d: number) {
    if (d < 0) return "text-risk-low"
    if (d > 0) return "text-risk-high"
    return "text-muted-foreground"
  }

  function getDeltaIcon(d: number) {
    if (d < 0) return <ArrowDown className="h-4 w-4" />
    if (d > 0) return <ArrowUp className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  function getRiskText(value: number) {
    if (value < 35) return "text-risk-low"
    if (value <= 70) return "text-risk-medium"
    return "text-risk-high"
  }

  function getRiskGlow(value: number) {
    if (value < 35) return "shadow-[0_0_24px_-4px_hsl(152,69%,46%,0.25)]"
    if (value <= 70) return "shadow-[0_0_24px_-4px_hsl(38,92%,55%,0.25)]"
    return "shadow-[0_0_24px_-4px_hsl(0,72%,55%,0.25)]"
  }

  return (
    <Card className="glass-subtle rounded-xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          What-If Simulator
        </CardTitle>
        <CardDescription>
          Adjust the sliders to see how changes affect your projected risk.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          {/* Sliders */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Sleep Hours
                </label>
                <span className="font-mono text-sm font-semibold text-primary">
                  {sleepHours[0]}h
                </span>
              </div>
              <Slider
                value={sleepHours}
                onValueChange={setSleepHours}
                min={3}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>3h</span>
                <span>10h</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Deadlines (next 7 days)
                </label>
                <span className="font-mono text-sm font-semibold text-primary">
                  {deadlines[0]}
                </span>
              </div>
              <Slider
                value={deadlines}
                onValueChange={setDeadlines}
                min={0}
                max={10}
                step={1}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Work Hours / Week
                </label>
                <span className="font-mono text-sm font-semibold text-primary">
                  {workHours[0]}h
                </span>
              </div>
              <Slider
                value={workHours}
                onValueChange={setWorkHours}
                min={20}
                max={80}
                step={1}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>20h</span>
                <span>80h</span>
              </div>
            </div>
          </div>

          {/* Result display */}
          <div
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl glass px-8 py-6 md:min-w-[180px] transition-opacity ${isComputing ? "opacity-60" : ""} ${getRiskGlow(newRisk)}`}
          >
            {isComputing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              New Projected Risk
            </span>
            <span className={`text-4xl font-bold ${getRiskText(newRisk)}`}>
              {newRisk}%
            </span>
            <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${newRisk}%`,
                  backgroundColor:
                    newRisk < 35
                      ? "hsl(var(--risk-low))"
                      : newRisk <= 70
                        ? "hsl(var(--risk-medium))"
                        : "hsl(var(--risk-high))",
                }}
              />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${getDeltaColor(delta)}`}
            >
              {getDeltaIcon(delta)}
              <span>
                {deltaSign}{delta}% from current
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
