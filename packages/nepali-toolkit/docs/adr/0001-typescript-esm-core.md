# Use a TypeScript ESM core for JavaScript consumers

nepali-toolkit will use a TypeScript ESM core rather than Rust/WASM for its JavaScript package. BS/AD conversion is small table and civil-date work where WASM startup and a monolithic binary would work against the primary requirements: import-level modularity, straightforward framework-free use, and consumer-bundle tree-shaking. Native-language ports may later share the conformance specification without becoming dependencies of the JavaScript package.
