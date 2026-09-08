#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  GitHub 저장소 만들고 올리기 (한 번만 실행)
#  파인더에서 이 파일을 더블클릭하면 터미널이 열리며 실행됩니다.
# ─────────────────────────────────────────────────────────────
cd "$(dirname "$0")" || exit 1

echo "소리소문 생존 - GitHub 업로드"
echo "------------------------------------------------"
echo "미리 준비할 것: GitHub Personal Access Token"
echo "  github.com > Settings > Developer settings"
echo "  > Personal access tokens > Tokens (classic)"
echo "  > Generate new token > 'repo' 체크 > 생성"
echo "------------------------------------------------"
echo

read -r -p "GitHub 아이디: " GH_USER
read -r -s -p "Personal Access Token (붙여넣기, 화면에 안 보임): " GH_TOKEN
echo
read -r -p "저장소 이름 [leeum-soriso]: " GH_REPO
GH_REPO=${GH_REPO:-leeum-soriso}

echo
echo "▸ 저장소 생성 중..."
CODE=$(curl -s -o /tmp/gh_resp.json -w "%{http_code}" \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$GH_REPO\",\"private\":true,\"description\":\"리움 키즈랩 소리소문 생존 - 아이패드 전시용 PWA\"}")

if [ "$CODE" = "201" ]; then
  echo "  생성 완료: $GH_USER/$GH_REPO"
elif [ "$CODE" = "422" ]; then
  echo "  이미 있는 저장소입니다. 그대로 올립니다."
else
  echo "  실패 (HTTP $CODE)"
  cat /tmp/gh_resp.json
  echo
  read -r -p "엔터를 누르면 종료합니다." _
  exit 1
fi

echo "▸ 업로드 중..."
git remote remove origin 2>/dev/null
git remote add origin "https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$GH_REPO.git"
git branch -M main
git push -u origin main || { echo "  업로드 실패"; read -r -p "엔터로 종료" _; exit 1; }

# 주소에서 토큰 제거 (파일에 토큰이 남지 않도록)
git remote set-url origin "https://github.com/$GH_USER/$GH_REPO.git"

echo
echo "완료!  https://github.com/$GH_USER/$GH_REPO"
echo
echo "다음 단계 - Cloudflare Pages 연결"
echo "  1. dash.cloudflare.com 로그인"
echo "  2. Workers & Pages > Create > Pages > Connect to Git"
echo "  3. $GH_REPO 선택"
echo "  4. Framework preset: None / Build command: 비움 / Output directory: /"
echo "  5. Save and Deploy"
echo
echo "앞으로 수정 후 올릴 때는 이 폴더에서:"
echo "  git add -A && git commit -m \"수정 내용\" && git push"
echo
read -r -p "엔터를 누르면 창이 닫힙니다." _
