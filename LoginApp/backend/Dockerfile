# Use the Node.js base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your backend server listens on
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
