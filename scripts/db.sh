#!/usr/bin/env bash
# Project-local PostgreSQL cluster for Regimen local development.
# Nothing here touches any system-wide or Homebrew Postgres install.
#
#   ./scripts/db.sh init     initdb a fresh cluster in .pgdata (trust auth)
#   ./scripts/db.sh start     start the cluster on 127.0.0.1:$PGPORT
#   ./scripts/db.sh stop      stop the cluster
#   ./scripts/db.sh status    is it running?
#   ./scripts/db.sh reset     drop + recreate the dev database
#   ./scripts/db.sh psql      open a psql shell on the dev database
#   ./scripts/db.sh ensure    start if not already running (used by other scripts)

set -euo pipefail

# Postgres 17 on macOS aborts with "postmaster became multithreaded during
# startup" unless a concrete locale is pinned. Force the C locale everywhere.
export LC_ALL=C
export LANG=C

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA="$ROOT_DIR/.pgdata"
PGPORT="${REGIMEN_PGPORT:-5433}"
PGHOST="127.0.0.1"
PGUSER="postgres"
DB_NAME="${REGIMEN_DB_NAME:-regimen_dev}"
LOG_FILE="$PGDATA/server.log"

# Prefer the Homebrew postgresql@17 binaries if present, else whatever is on PATH.
if [ -d "/opt/homebrew/opt/postgresql@17/bin" ]; then
  export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
fi

pg_running() {
  pg_ctl -D "$PGDATA" status >/dev/null 2>&1
}

cmd_init() {
  if [ -f "$PGDATA/PG_VERSION" ]; then
    echo "cluster already exists at $PGDATA"
    return 0
  fi
  mkdir -p "$PGDATA"
  initdb --username="$PGUSER" --auth=trust --encoding=UTF8 --locale=C -D "$PGDATA" >/dev/null
  echo "initialised cluster at $PGDATA"
}

cmd_start() {
  cmd_init
  if pg_running; then
    echo "already running on $PGHOST:$PGPORT"
    return 0
  fi
  pg_ctl -D "$PGDATA" -l "$LOG_FILE" -w \
    -o "-p $PGPORT -c listen_addresses=$PGHOST -c unix_socket_directories=''" \
    start
  createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$DB_NAME" 2>/dev/null \
    && echo "created database $DB_NAME" \
    || echo "database $DB_NAME already present"
}

cmd_ensure() {
  if pg_running; then exit 0; fi
  cmd_start
}

cmd_stop() {
  if ! pg_running; then
    echo "not running"
    return 0
  fi
  pg_ctl -D "$PGDATA" -w stop
}

cmd_status() {
  if pg_running; then
    echo "running on $PGHOST:$PGPORT (db: $DB_NAME)"
  else
    echo "stopped"
  fi
}

cmd_reset() {
  cmd_ensure >/dev/null
  dropdb   -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" --if-exists "$DB_NAME"
  createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$DB_NAME"
  echo "recreated $DB_NAME"
}

cmd_psql() {
  cmd_ensure >/dev/null
  exec psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$DB_NAME"
}

case "${1:-}" in
  init)   cmd_init ;;
  start)  cmd_start ;;
  ensure) cmd_ensure ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  reset)  cmd_reset ;;
  psql)   cmd_psql ;;
  *) echo "usage: $0 {init|start|ensure|stop|status|reset|psql}" >&2; exit 1 ;;
esac
