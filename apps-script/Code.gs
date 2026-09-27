function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE + ' - ' + CONFIG.ACTIVITY_TITLE);
}

function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}

function getClientConfig() {
  return {
    appTitle: CONFIG.APP_TITLE,
    activityTitle: CONFIG.ACTIVITY_TITLE,
    grade: CONFIG.GRADE,
    maxImageSizeMb: CONFIG.MAX_IMAGE_SIZE_MB,
    locations: CONFIG.LOCATIONS,
  };
}
