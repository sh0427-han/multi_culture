function setupStorage() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();

    // 1) 내 드라이브 / 도시의미래탐구
    const courseFolder = getOrCreateRootFolder_(CONFIG.COURSE_FOLDER_NAME);

    // 2) 내 드라이브 / 도시의미래탐구 / 다문화거리탐방
    const activityFolder = getOrCreateChildFolder_(
      courseFolder,
      CONFIG.ACTIVITY_FOLDER_NAME
    );

    props.setProperties({
      COURSE_FOLDER_ID: courseFolder.getId(),
      ACTIVITY_FOLDER_ID: activityFolder.getId(),
    });

    // 3) 지역별 폴더
    Object.keys(CONFIG.LOCATIONS).forEach(function(locationId) {
      const location = CONFIG.LOCATIONS[locationId];
      const folder = getOrCreateChildFolder_(
        activityFolder,
        location.folderName
      );

      props.setProperty(
        getLocationFolderPropertyKey_(locationId),
        folder.getId()
      );
    });

    // 4) 제출현황 Sheet
    let spreadsheet = null;
    const savedSpreadsheetId = props.getProperty('SPREADSHEET_ID');

    if (savedSpreadsheetId) {
      try {
        spreadsheet = SpreadsheetApp.openById(savedSpreadsheetId);
      } catch (error) {
        spreadsheet = null;
      }
    }

    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);

      DriveApp
        .getFileById(spreadsheet.getId())
        .moveTo(activityFolder);

      props.setProperty('SPREADSHEET_ID', spreadsheet.getId());
    }

    let sheet = spreadsheet.getSheetByName('submissions');

    if (!sheet) {
      sheet = spreadsheet.insertSheet('submissions');
    }

    if (sheet.getLastRow() === 0) {
      sheet
        .getRange(1, 1, 1, SHEET_HEADERS.length)
        .setValues([SHEET_HEADERS]);

      sheet.setFrozenRows(1);

      // 학번은 문자열로 유지
      sheet.getRange('B:B').setNumberFormat('@');
    }

    return {
      success: true,
      courseFolderUrl: courseFolder.getUrl(),
      activityFolderUrl: activityFolder.getUrl(),
      spreadsheetUrl: spreadsheet.getUrl(),
    };
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateRootFolder_(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(folderName);
}

function getOrCreateChildFolder_(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

function getLocationFolderPropertyKey_(locationId) {
  return 'LOCATION_FOLDER_' + locationId;
}

function getLocationFolder_(locationId) {
  const folderId = PropertiesService
    .getScriptProperties()
    .getProperty(getLocationFolderPropertyKey_(locationId));

  if (!folderId) {
    throw new Error(
      '지역 저장 폴더가 설정되지 않았습니다. setupStorage()를 다시 실행하세요.'
    );
  }

  return DriveApp.getFolderById(folderId);
}

function getSubmissionSheet_() {
  const spreadsheetId = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    throw new Error(
      '제출현황 Sheet가 설정되지 않았습니다. setupStorage()를 다시 실행하세요.'
    );
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName('submissions');

  if (!sheet) {
    throw new Error('submissions 시트를 찾을 수 없습니다.');
  }

  return sheet;
}

function submitPhoto(formObject) {
  if (!formObject || !formObject.image) {
    throw new Error('사진이 전달되지 않았습니다.');
  }

  const metadata = {
    studentNumber: String(formObject.studentNumber || ''),
    studentName: String(formObject.studentName || ''),
    locationId: String(formObject.locationId || ''),
  };

  return saveSubmission_(metadata, formObject.image);
}

function submitClipboardPhoto(payload) {
  if (!payload || !payload.base64) {
    throw new Error('클립보드 이미지가 전달되지 않았습니다.');
  }

  const mimeType = payload.mimeType || 'image/png';
  const bytes = Utilities.base64Decode(payload.base64);
  const blob = Utilities.newBlob(
    bytes,
    mimeType,
    payload.fileName || Utilities.getUuid() + getExtension_(mimeType)
  );

  const metadata = {
    studentNumber: String(payload.studentNumber || ''),
    studentName: String(payload.studentName || ''),
    locationId: String(payload.locationId || ''),
  };

  return saveSubmission_(metadata, blob);
}

function saveSubmission_(metadata, imageBlob) {
  validateMetadata_(metadata);
  validateImageBlob_(imageBlob);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = getSubmissionSheet_();
    const existing = findSubmission_(
      sheet,
      metadata.studentNumber,
      metadata.locationId
    );

    const locationFolder = getLocationFolder_(metadata.locationId);
    const mimeType = imageBlob.getContentType();

    imageBlob.setName(
      Utilities.getUuid() + getExtension_(mimeType)
    );

    const newFile = locationFolder.createFile(imageBlob);
    const now = new Date();
    const location = CONFIG.LOCATIONS[metadata.locationId];

    if (existing) {
      sheet
        .getRange(
          existing.rowNumber,
          1,
          1,
          SHEET_HEADERS.length
        )
        .setValues([[
          existing.recordId,
          metadata.studentNumber,
          metadata.studentName,
          metadata.locationId,
          location.name + ' ' + location.subtitle,
          newFile.getId(),
          existing.submittedAt,
          now,
        ]]);

      if (
        existing.fileId &&
        existing.fileId !== newFile.getId()
      ) {
        try {
          DriveApp
            .getFileById(existing.fileId)
            .setTrashed(true);
        } catch (error) {
          console.log('기존 파일 삭제 실패:', error);
        }
      }

      return {
        success: true,
        recordId: existing.recordId,
        locationId: metadata.locationId,
        replaced: true,
      };
    }

    const recordId = Utilities.getUuid();

    sheet.appendRow([
      recordId,
      metadata.studentNumber,
      metadata.studentName,
      metadata.locationId,
      location.name + ' ' + location.subtitle,
      newFile.getId(),
      now,
      now,
    ]);

    return {
      success: true,
      recordId,
      locationId: metadata.locationId,
      replaced: false,
    };
  } finally {
    lock.releaseLock();
  }
}

function findSubmission_(sheet, studentNumber, locationId) {
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
    const row = values[index];

    if (
      String(row[1]) === studentNumber &&
      String(row[3]) === locationId
    ) {
      return {
        rowNumber: index + 2,
        recordId: String(row[0]),
        fileId: String(row[5]),
        submittedAt: row[6] || new Date(),
      };
    }
  }

  return null;
}

function validateMetadata_(metadata) {
  if (!CONFIG.LOCATIONS[metadata.locationId]) {
    throw new Error('올바르지 않은 탐방 지역입니다.');
  }

  if (!/^\d{2,10}$/.test(metadata.studentNumber)) {
    throw new Error('학번은 숫자로 입력해주세요.');
  }

  const name = metadata.studentName.trim();

  if (name.length < 2 || name.length > 20) {
    throw new Error('이름을 정확하게 입력해주세요.');
  }

  metadata.studentName = name;
}

function validateImageBlob_(blob) {
  const mimeType = blob.getContentType();

  if (!mimeType || !mimeType.startsWith('image/')) {
    throw new Error('이미지 파일만 제출할 수 있습니다.');
  }

  const maxBytes =
    CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024;

  if (blob.getBytes().length > maxBytes) {
    throw new Error(
      '사진은 ' +
      CONFIG.MAX_IMAGE_SIZE_MB +
      'MB 이하만 제출할 수 있습니다.'
    );
  }
}

function getExtension_(mimeType) {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  return map[mimeType] || '.img';
}
