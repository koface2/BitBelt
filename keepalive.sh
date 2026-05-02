#!/bin/bash
# Keeps the Codespace from timing out by generating minimal activity every 4 minutes.
# Run in the background: bash keepalive.sh &
# Stop with: kill %1  (or kill the PID printed on start)

echo "Keepalive started (PID $$). Ctrl+C or 'kill $$' to stop."
while true; do
  sleep 240
  echo -n "." 
done
