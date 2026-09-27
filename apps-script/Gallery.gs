function authenticateTeacher(password) {
  if (String(password || '') !== CONFIG.TEACHER_PASSWORD) {
    throw new Error('비밀번호가 올바르지 않습니다.');
  }

  const token = Utilities.getUuid();

  CacheService
    .getScriptCache()
    .put(
      'teacher:' + token,
      '1',
      CONFIG.TEACHER_SESSION_SECONDS
    );

  return {
    token: token,
    expiresInSeconds: CONFIG.TEACHER_SESSION_SECONDS,
  };
}

function requireTeacherToken_(token) {
  if (!token) {
    throw new Error('교사 인증이 필요합니다.');
  }

  const value = CacheService
    .getScriptCache()
    .get('teacher:' + token);

  if (value !== '1') {
    throw new Error(
      '교사 인증 시간이 만료되었습니다. 다시 로그인해주세요.'
    );
  }
}

function getStudentSubmissionStatus(studentNumber) {
  studentNumber = String(studentNumber || '');

  const sheet = getSubmissionSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      SHEET_HEADERS.length
    )
    .getValues();

  const submitted = new Set();

  values.forEach(function(row) {
    if (String(row[1]) === studentNumber) {
      submitted.add(String(row[3]));
    }
  });

  return Array.from(submitted);
}

function getGallery(teacherToken, locationId) {
  requireTeacherToken_(teacherToken);

  locationId = String(locationId || '');

  if (locationId && !CONFIG.LOCATIONS[locationId]) {
    throw new Error('올바르지 않은 지역입니다.');
  }

  const sheet = getSubmissionSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      SHEET_HEADERS.length
    )
    .getValues();

  const locationOrder = Object.keys(CONFIG.LOCATIONS);

  return values
    .filter(function(row) {
      return !locationId || String(row[3]) === locationId;
    })
    .map(function(row) {
      return {
        recordId: String(row[0]),
        studentNumber: String(row[1]),
        studentName: String(row[2]),
        locationId: String(row[3]),
        locationName: String(row[4]),
        updatedAt: dateToIso_(row[7]),
      };
    })
    .sort(function(a, b) {
      const locationDiff =
        locationOrder.indexOf(a.locationId) -
        locationOrder.indexOf(b.locationId);

      if (locationDiff !== 0) {
        return locationDiff;
      }

      return Number(a.studentNumber) - Number(b.studentNumber);
    });
}

function getImageData(
  teacherToken,
  recordId,
  useThumbnail
) {
  requireTeacherToken_(teacherToken);

  const fileId = getFileIdFromRecord_(
    String(recordId || '')
  );

  if (!fileId) {
    throw new Error('사진을 찾을 수 없습니다.');
  }

  const file = DriveApp.getFileById(fileId);
  let blob = useThumbnail ? file.getThumbnail() : null;

  if (!blob) {
    blob = file.getBlob();
  }

  return {
    recordId: String(recordId),
    dataUrl:
      'data:' +
      blob.getContentType() +
      ';base64,' +
      Utilities.base64Encode(blob.getBytes()),
  };
}

function getFileIdFromRecord_(recordId) {
  if (!recordId) {
    return null;
  }

  const sheet = getSubmissionSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const values = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      SHEET_HEADERS.length
    )
    .getValues();

  for (let index = 0; index < values.length; index++) {
    if (String(values[index][0]) === recordId) {
      return String(values[index][5]);
    }
  }

  return null;
}

function dateToIso_(value) {
  return value instanceof Date
    ? value.toISOString()
    : String(value || '');
}
