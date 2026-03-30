# Apify Actor Dockerfile with Playwright + Chromium
FROM apify/actor-node-playwright-chrome:20

# Copy package files and install dependencies
COPY package*.json ./
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && npm cache clean --force \
    && rm -rf tmp/* \
    && echo "Installed NPM packages:" \
    && (npm list --omit=dev --all || true)

# Copy source code
COPY . ./

# Run the actor
CMD ["node", "src/main.js"]
