# Google Drive Backend

이 디렉터리는 학생들의 사진을 교사의 **개인 Google Drive**에 저장하고,
여러 태블릿이 같은 Gallery를 볼 수 있게 하는 Cloudflare Worker 예시입니다.

프론트엔드와 분리되어 있으므로 다른 교사가 저장소를 Clone한 뒤
자기 Google 계정으로 다시 연결할 수 있습니다.

## 구성

- Cloudflare Worker: 업로드/조회 API
- Cloudflare D1: 제출 metadata
- Google Drive: 실제 이미지 파일
- Google OAuth 2.0: 교사 개인 Gmail 권한
- Drive scope: `drive.file`

Google refresh token과 Client Secret은 GitHub Pages에 절대 넣지 않습니다.

## 1. Google Cloud 설정

1. Google Cloud 프로젝트 생성
2. Google Drive API 활성화
3. OAuth consent screen 구성
4. Web application OAuth Client 생성
5. Redirect URI에 아래 주소 등록

```text
https://YOUR-WORKER.workers.dev/oauth/callback
```

테스트 중이라면 본인의 Gmail을 OAuth 테스트 사용자로 추가합니다.

## 2. Cloudflare D1

```bash
npx wrangler d1 create multi-culture
```

출력된 database_id를 `wrangler.toml`에 입력한 뒤:

```bash
npx wrangler d1 execute multi-culture --remote --file=./schema.sql
```

## 3. Worker 설정

`wrangler.toml.example`을 `wrangler.toml`로 복사하고:

```toml
ALLOWED_ORIGIN = "https://YOUR_GITHUB_ID.github.io"
```

로 수정합니다.

다음 값은 반드시 Worker Secret으로 저장합니다.

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put TOKEN_ENCRYPTION_KEY
npx wrangler secret put ADMIN_SETUP_KEY
```

`TOKEN_ENCRYPTION_KEY`는 Base64로 인코딩된 32바이트 값이어야 합니다.

예:

```bash
openssl rand -base64 32
```

## 4. 배포

```bash
npx wrangler deploy
```

## 5. 교사 Google Drive 연결

배포 후 브라우저에서:

```text
https://YOUR-WORKER.workers.dev/admin/connect-google?setup_key=ADMIN_SETUP_KEY
```

로 접속하고 자신의 Google 계정으로 권한을 승인합니다.

정상 연결되면 교사 Drive에 아래 폴더가 자동 생성됩니다.

```text
multi_culture/
```

학생이 제출할 때:

```text
multi_culture/
├── A반/
│   ├── ansan/
│   ├── itaewon/
│   ├── seorae/
│   ├── daerim/
│   └── gwanghui/
├── B반/
└── ...
```

구조가 자동으로 만들어집니다.

## 6. 프론트엔드 연결

`js/config.js`:

```js
storageMode: "api",
backendUrl: "https://YOUR-WORKER.workers.dev",
```

로 변경합니다.

## API

### POST /submissions

`multipart/form-data`

- grade
- classId
- studentName
- studentNumber
- locationId
- locationName
- images (여러 개 허용)

### GET /submissions?class_id=A&location_id=itaewon

`location_id`는 생략할 수 있습니다.

### GET /images/:fileId

Drive의 비공개 이미지를 Worker가 인증 후 전달합니다.
Drive 파일을 웹 전체 공개로 바꾸지 않아도 Gallery에 표시할 수 있습니다.

## 보안

- Google refresh token은 D1에 AES-GCM으로 암호화해 저장합니다.
- 암호화 키는 Worker Secret에만 둡니다.
- OAuth Client Secret과 refresh token은 GitHub 저장소에 커밋하지 않습니다.
- `ALLOWED_ORIGIN`은 실제 GitHub Pages origin으로 제한합니다.
