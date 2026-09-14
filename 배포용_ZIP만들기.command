#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Cloudflare Pages 에 올릴 zip 파일을 만듭니다.
#  파인더에서 더블클릭하면 바탕화면에 zip 이 생깁니다.
# ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1

OUT="$(cd .. && pwd)/소리소문_배포_$(date +%y%m%d_%H%M).zip"

echo "배포용 zip 만드는 중..."
echo

# 앱 구동에 필요한 것만 담습니다 (git 기록·문서·스크립트 제외)
zip -r -q "$OUT" \
  index.html a b c app.css app.js config.js sw.js _headers assets \
  -x "*.DS_Store" -x "assets/*/README.txt"

echo "완료: $OUT"
echo
echo "담긴 내용"
unzip -l "$OUT" | tail -n +4 | head -30
echo
echo "──────────────────────────────────────────"
echo "올리는 방법"
echo "  1. dash.cloudflare.com 로그인"
echo "  2. Workers & Pages > Create > Pages"
echo "     > Upload assets 탭 선택"
echo "  3. 프로젝트 이름 입력 (예: leeum-soriso)"
echo "  4. 방금 만든 zip 을 창에 끌어다 놓기"
echo "  5. Deploy site"
echo
echo "수정 후 다시 올릴 때"
echo "  이 파일을 다시 더블클릭 → 프로젝트 > Create deployment"
echo "  > 새 zip 끌어다 놓기"
echo "  ※ 수정했다면 sw.js 의 VERSION 값을 v2, v3 로 올려야 합니다"
echo "──────────────────────────────────────────"
echo
read -r -p "엔터를 누르면 창이 닫힙니다." _
