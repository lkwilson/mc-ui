#!/usr/bin/env bash
# Repo-specific settings. All other managed files must match the selected variant.
# No credentials, skip flags, or shell command strings here.
export APP_NAME=mc-ui
export APP_VARIANT=ui
IMAGE_PLATFORMS=(linux/amd64)
# CI supplies its Docker endpoint. Locally, use DOCKER_HOST/current context.
export IMAGE_DOCKER_ENDPOINT=${IMAGE_DOCKER_ENDPOINT:-}
# Empty for Rust-only apps; workflow selection of runs-on is fixed per variant.
export NODE_VERSION=26.0.0
export NODE_IMAGE=node:26-alpine3.24
export NGINX_IMAGE=nginx:1.31-alpine
export UI_DIR=.
export UI_OUTPUT_DIR=dist
# Optional pinned app-owned tool setup, e.g. installing a browser for tests.
export NPM_SETUP_SCRIPT=""
export NPM_FORMAT_SCRIPT=format:check
export NPM_LINT_SCRIPT=lint
export NPM_TEST_SCRIPT=test
export NPM_DEV_BUILD_SCRIPT=build:dev
export NPM_BUILD_SCRIPT=build
# Set true only if the successful test command produces the full build output.
export TEST_INCLUDES_BUILD=false
export BUILD_OUTPUT_DIR=dist
# Dockerfile exports this name with the exact release version before npm build.
export APP_VERSION_ENV=APP_VERSION
