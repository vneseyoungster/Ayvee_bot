# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY vietqr-node ../vietqr-node

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Create tmp directory for QR codes
RUN mkdir -p tmp

# Start the bot
CMD [ "npm", "start" ] 