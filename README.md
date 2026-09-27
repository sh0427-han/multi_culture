# 도시의 미래탐구 · 다문화 거리 탐방

2학년 학생들이 NAVER 지도 거리뷰를 이용해 여러 다문화 지역을 탐방하고, 각 지역의 특징이 잘 드러나는 장면을 캡처하여 제출하는 수업용 웹앱입니다.

이 저장소는 **Google Apps Script용 소스코드만 보관**합니다.  
GitHub Pages로 직접 서비스하지 않습니다.

실제 학생용 웹페이지는 Google Apps Script의 **Web app 배포 URL(/exec)** 을 사용합니다.

---

## 주요 기능

- 2학년 고정
- 반 선택 없음
- 이름 / 학번 입력
- 5개 지역 탐방
- NAVER 지도 앱을 지정 좌표로 열기
- 학생 1명당 지역별 사진 1장 제출
- 같은 학생이 같은 지역에 다시 제출하면 기존 사진 교체
- 사진 파일 선택 업로드
- 지원되는 브라우저에서 클립보드 이미지 붙여넣기
- Google Drive에 실제 이미지 저장
- Google Sheet에 제출 metadata 저장
- 제출 완료 지역 표시
- 선생님 전용 결과보기
- 선생님 비밀번호 기본값: `1234`
- 비밀번호는 서버(Apps Script)에서 검증
- 결과 사진 클릭 시 전체화면 확대
- 이전 / 다음 슬라이드
- 모바일 좌우 스와이프

---

# 저장소 구조

```text
multi_culture/
├── README.md
└── apps-script/
    ├── Config.gs
    ├── Code.gs
    ├── Storage.gs
    ├── Gallery.gs
    ├── Index.html
    ├── Styles.html
    └── Script.html
```

각 파일의 역할은 다음과 같습니다.

| 파일 | 역할 |
|---|---|
| `Config.gs` | 과목명, 지역, Drive 폴더명, 비밀번호 등 설정 |
| `Code.gs` | Apps Script Web app 시작점(`doGet`) |
| `Storage.gs` | Drive 폴더 생성, 사진 저장/교체, Sheet 기록 |
| `Gallery.gs` | 교사 인증, 결과 조회, 이미지 로딩 |
| `Index.html` | 학생/교사 화면 HTML |
| `Styles.html` | 웹페이지 CSS |
| `Script.html` | 화면전환, 지도 연결, 업로드, Gallery, 슬라이드 동작 |

---

# Google Drive 저장 구조

최초 설정 후 아래 구조가 자동으로 생성됩니다.

```text
내 드라이브/
└── 도시의미래탐구/
    └── 다문화거리탐방/
        ├── 다문화거리탐방_제출현황
        ├── 안산_원곡동/
        ├── 이태원/
        ├── 서래마을/
        ├── 대림동/
        └── 광희동/
```

학생 사진은 각 지역 폴더 바로 아래에 UUID 파일명으로 저장됩니다.

예:

```text
도시의미래탐구/
└── 다문화거리탐방/
    └── 이태원/
        ├── 16c42f2e-....jpg
        ├── d18790f4-....png
        └── ...
```

학생 이름과 학번은 파일명에 넣지 않고 `다문화거리탐방_제출현황` Google Sheet에서 관리합니다.

---

# 1. Google Apps Script 프로젝트 만들기

사진을 저장할 **실제 교사의 Google 계정**으로 아래 사이트에 접속합니다.

```text
https://script.google.com
```

새 프로젝트를 만들고 프로젝트 이름을 예를 들어:

```text
도시의미래탐구_다문화거리탐방
```

으로 설정합니다.

중요: 사진은 **이 Apps Script를 소유하고 배포한 Google 계정의 Drive**에 저장됩니다.

ChatGPT에 연결된 Google Drive와는 관계가 없습니다.

---

# 2. Apps Script에 파일 만들기

Apps Script 프로젝트에서 아래 7개 파일을 만듭니다.

### 스크립트 파일(.gs)

```text
Config.gs
Code.gs
Storage.gs
Gallery.gs
```

### HTML 파일

```text
Index.html
Styles.html
Script.html
```

GitHub의 `apps-script/` 폴더에 있는 각 파일 내용을 **동일한 이름의 Apps Script 파일에 그대로 복사**합니다.

기본으로 생성되는 `Code.gs`가 있다면 내용을 모두 지우고 이 저장소의 `Code.gs` 내용으로 교체합니다.

---

# 3. 저장공간 최초 생성

모든 코드를 붙여넣고 저장한 뒤 Apps Script 상단의 함수 선택 메뉴에서:

```text
setupStorage
```

를 선택합니다.

그 다음 **실행**을 누릅니다.

최초 실행 시 Google이 Drive / Spreadsheet 접근 권한을 요청합니다.

