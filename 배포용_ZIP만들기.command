#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Cloudflare Pages 대시보드에 끌어다 놓을 zip 을 만듭니다.
#  파인더에서 더블클릭하면 바로 위 폴더에 zip 이 생깁니다.
#
#  파일 이름에 밑줄(_)과 한글을 쓰지 않습니다.
#  Cloudflare 가 이 이름을 브랜치 이름으로 잡는 경우가 있는데,
#  밑줄이 들어가면 주소를 만들지 못해 배포가 실패합니다.
# ─────────────────────────────────────────────────────────────
set +m
cd "$(dirname "$0")" || exit 1

STAMP="$(date +%y%m%d-%H%M)"
OUT="$(cd .. && pwd)/leeum-soriso-$STAMP.zip"

echo "배포용 zip 만드는 중..."
echo

# 앱 구동에 필요한 파일만 임시 폴더에 모읍니다
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for f in index.html a b c app.css app.js config.js sw.js _headers assets; do
  [ -e "$f" ] && cp -R "$f" "$STAGE/"
done
rm -f "$STAGE"/assets/*/README.txt
find "$STAGE" -name '.DS_Store' -delete

# 서비스워커 버전을 만든 시각으로 바꿔 둡니다.
# 이 값이 바뀌어야 아이패드가 예전에 저장해 둔 파일을 버리고 새로 받습니다.
if [ -f "$STAGE/sw.js" ]; then
  sed -i '' "s/^var VERSION = .*/var VERSION = 'soriso-$STAMP';/" "$STAGE/sw.js" 2>/dev/null \
    || sed -i "s/^var VERSION = .*/var VERSION = 'soriso-$STAMP';/" "$STAGE/sw.js"
  echo "서비스워커 버전: soriso-$STAMP"
  echo
fi

# 25MB 를 넘는 파일이 있으면 미리 알려 줍니다
BIG=$(find "$STAGE" -type f -size +25M)
if [ -n "$BIG" ]; then
  echo "⚠︎ 25MB 를 넘는 파일이 있어 Cloudflare 가 거부합니다."
  echo "$BIG" | sed "s#$STAGE/#  #"
  echo "  영상을 평균 5~6Mbps 로 다시 내보내 주세요."
  read -r -p "엔터로 종료" _
  exit 1
fi

rm -f "$OUT"
( cd "$STAGE" && zip -r -q "$OUT" . -x "*.DS_Store" )

COUNT=$(find "$STAGE" -type f | wc -l | tr -d ' ')
SIZE=$(du -h "$OUT" | cut -f1 | tr -d ' ')

echo "완료"
echo "  $OUT"
echo "  파일 $COUNT 개 · $SIZE"
echo
echo "담긴 내용"
( cd "$STAGE" && find . -type f -exec ls -lh {} \; | awk '{printf "  %6s  %s\n", $5, $9}' | sed 's#\./##' | sort -k2 )

echo
echo "──────────────────────────────────────────────"
echo "올리는 방법"
echo "  1. dash.cloudflare.com 로그인"
echo "  2. Workers & Pages > 2609-leeumkidslab"
echo "  3. Create deployment (또는 Upload assets)"
echo "  4. 방금 만든 zip 을 창에 끌어다 놓기"
echo "  5. 배포가 끝나면 아래 주소로 확인"
echo "       https://2609-leeumkidslab.pages.dev/a/     01"
echo "       https://2609-leeumkidslab.pages.dev/b/     02"
echo "       https://2609-leeumkidslab.pages.dev/c/     03"
echo
echo "아이패드에서 앱을 완전히 종료했다가 다시 열어야 새 내용이 보입니다."
echo "──────────────────────────────────────────────"

open -R "$OUT" 2>/dev/null
read -r -p "엔터를 누르면 창이 닫힙니다." _
