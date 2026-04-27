#!/bin/zsh
set -euo pipefail

CHANNEL_URL="${1:-https://www.youtube.com/@Web3PrivacyNow/videos}"
OUT_TSV="${2:-/tmp/w3pn-youtube-videos.tsv}"

TMP_HTML="$(mktemp /tmp/w3pn-channel.XXXXXX.html)"
TMP_JSON="$(mktemp /tmp/w3pn-channel.XXXXXX.json)"
TMP_RESP="$(mktemp /tmp/w3pn-browse.XXXXXX.json)"
TMP_LINES="$(mktemp /tmp/w3pn-videos.XXXXXX.lines)"
trap 'rm -f "$TMP_HTML" "$TMP_JSON" "$TMP_RESP" "$TMP_LINES"' EXIT

curl -s "$CHANNEL_URL" -o "$TMP_HTML"

API_KEY="$(perl -ne 'print $1 and exit if /INNERTUBE_API_KEY\":\"([^\"]+)/' "$TMP_HTML")"
VISITOR_DATA="$(perl -ne 'print $1 and exit if /visitorData\":\"([^\"]+)/' "$TMP_HTML")"
CLIENT_VERSION="$(perl -ne 'print $1 and exit if /clientVersion\":\"([^\"]+)/' "$TMP_HTML")"
FIRST_TOKEN="$(perl -ne 'print $1 and exit if /continuationCommand\":\{\"token\":\"([^\"]+)/' "$TMP_HTML")"

perl -0777 -ne 'print $1 if /var ytInitialData = (\{.*?\});<\/script>/s' "$TMP_HTML" > "$TMP_JSON"

jq -r '
  .. | objects | .videoRenderer? | select(.videoId) |
  [
    .videoId,
    (.publishedTimeText.simpleText // ""),
    ("https://www.youtube.com/watch?v=" + .videoId),
    ((.title.runs // []) | map(.text) | join(""))
  ] | @tsv
' "$TMP_JSON" > "$TMP_LINES"

typeset -A SEEN_VIDEOS
typeset -A SEEN_TOKENS

while IFS=$'\t' read -r video_id published url title; do
  [[ -n "$video_id" ]] || continue
  if [[ -z "${SEEN_VIDEOS[$video_id]-}" ]]; then
    SEEN_VIDEOS[$video_id]=1
    printf '%s\t%s\t%s\t%s\n' "$video_id" "$published" "$url" "$title" >> "$OUT_TSV"
  fi
done < "$TMP_LINES"

TOKEN_QUEUE=()
if [[ -n "$FIRST_TOKEN" ]]; then
  TOKEN_QUEUE+=("$FIRST_TOKEN")
  SEEN_TOKENS[$FIRST_TOKEN]=1
fi

page_count=0
while (( ${#TOKEN_QUEUE[@]} > 0 )) && (( page_count < 40 )); do
  TOKEN="${TOKEN_QUEUE[1]}"
  TOKEN_QUEUE=("${TOKEN_QUEUE[@]:1}")
  page_count=$((page_count + 1))

  PAYLOAD="$(jq -cn \
    --arg token "$TOKEN" \
    --arg visitor "$VISITOR_DATA" \
    --arg version "$CLIENT_VERSION" \
    '{context:{client:{clientName:"WEB",clientVersion:$version,visitorData:$visitor}},continuation:$token}')"

  curl -s "https://www.youtube.com/youtubei/v1/browse?key=$API_KEY" \
    -H 'content-type: application/json' \
    -H 'x-youtube-client-name: 1' \
    -H "x-youtube-client-version: $CLIENT_VERSION" \
    --data-raw "$PAYLOAD" \
    -o "$TMP_RESP"

  jq -r '
    .. | objects | .videoRenderer? | select(.videoId) |
    [
      .videoId,
      (.publishedTimeText.simpleText // ""),
      ("https://www.youtube.com/watch?v=" + .videoId),
      ((.title.runs // []) | map(.text) | join(""))
    ] | @tsv
  ' "$TMP_RESP" > "$TMP_LINES"

  while IFS=$'\t' read -r video_id published url title; do
    [[ -n "$video_id" ]] || continue
    if [[ -z "${SEEN_VIDEOS[$video_id]-}" ]]; then
      SEEN_VIDEOS[$video_id]=1
      printf '%s\t%s\t%s\t%s\n' "$video_id" "$published" "$url" "$title" >> "$OUT_TSV"
    fi
  done < "$TMP_LINES"

  while IFS= read -r next_token; do
    [[ -n "$next_token" ]] || continue
    if [[ -z "${SEEN_TOKENS[$next_token]-}" ]]; then
      SEEN_TOKENS[$next_token]=1
      TOKEN_QUEUE+=("$next_token")
    fi
  done < <(jq -r '.. | objects | .continuationCommand?.token? // empty' "$TMP_RESP")
done

printf 'videos=%s pages=%s output=%s\n' "${#SEEN_VIDEOS[@]}" "$page_count" "$OUT_TSV"
