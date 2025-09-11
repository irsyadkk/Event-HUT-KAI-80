FROM debian:bullseye-slim

# Install pgbouncer dan tini
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer ca-certificates tini gettext-base \
    && rm -rf /var/lib/apt/lists/*

# Copy konfigurasi dan script
COPY pgbouncer.ini.template /etc/pgbouncer/
COPY userlist.txt /etc/pgbouncer/
COPY entrypoint.sh /entrypoint.sh

# Make entrypoint executable (root masih aktif di sini)
RUN chmod +x /entrypoint.sh

# Buat user non-root
RUN useradd -ms /bin/bash pgbouncer

# Gunakan user non-root
USER pgbouncer

# Expose port
EXPOSE 5432

# Jalankan entrypoint
ENTRYPOINT ["/entrypoint.sh"]