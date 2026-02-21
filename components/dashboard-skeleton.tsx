"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/40 ${className ?? ""}`} />
}

export function DashboardSkeleton() {
  return (
    <>
      {/* Overview skeleton */}
      <section className="mb-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Chart skeleton */}
          <Card className="glass-subtle rounded-xl">
            <CardHeader className="pb-2">
              <Pulse className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Pulse className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Gauge + Alert skeleton */}
          <div className="flex flex-col gap-6">
            <Card className="glass-subtle rounded-xl h-full">
              <CardContent className="flex h-full flex-col items-center justify-center gap-4 p-5">
                <Pulse className="h-4 w-28" />
                <Pulse className="h-[200px] w-[200px] rounded-full" />
                <div className="flex gap-4">
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-3 w-12" />
                  <Pulse className="h-3 w-12" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Risk Factors skeleton */}
      <section className="mb-8">
        <Pulse className="mb-4 h-5 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="glass-subtle rounded-xl">
            <CardHeader>
              <Pulse className="h-4 w-36" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <Pulse className="h-3 w-16" />
                    <Pulse className="h-3 w-8" />
                  </div>
                  <Pulse className="h-2 w-full rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-subtle rounded-xl">
            <CardHeader>
              <Pulse className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Pulse className="h-4 w-full mb-2" />
              <Pulse className="h-4 w-3/4 mb-2" />
              <Pulse className="h-4 w-5/6" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Action Plan skeleton */}
      <section className="mb-8">
        <Pulse className="mb-4 h-5 w-32" />
        <Card className="glass-subtle rounded-xl">
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Pulse className="h-4 w-4 rounded" />
                <Pulse className="h-4 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  )
}
