# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.2](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v2.0.1...v2.0.2) (2026-02-16)


### Bug Fixes

* **http:** replace axios with native fetch to resolve url.parse() deprecation ([5f94164](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/5f94164834f244f22cb2298e549a7af4c7229340))

### [2.0.1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v2.0.0...v2.0.1) (2026-02-01)


### Bug Fixes

* **polling:** handle eventual consistency in pollUntilComplete ([38b20a5](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/38b20a5191718f6dd05eaed44bd3386cf7c929b3))

## [2.0.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.7.3...v2.0.0) (2026-02-01)


### ⚠ BREAKING CHANGES

* **bundle:** SpaarkPaySdkTestDashboard must now be imported from
'spaark-payapi-sdk/react' instead of 'spaark-payapi-sdk'

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### Bug Fixes

* **bundle:** separate React components from main entry point ([13750e8](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/13750e88af792d92bc62f27fd9dca2d82976f8be))

### [1.7.3](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.7.2...v1.7.3) (2026-02-01)


### Bug Fixes

* **charts:** use explicit height for ResponsiveContainer ([2724f54](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/2724f54138d9c7b284f8dbbd37a520bed78f349b))

### [1.7.2](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.7.1...v1.7.2) (2026-02-01)


### Refactoring

* **charts:** migrate to shadcn/ui chart pattern ([f45a8e5](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/f45a8e56f2ca7898f8e0ccbdf60bcfb75052fa51))

### [1.7.1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.7.0...v1.7.1) (2026-02-01)


### Bug Fixes

* **dashboard:** improve header UI and fix charts data display ([187f3ab](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/187f3ab3b25201669107237dd22e72ca3d5023a8))

## [1.7.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.6.1...v1.7.0) (2026-02-01)


### Features

* **dashboard:** add 4 operation modes and migrate to lucide-react icons ([2a555ae](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/2a555aede17c78fd5707ec1264f2cc151f7ab746))

### [1.6.1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.6.0...v1.6.1) (2026-02-01)


### Documentation

* **readme:** expand documentation with architecture and API reference ([a7a1374](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/a7a1374e3bc76bab4642fd769bb957bbf7adc4e8))

## [1.6.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.5.0...v1.6.0) (2026-02-01)


### Features

* **dashboard:** integrate @tanstack/react-table with shadcn/ui components ([5dfa145](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/5dfa145d8e89269ec5bf14fe242ec7ab062e0c3d))


### Documentation

* update README with shadcn/ui prerequisites and new features ([9283bb1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/9283bb1fcc2b011b295936d17fbc95ba4582b4b1))

## [1.5.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.4.0...v1.5.0) (2026-02-01)


### Features

* **dashboard:** add Charts tab with recharts and shadcn/ui components ([f940172](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/f940172cd3b459e2722269f18a8a2852f06a8c60))

## [1.4.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.3.1...v1.4.0) (2026-02-01)


### Features

* **dashboard:** redesign Finance Dashboard with 8 KPI cards ([870db0a](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/870db0a88981849f584ed67ceb7b2972d364fbe0))

### [1.3.1](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.3.0...v1.3.1) (2026-02-01)


### Bug Fixes

* **deps:** widen lucide-react peer dependency range ([2141d47](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/2141d4768957d228a316c15cf00b19e84d85de05))

## [1.3.0](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.2.2...v1.3.0) (2026-02-01)


### Features

* move clsx, tailwind-merge, class-variance-authority to dependencies ([be015cb](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/commit/be015cb68c3c8220b2c2ad7729c020f3a379a270))

### [1.2.2](https://github.com/confort-sept-inc/react-spaark-payapi-sdk/compare/v1.2.1...v1.2.2) (2026-02-01)

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
