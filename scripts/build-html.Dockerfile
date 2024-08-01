# Use the official Ubuntu Jammy image as a base
FROM ubuntu:jammy

# Set the environment to non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Update the package list and install required packages
RUN apt-get update && \
    apt-get install -y \
        texlive-fonts-extra \
        texlive-bibtex-extra \
        texlive-xetex \
        wget \
        gdebi-core && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download and install pdf2htmlEX
RUN wget https://github.com/pdf2htmlEX/pdf2htmlEX/releases/download/v0.18.8.rc1/pdf2htmlEX-0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64.deb && \
    gdebi --non-interactive pdf2htmlEX-0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64.deb && \
    rm pdf2htmlEX-0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64.deb

# Set the working directory
WORKDIR /workspace

# Default command
CMD ["/workspace/build-html.sh"]
