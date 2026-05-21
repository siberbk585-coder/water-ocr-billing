import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateUsage, calculateTotal } from "../lib/billing";

describe("billing", () => {
  it("calculates usage", () => {
    assert.equal(calculateUsage(150, 100), 50);
  });

  it("calculates total", () => {
    assert.equal(calculateTotal(10, 15000), 150000);
  });
});
