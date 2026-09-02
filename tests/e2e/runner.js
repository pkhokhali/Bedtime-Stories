/**
 * Unified E2E Test Suite Runner for Saanjh 3.0
 * 
 * Executes all 4 Tiers of verification:
 * - Tier 1: Feature Coverage (>=50 tests)
 * - Tier 2: Boundary & Corner Cases (>=50 tests)
 * - Tier 3: Cross-Feature Combinations (>=10 tests)
 * - Tier 4: Real-World CMS Scenarios (>=5 tests)
 * 
 * Command: node tests/e2e/runner.js
 * Exit Code: 0 on 100% pass; 1 on any failure
 */

const { colors, TestContext } = require('./harness');
const { runTier1 } = require('./tier1_features.test');
const { runTier2 } = require('./tier2_boundaries.test');
const { runTier3 } = require('./tier3_combinations.test');
const { runTier4 } = require('./tier4_scenarios.test');

async function main() {
  const globalStartTime = Date.now();

  console.log(`\n${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}         SAANJH 3.0 ADMIN & WORKERS - 4-TIER E2E TEST SUITE          ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.gray}Environment: Node.js ${process.version} | Platform: ${process.platform} | Time: ${new Date().toISOString()}${colors.reset}\n`);

  const tierContexts = [];

  try {
    // Execute Tier 1
    const t1Ctx = new TestContext('Tier 1: Feature Coverage');
    const t1Start = Date.now();
    await runTier1(t1Ctx);
    t1Ctx.duration = Date.now() - t1Start;
    tierContexts.push(t1Ctx);

    // Execute Tier 2
    const t2Ctx = new TestContext('Tier 2: Boundary & Corner Cases');
    const t2Start = Date.now();
    await runTier2(t2Ctx);
    t2Ctx.duration = Date.now() - t2Start;
    tierContexts.push(t2Ctx);

    // Execute Tier 3
    const t3Ctx = new TestContext('Tier 3: Cross-Feature Combinations');
    const t3Start = Date.now();
    await runTier3(t3Ctx);
    t3Ctx.duration = Date.now() - t3Start;
    tierContexts.push(t3Ctx);

    // Execute Tier 4
    const t4Ctx = new TestContext('Tier 4: Real-World Scenarios');
    const t4Start = Date.now();
    await runTier4(t4Ctx);
    t4Ctx.duration = Date.now() - t4Start;
    tierContexts.push(t4Ctx);
  } catch (fatalErr) {
    console.error(`\n${colors.red}${colors.bright}Fatal Test Runner Exception:${colors.reset}`, fatalErr);
    process.exit(1);
  }

  const globalDuration = Date.now() - globalStartTime;

  // Aggregate Metrics
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalAssertions = 0;
  const allFailures = [];

  for (const ctx of tierContexts) {
    totalTests += ctx.tests.length;
    totalPassed += ctx.passedCount;
    totalFailed += ctx.failedCount;
    totalAssertions += ctx.totalAssertions;
    if (ctx.failures.length > 0) {
      allFailures.push(...ctx.failures);
    }
  }

  // Print Summary Table
  console.log(`\n${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}                         E2E EXECUTION REPORT                         ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}`);

  for (let i = 0; i < tierContexts.length; i++) {
    const ctx = tierContexts[i];
    const tierNum = i + 1;
    const isPass = ctx.failedCount === 0;
    const statusSymbol = isPass ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    const tierTitle = `Tier ${tierNum}: ${ctx.name}`.padEnd(42);

    console.log(
      `  [${statusSymbol}] ${colors.bright}${tierTitle}${colors.reset} ` +
      `${colors.green}${ctx.passedCount} passed${colors.reset} / ` +
      `${ctx.failedCount > 0 ? colors.red + ctx.failedCount : colors.gray + '0'} failed${colors.reset} ` +
      `${colors.gray}(${ctx.tests.length} tests, ${ctx.totalAssertions} asserts, ${ctx.duration}ms)${colors.reset}`
    );
  }

  console.log(`${colors.cyan}----------------------------------------------------------------------${colors.reset}`);
  console.log(
    `  ${colors.bright}TOTAL METRICS:${colors.reset}  ` +
    `Tests: ${colors.bright}${totalTests}${colors.reset} | ` +
    `Passed: ${colors.green}${colors.bright}${totalPassed}${colors.reset} | ` +
    `Failed: ${totalFailed > 0 ? colors.red : colors.gray}${colors.bright}${totalFailed}${colors.reset} | ` +
    `Assertions: ${colors.bright}${totalAssertions}${colors.reset} | ` +
    `Duration: ${colors.bright}${globalDuration}ms${colors.reset}`
  );
  console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}\n`);

  if (totalFailed > 0) {
    console.log(`${colors.red}${colors.bright}❌ E2E SUITE FAILED WITH ${totalFailed} FAILURE(S):${colors.reset}\n`);
    for (const f of allFailures) {
      console.log(`  • ${colors.red}${f.name}${colors.reset}: ${f.error.message}`);
    }
    console.log('');
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}✨ ALL ${totalTests} E2E TESTS PASSED (100% SUCCESS RATE)! Exit Code: 0${colors.reset}\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
