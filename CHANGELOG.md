# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.1](https://github.com/mrwogu/promptscript/compare/v1.11.0...v1.11.1) (2026-04-07)


### Bug Fixes

* **resolver:** apply aliased [@extend](https://github.com/extend) to surviving merged block ([#230](https://github.com/mrwogu/promptscript/issues/230)) ([7700900](https://github.com/mrwogu/promptscript/commit/7700900afae16768c1814512e3080180e89b455d))

## [1.11.0](https://github.com/mrwogu/promptscript/compare/v1.10.0...v1.11.0) (2026-04-07)


### Features

* **cli:** overlay-aware skill suggestions in prs init ([#215](https://github.com/mrwogu/promptscript/issues/215)) ([5c4f4d6](https://github.com/mrwogu/promptscript/commit/5c4f4d67c46b5cf76b55f8d49e4fa646a61cd1b2))
* **cli:** prs inspect --layers for debugging skill composition ([#213](https://github.com/mrwogu/promptscript/issues/213)) ([71ff860](https://github.com/mrwogu/promptscript/commit/71ff8608f16efef22f10403401cc897d36902b9a))
* **playground:** add overlay/sealed gallery examples and compile test ([2cf09bb](https://github.com/mrwogu/promptscript/commit/2cf09bb63d8eab34bb08d0ac3f18049de546c991))
* **playground:** add skill composition example to gallery ([09cde5b](https://github.com/mrwogu/promptscript/commit/09cde5b12d97204df133ae59efa3936c75a4c024))
* **resolver:** integrity hashes in lockfile for registry references ([#225](https://github.com/mrwogu/promptscript/issues/225)) ([5ef239b](https://github.com/mrwogu/promptscript/commit/5ef239b680470ef0128c2cb75656cd084e119ebb))
* **resolver:** reference negation syntax for skill extensions ([#211](https://github.com/mrwogu/promptscript/issues/211)) ([ab8f33d](https://github.com/mrwogu/promptscript/commit/ab8f33d3786a1d0b7d564d04e7d8b0dd99b1c4f9))
* **resolver:** sealed property to prevent content override by higher layers ([#212](https://github.com/mrwogu/promptscript/issues/212)) ([b709f48](https://github.com/mrwogu/promptscript/commit/b709f484fbd8bd15fecc9498487033b3bec76092))
* **resolver:** semantic base/overlay validation warnings ([#227](https://github.com/mrwogu/promptscript/issues/227)) ([302e271](https://github.com/mrwogu/promptscript/commit/302e271222b45ff12105266f5eac5694dace385e))
* skill composition — import sub-skills within a skill ([#200](https://github.com/mrwogu/promptscript/issues/200)) ([#201](https://github.com/mrwogu/promptscript/issues/201)) ([4dc6bf2](https://github.com/mrwogu/promptscript/commit/4dc6bf2c1d493e95e5ead14b5ad32140d329b8a2))
* **validator:** policy engine for extension compliance validation ([#222](https://github.com/mrwogu/promptscript/issues/222)) ([b175f60](https://github.com/mrwogu/promptscript/commit/b175f60bf1ae2430fba8d0188e61068c1e674957))


### Bug Fixes

* **browser-compiler:** apply only/exclude reserved params on [@use](https://github.com/use) imports ([d7388f4](https://github.com/mrwogu/promptscript/commit/d7388f4d2211682c81c4272e465422ae9a85fc6e))
* **cli:** wire up skill suggestions in prs init ([#216](https://github.com/mrwogu/promptscript/issues/216)) ([eeef0d4](https://github.com/mrwogu/promptscript/commit/eeef0d44c471f998676d48958e0cfefc10032de1))
* **docs:** skip unsupported syntax in docs validator ([#220](https://github.com/mrwogu/promptscript/issues/220)) ([5827c38](https://github.com/mrwogu/promptscript/commit/5827c3814ae39ef396bf65569ee938657d7f1a30))
* **resolver:** cross-platform path traversal check for relative [@use](https://github.com/use) ([#224](https://github.com/mrwogu/promptscript/issues/224)) ([0f06f8c](https://github.com/mrwogu/promptscript/commit/0f06f8c909c6f4c6d880f121017940a4b23a4132))

## [1.10.0](https://github.com/mrwogu/promptscript/compare/v1.9.0...v1.10.0) (2026-03-30)


### Features

* add [@examples](https://github.com/examples) block and [@requires](https://github.com/requires) guard dependencies ([#186](https://github.com/mrwogu/promptscript/issues/186)) ([df1b1e1](https://github.com/mrwogu/promptscript/commit/df1b1e1bb3d2a2238581e7f81d649b5daec17a83))
* skill overlay/extends - references property and skill-aware [@extend](https://github.com/extend) ([#198](https://github.com/mrwogu/promptscript/issues/198)) ([67d9a5f](https://github.com/mrwogu/promptscript/commit/67d9a5fc87e09c870bfbe2d0cd54488d958863f9))


### Bug Fixes

* **cli:** prs lock discovers [@use](https://github.com/use) github.com imports from .prs files ([#185](https://github.com/mrwogu/promptscript/issues/185)) ([b0303df](https://github.com/mrwogu/promptscript/commit/b0303df63db516061d7833769a91d449acff1166))

## [1.9.0](https://github.com/mrwogu/promptscript/compare/v1.8.3...v1.9.0) (2026-03-27)


### Features

* **resolver:** add extractReservedParams and filterBlocks for [@use](https://github.com/use) filtering ([1c2dfaf](https://github.com/mrwogu/promptscript/commit/1c2dfaf8770cda3a9a2dfb00960e103e89086892))
* **resolver:** integrate block filtering into [@use](https://github.com/use) resolution pipeline ([08a84ee](https://github.com/mrwogu/promptscript/commit/08a84ee3e7a2fd69e9567b85ade84d0d2d528c39))
* **validator:** add PS021 use-block-filter validation rule ([97dd8ea](https://github.com/mrwogu/promptscript/commit/97dd8eae739c597cdc1aa44b857da99f31824071))
* **vscode:** add VS Code extension with syntax highlighting ([#184](https://github.com/mrwogu/promptscript/issues/184)) ([1f09f48](https://github.com/mrwogu/promptscript/commit/1f09f48936d6967f85b55c2ca109b2106b1fcf39))


### Bug Fixes

* **cli:** respect --force flag for unchanged files during compilation ([#180](https://github.com/mrwogu/promptscript/issues/180)) ([6cab45b](https://github.com/mrwogu/promptscript/commit/6cab45b8a98c4feb553fbd08a62f28124b3e1d2c))
* **docs:** add missing block keywords to Pygments lexer ([4074d0a](https://github.com/mrwogu/promptscript/commit/4074d0abef1d37d45cb258dec3befcb160606a33))
* **resolver:** skip SKILL.md in command auto-discovery to prevent phantom /SKILL shortcut ([9da9a0a](https://github.com/mrwogu/promptscript/commit/9da9a0a4f93d0cfa144b85ad05942f0a475a2de0))
* **vscode:** publish extension only on release tags and resolve name collision ([a9d623a](https://github.com/mrwogu/promptscript/commit/a9d623a7bdeca569f60ff8179ee5d8cd8c0d0f06))

## [1.8.3](https://github.com/mrwogu/promptscript/compare/v1.8.2...v1.8.3) (2026-03-26)


### Bug Fixes

* **compiler:** use relative paths in generated file markers ([#178](https://github.com/mrwogu/promptscript/issues/178)) ([8fdeaea](https://github.com/mrwogu/promptscript/commit/8fdeaea35630c44410b448708df6e69662e9da5a))

## [1.8.2](https://github.com/mrwogu/promptscript/compare/v1.8.1...v1.8.2) (2026-03-26)


### Bug Fixes

* **validator:** accept domain-based registry paths in PS006 ([0a76a37](https://github.com/mrwogu/promptscript/commit/0a76a373059eea654d1cd3052c3c2cb82f37d490))

## [1.8.1](https://github.com/mrwogu/promptscript/compare/v1.8.0...v1.8.1) (2026-03-26)


### Bug Fixes

* **cli:** validate remote repo before writing lockfile in skills add ([c9aa94d](https://github.com/mrwogu/promptscript/commit/c9aa94d94b713db4162c4586819ed0c3b67fa6a1))
* **formatters:** pass-through raw frontmatter from source SKILL.md ([5b37394](https://github.com/mrwogu/promptscript/commit/5b3739424e9473a913e6a7e1c6a9d191cf437780))
* **resolver:** add validateRemoteAccess for pre-clone repo validation ([c162c83](https://github.com/mrwogu/promptscript/commit/c162c8345c0dc853a3c2da9ee9e0540fc0ffb8bd))
* **resolver:** capture raw frontmatter in parseSkillMd ([23401a6](https://github.com/mrwogu/promptscript/commit/23401a6418cb5709aac2ccd7155650d7d2ba45f4))
* **resolver:** pipe raw frontmatter through resolveNativeSkills ([ac79f69](https://github.com/mrwogu/promptscript/commit/ac79f6902685710b148f987dc28de6b7bb1682fd))
* **resolver:** recognize root-level SKILL.md in directory discovery ([632a048](https://github.com/mrwogu/promptscript/commit/632a0483c02920c11d2cb78f65fbe8132aad19ab))

## [1.8.0](https://github.com/mrwogu/promptscript/compare/v1.7.1...v1.8.0) (2026-03-26)


### Features

* support markdown file imports via [@use](https://github.com/use) directive ([#171](https://github.com/mrwogu/promptscript/issues/171)) ([64211ea](https://github.com/mrwogu/promptscript/commit/64211ead56d1dcc1a01aa4a876b14fedf272508c))

## [1.7.1](https://github.com/mrwogu/promptscript/compare/v1.7.0...v1.7.1) (2026-03-25)


### Bug Fixes

* **cli:** add yaml to ignoredDependencies in eslint config ([52512b8](https://github.com/mrwogu/promptscript/commit/52512b8a214df78b8f996cbbe2d4c01137df7866))
* **formatters:** preserve argument-hint in skill SKILL.md frontmatter ([2313aaf](https://github.com/mrwogu/promptscript/commit/2313aaf72f478e70b0585b2165794a006951e217))

## [1.7.0](https://github.com/mrwogu/promptscript/compare/v1.6.1...v1.7.0) (2026-03-25)


### Features

* **core:** add guardsAsSkills and guardsSkillsListing to TargetConfig ([f0099fb](https://github.com/mrwogu/promptscript/commit/f0099fb065a97a2d77fa579df2a4613c721bcb88))
* **formatters:** add [@guards](https://github.com/guards) named entries support to Cursor formatter ([a1d4901](https://github.com/mrwogu/promptscript/commit/a1d49018479627f666a01016457e0ef0e2be37d8))
* **formatters:** generate Factory skills from [@guards](https://github.com/guards) named entries ([f7972d1](https://github.com/mrwogu/promptscript/commit/f7972d10472ff8027cdb645f98e7671605495ea0))
* **importer:** import instruction files with applyTo as [@guards](https://github.com/guards) entries ([acacc41](https://github.com/mrwogu/promptscript/commit/acacc41a81b4210385f6bef92f56d1f578b6863f))
* **resolver:** recursive skill discovery in .promptscript/skills/ ([#162](https://github.com/mrwogu/promptscript/issues/162)) ([63c2e9f](https://github.com/mrwogu/promptscript/commit/63c2e9f38901a2a6e94288d18db4431a82fcbc94))


### Bug Fixes

* **formatters:** replace glob heuristic with standards-driven categorization ([#168](https://github.com/mrwogu/promptscript/issues/168)) ([939c4c6](https://github.com/mrwogu/promptscript/commit/939c4c6866617234c007356a23c3193cd702a455))
* **validator:** skip fenced code blocks in PS011 authority injection check ([0f03a62](https://github.com/mrwogu/promptscript/commit/0f03a62d81df72043c506f6bc835833f0447929f))

## [1.6.1](https://github.com/mrwogu/promptscript/compare/v1.6.0...v1.6.1) (2026-03-25)


### Bug Fixes

* **cli:** use portable prs path in hooks and detect missing stdin ([#160](https://github.com/mrwogu/promptscript/issues/160)) ([d0b7d4e](https://github.com/mrwogu/promptscript/commit/d0b7d4e03826cb69623afdaac3be03d538c3e6a7))

## [1.6.0](https://github.com/mrwogu/promptscript/compare/v1.5.1...v1.6.0) (2026-03-24)


### Features

* **cli:** add auto-compilation hooks for AI tools ([#158](https://github.com/mrwogu/promptscript/issues/158)) ([d5c5eb0](https://github.com/mrwogu/promptscript/commit/d5c5eb072ca5c9a9890eee67f6326a240f986dbe))

## [1.5.1](https://github.com/mrwogu/promptscript/compare/v1.5.0...v1.5.1) (2026-03-24)


### Bug Fixes

* **compiler:** suppress spurious PS4001 warning for same-formatter skill collision ([28062ce](https://github.com/mrwogu/promptscript/commit/28062ce32733cdf4fc0c25a7bfcc0dbb7247c28a))

## [1.5.0](https://github.com/mrwogu/promptscript/compare/v1.4.7...v1.5.0) (2026-03-23)


### Features

* **cli:** compiler safety and output conflict detection ([145735a](https://github.com/mrwogu/promptscript/commit/145735aebd3dafd2a69618a0f30e0e1550fdadea))
* **cli:** intelligent prs init with inline migration flow ([#147](https://github.com/mrwogu/promptscript/issues/147)) ([30ce56d](https://github.com/mrwogu/promptscript/commit/30ce56da9401dfbfc00d635756e7e141f33b2a9f))
* **core:** native registry resolver with Go-style imports and auto-discovery ([#153](https://github.com/mrwogu/promptscript/issues/153)) ([dab580e](https://github.com/mrwogu/promptscript/commit/dab580e4d4bb3cd9791c1122f6318703a9a5cbc2))
* **resolver:** auto-discover agent files from local and universal directories ([2af1b8e](https://github.com/mrwogu/promptscript/commit/2af1b8edcb098292a14703b0a8d4378b0c10b182))
* **resolver:** auto-discover agent files from local and universal directories ([8debcda](https://github.com/mrwogu/promptscript/commit/8debcdae2bd46df226397880419de4f15534e54f))
* syntax version validation, upgrade command, and unknown block detection ([#146](https://github.com/mrwogu/promptscript/issues/146)) ([a0cfd99](https://github.com/mrwogu/promptscript/commit/a0cfd9962b7ff626add4c3cf06d42be54dbc354d))


### Bug Fixes

* **cli:** address review feedback for compiler safety ([10871ce](https://github.com/mrwogu/promptscript/commit/10871ce440f22e405e216615103ef64ff68b9ac4))
* **formatters:** serialize agent tools as YAML inline array in Claude formatter ([a1e4616](https://github.com/mrwogu/promptscript/commit/a1e46168edcf72beff99b69b6ceefe2e58277f28))
* **resolver:** address review feedback for agent discovery ([cfbc222](https://github.com/mrwogu/promptscript/commit/cfbc222e9af7a82838226c23d51cf918fefb5c73))

## [1.4.7](https://github.com/mrwogu/promptscript/compare/v1.4.6...v1.4.7) (2026-03-20)


### Bug Fixes

* **cli:** export importCommand from main index.ts ([b24399b](https://github.com/mrwogu/promptscript/commit/b24399b430d7918ac939615fee0132b9fb37f727))
* **formatters:** fix type assertion in registerFormatter for overload resolution ([5ebbba7](https://github.com/mrwogu/promptscript/commit/5ebbba72687d3cfee37b4e05b5783efb3764278e))

## [1.4.6](https://github.com/mrwogu/promptscript/compare/v1.4.5...v1.4.6) (2026-03-20)


### Bug Fixes

* **formatters:** add knowledgeContent to GitHub, fix Antigravity restrictions + tech stack fallback ([a5341c0](https://github.com/mrwogu/promptscript/commit/a5341c0bd9ea44cc90750f4bba9d2033e8480990))
* **formatters:** add missing knowledgeContent to Cursor and Antigravity formatters ([654094f](https://github.com/mrwogu/promptscript/commit/654094fae9d8d9c876dec046dbfc9224d9ce295f))
* **formatters:** render [@knowledge](https://github.com/knowledge) content in Claude formatter output ([ac53ff1](https://github.com/mrwogu/promptscript/commit/ac53ff137a0124f9e842348d26227fc50f312c8c))

## [1.4.5](https://github.com/mrwogu/promptscript/compare/v1.4.4...v1.4.5) (2026-03-19)


### Bug Fixes

* **compiler:** use YAML marker in frontmatter for Factory AI compatibility ([#138](https://github.com/mrwogu/promptscript/issues/138)) ([3f76ac4](https://github.com/mrwogu/promptscript/commit/3f76ac4eed8086a61e58b690debdad91fe079930))
* **importer,cli:** classify preamble as [@identity](https://github.com/identity) and add entry to init config ([#139](https://github.com/mrwogu/promptscript/issues/139)) ([f414bf3](https://github.com/mrwogu/promptscript/commit/f414bf3d9c22554e9c0ca5e63179300fbe4c1198))

## [1.4.4](https://github.com/mrwogu/promptscript/compare/v1.4.3...v1.4.4) (2026-03-19)


### Bug Fixes

* **validator:** PS011 false positive on "follow exactly" without "instructions" ([f118bc3](https://github.com/mrwogu/promptscript/commit/f118bc33baa1b3c2e345438d2489184ed4e91c3f))

## [1.4.3](https://github.com/mrwogu/promptscript/compare/v1.4.2...v1.4.3) (2026-03-18)


### Bug Fixes

* **validator,playground:** PS011 false positive on bare Override and playground reconnect loop ([26bd838](https://github.com/mrwogu/promptscript/commit/26bd838116a906338bbbbf402d2a7ab793f32a9d))

## [1.4.2](https://github.com/mrwogu/promptscript/compare/v1.4.1...v1.4.2) (2026-03-18)


### Bug Fixes

* **cli:** bundle @promptscript/server into CLI for global install ([99e2454](https://github.com/mrwogu/promptscript/commit/99e24542af9812d97b71887f2c1c03f59a33e098))

## [1.4.1](https://github.com/mrwogu/promptscript/compare/v1.4.0...v1.4.1) (2026-03-18)


### Bug Fixes

* **ci:** prevent docs deploy race by combining tag and dev deploys ([ec568af](https://github.com/mrwogu/promptscript/commit/ec568af031c6ced627ce34ae9d00751e7d121a34))
* **cli:** increase marker scan window for SKILL.md detection ([8409dd6](https://github.com/mrwogu/promptscript/commit/8409dd650483a27dc21e3e5ad47eda86157340b2))

## [1.4.0](https://github.com/mrwogu/promptscript/compare/v1.3.1...v1.4.0) (2026-03-18)


### Features

* add prs import command for reverse-parsing AI instructions ([#113](https://github.com/mrwogu/promptscript/issues/113)) ([fae14fd](https://github.com/mrwogu/promptscript/commit/fae14fdd9a5915ac55f97bea7a5c72bde5471f13))
* auto-inject PromptScript SKILL.md during compilation ([#103](https://github.com/mrwogu/promptscript/issues/103)) ([6350741](https://github.com/mrwogu/promptscript/commit/6350741f0b9d40b2d3656688d98ad64c4655c840))
* **docs:** add scrolling agent ticker to homepage hero ([#127](https://github.com/mrwogu/promptscript/issues/127)) ([d4c3361](https://github.com/mrwogu/promptscript/commit/d4c336180ed940d4c3a50852f02237957fb4d63c))
* **formatters:** 37-platform AI agent compatibility ([#124](https://github.com/mrwogu/promptscript/issues/124)) ([97d3870](https://github.com/mrwogu/promptscript/commit/97d3870f7ceded9fb146d18d2dbeea020a28f0f6))
* **formatters:** add git scope field to all formatters ([8788026](https://github.com/mrwogu/promptscript/commit/878802614508d426d80c0969821d4039e60ec84f))
* **formatters:** add llms.txt generation and formatter documentation pages ([#125](https://github.com/mrwogu/promptscript/issues/125)) ([667f4c9](https://github.com/mrwogu/promptscript/commit/667f4c91ecb3a6031c9b24937f8db098cf3c651e))
* **formatters:** change default version from simple to full ([#111](https://github.com/mrwogu/promptscript/issues/111)) ([57b98e7](https://github.com/mrwogu/promptscript/commit/57b98e7faf89c9ca7c85e44a2372a63b3b059c07))
* parameterized skills with template interpolation ([#114](https://github.com/mrwogu/promptscript/issues/114)) ([cf8bb4c](https://github.com/mrwogu/promptscript/commit/cf8bb4c29d11655cb612a1258c8dba43591d0b5c))
* self-hosted playground via prs serve command ([#108](https://github.com/mrwogu/promptscript/issues/108)) ([396e5ab](https://github.com/mrwogu/promptscript/commit/396e5ab17b47bce67343aad37a5a423587cf2184))
* skill folders with shared resources and skill contracts ([#117](https://github.com/mrwogu/promptscript/issues/117)) ([12a30ac](https://github.com/mrwogu/promptscript/commit/12a30ac8fe065f90dab4f414e74ce10e39a1baa3))


### Bug Fixes

* **ci:** add include-component-in-tag to prevent tag mismatch ([0020c63](https://github.com/mrwogu/promptscript/commit/0020c639aca3b238a02e959b1a223ca00726864e))
* **ci:** copy llms.txt from build output instead of deleted source file ([e1c3c4a](https://github.com/mrwogu/promptscript/commit/e1c3c4a8df9703b002075a4c6656e7af6e3806e7))
* **cli:** sanitize registry init directory names and detect empty CWD ([#126](https://github.com/mrwogu/promptscript/issues/126)) ([a78c8a8](https://github.com/mrwogu/promptscript/commit/a78c8a838e5857a9247f38f6bf0d0d6695338844))
* **cli:** show all supported targets in prs init ([#112](https://github.com/mrwogu/promptscript/issues/112)) ([620097c](https://github.com/mrwogu/promptscript/commit/620097ce698946dc17fd26c2a6f8a92d111be33d))
* **docker:** add missing importer package to Dockerfile workspace setup ([43cc4ca](https://github.com/mrwogu/promptscript/commit/43cc4ca06567691e7048201c30354afe311fbe74))

## [Unreleased]

## [1.3.1](https://github.com/mrwogu/promptscript/compare/v1.3.0...v1.3.1) (2026-03-13)


### Bug Fixes

* init config schema, migrate flow, and skill consolidation ([#100](https://github.com/mrwogu/promptscript/issues/100)) ([af6fb5f](https://github.com/mrwogu/promptscript/commit/af6fb5f2deb8984ba6545a68c6398a20b1d8ab85))

## [1.3.0](https://github.com/mrwogu/promptscript/compare/v1.2.0...v1.3.0) (2026-03-11)


### Features

* **formatters:** add mixed models support per agent/droid ([939f75a](https://github.com/mrwogu/promptscript/commit/939f75ac4d8beb2e823007826c2e266ab5c7380b))

## [1.2.0](https://github.com/mrwogu/promptscript/compare/v1.1.0...v1.2.0) (2026-03-11)


### Features

* **formatters:** add Factory AI droids support (.factory/droids/) ([#94](https://github.com/mrwogu/promptscript/issues/94)) ([e7f9292](https://github.com/mrwogu/promptscript/commit/e7f929273254738b2de5334f26136c8374aedc7b))


### Bug Fixes

* **cli:** handle skill resource files without PromptScript markers ([#92](https://github.com/mrwogu/promptscript/issues/92)) ([3153498](https://github.com/mrwogu/promptscript/commit/315349865335cc1013b5c60d5c418885bf6467f8))

## [1.1.0](https://github.com/mrwogu/promptscript/compare/v1.0.0...v1.1.0) (2026-03-11)


### Features

* add Factory AI, OpenCode, and Gemini CLI compilation targets ([9c206af](https://github.com/mrwogu/promptscript/commit/9c206af40fe35412b948b1a32d9fec8b309e3c91))
* add root SKILL.md as canonical source with sync pipeline ([#75](https://github.com/mrwogu/promptscript/issues/75)) ([cc76023](https://github.com/mrwogu/promptscript/commit/cc76023eaea92318303081dcd439ae3185b1bbe0))
* **cli:** enterprise registry redesign ([#74](https://github.com/mrwogu/promptscript/issues/74)) ([a1ce2ca](https://github.com/mrwogu/promptscript/commit/a1ce2cad2a80d902e380907dd5b1c474952f8b6f))
* new formatters ([#78](https://github.com/mrwogu/promptscript/issues/78)) ([b30585a](https://github.com/mrwogu/promptscript/commit/b30585ae483a3c02b690ab8755ccd44f9cf355a7))


### Bug Fixes

* **cli:** include skills in build assets and update CI smoke tests ([62d8d0b](https://github.com/mrwogu/promptscript/commit/62d8d0bbc86f02ad11424110fb7bf2215dd80299))

## [1.0.0](https://github.com/mrwogu/promptscript/compare/v1.0.0-rc.3...v1.0.0) (2026-03-06)


### chore

* prepare release ([d751e4b](https://github.com/mrwogu/promptscript/commit/d751e4bd7bc82d834766980bb0eba71dfd7bf92f))

## [1.0.0-rc.3](https://github.com/mrwogu/promptscript/compare/v1.0.0-rc.2...v1.0.0-rc.3) (2026-02-03)


### chore

* prepare rc release ([5a6a707](https://github.com/mrwogu/promptscript/commit/5a6a707b2d30735729f6cb7a64e97722cb66e05d))


### Features

* **validator:** add security rules for supply chain injection detection ([5802a2f](https://github.com/mrwogu/promptscript/commit/5802a2f7d258fd6577d30d76d9ae1d1ce31ef123))

## [1.0.0-rc.2](https://github.com/mrwogu/promptscript/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2026-02-01)


### chore

* prepare rc release ([87b9a04](https://github.com/mrwogu/promptscript/commit/87b9a0494e2c220c0c9cc226fc751c09613494ea))

## [1.0.0-rc.1](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.10...v1.0.0-rc.1) (2026-02-01)


### chore

* prepare rc release ([756f820](https://github.com/mrwogu/promptscript/commit/756f82096a2a511e6a88aa3b45a56c92c3fab68c))

## [1.0.0-alpha.10](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2026-01-31)


### chore

* prepare alpha release ([c6595b6](https://github.com/mrwogu/promptscript/commit/c6595b6fd639f93f0093c503e8468fbbbf057cf9))

## [1.0.0-alpha.9](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2026-01-30)


### chore

* prepare alpha release ([ce96d95](https://github.com/mrwogu/promptscript/commit/ce96d954ae0a015689dda443effc7e80ce80dec5))


### Features

* **docs:** add interactive terminal demos to homepage and getting started ([b2f781b](https://github.com/mrwogu/promptscript/commit/b2f781b45d57862026e5c8ab8cb4525ccacbbd15))


### Bug Fixes

* **cli:** correct version detection in bundled package ([28c15a2](https://github.com/mrwogu/promptscript/commit/28c15a2622c92e99051854868a45825cbedf80cc))
* **cli:** use universal migration hint instead of Claude Code specific ([ff2e731](https://github.com/mrwogu/promptscript/commit/ff2e731371840b95ed2378755ff431399903c3c2))

## [1.0.0-alpha.8](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) (2026-01-30)


### chore

* prepare alpha release ([7b1fe19](https://github.com/mrwogu/promptscript/commit/7b1fe197b1ddc9b0fec87c407f557fbaa67113fd))

## [1.0.0-alpha.7](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2026-01-28)


### chore

* prepare alpha release ([9f2f1ed](https://github.com/mrwogu/promptscript/commit/9f2f1ed61923048312206118ff1e0a10679f9899))


### Features

* **cli:** add registry manifest support for init command ([790ae31](https://github.com/mrwogu/promptscript/commit/790ae312bfef2cb80a74feb6ccbb334f15a3985b))

## [1.0.0-alpha.6](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2026-01-28)


### chore

* prepare alpha release ([970c1c8](https://github.com/mrwogu/promptscript/commit/970c1c8c6bc2ebdc4a508314ce7c9c38ddc10a6d))


### Features

* **cli:** add --migrate flag to init command for AI-assisted migration ([3e567c6](https://github.com/mrwogu/promptscript/commit/3e567c606ddff779b841f76615a2aac93e35dec3))


### Bug Fixes

* **cli:** skip writing unchanged files during compilation ([8542512](https://github.com/mrwogu/promptscript/commit/854251214d927dd5f5dea0aea04a65e0f96819a2))

## [1.0.0-alpha.5](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2026-01-27)


### chore

* prepare alpha release ([54696c9](https://github.com/mrwogu/promptscript/commit/54696c93e27cf9fc2f09dd730b09e568d0dc425e))


### Features

* **cli:** add AI-assisted migration skill and CLI integration ([53e9cca](https://github.com/mrwogu/promptscript/commit/53e9cca8669a30e787cbc2aa7679bb63f7896fce))
* **cli:** add verbose and debug logging throughout compilation pipeline ([36bd63a](https://github.com/mrwogu/promptscript/commit/36bd63a2fa1dde1acbfd0794bb174f645ef71335))


### Bug Fixes

* **cli:** add migrationCandidates to test mocks ([d8fe117](https://github.com/mrwogu/promptscript/commit/d8fe117ff5523bb5b1c15996e00d8c24548c7b8f))
* **cli:** extend marker detection from 10 to 20 lines ([229e9bc](https://github.com/mrwogu/promptscript/commit/229e9bc5bf4d0441c9674e6483a5125347b6f0b8))

## [1.0.0-alpha.4](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2026-01-27)


### ⚠ BREAKING CHANGES

* **compiler:** Generated files now have compact marker instead of verbose header. Existing files with legacy marker still recognized.

### chore

* prepare alpha release ([8c3a428](https://github.com/mrwogu/promptscript/commit/8c3a428856bc088fb27a4fdd6a16185fe5e63589))


### Features

* **compiler:** add compact PromptScript marker to all outputs ([6d74480](https://github.com/mrwogu/promptscript/commit/6d744800a4ab38030b6c23b2ab949c79977ab12e))

## [1.0.0-alpha.3](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2026-01-27)


### chore

* prepare alpha release ([8bb0fb2](https://github.com/mrwogu/promptscript/commit/8bb0fb2e643566af2fed08a5cd7bc17420c4dd96))


### Features

* **cli:** add file overwrite protection for prs compile ([9213a1d](https://github.com/mrwogu/promptscript/commit/9213a1d6edecff54333c65226a2ede8ff20ae417))
* **formatting:** add dynamic Prettier configuration support ([c7ceca1](https://github.com/mrwogu/promptscript/commit/c7ceca13928df3449d3ac9f16b1c4749cc48dc2f))

## [1.0.0-alpha.2](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2026-01-24)


### chore

* prepare alpha.2 release ([449fbcc](https://github.com/mrwogu/promptscript/commit/449fbccc119d34ab2a674cbfcd8cc4cc3012d108))


### Bug Fixes

* **cli:** resolve ESM dynamic require error for simple-git ([748a401](https://github.com/mrwogu/promptscript/commit/748a401377b5b58dff1935b94543f65f11f5360c))
* **formatters:** read devCommands and postWork from [@knowledge](https://github.com/knowledge) block ([83a2727](https://github.com/mrwogu/promptscript/commit/83a272707bf3550142ae440f1a595657bb5704e9))
* sync package.publish.json keywords and description ([ae7481f](https://github.com/mrwogu/promptscript/commit/ae7481fe64639420ba38fc98ea1349bca17cb91d))

## [1.0.0-alpha.1](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.1...v1.0.0-alpha.1) (2026-01-23)


### ⚠ BREAKING CHANGES

* All packages now use ES Modules. Consumers must use ESM imports.
* All packages now use ES Modules. Consumers must use ESM imports.

### chore

* prepare alpha.1 release ([01bb952](https://github.com/mrwogu/promptscript/commit/01bb952a967566c0dcd61b80eec2119c06966167))


### refactor

* migrate to pure ESM ([72d0333](https://github.com/mrwogu/promptscript/commit/72d0333580c688c617831885c13a270619817d5b))
* migrate to pure ESM ([8a59387](https://github.com/mrwogu/promptscript/commit/8a59387d6f81ee9db33c46db8e737fe52e705c2e))


### Features

* cli ([d6cfb7c](https://github.com/mrwogu/promptscript/commit/d6cfb7c5ee7262fcfb63f3ee79333fadfb39ee34))
* **cli/diff:** support pager ([c5133f7](https://github.com/mrwogu/promptscript/commit/c5133f7a58f0f03323c8fa925387178e823d9415))
* **cli:** add Antigravity to AI tool detection ([809d055](https://github.com/mrwogu/promptscript/commit/809d055d9b9308059306c6dd8d5893ecdfe8f3b5))
* **cli:** add chokidar watch mode and --registry flag ([afe30a9](https://github.com/mrwogu/promptscript/commit/afe30a93171ae2f08ea3d022b30a1356deca0627))
* **cli:** add Codecov bundle analysis ([b93568f](https://github.com/mrwogu/promptscript/commit/b93568f81835dd62517ff5f290687dd5ef9cb4da))
* **cli:** force init ([5275c14](https://github.com/mrwogu/promptscript/commit/5275c14b9559f16cbc1b4aecf2f8edcf520e51ff))
* **core:** config schema ([2692b4d](https://github.com/mrwogu/promptscript/commit/2692b4d51e1fb20c4df35b5ce6b8264369910bcb))
* **formatters:** copilot agents support ([886f6fc](https://github.com/mrwogu/promptscript/commit/886f6fca9d0a7cd276997a31e62618ef0153322f))
* interactive cli init ([3f77d28](https://github.com/mrwogu/promptscript/commit/3f77d28c1f7644cb9c0620ab4b9f94c01d1ea243))
* **resolver:** add Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))
* support conventions ([3ccea55](https://github.com/mrwogu/promptscript/commit/3ccea55eb92e3374a2613bbf975c7b4cae80fcf5))


### Bug Fixes

* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))

## [1.0.0-alpha.1](https://github.com/mrwogu/promptscript/compare/v1.0.0-alpha.0...v1.0.0-alpha.1) (2026-01-23)


### Features

* **cli:** add Antigravity to AI tool detection ([809d055](https://github.com/mrwogu/promptscript/commit/809d055d9b9308059306c6dd8d5893ecdfe8f3b5))
* **resolver:** add Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))


### Bug Fixes

* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))


### Miscellaneous Chores

* prepare alpha.1 release ([01bb952](https://github.com/mrwogu/promptscript/commit/01bb952a967566c0dcd61b80eec2119c06966167))

## [1.0.0-alpha.0] - 2026-01-22

### Added

🎉 **PromptScript Language Implementation** - A language for standardizing AI instructions across organizations.

#### Language Features

- **PromptScript Syntax 1.0.0** - Initial language specification for `.prs` files
- **@meta block** - Metadata with `id` and `syntax` fields, optional `org`, `team`, `tags`
- **@inherit directive** - Single inheritance from registry namespaces or relative paths
- **@use directive** - Import fragments for composition with optional aliasing
- **@extend block** - Modify inherited blocks at any nesting level
- **Content blocks:**
  - `@identity` - AI persona definition
  - `@context` - Project context with key-value properties and text
  - `@standards` - Coding standards with nested objects (merged during inheritance)
  - `@restrictions` - Things AI should avoid (concatenated during inheritance)
  - `@shortcuts` - Custom commands (child overrides parent)
  - `@params` - Configurable parameters with types and defaults
  - `@guards` - Validation rules with `globs` for file targeting
  - `@skills` - Reusable AI workflows with tool permissions
  - `@local` - Private instructions (not committed to git)
  - `@knowledge` - Reference documentation
- **Value types:** Strings, numbers, booleans, null, arrays, objects, multi-line text (`"""`)
- **Type expressions:** `range(min..max)`, `enum("a", "b", "c")`

#### Formatters

- **GitHub Copilot** - `simple`, `multifile`, `full` versions with agents support (`.github/copilot-instructions.md`, `.github/agents/`, `.github/skills/`)
- **Claude Code** - `simple`, `multifile`, `full` versions with local memory support (`CLAUDE.md`, `.claude/agents/`, `.claude/skills/`, `CLAUDE.local.md`)
- **Cursor** - `modern`, `multifile`, `legacy` versions (`.cursor/rules/project.mdc`, `.cursorrules`)
- **Google Antigravity** - `simple`, `frontmatter` versions (`.agent/rules/project.md`)
- Output conventions: `markdown` (default) and `xml`
- Path-specific rule generation with glob patterns

#### Internal Packages (bundled into CLI)

- `core` - AST types, error classes, utility functions
- `parser` - PromptScript parser with recovery support
- `resolver` - Resolution for `@inherit`, `@use`, `@extend` with registry support
- `validator` - Semantic validation with custom rule support
- `compiler` - Compilation pipeline with watch mode
- `formatters` - Multiple formatter implementations

#### CLI Features

- `prs init` - Project initialization with auto-detection
  - Tech stack detection (TypeScript, JavaScript, Python, Rust, Go, Java, Ruby, PHP, C#)
  - Framework detection (React, Vue, Angular, Next.js, Django, FastAPI, Express, NestJS, etc.)
  - Existing AI tools detection (GitHub Copilot, Claude Code, Cursor)
  - Interactive configuration wizard
- `prs compile` - Multi-file compilation with watch mode and dry-run support
- `prs validate` - File validation with detailed error reporting
- `prs diff` - Show compilation diff
- `prs pull` - Registry updates

#### Configuration

- `promptscript.yaml` - Project configuration
- Registry configuration with authentication support
- Target configuration for multiple AI platforms
- Validation rules configuration

#### Documentation

- Complete language reference
- API documentation for all 6 packages
- CLI reference guide
- Getting started guide and tutorial
- Multiple examples (minimal, enterprise, skills & local, team setup)
- Package READMEs with ecosystem diagrams

#### Infrastructure

- Nx monorepo with pnpm workspaces
- TypeScript strict mode with 100% type coverage
- Pure ESM packages with NodeNext module resolution
- Comprehensive test suite (Vitest)
- ESLint and Prettier
- Husky pre-commit hooks (format, lint, schema validation)
- TypeDoc for automated API documentation
- MkDocs documentation site with versioning support (mike)
- GitHub Actions CI/CD pipeline
- Code coverage tracking

### Internal Architecture

> All packages below are internal and bundled into `@promptscript/cli`. They are not published separately.

#### core

- AST types and interfaces
- Error classes (`PSError`, `ParseError`, `ResolveError`, `ValidationError`)
- Utility functions for version comparison, paths, AST operations
- Config types: `input`, `watch`, `output`, `registry` with auth support
- Utility exports: `formatPath()`, `diagnostics`, constants

#### parser

- Chevrotain-based lexer and parser
- CST to AST transformation
- `parse()` and `parseOrThrow()` API
- `parseFile()` function with recovery option
- Error recovery for better diagnostics

#### resolver

- `@inherit`, `@use`, `@extend` resolution
- File loader with registry support
- `RegistryInterface` for custom registry implementations
- Standalone `resolve()` function for programmatic use

#### validator

- Required fields validation
- Semantic version format checking
- Custom rule support
- Standalone `validate()` function
- `removeRule()` API for dynamic rule management
- `formatters` export for formatting validation results

#### compiler

- Resolve → Validate → Format pipeline
- Watch mode with chokidar for file monitoring
- Dry-run support
- Standalone `compile()` function

#### formatters

- **GitHub Copilot** - `simple`, `multifile`, `full` versions with agents support
- **Claude Code** - `simple`, `multifile`, `full` versions
- **Cursor** - `modern`, `multifile`, `legacy` versions
- **Antigravity** - `simple`, `frontmatter` versions
- Output conventions: `markdown` or `xml`
- Base formatter class for custom implementations
- Standalone `format()` functions for each formatter

#### cli (published)

- `prs init` - Initialize project with auto-detection
  - Tech stack detection (TypeScript, JavaScript, Python, Rust, Go, Java, Ruby, PHP, C#)
  - Framework detection (React, Vue, Angular, Next.js, Django, FastAPI, etc.)
  - Existing AI tools detection (GitHub, Claude, Cursor)
- `prs compile` - Compile to target formats with watch mode support
- `prs validate` - Validate files
- `prs diff` - Show output diff
- `prs pull` - Pull registry updates with `--registry` flag

### Configuration

- `promptscript.yaml` configuration file
- Registry and targets configuration with authentication
- Validation rules configuration
- Support for multiple output formats per target

### Documentation

- Complete language reference
- CLI and configuration reference
- Getting started guide and tutorial
- API documentation for all 6 packages
- Multiple examples and best practices

### Infrastructure

- Nx monorepo with pnpm workspaces
- TypeScript strict mode
- Pure ESM packages with NodeNext module resolution
- Comprehensive test suite with Vitest
- ESLint and Prettier for code quality
- Husky pre-commit hooks
- TypeDoc for automated API documentation
- MkDocs documentation site with versioning (mike)
- GitHub Actions CI/CD pipeline
