"""
Transform raw scraped PJM Cluster Study markdown-JSON into structured JSON.

Usage:
    python transform_cluster_data.py <input_raw.json> <output_structured.json>

Example:
    python transform_cluster_data.py "TC2 Phase 1/TC2_PHASE_1_20260124_210151.json" "TC2 Phase 1/TC2_Phase1_structured.json"

The raw JSON is a Firecrawl scrape with a single massive markdown string.
This script parses it into structured, query-friendly JSON.
"""

import json
import re
import sys
import os
from datetime import datetime


def parse_dollar(s: str) -> float | None:
    """Parse dollar string like '$26,760,841' -> 26760841.0"""
    s = s.replace("$", "").replace(",", "").strip()
    if not s or s.lower() in ("n/a", "tbd", "contingent"):
        return None
    # Handle contingent cost entries with HTML
    if "contingent" in s.lower() or "<br>" in s.lower():
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_float(s: str) -> float | None:
    """Parse numeric string to float."""
    s = s.strip()
    if not s or s.lower() in ("n/a", "tbd", ""):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_table_rows(text: str) -> list[list[str]]:
    """Parse markdown table rows (skipping header separator)."""
    rows = []
    header_found = False
    for line in text.split("\n"):
        line = line.strip()
        if not line.startswith("|"):
            continue
        if "---" in line:
            header_found = True
            continue
        if not header_found:
            continue
        cols = [c.strip() for c in line.split("|")]
        cols = [c for c in cols if c != ""]
        if cols:
            rows.append(cols)
    return rows


