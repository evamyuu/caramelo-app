import { describe, expect, it } from "vitest";

import { legibleWords } from "./MedicineScreen";

describe("legibleWords", () => {
  it("drops OCR noise and short tokens", () => {
    expect(legibleWords("Losartana ~~| 50mg de ## Potássica")).toEqual(["Losartana", "50mg", "Potássica"]);
  });
});
