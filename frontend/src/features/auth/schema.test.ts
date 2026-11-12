import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schema";

describe("auth schemas", () => {
  it("login needs a valid email and an 8+ character password", () => {
    expect(
      loginSchema.isValidSync({
        email: "sam@example.com",
        password: "Password1",
      }),
    ).toBe(true);
    expect(
      loginSchema.isValidSync({ email: "not-an-email", password: "Password1" }),
    ).toBe(false);
    expect(
      loginSchema.isValidSync({ email: "sam@example.com", password: "short" }),
    ).toBe(false);
  });

  it("register requires matching passwords", async () => {
    const valid = {
      username: "sam",
      email: "sam@example.com",
      password: "Password1",
      repeatPassword: "Password1",
    };
    expect(registerSchema.isValidSync(valid)).toBe(true);
    await expect(
      registerSchema.validate({ ...valid, repeatPassword: "Password2" }),
    ).rejects.toThrow("Passwords must match");
  });
});
