FROM alpine:3.20

# Install migrate CLI and PostgreSQL client for pg_isready
RUN apk add --no-cache curl postgresql-client \
  && curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz \
     | tar -xz -C /usr/local/bin \
  && chmod +x /usr/local/bin/migrate

COPY . /migrations
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
