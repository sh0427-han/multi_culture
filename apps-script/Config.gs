const CONFIG = {
  APP_NAME: 'multi_culture',
  APP_TITLE: '도시의 미래탐구',
  ACTIVITY_TITLE: '다문화 거리 탐방',

  COURSE_FOLDER_NAME: '도시의미래탐구',
  ACTIVITY_FOLDER_NAME: '다문화거리탐방',
  SPREADSHEET_NAME: '다문화거리탐방_제출현황',

  GRADE: 2,

  // 단일 반 운영
  CLASS_ID: 'A',

  // 교사용 결과 화면 비밀번호
  TEACHER_PASSWORD: '1234',

  MAX_IMAGE_SIZE_MB: 10,

  LOCATIONS: {
    ansan: {
      id: 'ansan',
      folderName: '안산_원곡동',
      name: '안산 원곡동',
      subtitle: '다문화마을특구',
    },
    itaewon: {
      id: 'itaewon',
      folderName: '이태원',
      name: '이태원',
      subtitle: '이슬람 거리',
    },
    seorae: {
      id: 'seorae',
      folderName: '서래마을',
      name: '반포',
      subtitle: '서래마을',
    },
    daerim: {
      id: 'daerim',
      folderName: '대림동',
      name: '대림동',
      subtitle: '차이나타운',
    },
    gwanghui: {
      id: 'gwanghui',
      folderName: '광희동',
      name: '광희동',
      subtitle: '중앙아시아 거리',
    },
  },
};

const SHEET_HEADERS = [
  'record_id',
  'student_number',
  'student_name',
  'location_id',
  'location_name',
  'file_id',
  'submitted_at',
  'updated_at',
];
