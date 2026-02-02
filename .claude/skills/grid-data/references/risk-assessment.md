# Risk Assessment Reference

Detailed documentation for project risk analysis and withdrawal probability modeling.

## Risk Framework

### Risk Categories

| Category | Description | Indicators |
|----------|-------------|------------|
| Cost Risk | Interconnection costs exceed project economics | High $/kW, cost escalation |
| Timeline Risk | Delays threaten commercial viability | Extended queue time, restudies |
| Technical Risk | Complex interconnection requirements | Major upgrades, multiple POIs |
| Regulatory Risk | Policy changes affect economics | Market rule changes, ITC/PTC expiry |
| Market Risk | Power price/capacity value changes | PPA availability, capacity auction results |
| Developer Risk | Developer financial/execution capability | Track record, portfolio concentration |

### Historical Context

PJM interconnection queue has historically seen high withdrawal rates:
- **Pre-Order 2023**: ~80% of projects withdrew before completion
- **Order 2023 Goal**: Reduce withdrawals through better upfront screening
- **TC2 Phase 1**: Early data suggests similar patterns emerging

## Risk Indicators

### High-Risk Signals

| Indicator | Threshold | Risk Level |
|-----------|-----------|------------|
| $/kW interconnection cost | >$500/kW | High |
| Time in queue | >5 years | High |
| Cost increase from Phase 1 to Phase 2 | >50% | High |
| Multiple restudy cycles | >1 | Medium-High |
| Small developer with many large projects | Pattern | Medium |
| Congested transmission zone | Known hotspots | Medium |

### Low-Risk Signals

| Indicator | Description | Risk Level |
|-----------|-------------|------------|
| Major utility/established developer | Track record | Lower |
| Existing substation interconnection | Simpler connection | Lower |
| Behind-the-meter or small scale | <20 MW | Lower |
| High capacity market prices in zone | Better economics | Lower |
| PPA or off-take secured | Revenue certainty | Lower |

## Risk Scoring Methodology

### Cost-Based Risk Score

```python
def calculate_cost_risk(project, cluster_avg_cost_per_kw):
    """
    Calculate cost-based risk score.

    Args:
        project: Project dict with 'dollar_per_kw' field
        cluster_avg_cost_per_kw: Average $/kW for the cluster

    Returns:
        Risk level string: Low, Medium, High, Critical
    """
    cost_per_kw = project.get('dollar_per_kw', 0)

    if cost_per_kw == 0:
        return "Unknown"

    # Thresholds relative to cluster average
    LOW_THRESHOLD = cluster_avg_cost_per_kw * 0.75
    MEDIUM_THRESHOLD = cluster_avg_cost_per_kw * 1.5
    HIGH_THRESHOLD = cluster_avg_cost_per_kw * 2.5

    if cost_per_kw < LOW_THRESHOLD:
        return "Low"
    elif cost_per_kw < MEDIUM_THRESHOLD:
        return "Medium"
    elif cost_per_kw < HIGH_THRESHOLD:
        return "High"
    else:
        return "Critical"
```

### Withdrawal Probability Model

```python
import math

def estimate_withdrawal_probability(project, cluster_avg_cost_per_kw):
    """
    Estimate withdrawal probability based on cost premium.

    Based on historical patterns:
    - Projects at average cost: ~50% withdrawal
    - 2x average cost: ~75% withdrawal
    - 0.5x average cost: ~25% withdrawal

    Args:
        project: Project dict with 'dollar_per_kw' field
        cluster_avg_cost_per_kw: Average $/kW for the cluster

    Returns:
        Probability between 0.05 and 0.95
    """
    cost_per_kw = project.get('dollar_per_kw', 0)

    if cost_per_kw == 0:
        return 0.5  # Unknown, assume average

    # Cost ratio to cluster average
    ratio = cost_per_kw / cluster_avg_cost_per_kw

    # Logistic-style probability
    # P(withdraw) = 0.5 + 0.25 * log2(ratio)
    if ratio > 0:
        prob = 0.5 + 0.25 * math.log2(ratio)
    else:
        prob = 0.5

    # Clamp to reasonable range
    return max(0.05, min(0.95, prob))
```

### Portfolio Risk Score

