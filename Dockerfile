# Start from the latest Swift docker image
FROM swift:latest

# Set work directory
WORKDIR /app

# Copy current directory (your project) to the container
COPY . .

# apt-get update and install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    binutils \
    libssl-dev \
    openssl \
    zlib1g-dev

# Set WITH_LTO to 0 and Run make
RUN WITH_LTO=0 make
