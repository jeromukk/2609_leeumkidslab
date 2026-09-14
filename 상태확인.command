#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Cloudflare 프로젝트 상태를 확인합니다.
#  더블클릭하면 결과가 화면에 뜨고 _상태확인.txt 에도 저장됩니다.
# ─────────────────────────────────────────────────────────────
set +m
cd "$(dirname "$0")" || exit 1

OUT="$(pwd)/_상태확인.txt"
PROJECT="2609-leeum-kidslab"

if command -v wrangler >/dev/null 2>&1 && wrangler --version >/dev/null 2>&1; then
  W="wrangler"
else
  W="npx --yes wrangler@4"
fi

{
  echo "확인 시각: $(date '+%Y-%m-%d %H:%M:%S')"
  echo
  echo "=============================================="
  echo " 프로젝트 목록"
  echo "=============================================="
  $W pages project list 2>&1
  echo
  echo "=============================================="
  echo " 배포 목록 (Environment 가 Production 인 줄의 브랜치를 보세요)"
  echo "=============================================="
  $W pages deployment list --project-name="$PROJECT" 2>&1
} 2>&1 | tee "$OUT"

echo
echo "──────────────────────────────────────────────"
echo "결과가 아래 파일에도 저장되었습니다."
echo "  $OUT"
echo "이 내용을 그대로 알려주시면 바로 고쳐 드리겠습니다."
echo "──────────────────────────────────────────────"
read -r -p "엔터를 누르면 창이 닫힙니다." _
