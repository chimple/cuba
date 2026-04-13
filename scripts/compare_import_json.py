import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path


DEFAULT_REFERENCE = Path("public/databases/import1.json")
DEFAULT_CANDIDATE = Path("public/databases/import.json")
DEFAULT_OUTPUT = Path("scripts/compare_import_json_report.txt")


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def normalize_value(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def normalize_row(row) -> str:
    return normalize_value(list(row))


def get_table_map(data: dict) -> dict:
    return {table["name"]: table for table in data.get("tables", [])}


def get_schema_columns(table: dict) -> list[str]:
    return [column["column"] for column in table.get("schema", []) if "column" in column]


def get_schema_definitions(table: dict) -> dict[str, str]:
    return {
        column["column"]: column.get("value", "")
        for column in table.get("schema", [])
        if "column" in column
    }


def get_primary_key_columns(table: dict) -> list[str]:
    schema = table.get("schema", [])
    pk_columns = []
    for column in schema:
        column_name = column.get("column")
        column_definition = str(column.get("value", "")).upper()
        if column_name and "PRIMARY KEY" in column_definition:
            pk_columns.append(column_name)

    if pk_columns:
        return pk_columns

    constraints = table.get("constraints", [])
    for constraint in constraints:
        value = str(constraint.get("value", ""))
        match = re.search(r"PRIMARY\s+KEY\s*\(([^)]+)\)", value, re.IGNORECASE)
        if not match:
            continue
        return [part.strip().strip('"').strip("`") for part in match.group(1).split(",")]

    return []


def format_key(key_columns: list[str], key_values: tuple[str, ...]) -> str:
    pairs = []
    for column, raw_value in zip(key_columns, key_values):
        pairs.append(f"{column}={json.loads(raw_value)!r}")
    return ", ".join(pairs)


def preview_items(items: list[str], limit: int) -> list[str]:
    if len(items) <= limit:
        return items
    remainder = len(items) - limit
    return items[:limit] + [f"... and {remainder} more"]


def pluralize(count: int, singular: str, plural: str | None = None) -> str:
    if count == 1:
        return singular
    return plural or f"{singular}s"


def get_row_length_mismatches(table: dict, limit: int) -> dict | None:
    expected_length = len(get_schema_columns(table))
    mismatches = []
    for row_number, row in enumerate(table.get("values", []), start=1):
        actual_length = len(row)
        if actual_length != expected_length:
            mismatches.append(f"row {row_number}: expected {expected_length}, found {actual_length}")

    if not mismatches:
        return None

    return {
        "count": len(mismatches),
        "expected_length": expected_length,
        "sample": preview_items(mismatches, limit),
    }


def build_keyed_rows(table: dict, key_columns: list[str]):
    columns = get_schema_columns(table)
    column_index = {column: index for index, column in enumerate(columns)}
    missing_key_columns = [column for column in key_columns if column not in column_index]
    if missing_key_columns:
        return None, [f"Missing primary-key columns in schema: {', '.join(missing_key_columns)}"]

    keyed_rows = {}
    issues = []
    for row_number, row in enumerate(table.get("values", []), start=1):
        key_parts = []
        try:
            for column in key_columns:
                key_parts.append(normalize_value(row[column_index[column]]))
        except IndexError:
            issues.append(f"Row {row_number} is shorter than schema while building keys")
            return None, issues

        key = tuple(key_parts)
        if key in keyed_rows:
            issues.append(f"Duplicate primary key at row {row_number}: {format_key(key_columns, key)}")
            return None, issues
        keyed_rows[key] = row

    return keyed_rows, issues


def compare_rows_without_keys(reference_table: dict, candidate_table: dict, limit: int) -> dict:
    reference_counter = Counter(normalize_row(row) for row in reference_table.get("values", []))
    candidate_counter = Counter(normalize_row(row) for row in candidate_table.get("values", []))

    missing_rows_counter = reference_counter - candidate_counter
    extra_rows_counter = candidate_counter - reference_counter

    missing_rows = [f"{count}x {row_text}" for row_text, count in missing_rows_counter.items()]
    extra_rows = [f"{count}x {row_text}" for row_text, count in extra_rows_counter.items()]

    return {
        "missing_rows": {
            "count": sum(missing_rows_counter.values()),
            "sample": preview_items(missing_rows, limit),
        }
        if missing_rows
        else None,
        "extra_rows": {
            "count": sum(extra_rows_counter.values()),
            "sample": preview_items(extra_rows, limit),
        }
        if extra_rows
        else None,
        "changed_rows": None,
        "reference_key_issues": [],
        "candidate_key_issues": [],
        "row_order_only": (
            not missing_rows
            and not extra_rows
            and reference_table.get("values", []) != candidate_table.get("values", [])
        ),
    }


def compare_rows_with_keys(reference_table: dict, candidate_table: dict, limit: int) -> dict:
    key_columns = get_primary_key_columns(reference_table)
    if not key_columns:
        return compare_rows_without_keys(reference_table, candidate_table, limit)

    reference_rows, reference_issues = build_keyed_rows(reference_table, key_columns)
    candidate_rows, candidate_issues = build_keyed_rows(candidate_table, key_columns)

    if reference_rows is None or candidate_rows is None:
        fallback_result = compare_rows_without_keys(reference_table, candidate_table, limit)
        fallback_result["reference_key_issues"] = reference_issues
        fallback_result["candidate_key_issues"] = candidate_issues
        return fallback_result

    reference_keys = set(reference_rows.keys())
    candidate_keys = set(candidate_rows.keys())

    missing_keys = sorted(reference_keys - candidate_keys)
    extra_keys = sorted(candidate_keys - reference_keys)

    missing_rows = [format_key(key_columns, key) for key in missing_keys]
    extra_rows = [format_key(key_columns, key) for key in extra_keys]

    columns = get_schema_columns(reference_table)
    changed_rows = []
    for key in sorted(reference_keys & candidate_keys):
        reference_row = list(reference_rows[key])
        candidate_row = list(candidate_rows[key])
        if reference_row == candidate_row:
            continue

        changed_columns = []
        for index, column in enumerate(columns):
            reference_value = reference_row[index] if index < len(reference_row) else "<missing>"
            candidate_value = candidate_row[index] if index < len(candidate_row) else "<missing>"
            if reference_value != candidate_value:
                changed_columns.append(
                    f"{column}: reference={reference_value!r}, candidate={candidate_value!r}"
                )
        changed_rows.append(f"{format_key(key_columns, key)} -> {', '.join(changed_columns)}")

    return {
        "missing_rows": {
            "count": len(missing_rows),
            "sample": preview_items(missing_rows, limit),
        }
        if missing_rows
        else None,
        "extra_rows": {
            "count": len(extra_rows),
            "sample": preview_items(extra_rows, limit),
        }
        if extra_rows
        else None,
        "changed_rows": {
            "count": len(changed_rows),
            "sample": preview_items(changed_rows, limit),
        }
        if changed_rows
        else None,
        "reference_key_issues": reference_issues,
        "candidate_key_issues": candidate_issues,
        "row_order_only": False,
    }


def compare_table(table_name: str, reference_table: dict, candidate_table: dict, limit: int) -> dict | None:
    entry = {
        "name": table_name,
        "schema_missing_columns": [],
        "schema_extra_columns": [],
        "column_definition_differences": [],
        "column_order_diff": False,
        "row_count": None,
        "reference_row_length_mismatches": get_row_length_mismatches(reference_table, limit),
        "candidate_row_length_mismatches": get_row_length_mismatches(candidate_table, limit),
        "missing_rows": None,
        "extra_rows": None,
        "changed_rows": None,
        "reference_key_issues": [],
        "candidate_key_issues": [],
        "row_order_only": False,
    }

    reference_columns = get_schema_columns(reference_table)
    candidate_columns = get_schema_columns(candidate_table)

    entry["schema_missing_columns"] = [
        column for column in reference_columns if column not in candidate_columns
    ]
    entry["schema_extra_columns"] = [
        column for column in candidate_columns if column not in reference_columns
    ]

    reference_definitions = get_schema_definitions(reference_table)
    candidate_definitions = get_schema_definitions(candidate_table)
    for column in reference_columns:
        if column not in candidate_definitions:
            continue
        if reference_definitions[column] != candidate_definitions[column]:
            entry["column_definition_differences"].append(
                f"{column}: reference={reference_definitions[column]!r}, "
                f"candidate={candidate_definitions[column]!r}"
            )

    shared_columns = [column for column in reference_columns if column in candidate_columns]
    reference_order = [column for column in reference_columns if column in shared_columns]
    candidate_order = [column for column in candidate_columns if column in shared_columns]
    entry["column_order_diff"] = reference_order != candidate_order

    reference_count = len(reference_table.get("values", []))
    candidate_count = len(candidate_table.get("values", []))
    if reference_count != candidate_count:
        entry["row_count"] = {
            "reference": reference_count,
            "candidate": candidate_count,
            "delta": candidate_count - reference_count,
        }

    row_comparison = compare_rows_with_keys(reference_table, candidate_table, limit)
    entry["missing_rows"] = row_comparison["missing_rows"]
    entry["extra_rows"] = row_comparison["extra_rows"]
    entry["changed_rows"] = row_comparison["changed_rows"]
    entry["reference_key_issues"] = row_comparison["reference_key_issues"]
    entry["candidate_key_issues"] = row_comparison["candidate_key_issues"]
    entry["row_order_only"] = row_comparison["row_order_only"]

    has_changes = any(
        [
            entry["schema_missing_columns"],
            entry["schema_extra_columns"],
            entry["column_definition_differences"],
            entry["column_order_diff"],
            entry["row_count"],
            entry["reference_row_length_mismatches"],
            entry["candidate_row_length_mismatches"],
            entry["missing_rows"],
            entry["extra_rows"],
            entry["changed_rows"],
            entry["reference_key_issues"],
            entry["candidate_key_issues"],
            entry["row_order_only"],
        ]
    )

    return entry if has_changes else None


def build_report(reference: dict, candidate: dict, limit: int) -> dict:
    reference_tables = get_table_map(reference)
    candidate_tables = get_table_map(candidate)

    top_level_differences = []
    keys = sorted(set(reference.keys()) | set(candidate.keys()))
    for key in keys:
        if key == "tables":
            continue
        reference_value = reference.get(key)
        candidate_value = candidate.get(key)
        if reference_value != candidate_value:
            top_level_differences.append(
                {
                    "field": key,
                    "reference": reference_value,
                    "candidate": candidate_value,
                }
            )

    missing_tables = sorted(set(reference_tables) - set(candidate_tables))
    extra_tables = sorted(set(candidate_tables) - set(reference_tables))

    table_reports = []
    for table_name in sorted(set(reference_tables) & set(candidate_tables)):
        report_entry = compare_table(
            table_name,
            reference_tables[table_name],
            candidate_tables[table_name],
            limit,
        )
        if report_entry:
            table_reports.append(report_entry)

    return {
        "reference_path": None,
        "candidate_path": None,
        "top_level_differences": top_level_differences,
        "missing_tables": missing_tables,
        "extra_tables": extra_tables,
        "tables": table_reports,
    }


def table_priority(entry: dict) -> tuple:
    return (
        0 if entry["candidate_row_length_mismatches"] else 1,
        0 if entry["schema_missing_columns"] or entry["schema_extra_columns"] else 1,
        0 if entry["column_definition_differences"] else 1,
        -(entry["changed_rows"]["count"] if entry["changed_rows"] else 0),
        -(entry["extra_rows"]["count"] if entry["extra_rows"] else 0),
        -(entry["missing_rows"]["count"] if entry["missing_rows"] else 0),
        entry["name"],
    )


def build_summary(report: dict) -> list[str]:
    tables = report["tables"]
    summary = [
        f"Top-level differences: {len(report['top_level_differences'])}",
        f"Missing tables in candidate: {len(report['missing_tables'])}",
        f"Extra tables in candidate: {len(report['extra_tables'])}",
        f"Tables with schema differences: "
        f"{sum(1 for table in tables if table['schema_missing_columns'] or table['schema_extra_columns'] or table['column_definition_differences'] or table['column_order_diff'])}",
        f"Tables with row count differences: {sum(1 for table in tables if table['row_count'])}",
        f"Tables with row length issues: "
        f"{sum(1 for table in tables if table['reference_row_length_mismatches'] or table['candidate_row_length_mismatches'])}",
        f"Tables with missing rows: {sum(1 for table in tables if table['missing_rows'])}",
        f"Tables with extra rows: {sum(1 for table in tables if table['extra_rows'])}",
        f"Tables with changed rows: {sum(1 for table in tables if table['changed_rows'])}",
    ]
    return summary


def build_highlights(report: dict) -> list[str]:
    highlights = []

    for difference in report["top_level_differences"]:
        highlights.append(
            f"Top-level field '{difference['field']}' differs: "
            f"{difference['reference']!r} -> {difference['candidate']!r}"
        )

    for table_name in report["extra_tables"]:
        highlights.append(f"Extra table present only in candidate: {table_name}")

    for table in sorted(report["tables"], key=table_priority):
        if table["candidate_row_length_mismatches"]:
            mismatch = table["candidate_row_length_mismatches"]
            highlights.append(
                f"[{table['name']}] Candidate has {mismatch['count']} "
                f"{pluralize(mismatch['count'], 'row')} with length mismatch "
                f"(expected {mismatch['expected_length']} values)."
            )
        elif table["schema_missing_columns"] or table["schema_extra_columns"]:
            highlights.append(
                f"[{table['name']}] Schema differs. Missing columns: "
                f"{len(table['schema_missing_columns'])}, extra columns: {len(table['schema_extra_columns'])}."
            )
        elif table["row_count"]:
            row_count = table["row_count"]
            highlights.append(
                f"[{table['name']}] Row count changed from {row_count['reference']} "
                f"to {row_count['candidate']} ({row_count['delta']:+d})."
            )

        if len(highlights) >= 8:
            break

    return highlights


def append_sample_block(lines: list[str], title: str, sample_items: list[str]) -> None:
    if not sample_items:
        return
    lines.append(f"  {title}:")
    for item in sample_items:
        lines.append(f"    - {item}")


def render_table_details(table: dict) -> list[str]:
    lines = [f"[{table['name']}]"]

    if table["schema_missing_columns"]:
        lines.append(
            f"  Missing columns in candidate ({len(table['schema_missing_columns'])}): "
            f"{', '.join(table['schema_missing_columns'])}"
        )
    if table["schema_extra_columns"]:
        lines.append(
            f"  Extra columns in candidate ({len(table['schema_extra_columns'])}): "
            f"{', '.join(table['schema_extra_columns'])}"
        )
    if table["column_definition_differences"]:
        lines.append(
            f"  Column definition differences: {len(table['column_definition_differences'])}"
        )
        append_sample_block(
            lines,
            "Sample definition differences",
            table["column_definition_differences"],
        )
    if table["column_order_diff"]:
        lines.append("  Shared column order differs between files")

    if table["row_count"]:
        row_count = table["row_count"]
        lines.append(
            f"  Row count: reference={row_count['reference']}, "
            f"candidate={row_count['candidate']} ({row_count['delta']:+d})"
        )

    if table["reference_row_length_mismatches"]:
        mismatch = table["reference_row_length_mismatches"]
        lines.append(
            f"  Reference row length mismatches: {mismatch['count']} "
            f"{pluralize(mismatch['count'], 'row')} (expected {mismatch['expected_length']} values)"
        )
        append_sample_block(lines, "Sample reference row length issues", mismatch["sample"])

    if table["candidate_row_length_mismatches"]:
        mismatch = table["candidate_row_length_mismatches"]
        lines.append(
            f"  Candidate row length mismatches: {mismatch['count']} "
            f"{pluralize(mismatch['count'], 'row')} (expected {mismatch['expected_length']} values)"
        )
        append_sample_block(lines, "Sample candidate row length issues", mismatch["sample"])

    if table["reference_key_issues"]:
        lines.append(f"  Reference key issues: {len(table['reference_key_issues'])}")
        append_sample_block(lines, "Reference key issue samples", table["reference_key_issues"])

    if table["candidate_key_issues"]:
        lines.append(f"  Candidate key issues: {len(table['candidate_key_issues'])}")
        append_sample_block(lines, "Candidate key issue samples", table["candidate_key_issues"])

    if table["missing_rows"]:
        lines.append(
            f"  Missing rows in candidate: {table['missing_rows']['count']} "
            f"{pluralize(table['missing_rows']['count'], 'row')}"
        )
        append_sample_block(lines, "Sample missing rows", table["missing_rows"]["sample"])

    if table["extra_rows"]:
        lines.append(
            f"  Extra rows in candidate: {table['extra_rows']['count']} "
            f"{pluralize(table['extra_rows']['count'], 'row')}"
        )
        append_sample_block(lines, "Sample extra rows", table["extra_rows"]["sample"])

    if table["changed_rows"]:
        lines.append(
            f"  Changed rows: {table['changed_rows']['count']} "
            f"{pluralize(table['changed_rows']['count'], 'row')}"
        )
        append_sample_block(lines, "Sample changed rows", table["changed_rows"]["sample"])

    if table["row_order_only"]:
        lines.append("  Row ordering differs, but row contents match as a multiset")

    return lines


def render_report(report: dict) -> str:
    lines = [
        "Comparison Report",
        "=================",
        f"Reference: {report['reference_path']}",
        f"Candidate: {report['candidate_path']}",
        "",
        "Summary",
        "-------",
    ]

    for item in build_summary(report):
        lines.append(f"- {item}")

    highlights = build_highlights(report)
    if highlights:
        lines.extend(["", "Highlights", "----------"])
        for item in highlights:
            lines.append(f"- {item}")

    if report["top_level_differences"]:
        lines.extend(["", "Top-Level Differences", "---------------------"])
        for difference in report["top_level_differences"]:
            lines.append(
                f"- {difference['field']}: reference={difference['reference']!r}, "
                f"candidate={difference['candidate']!r}"
            )

    if report["missing_tables"] or report["extra_tables"]:
        lines.extend(["", "Table Presence", "--------------"])
        if report["missing_tables"]:
            lines.append(
                f"- Missing tables in candidate ({len(report['missing_tables'])}): "
                f"{', '.join(report['missing_tables'])}"
            )
        if report["extra_tables"]:
            lines.append(
                f"- Extra tables in candidate ({len(report['extra_tables'])}): "
                f"{', '.join(report['extra_tables'])}"
            )

    if report["tables"]:
        lines.extend(["", "Per-Table Details", "-----------------"])
        for table in sorted(report["tables"], key=table_priority):
            lines.extend(render_table_details(table))
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Compare two import JSON files and produce a grouped report for metadata, "
            "schema, row counts, and value differences."
        )
    )
    parser.add_argument(
        "reference",
        nargs="?",
        default=str(DEFAULT_REFERENCE),
        help=f"Reference JSON file. Defaults to {DEFAULT_REFERENCE}",
    )
    parser.add_argument(
        "candidate",
        nargs="?",
        default=str(DEFAULT_CANDIDATE),
        help=f"Candidate JSON file. Defaults to {DEFAULT_CANDIDATE}",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of sample items to print in each detail block",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help=(
            "Optional path to write the generated report to a file. "
            f"If omitted, the report is written to {DEFAULT_OUTPUT}"
        ),
    )
    return parser


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    parser = build_parser()
    args = parser.parse_args()

    reference_path = Path(args.reference)
    candidate_path = Path(args.candidate)

    if not reference_path.exists():
        print(f"Reference file not found: {reference_path}")
        return 2
    if not candidate_path.exists():
        print(f"Candidate file not found: {candidate_path}")
        return 2

    reference = load_json(reference_path)
    candidate = load_json(candidate_path)

    report = build_report(reference, candidate, max(args.limit, 1))
    report["reference_path"] = str(reference_path)
    report["candidate_path"] = str(candidate_path)

    rendered_report = render_report(report)
    output_path = args.output or DEFAULT_OUTPUT

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(rendered_report, encoding="utf-8")

    print(rendered_report, end="")
    print(f"\nReport saved to: {output_path}")

    has_differences = any(
        [
            report["top_level_differences"],
            report["missing_tables"],
            report["extra_tables"],
            report["tables"],
        ]
    )
    return 1 if has_differences else 0


if __name__ == "__main__":
    sys.exit(main())
