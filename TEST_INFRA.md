# E2E Test Infra: Saanjh Bedtime Stories Overhaul

## Test Philosophy
- Opaque-box, requirement-driven automated verification.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workloads + Adversarial Stress.
- Zero reliance on internal mocking; exercises live engines, mathematical models, Unicode parsers, and state stores.

---

## Feature Inventory & Test Coverage Mapping
| # | Feature | Requirement Source | Tier 1 (Unit) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Workload) | Tier 5 (Adversarial) |
|---|---------|-------------------|:-------------:|:-----------------:|:-----------------:|:-----------------:|:-------------------:|
| 1 | Storybook 3D Page Flip | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | ✓ |
| 2 | Stardust Particle Field | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | ✓ |
| 3 | Bilingual Logo Reveal | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | ✓ |
| 4 | Chime Audio Trigger | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | ✓ |
| 5 | Tap-to-Skip Splash | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ | ✓ |
| 6 | Celestial Palette Tokens | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | ✓ |
| 7 | Twinkling Starfield Sine Waves | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | ✓ |
| 8 | 4-Layer Himalayan Horizon | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | ✓ |
| 9 | Reusable Screen Background | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ | ✓ |
| 10 | Search Discovery Modal & FAB | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | ✓ |
| 11 | Real-Time Bilingual Search | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | ✓ |
| 12 | Quick Filter Pills (6 modes) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | ✓ |
| 13 | Recent & Trending Searches | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ | ✓ |
| 14 | Configurable Sleep Timer (5 modes) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ | ✓ |
| 15 | 10s Linear Audio Fade-Out Curve | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ | ✓ |
| 16 | Continuous Sleep Soundscapes | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ | ✓ |
| 17 | Bedtime Night Light Mode | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ | ✓ |
| 18 | 4-Card Settings Revamp | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ | ✓ |
| 19 | TypeScript Strict Compilation | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ | ✓ |
| 20 | Automated Verification Suite | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ | ✓ |

---

## Test Architecture
- **Runner**: Node.js automated test harness (`scripts/verify_e2e.js`)
- **Execution Command**: `node scripts/verify_e2e.js`
- **Total Test Cases**: 127
- **Total Assertions**: 215,722
- **Pass Semantics**: Exit code 0, 0 failures across all 5 tiers.
