"""Turn eMaktab timetable exports into SQL for the `lessons` table.

eMaktab exports one .xls per class: the whole quarter as a calendar, week by week, each cell
"Subject\\nTeacher\\nHH:MM - HH:MM\\nRoom". The school's week repeats, so the standard week is
taken as the most common lesson per (weekday, period) over the full weeks (weeks with a holiday
or a missing school day are skipped).

    pip install xlrd
    python3 scripts/emaktab_timetable.py path/to/*.xls > import.sql

Review the report on stderr, then run the SQL in the Supabase SQL editor (or via MCP). Classes
are created if missing; each imported class's lessons are replaced.
"""
import collections
import re
import sys

import xlrd

DAYS = {"Dush": 1, "Sesh": 2, "Chor": 3, "Pay": 4, "Jum": 5, "Shan": 6}

# eMaktab spellings → names in the `subjects` table.
SUBJECT_ALIASES = {
    "Tabiiy fan (Science)": "Tabiiy fan",
    "Texnalogiya": "Texnologiya",
    "Tasviriy san'at": "Tasviriy san’at",
}
# Subjects eMaktab uses that the starter list lacked: (uz, ru, en), created on import.
NEW_SUBJECTS = {
    "Alifbe": ("Alifbe", "Букварь", "ABC book", 15),
    "Yozuv": ("Yozuv", "Письмо", "Writing", 16),
    "Kelajak soati": ("Kelajak soati", "Час будущего", "Future hour", 255),
}


def uz_apostrophes(s: str) -> str:
    """O'/G' take the turned comma (‘), other apostrophes the right quote (’)."""
    s = re.sub(r"([OoGg])['`ʻ]", "\\1‘", s)
    return re.sub(r"['`ʼ]", "’", s)


def teacher_name(raw: str) -> str:
    """'QUVONDIQOVA X.A.' → 'Quvondiqova X.A.'; keeps initials as they are."""
    surname, _, initials = raw.strip().partition(" ")
    if surname.isupper():
        surname = surname.capitalize()
    return uz_apostrophes(f"{surname} {initials}".strip())


def parse(path):
    sh = xlrd.open_workbook(path).sheet_by_index(0)
    cell = lambda r, c: str(sh.cell_value(r, c)).strip()
    m = re.search(r"Sinf:\s*(\d+)-(\S+)", cell(0, 0))
    if not m:
        raise SystemExit(f"{path}: no 'Sinf: N-X' title in A1")
    grade, letter = int(m.group(1)), m.group(2).upper()

    cols = {}
    for r in range(sh.nrows):
        names = [cell(r, c) for c in range(sh.ncols)]
        if any(n in DAYS for n in names):
            cols = {c: DAYS[n] for c, n in enumerate(names) if n in DAYS}
            break

    weeks, cur = [], None
    for r in range(sh.nrows):
        a, b = cell(r, 0), cell(r, 1)
        if "hafta" in a.replace("\n", "") and not b:  # week header: "N hafta" + dates
            cur = {}
            weeks.append(cur)
            continue
        if cur is not None and re.fullmatch(r"\d+(\.0)?", b):
            period = int(float(b))
            for c, day in cols.items():
                parts = cell(r, c).split("\n")
                cur[(day, period)] = (parts[0].strip(), parts[1].strip()) if len(parts) >= 2 else None
                if len(parts) == 1 and parts[0]:
                    cur["holiday"] = True  # e.g. "Bayram kuni"

    school_days = set(cols.values())
    full = [w for w in weeks if not w.get("holiday") and {k[0] for k, v in w.items() if k != "holiday" and v} == school_days]
    week, conflicts = {}, []
    for key in sorted({k for w in full for k in w if k != "holiday"}):
        counts = collections.Counter(w.get(key) for w in full)
        best, _ = counts.most_common(1)[0]
        if len(counts) > 1:
            conflicts.append((key, dict(counts)))
        if best:
            week[key] = best
    return grade, letter, len(weeks), len(full), week, conflicts


def q(s):
    return "null" if s is None else "'" + s.replace("'", "''") + "'"


def main(paths):
    out = ["begin;"]
    for uz, ru, en, order in NEW_SUBJECTS.values():
        out.append(
            f"insert into public.subjects (name_uz, name_ru, name_en, sort_order) select {q(uz)}, {q(ru)}, {q(en)}, {order} "
            f"where not exists (select 1 from public.subjects where name_uz = {q(uz)});"
        )
    total = 0
    for path in paths:
        grade, letter, n_weeks, n_full, week, conflicts = parse(path)
        print(f"{grade}-{letter}: {n_weeks} weeks, {n_full} full, {len(week)} lessons/week, {len(conflicts)} conflicts", file=sys.stderr)
        for key, counts in conflicts:
            print(f"   day {key[0]} lesson {key[1]}: {counts}", file=sys.stderr)
        total += len(week)
        values = ",\n  ".join(
            f"({d}, {p}, {q(SUBJECT_ALIASES.get(s, s))}, {q(teacher_name(t))})" for (d, p), (s, t) in sorted(week.items())
        )
        cls = f"(select id from public.school_classes where grade = {grade} and letter = {q(letter)})"
        out += [
            f"-- {grade}-{letter}",
            f"insert into public.school_classes (grade, letter) values ({grade}, {q(letter)}) on conflict (grade, letter) do nothing;",
            f"delete from public.lessons where class_id = {cls};",
            "insert into public.lessons (class_id, weekday, period, subject_id, teacher)",
            f"select {cls}, v.weekday, v.period, s.id, v.teacher from (values\n  {values}\n) v(weekday, period, subject, teacher)",
            "left join public.subjects s on s.name_uz = v.subject;",  # left join: an unknown subject fails the not-null check loudly
        ]
    out.append("commit;")
    print(f"total: {total} lessons", file=sys.stderr)
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1:])
