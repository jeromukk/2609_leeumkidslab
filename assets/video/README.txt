이 폴더에 완성된 영상을 아래 이름으로 넣어 주세요.

  A.mp4   01 - 풀벌레 소리 대신 들리는 사라짐의 소리
  B.mp4   02 - 짝을 부르는 소리에 다가오는 건 사냥꾼
  C.mp4   03 - 차 소리에 묻히는 새소리

권장 사양
  코덱      H.264 (High profile) + AAC 오디오
  해상도    2360 x 1640  (아이패드 화면의 2배 해상도)
  프레임    30fps
  비트레이트 8~12 Mbps
  용량      30초 기준 30~45MB 정도

내보내기 예시 (터미널에서 ffmpeg 사용)
  ffmpeg -i 원본.mov -c:v libx264 -profile:v high -pix_fmt yuv420p \
         -crf 20 -c:a aac -b:a 192k -movflags +faststart A.mp4

  ※ -movflags +faststart 를 꼭 넣어 주세요. 없으면 재생 시작이 느려집니다.
