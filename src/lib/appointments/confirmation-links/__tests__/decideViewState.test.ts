import { describe, it, expect } from "vitest";
import { decideViewState, type ViewState } from "../decideViewState";

const NOW = Date.now();
const futureIso = new Date(NOW + 100000).toISOString();
const pastIso = new Date(NOW - 100000).toISOString();

const futureToken = {
  expires_at: futureIso,
  used_at: null as string | null,
  invalidated_at: null as string | null,
};
const expiredToken = {
  expires_at: pastIso,
  used_at: null as string | null,
  invalidated_at: null as string | null,
};
const usedToken = {
  expires_at: futureIso,
  used_at: new Date().toISOString(),
  invalidated_at: null as string | null,
};
const invalidatedToken = {
  expires_at: futureIso,
  used_at: null as string | null,
  invalidated_at: new Date().toISOString(),
};

const validAppointment = { status: "confirmed" };
const cancelledAppointment = { status: "cancelled" };

describe("decideViewState", () => {
  it("returns 'error' when fetchError is a string", () => {
    expect(decideViewState(futureToken, null, "boom")).toBe<ViewState>("error");
  });

  it("returns 'error' when fetchError is an Error instance", () => {
    expect(
      decideViewState(futureToken, null, new Error("boom")),
    ).toBe<ViewState>("error");
  });

  it("returns 'invalid' when token is null and no error", () => {
    expect(decideViewState(null, null, null)).toBe<ViewState>("invalid");
  });

  it("returns 'invalid' when token is null even with error", () => {
    expect(decideViewState(null, null, "err")).toBe<ViewState>("error");
  });

  it("returns 'expired' when token is expired", () => {
    expect(decideViewState(expiredToken, null, null)).toBe<ViewState>(
      "expired",
    );
  });

  it("returns 'used' when used_at is set", () => {
    expect(decideViewState(usedToken, null, null)).toBe<ViewState>("used");
  });

  it("returns 'cancelled' when invalidated_at is set", () => {
    expect(decideViewState(invalidatedToken, null, null)).toBe<ViewState>(
      "cancelled",
    );
  });

  it("returns 'cancelled' when appointment.status is cancelled", () => {
    expect(
      decideViewState(futureToken, cancelledAppointment, null),
    ).toBe<ViewState>("cancelled");
  });

  it("returns 'error' when token valid but appointment null and no error", () => {
    expect(decideViewState(futureToken, null, null)).toBe<ViewState>("error");
  });

  it("returns 'valid' when token valid and appointment valid", () => {
    expect(
      decideViewState(futureToken, validAppointment, null),
    ).toBe<ViewState>("valid");
  });
});
