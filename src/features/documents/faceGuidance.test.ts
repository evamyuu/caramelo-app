import { describe, expect, it } from "vitest";

import { gestureDone, guideFace, guideLight, yawFrom } from "./faceGuidance";

const FRAME = [480, 640] as const;

describe("guideFace", () => {
  it("asks for the face when none is detected", () => {
    expect(guideFace([], ...FRAME).ok).toBe(false);
  });
  it("rejects more than one person", () => {
    const box = { x: 100, y: 200, width: 200, height: 200 };
    expect(guideFace([box, box], ...FRAME).message).toContain("só você");
  });
  it("asks to come closer when the face is small", () => {
    expect(guideFace([{ x: 200, y: 280, width: 80, height: 80 }], ...FRAME).message).toContain("mais perto");
  });
  it("approves a centred, well-sized face", () => {
    expect(guideFace([{ x: 140, y: 220, width: 200, height: 200 }], ...FRAME).ok).toBe(true);
  });
});

describe("guideLight", () => {
  it("asks for light when the face is dark", () => {
    expect(guideLight({ face: 40, frame: 50 })?.message).toContain("escuro");
  });
  it("detects backlight: a bright window behind a dark face", () => {
    expect(guideLight({ face: 90, frame: 170 })?.message).toContain("atrás de você");
  });
  it("accepts even light", () => {
    expect(guideLight({ face: 140, frame: 150 })).toBeNull();
  });
});

describe("liveness gestures", () => {
  const neutral = { blink: 0.05, smile: 0.1, yaw: 0 };
  it("recognises each gesture only when it happens", () => {
    expect(gestureDone("blink", neutral)).toBe(false);
    expect(gestureDone("blink", { ...neutral, blink: 0.8 })).toBe(true);
    expect(gestureDone("smile", { ...neutral, smile: 0.7 })).toBe(true);
    expect(gestureDone("turn", { ...neutral, yaw: -0.4 })).toBe(true);
  });
  it("measures yaw from the nose between the cheeks", () => {
    expect(yawFrom(0.5, 0.3, 0.7)).toBeCloseTo(0);
    expect(yawFrom(0.38, 0.3, 0.7)).toBeCloseTo(-0.6);
  });
});
