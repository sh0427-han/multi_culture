# multi_culture 설정 가이드

## 1. 현재 초안

현재 GitHub Pages만으로 아래 흐름을 테스트할 수 있습니다.

1. 2학년 A~E반 선택
2. 이름 / 학번 입력
3. 5개 지역 중 1곳 선택
4. NAVER 지도 앱 실행
5. 학생이 거리뷰 탐방 후 화면 캡처
6. 사진 선택 및 제출
7. 반/지역별 Gallery 확인

기본 `storageMode`는 `demo`입니다.

Demo 모드는 사진을 **현재 브라우저의 IndexedDB에만 저장**합니다.
따라서 여러 학생의 태블릿에서 제출한 결과가 서로 합쳐지지는 않습니다.
UI와 수업 흐름을 검증하기 위한 모드입니다.

---

## 2. GitHub Pages

저장소의 Settings > Pages에서 GitHub Actions를 Source로 선택하면
`.github/workflows/pages.yml`을 통해 정적 사이트가 배포됩니다.

별도의 빌드 도구는 필요하지 않습니다.

---

## 3. 교사가 수정할 파일

대부분의 수업 설정은 `js/config.js`에 모아두었습니다.

```js
window.MULTI_CULTURE_CONFIG = {
  appName: "multi_culture",
  grade: 2,
  classes: ["A", "B", "C", "D", "E"],
  storageMode: "demo",
  backendUrl: "",
  galleryNameMode: "masked",
  maxImageBytes: 10 * 1024 * 1024,
};
```

다른 교사가 저장소를 Clone/Fork해도 이 설정과 Backend 연결 정보만
변경하도록 설계합니다.

---

## 4. NAVER 지도

NAVER Maps API를 사용하지 않습니다.

학생이 탐방 버튼을 누르면 NAVER 지도 앱의 공식 URL Scheme을 사용합니다.

Android 모바일 웹에서는 다음 구조를 사용합니다.

```text
intent://search?...#Intent;
scheme=nmap;
package=com.nhn.android.nmap;
end
```

iOS에서는 `nmap://search`를 사용합니다.

따라서 NAVER Cloud Maps API Key는 필요하지 않습니다.

---

## 5. 실제 Google Drive 저장으로 전환할 때

학생용 프론트엔드는 Google 계정에 직접 접근하지 않습니다.

권장 구조:

```text
GitHub Pages
    |
    | HTTPS
    v
Backend API
    |
    +-- 교사 Google OAuth
    |
    +-- Google Drive
    |
    +-- 제출 metadata 저장소
```

이렇게 해야 학생 브라우저에 교사의 OAuth token이나 비밀키가 노출되지 않습니다.

### 프론트엔드가 기대하는 API

#### POST /submissions

Content-Type: multipart/form-data

필드:

- grade
- classId
- studentName
- studentNumber
- locationId
- locationName
- image

응답 예:

```json
{
  "id": "submission-id",
  "submitted_at": "2026-09-27T12:00:00+09:00"
}
```

#### GET /submissions

Query:

```text
?class_id=A
&location_id=itaewon
```

`location_id`는 생략할 수 있습니다.

응답:

```json
{
  "submissions": [
    {
      "id": "submission-id",
      "classId": "A",
      "studentName": "김민수",
      "studentNumber": "20317",
      "locationId": "itaewon",
      "image_url": "https://...",
      "submittedAt": "2026-09-27T12:00:00+09:00"
    }
  ]
}
```

### 실제 API 활성화

Backend가 완성되면 `js/config.js`를 다음처럼 변경합니다.

```js
storageMode: "api",
backendUrl: "https://YOUR-BACKEND.example.com",
```

---

## 6. Google Drive 폴더 권장 구조

```text
multi_culture/
├── A/
│   ├── ansan/
│   ├── itaewon/
│   ├── seorae/
│   ├── daerim/
│   └── gwanghui/
├── B/
├── C/
├── D/
└── E/
```

파일명에는 이름/학번을 직접 넣지 않고 UUID를 권장합니다.

학생 정보와 Drive file ID의 관계는 별도 metadata에 저장합니다.

---

## 7. 다음 구현 단계

1. 모바일 UI 실기기 확인
2. NAVER 지도 앱 Deep Link 확인
3. 교사 Google OAuth Backend 구현
4. Google Drive 실제 업로드
5. 전체 태블릿의 제출물이 합쳐지는 Gallery 연결
6. 필요 시 교사용 관리 화면 추가
