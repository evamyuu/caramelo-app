import { describe, expect, it } from "vitest";

import { lookupApp } from "./catalog";

describe("lookupApp", () => {
  it("finds official apps by the words people use", () => {
    expect(lookupApp("quero o zap").kind).toBe("official");
    expect(lookupApp("Meu SUS Digital")).toMatchObject({ kind: "official", app: { name: "Meu SUS Digital" } });
    expect(lookupApp("aplicativo do INSS")).toMatchObject({ kind: "official", app: { id: "br.gov.dataprev.meuinss" } });
  });

  it("flags copies that imitate an official name", () => {
    expect(lookupApp("WhatsApp Gold")).toMatchObject({ kind: "fake", app: { name: "WhatsApp" } });
    expect(lookupApp("INSS Digital")).toMatchObject({ kind: "fake", app: { name: "Meu INSS" } });
  });

  it("does not install what it does not know", () => {
    expect(lookupApp("Super Cupom Grátis").kind).toBe("unknown");
  });
});
