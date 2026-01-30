from __future__ import annotations

import pandas as pd

from src.cleaning import clean
from src.quality import REQUIRED_CLEANED_COLUMNS, validate_cleaned, validate_raw


def test_cleaning_produces_valid_dataset() -> None:
    raw = pd.read_csv("data/raw/messy_dataset.csv")
    validate_raw(raw)

    cleaned = clean(raw)
    validate_cleaned(cleaned)


def test_cleaned_columns_and_ranges() -> None:
    raw = pd.read_csv("data/raw/messy_dataset.csv")
    cleaned = clean(raw)

    assert REQUIRED_CLEANED_COLUMNS.issubset(cleaned.columns)
    assert cleaned["age"].between(16, 80).all()
    assert cleaned["years_experience"].between(0, 60).all()


def test_salary_imputed_and_positive() -> None:
    raw = pd.read_csv("data/raw/messy_dataset.csv")
    cleaned = clean(raw)

    assert cleaned["salary_usd"].notna().all()
    assert (cleaned["salary_usd"] > 0).all()


def test_employee_id_unique() -> None:
    raw = pd.read_csv("data/raw/messy_dataset.csv")
    cleaned = clean(raw)

    assert cleaned["employee_id"].notna().all()
    assert not cleaned["employee_id"].duplicated().any()
