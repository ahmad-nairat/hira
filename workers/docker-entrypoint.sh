#!/bin/sh
set -e

# Forward env vars to cron's environment (cron does not inherit them by default).
printenv | grep -E '^(DATABASE_URL|REDIS_URL|OPENAI_API_KEY|R2_)' >> /etc/environment

# Make sure the cron log file exists so the cron line can append to it.
touch /var/log/domain_checker.log

# Start cron in the background and tail its log to stdout so docker logs picks it up.
cron
tail -F /var/log/domain_checker.log &

# Start the event-driven workers in the foreground.
exec python src/main.py
