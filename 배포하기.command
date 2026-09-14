#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  더블클릭 한 번으로 Cloudflare Pages 에 배포합니다.
#
#  처음 실행할 때만
#   - wrangler(배포 도구) 를 설치하고
#   - 브라우저가 열리며 Cloudflare 로그인을 물어봅니다
#  그 뒤로는 더블클릭만 하면 바로 올라갑니다.
# ─────────────────────────────────────────────────────────────
set +m                 # 백그라운드 작업 종료 알림("Terminated") 숨기기
cd "$(dirname "$0")" || exit 1

PROJECT="2609-leeumkidslab"
START=$(date +%s)
LOG="$(pwd)/_배포로그.txt"

line() { printf '─%.0s' $(seq 1 52); echo; }
step() { echo; line; echo "[$1/4] $2"; line; }
secs() { echo "$(( $(date +%s) - START ))초 경과"; }

clear
echo "소리소문 생존 → Cloudflare Pages 배포"
echo "프로젝트: $PROJECT"
echo "시작: $(date '+%H:%M:%S')"

# ── 1. 올릴 파일 모으기 ───────────────────────────────────────
step 1 "올릴 파일 모으는 중"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 가 필요합니다."
  echo "https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행해 주세요."
  read -r -p "엔터로 종료" _
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for f in index.html a b c app.css app.js config.js sw.js _headers assets; do
  [ -e "$f" ] && cp -R "$f" "$STAGE/"
done
rm -f "$STAGE"/assets/*/README.txt
find "$STAGE" -name '.DS_Store' -delete

# 서비스워커 버전을 배포 시각으로 자동 교체합니다.
# 이 값이 바뀌어야 아이패드가 예전에 저장해 둔 파일을 버리고 새로 받습니다.
# (원본 sw.js 는 건드리지 않고, 올라가는 복사본만 바꿉니다)
STAMP="soriso-$(date +%y%m%d-%H%M)"
if [ -f "$STAGE/sw.js" ]; then
  sed -i '' "s/^var VERSION = .*/var VERSION = '$STAMP';/" "$STAGE/sw.js" 2>/dev/null \
    || sed -i "s/^var VERSION = .*/var VERSION = '$STAMP';/" "$STAGE/sw.js"
  echo "서비스워커 버전: $STAMP"
  echo
fi

