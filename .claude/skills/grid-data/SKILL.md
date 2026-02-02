---
name: grid-data
description: PJM ISO grid data analysis - interconnection queue, cluster studies, FERC Order 2023, risk assessment. Use when analyzing PJM queue projects, cluster study costs, FERC compliance, withdrawal risk, capacity by state/fuel type, or any US grid interconnection data.
---

# Grid Data

Analyze PJM Interconnection queue data, cluster study results, and perform due diligence on generation projects.

## PJM ISO Overview

PJM Interconnection manages the largest competitive wholesale electricity market in North America:
- **Coverage**: 13 states + DC (PA, NJ, MD, DE, VA, WV, OH, NC, KY, IN, IL, MI, TN)
- **Capacity**: ~185 GW serving 65+ million people
- **Queue**: 2,000+ projects representing 300+ GW of proposed generation
- **Role**: Coordinates interconnection studies, manages queue, ensures grid reliability

## Data Locations (Sandbox Paths)

| Data Type | Path | Format |
|-----------|------|--------|
| Queue Data | `/system/data/Interconnection Queue/CycleProjects-All.csv` | CSV, 37 columns |
| Cluster Results | `/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json` | JSON |
| FERC Manual | `/system/data/Interconnection Manual/` | PDF |

## Quick Start

### Load Queue Data
```python
import pandas as pd

df = pd.read_csv('/system/data/Interconnection Queue/CycleProjects-All.csv')

# Summary by fuel type
print(df.groupby('Fuel')['MFO'].agg(['count', 'sum']).round(1))

# Active projects by state
active = df[df['Status'] == 'Active']
print(active.groupby('State')['MFO'].sum().sort_values(ascending=False))
```

### Load Cluster Results
```python
import json

with open('/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json') as f:
    data = json.load(f)

summary = data['cluster_summary']
print(f"Total Projects: {summary['total_projects']}")
print(f"Total Capacity: {summary['total_mfo_mw']:,.1f} MW")
print(f"Total Cost: ${summary['total_cost_usd']:,.0f}")
print(f"Average $/kW: ${summary['cluster_dollar_per_kw']['based_on_mfo']:.2f}")
```

## FERC Order 2023 Cluster Phases

| Phase | Duration | Purpose | Decision Point |
|-------|----------|---------|----------------|
| Phase 1 | ~150 days | System Impact Study (SIS) | DP1: Proceed/Modify/Withdraw |
| Phase 2 | ~150 days | Detailed Study | DP2: Final Commitment |
| Phase 3 | ~90 days | Facilities Study | Final Interconnection Agreement |

**Key Reform**: Moved from serial "first-come, first-served" to cluster-based "first-ready, first-served" to reduce multi-year backlogs.

## Key Metrics

| Metric | Definition | Usage |
|--------|------------|-------|
| MFO | Maximum Facility Output - nameplate capacity in MW | Total generation potential |
| MWE | MW Energy - energy injection capability | For energy-only resources |
| MWC | MW Capacity - capacity resource injection | For capacity market participation |
| $/kW | Interconnection cost per kilowatt | Primary cost comparison metric |

## Resource Types

| Fuel Type | Typical Projects | Key Considerations |
|-----------|-----------------|-------------------|
| Solar | Utility-scale PV | High volume, lower $/kW |
| Storage | Battery (2-4 hr) | Often paired with solar |
| Solar; Storage | Hybrid projects | Combined capacity |
| Wind | Onshore wind farms | Transmission-constrained |
| Offshore Wind | Atlantic coast | High cost, complex permitting |
| Natural Gas | Peakers, CCGTs | Dispatchable, capacity value |
| Nuclear | SMRs, data center load | Emerging, long lead time |

## PJM Footprint States

| State | Abbrev | Transmission Owners |
|-------|--------|-------------------|
| Pennsylvania | PA | PPL, PECO, Duquesne |
| New Jersey | NJ | PSE&G, JCP&L |
| Maryland | MD | BGE, Pepco, Delmarva |
| Delaware | DE | Delmarva |
| Virginia | VA | Dominion, AEP |
| West Virginia | WV | AEP, FirstEnergy |
| Ohio | OH | AEP, FirstEnergy, Duke |
| Kentucky | KY | EKPC, LGE/KU |
| Indiana | IN | AES Indiana, Duke |
| Illinois | IL | ComEd, Ameren |
| Michigan | MI | DTE, Consumers |
| North Carolina | NC | Duke (partial) |
| Tennessee | TN | TVA (partial) |
| District of Columbia | DC | Pepco |

## Common Analysis Patterns

### Capacity Summary by Fuel Type
```python
by_fuel = df.groupby('Fuel').agg({
    'MFO': ['count', 'sum', 'mean'],
    'MW Capacity': 'sum'
}).round(1)
print(by_fuel)
```

### Withdrawal Rate Analysis
```python
total = len(df)
withdrawn = len(df[df['Status'] == 'Withdrawn'])
rate = (withdrawn / total) * 100
print(f"Withdrawal Rate: {rate:.1f}%")
```

### Cost Distribution by State
```python
by_state = data['cluster_summary']['by_state']
for state, stats in sorted(by_state.items(), key=lambda x: x[1]['total_cost'], reverse=True)[:10]:
    cost_per_mw = stats['total_cost'] / max(stats['mfo_mw'], 1)
    print(f"{state}: {stats['count']} projects, ${cost_per_mw:,.0f}/MW")
```

### Risk Assessment
```python
avg_cost_per_kw = summary['cluster_dollar_per_kw']['based_on_mfo']
high_risk_threshold = avg_cost_per_kw * 1.5

at_risk = [p for p in data['projects'] if p.get('dollar_per_kw', 0) > high_risk_threshold]
print(f"High-risk projects (>1.5x avg $/kW): {len(at_risk)}")
```

## Reference Files

Load these for detailed analysis:

| Reference | When to Use |
|-----------|-------------|
| `references/queue-analyzer.md` | Full CSV schema, column definitions, queue analysis patterns |
| `references/cluster-study.md` | JSON schema, cost calculations, resource type comparisons |
| `references/ferc-policy.md` | FERC Order 2023 details, compliance requirements, timelines |
| `references/risk-assessment.md` | Risk scoring methodology, withdrawal probability models |

## Example Queries

- "What is the total solar capacity in the PJM queue?"
- "Show me projects in Virginia with capacity over 100 MW"
- "What's the average interconnection cost per kW in TC2?"
- "Which states have the highest withdrawal rates?"
- "Compare storage vs solar project costs"
- "What projects are at high risk of withdrawal based on costs?"
- "How does TC2 Phase 1 capacity break down by fuel type?"
