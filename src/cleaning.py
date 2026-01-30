from __future__ import annotations

from pathlib import Path

import pandas as pd

from src.quality import validate_cleaned, validate_raw

RAW_PATH = Path("data/raw/messy_dataset.csv")
CLEANED_PATH = Path("data/cleaned/cleaned_dataset.csv")


def _parse_salary_to_float(x) -> float | None:
    if pd.isna(x):
        return None
    s = str(x).strip()
    if not s or s.lower() in {"n/a", "na", "none", "null", "not_available"}:
        return None

    s = s.replace("$", "").replace(",", "")
    try:
        value = float(s)
    except ValueError:
        return None

    if value <= 0:
        return None

    return value


def _normalize_department(x: str) -> str:
    s = str(x).strip().lower()
    if s in {"engineering", "eng"}:
        return "Engineering"
    if s in {"sales"}:
        return "Sales"
    if s in {"marketing", "mkt"}:
        return "Marketing"
    if s in {"hr", "human resources"}:
        return "HR"
    return "Other"


def load_raw() -> pd.DataFrame:
    return pd.read_csv(RAW_PATH)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()

    out["department"] = out["department"].apply(_normalize_department)
    out["salary_usd"] = out["salary"].apply(_parse_salary_to_float)

    out["age"] = pd.to_numeric(out["age"], errors="coerce")
    out["years_experience"] = pd.to_numeric(out["years_experience"], errors="coerce")

    out = out[(out["age"].notna()) & (out["age"] >= 16) & (out["age"] <= 80)]
    out = out[
        (out["years_experience"].notna())
        & (out["years_experience"] >= 0)
        & (out["years_experience"] <= 60)
    ]

    remote_map = {
        "yes": True,
        "y": True,
        "true": True,
        "1": True,
        "no": False,
        "n": False,
        "false": False,
        "0": False,
    }
    out["remote"] = (
        out["remote"].astype("string").str.strip().str.lower().map(remote_map).astype("boolean")
    )

    out["hired_date"] = pd.to_datetime(out["hired_date"], errors="coerce")

    dept_median = out.groupby("department")["salary_usd"].transform("median")
    global_median = out["salary_usd"].median()
    out["salary_usd"] = out["salary_usd"].fillna(dept_median).fillna(global_median)

    out = out.drop(columns=["salary"])
    out = out.sort_values(
        ["department", "salary_usd", "employee_id"],
        ascending=[True, False, True],
    )

    return out


def save_cleaned(df: pd.DataFrame) -> None:
    CLEANED_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CLEANED_PATH, index=False)


def main() -> int:
    df = load_raw()
    validate_raw(df)
    cleaned = clean(df)
    validate_cleaned(cleaned)
    save_cleaned(cleaned)
    print(f"Wrote cleaned dataset to: {CLEANED_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
