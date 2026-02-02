---
name: Cluster Study Analyzer
description: Analyze PJM cluster study results - network upgrades, cost allocation, feasibility
version: 1.0.0
triggers:
  - cluster
  - study
  - network upgrade
  - cost allocation
  - feasibility
  - system impact
  - phase 1
  - phase 2
  - phase 3
  - SIS
tools_required:
  - read_file
  - code_execution
  - grep
data_files:
  - "/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json"
  - "/system/data/Cluster Results/TC2 Phase 1/TC2_PHASE_1_*.json"
---

# Cluster Study Analyzer Skill

You are analyzing PJM cluster study results from FERC Order 2023 interconnection studies. This skill helps you understand network upgrade requirements, cost allocation, and project feasibility.

## Background: FERC Order 2023 Cluster Studies

FERC Order 2023 reformed the interconnection process to use a cluster-based approach:

1. **Phase 1 (System Impact Study)**: Initial screening for all projects in a cluster
   - Identifies network constraints
   - Preliminary cost estimates
   - Projects can withdraw at Decision Point 1

2. **Phase 2 (Detailed Study)**: Deeper analysis for projects that proceed
   - Refined cost allocation
   - Firm network upgrade assignments
   - Decision Point 2 for withdrawals

3. **Phase 3 (Facilities Study)**: Final engineering for remaining projects
   - Construction-ready designs
   - Final interconnection agreements

## Data Location

Primary data files:
- `/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json` - Structured Phase 1 results
- `/system/data/Cluster Results/` - Additional cluster data

## Data Schema

The structured JSON files contain:

```json
{
  "metadata": {
    "cycle": "TC2",
    "phase": "I",
    "study_type": "Phase I System Impact Study",
    "version": "1.00",
    "release_date": "2025-10-29"
  },
  "cluster_summary": {
    "total_projects": 450,
    "projects_with_nonzero_cost": 369,
    "total_mfo_mw": 97646.6,
    "total_mw_energy": 45977.6,
    "total_mw_capacity": 33857.2,
    "total_cost_usd": 15523556152.0,
    "cluster_dollar_per_kw": {
      "based_on_mfo": 158.98,
      "based_on_mwe": 337.63,
      "based_on_mwc": 458.5
    },
    "by_resource_type": {...},
    "by_state": {...}
  },
  "projects": [...]
}
```

## Key Metrics

| Metric | Description |
|--------|-------------|
| MFO (MW) | Maximum Facility Output - nameplate capacity |
| MWE | MW Energy - energy injection capability |
| MWC | MW Capacity - capacity resource injection |
| $/kW | Cost per kilowatt of capacity |
| Network Upgrades | Required transmission system improvements |

## Analysis Patterns

### 1. Load and Explore Cluster Data
```python
import json

# Load structured cluster data
with open('/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json', 'r') as f:
    data = json.load(f)

# Get summary
summary = data['cluster_summary']
print(f"Total Projects: {summary['total_projects']}")
print(f"Total Capacity (MFO): {summary['total_mfo_mw']:,.1f} MW")
print(f"Total Cost: ${summary['total_cost_usd']:,.0f}")
print(f"Average $/kW: ${summary['cluster_dollar_per_kw']['based_on_mfo']:.2f}")
```

### 2. Analyze by Resource Type
```python
by_type = summary['by_resource_type']

print("\nCapacity by Resource Type:")
for rtype, stats in sorted(by_type.items(), key=lambda x: x[1]['mfo_mw'], reverse=True):
    print(f"  {rtype}: {stats['count']} projects, {stats['mfo_mw']:,.1f} MW, ${stats['total_cost']:,.0f}")
```

### 3. Analyze by State
```python
by_state = summary['by_state']

print("\nTop States by Capacity:")
sorted_states = sorted(by_state.items(), key=lambda x: x[1]['mfo_mw'], reverse=True)
for state, stats in sorted_states[:10]:
    print(f"  {state}: {stats['count']} projects, {stats['mfo_mw']:,.1f} MW")
```

### 4. Calculate Cost Distribution
```python
# Projects with costs > $100M
high_cost = [p for p in data['projects'] if p.get('total_cost', 0) > 100_000_000]
print(f"Projects with >$100M cost: {len(high_cost)}")

# Average cost per MW by resource type
for rtype, stats in by_type.items():
    if stats['mfo_mw'] > 0:
        cost_per_mw = stats['total_cost'] / stats['mfo_mw']
        print(f"  {rtype}: ${cost_per_mw:,.0f}/MW")
```

### 5. Withdrawal Risk Analysis
```python
# High-cost projects are at higher withdrawal risk
threshold = summary['cluster_dollar_per_kw']['based_on_mfo'] * 1.5  # 1.5x average
at_risk = [p for p in data['projects']
           if p.get('dollar_per_kw', 0) > threshold]
print(f"Projects with high $/kW (>1.5x avg): {len(at_risk)}")
```

## Response Guidelines

1. **Always show cost context**: Compare project costs to cluster averages
2. **Highlight outliers**: Projects with unusually high or low costs
3. **Consider withdrawal risk**: High costs often lead to project withdrawals
4. **Explain network upgrades**: What transmission improvements are needed and why
5. **Compare to peers**: Show how similar projects in the same area compare

## Key Questions This Skill Answers

- What are the total upgrade costs for this cluster?
- Which projects have the highest interconnection costs?
- How do costs vary by resource type (solar vs storage vs gas)?
- Which states have the most congested transmission?
- What is the expected withdrawal rate based on costs?
- How does this cluster compare to previous clusters?

## Example Queries

- "What is the total cost of TC2 Phase 1 network upgrades?"
- "Show me the highest cost solar projects in Virginia"
- "Compare the $/kW for storage vs solar projects"
- "Which projects are most likely to withdraw based on costs?"
- "What's the breakdown of capacity by fuel type?"
