window.MULTI_CULTURE_CONFIG = {
  appName: "multi_culture",
  grade: 2,
  classes: ["A"],

  // "demo": 브라우저 IndexedDB에 저장합니다.
  // "api": backendUrl의 REST API를 사용합니다.
  storageMode: "demo",
  backendUrl: "",

  // 갤러리 학생명 표기: "masked" | "full"
  galleryNameMode: "full",

  // 정적 GitHub Pages 미리보기용 교사 비밀번호. Apps Script에서는 서버 검증으로 옮깁니다.
  teacherPassword: "1234",

  // 사진 1장당 업로드 제한
  maxImageBytes: 10 * 1024 * 1024,
};
