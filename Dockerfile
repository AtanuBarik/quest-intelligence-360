FROM nginx:alpine

LABEL org.opencontainers.image.title="Quest Intelligence 360"
LABEL org.opencontainers.image.description="Containerized static frontend for Quest Intelligence 360"

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz | grep -q '^ok$' || exit 1
