# node-grpc-starter

## What is this?

A bare bones Node.JS gRPC starter template. It does not use typescript, it does not use any additional frameworks.

It provides boilerplate to start a gRPC microservice using an example echo service `.proto` file and dynamic bindings.

### Dependencies

- @grpc/grpc-js (core gRPC server)
- @grpc/proto-loader (.proto parser for dynamic bindings)
- @grpc/reflection (provide reflection calls for method discovery in clients like Postman)
- grpc-health-check (provide health endpoints)
- pino (logger)
- dotenv (configuration)

### Dev. Dependencies

- nodemon (hot reloading on change)
- standard (opinionated code linting)
- node-forge (boostraps PKI for mTLS E2E testing in CI)
- testcontainers (verify container builds and runs)

`node --test` is used for testing instead of bringing in a library/framework.

## Scripts

Scripts available in package.json

- `build:image` builds a docker image
- `lint` runs standard lint checks
- `lint:fix` fixes all auto correctable lint failures
- `start` runs the server
- `start:dev` runs the server using nodemon and reloads on change
- `test` runs tests

## Workflows

A github workflow is included that

1. Runs unit tests and lint checks
2. Runs npm audit checks
3. Builds multi-platform docker image
4. Scans image using trivy and uploads results to GitHub

## Environment Variables

| Name                            | Description                                                                                                                          | Default |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| SERVER_PORT                     | Bind port of the server                                                                                                              | 3000    |
| SERVER_CA_CERT                  | String value of the CA in PEM format                                                                                                 |         |
| SERVER_KEY_PAIRS                | JSON array, each object containing a key and cert property                                                                           |         |
| SERVER_VALIDATE_CLIENT_CERT     | Boolean toggling whether or not the server will validate the client certificate, when set to true this enables mTLS                  | false   |
| SERVER_SUPRESS_INSECURE_WARNING | When running without TLS a warning is logged, setting this to true disables that log message                                         | false   |
| DOTENV_FILE_PATHS               | Comma seperated list of paths to .env files, if not provided `.env` is used, encrypted files should have a `.vault` ending extension |         |
| DOTENV_DEBUG                    | When enabled debug messages from dotenv are logged                                                                                   | false   |
| DOTENV_VAULT_KEY_PATH           | When set, this path is used to load a key for decrypting `.vault` dotenv files, when set has priority over DOTENV_VAULT_KEY          |         |
| DOTENV_VAULT_KEY                | When set, this is used to decrypt `.vault` dotenv files                                                                              |         |
| DOTENV_OVERRIDE                 | When set to true, values specified in `.env` files will override values already defined in the destination                           | false   |

## Automated Dependency Updates

A renovate configuration is provided to keep dependencies up to date and auto merge if tests pass.
