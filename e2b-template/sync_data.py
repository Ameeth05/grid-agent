#!/usr/bin/env python3
"""
Sync Data Script for E2B Template

This script copies grid data files from the project's Data/ directory
into the e2b-template/system/ directory structure before building the E2B template.

Usage:
    python sync_data.py

Run this BEFORE building the E2B template with `e2b template build`.
"""

import shutil
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "Data"
SYSTEM_DATA_DIR = SCRIPT_DIR / "system" / "data"
SYSTEM_DOCS_DIR = SCRIPT_DIR / "system" / "docs"


def sync_data():
    """Sync data files from project Data/ to e2b-template/system/data/."""
    print("=" * 60)
    print("GridAgent E2B Template Data Sync")
    print("=" * 60)

    # Check source directory exists
    if not DATA_DIR.exists():
        print(f"ERROR: Data directory not found: {DATA_DIR}")
        return False

    # Create target directories
    SYSTEM_DATA_DIR.mkdir(parents=True, exist_ok=True)
    SYSTEM_DOCS_DIR.mkdir(parents=True, exist_ok=True)

    files_copied = 0

    # 1. Copy Interconnection Queue data
    queue_src = DATA_DIR / "Interconnection Queue"
    queue_dst = SYSTEM_DATA_DIR / "Interconnection Queue"
    if queue_src.exists():
        queue_dst.mkdir(parents=True, exist_ok=True)
        for f in queue_src.glob("*.csv"):
            dst = queue_dst / f.name
            shutil.copy2(f, dst)
            print(f"  [DATA] {f.name} -> system/data/Interconnection Queue/")
            files_copied += 1
    else:
        print(f"  [WARN] Interconnection Queue directory not found")

    # 2. Copy Cluster Results
    cluster_src = DATA_DIR / "Cluster Results"
    cluster_dst = SYSTEM_DATA_DIR / "Cluster Results"
    if cluster_src.exists():
        # Copy TC2 Phase 1 JSON files
        tc2_src = cluster_src / "TC2 Phase 1"
        tc2_dst = cluster_dst / "TC2 Phase 1"
        if tc2_src.exists():
            tc2_dst.mkdir(parents=True, exist_ok=True)
            for f in tc2_src.glob("*.json"):
                dst = tc2_dst / f.name
                shutil.copy2(f, dst)
                print(f"  [DATA] {f.name} -> system/data/Cluster Results/TC2 Phase 1/")
                files_copied += 1

        # Copy transform script (optional, for reference)
        transform_script = cluster_src / "transform_cluster_data.py"
        if transform_script.exists():
            dst = cluster_dst / transform_script.name
            cluster_dst.mkdir(parents=True, exist_ok=True)
            shutil.copy2(transform_script, dst)
            print(f"  [UTIL] {transform_script.name} -> system/data/Cluster Results/")
            files_copied += 1
    else:
        print(f"  [WARN] Cluster Results directory not found")

    # 3. Copy Interconnection Manual PDFs to docs
    manual_src = DATA_DIR / "Interconnection Manual"
    manual_dst = SYSTEM_DOCS_DIR / "Interconnection Manual"
    if manual_src.exists():
        for pdf_dir in manual_src.iterdir():
            if pdf_dir.is_dir():
                target_dir = manual_dst / pdf_dir.name
                target_dir.mkdir(parents=True, exist_ok=True)
                for pdf in pdf_dir.glob("*.pdf"):
                    dst = target_dir / pdf.name
                    shutil.copy2(pdf, dst)
                    print(f"  [DOCS] {pdf.name} -> system/docs/Interconnection Manual/{pdf_dir.name}/")
                    files_copied += 1
    else:
        print(f"  [WARN] Interconnection Manual directory not found")

    print()
    print(f"Sync complete: {files_copied} files copied")
    print()
    print("Next steps:")
    print("  1. cd e2b-template/")
    print("  2. e2b template build")
    print("  3. Verify template ID matches 'gridagent' in e2b.toml")
    print("=" * 60)

    return True


def clean():
    """Remove synced data files (for clean rebuild)."""
    print("Cleaning synced data files...")

    # Clean data directory (keep .gitkeep)
    for item in SYSTEM_DATA_DIR.iterdir():
        if item.name != ".gitkeep":
            if item.is_dir():
                shutil.rmtree(item)
                print(f"  Removed: system/data/{item.name}/")
            else:
                item.unlink()
                print(f"  Removed: system/data/{item.name}")

    # Clean docs directory (keep .gitkeep)
    for item in SYSTEM_DOCS_DIR.iterdir():
        if item.name != ".gitkeep":
            if item.is_dir():
                shutil.rmtree(item)
                print(f"  Removed: system/docs/{item.name}/")
            else:
                item.unlink()
                print(f"  Removed: system/docs/{item.name}")

    print("Clean complete.")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--clean":
        clean()
    else:
        sync_data()
