import { NextResponse } from "next/server"
import { MOCK_DASHBOARD } from "@/lib/mock-data"
import type { DashboardData } from "@/lib/mock-data"

/**
 * GET /api/dashboard
 *
 * Returns the current burnout dashboard data.
 *
 * Person A: Replace the mock return below with a real data source
 * (database query, ML model inference, etc.). The response shape
 * MUST match the DashboardData interface in lib/mock-data.ts.
 */
export async function GET() {
  try {
    // -----------------------------------------------------------
    // TODO (Person A): Replace this mock with a real data source.
    //
    // Example:
    //   const data = await db.query("SELECT ... FROM burnout_scores ...")
    //   return NextResponse.json(data)
    // -----------------------------------------------------------

    const data: DashboardData = MOCK_DASHBOARD

    return NextResponse.json(data)
  } catch (error) {
    console.error("[api/dashboard] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