사진을 저장할 교사 Google 계정으로 권한을 허용합니다.

성공하면 Google Drive에 아래 폴더가 생성되어야 합니다.

```text
도시의미래탐구
└── 다문화거리탐방
```

그리고 그 안에:

```text
다문화거리탐방_제출현황
안산_원곡동
이태원
서래마을
대림동
광희동
```

이 생성됩니다.

---

# 4. 웹앱으로 배포

Apps Script 오른쪽 위에서:

```text
배포
→ 새 배포
```

를 선택합니다.

배포 유형은:

```text
웹 앱
```

을 선택합니다.

## 권장 설정

```text
설명
multi_culture v1

다음 사용자로 실행
나(Me)

액세스 권한
학생들이 접근할 수 있는 범위
```

학생들이 Google 로그인 없이 사용할 예정이라면 계정에서 제공되는 경우 **누구나(Anyone)** 로 설정합니다.

학교 Google Workspace 정책에 따라 익명 접근 옵션이 제한될 수 있습니다.

가장 중요한 항목은:

```text
다음 사용자로 실행 → 나(Me)
```

입니다.

그래야 학생이 사진을 제출할 때 학생 Drive가 아니라 **웹앱을 배포한 교사의 Google Drive**에 저장됩니다.

---

# 5. 학생에게 전달할 주소

배포가 끝나면 아래와 같은 Web app URL이 생성됩니다.

```text
https://script.google.com/macros/s/XXXXXXXXXXXX/exec
```

학생에게는 이 **/exec 주소**를 전달합니다.

QR 코드로 만들어 태블릿으로 접속하게 해도 됩니다.

GitHub Pages 주소는 사용하지 않습니다.

---

# 6. 학생 사용 흐름

```text
웹앱 접속
→ 이름 입력
→ 학번 입력
→ 탐방 시작
→ 지역 선택
→ NAVER 지도 열기
→ 거리뷰 탐방
→ 캡처
→ 웹앱으로 복귀
→ 사진 선택 또는 클립보드 붙여넣기
→ 제출
→ 다른 지역 탐방
```

학생 한 명은 지역별로 한 장씩 제출할 수 있습니다.

예:

```text
20317 김민수

안산      1장
이태원    1장
서래마을  1장
대림동    1장
광희동    1장
```

같은 학생이 같은 지역 사진을 다시 제출하면 새 사진이 추가되는 것이 아니라 **기존 사진이 교체**됩니다.

---

# 7. 선생님 전용 결과 화면

첫 화면 하단의:

```text
선생님 전용 · 탐방 결과 보기
```

버튼을 누릅니다.

기본 비밀번호:

```text
1234
```

비밀번호는 브라우저 JavaScript가 아니라 Apps Script 서버의 `Config.gs`에서 관리합니다.

```js
TEACHER_PASSWORD: '1234'
```

비밀번호가 맞으면 일정 시간 동안 사용할 수 있는 임시 교사 토큰이 발급되고, Gallery와 원본 이미지 요청에도 이 토큰 검증이 적용됩니다.

`1234`는 강한 보안용 비밀번호가 아니라 학생의 우발적인 접근을 막기 위한 간단한 수업용 비밀번호입니다.

필요하면 `Config.gs`에서 다른 값으로 변경하세요.

---

# 8. 탐방 결과 화면

선생님 결과 화면에서는:

- 전체 결과
- 안산
- 이태원
- 서래마을
- 대림동
- 광희동

으로 필터링할 수 있습니다.

각 결과에는:

```text
학번 + 학생 전체 이름
지역명
사진
```

이 표시됩니다.

사진을 클릭하면 전체화면으로 확대됩니다.

전체화면에서:

- 이전 버튼
- 다음 버튼
- 키보드 ← / →
- 모바일 좌우 스와이프
- 현재 사진 번호

를 사용할 수 있습니다.

---

# 9. 코드 수정 후 다시 배포하는 방법

Apps Script 코드를 수정하고 **저장만 하면 기존 /exec 배포에 바로 반영되지 않을 수 있습니다.**

수정 후:

```text
배포
→ 배포 관리
→ 현재 웹 앱 선택
→ 수정
→ 새 버전
→ 배포
```

순서로 새 버전을 배포합니다.

학생에게 이미 전달한 `/exec` URL은 같은 배포를 업데이트하는 방식이면 계속 사용할 수 있습니다.

개발 중에는 테스트 배포의 `/dev` URL을 사용할 수도 있지만, 실제 학생에게는 `/exec` URL을 사용합니다.

---

# 10. 다른 교사가 사용하는 방법

다른 교사가 이 프로젝트를 사용할 경우:

