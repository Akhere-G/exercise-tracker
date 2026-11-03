import { isAxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/src/lib/axios";

const EXPORTS: Record<string, string> = {
  workouts: "workouts.csv",
  "body-weight": "body-weight.csv",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params;
  const path = EXPORTS[kind];
  if (!path) return new NextResponse("Not found", { status: 404 });

  try {
    const response = await api.get<string>(`/export/${path}`, {
      responseType: "text",
    });
    return new NextResponse(response.data, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gains-${path}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = isAxiosError(err) ? (err.response?.status ?? 502) : 502;
    return new NextResponse("Could not export your data.", { status });
  }
}
