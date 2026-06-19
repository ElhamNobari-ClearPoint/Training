-- models/gold/fct_country_indicator_yearly.sql
-- Annual health indicator values with year-over-year change.
-- One row per country + indicator + year.

{{
    config(
        materialized = 'table',
        schema = 'GOLD'
    )
}}

with base as (

    select
        country_code,
        country_name,
        sub_region,
        indicator_code,
        indicator_name,
        indicator_category,
        year,
        value
    from {{ ref('stg_health_indicators') }}
    where is_valid = true

),

with_yoy as (

    select
        *,

        -- Year-over-year absolute change
        value - lag(value) over (
            partition by country_code, indicator_code
            order by year
        ) as yoy_change,

        -- Year-over-year percentage change
        case
            when lag(value) over (
                partition by country_code, indicator_code
                order by year
            ) = 0 then null
            else round(
                (value - lag(value) over (
                    partition by country_code, indicator_code
                    order by year
                )) /
                lag(value) over (
                    partition by country_code, indicator_code
                    order by year
                ) * 100, 2)
        end as yoy_change_pct

    from base

)

select * from with_yoy
