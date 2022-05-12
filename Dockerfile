FROM node:16-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --prod --no-optional --ignore-scripts

FROM gcr.io/distroless/nodejs:16
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY ./index.js  ./
COPY ./migrations  ./migrations
COPY --from=base /app/package.json .
USER nonroot
HEALTHCHECK NONE
EXPOSE 8000
CMD ["index.js"]
