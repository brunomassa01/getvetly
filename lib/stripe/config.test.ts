import { describe, it, expect } from "vitest";
import {
  limiteAssentos,
  ASSENTOS_TRIAL,
  ANALISES_GRATIS,
  limiteAnalisesGratis,
} from "./config";

describe("limiteAssentos", () => {
  it("trial (sem plano) = só o dono", () => {
    expect(limiteAssentos("trial", null)).toBe(ASSENTOS_TRIAL);
    expect(limiteAssentos("trial", null)).toBe(1);
  });

  it("plano ativo libera os assentos do tier", () => {
    expect(limiteAssentos("active", "starter")).toBe(2);
    expect(limiteAssentos("active", "pro")).toBe(5);
    expect(limiteAssentos("active", "business")).toBe(15);
  });

  it("plano sem status ativo cai no trial (1)", () => {
    expect(limiteAssentos("canceled", "pro")).toBe(1);
  });

  it("vitalício (admin interno/demo) = ilimitado", () => {
    expect(limiteAssentos("trial", null, true)).toBe(Infinity);
    expect(limiteAssentos("active", "starter", true)).toBe(Infinity);
  });
});

describe("limiteAnalisesGratis", () => {
  it("sem extra, vale o limite base do teste grátis", () => {
    expect(limiteAnalisesGratis(0)).toBe(ANALISES_GRATIS);
  });

  it("soma o extra concedido pelo admin interno", () => {
    expect(limiteAnalisesGratis(10)).toBe(ANALISES_GRATIS + 10);
  });

  it("extra negativo não reduz o limite base", () => {
    expect(limiteAnalisesGratis(-5)).toBe(ANALISES_GRATIS);
  });
});
