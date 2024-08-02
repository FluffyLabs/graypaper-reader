#!/bin/bash

set -ex

mkdir -p ./dist
cd graypaper
xelatex -halt-on-error -output-directory ../dist ./graypaper.tex 
cd -
