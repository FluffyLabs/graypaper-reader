# GrayPaper Reader

A tool to help with reading and analyzing the Gray Paper.

# Running locally

```bash
$ npm ci      # install dependencies
$ npm run dev # run the development version
```

Before running the viewer locally, you need to create an HTML version of the Gray
Paper.

# Gray Paper as HTML

We use a two-step process to convert the Gray Paper source code into an HTML file.

## Quick Start

If you don't care about the process and have `docker` installed, just run:

```bash
$ ./scripts/build-html-docker.sh
```

You should end up with `./dist/graypaper.html` produced.

## Compile the latex source

First you need to compile the original source of the Gray Paper (Latex) into PDF.
The [gray paper repository](https://github.com/gavofyork/graypaper/) is a git submodule,
so you can simply update it to get the latest checked-in version.

```bash
$ git submodule update --init # update 
```

Next step is to compile Latex. For convenience we provide a docker image and a
script to do just so without polluting your local environment with all the latex
dependencies.
Feel free to do it manually though if you wish!

```bash
$ ./scripts/build-pdf-docker.sh
```

At the end you should have `./dist/graypaper.pdf` produced.

## Convert PDF to HTML

Next step is to convert the PDF into HTML. We use [pdf2htmlEX tool](https://pdf2htmlex.github.io/pdf2htmlEX/) for that.

Again, for convenience there is a docker image that does this too. The script below
will also compile the latex code, so you can just use this.

```bash
$ ./scripts/build-html-docker.sh
```

At the very end you should see `./dist/graypaper.html`.
