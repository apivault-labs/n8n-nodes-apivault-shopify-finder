# n8n-nodes-apivault-shopify-finder

An [n8n](https://n8n.io) community node for **Shopify & WooCommerce Leads Database**, powered by the [`apivault_labs/website-leads-database` Apify Actor](https://apify.com/apivault_labs/website-leads-database).

Find Shopify, WooCommerce and other website leads at scale. Export contacts, company data, technology stack and optional traffic estimates including monthly visits, growth and acquisition channels. Match traffic is available for domains covered by the 40M+ traffic dataset.

The node is a thin connector: collection, analysis, retries and billing run in the hosted Actor. It contains no private scraper implementation or embedded credentials.

## Installation

1. Open **Settings → Community Nodes** in your n8n instance.
2. Select **Install**.
3. Enter `n8n-nodes-apivault-shopify-finder` and confirm.

## Credentials

Create an **Apify API** credential in n8n and paste your personal token from [Apify Console → Integrations](https://console.apify.com/account/integrations). The token is sent to Apify as a bearer credential and is never bundled with this package.

## Usage

Add **Shopify & WooCommerce Leads Database** to a workflow, fill the public Actor inputs below, and execute the node. Every Dataset result becomes one n8n item, so it can flow into Sheets, databases, CRMs, alerts or your own code. The node respects n8n's **Continue On Fail** behavior.

| Input | Type | Description |
|---|---|---|
| `workflow` | `string` | Auto uses countOnly as before; Export returns lead rows; Count previews the audience without paid Dataset rows. |
| `platforms` | `array` | Which platform tables to pull sites from. Leave empty to search ALL platforms. |
| `outputPreset` | `string` | Compact is best for general AI use; Contacts and Sales produce focused lead lists; Traffic adds traffic enrichment; Full returns all 59 core columns; Custom uses Output columns. |
| `columns` | `array` | Which fields to return. IMPORTANT: dataset tabs only display fields saved by this run; selecting only Emails makes Traffic, Firmographics and Tech Stack tabs empty. Leave this fiel |
| `sortBy` | `string` | Order rows by this column before applying the limit, so you get the top leads instead of an arbitrary slice. Empty — no ordering. |
| `country` | `array` | One or more ISO-2 country codes, e.g. DE, IT, US. Type each code and press Enter. Empty — no country filter. |
| `keyword` | `string` | Substring in domain or company name. Empty — no filter. |
| `phoneCode` | `string` | E.g. +1 or +44. Keeps sites where AT LEAST ONE phone starts with this code. Empty — no filter. |
| `filters` | `array` | Array of conditions on ANY of the 59 columns. Each item: {"column": "City", "operator": "contains", "value": "Milano"}. Operators: equals, not_equals, contains, not_contains, start |
| `hasEmail` | `boolean` | Keep only sites where the Emails column is not empty. |
| `includeTrafficData` | `boolean` | Optional and slower. Match exported domains against the traffic database and add visits, rank, growth, engagement and channel shares. Traffic filters below automatically enable thi |
| `onlyWithTrafficData` | `boolean` | Return and charge only websites that have a traffic estimate. Automatically enables traffic enrichment. |
| `minMonthlyVisits` | `integer` | Optional lower traffic threshold. Sites without traffic data or below this estimate are excluded before Dataset billing. |
| `maxMonthlyVisits` | `integer` | Optional upper traffic threshold. Sites without traffic data or above this estimate are excluded before Dataset billing. |
| `trafficSortOrder` | `string` | Order traffic-matched rows inside each export selection. Traffic fields are added automatically when sorting is enabled. |
| `hasPhone` | `boolean` | Keep only sites where the Telephones column is not empty. |
| `sortDesc` | `boolean` | Highest values first (recommended for scores/traffic/revenue). |
| `dedupeByDomain` | `boolean` | Do not output repeated Root Domain values when several platform datasets overlap. Single-platform datasets are already unique. |
| `countOnly` | `boolean` | Preview matching segment rows without per-result charges. Saves structured COUNT_SUMMARY and SUMMARY records; Actor start and platform usage may still apply. Counts can include cro |
| `maxItems` | `integer` | Upper limit on returned rows per run (across all platforms combined). Max 250000. There is no total cap — use Offset to page through unlimited results across runs. |
| `offset` | `integer` | Skip the first N source rows, then return the next batch. After a capped run, copy the exact nextOffset or resumeInput from EXPORT_CONTINUATION in the run's Key-Value Store. Set a  |

## Pricing

The package is free. Actor runs are billed by Apify using the pricing shown on the [Actor page](https://apify.com/apivault_labs/website-leads-database); platform usage may also apply.

## Resources

- [Actor and live input schema](https://apify.com/apivault_labs/website-leads-database)
- [Source repository](https://github.com/apivault-labs/n8n-nodes-apivault-shopify-finder)
- [n8n community-node documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT. The hosted Actor is a separate paid service governed by Apify terms.
