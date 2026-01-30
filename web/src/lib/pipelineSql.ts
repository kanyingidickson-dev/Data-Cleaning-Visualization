export type CleaningParams = {
  ageMin: number;
  ageMax: number;
  expMin: number;
  expMax: number;
};

export function createRawTableSql(fileName: string): string {
  return `
CREATE OR REPLACE TABLE raw AS
SELECT *
FROM read_csv_auto('${escapeSqlString(fileName)}', header=true);
`.trim();
}

export function createCleanedTableSql(params: CleaningParams): string {
  const { ageMin, ageMax, expMin, expMax } = params;

  return `
CREATE OR REPLACE TABLE cleaned AS
WITH typed AS (
  SELECT
    employee_id,
    TRY_CAST(age AS DOUBLE) AS age_num,
    TRY_CAST(years_experience AS DOUBLE) AS years_experience_num,
    CAST(department AS VARCHAR) AS department_raw,
    CAST(salary AS VARCHAR) AS salary_raw,
    CAST(remote AS VARCHAR) AS remote_raw,
    CAST(hired_date AS VARCHAR) AS hired_date_raw
  FROM raw
), normalized AS (
  SELECT
    employee_id,
    age_num,
    years_experience_num,
    CASE
      WHEN lower(trim(department_raw)) IN ('engineering', 'eng') THEN 'Engineering'
      WHEN lower(trim(department_raw)) IN ('sales') THEN 'Sales'
      WHEN lower(trim(department_raw)) IN ('marketing', 'mkt') THEN 'Marketing'
      WHEN lower(trim(department_raw)) IN ('hr', 'human resources') THEN 'HR'
      ELSE 'Other'
    END AS department,
    CASE
      WHEN salary_raw IS NULL THEN NULL
      WHEN trim(salary_raw) = '' THEN NULL
      WHEN lower(trim(salary_raw)) IN ('n/a', 'na', 'none', 'null', 'not_available') THEN NULL
      ELSE TRY_CAST(
        replace(replace(replace(salary_raw, '$', ''), ',', ''), ' ', '') AS DOUBLE
      )
    END AS salary_num,
    CASE
      WHEN lower(trim(remote_raw)) IN ('yes', 'y', 'true', '1') THEN TRUE
      WHEN lower(trim(remote_raw)) IN ('no', 'n', 'false', '0') THEN FALSE
      ELSE NULL
    END AS remote,
    TRY_CAST(hired_date_raw AS DATE) AS hired_date
  FROM typed
), filtered AS (
  SELECT
    employee_id,
    age_num,
    years_experience_num,
    department,
    CASE WHEN salary_num > 0 THEN salary_num ELSE NULL END AS salary_usd_raw,
    remote,
    hired_date
  FROM normalized
  WHERE
    age_num IS NOT NULL
    AND years_experience_num IS NOT NULL
    AND age_num BETWEEN ${ageMin} AND ${ageMax}
    AND years_experience_num BETWEEN ${expMin} AND ${expMax}
), imputed AS (
  SELECT
    employee_id,
    CAST(age_num AS BIGINT) AS age,
    CAST(years_experience_num AS BIGINT) AS years_experience,
    department,
    remote,
    hired_date,
    COALESCE(
      salary_usd_raw,
      median(salary_usd_raw) OVER (PARTITION BY department),
      median(salary_usd_raw) OVER ()
    ) AS salary_usd
  FROM filtered
)
SELECT
  employee_id,
  age,
  department,
  years_experience,
  remote,
  hired_date,
  salary_usd
FROM imputed
ORDER BY department ASC, salary_usd DESC, employee_id ASC;
`.trim();
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}
