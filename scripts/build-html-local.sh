#!/bin/bash

set -ex

mkdir -p ./dist
./scripts/build-pdf-local.sh
pdf2htmlEX ./dist/graypaper.pdf
