#!/bin/bash

set -ex

mkdir -p ./dist
cd graypaper
xelatex -halt-on-error -output-directory ../dist ./graypaper.tex 
cp ../dist/graypaper.pdf ../dist/graypaper-${VERSION:-latest}.pdf
cd -