```python
def calculate_portfolio_risk(projects):
    """
    Calculate aggregate risk score for a portfolio of projects.

    Args:
        projects: List of project dicts with 'cost_risk' and 'mfo_mw' fields

    Returns:
        MW-weighted risk score (1=Low, 4=Critical)
    """
    risk_scores = {
        'Low': 1,
        'Medium': 2,
        'High': 3,
        'Critical': 4,
        'Unknown': 2  # Assume medium if unknown
    }

    total_mw = sum(p.get('mfo_mw', 0) for p in projects)
    if total_mw == 0:
        return 0

    weighted_score = sum(
        risk_scores.get(p.get('cost_risk', 'Unknown'), 2) * p.get('mfo_mw', 0)
        for p in projects
    )

    return weighted_score / total_mw
```

## Analysis Patterns

### Apply Risk Scoring to Cluster
```python
import json

with open('/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json') as f:
    data = json.load(f)

summary = data['cluster_summary']
avg_cost_per_kw = summary['cluster_dollar_per_kw']['based_on_mfo']

# Score all projects
risk_counts = {'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0, 'Unknown': 0}
for project in data['projects']:
    risk = calculate_cost_risk(project, avg_cost_per_kw)
    risk_counts[risk] += 1
    project['cost_risk'] = risk

print("Risk Distribution:")
for level, count in risk_counts.items():
    pct = count / len(data['projects']) * 100
    print(f"  {level}: {count} projects ({pct:.1f}%)")
```

### Withdrawal Rate by Fuel Type
```python
import pandas as pd

df = pd.read_csv('/system/data/Interconnection Queue/CycleProjects-All.csv')

# Calculate historical withdrawal rates
def calc_withdrawal_rate(group):
    total = len(group)
    withdrawn = (group['Status'] == 'Withdrawn').sum()
    return (withdrawn / total * 100) if total > 0 else 0

rates = df.groupby('Fuel').apply(calc_withdrawal_rate).round(1)
print("Historical Withdrawal Rate by Fuel Type:")
print(rates.sort_values(ascending=False))
```

### Geographic Risk Analysis
```python
by_state = data['cluster_summary']['by_state']

print("States Ranked by Cost ($/MW):")
ranked = sorted(
    by_state.items(),
    key=lambda x: x[1]['total_cost'] / max(x[1]['mfo_mw'], 1),
    reverse=True
)

for state, stats in ranked[:10]:
    cost_per_mw = stats['total_cost'] / max(stats['mfo_mw'], 1)
    print(f"  {state}: ${cost_per_mw:,.0f}/MW ({stats['count']} projects)")
```

### Identify At-Risk Projects
```python
# Projects most likely to withdraw
at_risk = []
for project in data['projects']:
    prob = estimate_withdrawal_probability(project, avg_cost_per_kw)
    if prob >= 0.7:  # 70%+ withdrawal probability
        project['withdrawal_prob'] = prob
        at_risk.append(project)

print(f"\nHigh Withdrawal Risk Projects (>70%): {len(at_risk)}")
for p in sorted(at_risk, key=lambda x: x['withdrawal_prob'], reverse=True)[:10]:
    print(f"  {p['project_id']}: {p['fuel_type']}, {p['state']}, {p['withdrawal_prob']*100:.0f}% prob")
```

## Risk Report Template

```markdown
## Risk Assessment: [Project/Portfolio Name]

### Summary
- **Overall Risk Level**: [Low/Medium/High/Critical]
- **Primary Risk Factor**: [Cost/Timeline/Technical/etc.]
- **Withdrawal Probability**: [X%]

### Cost Analysis
| Metric | Value | Benchmark |
|--------|-------|-----------|
| Interconnection Cost | $X/kW | Cluster avg: $Y/kW |
| Cost Premium | +Z% | Threshold: 150% |
| Total Upgrade Cost | $X million | - |

### Risk Factors
1. **[Factor 1]**: [Description and impact]
2. **[Factor 2]**: [Description and impact]
3. **[Factor 3]**: [Description and impact]

### Peer Comparison
| Project | Fuel | State | $/kW | Risk |
|---------|------|-------|------|------|
| Subject | X | Y | $Z | High |
| Peer 1 | X | Y | $A | Medium |
| Peer 2 | X | Y | $B | Low |

### Recommendations
1. [Action item with rationale]
2. [Action item with rationale]
3. [Action item with rationale]
```

## Response Guidelines

1. **Quantify risks**: Use specific numbers and percentages
2. **Compare to benchmarks**: Show how project compares to cluster/historical averages
3. **Identify drivers**: Explain what's causing elevated risk
4. **Consider context**: Account for market conditions and policy environment
5. **Suggest mitigations**: Offer actionable recommendations
6. **Show confidence**: Indicate uncertainty in projections
