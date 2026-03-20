# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0](https://github.com/mrwogu/promptscript/compare/v1.4.7...v1.0.0) (2026-03-20)


### ⚠ BREAKING CHANGES

* **compiler:** Generated files now have compact marker instead of verbose header. Existing files with legacy marker still recognized.
* All packages now use ES Modules. Consumers must use ESM imports.
* All packages now use ES Modules. Consumers must use ESM imports.

### chore

* prepare alpha release ([c6595b6](https://github.com/mrwogu/promptscript/commit/c6595b6fd639f93f0093c503e8468fbbbf057cf9))
* prepare alpha release ([ce96d95](https://github.com/mrwogu/promptscript/commit/ce96d954ae0a015689dda443effc7e80ce80dec5))
* prepare alpha release ([7b1fe19](https://github.com/mrwogu/promptscript/commit/7b1fe197b1ddc9b0fec87c407f557fbaa67113fd))
* prepare alpha release ([9f2f1ed](https://github.com/mrwogu/promptscript/commit/9f2f1ed61923048312206118ff1e0a10679f9899))
* prepare alpha release ([78a8bd9](https://github.com/mrwogu/promptscript/commit/78a8bd9aecfdfa82af1520269f93cb74abf16983))
* prepare alpha release ([970c1c8](https://github.com/mrwogu/promptscript/commit/970c1c8c6bc2ebdc4a508314ce7c9c38ddc10a6d))
* prepare alpha release ([54696c9](https://github.com/mrwogu/promptscript/commit/54696c93e27cf9fc2f09dd730b09e568d0dc425e))
* prepare alpha release ([8c3a428](https://github.com/mrwogu/promptscript/commit/8c3a428856bc088fb27a4fdd6a16185fe5e63589))
* prepare alpha release ([8bb0fb2](https://github.com/mrwogu/promptscript/commit/8bb0fb2e643566af2fed08a5cd7bc17420c4dd96))
* prepare alpha.1 release ([01bb952](https://github.com/mrwogu/promptscript/commit/01bb952a967566c0dcd61b80eec2119c06966167))
* prepare alpha.2 release ([449fbcc](https://github.com/mrwogu/promptscript/commit/449fbccc119d34ab2a674cbfcd8cc4cc3012d108))
* prepare rc release ([5a6a707](https://github.com/mrwogu/promptscript/commit/5a6a707b2d30735729f6cb7a64e97722cb66e05d))
* prepare rc release ([87b9a04](https://github.com/mrwogu/promptscript/commit/87b9a0494e2c220c0c9cc226fc751c09613494ea))
* prepare rc release ([756f820](https://github.com/mrwogu/promptscript/commit/756f82096a2a511e6a88aa3b45a56c92c3fab68c))
* prepare release ([d751e4b](https://github.com/mrwogu/promptscript/commit/d751e4bd7bc82d834766980bb0eba71dfd7bf92f))


### refactor

* migrate to pure ESM ([72d0333](https://github.com/mrwogu/promptscript/commit/72d0333580c688c617831885c13a270619817d5b))
* migrate to pure ESM ([8a59387](https://github.com/mrwogu/promptscript/commit/8a59387d6f81ee9db33c46db8e737fe52e705c2e))


### Features

* add antigravity/gemini support ([350c849](https://github.com/mrwogu/promptscript/commit/350c84994fa1bb929f392a81ca1665ee99b7b686))
* add Factory AI, OpenCode, and Gemini CLI compilation targets ([9c206af](https://github.com/mrwogu/promptscript/commit/9c206af40fe35412b948b1a32d9fec8b309e3c91))
* add official promptscript-registry as submodule ([2fb9495](https://github.com/mrwogu/promptscript/commit/2fb9495403479cb29743e27c21ef5948f53cb12e))
* add prs import command for reverse-parsing AI instructions ([#113](https://github.com/mrwogu/promptscript/issues/113)) ([fae14fd](https://github.com/mrwogu/promptscript/commit/fae14fdd9a5915ac55f97bea7a5c72bde5471f13))
* add root SKILL.md as canonical source with sync pipeline ([#75](https://github.com/mrwogu/promptscript/issues/75)) ([cc76023](https://github.com/mrwogu/promptscript/commit/cc76023eaea92318303081dcd439ae3185b1bbe0))
* **agents:** add custom subagent definitions ([2ffe114](https://github.com/mrwogu/promptscript/commit/2ffe114d882213520c7abeeee7784130f46e36df))
* auto-inject PromptScript SKILL.md during compilation ([#103](https://github.com/mrwogu/promptscript/issues/103)) ([6350741](https://github.com/mrwogu/promptscript/commit/6350741f0b9d40b2d3656688d98ad64c4655c840))
* **ci:** add Docker build and security scan to CI pipeline ([75138d8](https://github.com/mrwogu/promptscript/commit/75138d89b71169e94efe095d0ac941ee28a7fbce))
* cli ([d6cfb7c](https://github.com/mrwogu/promptscript/commit/d6cfb7c5ee7262fcfb63f3ee79333fadfb39ee34))
* **cli/diff:** support pager ([c5133f7](https://github.com/mrwogu/promptscript/commit/c5133f7a58f0f03323c8fa925387178e823d9415))
* **cli:** add --migrate flag to init command for AI-assisted migration ([3e567c6](https://github.com/mrwogu/promptscript/commit/3e567c606ddff779b841f76615a2aac93e35dec3))
* **cli:** add AI-assisted migration skill and CLI integration ([53e9cca](https://github.com/mrwogu/promptscript/commit/53e9cca8669a30e787cbc2aa7679bb63f7896fce))
* **cli:** add Antigravity to AI tool detection ([809d055](https://github.com/mrwogu/promptscript/commit/809d055d9b9308059306c6dd8d5893ecdfe8f3b5))
* **cli:** add chokidar watch mode and --registry flag ([afe30a9](https://github.com/mrwogu/promptscript/commit/afe30a93171ae2f08ea3d022b30a1356deca0627))
* **cli:** add Codecov bundle analysis ([b93568f](https://github.com/mrwogu/promptscript/commit/b93568f81835dd62517ff5f290687dd5ef9cb4da))
* **cli:** add file overwrite protection for prs compile ([9213a1d](https://github.com/mrwogu/promptscript/commit/9213a1d6edecff54333c65226a2ede8ff20ae417))
* **cli:** add registry manifest support for init command ([790ae31](https://github.com/mrwogu/promptscript/commit/790ae312bfef2cb80a74feb6ccbb334f15a3985b))
* **cli:** add verbose and debug logging throughout compilation pipeline ([36bd63a](https://github.com/mrwogu/promptscript/commit/36bd63a2fa1dde1acbfd0794bb174f645ef71335))
* **cli:** enterprise registry redesign ([#74](https://github.com/mrwogu/promptscript/issues/74)) ([a1ce2ca](https://github.com/mrwogu/promptscript/commit/a1ce2cad2a80d902e380907dd5b1c474952f8b6f))
* **cli:** force init ([5275c14](https://github.com/mrwogu/promptscript/commit/5275c14b9559f16cbc1b4aecf2f8edcf520e51ff))
* compiler ([0c59c0a](https://github.com/mrwogu/promptscript/commit/0c59c0a1182ffef61f3eaf33cf66e0fc12fcb05c))
* **compiler:** add compact PromptScript marker to all outputs ([6d74480](https://github.com/mrwogu/promptscript/commit/6d744800a4ab38030b6c23b2ab949c79977ab12e))
* **compiler:** add standalone compile function ([552ae43](https://github.com/mrwogu/promptscript/commit/552ae4316eaae5dfa43ac2956478f7e5cf3cbaae))
* core ([0e934e8](https://github.com/mrwogu/promptscript/commit/0e934e8fc457feaf56d6d08dbdb599ea9f2330f6))
* **core:** add formatPath, diagnostics, and constants ([fc13ef7](https://github.com/mrwogu/promptscript/commit/fc13ef7dcece3db5cd03d29dead0f9da16d77e1b))
* **core:** add input, watch, output, and registry auth config types ([6deb76c](https://github.com/mrwogu/promptscript/commit/6deb76c6ce306490989b592d54b841edec576e93))
* **core:** config schema ([2692b4d](https://github.com/mrwogu/promptscript/commit/2692b4d51e1fb20c4df35b5ce6b8264369910bcb))
* **docker:** add Docker support for CLI ([d3c3a00](https://github.com/mrwogu/promptscript/commit/d3c3a002794362dd6b2b573bfec0eeac402365d0))
* **docs:** add "Try in Playground" links to code examples ([204bf64](https://github.com/mrwogu/promptscript/commit/204bf64009aacd774110cd6285c54878131d66c6))
* **docs:** add documentation validation and auto-comment registry refs in playground ([2010b28](https://github.com/mrwogu/promptscript/commit/2010b28e4ffb1e89b40d89423879c7da5e5ca766))
* **docs:** add interactive terminal demos to homepage and getting started ([b2f781b](https://github.com/mrwogu/promptscript/commit/b2f781b45d57862026e5c8ab8cb4525ccacbbd15))
* **docs:** add output block validation to docs:validate ([81ac0d9](https://github.com/mrwogu/promptscript/commit/81ac0d93a28fe29ecf50ee04597b57fdd5b6d093))
* **docs:** add PromptScript syntax highlighting ([4b30af1](https://github.com/mrwogu/promptscript/commit/4b30af1515ea39fb6d734c00e61e1ef2913afa9e))
* **docs:** add robots.txt and llms.txt for SEO and LLM discovery ([cb71747](https://github.com/mrwogu/promptscript/commit/cb71747d9169e6151da0f708fec197860ea6e19e))
* **docs:** add scrolling agent ticker to homepage hero ([#127](https://github.com/mrwogu/promptscript/issues/127)) ([d4c3361](https://github.com/mrwogu/promptscript/commit/d4c336180ed940d4c3a50852f02237957fb4d63c))
* **docs:** generate sitemap index for versioned documentation ([781400b](https://github.com/mrwogu/promptscript/commit/781400b842b942cb13a3fd05b1fbed4c48569d1a))
* **docs:** improve homepage UX and fix playground-dev links ([48a1d31](https://github.com/mrwogu/promptscript/commit/48a1d3160d3d28a73f71d7c3d8af60c775b91f98))
* **docs:** improve SEO with meta tags and og:image ([4b47ed2](https://github.com/mrwogu/promptscript/commit/4b47ed20ab80e220e36af0f6f50019ac2444df7f))
* **docs:** simplify versioning to major.minor only ([7968b99](https://github.com/mrwogu/promptscript/commit/7968b99f43e5014657dc0846cb2781b039a1970e))
* formatters ([df0a66e](https://github.com/mrwogu/promptscript/commit/df0a66e6745f49a9810f6dfc453acd433555e209))
* **formatters:** 37-platform AI agent compatibility ([#124](https://github.com/mrwogu/promptscript/issues/124)) ([97d3870](https://github.com/mrwogu/promptscript/commit/97d3870f7ceded9fb146d18d2dbeea020a28f0f6))
* **formatters:** add Cursor slash commands support (.cursor/commands/) ([bc80e6c](https://github.com/mrwogu/promptscript/commit/bc80e6c700ef69d3b998b373f8885b2ec922d9aa))
* **formatters:** add Factory AI droids support (.factory/droids/) ([#94](https://github.com/mrwogu/promptscript/issues/94)) ([e7f9292](https://github.com/mrwogu/promptscript/commit/e7f929273254738b2de5334f26136c8374aedc7b))
* **formatters:** add formatStandardsList for pass-through standards ([a01acf4](https://github.com/mrwogu/promptscript/commit/a01acf4e8f24a016bd73d8c8569815c011da8706))
* **formatters:** add git scope field to all formatters ([8788026](https://github.com/mrwogu/promptscript/commit/878802614508d426d80c0969821d4039e60ec84f))
* **formatters:** add jetbrains alias for antigravity formatter ([17636a8](https://github.com/mrwogu/promptscript/commit/17636a80bf9c64d2e57553540a0c27828e2d6d6a))
* **formatters:** add llms.txt generation and formatter documentation pages ([#125](https://github.com/mrwogu/promptscript/issues/125)) ([667f4c9](https://github.com/mrwogu/promptscript/commit/667f4c91ecb3a6031c9b24937f8db098cf3c651e))
* **formatters:** add mixed models support per agent/droid ([939f75a](https://github.com/mrwogu/promptscript/commit/939f75ac4d8beb2e823007826c2e266ab5c7380b))
* **formatters:** add standalone format functions ([85b2076](https://github.com/mrwogu/promptscript/commit/85b207602b91db86bd63a2b94157f3b4c8a2715f))
* **formatters:** change default version from simple to full ([#111](https://github.com/mrwogu/promptscript/issues/111)) ([57b98e7](https://github.com/mrwogu/promptscript/commit/57b98e7faf89c9ca7c85e44a2372a63b3b059c07))
* **formatters:** copilot agents support ([886f6fc](https://github.com/mrwogu/promptscript/commit/886f6fca9d0a7cd276997a31e62618ef0153322f))
* **formatters:** emit skill frontmatter fields for Factory AI ([#97](https://github.com/mrwogu/promptscript/issues/97)) ([c74553b](https://github.com/mrwogu/promptscript/commit/c74553b323a3721768493cea2ab50742808a946a))
* **formatters:** generate Prettier-compatible output for GitHub and Antigravity formatters ([8befa20](https://github.com/mrwogu/promptscript/commit/8befa20f0d00cc71326abfd79d332efdcc4f23e0))
* **formatters:** generate prettier-compatible SKILL.md files ([b404046](https://github.com/mrwogu/promptscript/commit/b4040460f2eaa6af087122f312d0c083ebf6c421))
* **formatters:** golden tests ([411cfee](https://github.com/mrwogu/promptscript/commit/411cfeee3160572d556a24454a217b5485633226))
* **formatters:** map GitHub Copilot tools and models to canonical format ([b9d37d2](https://github.com/mrwogu/promptscript/commit/b9d37d216d26def544b1b2a0ae666a2d1da3200c))
* **formatters:** skills + multifile support ([f6e104a](https://github.com/mrwogu/promptscript/commit/f6e104abbab652da8e488d4d066457d803df4332))
* **formatters:** support arbitrary [@standards](https://github.com/standards) keys and add shortcuts section ([7d04776](https://github.com/mrwogu/promptscript/commit/7d04776fc232c4e577fe8e94d67df0c50002452a))
* **formatting:** add dynamic Prettier configuration support ([c7ceca1](https://github.com/mrwogu/promptscript/commit/c7ceca13928df3449d3ac9f16b1c4749cc48dc2f))
* integrate official promptscript-registry ([676fbb1](https://github.com/mrwogu/promptscript/commit/676fbb1cd253d7d5e71a1b95f924ae921a5ad824))
* interactive cli init ([3f77d28](https://github.com/mrwogu/promptscript/commit/3f77d28c1f7644cb9c0620ab4b9f94c01d1ea243))
* new formatters ([#78](https://github.com/mrwogu/promptscript/issues/78)) ([b30585a](https://github.com/mrwogu/promptscript/commit/b30585ae483a3c02b690ab8755ccd44f9cf355a7))
* parameterized skills with template interpolation ([#114](https://github.com/mrwogu/promptscript/issues/114)) ([cf8bb4c](https://github.com/mrwogu/promptscript/commit/cf8bb4c29d11655cb612a1258c8dba43591d0b5c))
* parser ([7a5205f](https://github.com/mrwogu/promptscript/commit/7a5205fda8b549aeeaed631bdcf91bb9eabbbc00))
* **parser:** add parseFile and recovery option ([20ab25b](https://github.com/mrwogu/promptscript/commit/20ab25bf9759330d63ad8cefdef17b94022c1043))
* **playground:** add environment variable syntax highlighting ([870ea1b](https://github.com/mrwogu/promptscript/commit/870ea1b8d78ca617674ed048a4d0a29ad616b924))
* **playground:** add simulated environment variables ([68ddf02](https://github.com/mrwogu/promptscript/commit/68ddf025ee12df492bd2ed26e98a560f2110aaae))
* **playground:** add web playground for trying PromptScript in browser ([fe86808](https://github.com/mrwogu/promptscript/commit/fe86808d2019400a58d7e69b626a85a697527c7a))
* resolver ([cc7a7df](https://github.com/mrwogu/promptscript/commit/cc7a7df269775f9f20edc589fecac00b2c601744))
* **resolver:** add Git registry support for remote configuration sharing ([555e488](https://github.com/mrwogu/promptscript/commit/555e4883c26b45661965d5994cbaf7f43b928d26))
* **resolver:** add native SKILL.md file resolution ([a6a5f72](https://github.com/mrwogu/promptscript/commit/a6a5f721da77c7848c76f9ecdd80a291d144a8ed))
* **resolver:** add registry interface and standalone resolve ([65397ad](https://github.com/mrwogu/promptscript/commit/65397ada19fa6d0e587ba5531e101efc0728d718))
* **resolver:** auto-discover skills, commands, and resource files ([e1272de](https://github.com/mrwogu/promptscript/commit/e1272dec54cb2e0c00be314577e3813bccb819f4))
* **resolver:** improve [@use](https://github.com/use) merge semantics for property override ([eb5b2b7](https://github.com/mrwogu/promptscript/commit/eb5b2b758a77e3c1374e82224b6e96b82ae65fd9))
* self-hosted playground via prs serve command ([#108](https://github.com/mrwogu/promptscript/issues/108)) ([396e5ab](https://github.com/mrwogu/promptscript/commit/396e5ab17b47bce67343aad37a5a423587cf2184))
* skill folders with shared resources and skill contracts ([#117](https://github.com/mrwogu/promptscript/issues/117)) ([12a30ac](https://github.com/mrwogu/promptscript/commit/12a30ac8fe065f90dab4f414e74ce10e39a1baa3))
* support conventions ([3ccea55](https://github.com/mrwogu/promptscript/commit/3ccea55eb92e3374a2613bbf975c7b4cae80fcf5))
* **templates:** add parameterized inheritance with {{variable}} syntax ([cabd60e](https://github.com/mrwogu/promptscript/commit/cabd60e01022684dc4d295518aaec4a65910aecf))
* validator ([261500c](https://github.com/mrwogu/promptscript/commit/261500cbe8bbee99fad371ff91ea7f926e6dc3fb))
* **validator:** add data URI content decoding to PS012 ([5b296e5](https://github.com/mrwogu/promptscript/commit/5b296e567571142a881db36a817edc1dced860ba))
* **validator:** add IDN homograph attack detection to PS010 ([48be33b](https://github.com/mrwogu/promptscript/commit/48be33b2a5c1f69c78eed35bdc0a83c1a67925fc))
* **validator:** add PS013 path-traversal rule ([90cab99](https://github.com/mrwogu/promptscript/commit/90cab991fd7156d63b6a9c2b79472f7ee109d891))
* **validator:** add PS014 unicode-security rule ([9e14cab](https://github.com/mrwogu/promptscript/commit/9e14cab98fb2c5a3f1a474f7cd90dbc56254c78c))
* **validator:** add security rules for supply chain injection detection ([5802a2f](https://github.com/mrwogu/promptscript/commit/5802a2f7d258fd6577d30d76d9ae1d1ce31ef123))
* **validator:** add standalone validate, removeRule, formatters ([0affc65](https://github.com/mrwogu/promptscript/commit/0affc65175dd497995687b50044148077509958d))


### Bug Fixes

* **build:** use es6 module format in swcrc configs ([9cae931](https://github.com/mrwogu/promptscript/commit/9cae9318f6a775788ceb089e85f22bb3781646f7))
* **ci:** add chmod for Docker smoke test directory ([2a41377](https://github.com/mrwogu/promptscript/commit/2a4137794491cc0c0f08e37807006ced03043f56))
* **ci:** add include-component-in-tag to prevent tag mismatch ([0020c63](https://github.com/mrwogu/promptscript/commit/0020c639aca3b238a02e959b1a223ca00726864e))
* **ci:** copy 404.html to gh-pages root for redirects ([85e3db0](https://github.com/mrwogu/promptscript/commit/85e3db084e13b56ef623ce1d37f7c95776cb2de7))
* **ci:** copy llms.txt from build output instead of deleted source file ([e1c3c4a](https://github.com/mrwogu/promptscript/commit/e1c3c4a8df9703b002075a4c6656e7af6e3806e7))
* **ci:** fix smoke test heredoc indentation and improve test coverage ([1b21ce4](https://github.com/mrwogu/promptscript/commit/1b21ce40ff8592035f269fdcfdedcfc21387c452))
* **ci:** give dispatched version deploys unique concurrency groups ([#99](https://github.com/mrwogu/promptscript/issues/99)) ([c1ccb21](https://github.com/mrwogu/promptscript/commit/c1ccb21a8eb4bea42fd874c9112a42266f6f73c5))
* **ci:** handle deleted symlink target in docs workflow ([d58dedf](https://github.com/mrwogu/promptscript/commit/d58dedfdec06d1466e2878cf4748f4f018d55cf2))
* **ci:** improve release workflow reliability ([6fdd8bc](https://github.com/mrwogu/promptscript/commit/6fdd8bc1dba03774f4de06c6d3c1fb7d519bdf24))
* **ci:** never cancel docs deployments to prevent tag runs from being cancelled ([9ec3d61](https://github.com/mrwogu/promptscript/commit/9ec3d6107226e02be55c52dac0ba0425b1866fe7))
* **ci:** preserve tag runs while allowing main branch cancellation ([921a145](https://github.com/mrwogu/promptscript/commit/921a1459bb3906ec4d5cca2d9e5638c4383bdfe6))
* **ci:** prevent docs deploy race by combining tag and dev deploys ([ec568af](https://github.com/mrwogu/promptscript/commit/ec568af031c6ced627ce34ae9d00751e7d121a34))
* **ci:** prevent gh-pages push conflicts with single concurrency group ([724b1f8](https://github.com/mrwogu/promptscript/commit/724b1f8e04cfc91951443e32e3637f81c68e2a4f))
* **ci:** prevent tag doc deployments from being cancelled ([02c7500](https://github.com/mrwogu/promptscript/commit/02c750072a3922984fac1ebc330e6f0ff6135893))
* **ci:** prevent tag doc deploys from being cancelled by dev deploys ([#98](https://github.com/mrwogu/promptscript/issues/98)) ([f1b4a5e](https://github.com/mrwogu/promptscript/commit/f1b4a5e7fc98bae98d143cdfe609559b50f5255d))
* **ci:** prioritize tag deployments over branch in docs workflow ([af7b048](https://github.com/mrwogu/promptscript/commit/af7b048d46621ea69311566803077d8dd54253be))
* **ci:** resolve symlinks before artifact upload to prevent race condition ([e288c75](https://github.com/mrwogu/promptscript/commit/e288c751a122b9fc9001216f195acfbf35d67426))
* **ci:** run CLI smoke tests with local dependencies ([8c6787b](https://github.com/mrwogu/promptscript/commit/8c6787ba5d824ee6617bf3bf88fc441dc1b62105))
* **ci:** set permissions on Docker smoke test directory ([e339862](https://github.com/mrwogu/promptscript/commit/e3398623c494eabb89e0dfb0a728cbcdd105cdad))
* **ci:** simplify template smoke test to use valid PRS syntax ([6da705d](https://github.com/mrwogu/promptscript/commit/6da705d43ece8e24472a52045550f35145ae52e2))
* **ci:** use monorepo path-prefixed outputs for release-please ([93869a1](https://github.com/mrwogu/promptscript/commit/93869a1a42be266170ac27cdd56017933e2e72ab))
* **ci:** use packages/cli path with prerelease-type alpha ([57f4ad6](https://github.com/mrwogu/promptscript/commit/57f4ad6ebf29214fefd329073cd7458d80ef20f2))
* **ci:** use root path for release-please changelog ([c11fc70](https://github.com/mrwogu/promptscript/commit/c11fc706fcac0d6b3569b2b79153fccc94007fcc))
* **ci:** use temp file for sed to fix cross-platform compatibility ([fd29ac4](https://github.com/mrwogu/promptscript/commit/fd29ac421a7f5f705df274d80b164e8ffa6de9f0))
* **ci:** use valid Docker Hub node image tags for smoke tests ([acf3871](https://github.com/mrwogu/promptscript/commit/acf38717fb769f1cbfada37fc848448ea4e2a6b7))
* **cli:** add migrationCandidates to test mocks ([d8fe117](https://github.com/mrwogu/promptscript/commit/d8fe117ff5523bb5b1c15996e00d8c24548c7b8f))
* **cli:** bundle @promptscript/server into CLI for global install ([99e2454](https://github.com/mrwogu/promptscript/commit/99e24542af9812d97b71887f2c1c03f59a33e098))
* **cli:** change registry configuration default to No ([0927050](https://github.com/mrwogu/promptscript/commit/0927050523df7a659ea5eff47c11ae11dba976a6))
* **cli:** correct version detection in bundled package ([28c15a2](https://github.com/mrwogu/promptscript/commit/28c15a2622c92e99051854868a45825cbedf80cc))
* **cli:** export importCommand from main index.ts ([b24399b](https://github.com/mrwogu/promptscript/commit/b24399b430d7918ac939615fee0132b9fb37f727))
* **cli:** extend marker detection from 10 to 20 lines ([229e9bc](https://github.com/mrwogu/promptscript/commit/229e9bc5bf4d0441c9674e6483a5125347b6f0b8))
* **cli:** handle skill resource files without PromptScript markers ([#92](https://github.com/mrwogu/promptscript/issues/92)) ([3153498](https://github.com/mrwogu/promptscript/commit/315349865335cc1013b5c60d5c418885bf6467f8))
* **cli:** include skills in build assets and update CI smoke tests ([62d8d0b](https://github.com/mrwogu/promptscript/commit/62d8d0bbc86f02ad11424110fb7bf2215dd80299))
* **cli:** increase marker scan window for SKILL.md detection ([8409dd6](https://github.com/mrwogu/promptscript/commit/8409dd650483a27dc21e3e5ad47eda86157340b2))
* **cli:** resolve ESM dynamic require error for simple-git ([748a401](https://github.com/mrwogu/promptscript/commit/748a401377b5b58dff1935b94543f65f11f5360c))
* **cli:** sanitize registry init directory names and detect empty CWD ([#126](https://github.com/mrwogu/promptscript/issues/126)) ([a78c8a8](https://github.com/mrwogu/promptscript/commit/a78c8a838e5857a9247f38f6bf0d0d6695338844))
* **cli:** show all supported targets in prs init ([#112](https://github.com/mrwogu/promptscript/issues/112)) ([620097c](https://github.com/mrwogu/promptscript/commit/620097ce698946dc17fd26c2a6f8a92d111be33d))
* **cli:** skip writing unchanged files during compilation ([8542512](https://github.com/mrwogu/promptscript/commit/854251214d927dd5f5dea0aea04a65e0f96819a2))
* **cli:** use universal migration hint instead of Claude Code specific ([ff2e731](https://github.com/mrwogu/promptscript/commit/ff2e731371840b95ed2378755ff431399903c3c2))
* **compiler:** detect and prevent additional file path collisions ([#101](https://github.com/mrwogu/promptscript/issues/101)) ([fe3c11f](https://github.com/mrwogu/promptscript/commit/fe3c11f423ddd15a428b061c25246eb352c5d02b))
* **compiler:** use YAML marker in frontmatter for Factory AI compatibility ([#138](https://github.com/mrwogu/promptscript/issues/138)) ([3f76ac4](https://github.com/mrwogu/promptscript/commit/3f76ac4eed8086a61e58b690debdad91fe079930))
* **core:** interpolate template variables in quoted strings ([db6df94](https://github.com/mrwogu/promptscript/commit/db6df94e7d01f4c3d9dbc4d096abc3794d326926))
* **core:** interpolate template variables in quoted strings ([1b8aadc](https://github.com/mrwogu/promptscript/commit/1b8aadc4df42183cb0508e9f5631d71b3818b310))
* correct Antigravity target configuration ([0624791](https://github.com/mrwogu/promptscript/commit/0624791a0b726d5d3c2214874ce81e3d179bc3a3))
* **docker:** add missing importer package to Dockerfile workspace setup ([43cc4ca](https://github.com/mrwogu/promptscript/commit/43cc4ca06567691e7048201c30354afe311fbe74))
* **docker:** disable Nx daemon and cache for stable Docker builds ([e0e254d](https://github.com/mrwogu/promptscript/commit/e0e254d455c0cf37ba1ab06330136ad9ecda4759))
* **docker:** install pnpm via npm instead of corepack ([8bfc3ef](https://github.com/mrwogu/promptscript/commit/8bfc3efb50a128b7f71ed8655bb2512fcec55856))
* **docker:** pin pnpm version and add missing package.json copies ([9f2110f](https://github.com/mrwogu/promptscript/commit/9f2110f0c4edbfc156e7c000a1025a5ec64bf305))
* **docker:** use existing node user instead of creating prs user ([215cb25](https://github.com/mrwogu/promptscript/commit/215cb250a0168deb6d36e19778c76dfc18a70e56))
* **docs:** configure setuptools py-modules for docs_extensions ([395b6f7](https://github.com/mrwogu/promptscript/commit/395b6f7a615fff637a4ff32ad82ba65c6e03b9e8))
* **docs:** correct [@skills](https://github.com/skills) documentation - remove undocumented steps property ([66a186a](https://github.com/mrwogu/promptscript/commit/66a186abdc6408f2f2fb2d6c75c8204c2addb0d5))
* **docs:** correct architecture diagram dependencies ([33cdee0](https://github.com/mrwogu/promptscript/commit/33cdee021ba4540e126fa29e1774da270f181b3a))
* **docs:** correct migration guide URL path ([429ed73](https://github.com/mrwogu/promptscript/commit/429ed731f7a79eaf28bea3a42094b3f075ad9235))
* **docs:** correct relative links in getting-started ref-list ([291ebfb](https://github.com/mrwogu/promptscript/commit/291ebfbb9025e9935733fafb8fa484bf5582187b))
* **docs:** improve documentation accuracy and completeness ([9f4f658](https://github.com/mrwogu/promptscript/commit/9f4f65812481a94d2f87d6ed08bce3442456646f))
* **docs:** improve homepage compile demo UX ([9a296ed](https://github.com/mrwogu/promptscript/commit/9a296ed632f835311e6f48e5d905c8aadd792733))
* **docs:** persist playground across deployments ([6d5533b](https://github.com/mrwogu/promptscript/commit/6d5533b9ff8122930842f261241febe5eee332fb))
* **docs:** preserve quotes in meta tags and fix og:image URLs ([62f8204](https://github.com/mrwogu/promptscript/commit/62f820438279ec732a7609b711aee9e56d6a9ecb))
* **docs:** prevent tag deployments from being cancelled by main branch ([6aa4d5e](https://github.com/mrwogu/promptscript/commit/6aa4d5ee675ddc95c099af58978c7805149aed7a))
* **docs:** remove edit and view source links from documentation ([7a60664](https://github.com/mrwogu/promptscript/commit/7a6066450ff0b391461b8e205f976ffc4fc70815))
* **docs:** update examples for standalone playground validation ([b6d1df7](https://github.com/mrwogu/promptscript/commit/b6d1df7fe205fc8e0d81dcfa555fc5276e85867e))
* **docs:** use Material's built-in Mermaid support ([3ed4d2d](https://github.com/mrwogu/promptscript/commit/3ed4d2d0e85af7f6cd90d3ad97c44d2475bda2ce))
* **docs:** use playground-dev URL for dev version documentation ([ab8cf55](https://github.com/mrwogu/promptscript/commit/ab8cf5582b745db1801789f9e4bb5aedc02343a6))
* eliminate hardcoded path ([3f9f473](https://github.com/mrwogu/promptscript/commit/3f9f473fc80b43e367dd1ca1ffb1b9f97f67a19d))
* **eslint:** add ora to ignored dependencies for nx dependency-checks ([639f860](https://github.com/mrwogu/promptscript/commit/639f860794cfef1b7f8fe0f3e991005ad5565478))
* **formatters:** add knowledgeContent to GitHub, fix Antigravity restrictions + tech stack fallback ([a5341c0](https://github.com/mrwogu/promptscript/commit/a5341c0bd9ea44cc90750f4bba9d2033e8480990))
* **formatters:** add missing knowledgeContent to Cursor and Antigravity formatters ([654094f](https://github.com/mrwogu/promptscript/commit/654094fae9d8d9c876dec046dbfc9224d9ce295f))
* **formatters:** add trailing newline to generated agent files ([6b1631c](https://github.com/mrwogu/promptscript/commit/6b1631c3dd5d7979b448ebe109a9e0d4d06ee98b))
* **formatters:** fix type assertion in registerFormatter for overload resolution ([5ebbba7](https://github.com/mrwogu/promptscript/commit/5ebbba72687d3cfee37b4e05b5783efb3764278e))
* **formatters:** generate Prettier-compatible AGENTS.md files ([55fd7d2](https://github.com/mrwogu/promptscript/commit/55fd7d20c4b63158db6e437e16a0da9847027ef9))
* **formatters:** improve Claude formatter output quality ([26571cc](https://github.com/mrwogu/promptscript/commit/26571cc291a0fabc6aab6099ec03390ebe25f87a))
* **formatters:** read devCommands and postWork from [@knowledge](https://github.com/knowledge) block ([83a2727](https://github.com/mrwogu/promptscript/commit/83a272707bf3550142ae440f1a595657bb5704e9))
* **formatters:** render [@knowledge](https://github.com/knowledge) content in Claude formatter output ([ac53ff1](https://github.com/mrwogu/promptscript/commit/ac53ff137a0124f9e842348d26227fc50f312c8c))
* **formatters:** unsafe position search for pattern ([9c59567](https://github.com/mrwogu/promptscript/commit/9c59567878422cfa82c831cdad4022f8b9e2d420))
* **importer,cli:** classify preamble as [@identity](https://github.com/identity) and add entry to init config ([#139](https://github.com/mrwogu/promptscript/issues/139)) ([f414bf3](https://github.com/mrwogu/promptscript/commit/f414bf3d9c22554e9c0ca5e63179300fbe4c1198))
* init config schema, migrate flow, and skill consolidation ([#100](https://github.com/mrwogu/promptscript/issues/100)) ([af6fb5f](https://github.com/mrwogu/promptscript/commit/af6fb5f2deb8984ba6545a68c6398a20b1d8ab85))
* **parser:** use workspace protocol for core dependency ([6911392](https://github.com/mrwogu/promptscript/commit/6911392c8e9ee1c6dd94e2947b87357e47494c6d))
* **playground:** inject version dynamically and simplify deployment paths ([2f3c012](https://github.com/mrwogu/promptscript/commit/2f3c012063d2db503b9133fbdb2d01b90b343e7e))
* **playground:** migrate to Tailwind CSS v4 architecture ([894e86a](https://github.com/mrwogu/promptscript/commit/894e86ae9d9554ba294d2a43825c8e00083a7652))
* **playground:** update react-dom to v19 to match react version ([c7055e8](https://github.com/mrwogu/promptscript/commit/c7055e80022dd0efea4c27fa00b0cd986bb93057))
* **playground:** use useShallow for Zustand 5 compatibility ([a908a41](https://github.com/mrwogu/promptscript/commit/a908a41c93885d9725fb9eaade7c49ffa062a88a))
* **resolver:** allow imports to override inherited values with different types ([e1dc8a1](https://github.com/mrwogu/promptscript/commit/e1dc8a1a42bd7a82d637086b4c67534111eefc20))
* **resolver:** check ref errors before auth errors in git clone ([4f81b6e](https://github.com/mrwogu/promptscript/commit/4f81b6ec886f33e130df5c69c23e04487e8dfac8))
* **resolver:** improve security validation and skill resource discovery ([#91](https://github.com/mrwogu/promptscript/issues/91)) ([080e376](https://github.com/mrwogu/promptscript/commit/080e376a55d6a6e77170f102c4bbaa6b67af2e6b))
* **resolver:** preserve @ prefix in GitRegistry path resolution ([14f6f78](https://github.com/mrwogu/promptscript/commit/14f6f7884e8dc0d561c292b6d750da94946edb59))
* **resolver:** use bracket notation for index signature property access ([047dc58](https://github.com/mrwogu/promptscript/commit/047dc5820156523b86efbd11171706796245a2f7))
* **resolver:** use path.raw for verbose logging output ([dbc2374](https://github.com/mrwogu/promptscript/commit/dbc23743caf11c6871aa20eb151e4a799e29cf5d))
* **scripts:** fix playground link generation to properly capture code blocks ([0ddc936](https://github.com/mrwogu/promptscript/commit/0ddc936a3f5e3cd927e1f17591af8ddb06c11c1c))
* **skills:** improve native SKILL.md parsing and output formatting ([44dee81](https://github.com/mrwogu/promptscript/commit/44dee81436d4faab0868a41189950374ce97d681))
* **standards:** add missing commas between array elements ([e0f0d45](https://github.com/mrwogu/promptscript/commit/e0f0d45ea41cc26b2cf7293474bdefe3fcf9d8fe))
* sync package.publish.json keywords and description ([ae7481f](https://github.com/mrwogu/promptscript/commit/ae7481fe64639420ba38fc98ea1349bca17cb91d))
* **validator,playground:** PS011 false positive on bare Override and playground reconnect loop ([26bd838](https://github.com/mrwogu/promptscript/commit/26bd838116a906338bbbbf402d2a7ab793f32a9d))
* **validator:** prevent ReDoS in authority-injection regex patterns ([664d7ab](https://github.com/mrwogu/promptscript/commit/664d7ab2c0cd4a931fe0ec5d2af73f31c77b5294))
* **validator:** PS011 false positive on "follow exactly" without "instructions" ([f118bc3](https://github.com/mrwogu/promptscript/commit/f118bc33baa1b3c2e345438d2489184ed4e91c3f))
* **validator:** remove unused variable in test ([4d6fb8f](https://github.com/mrwogu/promptscript/commit/4d6fb8fee3428f1bbaf13adec6db4c2f65ffd6e8))


### Performance Improvements

* **docs:** speed up compile-demo animation by 50% ([77617da](https://github.com/mrwogu/promptscript/commit/77617da1436c38273df6f3e7298cb5ef2cba2a00))

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
