# Frontend: build the React app, then serve it with nginx (which also
# proxies /api requests to the backend, so the app works from any client PC).

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Relative API base so the app calls whatever host served the page.
# nginx proxies /api/v1/hms to the backend container.
ARG VITE_API_URL=/api/v1/hms
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
