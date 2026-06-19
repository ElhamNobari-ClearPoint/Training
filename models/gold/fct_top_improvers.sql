-- models/gold/fct_top_improvers.sql
-- Countries with the biggest improvement over 10+ years
-- for each health indicator.

{{
    config(
        materialized = 'table',
        schema = 'GOLD'
    )
}}

with first_year as (
    select country_code, indicator_code, min(year) as year
    from {{ ref('fct_country_indicator_yearly') }}
    group by country_code, indicator_code
),

last_year as (
    select country_code, indicator_code, max(year) as year
    from {{ ref('fct_country_indicator_yearly') }}
    group by country_code, indicator_code
),

start_values as (
    select f.country_code, f.indicator_code, b.value as start_value, f.year as start_year
    from first_year f
    join {{ ref('fct_country_indicator_yearly') }} b
        on f.country_code = b.country_code
        and f.indicator_code = b.indicator_code
        and f.year = b.year
),

end_values as (
    select l.country_code, l.indicator_code, b.value as end_value, l.year as end_year
    from last_year l
    join {{ ref('fct_country_indicator_yearly') }} b
        on l.country_code = b.country_code
        and l.indicator_code = b.indicator_code
        and l.year = b.year
)

select
    s.indicator_code,
    b.indicator_name,
    b.indicator_category,
    s.country_code,
    b.country_name,
    b.sub_region,
    s.start_year,
    e.end_year,
    s.start_value,
    e.end_value,
    round(e.end_value - s.start_value, 4)                              as absolute_change,
    case
        when s.start_value = 0 then null
        else round((e.end_value - s.start_value) / s.start_value * 100, 2)
    end as pct_change
from start_values s
join end_values e
    on s.country_code = e.country_code
    and s.indicator_code = e.indicator_code
join {{ ref('fct_country_indicator_yearly') }} b
    on s.country_code = b.country_code
    and s.indicator_code = b.indicator_code
    and s.start_year = b.year
where e.end_year - s.start_year >= 10
