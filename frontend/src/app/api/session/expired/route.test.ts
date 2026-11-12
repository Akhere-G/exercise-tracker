// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { cookieJar } from "@/tests/nextServer";

vi.mock("next/headers", () => import("@/tests/nextServer"));

import { GET } from "./route";

describe("expired session route", () => {
  it("clears the session cookies and sends the user to login", async () => {
    cookieJar.set("access_token", { value: "old" });
    cookieJar.set("demo_session", { value: "1" });

    const res = await GET(
      new NextRequest("http://localhost:3000/api/session/expired?from=/stats"),
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    expect(cookieJar.size).toBe(0);
  });
});
