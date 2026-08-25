import { describe, expect, it } from "vitest";
import { clientAddress } from "@/lib/security/request";

describe("adresse client de confiance", () => {
  it("préfère l’adresse écrasée par le reverse proxy", () => {
    const request = new Request("https://ello.example", { headers: { "x-real-ip": "203.0.113.8", "x-forwarded-for": "198.51.100.2, 203.0.113.8" } });
    expect(clientAddress(request)).toBe("203.0.113.8");
  });

  it("utilise le dernier hop forwarded en l’absence de X-Real-IP", () => {
    const request = new Request("https://ello.example", { headers: { "x-forwarded-for": "198.51.100.2, 203.0.113.8" } });
    expect(clientAddress(request)).toBe("203.0.113.8");
  });
});
