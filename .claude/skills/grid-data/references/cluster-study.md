# Cluster Study Reference

Detailed documentation for PJM cluster study results analysis.

## Data File

**Path**: `/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json`

## JSON Schema

### Root Structure
```json
{
  "metadata": {...},
  "cluster_summary": {...},
  "projects": [...]
}
```

### Metadata Object
```json
{
  "cycle": "TC2",
  "phase": "I",
  "study_type": "Phase I System Impact Study",
  "version": "1.00",
  "release_date": "2025-10-29",
  "source": "PJM Interconnection Queue - Cluster Reports",
  "transformed_at": "2026-01-28T20:05:37.702261"
}
```

### Cluster Summary Object
```json
{
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
}
```

### by_resource_type Structure
```json
{
  "Solar": {
    "count": 246,
    "mfo_mw": 30419.0,
    "mwc_mw": 10448.7,
    "total_cost": 8008861332.0
  },
  "Storage": {
    "count": 111,
    "mfo_mw": 18204.8,
    "mwc_mw": 8108.2,
    "total_cost": 2235091540.0
  },
  "Natural Gas": {
    "count": 43,
    "mfo_mw": 32691.7,
    "mwc_mw": 10816.2,
    "total_cost": 3148233999.0
  },
  "Wind": {...},
  "Solar; Storage": {...},
  "Offshore Wind": {...},
  "Nuclear": {...},
  "Hydro": {...},
  "Biomass": {...},
  "Coal": {...}
}
```

### by_state Structure
```json
{
  "Virginia": {
    "count": 134,
    "mfo_mw": 24212.8,
    "total_cost": 4674573496.0
  },
  "Indiana": {
    "count": 49,
    "mfo_mw": 12011.5,
    "total_cost": 1960857180.0
  },
  "New Jersey": {...},
  ...
}
```

### Project Object Schema
```json
{
  "project_id": "AA1-001",
  "name": "Project Name",
  "fuel_type": "Solar",
  "state": "VA",
  "county": "Loudoun",
  "mfo_mw": 150.0,
  "mw_energy": 150.0,
  "mw_capacity": 75.0,
  "total_cost": 25000000,
  "dollar_per_kw": 166.67,
  "network_upgrades": [...]
}
```

## Key Metrics Explained

| Metric | Formula | Meaning |
|--------|---------|---------|
| $/kW (MFO) | total_cost / (mfo_mw * 1000) | Cost per kW of nameplate capacity |
| $/kW (MWE) | total_cost / (mw_energy * 1000) | Cost per kW of energy capability |
| $/kW (MWC) | total_cost / (mw_capacity * 1000) | Cost per kW of capacity resource |

## TC2 Phase 1 Summary (as of 2025-10-29)

| Metric | Value |
|--------|-------|
| Total Projects | 450 |
| Projects with Cost | 369 |
| Total MFO | 97,647 MW |
| Total MW Energy | 45,978 MW |
| Total MW Capacity | 33,857 MW |
| Total Cost | $15.52 billion |
| Average $/kW (MFO) | $158.98 |
| Average $/kW (MWE) | $337.63 |
| Average $/kW (MWC) | $458.50 |

## Analysis Patterns

### Load and Explore Data
```python
import json

with open('/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json') as f:
    data = json.load(f)

summary = data['cluster_summary']
print(f"Cycle: {data['metadata']['cycle']} Phase {data['metadata']['phase']}")
print(f"Total Projects: {summary['total_projects']}")
print(f"Total Cost: ${summary['total_cost_usd']:,.0f}")
```

### Capacity by Resource Type
```python
by_type = summary['by_resource_type']

print("Capacity by Resource Type:")
for rtype, stats in sorted(by_type.items(), key=lambda x: x[1]['mfo_mw'], reverse=True):
    print(f"  {rtype}: {stats['count']} projects, {stats['mfo_mw']:,.1f} MW, ${stats['total_cost']:,.0f}")
```

### Cost per MW by Resource Type
```python
print("\nCost per MW by Resource Type:")
for rtype, stats in sorted(by_type.items(), key=lambda x: x[1]['total_cost'] / max(x[1]['mfo_mw'], 1), reverse=True):
    if stats['mfo_mw'] > 0:
        cost_per_mw = stats['total_cost'] / stats['mfo_mw']
        print(f"  {rtype}: ${cost_per_mw:,.0f}/MW")
```

### State-Level Analysis
```python
by_state = summary['by_state']

print("\nTop States by Capacity:")
for state, stats in sorted(by_state.items(), key=lambda x: x[1]['mfo_mw'], reverse=True)[:10]:
    cost_per_mw = stats['total_cost'] / max(stats['mfo_mw'], 1)
    print(f"  {state}: {stats['count']} projects, {stats['mfo_mw']:,.1f} MW, ${cost_per_mw:,.0f}/MW")
```

### High-Cost Projects
```python
avg_cost_per_kw = summary['cluster_dollar_per_kw']['based_on_mfo']
threshold = avg_cost_per_kw * 2  # 2x average

high_cost = [p for p in data['projects'] if p.get('dollar_per_kw', 0) > threshold]
print(f"\nProjects with >2x average $/kW (>{threshold:.0f} $/kW): {len(high_cost)}")

for p in sorted(high_cost, key=lambda x: x.get('dollar_per_kw', 0), reverse=True)[:5]:
    print(f"  {p['project_id']}: {p['fuel_type']}, {p['state']}, ${p.get('dollar_per_kw', 0):,.0f}/kW")
```

### Cost Distribution
```python
import statistics

costs = [p.get('dollar_per_kw', 0) for p in data['projects'] if p.get('dollar_per_kw', 0) > 0]

print("\nCost Distribution ($/kW):")
print(f"  Min: ${min(costs):,.0f}")
print(f"  Max: ${max(costs):,.0f}")
print(f"  Mean: ${statistics.mean(costs):,.0f}")
print(f"  Median: ${statistics.median(costs):,.0f}")
```

### Compare Resource Types
```python
print("\nSolar vs Storage Comparison:")
solar = by_type.get('Solar', {})
storage = by_type.get('Storage', {})

print(f"  Solar: {solar.get('count', 0)} projects, {solar.get('mfo_mw', 0):,.0f} MW")
print(f"    Cost: ${solar.get('total_cost', 0) / max(solar.get('mfo_mw', 1), 1):,.0f}/MW")
print(f"  Storage: {storage.get('count', 0)} projects, {storage.get('mfo_mw', 0):,.0f} MW")
print(f"    Cost: ${storage.get('total_cost', 0) / max(storage.get('mfo_mw', 1), 1):,.0f}/MW")
```

## Response Guidelines

1. **Show cost context**: Always compare project costs to cluster averages
2. **Highlight outliers**: Identify unusually high or low cost projects
3. **Explain drivers**: What causes cost variation (congestion, upgrades, location)
4. **Consider viability**: High costs often correlate with withdrawal risk
5. **Compare to peers**: Show how similar projects in same region compare