```text
1. 이 GitHub 저장소의 apps-script 파일 복사
2. 자기 Google 계정에서 새 Apps Script 프로젝트 생성
3. 7개 파일 생성 후 코드 붙여넣기
4. setupStorage() 실행
5. Google Drive 권한 승인
6. 웹 앱으로 배포
7. 생성된 /exec URL을 학생에게 배포
```

하면 됩니다.

각 교사는 자기 Google 계정으로 배포하므로 제출 사진도 **각자의 Google Drive**에 저장됩니다.

---

# 설정 변경

대부분의 수업 설정은 `Config.gs`에서 변경할 수 있습니다.

예:

```js
APP_TITLE: '도시의 미래탐구',
ACTIVITY_TITLE: '다문화 거리 탐방',

COURSE_FOLDER_NAME: '도시의미래탐구',
ACTIVITY_FOLDER_NAME: '다문화거리탐방',

TEACHER_PASSWORD: '1234',
MAX_IMAGE_SIZE_MB: 10,
```

탐방 지역의 좌표, 폴더명, 설명도 `Config.gs`의 `LOCATIONS`에서 수정합니다.

---

# 개인정보 / 보안

이 프로젝트는 다음 정보만 저장하도록 구성되어 있습니다.

- 학번
- 이름
- 선택한 지역
- 제출 사진
- 제출/수정 시간

사진 파일명에는 학생 이름이나 학번을 넣지 않습니다.

Google Drive의 사진 파일을 인터넷 전체 공개 상태로 바꾸지 않습니다.

교사용 Gallery는 Apps Script 서버에서 교사 토큰을 확인한 뒤 이미지를 읽습니다.

---

# 운영 전 테스트 체크리스트

실제 수업 전 아래 항목을 한 번씩 확인하세요.

- [ ] `setupStorage()` 실행 성공
- [ ] Drive 폴더 구조 정상 생성
- [ ] Web app 배포 완료
- [ ] 학생용 `/exec` 주소 접속 가능
- [ ] 이름 / 학번 입력 가능
- [ ] 5개 지역 카드 정상 표시
- [ ] NAVER 지도 앱 실행 확인
- [ ] 사진 파일 선택 제출 성공
- [ ] 실제 Drive 지역 폴더에 사진 저장
- [ ] 제출현황 Sheet에 학생정보 기록
- [ ] 같은 지역 재제출 시 기존 사진 교체
- [ ] 다른 지역에는 별도 사진 추가
- [ ] 교사용 비밀번호 `1234` 확인
- [ ] 결과 Gallery 정상 표시
- [ ] 사진 클릭 시 전체화면 표시
- [ ] 이전 / 다음 / 스와이프 정상 동작
- [ ] 실제 학교 태블릿에서 클립보드 붙여넣기 지원 여부 확인

---

## 참고

이 저장소는 코드 원본과 배포 설명을 보관하는 용도입니다.

실제 서비스 흐름은:

```text
학생 태블릿
    ↓
Google Apps Script Web app
    ↓
Google Drive + Google Sheet
```

입니다.


---

## 자주 발생하는 오류

### `SyntaxError: Unexpected token '<'` / `Gallery.gs`

`.gs` 파일 안에 `<script>`, `</script>` 또는 Markdown 코드블록 표시가 들어간 경우 발생할 수 있습니다.

Apps Script에서는 다음 파일을 **스크립트 파일**로 생성합니다.

```text
Config
Code
Storage
Gallery
```

그리고 GitHub의 각 `.gs` 파일 **내용만** 붙여넣습니다.

`Storage.gs` 첫 줄은 다음과 같아야 합니다.

```js
function setupStorage() {
```

프로젝트의 어느 `.gs` 파일에라도 문법 오류가 있으면 `setupStorage`가 함수 선택 목록에 표시되지 않을 수 있습니다.

### 학번이 숫자인데 `학번은 숫자로 입력해주세요`

최신 `Storage.gs`와 `Script.html`을 사용하세요.

현재 버전은 학번을 숫자 2~10자리로 검사하며, 서버에서는 앞뒤 공백과 전각 숫자도 정규화합니다.

### `runner[method] is not a function`

이전 `Script.html`의 동적 `google.script.run` 호출 방식에서 발생한 오류입니다.

최신 `Script.html`은 각 Apps Script 서버 함수를 명시적으로 호출하도록 수정되어 있습니다.

이 오류가 보이면 GitHub의 최신 `Script.html`로 교체하고 웹앱을 **새 버전으로 재배포**하세요.

---

## 현재 최종 파일

```text
README.md
apps-script/
├── Config.gs
├── Code.gs
├── Storage.gs
├── Gallery.gs
├── Index.html
├── Styles.html
└── Script.html
```

기존 GitHub Pages 및 Cloudflare Backend 파일은 사용하지 않습니다.
