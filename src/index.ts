/**
 * The package root re-exports CONTRACTS only.
 *
 * Deliberate: a bare `import from '@motionmind/workspace'` should never pull a
 * renderer or a page into a consumer's entry chunk. Areas that carry weight are
 * reached through their own subpath, which is what keeps them separately
 * loadable.
 */
export * from "./contracts/index.js";
