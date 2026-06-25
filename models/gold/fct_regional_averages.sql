-- models/gold/fct_regional_averages.sql
-- Regional averages, min, and max for each indicator and year.

{{
    config(
        materialized = 'table',
        schema = 'GOLD'
    )
}}

select
    sub_region,
    indicator_code,
    indicator_name,
    indicator_category,
    year,
    round(avg(value), 4)             as avg_value,
    round(min(value), 4)             as min_value,
    round(max(value), 4)             as max_value,
    count(distinct country_code)     as country_count
from {{ ref('fct_country_indicator_yearly') }}
group by
    sub_region,
    indicator_code,
    indicator_name,
    indicator_category,
    year
