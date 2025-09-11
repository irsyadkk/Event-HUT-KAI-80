#!/bin/bash
set -e

# Buat direktori writable untuk runtime config
mkdir -p /home/pgbouncer/config
envsubst < /etc/pgbouncer/pgbouncer.ini.template > /home/pgbouncer/config/pgbouncer.ini

# Jalankan PgBouncer dengan file yang baru
exec pgbouncer -vv /home/pgbouncer/config/pgbouncer.ini
