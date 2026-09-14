#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  더블클릭 한 번으로 Cloudflare Pages 에 배포합니다.
#
#  처음 실행할 때만 브라우저가 열리면서 Cloudflare 로그인을 물어봅니다.
#  (토큰을 복사해 붙일 필요 없습니다. 로그인만 하면 됩니다)
#  그 뒤로는 이 파일을 더블클릭하기만 하면 바로 배포됩니다.
# ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1

PROJECT="2609-leeumkidslab"

echo "소리소문 생존 → Cloudflare Pages 배포"
echo "프로젝트: $PROJECT"
echo "─────────────────────────────────────────────"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 가 필요합니다."
  echo "https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행해 주세요."
  read -r -p "엔터로 종료" _
  exit 1
fi

# 배포에 필요한 파일만 임시 폴더에 모읍니다 (문서·스크립트·git 기록 제외)
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for f in index.html a b c app.css app.js config.js sw.js _headers assets; do
  [ -e "$f" ] && cp -R "$f" "$STAGE/"
done
rm -f "$STAGE"/assets/*/README.txt
find "$STAGE" -name '.DS_Store' -delete

echo "올릴 파일"
(cd "$STAGE" && find . -type f | sed 's#^\./#  #' | sort)
echo

# 25MB 넘는 파일이 있으면 미리 잡아 줍니다
BIG=$(find "$STAGE" -type f -size +25M)
if [ -n "$BIG" ]; then
  echo "⚠︎ 25MB 를 넘는 파일이 있어 Cloudflare 가 거부합니다."
  echo "$BIG" | sed 's#.*/#  #'
  echo "  영상을 평균 5~6Mbps 로 다시 내보내 주세요."
  read -r -p "엔터로 종료" _
  exit 1
fi

echo "배포 중..."
echo

# wrangler 를 어디서 실행할지 정합니다.
# 한 번 설치해 두면 매번 내려받지 않아 훨씬 빠릅니다.
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER="wrangler"
elif [ -x "./node_modules/.bin/wrangler" ]; then
  WRANGLER="./node_modules/.bin/wrangler"
else
  echo "wrangler 를 처음 한 번 설치합니다 (1~2분, 다음부터는 생략됩니다)..."
  echo
  npm install --no-fund --no-audit --silent wrangler || {
    echo "설치 실패. 인터넷 연결을 확인해 주세요."
    read -r -p "엔터로 종료" _
    exit 1
  }
  WRANGLER="./node_modules/.bin/wrangler"
  echo
fi

"$WRANGLER" pages deploy "$STAGE" \
  --project-name="$PROJECT" \
  --branch=main \
  --commit-dirty=true

echo
echo "─────────────────────────────────────────────"
echo "배포가 끝나면 위에 주소가 나옵니다."
echo
echo "아이패드에서 열 주소"
echo "  https://$PROJECT.pages.dev/a/     01"
echo "  https://$PROJECT.pages.dev/b/     02"
echo "  https://$PROJECT.pages.dev/c/     03"
echo
echo "※ 코드를 고쳤다면 sw.js 의 VERSION 값을 v4, v5 로 올린 뒤 배포하세요."
echo "─────────────────────────────────────────────"
read -r -p "엔터를 누르면 창이 닫힙니다." _
