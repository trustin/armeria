This directory contains a Gatsby project that generates the official
web site for Armeria.

### Build requirements

- The build requirements in [CONTRIBUTING.md](../CONTRIBUTING.md)
- `svgbob_cli`
  - `brew install rust && cargo install svgbob_cli` on Mac OS X

### Working with the project

1. Download and install `node`, `yarn` and other dependencies as well as
   generating the required `.json` files into the `gen-src` directory.
   ```console
   $ ../gradlew prepare
   ```
2. Run Gatsby in development mode.
   ```console
   $ ../gradlew develop
   ```
3. Start updating the pages in `src/pages`.
   All changes will be visible at <http://127.0.0.1:8000/>.

Note that you can also use your local `yarn` or `node` installation,
although you'll have to run `../gradlew prepare` to generate the `.json`
files into the `gen-src` directory at least once.

### Building the project for deployment

1. Perform a clean production build.
   ```console
   $ ../gradlew clean build
   ```
2. Upload all files in the `public` directory into the `gh-pages` branch.

### Checking what's taking space in `.js` bundles

Make sure the resource or component you're adding does not increase the
bundle size too much. You can check which component or page is taking
how much space using `source-map-explorer`.

1. Run `source-map` task using `yarn`.
   ```console
   $ yarn source-map
   ```
2. A web browser will show a tree map.
   See [here](https://github.com/danvk/source-map-explorer#readme) to
   learn more about how to interpret the report.