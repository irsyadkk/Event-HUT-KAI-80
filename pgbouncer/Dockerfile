FROM debian:bullseye-slim

# Install pgbouncer dan tini
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer ca-certificates tini gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Buat user non-root
RUN useradd -ms /bin/bash pgbouncer
USER pgbouncer

# Copy konfigurasi dan script
COPY pgbouncer.ini.template /etc/pgbouncer/
COPY userlist.txt /etc/pgbouncer/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

# Expose port
EXPOSE 5432

# Jalankan entrypoint
ENTRYPOINT ["/entrypoint.sh"]