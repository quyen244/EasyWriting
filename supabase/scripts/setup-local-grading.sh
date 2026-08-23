#!/usr/bin/env bash
# Configure a freshly reset local stack so grading actually runs.
#
# `supabase db reset` recreates the database, which drops the Vault secrets the dispatch
# trigger reads — so without this, every submission sits in `queued` and
# `dispatch_grading` logs a warning once a minute. Run this after every reset.
#
#   supabase start
#   supabase db reset
#   ./supabase/scripts/setup-local-grading.sh
#   supabase functions serve --env-file supabase/functions/.env
#
# Local only. The keys below are the CLI's fixed development keys — identical on every
# machine, reachable only on 127.0.0.1, and not secrets. The one value that IS a secret
# is read from supabase/functions/.env, which is gitignored.

set -euo pipefail

cd "$(dirname "$0")/../.."

DB_CONTAINER="${DB_CONTAINER:-supabase_db_ie_writing}"
API_URL="${API_URL:-http://127.0.0.1:54321}"
ENV_FILE="supabase/functions/.env"

# The local service_role key. Fixed by the CLI, published in its own docs.
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

TEST_EMAIL="${TEST_EMAIL:-learner@local.test}"
TEST_PASSWORD="${TEST_PASSWORD:-local-test-password-123}"

if [ ! -f "$ENV_FILE" ]; then
  cat >&2 <<EOF
Missing $ENV_FILE. Create it with:

  OPENROUTER_API_KEY=<your key>
  GRADE_ATTEMPT_SECRET=<any long random string>

It is gitignored. GRADE_ATTEMPT_SECRET must match the Vault secret this script writes,
which is why the script reads it from here rather than inventing one.
EOF
  exit 1
fi

GRADE_SECRET="$(grep -m1 '^GRADE_ATTEMPT_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n')"
if [ -z "$GRADE_SECRET" ]; then
  echo "GRADE_ATTEMPT_SECRET is not set in $ENV_FILE" >&2
  exit 1
fi

echo "Writing Vault secrets..."
# host.docker.internal, not 127.0.0.1: the URL is dialled from inside the database
# container, where localhost is the database itself.
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q <<SQL
select vault.create_secret('${API_URL/127.0.0.1/host.docker.internal}/functions/v1/grade-attempt',
                           'grade_attempt_url');
select vault.create_secret('${GRADE_SECRET}', 'grade_attempt_secret');
select vault.create_secret('${SERVICE_ROLE_KEY}', 'grade_attempt_auth');
SQL

echo "Creating test user ${TEST_EMAIL}..."
curl -s -X POST "${API_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"email_confirm\":true}" \
  | grep -o '"id":"[^"]*"' | head -1

echo "Done. Start the functions runtime next:"
echo "  supabase functions serve --env-file ${ENV_FILE}"
