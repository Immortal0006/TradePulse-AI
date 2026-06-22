FROM node:20-alpine

WORKDIR /app

# IMPORTANT: We ONLY copy package.json! 
# We purposely leave package-lock.json behind to prevent Windows/Linux binary crashes.
COPY package.json ./

# Install dependencies cleanly inside the isolated container
RUN npm install --legacy-peer-deps

# Force install recharts to guarantee the new visualizer has its library
RUN npm install recharts --legacy-peer-deps

# Copy the rest of your modern React workspace components over
COPY . .

# Expose Vite's default streaming application preview port
EXPOSE 5173

# Boot up the development engine binding explicitly to all network interface avenues
CMD ["npm", "run", "dev", "--", "--host"]