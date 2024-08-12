#!/bin/bash

set -x

mkdir -p ./dist
cd graypaper
xelatex -interaction=nonstopmode -synctex=1 -output-directory ../dist graypaper.tex
echo $?
gzip -d ../dist/graypaper.synctex.gz
npm exec tsx ../scripts/synctex-to-json.ts
cp ../dist/graypaper.pdf ../dist/graypaper-${VERSION:-latest}.pdf
cp ../dist/graypaper.synctex.json ../dist/graypaper-${VERSION:-latest}.synctex.json
cd -
