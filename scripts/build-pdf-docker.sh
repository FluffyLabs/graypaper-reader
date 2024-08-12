#!/bin/bash

set -uex

npm ci

cd graypaper
export VERSION="$(git rev-parse HEAD)"
cd -

# Fetch docker images
docker build -t gp-pdf-build \
  -f ./scripts/build-pdf.Dockerfile .

# Build PDF first
docker run -v "$(pwd):/workspace" -e VERSION=${VERSION} -it gp-pdf-build
