import { describe, expect, it } from "vitest";

import { guideFace } from "./faceGuidance";

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
