from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

from src.quality import validate_cleaned

CLEANED_PATH = Path("data/cleaned/cleaned_dataset.csv")
FIG_DIR = Path("reports/figures")


def main() -> int:
    if not CLEANED_PATH.exists():
        raise SystemExit("Cleaned dataset not found. Run: python -m src.cleaning")

    df = pd.read_csv(CLEANED_PATH, parse_dates=["hired_date"])
    validate_cleaned(df)

    FIG_DIR.mkdir(parents=True, exist_ok=True)
    sns.set_theme(style="whitegrid")

    plt.figure(figsize=(8, 4))
    sns.histplot(df["salary_usd"], bins=10, kde=True)
    plt.title("Salary Distribution")
    plt.xlabel("Salary (USD)")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "01_salary_distribution.png", dpi=160)
    plt.close()

    plt.figure(figsize=(8, 4))
    dept_means = df.groupby("department")["salary_usd"].mean().sort_values(ascending=False)
    sns.barplot(x=dept_means.index, y=dept_means.values)
    plt.title("Average Salary by Department")
    plt.xlabel("Department")
    plt.ylabel("Avg Salary (USD)")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "02_avg_salary_by_department.png", dpi=160)
    plt.close()

    plt.figure(figsize=(8, 4))
    sns.regplot(data=df, x="years_experience", y="salary_usd")
    plt.title("Salary vs Experience")
    plt.xlabel("Years of experience")
    plt.ylabel("Salary (USD)")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "03_salary_vs_experience.png", dpi=160)
    plt.close()

    print(f"Wrote figures to: {FIG_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
