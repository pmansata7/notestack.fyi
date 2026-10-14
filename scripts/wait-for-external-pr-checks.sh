#!/usr/bin/env bash
# Wait until all PR checks except merge workflows complete (avoids deadlock:
# merge jobs register as pending checks while gh pr checks --watch waits forever).
set -euo pipefail

PR="${1:?PR number}"
IGNORE_WORKFLOWS='^(Auto-ship marker( and merge)?|Auto-merge labeled PR)$'

echo "Waiting for external checks on PR #${PR}..."

while true; do
  pending=0
  failed=0

  while IFS= read -r row; do
    name="$(jq -r '.name' <<<"$row")"
    state="$(jq -r '.state' <<<"$row")"
    workflow="$(jq -r '.workflow' <<<"$row")"
    description="$(jq -r '.description // ""' <<<"$row")"

    if [[ "$workflow" =~ $IGNORE_WORKFLOWS ]]; then
      continue
    fi
    if [[ "$name" == "merge" || "$name" == "merge-when-ready" || "$name" == "add-auto-merge-label" ]]; then
      continue
    fi

    # Vercel preview quota is infra — GitHub CI build job validates the branch.
    if [[ "$name" == "Vercel" && "$state" == "FAILURE" && "$description" == *"rate limited"* ]]; then
      echo "Ignoring Vercel rate limit (not a code failure): ${description}"
      continue
    fi

    case "$state" in
      SUCCESS | SKIPPED | NEUTRAL | "") ;;
      FAILURE | ERROR | CANCELLED)
        if [[ "$name" == "Vercel" && "$description" == *"rate limited"* ]]; then
          echo "Vercel deployment rate-limited (infrastructure); not blocking merge."
          continue
        fi
        echo "Check failed: ${name} (${state})"
        failed=1
        ;;
      PENDING | IN_PROGRESS | QUEUED | WAITING | REQUESTED)
        pending=1
        ;;
      *)
        echo "Check ${name}: unknown state ${state}; treating as pending"
        pending=1
        ;;
    esac
  done < <(gh pr checks "$PR" --json name,state,workflow,description | jq -c '.[]')

  if (( failed )); then
    exit 1
  fi
  if (( pending == 0 )); then
    echo "All external checks passed."
    exit 0
  fi
  sleep 20
done
