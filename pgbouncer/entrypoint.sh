#!/bin/bash
set -e

# Jalankan Cloud SQL Proxy di background
/cloud_sql_proxy -instances=${INSTANCE_CONNECTION_NAME}=tcp:5432 &

# Tunggu beberapa detik agar proxy siap
sleep 5

# Jalankan PgBouncer
exec pgbouncer -u postgres /etc/pgbouncer/pgbouncer.ini