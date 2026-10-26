#!/usr/bin/env bash
set -euo pipefail
mkdir -p .ci-results
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4180 --strictPort > .ci-results/vite.log 2>&1 &
server_pid=$!
cleanup() {
  status=$?
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
  if [[ "$status" != 0 ]]; then
    cat .ci-results/vite.log
    mkdir -p .ci-results/screenshots
    for screenshot in /tmp/inkra-*.png; do
      [[ ! -f "$screenshot" ]] || cp "$screenshot" .ci-results/screenshots/
    done
  fi
}
trap cleanup EXIT
ready=false
for attempt in {1..60}; do
  if curl --fail --silent http://127.0.0.1:4180/ > /dev/null; then
    ready=true
    break
  fi
  kill -0 "$server_pid" || exit 1
  sleep 1
done
[[ "$ready" == true ]] || exit 1
npm run check:candidate
npm run test:browser
