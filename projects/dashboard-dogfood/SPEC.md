# 📄 SPEC: Dashboard Industrial Stability Audit (Targeted)

## 🎯 Audit Target
**Project URL:** `http://localhost:5174/projects/T-L3-LifeRiver-Viz`
**Goal:** Ensure the refined Dashboard logic correctly handles a high-level VIZ project without data loss or UI regression.

## 🛠️ Requirements for QA (Bob)
You must simulate an audit of the target URL based on the provided `index.tsx` source code.

### 1. State Normalization Check
- Load the project `T-L3-LifeRiver-Viz`.
- Verify if the `template` ID from the legacy manifest is correctly mapped to `Team Structure: T2` (or appropriate) in the UI.
- Ensure no "Blank Select" occurs on initial load.

### 2. Constraint Matrix Validation
- **Context:** This is a `L3` + `VIZ` project.
- **Expected Warning A:** If the team does not have a `VD` (Visual Designer) role, a warning must appear: *"VIZ requires a Visual Designer (VD)."*
- **Expected Warning B:** Since Level is `L3`, if Process is set to `P1`, a warning must appear: *"L2+ requires QA-Loop (P2)."*

### 3. Clone Specialization Persistence
- Simulate clicking `Modify Clone` for Timi (DEV).
- Change the `model` to `deepseek-coder` and add a custom `dna_prompt`.
- Verify the `isDirty` flag (Unsaved Changes) triggers correctly.
- Simulate the `Save All` execution.
- **Critical Requirement:** The `POST` payload must contain the full `agents` array with all local modifications preserved.

## 🏁 Success Criteria
Bob must provide a **`DECISION: PASS`** only if he can logically prove, step-by-step, that the current code handles this specific project URL perfectly under the L-C-T-P matrix rules.
