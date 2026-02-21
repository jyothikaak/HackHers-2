"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowDown, ArrowUp, Minus, Loader2 } from "lucide-react"
import { computeMockWhatIf } from "@/lib/mock-data"
import type { WhatIfRequest, WhatIfResponse } from "@/lib/mock-data"

interface WhatIfSimulatorProps {
  baselineRisk?: number
}

export function WhatIfSimulator({ baselineRisk = 72 }: WhatIfSimulatorProps) {
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
      // Cancel any in-flight request
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
        // Fallback to local computation
        setResult(computeMockWhatIf(req, baselineRisk))
      } finally {
        setIsComputing(false)
      }
    },
    [baselineRisk]
  )

  // Debounce slider changes (300ms)
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
            {/* Sleep */}
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

            {/* Deadlines */}
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

            {/* Work Hours */}
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
          <div className={`relative flex flex-col items-center justify-center gap-3 rounded-xl glass px-8 py-6 md:min-w-[180px] transition-opacity ${isComputing ? "opacity-60" : ""} ${getRiskGlow(newRisk)}`}>
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
