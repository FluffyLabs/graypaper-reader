#!/bin/bash

set -uex

rm -rf ./dist
mkdir ./dist

cd graypaper
xelatex -interaction=nonstopmode -synctex=1 -output-directory ../dist graypaper.tex
cd -

gzip -d dist/graypaper.synctex.gz
npm exec tsx scripts/synctex-to-json.ts dist/graypaper.synctex dist/graypaper.synctex.json

cp dist/graypaper.pdf public/graypaper-${VERSION:-latest}.pdf
cp dist/graypaper.synctex.json public/graypaper-${VERSION:-latest}.synctex.json

cd -
