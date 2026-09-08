# 배포 가이드 - GitHub + Cloudflare Pages

## 왜 이 조합인가

전시장 아이패드가 와이파이에 상시 연결되므로, 이 구성이 가장 편합니다.

| | 역할 |
|---|---|
| **GitHub** | 코드 보관 + 버전 기록. 자막 문구 하나 바꿔도 언제 뭘 바꿨는지 남습니다. |
| **Cloudflare Pages** | GitHub과 연결해 두면 푸시할 때마다 자동 배포. 무료, 용량 제한 넉넉, 국내 속도 빠름, HTTPS 자동. |
| **서비스워커 (`sw.js`)** | 아이패드 안에 앱 파일을 저장. 두 번째 접속부터 즉시 뜨고, 와이파이가 잠깐 끊겨도 화면이 유지됩니다. |

전시 중 급하게 자막을 고쳐야 할 때 → 노트북에서 `config.js` 고치고 푸시 →
1~2분 뒤 아이패드 앱을 껐다 켜면 반영됩니다. 기기를 만질 필요가 없습니다.

**Netlify / Vercel도 같은 방식으로 됩니다.** Cloudflare가 국내에서 조금 더 빠르고
용량 제한이 없어서 영상이 들어가는 이 프로젝트에 유리합니다.

---

## A. GitHub 저장소 만들고 올리기

터미널(응용 프로그램 > 유틸리티 > 터미널)에서 02_APP 폴더로 이동해 실행합니다.

```bash
cd ~/Desktop/yukyung/01.작업/2026/2608_LEEUM/02_APP
```

### A-1. GitHub 웹사이트에서 저장소 만들기 (가장 쉬움)

1. https://github.com/new 접속
2. Repository name: `leeum-soriso` (원하는 이름)
3. **Private** 선택
4. README, .gitignore, license는 **모두 체크 해제** (이미 있으므로)
5. `Create repository` 클릭
6. 나오는 화면에서 `…or push an existing repository` 아래 두 줄을 복사

그 다음 터미널에서:

```bash
git remote add origin https://github.com/<내계정>/leeum-soriso.git
git branch -M main
git push -u origin main
```

> 비밀번호를 물으면 GitHub 계정 비밀번호가 아니라 **Personal Access Token**이 필요합니다.
> GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic) >
> Generate new token > `repo` 체크 > 생성된 문자열을 비밀번호 자리에 붙여넣기.
> 한 번 넣으면 macOS 키체인에 저장돼서 다음부터는 안 물어봅니다.

### A-2. 영상 파일 때문에 푸시가 안 될 때

GitHub은 파일 1개당 100MB, 저장소 전체 1GB를 넘기면 거부합니다.
30초 영상 3개(각 30~45MB)면 문제없지만, 더 커지면 두 가지 선택지가 있습니다.

- **Git LFS 사용** — `git lfs install && git lfs track "*.mp4"` 후 커밋
- **영상만 따로 올리기** — 영상은 GitHub에 넣지 않고(`.gitignore`에 추가),
  Cloudflare Pages 대시보드에서 직접 업로드하거나 R2에 올린 뒤 `config.js`의
  `video` 값을 그 주소로 바꾸기

---

## B. Cloudflare Pages 연결

1. https://dash.cloudflare.com 가입/로그인 (무료)
2. 왼쪽 메뉴 **Workers & Pages > Create > Pages > Connect to Git**
3. GitHub 계정 연결 → `leeum-soriso` 저장소 선택
4. 빌드 설정 — **이 프로젝트는 빌드가 필요 없습니다**

   | 항목 | 값 |
   |---|---|
   | Framework preset | `None` |
   | Build command | *(비워둠)* |
   | Build output directory | `/` |

5. `Save and Deploy` → 1~2분 뒤 주소가 나옵니다
   예: `https://leeum-soriso.pages.dev`

이후 `git push` 할 때마다 자동으로 다시 배포됩니다.

### 아이패드에서 열 주소

```
https://leeum-soriso.pages.dev/index.html?type=A
https://leeum-soriso.pages.dev/index.html?type=B
https://leeum-soriso.pages.dev/index.html?type=C
```

---

## C. 인터넷 없이도 돌아가게 하려면 (선택)

전시장 와이파이가 불안하면 아래 중 하나를 씁니다.

1. **서비스워커에 영상까지 저장** — `sw.js`의 `SHELL` 배열에
   `'./assets/video/A.mp4'` 를 추가. 다만 아이패드 사파리는 영상을 구간별로 나눠
   요청해서 캐시가 잘 안 잡히는 경우가 있으니, 설치 후 비행기 모드로 반드시 테스트하세요.
2. **맥 스튜디오에서 로컬 서버 운영** — 전시장 공유기에 맥과 아이패드를 같이 물리고,
   맥에서 `python3 -m http.server 8000` 실행 후 아이패드에서 `http://맥IP:8000` 접속.
   외부 인터넷이 아예 없어도 됩니다. (단, HTTPS가 아니면 서비스워커는 동작하지 않습니다)

---

## D. 자주 겪는 문제

| 증상 | 원인과 해결 |
|---|---|
| 수정했는데 아이패드에 반영이 안 됨 | `sw.js`의 `VERSION` 값을 올렸는지 확인 → 앱 완전 종료 후 재실행 |
| 소리가 안 남 | 제어 센터 무음 해제 · 볼륨 확인. 앱 코드로는 해결 불가 |
| 영상 시작이 느림 | mp4를 **Fast Start(웹 최적화)** 로 다시 내보내기 |
| 글꼴이 다르게 보임 | `assets/fonts/GabiaGosran.woff2` 가 들어 있는지 확인 |
| 관람객이 앱을 빠져나감 | 가이드 접근을 켜지 않은 상태. 세팅 체크리스트 2·6번 확인 |
| 화면이 꺼짐 | 자동 잠금이 '안 함'인지 확인 |
