#!/bin/bash

mkdir -p ./dist
xelatex -halt-on-error -output-directory ./dist ./graypaper/graypaper.tex 
pdf2htmlEX ./dist/graypaper.pdf
