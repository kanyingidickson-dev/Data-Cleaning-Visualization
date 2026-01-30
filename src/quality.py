from __future__ import annotations

import pandas as pd

REQUIRED_RAW_COLUMNS: set[str] = {
    "employee_id",
    "age",
    "department",
    "salary",
    "years_experience",
    "remote",
    "hired_date",
}

REQUIRED_CLEANED_COLUMNS: set[str] = {
    "employee_id",
    "age",
    "department",
    "years_experience",
    "remote",
    "hired_date",
    "salary_usd",
}


def validate_raw(df: pd.DataFrame) -> None:
    missing = REQUIRED_RAW_COLUMNS.difference(df.columns)
    if missing:
        raise ValueError(f"Raw dataset missing columns: {sorted(missing)}")


def validate_cleaned(df: pd.DataFrame) -> None:
    missing = REQUIRED_CLEANED_COLUMNS.difference(df.columns)
    if missing:
        raise ValueError(f"Cleaned dataset missing columns: {sorted(missing)}")

    if len(df) == 0:
        raise ValueError("Cleaned dataset is empty")

    if df["salary_usd"].isna().any():
        raise ValueError("Cleaned dataset contains missing salary_usd values")

    if (df["salary_usd"] <= 0).any():
        raise ValueError("Cleaned dataset contains non-positive salary_usd values")

    if df["employee_id"].isna().any():
        raise ValueError("Cleaned dataset contains missing employee_id values")

    if df["employee_id"].duplicated().any():
        raise ValueError("Cleaned dataset contains duplicate employee_id values")

    if df["hired_date"].isna().all():
        raise ValueError("Cleaned dataset contains no valid hired_date values")

    remote_series = df["remote"]
    if remote_series.notna().any():
        remote_unique = set(remote_series.dropna().unique())
        if not remote_unique.issubset({True, False}):
            raise ValueError("Cleaned dataset contains invalid remote values")

    if df["age"].isna().any() or (df["age"] < 16).any() or (df["age"] > 80).any():
        raise ValueError("Cleaned dataset contains invalid age values")

    if (
        df["years_experience"].isna().any()
        or (df["years_experience"] < 0).any()
        or (df["years_experience"] > 60).any()
    ):
        raise ValueError("Cleaned dataset contains invalid years_experience values")
