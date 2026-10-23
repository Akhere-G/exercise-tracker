import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schema";

describe("loginSchema", () => {
  it("accepts valid credentials", async () => {
    expect(await loginSchema.isValid({ email: "a@example.com", password: "Password1" })).toBe(true);
  });

  it.each([
    ["bad email", { email: "nope", password: "Password1" }],
    ["short password", { email: "a@example.com", password: "short" }],
    ["missing password", { email: "a@example.com" }],
  ])("rejects %s", async (_label, values) => {
    expect(await loginSchema.isValid(values)).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    username: "sam",
    email: "sam@example.com",
    password: "Password1",
    repeatPassword: "Password1",
  };

  it("accepts matching passwords", async () => {
    expect(await registerSchema.isValid(valid)).toBe(true);
  });

  it("rejects mismatched passwords", async () => {
    await expect(
      registerSchema.validate({ ...valid, repeatPassword: "Different1" }),
    ).rejects.toThrow("Passwords must match");
  });

  it("requires a username", async () => {
    expect(await registerSchema.isValid({ ...valid, username: "" })).toBe(false);
  });
});
