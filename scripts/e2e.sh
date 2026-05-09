#!/bin/sh
# Kill any process currently bound to port 3000.
# If nothing is bound, the pipeline produces no output and xargs -r is a no-op.
ss -tlnp 'sport = :3000' | grep -oP 'pid=\K[0-9]+' | xargs -r kill

playwright test "$@"
