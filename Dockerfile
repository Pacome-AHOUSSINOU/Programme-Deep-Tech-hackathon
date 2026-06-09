FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
RUN mkdir -p uploads
EXPOSE 5000
CMD ["node", "src/index.js"]
