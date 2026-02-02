---
name: Risk Assessment
description: Project risk analysis - delays, cost overruns, withdrawal probability
version: 1.0.0
triggers:
  - risk
  - delay
  - withdrawal
  - timeline
  - probability
  - assessment
  - viability
  - success rate
tools_required:
  - read_file
  - code_execution
  - grep
data_files:
  - "/system/data/Interconnection Queue/CycleProjects-All.csv"
  - "/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json"
---

# Risk Assessment Skill

You are performing risk analysis on interconnection projects to assess their likelihood of successful completion. This skill helps identify projects at risk of withdrawal, delay, or cost overruns.

## Risk Framework

### Key Risk Categories

1. **Cost Risk**: High interconnection costs relative to project economics
2. **Timeline Risk**: Delays that threaten commercial viability
3. **Technical Risk**: Complex interconnection requirements
4. **Regulatory Risk**: Policy changes affecting project economics
5. **Market Risk**: Changes in power prices or capacity markets

### Historical Context

PJM interconnection queue withdrawal rates have historically been high:
- Pre-Order 2023: ~80% of projects withdrew before completion
- Order 2023 goal: Reduce withdrawals through better upfront screening

## Risk Indicators

### High-Risk Signals

| Indicator | Threshold | Risk Level |
|-----------|-----------|------------|
| $/kW interconnection cost | >$500/kW | High |
| Time in queue | >5 years | High |
| Multiple study restudy cycles | >1 | Medium-High |
| Speculative site control (pre-2023) | Any | Medium |
| Small developer with multiple large projects | Pattern | Medium |

### Low-Risk Signals

| Indicator | Threshold | Risk Level |
|-----------|-----------|------------|
| Major utility or established developer | - | Lower |
| Existing substation interconnection | - | Lower |
| Behind-the-meter or small scale | <20 MW | Lower |
| High capacity market prices in zone | - | Lower |

## Analysis Patterns

### 1. Cost-Based Risk Scoring
```python
import json

# Load cluster data
with open('/system/data/Cluster Results/TC2 Phase 1/TC2_Phase1_structured.json', 'r') as f:
    data = json.load(f)

summary = data['cluster_summary']
avg_cost_per_kw = summary['cluster_dollar_per_kw']['based_on_mfo']

# Risk thresholds
LOW_RISK = avg_cost_per_kw * 0.75
MEDIUM_RISK = avg_cost_per_kw * 1.5
HIGH_RISK = avg_cost_per_kw * 2.5

def assess_cost_risk(project):
    cost_per_kw = project.get('dollar_per_kw', 0)
    if cost_per_kw == 0:
        return "Unknown"
    elif cost_per_kw < LOW_RISK:
        return "Low"
    elif cost_per_kw < MEDIUM_RISK:
        return "Medium"
    elif cost_per_kw < HIGH_RISK:
        return "High"
    else:
        return "Critical"

# Apply to all projects
for project in data.get('projects', []):
    risk = assess_cost_risk(project)
    project['cost_risk'] = risk
```

### 2. Withdrawal Rate by Resource Type
```python
import pandas as pd

# Load queue data with project info
df = pd.read_csv('/system/data/Interconnection Queue/CycleProjects-All.csv')

# Calculate withdrawal rates
withdrawal_rates = df.groupby('Fuel').apply(
    lambda x: (x['Status'] == 'Withdrawn').sum() / len(x) * 100
).round(1)

print("Withdrawal Rate by Fuel Type:")
print(withdrawal_rates.sort_values(ascending=False))
```

### 3. Geographic Risk Analysis
```python
# Some states/zones have higher congestion and costs
high_cost_states = summary['by_state']
sorted_by_cost = sorted(
    high_cost_states.items(),
    key=lambda x: x[1]['total_cost'] / max(x[1]['mfo_mw'], 1),
    reverse=True
)

print("States with Highest $/MW:")
for state, stats in sorted_by_cost[:10]:
    cost_per_mw = stats['total_cost'] / max(stats['mfo_mw'], 1)
    print(f"  {state}: ${cost_per_mw:,.0f}/MW ({stats['count']} projects)")
```

### 4. Portfolio Risk Assessment
```python
def portfolio_risk_score(projects):
    """Calculate aggregate risk score for a portfolio."""
    scores = {
        'Low': 1,
        'Medium': 2,
        'High': 3,
        'Critical': 4,
        'Unknown': 2  # Assume medium if unknown
    }

    total_mw = sum(p.get('mfo_mw', 0) for p in projects)
    weighted_score = sum(
        scores.get(p.get('cost_risk', 'Unknown'), 2) * p.get('mfo_mw', 0)
        for p in projects
    )

    if total_mw > 0:
        return weighted_score / total_mw
    return 0

# Example usage
# score = portfolio_risk_score(data['projects'])
# print(f"Portfolio Risk Score: {score:.2f} (1=Low, 4=Critical)")
```

### 5. Withdrawal Probability Model
```python
def withdrawal_probability(project, cluster_avg_cost_per_kw):
    """
    Estimate withdrawal probability based on cost premium.
    Based on historical patterns where:
    - Projects at average cost: ~50% withdrawal
    - 2x average cost: ~75% withdrawal
    - 0.5x average cost: ~25% withdrawal
    """
    cost_per_kw = project.get('dollar_per_kw', 0)

    if cost_per_kw == 0:
        return 0.5  # Unknown, assume average

    # Cost ratio to cluster average
    ratio = cost_per_kw / cluster_avg_cost_per_kw

    # Logistic-style probability
    # P(withdraw) = 0.5 + 0.25 * log2(ratio)
    # Clamped to [0.05, 0.95]
    import math
    prob = 0.5 + 0.25 * math.log2(ratio) if ratio > 0 else 0.5
    return max(0.05, min(0.95, prob))
```

## Risk Report Template

When providing risk assessments, structure the output as:

```markdown
## Risk Assessment: [Project/Portfolio Name]

### Summary
- **Overall Risk Level**: [Low/Medium/High/Critical]
- **Primary Risk Factor**: [Cost/Timeline/Technical/etc.]
- **Withdrawal Probability**: [X%]

### Cost Analysis
- Interconnection Cost: $X per kW
- Cluster Average: $Y per kW
- Premium: +Z% above average

### Key Risk Factors
1. [Factor 1 with details]
2. [Factor 2 with details]

### Recommendations
- [Action item 1]
- [Action item 2]
```

## Response Guidelines

1. **Quantify risks**: Use specific numbers and percentages
2. **Compare to benchmarks**: Show how project compares to cluster/historical averages
3. **Identify drivers**: Explain what's causing the risk
4. **Provide context**: Consider market conditions and policy environment
5. **Suggest mitigations**: Offer actionable recommendations

## Example Queries

- "What's the withdrawal risk for solar projects in Virginia?"
- "Which projects in TC2 have the highest risk of withdrawal?"
- "Compare risk levels across different fuel types"
- "Assess the portfolio risk for projects by [Developer Name]"
- "What's the probability this project completes based on its costs?"
