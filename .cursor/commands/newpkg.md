Generate new package with Nx:
pnpm nx g @nx/js:lib <name> --directory=packages/<name> --publishable --importPath=@promptscript/<name> --bundler=swc --linter=eslint --unitTestRunner=vitest
