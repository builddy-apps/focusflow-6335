FROM node:20-alpine
# cache-bust: 538d3d45
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "backend/server.js"]