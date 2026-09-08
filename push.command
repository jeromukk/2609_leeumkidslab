#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  GitHub 에 올리기
#  저장소: https://github.com/jeromukk/2609_leeumkidslab
#  파인더에서 이 파일을 더블클릭하면 실행됩니다.
# ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1

REPO_URL="https://github.com/jeromukk/2609_leeumkidslab.git"

echo "소리소문 생존 → GitHub 업로드"
echo "저장소: $REPO_URL"
echo "─────────────────────────────────────────────"
echo
echo "아이디를 물으면    : jeromukk"
echo "비밀번호를 물으면  : Personal Access Token 을 붙여넣기"
echo "                    (계정 비밀번호는 받지 않습니다)"
echo
echo "토큰이 없다면 아래에서 1분이면 만듭니다"
echo "  github.com > 우측 상단 프로필 > Settings"
echo "  > Developer settings > Personal access tokens"
echo "  > Tokens (classic) > Generate new token (classic)"
echo "  > Note 아무거나 / Expiration 90 days"
echo "  > 'repo' 체크 > Generate token > 나온 문자열 복사"
echo
echo "한 번 입력하면 맥 키체인에 저장돼서 다음부터는 안 물어봅니다."
echo "─────────────────────────────────────────────"
echo

git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git config credential.helper osxkeychain
git branch -M main

if ! git push -u origin main; then
  echo
  echo "저장소에 이미 파일이 있는 것 같아 합쳐서 다시 시도합니다..."
  git pull --rebase --allow-unrelated-histories origin main || true
  git push -u origin main || {
    echo
    echo "업로드 실패. 토큰의 'repo' 권한을 확인해 주세요."
    read -r -p "엔터로 종료" _
    exit 1
  }
fi

echo
echo "─────────────────────────────────────────────"
echo "완료!  https://github.com/jeromukk/2609_leeumkidslab"
echo
echo "다음 단계 - Cloudflare Pages 연결"
echo "  1. dash.cloudflare.com 로그인"
echo "  2. Workers & Pages > Create > Pages > Connect to Git"
echo "  3. 2609_leeumkidslab 선택"
echo "  4. Framework preset: None"
echo "     Build command: 비워둠"
echo "     Build output directory: /"
echo "  5. Save and Deploy"
echo
echo "앞으로 수정한 뒤 올릴 때는 터미널에서 이 폴더로 이동해"
echo "  git add -A && git commit -m \"수정 내용\" && git push"
echo "  ※ 코드를 고쳤다면 sw.js 의 VERSION 값을 v3, v4 로 올리기"
echo "─────────────────────────────────────────────"
read -r -p "엔터를 누르면 창이 닫힙니다." _
