import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectAnomalies } from "../lib/anomaly";

describe("detectAnomalies", () => {
  it("rejects negative usage", () => {
    const r = detectAnomalies({ oldReading: 100, newReading: 90, avgUsage3Months: 10 });
    assert.equal(r.reject, true);
    assert.ok(r.flags.includes("NEGATIVE_USAGE"));
  });

  it("flags high usage", () => {
    const r = detectAnomalies({ oldReading: 100, newReading: 130, avgUsage3Months: 10 });
    assert.equal(r.reject, false);
    assert.ok(r.flags.includes("HIGH_USAGE"));
  });

  it("flags new customer without history", () => {
    const r = detectAnomalies({ oldReading: 100, newReading: 110, avgUsage3Months: null });
    assert.ok(r.flags.includes("NEW_CUSTOMER"));
  });
});
