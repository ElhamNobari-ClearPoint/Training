-- macros/generate_schema_name.sql
-- This macro overrides dbt's default schema naming behaviour.
-- By default dbt adds the project name as a prefix to every schema.
-- This macro removes that prefix so tables are named cleanly.

{% macro generate_schema_name(custom_schema_name, node) -%}
    {%- if custom_schema_name is none -%}
        {{ target.schema }}
    {%- else -%}
        {{ custom_schema_name | upper }}
    {%- endif -%}
{%- endmacro %}
