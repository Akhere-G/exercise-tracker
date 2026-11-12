// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { stubApi } from "@/tests/apiStub";

vi.mock("next/headers", () => import("@/tests/nextServer"));
vi.mock("next/navigation", () => import("@/tests/navigation"));

import { GET } from "./route";

const call = (kind: string) =>
  GET(new NextRequest("http://localhost:3000/api/export/" + kind), {
    params: Promise.resolve({ kind }),
  });

describe("CSV export route", () => {
  it("streams the backend CSV as a download", async () => {
    const requests = stubApi(() => ({
      status: 200,
      data: "date,exercise\n2026-11-02,Bench Press\n",
    }));

    const res = await call("workouts");

    expect(requests[0].url).toBe("/export/workouts.csv");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="gains-workouts.csv"',
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toContain("Bench Press");
  });

  it("404s unknown exports without calling the backend", async () => {
    const requests = stubApi();
    expect((await call("passwords")).status).toBe(404);
    expect(requests).toHaveLength(0);
  });

  it("passes backend errors through, and 502s when unreachable", async () => {
    stubApi(() => ({ status: 403, data: {} }));
    expect((await call("body-weight")).status).toBe(403);

    stubApi(() => ({ networkError: true }));
    expect((await call("body-weight")).status).toBe(502);
  });
});
