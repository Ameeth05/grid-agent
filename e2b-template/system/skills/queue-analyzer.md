---
name: Queue Analyzer
description: Analyze PJM interconnection queue data for project insights
version: 1.0.0
triggers:
  - queue
  - interconnection
  - capacity
  - megawatt
  - MW
  - project status
  - generation
tools_required:
  - Read
  - Bash
  - code_execution
data_files:
  - /system/data/Interconnection Queue/CycleProjects-All.csv
---

# Queue Analyzer Skill

You are analyzing PJM interconnection queue data. This skill helps you understand project pipelines, capacity trends, and interconnection timelines.

## Data Location

Primary data file: `/system/data/Interconnection Queue/CycleProjects-All.csv`

Use Glob to discover available files:
```python
# Example: Find all queue data files
Glob("/system/data/Interconnection Queue/*.csv")

## Key Columns

| Column | Description | Example Values |
|--------|-------------|----------------|
| Project ID | Unique project identifier | AH1-665, AG2-095 |
| Project_Name | Developer-provided name | "Solar Farm Alpha" |
| Fuel_Type | Generation technology | Solar, Wind, Battery, Gas |
| Capacity_MW | Nameplate capacity in megawatts | 100, 250, 500 |
| Status | Current queue position | Active, Suspended, Withdrawn |
| Queue_Date | Date entered queue | 2023-01-15 |
| County | Project location county | Lancaster, Montgomery |
| State | Project location state | PA, NJ, OH |
| Transmission_Owner | Responsible TO | PECO, PPL, AEP |
| Cluster_Window | Assigned study cluster | 2024-Q1, 2024-Q2 |
| Study_Phase | Current study phase | Feasibility, System Impact, Facilities |
| Estimated_COD | Commercial operation date | 2026-06-01 |

## Analysis Patterns

### 1. Queue Summary Statistics
```python
import pandas as pd

# Load queue data
df = pd.read_csv('/system/data/Interconnection Queue/CycleProjects-All.csv')

# Summary by fuel type
summary = df.groupby('Fuel_Type').agg({
    'Capacity_MW': ['count', 'sum', 'mean'],
    'Queue_ID': 'count'
}).round(2)
print(summary)
```

### 2. Active Projects by State
```python
active = df[df['Status'] == 'Active']
by_state = active.groupby('State')['Capacity_MW'].sum().sort_values(ascending=False)
print(by_state.head(10))
```

### 3. Timeline Analysis
```python
df['Queue_Date'] = pd.to_datetime(df['Queue_Date'])
df['Queue_Year'] = df['Queue_Date'].dt.year

yearly_trend = df.groupby('Queue_Year')['Capacity_MW'].sum()
print(yearly_trend)
```

### 4. Withdrawal Rate Analysis
```python
total = len(df)
withdrawn = len(df[df['Status'] == 'Withdrawn'])
withdrawal_rate = (withdrawn / total) * 100
print(f"Withdrawal Rate: {withdrawal_rate:.1f}%")
```

## Response Guidelines

1. **Always cite data sources**: Reference specific files and dates
2. **Provide context**: Compare to historical trends when relevant
3. **Highlight risks**: Note projects in suspension or at risk of withdrawal
4. **Be precise with numbers**: Use exact MW values, not approximations
5. **Offer next steps**: Suggest follow-up analyses the user might want

## Example Queries

- "What's the total solar capacity in the PJM queue?"
- "Show me projects in Pennsylvania with capacity over 100 MW"
- "What's the average time from queue entry to COD?"
- "Compare wind vs solar project withdrawal rates"
