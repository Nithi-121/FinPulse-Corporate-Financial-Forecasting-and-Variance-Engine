CREATE OR REPLACE VIEW financial_metrics AS
WITH wide AS (
    SELECT
        company,
        period_end,
        MAX(fiscal_year) AS fiscal_year,
        MAX(fiscal_quarter) AS fiscal_quarter,
        MAX(value) FILTER (WHERE metric = 'revenue') AS revenue,
        MAX(value) FILTER (WHERE metric = 'cost_of_revenue') AS cost_of_revenue,
        MAX(value) FILTER (WHERE metric = 'gross_profit') AS gross_profit,
        MAX(value) FILTER (WHERE metric = 'operating_income') AS operating_income,
        MAX(value) FILTER (WHERE metric = 'net_income') AS net_income,
        MAX(value) FILTER (WHERE metric = 'research_and_development') AS research_and_development,
        MAX(value) FILTER (WHERE metric = 'selling_general_and_administrative') AS selling_general_and_administrative
    FROM quarterly_financials
    GROUP BY company, period_end
)
SELECT
    *,
    gross_profit / NULLIF(revenue, 0) AS gross_margin,
    operating_income / NULLIF(revenue, 0) AS operating_margin
FROM wide;

CREATE OR REPLACE VIEW financial_growth AS
WITH lagged AS (
    SELECT
        *,
        LAG(period_end, 1) OVER company_order AS previous_period_end,
        LAG(revenue, 1) OVER company_order AS previous_revenue,
        LAG(period_end, 2) OVER company_order AS two_periods_ago_end,
        LAG(period_end, 3) OVER company_order AS three_periods_ago_end,
        LAG(period_end, 4) OVER company_order AS year_ago_period_end,
        LAG(revenue, 4) OVER company_order AS year_ago_revenue,
        LAG(fiscal_quarter, 4) OVER company_order AS year_ago_fiscal_quarter,
        COUNT(revenue) OVER (
            PARTITION BY company ORDER BY period_end
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS revenue_periods_in_ttm,
        SUM(revenue) OVER (
            PARTITION BY company ORDER BY period_end
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS revenue_ttm_candidate
    FROM financial_metrics
    WINDOW company_order AS (PARTITION BY company ORDER BY period_end)
)
SELECT
    *,
    CASE
        WHEN date_diff('day', previous_period_end, period_end) BETWEEN 70 AND 120
        THEN revenue / NULLIF(previous_revenue, 0) - 1
    END AS revenue_qoq_growth,
    CASE
        WHEN fiscal_quarter = year_ago_fiscal_quarter
         AND date_diff('day', year_ago_period_end, period_end) BETWEEN 330 AND 400
        THEN revenue / NULLIF(year_ago_revenue, 0) - 1
    END AS revenue_yoy_growth,
    CASE
        WHEN revenue_periods_in_ttm = 4
         AND date_diff('day', previous_period_end, period_end) BETWEEN 70 AND 120
         AND date_diff('day', two_periods_ago_end, previous_period_end) BETWEEN 70 AND 120
         AND date_diff('day', three_periods_ago_end, two_periods_ago_end) BETWEEN 70 AND 120
        THEN revenue_ttm_candidate
    END AS revenue_ttm
FROM lagged;
