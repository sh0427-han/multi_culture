# multi_culture

2학년 학생을 위한 다문화 거리 참여형 탐방 학습지입니다.

학생은 A~E반, 이름, 학번을 입력한 뒤 5개 지역 중 한 곳을 선택합니다.
선택한 지역의 대표 좌표를 NAVER 지도 앱에서 열고 거리뷰를 탐방한 뒤,
다문화 경관이 잘 나타나는 장면을 여러 장 캡처하여 제출할 수 있습니다.

## 주요 기능

- 2학년 고정 / A~E반 선택
- 이름 / 학번 입력
- 5개 탐방 지역 중 1곳 선택
- NAVER Maps API 없이 지도 앱 URL Scheme 사용
- 대표 좌표 + zoom 20으로 지도 앱 열기
- 여러 이미지 동시 제출
- 클립보드 이미지 붙여넣기
- 모바일 사진 선택 fallback
- 반/지역별 Gallery
- Demo 저장소(IndexedDB)
- 개인 Gmail Google Drive용 Backend 템플릿
- 다른 교사가 Clone/Fork 후 자기 Google Drive로 재연결 가능

## 탐방 지역

1. 안산 원곡동 다문화마을특구
2. 이태원 이슬람 거리
3. 반포 서래마을
4. 대림동 차이나타운
5. 광희동 중앙아시아 거리

## 저장 모드

기본은 `demo`입니다.

```js
storageMode: "demo"
```

이 상태의 사진은 현재 브라우저에만 저장됩니다.

실제 여러 학생이 공유하는 수업에서는 `backend/`의 Google Drive Backend를
배포한 후:

```js
storageMode: "api"
```

로 전환합니다.

자세한 내용은 `SETUP.md`와 `backend/README.md`를 참고하세요.
