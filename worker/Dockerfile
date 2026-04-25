# Start with a lightweight Node.js base
FROM node:20-bookworm-slim

# Set the working directory
WORKDIR /usr/src/app

# Install all language compilers and runtimes
# - python3 for Python
# - g++ for C++
# - default-jdk for Java
# - golang for Go
# - rustc for Rust
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    g++ \
    default-jdk \
    golang \
    rustc \
    firejail \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript and ts-node globally
RUN npm install -g typescript ts-node

# Copy worker dependency definitions
COPY package*.json ./

# Install Node.js dependencies for the worker
RUN npm ci --only=production

# Copy the worker source code
COPY . .

# Start the worker
CMD ["node", "worker.js"]