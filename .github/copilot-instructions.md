# Repository instructions

- Use strict TypeScript and preserve the compiler options in `tsconfig.json`.
- Validate all untrusted input at the HTTP boundary before using it.
- Return errors as consistent JSON objects with an `error.code` and `error.message`.
- Add or update tests for every behavior change, including success and error status contracts.
- Keep the Express application separate from the process that starts the HTTP server so tests can run without binding a port.
