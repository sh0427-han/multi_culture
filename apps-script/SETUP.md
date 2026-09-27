# Google Apps Script 저장 구조

최종 Drive 구조:

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

반 폴더는 사용하지 않습니다.

학생 구분은 제출현황 Sheet의 학번/이름으로 관리합니다.
학생 1명은 지역별 사진 1장만 유지하며 같은 지역 재제출 시 기존 사진을 교체합니다.

## 기존 setupStorage()를 이미 실행했다면

1. Apps Script의 Config.gs와 Storage.gs를 이 폴더의 최신 코드로 교체합니다.
2. setupStorage()를 다시 실행합니다.
3. 새 폴더 구조가 생성됐는지 확인합니다.

기존 A반/B반/C반/D반 폴더는 자동 삭제하지 않습니다.
테스트용이라 필요 없다면 Drive에서 직접 삭제해도 됩니다.

새 제출은 모두 새 구조의 지역 폴더에 저장됩니다.

교사용 Gallery 비밀번호는 Config.gs의:

```js
TEACHER_PASSWORD: '1234'
```

로 설정되어 있으며, Apps Script에서는 verifyTeacherPassword() 서버 함수로 검증합니다.
