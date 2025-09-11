#!/bin/bash
set -e

# Ganti template dengan nilai environment variable
envsubst < /etc/pgbouncer/pgbouncer.ini.template > /etc/pgbouncer/pgbouncer.ini

# Jalankan PgBouncer
exec pgbouncer -vv /etc/pgbouncer/pgbouncer.ini