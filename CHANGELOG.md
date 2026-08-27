# Changelog

## 0.2.0

- Migrate from the retired `shopify-store-finder` slug to `website-leads-database`.
- Replace legacy filters with the current Website Leads Database schema.
- Add platform/country selection, arbitrary column filters, output columns, sorting, pagination, count-only mode, and domain deduplication.
- Add asynchronous polling for stable long-running exports and an option to return run metadata immediately.
- Preserve the package and internal node names for upgrade compatibility.

## 0.1.0
- Initial release. Wraps Apify Actor `apivault_labs/shopify-store-finder`.
