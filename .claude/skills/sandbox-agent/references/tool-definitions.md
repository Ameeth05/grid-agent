# Custom Tool Definitions

Define custom tools for GridAgent using the Claude Agent SDK `@tool` decorator.

## Table of Contents

1. [@tool Decorator Pattern](#tool-decorator-pattern)
2. [Grid Tools Implementation](#grid-tools-implementation)
3. [Creating MCP Servers](#creating-mcp-servers)
4. [Tool Best Practices](#tool-best-practices)

---

## @tool Decorator Pattern

### Basic Syntax

```python
from claude_agent_sdk import tool

@tool(
    name: str,           # Tool identifier (snake_case)
    description: str,    # What the tool does (shown to Claude)
    parameters: dict,    # Parameter definitions {name: type}
)
async def tool_function(args: dict) -> dict:
    """
    Process the tool request.

    Args:
        args: Dictionary of parameter values

    Returns:
        dict with "content" key containing list of content blocks
    """
    return {
        "content": [{
            "type": "text",
            "text": "Result string"
        }]
    }
```

### Parameter Types

```python
# Supported parameter types
{
    "string_param": str,
    "number_param": float,
    "integer_param": int,
    "boolean_param": bool,
    "object_param": dict,
    "array_param": list,
}
```

### Return Format

```python
# Text response
return {
    "content": [{
        "type": "text",
        "text": "Analysis complete. Found 42 results."
    }]
}

# Multiple content blocks
return {
    "content": [
        {"type": "text", "text": "## Summary"},
        {"type": "text", "text": "Found 42 projects in PA."},
        {"type": "text", "text": "Total capacity: 5,000 MW"},
    ]
}

# Error response
return {
    "content": [{
        "type": "text",
        "text": "Error: Invalid metric specified"
    }],
    "is_error": True
}
```

---

## Grid Tools Implementation

### analyze_queue Tool

Analyze PJM interconnection queue data with pre-built analysis patterns.

```python
from claude_agent_sdk import tool
from pathlib import Path
import json

SYSTEM_DIR = Path("/system")

@tool(
    "analyze_queue",
    "Quickly analyze PJM interconnection queue data with common metrics. "
    "Metrics: capacity_by_state, capacity_by_fuel, queue_depth, withdrawal_rate, "
    "avg_wait_time, cluster_distribution",
    {
        "metric": str,    # Analysis metric to compute
        "filters": dict,  # Optional filters: state, fuel_type, year, status
    }
)
async def analyze_queue(args: dict) -> dict:
    """
    Analyze interconnection queue with pre-built analysis patterns.

    Metrics:
    - capacity_by_state: Total MW by state
    - capacity_by_fuel: Total MW by fuel type (Solar, Wind, Storage, etc.)
    - queue_depth: Number of projects by status
    - withdrawal_rate: Projects withdrawn / total by year
    - avg_wait_time: Average days from queue to ISA
    - cluster_distribution: Projects by transition cluster
    """
    metric = args.get("metric", "capacity_by_state")
    filters = args.get("filters", {})

    # Validate metric
    valid_metrics = [
        "capacity_by_state", "capacity_by_fuel", "queue_depth",
        "withdrawal_rate", "avg_wait_time", "cluster_distribution"
    ]
    if metric not in valid_metrics:
        return {
            "content": [{
                "type": "text",
                "text": f"Invalid metric '{metric}'. Valid options: {', '.join(valid_metrics)}"
            }],
            "is_error": True
        }

    # Build guidance for the agent
    queue_path = SYSTEM_DIR / "data" / "Interconnection Queue"

    guidance = f"""## Queue Analysis: {metric}

**Requested Filters:** {json.dumps(filters) if filters else "None"}

**To perform this analysis:**

1. Use Glob to find queue data files:
   ```
   Glob pattern: {queue_path}/*.csv
   ```

2. Use Read to load the data file (typically CycleProjects-All.csv)

3. Use Bash to run Python/pandas analysis:
   ```python
   import pandas as pd

   # Load data
   df = pd.read_csv("{queue_path}/CycleProjects-All.csv")

   # Filter if needed
   {"df = df[df['State'] == '" + filters.get('state', '') + "']" if filters.get('state') else "# No state filter"}
   {"df = df[df['Fuel'] == '" + filters.get('fuel_type', '') + "']" if filters.get('fuel_type') else "# No fuel filter"}

   # Compute metric
   {"result = df.groupby('State')['MW'].sum().sort_values(ascending=False)" if metric == "capacity_by_state" else ""}
   {"result = df.groupby('Fuel')['MW'].sum().sort_values(ascending=False)" if metric == "capacity_by_fuel" else ""}
   {"result = df['Status'].value_counts()" if metric == "queue_depth" else ""}

   print(result)
   ```

**Key Columns in Queue Data:**
- `Queue Number`: Project identifier (e.g., "AE2-500")
- `State`: State abbreviation (PA, NJ, OH, etc.)
- `Fuel`: Generation type (Solar, Wind, Storage, Natural Gas, etc.)
- `MW`: Nameplate capacity in megawatts
- `Status`: Project status (Active, Withdrawn, In-Service, etc.)
- `Queue Date`: Date entered queue
- `Transition Cluster`: TC1, TC2, TC3, etc.
"""

    return {
        "content": [{
            "type": "text",
            "text": guidance
        }]
    }
```

### calculate_costs Tool

Estimate transmission upgrade costs based on project parameters.

```python
@tool(
    "calculate_costs",
    "Estimate transmission upgrade costs based on project parameters. "
    "Supports new transmission lines, reconductoring, and substation upgrades.",
    {
        "capacity_mw": float,      # Project capacity in MW
        "voltage_kv": float,       # Transmission voltage in kV
        "distance_miles": float,   # Line distance in miles (for line projects)
        "upgrade_type": str,       # "new_line", "reconductor", "substation"
    }
)
async def calculate_costs(args: dict) -> dict:
    """
    Calculate estimated transmission upgrade costs.

    Cost models based on industry averages:
    - New transmission line: ~$3M/mile (230kV baseline)
    - Reconductoring: ~$1.5M/mile
    - Substation upgrade: ~$50M base

    Adjustments made for voltage level and capacity.
    """
    capacity = args.get("capacity_mw", 100)
    voltage = args.get("voltage_kv", 230)
    distance = args.get("distance_miles", 10)
    upgrade_type = args.get("upgrade_type", "new_line")

    # Validate upgrade type
    valid_types = ["new_line", "reconductor", "substation"]
    if upgrade_type not in valid_types:
        return {
            "content": [{
                "type": "text",
                "text": f"Invalid upgrade_type '{upgrade_type}'. Valid options: {', '.join(valid_types)}"
            }],
            "is_error": True
        }

    # Base costs ($/mile or base $)
    base_costs = {
        "new_line": 3_000_000,      # $/mile for new transmission line
        "reconductor": 1_500_000,   # $/mile for reconductoring
        "substation": 50_000_000,   # Base cost for substation upgrade
    }

    base = base_costs[upgrade_type]

    # Calculate cost with adjustments
    if upgrade_type in ["new_line", "reconductor"]:
        # Adjust for voltage (higher voltage = more expensive)
        voltage_factor = (voltage / 230) ** 0.5

        # Adjust for capacity
        capacity_factor = (capacity / 500) ** 0.3

        estimated_cost = base * distance * voltage_factor * capacity_factor

        breakdown = f"""
| Component | Value |
|-----------|-------|
| Base cost | ${base:,.0f}/mile |
| Voltage factor | {voltage_factor:.2f}x ({voltage:.0f}kV vs 230kV baseline) |
| Capacity factor | {capacity_factor:.2f}x ({capacity:.0f}MW vs 500MW baseline) |
| Distance | {distance:.1f} miles |
| **Estimated Total** | **${estimated_cost:,.0f}** |
"""
    else:
        # Substation - adjust for capacity only
        capacity_factor = (capacity / 500) ** 0.5
        estimated_cost = base * capacity_factor

        breakdown = f"""
| Component | Value |
|-----------|-------|
| Base cost | ${base:,.0f} |
| Capacity factor | {capacity_factor:.2f}x ({capacity:.0f}MW vs 500MW baseline) |
| **Estimated Total** | **${estimated_cost:,.0f}** |
"""

    result = f"""## Cost Estimate: {upgrade_type.replace('_', ' ').title()}

### Input Parameters
- **Capacity**: {capacity:,.0f} MW
- **Voltage**: {voltage:,.0f} kV
- **Distance**: {distance:,.1f} miles
- **Upgrade Type**: {upgrade_type.replace('_', ' ').title()}

### Cost Breakdown
{breakdown}

### Important Notes
- This is a **rough estimate** for planning purposes only
- Actual costs vary significantly based on:
  - Terrain and environmental factors
  - Right-of-way acquisition
  - Permitting requirements
  - Regional labor costs
  - Material price fluctuations

### For Detailed Estimates
Review cluster study results in `/system/data/Cluster Results/` for project-specific cost allocations from PJM studies.
"""

    return {
        "content": [{
            "type": "text",
            "text": result
        }]
    }
```

---

## Creating MCP Servers

### Register Tools with MCP Server

```python
from claude_agent_sdk import create_sdk_mcp_server

# Create MCP server with all custom tools
grid_tools_server = create_sdk_mcp_server(
    name="grid_tools",
    version="1.0.0",
    tools=[analyze_queue, calculate_costs]
)
```

### Add to ClaudeAgentOptions

```python
options = ClaudeAgentOptions(
    # ... other options ...

    # Register MCP servers
    mcp_servers={
        "grid_tools": grid_tools_server,
    },

    # Allow custom tools (format: mcp__<server_name>__<tool_name>)
    allowed_tools=[
        "Read", "Write", "Edit", "Bash", "Grep", "Glob",
        "mcp__grid_tools__analyze_queue",
        "mcp__grid_tools__calculate_costs",
    ],
)
```

---

## Tool Best Practices

### 1. Clear Descriptions

```python
# Good - explains what, when, and how
@tool(
    "analyze_queue",
    "Quickly analyze PJM interconnection queue data with common metrics. "
    "Metrics: capacity_by_state, capacity_by_fuel, queue_depth, withdrawal_rate",
    ...
)

# Bad - too vague
@tool(
    "analyze",
    "Analyze data",
    ...
)
```

### 2. Validate Inputs

```python
async def my_tool(args: dict) -> dict:
    # Always validate required parameters
    required = args.get("required_param")
    if not required:
        return {
            "content": [{"type": "text", "text": "Error: required_param is required"}],
            "is_error": True
        }

    # Validate enum-like parameters
    valid_options = ["option1", "option2", "option3"]
    option = args.get("option", "option1")
    if option not in valid_options:
        return {
            "content": [{"type": "text", "text": f"Invalid option. Valid: {valid_options}"}],
            "is_error": True
        }
```

### 3. Return Actionable Results

```python
# Good - guides the agent on next steps
return {
    "content": [{
        "type": "text",
        "text": """## Analysis Result

Found 42 projects matching criteria.

**Next Steps:**
1. Use Read to load the full data for detailed analysis
2. Use Bash with pandas for custom aggregations
3. Save results to /user/results/ for the user
"""
    }]
}

# Bad - just raw data
return {"content": [{"type": "text", "text": "42"}]}
```

### 4. Handle Errors Gracefully

```python
async def my_tool(args: dict) -> dict:
    try:
        # Tool logic...
        result = process_data(args)
        return {"content": [{"type": "text", "text": result}]}

    except FileNotFoundError as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Data file not found: {e}. Use Glob to find available files."
            }],
            "is_error": True
        }

    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": f"Tool error: {str(e)}"
            }],
            "is_error": True
        }
```

### 5. Use Async When Appropriate

```python
# For I/O-bound operations, use async
@tool("fetch_data", "Fetch data from external source", {"url": str})
async def fetch_data(args: dict) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(args["url"])
        return {"content": [{"type": "text", "text": response.text}]}
```
