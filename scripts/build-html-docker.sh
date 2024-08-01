#!/bin/bash

docker build -t gp-html-build -f ./scripts/build-html.Dockerfile .
docker run -v "$(pwd):/workspace" -it gp-html-build
