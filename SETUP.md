# multi_culture 설정 가이드

## 1. 현재 프론트엔드 기능

GitHub Pages에서 아래 수업 흐름을 사용할 수 있습니다.

1. 2학년 A~E반 선택
2. 이름 / 학번 입력
3. 5개 지역 중 1곳 선택
4. 해당 지역 대표 좌표를 NAVER 지도 앱에서 zoom 20으로 열기
5. 학생이 거리뷰를 직접 실행해 주변 탐방
6. 여러 장 캡처
7. 사진 파일 선택 또는 클립보드 이미지 붙여넣기
8. 여러 장 한 번에 제출
9. 반/지역별 Gallery 확인

NAVER Maps API는 사용하지 않으며 API Key도 필요하지 않습니다.

---

## 2. NAVER 지도 앱 연결

NAVER 지도 공식 URL Scheme의 `/map` 액션을 사용합니다.

각 지역은 `js/locations.js`에 다음처럼 좌표와 zoom 값으로 관리됩니다.

```js
{
  id: "itaewon",
  latitude: 37.5331501,
  longitude: 126.9978424,
  zoom: 20,
}
```

모바일에서는 다음과 같은 형태로 열립니다.

```text
nmap://map?lat=...&lng=...&zoom=20&appname=...
```

Android 모바일 웹에서는 공식 Intent URL 형태를 사용합니다.

NAVER URL Scheme에는 거리뷰를 자동으로 실행하는 공식 action이 없으므로,
학생이 지도 앱이 열린 뒤 거리뷰 버튼을 한 번 눌러야 합니다.

---

## 3. 클립보드 붙여넣기

업로드 화면에는 두 방법을 모두 제공합니다.

- 사진 파일 선택
- 클립보드 이미지 붙여넣기

GitHub Pages는 HTTPS이므로 지원 브라우저에서는
`navigator.clipboard.read()`로 이미지 데이터를 읽을 수 있습니다.

또한 물리 키보드가 있는 환경에서는 업로드 화면에서 Ctrl+V paste event도 처리합니다.

주의:

- 브라우저가 클립보드 읽기 권한을 요청할 수 있습니다.
- 태블릿의 캡처 프로그램이 캡처 이미지를 시스템 클립보드에 넣지 않는 경우가 있습니다.
- 이 경우 기존 사진 파일 선택 기능을 사용하면 됩니다.

---

## 4. Demo 모드

초기 `js/config.js`:

```js
storageMode: "demo",
backendUrl: "",
```

Demo 모드에서는 사진을 현재 브라우저의 IndexedDB에 저장합니다.

따라서 다른 학생의 태블릿이나 교사 PC와 사진이 공유되지는 않습니다.
UI와 전체 수업 흐름 확인용입니다.

학생은 여러 장을 한 번에 제출할 수 있고,
제출 완료 뒤에도 `사진 더 제출하기`로 추가 제출할 수 있습니다.

---

## 5. 실제 Google Drive 공유 저장소

`backend/`에 Cloudflare Worker 기반 Backend 예제가 포함되어 있습니다.

구조:

```text
GitHub Pages
      |
      v
Cloudflare Worker
   |          |
   v          v
Google Drive  D1 metadata
```

이미지는 교사의 개인 Google Drive에 저장하고,
학생 이름/학번/반/지역/Drive file ID 같은 metadata만 D1에 저장합니다.

Drive 이미지 파일을 전체 공개로 변경하지 않고,
Worker의 `/images/:fileId`가 OAuth 인증 후 이미지를 Gallery에 전달합니다.

자세한 설정은 `backend/README.md`를 참고하세요.

---

## 6. Google Drive Backend 활성화 후

`js/config.js`를:

```js
storageMode: "api",
backendUrl: "https://YOUR-WORKER.workers.dev",
```

로 변경합니다.

프론트엔드가 기대하는 API는 다음과 같습니다.

### POST /submissions

`multipart/form-data`

- grade
- classId
- studentName
- studentNumber
- locationId
- locationName
- images: 여러 개 허용

### GET /submissions

```text
?class_id=A
&location_id=itaewon
```

`location_id`는 생략할 수 있습니다.

---

## 7. Drive 폴더 구조

Backend에서 자동으로 생성합니다.

```text
multi_culture/
├── A반/
│   ├── ansan/
│   ├── itaewon/
│   ├── seorae/
│   ├── daerim/
│   └── gwanghui/
├── B반/
├── C반/
├── D반/
└── E반/
```

파일명에는 학생 개인정보를 넣지 않고 UUID를 사용합니다.

---

## 8. 다른 교사가 사용할 때

1. Repository Clone 또는 Fork
2. GitHub Pages 활성화
3. Cloudflare Worker/D1 생성
4. 자신의 Google Cloud OAuth Client 생성
5. `backend/README.md` 절차로 자기 Gmail Drive 연결
6. `js/config.js`의 Backend URL 변경

프론트엔드 소스에 특정 교사의 Gmail, OAuth token, Client Secret을 저장하지 않습니다.
