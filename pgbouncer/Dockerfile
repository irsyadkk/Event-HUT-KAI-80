FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y pgbouncer && rm -rf /var/lib/apt/lists/*
COPY pgbouncer.ini /etc/pgbouncer/
COPY userlist.txt /etc/pgbouncer/
EXPOSE 5432
CMD ["pgbouncer", "/etc/pgbouncer/pgbouncer.ini"]