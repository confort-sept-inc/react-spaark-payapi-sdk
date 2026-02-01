# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-01

### Added

- **SpaarkPaySdkFinanceDashboard** component for transaction management
  - 5 KPI cards (Total Volume, Deposits, Payouts, Failed, Refunds)
  - Search functionality by transaction ID or phone number
  - Filters by transaction type and status
  - Paginated transactions table
  - Copy transaction ID feature
  - i18n support (French/English)
  - Customizable title via props
  - Expert Mode button integration
- `lucide-react` dependency for modern icons
- Changesets for automated versioning and changelog generation

### Changed

- Improved authentication flow and UI enhancements

## [1.0.0] - 2025-01-XX

### Added

- Initial release of Spaark PayAPI SDK
- **PawapayTestDashboard** component for SDK testing
- Core SDK modules:
  - Transactions (deposits, payouts, refunds)
  - Webhooks (verification, parsing)
  - Utils (provider prediction, availability check)
  - Finances (wallet balances, statements)
- Support for CEMAC region operators:
  - MTN Mobile Money (Cameroon, Congo, Gabon)
  - Orange Money (Cameroon)
  - Airtel Money (Congo, Gabon)
- TypeScript support with full type definitions
- Demo mode for testing without API key
