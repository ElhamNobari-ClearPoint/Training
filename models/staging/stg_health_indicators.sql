-- models/staging/stg_health_indicators.sql
-- This model cleans and enriches raw Bronze data for the Silver layer.
-- It is materialised as a VIEW in the SILVER schema.

{{
    config(
        materialized = 'view',
        schema = 'SILVER'
    )
}}

with source as (

    -- Read from the Bronze source table
    -- source() tells dbt this is a raw table, not a dbt model
    select * from {{ source('bronze', 'raw_health_indicators') }}

),

deduplicated as (

    -- Remove duplicates by keeping the most recently loaded row
    -- for each country + indicator + year combination
    select *,
        row_number() over (
            partition by country_code, indicator_code, year
            order by loaded_at desc
        ) as row_num
    from source

),

cleaned as (

    -- Keep only the latest row per combination
    -- and add derived columns for sub-region and category
    select
        trim(country_code)       as country_code,
        trim(country_name)        as country_name,
        trim(indicator_code)      as indicator_code,
        trim(indicator_name)      as indicator_name,
        year,
        value,
        loaded_at,
        load_batch_id,

        -- Mark negative values as invalid
        -- Most health indicators cannot be negative
        case
            when value < 0 then false
            else true
        end as is_valid,

        -- Assign sub-region based on country code
        case country_code
            when 'NZL' then 'Oceania'
            when 'AUS' then 'Oceania'
            when 'PNG' then 'Oceania'
            when 'FJI' then 'Oceania'
            when 'WSM' then 'Oceania'
            when 'IDN' then 'Southeast Asia'
            when 'PHL' then 'Southeast Asia'
            when 'VNM' then 'Southeast Asia'
            when 'THA' then 'Southeast Asia'
            when 'MYS' then 'Southeast Asia'
            when 'SGP' then 'Southeast Asia'
            when 'MMR' then 'Southeast Asia'
            when 'KHM' then 'Southeast Asia'
            when 'LAO' then 'Southeast Asia'
            when 'CHN' then 'East Asia'
            when 'JPN' then 'East Asia'
            when 'KOR' then 'East Asia'
            when 'MNG' then 'East Asia'
            when 'IND' then 'South Asia'
            when 'BGD' then 'South Asia'
            when 'PAK' then 'South Asia'
            when 'LKA' then 'South Asia'
            when 'NPL' then 'South Asia'
            when 'BTN' then 'South Asia'
            when 'KAZ' then 'Central Asia'
            when 'UZB' then 'Central Asia'
            else 'Unknown'
        end as sub_region,

        -- Assign indicator category
        case indicator_code
            when 'SP.DYN.LE00.IN'    then 'Mortality'
            when 'SP.DYN.IMRT.IN'    then 'Mortality'
            when 'SH.DYN.MORT'       then 'Mortality'
            when 'SP.DYN.AMRT.MA'    then 'Mortality'
            when 'SH.TBS.INCD'       then 'Disease'
            when 'SH.DYN.AIDS.ZS'    then 'Disease'
            when 'SH.MLR.INCD.P3'    then 'Disease'
            when 'SH.STA.MMRT'       then 'Maternal & Child'
            when 'SH.STA.BRTC.ZS'    then 'Maternal & Child'
            when 'SH.IMM.IDPT'       then 'Maternal & Child'
            when 'SP.POP.GROW'       then 'Population'
            when 'SP.URB.TOTL.IN.ZS' then 'Population'
            when 'SP.DYN.TFRT.IN'    then 'Population'
            when 'SH.XPD.CHEX.GD.ZS' then 'Health System'
            when 'SH.MED.PHYS.ZS'    then 'Health System'
            else 'Other'
        end as indicator_category

    from deduplicated
    where row_num = 1

)

select * from cleaned
