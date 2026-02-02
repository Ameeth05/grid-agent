# Queue Analyzer Reference

Detailed documentation for PJM interconnection queue data analysis.

## Data File

**Path**: `/system/data/Interconnection Queue/CycleProjects-All.csv`

## CSV Column Schema (37 columns)

| Column | Type | Description | Example Values |
|--------|------|-------------|----------------|
| Project ID | string | Unique queue identifier | AH1-665, AG2-095 |
| Cycle | string | Study cycle (TC1, TC2, TC3) | TC2 |
| Stage | string | Current study stage | Phase 1, Phase 2, Decision Point 1 |
| Name | string | Technical project name | Goddard-Plumsville 138 kV II |
| Commercial Name | string | Marketing/brand name | (often blank) |
| Developer | string | Company developing project | Hummingbird Energy LLC |
| State | string | State abbreviation | VA, PA, OH |
| County | string | County location | Fleming, Prince George |
| Status | string | Project status | Active, Withdrawn, Suspended |
| Project Type | string | Interconnection type | Generation Interconnection |
| Transmission Owner | string | Responsible TO | Dominion, AEP, PPL |
| MFO | float | Maximum Facility Output (MW) | 180.0, 18.0 |
| MW Energy | float | Energy injection capability | 80.0, 18.0 |
| MW Capacity | float | Capacity resource injection | 53.5, 10.8 |
| MW In Service | float | Currently operating MW | 0.0 (usually) |
| Capacity or Energy | string | Resource classification | CAPACITY_RESOURCE, ENERGY_RESOURCE |
| Fuel | string | Generation technology | Solar, Storage, Natural Gas |
| Submitted Date | date | Queue entry date | 5/14/2025 |
| Requested In-Service Date | date | Target COD | (varies) |
| Actual In-Service Date | date | Actual COD | (blank until operating) |
| Commercial Operation Milestone | date | Contractual COD | (varies) |
| Backfeed Date | date | Backfeed achieved | (blank until achieved) |
| Test Energy Date | date | Test energy commenced | (blank until achieved) |
| Last Updated | date | Record update timestamp | 12/24/2025 |
| Withdrawn Date | date | Withdrawal date | (blank unless withdrawn) |
| Withdrawn Remarks | string | Withdrawal reason code | CIW (Customer Initiated Withdrawal) |
| Phase 1 SIS Report | url | Link to Phase 1 study | https://www.pjm.com/... |
| Phase 1 SIS Report Status | string | Phase 1 status | Posted, In Process, Not Started |
| Phase 2 SIS Report | url | Link to Phase 2 study | (varies) |
| Phase 2 SIS Report Status | string | Phase 2 status | Posted, In Process, Not Started |
| Phase 3 SIS Report | url | Link to Phase 3 study | (varies) |
| Phase 3 SIS Report Status | string | Phase 3 status | Posted, In Process, Not Started |
| Final SIS Report | url | Link to final study | (varies) |
| Final SIS Report Status | string | Final study status | Posted, In Process, Not Started |
| EPA/GIA/WMPA Report | url | Interconnection agreement | (varies) |
| EPA/GIA/WMPA Report Status | string | Agreement status | Posted, In Process, Not Started |
| CSA/USCA Report | url | Construction service | (varies) |
| CSA/USCA Report Status | string | CSA status | Posted, In Process, Not Started |
| Transmission Type | string | Transmission service type | (varies) |
| Rights (MW) | float | Transmission rights | (varies) |
| Long-Term Firm Service Start Date | date | LTFS start | (varies) |
| Long-Term Firm Service End Date | date | LTFS end | (varies) |

## Status Values

| Status | Description |
|--------|-------------|
| Active | Project proceeding through studies |
| Withdrawn | Project removed from queue |
| Suspended | Project temporarily paused |
| In Service | Project operating commercially |

## Withdrawal Reason Codes

| Code | Meaning |
|------|---------|
| CIW | Customer Initiated Withdrawal |
| PIW | PJM Initiated Withdrawal |
| FTM | Failure to Meet Milestones |

## Analysis Patterns

### Load and Inspect Data
```python
import pandas as pd

df = pd.read_csv('/system/data/Interconnection Queue/CycleProjects-All.csv')

# Basic info
print(f"Total projects: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Date range: {df['Submitted Date'].min()} to {df['Submitted Date'].max()}")
```

### Queue Summary Statistics
```python
# Projects by status
print(df['Status'].value_counts())

# Capacity by fuel type
by_fuel = df.groupby('Fuel').agg({
    'Project ID': 'count',
    'MFO': ['sum', 'mean'],
    'MW Capacity': 'sum'
}).round(1)
by_fuel.columns = ['Count', 'Total MFO', 'Avg MFO', 'Total Capacity']
print(by_fuel.sort_values('Total MFO', ascending=False))
```

### Projects by State
```python
# Active projects by state
active = df[df['Status'] == 'Active']
by_state = active.groupby('State').agg({
    'Project ID': 'count',
    'MFO': 'sum'
}).round(1)
by_state.columns = ['Projects', 'Total MW']
print(by_state.sort_values('Total MW', ascending=False))
```

### Timeline Analysis
```python
# Convert dates
df['Submitted Date'] = pd.to_datetime(df['Submitted Date'], format='%m/%d/%Y')
df['Submit Year'] = df['Submitted Date'].dt.year

# Submissions by year
yearly = df.groupby('Submit Year')['MFO'].agg(['count', 'sum']).round(1)
yearly.columns = ['Projects', 'Total MW']
print(yearly)
```

### Withdrawal Rate by Fuel Type
```python
def withdrawal_rate(group):
    total = len(group)
    withdrawn = (group['Status'] == 'Withdrawn').sum()
    return (withdrawn / total * 100).round(1) if total > 0 else 0

rates = df.groupby('Fuel').apply(withdrawal_rate)
print("Withdrawal Rate by Fuel Type:")
print(rates.sort_values(ascending=False))
```

### Filter by Criteria
```python
# Large solar projects in Virginia
va_solar = df[
    (df['State'] == 'VA') &
    (df['Fuel'] == 'Solar') &
    (df['MFO'] >= 100) &
    (df['Status'] == 'Active')
]
print(f"Large VA solar projects: {len(va_solar)}")
print(va_solar[['Project ID', 'Name', 'MFO', 'Stage', 'Developer']])
```

### Study Progress Analysis
```python
# Projects by study stage
stage_summary = df[df['Status'] == 'Active'].groupby('Stage')['MFO'].agg(['count', 'sum'])
stage_summary.columns = ['Projects', 'Total MW']
print(stage_summary)
```

### Developer Portfolio Analysis
```python
# Top developers by capacity
top_devs = df[df['Status'] == 'Active'].groupby('Developer').agg({
    'Project ID': 'count',
    'MFO': 'sum'
}).round(1)
top_devs.columns = ['Projects', 'Total MW']
print(top_devs.nlargest(10, 'Total MW'))
```

## Response Guidelines

1. **Always cite data source**: Mention file path and record date
2. **Show exact numbers**: Use precise MW values, not approximations
3. **Provide context**: Compare to totals or historical trends
4. **Highlight risks**: Note suspended projects or high withdrawal rates
5. **Suggest follow-ups**: Offer related analyses the user might want