def transform(input_path: str, output_path: str):
    print(f"Reading raw JSON from: {input_path}")
    with open(input_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    md = raw["markdown"]
    fetch_meta = raw.get("fetch_metadata", {})

    # ── Detect section boundaries ──────────────────────────────────────
    heading_positions = {
        "new_services_list": md.find("#### New Services Request List"),
        "stability_clusters": md.find("#### Stability Clusters"),
        "shared_pois": md.find("#### Shared POIs"),
        "cir_claims": md.find("#### CIR Claims From Deactivated Generators"),
        "cost_summary": md.find("#### Cost Summary"),
        "system_reinforcements": md.find("#### System Reinforcements"),
    }

    # Find start of cost allocation details section
    cost_alloc_start = md.find("# Cost Allocation details for")
    heading_positions["cost_allocations"] = cost_alloc_start

    print("Section positions:", {k: v for k, v in heading_positions.items() if v >= 0})

    # ── 1. Parse Project List ──────────────────────────────────────────
    proj_start = heading_positions["new_services_list"]
    proj_end = heading_positions.get("stability_clusters", heading_positions.get("shared_pois", heading_positions["cost_summary"]))
    proj_rows = parse_table_rows(md[proj_start:proj_end])

    projects_info = {}
    for row in proj_rows:
        if len(row) < 10:
            continue
        pid = row[0].strip()
        mfo = parse_float(row[5])
        mwe = parse_float(row[6])
        mwc = parse_float(row[7])
        projects_info[pid] = {
            "project_id": pid,
            "project_name": row[1].strip(),
            "state": row[2].strip(),
            "status": row[3].strip(),
            "transmission_owner": row[4].strip(),
            "mfo_mw": mfo,
            "mw_energy": mwe,
            "mw_capacity": mwc,
            "project_type": row[8].strip(),
            "resource_type": row[9].strip(),
            "costs": None,
            "network_upgrades": [],
            "cost_allocations": [],
        }
    print(f"Parsed {len(projects_info)} projects from project list")

    # ── 2. Parse Cost Summary ──────────────────────────────────────────
    cost_start = heading_positions["cost_summary"]
    cost_end = heading_positions["system_reinforcements"]
    cost_rows = parse_table_rows(md[cost_start:cost_end])

    for row in cost_rows:
        if len(row) < 7:
            continue
        pid = row[0].strip()
        costs = {
            "toif": parse_dollar(row[1]),
            "physical_interconnection": parse_dollar(row[2]),
            "system_reliability": parse_dollar(row[3]),
            "affected_system": parse_dollar(row[4]),
            "additional_charges": parse_dollar(row[5]),
            "total_cost": parse_dollar(row[6]),
        }
        if pid in projects_info:
            projects_info[pid]["costs"] = costs

    # ── 3. Parse Network Upgrades (System Reinforcements) ──────────────
    reinf_start = heading_positions["system_reinforcements"]
    reinf_end = cost_alloc_start if cost_alloc_start > 0 else len(md)
    reinf_rows = parse_table_rows(md[reinf_start:reinf_end])

    network_upgrades = []
    for row in reinf_rows:
        if len(row) < 6:
            continue
        # Clean HTML from cost field
        cost_raw = row[4]
        cost_clean = re.sub(r"<.*?>", "", cost_raw).strip()
        if "contingent" in cost_clean.lower():
            cost_val = None
            cost_note = "Contingent"
        else:
            cost_val = parse_dollar(cost_clean)
            cost_note = None

        allocated_projects = [p.strip() for p in row[5].split(",") if p.strip()]
        contingent_projects = [p.strip() for p in row[6].split(",") if p.strip()] if len(row) > 6 else []

        upgrade = {
            "transmission_owner": row[0].strip(),
            "rtep_id": row[1].strip(),
            "title": re.sub(r"<.*?>", "", row[2]).strip(),
            "time_estimate": row[3].strip(),
            "total_cost": cost_val,
            "cost_note": cost_note,
            "allocated_projects": allocated_projects,
            "contingent_projects": contingent_projects,
        }
        network_upgrades.append(upgrade)

        # Link upgrades back to projects
        for pid in allocated_projects + contingent_projects:
            pid = pid.strip()
            if pid in projects_info:
                projects_info[pid]["network_upgrades"].append({
                    "rtep_id": upgrade["rtep_id"],
                    "title": upgrade["title"],
                    "transmission_owner": upgrade["transmission_owner"],
                    "total_cost": upgrade["total_cost"],
                    "time_estimate": upgrade["time_estimate"],
                    "is_contingent": pid in contingent_projects,
                })

    print(f"Parsed {len(network_upgrades)} network upgrades")

    # ── 4. Parse Cost Allocations ──────────────────────────────────────
    if cost_alloc_start > 0:
        alloc_section = md[cost_alloc_start:]
        alloc_blocks = re.split(r"^# Cost Allocation details for ", alloc_section, flags=re.MULTILINE)
        alloc_blocks = [b for b in alloc_blocks if b.strip()]

        alloc_count = 0
        for block in alloc_blocks:
            # Extract upgrade ID from first line
            first_line = block.split("\n")[0].strip()
            upgrade_id = first_line.rstrip()

            # Parse the allocation table
            rows = parse_table_rows(block)
            for row in rows:
                if len(row) < 3:
                    continue
                pid = row[0].strip()
                pct_str = row[1].replace("%", "").strip()
                try:
                    pct = float(pct_str)
                except ValueError:
                    continue
                cost = parse_dollar(row[2])
                if pid in projects_info:
                    projects_info[pid]["cost_allocations"].append({
                        "network_upgrade": upgrade_id,
                        "percent_allocation": pct,
                        "allocated_cost": cost,
                    })
                    alloc_count += 1

        print(f"Parsed {alloc_count} cost allocation entries")

    # ── 5. Parse Shared POIs ───────────────────────────────────────────
    shared_pois = []
    if heading_positions["shared_pois"] >= 0:
        poi_start = heading_positions["shared_pois"]
        poi_end = heading_positions.get("cir_claims", heading_positions["cost_summary"])
        poi_rows = parse_table_rows(md[poi_start:poi_end])
        for row in poi_rows:
            if len(row) >= 2:
                shared_pois.append({
                    "poi_name": row[0].strip(),
                    "projects": [p.strip() for p in row[1].split(",") if p.strip()],
                })
    print(f"Parsed {len(shared_pois)} shared POIs")

    # ── 6. Compute Derived Metrics ─────────────────────────────────────
    for pid, proj in projects_info.items():
        costs = proj.get("costs")
        if not costs or not costs.get("total_cost"):
            proj["derived"] = None
            continue

        total = costs["total_cost"]
        derived = {}

        if proj["mfo_mw"] and proj["mfo_mw"] > 0:
            derived["dollar_per_kw_mfo"] = round(total / (proj["mfo_mw"] * 1000), 2)
        if proj["mw_energy"] and proj["mw_energy"] > 0:
            derived["dollar_per_kw_mwe"] = round(total / (proj["mw_energy"] * 1000), 2)
        if proj["mw_capacity"] and proj["mw_capacity"] > 0:
            derived["dollar_per_kw_mwc"] = round(total / (proj["mw_capacity"] * 1000), 2)
        if proj["mfo_mw"] and proj["mw_capacity"]:
            derived["capacity_to_mfo_ratio"] = round(proj["mw_capacity"] / proj["mfo_mw"], 4)

        proj["derived"] = derived

    # ── 7. Build Cluster Summary ───────────────────────────────────────
    all_projects = list(projects_info.values())
    total_mfo = sum(p["mfo_mw"] or 0 for p in all_projects)
    total_mwe = sum(p["mw_energy"] or 0 for p in all_projects)
    total_mwc = sum(p["mw_capacity"] or 0 for p in all_projects)
    total_cost = sum((p["costs"]["total_cost"] or 0) if p["costs"] else 0 for p in all_projects)
    projects_with_cost = sum(1 for p in all_projects if p["costs"] and p["costs"]["total_cost"] and p["costs"]["total_cost"] > 0)

    # Resource type breakdown
    resource_breakdown = {}
    for p in all_projects:
        rt = p["resource_type"]
        if rt not in resource_breakdown:
            resource_breakdown[rt] = {"count": 0, "mfo_mw": 0, "mwc_mw": 0, "total_cost": 0}
        resource_breakdown[rt]["count"] += 1
        resource_breakdown[rt]["mfo_mw"] += p["mfo_mw"] or 0
        resource_breakdown[rt]["mwc_mw"] += p["mw_capacity"] or 0
        resource_breakdown[rt]["total_cost"] += (p["costs"]["total_cost"] or 0) if p["costs"] else 0

    # State breakdown
    state_breakdown = {}
    for p in all_projects:
        st = p["state"]
        if st not in state_breakdown:
            state_breakdown[st] = {"count": 0, "mfo_mw": 0, "total_cost": 0}
        state_breakdown[st]["count"] += 1
        state_breakdown[st]["mfo_mw"] += p["mfo_mw"] or 0
        state_breakdown[st]["total_cost"] += (p["costs"]["total_cost"] or 0) if p["costs"] else 0

    # TO breakdown
    to_breakdown = {}
    for p in all_projects:
        to = p["transmission_owner"]
        if to not in to_breakdown:
            to_breakdown[to] = {"count": 0, "mfo_mw": 0, "total_cost": 0}
        to_breakdown[to]["count"] += 1
        to_breakdown[to]["mfo_mw"] += p["mfo_mw"] or 0
        to_breakdown[to]["total_cost"] += (p["costs"]["total_cost"] or 0) if p["costs"] else 0

    cluster_summary = {
        "total_projects": len(all_projects),
        "projects_with_nonzero_cost": projects_with_cost,
        "total_mfo_mw": round(total_mfo, 1),
        "total_mw_energy": round(total_mwe, 1),
        "total_mw_capacity": round(total_mwc, 1),
        "total_cost_usd": round(total_cost, 0),
        "cluster_dollar_per_kw": {
            "based_on_mfo": round(total_cost / (total_mfo * 1000), 2) if total_mfo > 0 else None,
            "based_on_mwe": round(total_cost / (total_mwe * 1000), 2) if total_mwe > 0 else None,
            "based_on_mwc": round(total_cost / (total_mwc * 1000), 2) if total_mwc > 0 else None,
        },
        "by_resource_type": resource_breakdown,
        "by_state": state_breakdown,
        "by_transmission_owner": to_breakdown,
    }

    # ── 8. Assemble Final Output ───────────────────────────────────────
    # Detect cycle/phase from document content
    cycle_match = re.search(r"Transition Cycle (\d+)", md)
    phase_match = re.search(r"Phase ([IVX]+|\d+)", md)
    version_match = re.search(r"v(\d+\.\d+) released (\d{4}-\d{2}-\d{2})", md)

    output = {
        "metadata": {
            "cycle": f"TC{cycle_match.group(1)}" if cycle_match else fetch_meta.get("cluster"),
            "phase": phase_match.group(1) if phase_match else fetch_meta.get("phase"),
            "study_type": "Phase I System Impact Study",
            "version": version_match.group(1) if version_match else None,
            "release_date": version_match.group(2) if version_match else None,
            "source": "PJM Interconnection Queue - Cluster Reports",
            "transformed_at": datetime.now().isoformat(),
        },
        "cluster_summary": cluster_summary,
        "projects": all_projects,
        "network_upgrades": network_upgrades,
        "shared_pois": shared_pois,
    }

    print(f"\nWriting structured JSON to: {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    file_size = os.path.getsize(output_path)
    print(f"Output file size: {file_size / 1024:.1f} KB")
    print(f"\nStructured JSON summary:")
    print(f"  Projects: {len(all_projects)}")
    print(f"  Network upgrades: {len(network_upgrades)}")
    print(f"  Shared POIs: {len(shared_pois)}")
    print(f"  Cluster total cost: ${total_cost:,.0f}")
    print(f"  Cluster $/kW (MFO): ${cluster_summary['cluster_dollar_per_kw']['based_on_mfo']}/kW")
    print(f"  Cluster $/kW (MWC): ${cluster_summary['cluster_dollar_per_kw']['based_on_mwc']}/kW")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_path = os.path.join(script_dir, "TC2 Phase 1", "TC2_PHASE_1_20260124_210151.json")
        output_path = os.path.join(script_dir, "TC2 Phase 1", "TC2_Phase1_structured.json")
    else:
        input_path = sys.argv[1]
        output_path = sys.argv[2]

    transform(input_path, output_path)
