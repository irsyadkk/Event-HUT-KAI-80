FROM debian:bullseye-slim

# Install pgbouncer + tini
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer ca-certificates tini && \
    rm -rf /var/lib/apt/lists/*

# Copy konfigurasi
COPY pgbouncer.ini /etc/pgbouncer/
COPY userlist.txt  /etc/pgbouncer/

EXPOSE 5432

# Gunakan tini sebagai init, jalankan pgbouncer dengan log verbose (-vv)
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini", "-vv"]
