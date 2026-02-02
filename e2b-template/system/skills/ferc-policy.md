---
name: FERC Policy Guide
description: FERC policy guidance - Order 2023, interconnection rules, compliance
version: 1.0.0
triggers:
  - FERC
  - policy
  - regulation
  - order 2023
  - compliance
  - rule
  - interconnection process
  - tariff
  - LGIA
  - GIA
tools_required:
  - read_file
  - grep
data_files:
  - /system/docs/*.md
  - /system/docs/*.pdf
---

# FERC Policy Guide Skill

You are providing guidance on FERC interconnection policies, particularly Order 2023 reforms. This skill helps users understand regulatory requirements, timelines, and compliance obligations.

## FERC Order 2023 Overview

**Effective Date**: April 2024 (with phased implementation)

**Purpose**: Reform generator interconnection procedures to address multi-year backlogs and improve efficiency.

### Key Reforms

1. **Cluster Study Process**
   - Projects studied in batches rather than serially
   - Three study phases with decision points
   - Encourages early withdrawal of non-viable projects

2. **Increased Financial Commitments**
   - Higher study deposits
   - Milestone payments tied to progress
   - Commercial readiness requirements

3. **Faster Timelines**
   - 150-day Phase 1 study timeline
   - 150-day Phase 2 study timeline
   - Penalties for transmission provider delays

4. **Site Control Requirements**
   - Must demonstrate 100% site control at application
   - No speculative queue positions allowed

## PJM Implementation

PJM has adapted Order 2023 into its Tariff and Operating Agreements:

### Transition Clusters

| Cluster | Application Window | Phase 1 Start | Notes |
|---------|-------------------|---------------|-------|
| TC1 | 2024 Q1 | May 2024 | First transition cluster |
| TC2 | 2024 Q2 | August 2024 | Larger cluster |
| TC3 | 2025 Q1 | February 2025 | Regular cycle begins |

### Study Phases

**Phase 1 - System Impact Study (SIS)**
- Duration: ~150 days
- Identifies network constraints
- Preliminary cost estimates
- Decision Point 1: Proceed, modify, or withdraw

**Phase 2 - Detailed System Impact Study**
- Duration: ~150 days
- Refined cost allocation
- Binding network upgrades
- Decision Point 2: Final commitment or withdrawal

**Phase 3 - Facilities Study**
- Duration: ~90 days
- Engineering designs
- Final interconnection agreement

### Financial Requirements

| Milestone | Amount | Timing |
|-----------|--------|--------|
| Application Deposit | $10,000/MW (min $50,000) | Application |
| Phase 1 Deposit | Additional deposit | Start of Phase 1 |
| Phase 2 Deposit | Additional deposit | Start of Phase 2 |
| Construction Security | Based on assigned costs | Before construction |

## Key Definitions

**MFO (Maximum Facility Output)**: The maximum gross output a generating facility can sustain over a period.

**Capacity Resource**: A generation resource that has capacity obligations and can provide firm power.

**Energy Resource**: A generation resource that provides energy but no capacity commitment (often intermittent resources).

**Network Upgrades**: Transmission system improvements required to reliably interconnect new generation.

**Decision Point**: A milestone where interconnection customers must decide to proceed or withdraw.

**Commercial Operation Date (COD)**: The date when a generating facility begins commercial operation.

## Compliance Considerations

### For Project Developers

1. **Site Control**: Maintain documentation of 100% site control
2. **Financial Readiness**: Have deposits ready for each phase
3. **Timeline Management**: Meet all milestone deadlines
4. **Withdrawal Decisions**: Make informed decisions at decision points
5. **Modification Requests**: Submit timely if project specs change

### For Analysis

When analyzing interconnection data:
- Compare timelines to Order 2023 requirements
- Track milestone compliance
- Identify projects at risk of procedural withdrawal
- Monitor cost allocation fairness

## Common Questions

**Q: Can a project reduce its capacity during the study process?**
A: Yes, at decision points, but increases are generally not allowed.

**Q: What happens if network upgrade costs are too high?**
A: Projects can withdraw at decision points and recover a portion of deposits.

**Q: How are costs allocated among cluster projects?**
A: Based on impact - projects causing the constraint bear proportional costs.

**Q: What is the "first-ready, first-served" principle?**
A: Order 2023 moved away from first-in-time to reward commercially-ready projects.

## Reference Documents

The following documents provide detailed guidance:
- `/system/docs/m14a.pdf` - PJM Manual 14A: Generation Interconnection
- `/system/docs/ferc-order-2023-summary.md` - Order 2023 summary (if available)
- `/system/docs/pjm-tariff-excerpts.md` - Relevant tariff sections (if available)

## Example Queries

- "What are the Phase 1 study timelines under Order 2023?"
- "How much deposit is required for a 100 MW solar project?"
- "When can a project withdraw and get its deposit back?"
- "What site control documentation is required?"
- "How are network upgrade costs allocated in a cluster?"
