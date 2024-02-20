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

1) Runs unit tests and lint checks
2) Runs npm audit checks
3) Builds multi-platform docker image
4) Scans image using trivy and uploads results to GitHub


## Automated Dependency Updates

A renovate configuration is provided to keep dependencies up to date and auto merge if tests pass.