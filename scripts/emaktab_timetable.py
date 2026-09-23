"""Turn eMaktab timetable exports into SQL for the `lessons` table.

Two eMaktab export types (one .xls per class) are understood:

* Calendar (sheet "Calendar"): the whole quarter week by week, each cell
  "Subject\\nTeacher\\nHH:MM - HH:MM\\nRoom". The school's week repeats, so the standard week is
  the most common lesson per (weekday, period) over the full weeks (weeks with a holiday or a
  missing school day are skipped). Gives teachers too.
* Week journal (sheet "WeekJournal"): one week of the class register — a row of subjects under
  "dushanba / 05.10" … and "1 dars" … headers. No teacher names. Below the header it lists the
  pupils; this script reads only the header rows and never touches pupil data.

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
    "O'qish": "O‘qish",
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


def teacher_name(raw):
    """'QUVONDIQOVA X.A.' → 'Quvondiqova X.A.'; keeps initials as they are."""
    if not raw:
        return None
    surname, _, initials = raw.strip().partition(" ")
    if surname.isupper():
        surname = surname.capitalize()
    return uz_apostrophes(f"{surname} {initials}".strip())


JOURNAL_DAYS = {"dushanba": 1, "seshanba": 2, "chorshanba": 3, "payshanba": 4, "juma": 5, "shanba": 6}


def parse_journal(sh):
    """Week journal: rows 0-9 only (title, week, days, lesson numbers, subjects)."""
    cell = lambda r, c: str(sh.cell_value(r, c)).strip()
    m = re.search(r"Sinf:\s*(\d+)-(\S+)", cell(0, 0))
    grade, letter = int(m.group(1)), m.group(2).upper()
    week, day = {}, None
    for c in range(2, sh.ncols):
        head = cell(5, c).split("/")[0].strip().lower()
        if head:
            day = JOURNAL_DAYS[head]
        n = re.match(r"(\d+)", cell(6, c))
        subject = cell(7, c)
        if day and n and subject:
            week[(day, int(n.group(1)))] = (subject, None)
    return grade, letter, 1, 1, week, []


def parse(path):
    sh = xlrd.open_workbook(path).sheet_by_index(0)
    if sh.name == "WeekJournal":
        return parse_journal(sh)
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
