import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "./store";

const timer = () => useTimer.getState();

describe("rest timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    timer().clear();
    useTimer.setState({ restTime: 180 });
    vi.useRealTimers();
  });

  it("counts down from the requested rest and keeps the length for next time", () => {
    timer().start(90);
    vi.advanceTimersByTime(30_000);
    expect(timer()).toMatchObject({
      currentTime: 60,
      isRunning: true,
      restTime: 90,
    });

    timer().start();
    expect(timer().currentTime).toBe(90);
  });

  it("defaults to three minutes", () => {
    timer().start();
    expect(timer().currentTime).toBe(180);
  });

  it("keeps counting into overtime below zero", () => {
    timer().start(2);
    vi.advanceTimersByTime(5_000);
    expect(timer().currentTime).toBe(-3);
  });

  it("pauses and resumes without losing time", () => {
    timer().start(60);
    vi.advanceTimersByTime(10_000);
    timer().pause();
    vi.advanceTimersByTime(30_000);
    expect(timer()).toMatchObject({ currentTime: 50, isRunning: false });

    timer().play();
    vi.advanceTimersByTime(5_000);
    expect(timer().currentTime).toBe(45);
  });

  it("restarting never runs two countdowns at once", () => {
    timer().start(60);
    timer().start(60);
    timer().play();
    vi.advanceTimersByTime(1_000);
    expect(timer().currentTime).toBe(59);
  });

  it("clear stops and resets to zero", () => {
    timer().start(60);
    timer().clear();
    vi.advanceTimersByTime(5_000);
    expect(timer()).toMatchObject({
      currentTime: 0,
      isRunning: false,
      timerInterval: null,
    });
  });
});
