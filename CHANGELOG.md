# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.2.0...v1.2.1) (2026-02-01)


### Documentation

* update README with SpaarkPaySdkFinanceDashboard ([f2ecca6](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/f2ecca624db346130aed4ffe38e26ad2ff57333f))

## 1.2.0 (2026-02-01)


### Features

* add SpaarkPaySdkFinanceDashboard and modernize SDK ([6b2d380](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/6b2d38091338d632d2ad86f239728a0e82f706b1))


### Tests

* add unit tests and pnpm push command ([0decc2d](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/0decc2d1c8497349521b82665e82acaf49b3362a))


### Build System

* **changelog:** add changesets for versioning ([88955bf](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/88955bfec5d155d18ad91be6a389546002fd02cc))
* switch to standard-version for auto versioning ([666ea1b](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/666ea1bf41552e05d23c0bfc840142b28ca2a1e9))

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
