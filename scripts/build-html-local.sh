#!/bin/bash

set -ex

mkdir -p ./dist
./scripts/build-pdf.sh
pdf2htmlEX ./dist/graypaper.pdf
