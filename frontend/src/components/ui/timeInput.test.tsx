import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimeInput, { formatTime, parseDigits } from "./timeInput";

describe("time input parsing", () => {
  it.each([
    ["", null],
    ["5", 5],
    ["45", 45],
    ["130", 90],
    ["1000", 600],
    ["9959", 5999],
  ])("digits %s → %s seconds", (digits, seconds) => {
    expect(parseDigits(digits)).toBe(seconds);
  });

  it("formats seconds as MM:SS and blanks invalid values", () => {
    expect(formatTime(90)).toBe("01:30");
    expect(formatTime("")).toBe("");
    expect(formatTime(-5)).toBe("");
    expect(formatTime("abc")).toBe("");
  });
});

describe("TimeInput", () => {
  const setup = (props: Partial<Parameters<typeof TimeInput>[0]> = {}) => {
    const onChange = vi.fn();
    render(
      <TimeInput
        aria-label="Duration"
        value={60}
        onChange={onChange}
        {...props}
      />,
    );
    return {
      onChange,
      input: screen.getByRole("textbox", { name: "Duration" }),
      user: userEvent.setup(),
    };
  };

  it("commits typed digits as seconds on Enter", async () => {
    const { onChange, input, user } = setup();
    await user.click(input);
    await user.keyboard("1:30x{Enter}");
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it("discards the edit on Escape", async () => {
    const { onChange, input, user } = setup();
    await user.click(input);
    await user.keyboard("245{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("01:00");
  });

  it("ignores zero unless allowed", async () => {
    const { onChange, input, user } = setup();
    await user.click(input);
    await user.keyboard("0{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("accepts zero when allowed", async () => {
    const { onChange, input, user } = setup({ canBeZero: true });
    await user.click(input);
    await user.keyboard("0{Enter}");
    expect(onChange).toHaveBeenCalledWith(0);
  });
});
