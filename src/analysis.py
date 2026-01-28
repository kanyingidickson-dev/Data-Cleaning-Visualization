from __future__ import annotations

from pathlib import Path

import pandas as pd

CLEANED_PATH = Path("data/cleaned/cleaned_dataset.csv")
INSIGHTS_PATH = Path("reports/insights.md")


def main() -> int:
    if not CLEANED_PATH.exists():
        raise SystemExit("Cleaned dataset not found. Run: python -m src.cleaning")

    df = pd.read_csv(CLEANED_PATH, parse_dates=["hired_date"])

    lines: list[str] = []
    lines.append("# Insights\n")

    lines.append("## Dataset overview\n")
    lines.append(f"- Rows: {len(df)}")
    lines.append(f"- Departments: {', '.join(sorted(df['department'].unique()))}\n")

    lines.append("## Salary by department\n")
    dept = (
        df.groupby("department")["salary_usd"]
        .agg(["count", "mean", "median", "min", "max"])
        .sort_values("mean", ascending=False)
    )
    lines.append(dept.to_markdown())
    lines.append("")

    lines.append("## Remote vs on-site\n")
    remote = df.groupby("remote")["salary_usd"].mean().to_frame("avg_salary_usd")
    lines.append(remote.to_markdown())
    lines.append("")

    lines.append("## Notable observations\n")
    top_dept = dept.index[0]
    lines.append(f"- Highest average salary is in **{top_dept}**.")
    lines.append("- Salaries vary widely even within a department, suggesting experience and role level matter.")
    lines.append("- Remote status alone does not fully explain salary differences in this small sample.")
    lines.append("")

    INSIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    INSIGHTS_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote insights to: {INSIGHTS_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
