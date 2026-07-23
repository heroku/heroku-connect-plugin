# Changelog

## [0.13.0](https://github.com/heroku/heroku-connect-plugin/compare/heroku-connect-plugin-v0.12.3...heroku-connect-plugin-v0.13.0) (2026-07-22)


### ⚠ BREAKING CHANGES

* remove connect-events pilot commands and migrate to TypeScript ([#309](https://github.com/heroku/heroku-connect-plugin/issues/309))

### Features

* remove connect-events pilot commands and migrate to TypeScript ([#309](https://github.com/heroku/heroku-connect-plugin/issues/309)) ([99d2435](https://github.com/heroku/heroku-connect-plugin/commit/99d2435eabe128d8efaf0a7db67f7269e97066f7))

## [0.12.3](https://github.com/heroku/heroku-connect-plugin/compare/heroku-connect-plugin-v0.12.2...heroku-connect-plugin-v0.12.3) (2026-07-17)


### Dependencies

* bump @opentelemetry/core and @opentelemetry/sdk-trace-base ([#303](https://github.com/heroku/heroku-connect-plugin/issues/303)) ([833ac17](https://github.com/heroku/heroku-connect-plugin/commit/833ac17a6bb8b054b3e09e70bf566e7733d779fe))
* bump form-data from 4.0.5 to 4.0.6 ([#304](https://github.com/heroku/heroku-connect-plugin/issues/304)) ([98f0da4](https://github.com/heroku/heroku-connect-plugin/commit/98f0da41f4c0074c31fc6d6c3f6e52dea1d75e06))

## [0.12.2](https://github.com/heroku/heroku-connect-plugin/compare/heroku-connect-plugin-v0.12.1...heroku-connect-plugin-v0.12.2) (2026-06-09)


### Bug Fixes

* **deps:** bump axios from 1.15.2 to 1.16.0 ([#295](https://github.com/heroku/heroku-connect-plugin/issues/295)) ([937c36e](https://github.com/heroku/heroku-connect-plugin/commit/937c36ee6ea87198c33725b280c189d93edf0ad5))

## [0.12.1](https://github.com/heroku/heroku-connect-plugin/compare/heroku-connect-plugin-v0.12.0...heroku-connect-plugin-v0.12.1) (2026-05-11)


### Bug Fixes

* **deps:** bump axios from 1.13.6 to 1.15.0 ([#278](https://github.com/heroku/heroku-connect-plugin/issues/278)) ([acb5c3e](https://github.com/heroku/heroku-connect-plugin/commit/acb5c3edb5fc20bcf65d45c2a23e41d1b30b7ce1))
* **deps:** bump axios from 1.15.1 to 1.15.2 ([#289](https://github.com/heroku/heroku-connect-plugin/issues/289)) ([60deb4f](https://github.com/heroku/heroku-connect-plugin/commit/60deb4f1b566e7c33753852946af31fb67e75746))
* **deps:** bump fast-xml-builder from 1.1.4 to 1.2.0 ([#290](https://github.com/heroku/heroku-connect-plugin/issues/290)) ([03dea98](https://github.com/heroku/heroku-connect-plugin/commit/03dea98e3751c04ce3d5c79be9dd57f5c5cab7dc))
* **deps:** bump follow-redirects from 1.15.11 to 1.16.0 ([#281](https://github.com/heroku/heroku-connect-plugin/issues/281)) ([99365fa](https://github.com/heroku/heroku-connect-plugin/commit/99365face15ffdb63fb8e4b97c2b622c0a0795fa))
* **deps:** bump lodash from 4.17.23 to 4.18.1 ([#276](https://github.com/heroku/heroku-connect-plugin/issues/276)) ([df93fc3](https://github.com/heroku/heroku-connect-plugin/commit/df93fc3aebd4cec418ac772c8f5ddec4575bf95f))
* **deps:** bump the patch-dependencies group across 1 directory with 3 updates ([#282](https://github.com/heroku/heroku-connect-plugin/issues/282)) ([fc4d831](https://github.com/heroku/heroku-connect-plugin/commit/fc4d831abf807dcbe347323e9c231e92f62aaf5c))

## [0.12.0](https://github.com/heroku/heroku-connect-plugin/compare/heroku-connect-plugin-v0.11.5...heroku-connect-plugin-v0.12.0) (2026-03-18)


### ⚠ BREAKING CHANGES

* update to ESM + oclif4 ([#270](https://github.com/heroku/heroku-connect-plugin/issues/270))

### Features

* add a notifications command to list and ack notifications ([#247](https://github.com/heroku/heroku-connect-plugin/issues/247)) ([2dea230](https://github.com/heroku/heroku-connect-plugin/commit/2dea230c86d6657de7754a11a175e94f401b71e0))
* setup repo for migration to OClif & Typescript ([#205](https://github.com/heroku/heroku-connect-plugin/issues/205)) ([fcc47b5](https://github.com/heroku/heroku-connect-plugin/commit/fcc47b501a8fb61d993022b87f2ddb56d003939d))


### Bug Fixes

* 85 -- Remove --login flag from sf:auth command ([f0a02ce](https://github.com/heroku/heroku-connect-plugin/commit/f0a02cea0dd98b7eb2a4d27dfc008597afc65c57))
* address high security vulns reported by Dependabot ([#268](https://github.com/heroku/heroku-connect-plugin/issues/268)) ([bc90e06](https://github.com/heroku/heroku-connect-plugin/commit/bc90e061cfad4b1833f6c6bed1badd49945abed1))
* **deps:** bump lodash from 4.17.21 to 4.17.23 ([#251](https://github.com/heroku/heroku-connect-plugin/issues/251)) ([0d51b11](https://github.com/heroku/heroku-connect-plugin/commit/0d51b11a7d0ed821b442de196bcdd17147a3ca7e))
* **deps:** bump the patch-dependencies group across 1 directory with 3 updates ([#255](https://github.com/heroku/heroku-connect-plugin/issues/255)) ([0aa8591](https://github.com/heroku/heroku-connect-plugin/commit/0aa8591b3488aabd34cccd54f039e5539ae39369))
* update node version syntax ([c90e9f3](https://github.com/heroku/heroku-connect-plugin/commit/c90e9f3708c750bb1ab370011bf229bbc8e0e87f))
* update package.json to correct version ([#258](https://github.com/heroku/heroku-connect-plugin/issues/258)) ([50792ea](https://github.com/heroku/heroku-connect-plugin/commit/50792ea6183d2837308256cf7c6df98d0e7d2459))
* update release-please versions to correct one ([#259](https://github.com/heroku/heroku-connect-plugin/issues/259)) ([5f52b58](https://github.com/heroku/heroku-connect-plugin/commit/5f52b582cb4547ec0f7be1db72501348d3e35a85))
* update transitive dependency to fix high vuln ([#215](https://github.com/heroku/heroku-connect-plugin/issues/215)) ([9acd370](https://github.com/heroku/heroku-connect-plugin/commit/9acd370e20f88bb697a5534fe262a1c66a542b63))


### Miscellaneous Chores

* update to ESM + oclif4 ([#270](https://github.com/heroku/heroku-connect-plugin/issues/270)) ([3d957d2](https://github.com/heroku/heroku-connect-plugin/commit/3d957d26639fb8695ddaabd39125fa71dbebf569))
