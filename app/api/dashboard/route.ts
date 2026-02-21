import { NextRequest, NextResponse } from "next/server"
import { SCENARIOS } from "@/lib/mock-data"
import type { DashboardData, Scenario } from "@/lib/mock-data"

const VALID_SCENARIOS: Scenario[] = ["balanced", "midterms", "allnighter"]

/**
 * GET /api/dashboard?scenario=midterms
 *
 * Returns the current burnout dashboard data.
 * Accepts an optional `scenario` query param to select mock data.
 *
 * Person A: Replace the mock return below with a real data source
 * (database query, ML model inference, etc.). The response shape
 * MUST match the DashboardData interface in lib/mock-data.ts.
 */
export async function GET(request: NextRequest) {
  try {
    // -----------------------------------------------------------
    // TODO (Person A): Replace this mock with a real data source.
    //
    // Example:
    //   const userId = getUserId(request)
    //   const data = await db.query("SELECT ... FROM burnout_scores WHERE user_id = ?", [userId])
    //   return NextResponse.json(data)
    // -----------------------------------------------------------

    const { searchParams } = new URL(request.url)
    const scenarioParam = searchParams.get("scenario") as Scenario | null
    const scenario: Scenario =
      scenarioParam && VALID_SCENARIOS.includes(scenarioParam)
        ? scenarioParam
        : "midterms"

    const data: DashboardData = SCENARIOS[scenario]

    return NextResponse.json(data)
  } catch (error) {
    console.error("[api/dashboard] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
