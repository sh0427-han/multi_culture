window.MULTI_CULTURE_CONFIG = {
  appName: "multi_culture",
  grade: 2,
  classes: ["A", "B", "C", "D", "E"],

  // "demo": 브라우저 IndexedDB에 저장합니다.
  // "api": backendUrl의 REST API를 사용합니다.
  storageMode: "demo",
  backendUrl: "",

  // 갤러리 학생명 표기: "masked" | "full"
  galleryNameMode: "masked",

  // 사진 업로드 제한
  maxImageBytes: 10 * 1024 * 1024,
};
