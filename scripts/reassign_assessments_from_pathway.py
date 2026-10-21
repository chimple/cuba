#!/usr/bin/env python3
"""Reassign assessment pathways by inspecting user.learning_path.

Dry run by default. Use --execute to create assignment + assignment_user rows
and update user.learning_path with assigned assessment nodes.

Default input is C:/home/school.xlsx. The file must contain exactly one unique
school_id value. Output reports are always written inside scripts/data.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
import re
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

DEFAULT_MAX_ASSESSMENTS = 5
DEFAULT_SCHOOL_FILE = "C:/home/school.xlsx"
DEFAULT_SERVICE_ACCOUNT_FILE = "serviceAccountKeySupabaseTest.json"
DEFAULT_SOURCE = "bulk_assessment_reassignment"
ASSESSMENT_TYPE = "assessment"
STUDENT_ROLE = "student"
PAGE_SIZE = 1000
APP_OUTPUT_DIR = Path("scripts/data")

SUPABASE_URL = ""
SUPABASE_KEY = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reassign assessment pathways from user.learning_path.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--school-id", dest="school_ids", action="append", help="One school id to target.")
    target.add_argument("--school-ids", dest="school_ids_csv", help="Backward-compatible alias. Must contain exactly one id.")
    target.add_argument("--school-file", help="Excel/CSV file with a school_id column. Default: C:/home/school.xlsx.")
    target.add_argument("--class-ids", help="Comma-separated class ids. They must belong to one school.")

    parser.add_argument("--school-id-column", default="school_id", help="Column name in --school-file. Default: school_id.")
    parser.add_argument("--service-account-file", help="JSON auth file with S_URL and S_KEY. Default: serviceAccountKeySupabaseTest.json if found.")
    parser.add_argument("--execute", action="store_true", help="Write changes. Without this, only prints a dry run.")
    parser.add_argument("--assessment-count", type=positive_int, default=DEFAULT_MAX_ASSESSMENTS, help="Assessment lessons to queue per student/course. Default: 5.")
    parser.add_argument("--set-number", type=positive_int, help="Force a specific subject_lesson set_number.")
    parser.add_argument("--random-set", action="store_true", help="Randomly choose from eligible assessment sets instead of lowest set.")
    parser.add_argument("--created-by", help="Optional assignment.created_by value.")
    parser.add_argument("--source", default=DEFAULT_SOURCE, help="assignment.source value.")
    parser.add_argument("--output", help="Output report filename. Always written inside scripts/data.")
    parser.add_argument("--no-pathway-update", action="store_true", help="Create assignments but do not update user.learning_path.")
    parser.add_argument("--ignore-existing", action="store_true", help="Do not skip existing active assignment batches in assignment tables.")

    args = parser.parse_args()
    if not args.school_ids and not args.school_ids_csv and not args.school_file and not args.class_ids:
        args.school_file = DEFAULT_SCHOOL_FILE

    if args.school_ids:
        args.school_ids = split_ids(",".join(args.school_ids))
    elif args.school_ids_csv:
        args.school_ids = split_ids(args.school_ids_csv)
    else:
        args.school_ids = []

    if args.school_ids and len(args.school_ids) != 1:
        raise SystemExit("Only one school id is allowed per run.")

    args.class_ids = split_ids(args.class_ids or "")
    args.update_pathway = not args.no_pathway_update
    return args


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


def split_ids(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def load_dotenv_files() -> None:
    for filename in (".env.local", ".env"):
        path = Path(filename)
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def candidate_auth_paths(file_path: str | None) -> list[Path]:
    if file_path:
        return [resolve_input_path(file_path)]

    script_dir = Path(__file__).resolve().parent
    return [
        Path(DEFAULT_SERVICE_ACCOUNT_FILE),
        script_dir / DEFAULT_SERVICE_ACCOUNT_FILE,
        script_dir.parent / "update_result" / DEFAULT_SERVICE_ACCOUNT_FILE,
        Path("/mnt/data/Scripts/update_result") / DEFAULT_SERVICE_ACCOUNT_FILE,
    ]


def load_service_account_file(file_path: str | None) -> dict[str, str]:
    for candidate in candidate_auth_paths(file_path):
        if not candidate.exists():
            continue
        with candidate.open("r", encoding="utf-8") as file:
            data = json.load(file)
        url = data.get("S_URL") or data.get("SUPABASE_URL") or data.get("VITE_SUPABASE_URL") or ""
        key = data.get("S_KEY") or data.get("SUPABASE_SERVICE_ROLE_KEY") or data.get("SUPABASE_ANON_KEY") or data.get("VITE_SUPABASE_ANON_KEY") or ""
        if not url or not key:
            raise SystemExit(f"Auth file {candidate} must contain S_URL and S_KEY.")
        return {"url": str(url), "key": str(key), "path": str(candidate)}

    if file_path:
        raise SystemExit(f"Auth file not found: {file_path}")
    return {}


def init_supabase_env(service_account_file: str | None = None) -> None:
    global SUPABASE_URL, SUPABASE_KEY
    load_dotenv_files()
    auth_file = load_service_account_file(service_account_file)
    SUPABASE_URL = (auth_file.get("url") or os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "").rstrip("/")
    SUPABASE_KEY = auth_file.get("key") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY") or ""
    if not SUPABASE_URL:
        raise SystemExit("Missing Supabase URL. Provide S_URL in serviceAccountKeySupabaseTest.json or set SUPABASE_URL/VITE_SUPABASE_URL.")
    if not SUPABASE_KEY:
        raise SystemExit("Missing Supabase key. Provide S_KEY in serviceAccountKeySupabaseTest.json or set SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.")
    if auth_file.get("path"):
        print("Using Supabase auth file: " + auth_file["path"])


def supabase_request(method: str, table: str, params: list[tuple[str, str]] | None = None, body: Any = None, prefer: str | None = None) -> Any:
    query = urlencode(params or [], doseq=True, safe=",().:*!")
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if query:
        url += "?" + query

    data = None
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if prefer:
        headers["Prefer"] = prefer

    request = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=90) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{table} {method} failed: HTTP {error.code}: {details}") from error


def fetch_all(table: str, select: str, filters: list[tuple[str, str]] | None = None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        params = [("select", select), *(filters or []), ("limit", str(PAGE_SIZE)), ("offset", str(offset))]
        data = supabase_request("GET", table, params=params) or []
        rows.extend(data)
        if len(data) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def fetch_in_chunks(table: str, select: str, column: str, values: list[str], filters: list[tuple[str, str]] | None = None) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    unique_values = list(dict.fromkeys([value for value in values if value]))
    for i in range(0, len(unique_values), 100):
        chunk = unique_values[i:i + 100]
        in_value = "in.(" + ",".join(chunk) + ")"
        output.extend(fetch_all(table, select, [(column, in_value), *(filters or [])]))
    return output


def resolve_input_path(file_path: str) -> Path:
    path = Path(file_path)
    if path.exists():
        return path
    match = re.match(r"^([a-zA-Z]):[\\/](.*)$", file_path)
    if match:
        drive = match.group(1).lower()
        rest = [part for part in re.split(r"[\\/]+", match.group(2)) if part]
        wsl_path = Path("/mnt") / drive / Path(*rest)
        if wsl_path.exists():
            return wsl_path
    return path


def normalize_header(value: Any) -> str:
    return re.sub(r"[\s_-]+", "", str(value or "").strip().lower())


def read_school_ids_from_file(file_path: str, school_id_column: str) -> list[str]:
    resolved = resolve_input_path(file_path)
    if not resolved.exists():
        raise SystemExit(f"School file not found: {file_path}")
    suffix = resolved.suffix.lower()
    if suffix == ".csv":
        rows = read_csv_rows(resolved)
    elif suffix == ".xlsx":
        rows = read_xlsx_first_sheet(resolved)
    else:
        raise SystemExit("School file must be .xlsx or .csv. Use .xlsx instead of .xls for the Python script.")

    if not rows:
        raise SystemExit(f"No rows found in {resolved}.")

    wanted = normalize_header(school_id_column)
    headers = list(rows[0].keys())
    actual = next((header for header in headers if normalize_header(header) == wanted), None)
    if not actual:
        raise SystemExit(f"Column {school_id_column} not found in {resolved}. Available columns: {', '.join(headers)}")

    school_ids = sorted({str(row.get(actual) or "").strip() for row in rows if str(row.get(actual) or "").strip()})
    if not school_ids:
        raise SystemExit(f"No school ids found in column {actual}.")
    if len(school_ids) != 1:
        raise SystemExit("Source sheet error: " + str(resolved) + " has " + str(len(school_ids)) + " unique school_id values. Keep only one school per file/run. Found: " + ", ".join(school_ids))
    return school_ids


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def read_xlsx_first_sheet(path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet_name = first_sheet_path(archive)
        root = ET.fromstring(archive.read(sheet_name))

    rows: list[list[str]] = []
    for row in root.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
        values: list[str] = []
        for cell in row.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
            ref = cell.attrib.get("r", "A1")
            col_index = column_ref_to_index(re.sub(r"\d", "", ref))
            while len(values) < col_index:
                values.append("")
            values.append(read_xlsx_cell(cell, shared_strings))
        rows.append(values)

    rows = [row for row in rows if any(str(value).strip() for value in row)]
    if not rows:
        return []
    headers = [str(value).strip() for value in rows[0]]
    output: list[dict[str, str]] = []
    for row in rows[1:]:
        item = {header: row[index] if index < len(row) else "" for index, header in enumerate(headers) if header}
        if any(str(value).strip() for value in item.values()):
            output.append(item)
    return output


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
        text_parts = [node.text or "" for node in item.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")]
        strings.append("".join(text_parts))
    return strings


def first_sheet_path(archive: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheet = workbook.find(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet")
    if sheet is None:
        raise SystemExit("No worksheet found in Excel file.")
    rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall("{http://schemas.openxmlformats.org/package/2006/relationships}Relationship"):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib.get("Target", "worksheets/sheet1.xml")
            return "xl/" + target.lstrip("/")
    return "xl/worksheets/sheet1.xml"


def read_xlsx_cell(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        text = cell.find(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
        return text.text if text is not None and text.text is not None else ""
    value = cell.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
    raw = value.text if value is not None and value.text is not None else ""
    if cell_type == "s" and raw:
        index = int(raw)
        return shared_strings[index] if index < len(shared_strings) else ""
    return raw


def column_ref_to_index(ref: str) -> int:
    total = 0
    for char in ref.upper():
        total = total * 26 + (ord(char) - ord("A") + 1)
    return max(total, 1)


def get_target_classes(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.class_ids:
        return fetch_in_chunks("class", "id,school_id,name,status", "id", args.class_ids, [("is_deleted", "eq.false")])
    return fetch_in_chunks("class", "id,school_id,name,status", "school_id", args.school_ids, [("is_deleted", "eq.false")])


def get_courses_for_class(class_id: str) -> list[dict[str, Any]]:
    links = fetch_all("class_course", "course_id", [("class_id", f"eq.{class_id}"), ("is_deleted", "eq.false")])
    course_ids = list(dict.fromkeys([row.get("course_id") for row in links if row.get("course_id")]))
    if not course_ids:
        return []
    courses = fetch_in_chunks("course", "id,code,name,subject_id,framework_id,sort_index", "id", course_ids, [("is_deleted", "eq.false")])
    return sorted(courses, key=lambda row: row.get("sort_index") or 0)


def get_students_for_class(class_id: str) -> list[dict[str, Any]]:
    links = fetch_all("class_user", "user_id", [("class_id", f"eq.{class_id}"), ("role", f"eq.{STUDENT_ROLE}"), ("is_deleted", "eq.false")])
    user_ids = list(dict.fromkeys([row.get("user_id") for row in links if row.get("user_id")]))
    if not user_ids:
        return []
    return fetch_in_chunks("user", "id,learning_path,language_id,locale_id", "id", user_ids, [("is_deleted", "eq.false")])


def get_languages_by_code() -> dict[str, str]:
    rows = fetch_all("language", "id,code", [("is_deleted", "eq.false")])
    return {str(row.get("code") or "").strip().lower(): row["id"] for row in rows if row.get("code") and row.get("id")}


SUBJECT_LESSON_CACHE: dict[str, list[dict[str, Any]]] = {}


def get_subject_lesson_rows(subject_id: str | None) -> list[dict[str, Any]]:
    if not subject_id:
        return []
    if subject_id in SUBJECT_LESSON_CACHE:
        return SUBJECT_LESSON_CACHE[subject_id]
    rows = fetch_all(
        "subject_lesson",
        "id,lesson_id,subject_id,set_number,language_id,locale_id,sort_index",
        [("subject_id", f"eq.{subject_id}"), ("is_deleted", "eq.false"), ("set_number", "not.is.null")],
    )
    SUBJECT_LESSON_CACHE[subject_id] = rows
    return rows


def effective_language_id(course: dict[str, Any], student: dict[str, Any], languages_by_code: dict[str, str]) -> str | None:
    code = str(course.get("code") or "").strip().lower()
    language_code = None
    if code in ("math", "maths"):
        language_code = "en"
    elif "-" in code:
        language_code = code.split("-")[-1]
    elif code:
        language_code = code
    return languages_by_code.get(language_code or "") or student.get("language_id")


def locale_matches(row: dict[str, Any], locale_id: str | None) -> bool:
    if not locale_id:
        return row.get("locale_id") is None
    return row.get("locale_id") in (locale_id, None)


def choose_assessment_rows(rows: list[dict[str, Any]], lang_id: str | None, locale_id: str | None, args: argparse.Namespace) -> list[dict[str, Any]]:
    set_numbers = sorted({row.get("set_number") for row in rows if row.get("set_number") is not None})
    if not set_numbers:
        return []

    preferred_sets = sorted({row.get("set_number") for row in rows if lang_id and row.get("language_id") == lang_id and locale_matches(row, locale_id) and row.get("set_number") is not None})
    candidate_sets = preferred_sets or set_numbers

    set_number = args.set_number
    if set_number is not None and set_number not in set_numbers:
        return []
    if set_number is None:
        set_number = random.choice(candidate_sets) if args.random_set else candidate_sets[0]

    strict_language = bool(lang_id and set_number in preferred_sets)
    track_rows = [row for row in rows if row.get("set_number") == set_number]
    if strict_language:
        track_rows = [row for row in track_rows if row.get("language_id") == lang_id and locale_matches(row, locale_id)]
    elif locale_id:
        track_rows = [row for row in track_rows if row.get("language_id") is None and locale_matches(row, locale_id)]
    else:
        track_rows = [row for row in track_rows if row.get("language_id") is None and row.get("locale_id") is None]

    return sorted(track_rows, key=lambda row: row.get("sort_index") or 0)[:args.assessment_count]


def parse_learning_path(value: Any, student_id: str) -> dict[str, Any] | None:
    if not value:
        return None
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid learning_path JSON for student {student_id}: {error}") from error


def get_course_path_array(learning_path: dict[str, Any] | None, course_id: str) -> list[dict[str, Any]]:
    if not learning_path:
        return []
    courses = learning_path.get("courses")
    if isinstance(courses, dict) and isinstance(courses.get("courseList"), list):
        for course_path in courses["courseList"]:
            if not isinstance(course_path, dict):
                continue
            nested_course = course_path.get("course") if isinstance(course_path.get("course"), dict) else {}
            if course_path.get("course_id") == course_id or course_path.get("id") == course_id or nested_course.get("id") == course_id:
                return course_path.get("path") if isinstance(course_path.get("path"), list) else []
        return []
    if isinstance(learning_path.get(course_id), list):
        return learning_path[course_id]
    if isinstance(courses, dict) and isinstance(courses.get(course_id), list):
        return courses[course_id]
    return []


def describe_queued_lessons(learning_path: dict[str, Any] | None, course_id: str) -> str:
    parts: list[str] = []
    for node in get_course_path_array(learning_path, course_id):
        if not isinstance(node, dict):
            parts.append("null")
            continue
        lesson_id = node.get("lesson_id") or node.get("id") or ""
        parts.append(f"{lesson_id}:assessment={node.get('is_assessment') is True}:played={node.get('isPlayed') is True}")
    return "|".join([part for part in parts if part])


def find_queued_assessment(learning_path: dict[str, Any] | None, course_id: str, assessment_lesson_ids: set[str]) -> dict[str, Any]:
    for node in get_course_path_array(learning_path, course_id):
        if not isinstance(node, dict) or node.get("isPlayed") is True:
            continue
        lesson_id = node.get("lesson_id") or node.get("id")
        if node.get("is_assessment") is True:
            return {"matched": True, "reason": "pathway_has_unplayed_assessment_node", "lesson_id": lesson_id or ""}
        if lesson_id and lesson_id in assessment_lesson_ids:
            return {"matched": True, "reason": "pathway_has_assessment_lesson_id", "lesson_id": lesson_id}
    return {"matched": False, "reason": "", "lesson_id": ""}


def build_updated_learning_path(existing: dict[str, Any] | None, course: dict[str, Any], assignment_rows: list[dict[str, Any]]) -> str:
    learning_path = json.loads(json.dumps(existing)) if isinstance(existing, dict) else {"courses": {"currentCourseIndex": 0, "courseList": []}, "type": "chapter"}
    if not isinstance(learning_path.get("courses"), dict) or isinstance(learning_path.get("courses"), list):
        learning_path["courses"] = {"currentCourseIndex": 0, "courseList": []}
    courses = learning_path["courses"]
    if not isinstance(courses.get("courseList"), list):
        courses["courseList"] = []
    if not isinstance(courses.get("currentCourseIndex"), int):
        courses["currentCourseIndex"] = 0

    entry = next((item for item in courses["courseList"] if isinstance(item, dict) and item.get("course_id") == course["id"]), None)
    if entry is None:
        entry = {
            "path_id": str(uuid.uuid4()),
            "course_id": course["id"],
            "subject_id": course.get("subject_id"),
            "type": "chapter",
            "path": [],
            "completedPath": 0,
        }
        courses["courseList"].append(entry)

    entry["path_id"] = entry.get("path_id") or str(uuid.uuid4())
    entry["course_id"] = course["id"]
    entry["subject_id"] = entry.get("subject_id") or course.get("subject_id")
    entry["type"] = entry.get("type") or "chapter"
    if not isinstance(entry.get("completedPath"), int):
        entry["completedPath"] = 0
    entry["path"] = [
        {
            "lesson_id": assignment["lesson_id"],
            "assignment_id": assignment["id"],
            "source": "initial_assessment",
            "is_assessment": True,
            "isPlayed": False,
        }
        for assignment in assignment_rows
    ]
    learning_path["type"] = learning_path.get("type") or "chapter"
    return json.dumps(learning_path, separators=(",", ":"))


def has_existing_active_assessment(student_id: str, class_id: str, course_id: str, now_iso: str) -> bool:
    rows = fetch_all(
        "assignment",
        "id,batch_id,lesson_id,is_class_wise,starts_at,ends_at,assignment_user:assignment_user!left(user_id,is_deleted)",
        [
            ("class_id", f"eq.{class_id}"),
            ("course_id", f"eq.{course_id}"),
            ("type", f"eq.{ASSESSMENT_TYPE}"),
            ("is_deleted", "eq.false"),
            ("batch_id", "not.is.null"),
            ("or", f"starts_at.is.null,starts_at.lte.{now_iso}"),
            ("or", f"ends_at.is.null,ends_at.gt.{now_iso}"),
        ],
    )
    for assignment in rows:
        if assignment.get("is_class_wise") is True:
            return True
        for link in assignment.get("assignment_user") or []:
            if link.get("user_id") == student_id and link.get("is_deleted") is not True:
                return True
    return False


def create_assignments_for_student_course(args: argparse.Namespace, class_row: dict[str, Any], student: dict[str, Any], course: dict[str, Any], assessment_rows: list[dict[str, Any]], now_iso: str) -> dict[str, Any]:
    batch_id = str(uuid.uuid4())
    assignment_rows = [
        {
            "id": str(uuid.uuid4()),
            "batch_id": batch_id,
            "class_id": class_row["id"],
            "school_id": class_row["school_id"],
            "course_id": course["id"],
            "lesson_id": assessment["lesson_id"],
            "set_number": assessment.get("set_number"),
            "type": ASSESSMENT_TYPE,
            "source": args.source,
            "starts_at": now_iso,
            "ends_at": None,
            "created_by": args.created_by,
            "is_class_wise": False,
            "is_deleted": False,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        for assessment in assessment_rows
    ]
    assignment_user_rows = [
        {
            "id": str(uuid.uuid4()),
            "assignment_id": assignment["id"],
            "user_id": student["id"],
            "is_deleted": False,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        for assignment in assignment_rows
    ]

    inserted_assignments = supabase_request(
        "POST",
        "assignment",
        params=[("select", "id,lesson_id,set_number")],
        body=assignment_rows,
        prefer="return=representation",
    ) or assignment_rows
    supabase_request("POST", "assignment_user", body=assignment_user_rows, prefer="return=minimal")

    if args.update_pathway:
        parsed_path = parse_learning_path(student.get("learning_path"), student["id"])
        updated_path = build_updated_learning_path(parsed_path, course, inserted_assignments)
        supabase_request(
            "PATCH",
            "user",
            params=[("id", f"eq.{student['id']}")],
            body={"learning_path": updated_path, "updated_at": now_iso},
            prefer="return=minimal",
        )
        student["learning_path"] = updated_path

    return {"batch_id": batch_id, "assignment_rows": inserted_assignments}


def create_report_row(base: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    row = {
        "run_mode": "",
        "action": "",
        "reason": "",
        "school_id": "",
        "class_id": "",
        "class_name": "",
        "student_id": "",
        "course_id": "",
        "course_code": "",
        "course_name": "",
        "assessment_set_number": "",
        "assessment_lesson_ids": "",
        "assignment_ids": "",
        "assignment_batch_id": "",
        "assignment_count": 0,
        "pathway_updated": False,
        "queued_path_before": "",
        "matched_pathway_lesson_id": "",
        "error": "",
    }
    row.update(base)
    row.update(overrides)
    return row


def safe_file_part(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]", "_", str(value or "unknown"))


def default_output_path(school_id: str) -> Path:
    stamp = datetime.now(timezone.utc).isoformat().replace(":", "-").replace(".", "-")
    return APP_OUTPUT_DIR / f"reassign-assessments-report-{safe_file_part(school_id)}-{stamp}.xlsx"


def resolve_output_path(output: str | None, school_id: str) -> Path:
    if not output:
        return default_output_path(school_id)
    return APP_OUTPUT_DIR / Path(output).name


def write_report(output_path: Path, summary: dict[str, Any], rows: list[dict[str, Any]]) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if output_path.suffix.lower() == ".csv":
        write_csv_report(output_path, rows)
    else:
        write_xlsx_report(output_path, summary, rows)
    return output_path


def write_csv_report(output_path: Path, rows: list[dict[str, Any]]) -> None:
    fieldnames = list(rows[0].keys()) if rows else ["message"]
    with output_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        if rows:
            writer.writerows(rows)
        else:
            writer.writerow({"message": "no detail rows"})


def write_xlsx_report(output_path: Path, summary: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    summary_rows = [{"metric": key, "value": value} for key, value in summary.items()]
    detail_rows = rows or [{"message": "no detail rows"}]
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml())
        archive.writestr("_rels/.rels", root_rels_xml())
        archive.writestr("docProps/app.xml", app_xml())
        archive.writestr("docProps/core.xml", core_xml())
        archive.writestr("xl/workbook.xml", workbook_xml())
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml())
        archive.writestr("xl/styles.xml", styles_xml())
        archive.writestr("xl/worksheets/sheet1.xml", worksheet_xml(summary_rows))
        archive.writestr("xl/worksheets/sheet2.xml", worksheet_xml(detail_rows))


def worksheet_xml(rows: list[dict[str, Any]]) -> str:
    headers = list(rows[0].keys()) if rows else []
    all_rows = [headers] + [[row.get(header, "") for header in headers] for row in rows]
    xml_rows = []
    for row_index, values in enumerate(all_rows, start=1):
        cells = []
        for col_index, value in enumerate(values, start=1):
            ref = f"{column_name(col_index)}{row_index}"
            cells.append(cell_xml(ref, value))
        xml_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + "".join(xml_rows) + '</sheetData></worksheet>'


def cell_xml(ref: str, value: Any) -> str:
    if value is None:
        value = ""
    if isinstance(value, bool):
        return f'<c r="{ref}" t="b"><v>{1 if value else 0}</v></c>'
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{ref}"><v>{value}</v></c>'
    return f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def column_name(index: int) -> str:
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def content_types_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'


def root_rels_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'


def workbook_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="summary" sheetId="1" r:id="rId1"/><sheet name="details" sheetId="2" r:id="rId2"/></sheets></workbook>'


def workbook_rels_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'


def styles_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>'


def app_xml() -> str:
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex</Application></Properties>'


def core_xml() -> str:
    now = datetime.now(timezone.utc).isoformat()
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Codex</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>'


def main() -> None:
    args = parse_args()
    if args.school_file:
        args.school_ids = read_school_ids_from_file(args.school_file, args.school_id_column)

    init_supabase_env(args.service_account_file)
    languages_by_code = get_languages_by_code()
    classes = get_target_classes(args)
    unique_school_ids = sorted({row.get("school_id") for row in classes if row.get("school_id")})
    requested_school_id = args.school_ids[0] if args.school_ids else (unique_school_ids[0] if unique_school_ids else "unknown-school")

    if len(unique_school_ids) > 1:
        raise SystemExit("Only one school is allowed per run. Target classes belong to schools: " + ", ".join(unique_school_ids))

    report_rows: list[dict[str, Any]] = []
    summary: dict[str, Any] = {
        "schoolId": requested_school_id,
        "classes": len(classes),
        "classCourses": 0,
        "students": 0,
        "studentCoursesChecked": 0,
        "skippedPathwayAssessment": 0,
        "skippedExistingAssignment": 0,
        "skippedNoAssessments": 0,
        "wouldCreateAssignments": 0,
        "createdAssignments": 0,
        "updatedPathways": 0,
        "errors": 0,
        "reportRows": 0,
    }

    if not classes:
        print("No target classes found.")
        output_path = resolve_output_path(args.output, requested_school_id)
        write_report(output_path, summary, report_rows)
        print(f"Report written: {output_path}")
        return

    print("EXECUTE mode: writing assignment rows and learning_path updates." if args.execute else "DRY RUN: no rows will be written. Add --execute to write.")
    print(f"Target school: {requested_school_id}")

    for class_row in classes:
        courses = get_courses_for_class(class_row["id"])
        students = get_students_for_class(class_row["id"])
        summary["classCourses"] += len(courses)
        summary["students"] += len(students)
        print(f"\nClass {class_row['id']} ({class_row.get('name') or 'unnamed'}): {len(students)} students, {len(courses)} active courses")

        for course in courses:
            subject_rows = get_subject_lesson_rows(course.get("subject_id"))
            all_assessment_lesson_ids = {row.get("lesson_id") for row in subject_rows if row.get("lesson_id")}
            course_created = 0
            course_skipped_pathway = 0
            course_skipped_existing = 0
            course_skipped_no_assessments = 0

            for student in students:
                summary["studentCoursesChecked"] += 1
                base_report = {
                    "run_mode": "execute" if args.execute else "dry_run",
                    "school_id": class_row.get("school_id") or "",
                    "class_id": class_row.get("id") or "",
                    "class_name": class_row.get("name") or "",
                    "student_id": student.get("id") or "",
                    "course_id": course.get("id") or "",
                    "course_code": course.get("code") or "",
                    "course_name": course.get("name") or "",
                }

                try:
                    parsed_path = parse_learning_path(student.get("learning_path"), student["id"])
                    queued_path_before = describe_queued_lessons(parsed_path, course["id"])

                    if not subject_rows:
                        summary["skippedNoAssessments"] += 1
                        course_skipped_no_assessments += 1
                        report_rows.append(create_report_row(base_report, {"action": "SKIPPED", "reason": "no_subject_lesson_assessments_for_course_subject", "queued_path_before": queued_path_before}))
                        continue

                    pathway_match = find_queued_assessment(parsed_path, course["id"], all_assessment_lesson_ids)
                    if pathway_match["matched"]:
                        summary["skippedPathwayAssessment"] += 1
                        course_skipped_pathway += 1
                        report_rows.append(create_report_row(base_report, {"action": "SKIPPED", "reason": pathway_match["reason"], "queued_path_before": queued_path_before, "matched_pathway_lesson_id": pathway_match["lesson_id"]}))
                        continue

                    lang_id = effective_language_id(course, student, languages_by_code)
                    assessment_rows = choose_assessment_rows(subject_rows, lang_id, student.get("locale_id"), args)
                    if not assessment_rows:
                        summary["skippedNoAssessments"] += 1
                        course_skipped_no_assessments += 1
                        report_rows.append(create_report_row(base_report, {"action": "SKIPPED", "reason": "no_assessment_rows_for_student_language_or_set", "queued_path_before": queued_path_before}))
                        continue

                    now_iso = datetime.now(timezone.utc).isoformat()
                    if not args.ignore_existing and has_existing_active_assessment(student["id"], class_row["id"], course["id"], now_iso):
                        summary["skippedExistingAssignment"] += 1
                        course_skipped_existing += 1
                        report_rows.append(create_report_row(base_report, {
                            "action": "SKIPPED",
                            "reason": "existing_active_assessment_assignment",
                            "assessment_set_number": assessment_rows[0].get("set_number") or "",
                            "assessment_lesson_ids": "|".join([row["lesson_id"] for row in assessment_rows]),
                            "queued_path_before": queued_path_before,
                        }))
                        continue

                    summary["wouldCreateAssignments"] += len(assessment_rows)
                    report_update = {
                        "action": "UPDATED" if args.execute else "WOULD_UPDATE",
                        "reason": "created_assignment_and_updated_pathway" if args.execute else "dry_run_would_create_assignment_and_update_pathway",
                        "assessment_set_number": assessment_rows[0].get("set_number") or "",
                        "assessment_lesson_ids": "|".join([row["lesson_id"] for row in assessment_rows]),
                        "assignment_count": len(assessment_rows),
                        "pathway_updated": bool(args.execute and args.update_pathway),
                        "queued_path_before": queued_path_before,
                    }

                    if args.execute:
                        result = create_assignments_for_student_course(args, class_row, student, course, assessment_rows, now_iso)
                        summary["createdAssignments"] += len(result["assignment_rows"])
                        if args.update_pathway:
                            summary["updatedPathways"] += 1
                        report_update["assignment_ids"] = "|".join([row["id"] for row in result["assignment_rows"]])
                        report_update["assignment_batch_id"] = result["batch_id"]

                    report_rows.append(create_report_row(base_report, report_update))
                    course_created += len(assessment_rows)
                except Exception as error:
                    summary["errors"] += 1
                    report_rows.append(create_report_row(base_report, {"action": "ERROR", "reason": "processing_error", "error": str(error)}))
                    print(f"  ERROR student {student.get('id')}, course {course.get('id')}: {error}", file=sys.stderr)

            print(f"  Course {course['id']}: create {course_created}, skip pathway {course_skipped_pathway}, skip existing {course_skipped_existing}, skip no assessments {course_skipped_no_assessments}")

    summary["reportRows"] = len(report_rows)
    output_path = resolve_output_path(args.output, requested_school_id)
    write_report(output_path, summary, report_rows)

    print("\nSummary")
    for key, value in summary.items():
        print(f"  {key}: {value}")
    print(f"Report written: {output_path}")


if __name__ == "__main__":
    main()

