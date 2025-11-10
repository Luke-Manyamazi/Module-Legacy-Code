#!/bin/bash
set -euo pipefail

# Get the directory of this script
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Load environment variables from backend/.env
if [ -f "$SCRIPT_DIR/../backend/.env" ]; then
    source "$SCRIPT_DIR/../backend/.env"
else
    echo "❌ .env file not found in backend/"
    exit 1
fi

# Function to run psql (local or Docker)
run_psql() {
    if [[ "${POSTGRES_HOST:-127.0.0.1}" == "localhost" ]] || [[ "${POSTGRES_HOST:-127.0.0.1}" == "127.0.0.1" ]]; then
        # Use local psql
        echo "Using local psql..."
        PGPASSWORD="$POSTGRES_PASSWORD" psql \
            --dbname "${POSTGRES_DB:-postgres}" \
            --file "${SCRIPT_DIR}/schema.sql" \
            --host "${POSTGRES_HOST:-127.0.0.1}" \
            --port "${POSTGRES_PORT:-5432}" \
            --username "${POSTGRES_USER:-postgres}"
    else
        # Assume POSTGRES_HOST is a Docker container name
        echo "Using Docker container '${POSTGRES_HOST}'..."
        docker exec -i "$POSTGRES_HOST" psql \
            -U "${POSTGRES_USER:-postgres}" \
            -d "${POSTGRES_DB:-postgres}" < "${SCRIPT_DIR}/schema.sql"
    fi
}

# Run it
run_psql

echo "✅ Schema applied successfully!"