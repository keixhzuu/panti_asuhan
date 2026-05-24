FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG BACKEND_URL
ENV VITE_API_BASE_URL=${BACKEND_URL}

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server.js"]