FROM debian:bullseye-slim

# Install PgBouncer & wget untuk Cloud SQL Proxy
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download Cloud SQL Proxy
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /cloud_sql_proxy \
    && chmod +x /cloud_sql_proxy

# Copy konfigurasi PgBouncer dan entrypoint
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 5432

ENTRYPOINT ["/entrypoint.sh"]