COUNT=$(find "$STAGE" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$STAGE" | cut -f1 | tr -d ' ')
echo "파일 $COUNT 개 · 합계 $SIZE"
echo
find "$STAGE" -type f -exec ls -lh {} \; | awk '{printf "  %6s  %s\n", $5, $9}' | sed "s#$STAGE/##" | sort -k2

BIG=$(find "$STAGE" -type f -size +25M)
if [ -n "$BIG" ]; then
  echo
  echo "⚠︎ 25MB 를 넘는 파일이 있어 Cloudflare 가 거부합니다."
  echo "$BIG" | sed "s#$STAGE/#  #"
  echo "  영상을 평균 5~6Mbps 로 다시 내보내 주세요."
  read -r -p "엔터로 종료" _
  exit 1
fi

# ── 2. 배포 도구 준비 ────────────────────────────────────────
step 2 "배포 도구(wrangler) 준비"

# 실제로 실행되는지까지 확인합니다. 설치가 깨져 있으면 다시 깝니다.
runs() { $1 --version >/dev/null 2>&1; }

WRANGLER=""

if command -v wrangler >/dev/null 2>&1 && runs wrangler; then
  WRANGLER="wrangler"
  echo "이미 설치되어 있습니다 ($(wrangler --version 2>/dev/null | head -1))"

elif runs "./node_modules/.bin/wrangler"; then
  WRANGLER="./node_modules/.bin/wrangler"
  echo "이 폴더에 설치되어 있습니다"

else
  echo "처음 한 번만 설치합니다. 1~2분 걸립니다."
  echo "(다음 배포부터는 이 단계가 없습니다)"
  echo
  rm -rf node_modules package-lock.json 2>/dev/null
  npm install --no-fund --no-audit wrangler
  echo

  if runs "./node_modules/.bin/wrangler"; then
    WRANGLER="./node_modules/.bin/wrangler"
    echo "설치 완료"
  else
    echo "폴더에 설치가 되지 않아 다른 방법으로 진행합니다."
    echo "(매번 내려받아서 조금 느립니다. 계속 이러면 알려주세요)"
    WRANGLER="npx --yes wrangler@4"
  fi
fi

if [ -z "$WRANGLER" ]; then
  echo "배포 도구를 준비하지 못했습니다."
  echo "터미널에서 아래를 실행한 뒤 다시 시도해 주세요."
  echo "  npm install -g wrangler"
  read -r -p "엔터로 종료" _
  exit 1
fi

echo "→ $(secs)"

# ── 3. 업로드 ────────────────────────────────────────────────
step 3 "업로드 중"
echo "처음 배포라면 브라우저가 열리며 Cloudflare 로그인을 묻습니다."
echo "아래 진행 표시가 30초 이상 멈춰 있으면 Ctrl+C 후 다시 실행하세요."
echo "(이미 올라간 파일은 건너뛰므로 재시도가 빠릅니다)"
echo

# 10초마다 경과 시간을 찍어서 멈춘 건지 진행 중인지 보이게 합니다
( while true; do sleep 10; echo "      … $(secs)"; done ) &
HEARTBEAT=$!
trap 'kill $HEARTBEAT 2>/dev/null; rm -rf "$STAGE"' EXIT

$WRANGLER pages deploy "$STAGE" \
  --project-name="$PROJECT" \
  --branch=main \
  --commit-dirty=true 2>&1 | tee "$LOG"

RESULT=${PIPESTATUS[0]}
kill $HEARTBEAT 2>/dev/null
wait $HEARTBEAT 2>/dev/null

# ── 4. 확인 ──────────────────────────────────────────────────
step 4 "확인"

if [ "$RESULT" -ne 0 ]; then
  echo "배포에 실패했습니다 · 총 $(secs)"
  echo
  echo "실패 원인 (마지막 25줄)"
  line
  tail -25 "$LOG"
  line
  echo
  echo "전체 기록이 아래 파일에 저장되었습니다."
  echo "  $LOG"
  echo "이 파일 내용을 그대로 알려주시면 원인을 짚어드릴 수 있습니다."
  echo
  echo "자주 있는 원인"
  echo "  · Cloudflare 로그인이 안 되어 있음  →  터미널에서  npx wrangler login"
  echo "  · 프로젝트가 아직 없음             →  대시보드에서 $PROJECT 생성"
  echo "  · 25MB 초과 파일                   →  위 [1/4] 목록에서 용량 확인"
  read -r -p "엔터로 종료" _
  exit 1
fi

BASE="https://$PROJECT.pages.dev"
echo "세 주소가 실제로 열리는지 확인합니다..."
echo
OK=1
for p in /a/ /b/ /c/; do
  CODE=$(curl -s -o /dev/null -m 20 -w "%{http_code}" "$BASE$p")
  if [ "$CODE" = "200" ]; then
    printf "  ✓  %s%s\n" "$BASE" "$p"
  else
    printf "  ✗  %s%s   (응답 %s)\n" "$BASE" "$p" "$CODE"
    OK=0
  fi
done

echo
line
if [ "$OK" = "1" ]; then
  echo "배포 완료 · 총 $(secs)"
  echo
  echo "아이패드에서 열 주소"
  echo "  $BASE/a/     01"
  echo "  $BASE/b/     02"
  echo "  $BASE/c/     03"
  echo
  echo "설치 안내 화면: $BASE/"
else
  echo "업로드는 끝났지만 주소가 아직 응답하지 않습니다."
  echo "1~2분 뒤 브라우저에서 직접 열어 보세요: $BASE/"
fi
echo
echo "※ 배포할 때마다 아이패드가 새 파일을 받도록 자동 처리됩니다."
line
echo "기록: $LOG"

read -r -p "엔터를 누르면 창이 닫힙니다. (브라우저로 열려면 o + 엔터) " ANS
[ "$ANS" = "o" ] && open "$BASE/"
