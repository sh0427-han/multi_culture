const CONFIG = {
  APP_NAME: 'multi_culture',
  APP_TITLE: '도시의 미래탐구',
  ACTIVITY_TITLE: '다문화 거리 탐방',

  COURSE_FOLDER_NAME: '도시의미래탐구',
  ACTIVITY_FOLDER_NAME: '다문화거리탐방',
  SPREADSHEET_NAME: '다문화거리탐방_제출현황',

  GRADE: 2,
  MAX_IMAGE_SIZE_MB: 10,

  // 학생 실수 방지용 간단한 교사용 비밀번호입니다.
  // 더 강한 보호가 필요하면 이 값을 변경하세요.
  TEACHER_PASSWORD: '1234',
  TEACHER_SESSION_SECONDS: 6 * 60 * 60,

  LOCATIONS: {
    ansan: {
      id: 'ansan',
      index: '01',
      folderName: '안산_원곡동',
      name: '안산 원곡동',
      subtitle: '다문화마을특구',
      naverQuery: '안산 다문화음식거리',
      latitude: 37.3299168,
      longitude: 126.7896595,
      zoom: 20,
      description:
        '다국어 간판, 외국 음식점과 식재료점 등 다양한 문화가 함께 나타나는 경관을 관찰합니다.',
    },

    itaewon: {
      id: 'itaewon',
      index: '02',
      folderName: '이태원',
      name: '이태원',
      subtitle: '이슬람 거리',
      naverQuery: '이태원 이슬람거리',
      naverPlaceName: '이태원 이슬람거리',
      latitude: 37.5334001039,
      longitude: 126.9975035607,
      zoom: 20,
      description:
        '서울중앙성원 주변의 할랄 음식점, 상점, 언어와 종교 경관을 중심으로 살펴봅니다.',
    },

    seorae: {
      id: 'seorae',
      index: '03',
      folderName: '서래마을',
      name: '반포',
      subtitle: '서래마을',
      naverQuery: '서래마을',
      latitude: 37.4963433,
      longitude: 126.9981601,
      zoom: 20,
      description:
        '프랑스 문화와 관련된 상점, 음식점, 거리 분위기와 표지 등을 찾아봅니다.',
    },

    daerim: {
      id: 'daerim',
      index: '04',
      folderName: '대림동',
      name: '대림동',
      subtitle: '차이나타운',
      naverQuery: '대림동 차이나타운',
      naverPlaceName: '대림동 차이나타운',
      latitude: 37.4924530714,
      longitude: 126.8975138236,
      zoom: 20,
      description:
        '중국어 간판, 식문화, 시장 경관 등 중국계 이주민 문화가 드러나는 요소를 찾아봅니다.',
    },

    gwanghui: {
      id: 'gwanghui',
      index: '05',
      folderName: '광희동',
      name: '광희동',
      subtitle: '중앙아시아 거리',
      naverQuery: '광희동 중앙아시아거리',
      latitude: 37.5656667,
      longitude: 127.0057389,
      zoom: 20,
      description:
        '중앙아시아 음식점과 상점, 다양한 문자와 상품이 나타나는 거리 경관을 관찰합니다.',
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
