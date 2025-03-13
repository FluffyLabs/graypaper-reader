# Use the official Node.js image from Docker Hub
FROM node:22-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies using npm ci (ensures a clean and repeatable build)
RUN npm ci --only=production

# Copy the rest of the application code to the working directory
COPY . .

# Start the application using npm start
CMD ["npm", "start"]
