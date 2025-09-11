FROM debian:bullseye-slim

# Install PgBouncer
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy konfigurasi PgBouncer dan entrypoint
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 5432

ENTRYPOINT ["/entrypoint.sh"]