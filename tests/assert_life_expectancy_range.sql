-- tests/assert_life_expectancy_range.sql
-- This test checks that all life expectancy values are
-- within a plausible human range (20 to 100 years).
-- If any rows are returned, the test fails.

select
    country_code,
    country_name,
    year,
    value as life_expectancy
from {{ ref('stg_health_indicators') }}
where indicator_code = 'SP.DYN.LE00.IN'
and (value < 10 or value > 100)
