#!/bin/bash
set -e

# Jalankan PgBouncer
exec pgbouncer -u postgres /etc/pgbouncer/pgbouncer.ini
