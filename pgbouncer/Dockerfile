FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    pgbouncer ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*
COPY pgbouncer.ini /etc/pgbouncer/
COPY userlist.txt /etc/pgbouncer/
EXPOSE 5432
ENTRYPOINT ["/usr/bin/tini","--"]
CMD ["pgbouncer","-vv","/etc/pgbouncer/pgbouncer.ini"]
