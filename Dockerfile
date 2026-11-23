ARG NODE_IMAGE
ARG NGINX_IMAGE
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ARG APP_VERSION=dev
ARG APP_VERSION_ENV=APP_VERSION
ARG NPM_BUILD_SCRIPT=build
RUN export "$APP_VERSION_ENV=$APP_VERSION"; npm run "$NPM_BUILD_SCRIPT"
FROM ${NGINX_IMAGE}
ARG UI_OUTPUT_DIR=dist
COPY --from=builder /app/${UI_OUTPUT_DIR} /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
