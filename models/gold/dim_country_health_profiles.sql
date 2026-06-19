-- models/gold/dim_country_health_profiles.sql
-- Latest value per country for every health indicator.
-- One row per country — a snapshot of current health status.

{{
    config(
        materialized = 'table',
        schema = 'GOLD'
    )
}}

with latest as (

    -- Get the most recent year for each country and indicator
    select
        country_code,
        indicator_code,
        value,
        year,
        row_number() over (
            partition by country_code, indicator_code
            order by year desc
        ) as rn
    from {{ ref('fct_country_indicator_yearly') }}

)

select
    b.country_code,
    b.country_name,
    b.sub_region,

    max(case when l.indicator_code = 'SP.DYN.LE00.IN'    and l.rn = 1 then l.value end) as life_expectancy,
    max(case when l.indicator_code = 'SP.DYN.LE00.IN'    and l.rn = 1 then l.year  end) as life_expectancy_year,
    max(case when l.indicator_code = 'SP.DYN.IMRT.IN'    and l.rn = 1 then l.value end) as infant_mortality,
    max(case when l.indicator_code = 'SP.DYN.IMRT.IN'    and l.rn = 1 then l.year  end) as infant_mortality_year,
    max(case when l.indicator_code = 'SH.DYN.MORT'       and l.rn = 1 then l.value end) as under5_mortality,
    max(case when l.indicator_code = 'SH.DYN.MORT'       and l.rn = 1 then l.year  end) as under5_mortality_year,
    max(case when l.indicator_code = 'SH.TBS.INCD'       and l.rn = 1 then l.value end) as tb_incidence,
    max(case when l.indicator_code = 'SH.TBS.INCD'       and l.rn = 1 then l.year  end) as tb_incidence_year,
    max(case when l.indicator_code = 'SH.DYN.AIDS.ZS'    and l.rn = 1 then l.value end) as hiv_prevalence,
    max(case when l.indicator_code = 'SH.DYN.AIDS.ZS'    and l.rn = 1 then l.year  end) as hiv_prevalence_year,
    max(case when l.indicator_code = 'SH.STA.MMRT'       and l.rn = 1 then l.value end) as maternal_mortality,
    max(case when l.indicator_code = 'SH.STA.MMRT'       and l.rn = 1 then l.year  end) as maternal_mortality_year,
    max(case when l.indicator_code = 'SH.IMM.IDPT'       and l.rn = 1 then l.value end) as immunisation_dpt,
    max(case when l.indicator_code = 'SH.IMM.IDPT'       and l.rn = 1 then l.year  end) as immunisation_dpt_year,
    max(case when l.indicator_code = 'SP.URB.TOTL.IN.ZS' and l.rn = 1 then l.value end) as urban_population_pct,
    max(case when l.indicator_code = 'SP.URB.TOTL.IN.ZS' and l.rn = 1 then l.year  end) as urban_population_year,
    max(case when l.indicator_code = 'SP.DYN.TFRT.IN'    and l.rn = 1 then l.value end) as fertility_rate,
    max(case when l.indicator_code = 'SP.DYN.TFRT.IN'    and l.rn = 1 then l.year  end) as fertility_rate_year,
    max(case when l.indicator_code = 'SH.XPD.CHEX.GD.ZS' and l.rn = 1 then l.value end) as health_expenditure_pct_gdp,
    max(case when l.indicator_code = 'SH.XPD.CHEX.GD.ZS' and l.rn = 1 then l.year  end) as health_expenditure_year,
    max(case when l.indicator_code = 'SH.MED.PHYS.ZS'    and l.rn = 1 then l.value end) as physicians_per_1000,
    max(case when l.indicator_code = 'SH.MED.PHYS.ZS'    and l.rn = 1 then l.year  end) as physicians_year

from {{ ref('fct_country_indicator_yearly') }} b
join latest l
    on b.country_code = l.country_code
    and b.indicator_code = l.indicator_code
group by b.country_code, b.country_name, b.sub_region
