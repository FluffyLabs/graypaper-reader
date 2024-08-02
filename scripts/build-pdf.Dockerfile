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


# Set the working directory
WORKDIR /workspace

# Default command
CMD ["/workspace/scripts/build-pdf-local.sh"]
