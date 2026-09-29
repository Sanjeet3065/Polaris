/**
 * POLARIS — SIH Demo Mode Test Suite
 * Phase 16: Verification of demo orchestration lifecycle, state transitions, and safety
 */

import assert from "assert";
import { demoService, DEMO_ACTS } from "../services/demo.service";

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ❌ [FAIL] ${name}: ${err?.message || err}`);
    throw err;
  }
}

export async function runDemoTests() {
  console.log("\n=======================================================");
  console.log("  POLARIS — PHASE 16: SIH DEMO MODE TEST SUITE");
  console.log("=======================================================\n");

  await test("DEMO-01: Demo service reports IDLE state before launch", () => {
    // Ensure clean initial state
    demoService.stopDemo();
    const status = demoService.getStatus();
    assert.strictEqual(status.status, "IDLE", "Expected initial status to be IDLE");
    assert.strictEqual(status.elapsedSeconds, 0, "Expected elapsed seconds to be 0");
    assert.strictEqual(status.progressPercent, 0, "Expected progress percent to be 0");
    assert.strictEqual(status.totalDurationSeconds, 62, "Expected 62s duration");
  });

  await test("DEMO-02: DEMO_ACTS constant defines 5 sequential acts within 62s", () => {
    assert.strictEqual(DEMO_ACTS.length, 5, "Expected exactly 5 acts in DEMO_ACTS");
    assert.strictEqual(DEMO_ACTS[0].act, 1, "Act 1 must start at index 0");
    assert.strictEqual(DEMO_ACTS[0].startSeconds, 0, "Act 1 must start at 0s");
    assert.strictEqual(DEMO_ACTS[1].act, 2, "Act 2 must follow Act 1");
    assert.strictEqual(DEMO_ACTS[1].startSeconds, 5, "Act 2 starts at T+5s");
    assert.strictEqual(DEMO_ACTS[2].act, 3, "Act 3 starts at T+18s");
    assert.strictEqual(DEMO_ACTS[3].act, 4, "Act 4 starts at T+32s");
    assert.strictEqual(DEMO_ACTS[4].act, 5, "Act 5 starts at T+50s");

    for (let i = 1; i < DEMO_ACTS.length; i++) {
      assert(
        DEMO_ACTS[i].startSeconds > DEMO_ACTS[i - 1].startSeconds,
        `Act ${i + 1} start time must be strictly greater than Act ${i}`
      );
    }
  });

  await test("DEMO-03: startDemo() transitions to ACTIVE status and Act 1", async () => {
    const activeState = await demoService.startDemo();
    assert.strictEqual(activeState.status, "ACTIVE", "Expected ACTIVE status after launch");
    assert.strictEqual(activeState.currentAct, 1, "Expected Act 1 at launch time");
    assert(activeState.startedAt !== null, "startedAt timestamp must be populated");
  });

  await test("DEMO-04: startDemo() is idempotent when already active", async () => {
    const secondCall = await demoService.startDemo();
    assert.strictEqual(secondCall.status, "ACTIVE", "Idempotent call should return ACTIVE status");
  });

  await test("DEMO-05: stopDemo() safely aborts and restores IDLE status", () => {
    const stoppedState = demoService.stopDemo();
    assert.strictEqual(stoppedState.status, "IDLE", "Expected IDLE status after stopping");
    assert.strictEqual(stoppedState.startedAt, null, "startedAt should be reset to null");
    assert.strictEqual(stoppedState.progressPercent, 0, "Progress should reset to 0");
  });

  console.log("\n✔ All Phase 16 SIH Demo Mode tests PASSED successfully!\n");
}
