(() => {
  "use strict";

  const config = window.MULTI_CULTURE_CONFIG;
  const locations = window.MULTI_CULTURE_LOCATIONS;
  const stateKey = "multiCultureStudentStateV1";

  const screens = {
    profile: document.getElementById("profileScreen"),
    locations: document.getElementById("locationScreen"),
    explore: document.getElementById("exploreScreen"),
    upload: document.getElementById("uploadScreen"),
    success: document.getElementById("successScreen"),
    gallery: document.getElementById("galleryScreen"),
  };

  const state = {
    student: null,
    selectedLocationId: null,
    selectedFiles: [],
    galleryLocationId: "",
  };

  let previewUrls = [];

  function saveState() {
    sessionStorage.setItem(
      stateKey,
      JSON.stringify({
        student: state.student,
        selectedLocationId: state.selectedLocationId,
      }),
    );
  }

  function restoreState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(stateKey) || "null");
      if (saved && saved.student) {
        state.student = saved.student;
        state.selectedLocationId = saved.selectedLocationId || null;
      }
    } catch (error) {
      sessionStorage.removeItem(stateKey);
    }
  }

  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[name].classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    updateStudentBadge();
  }

  function updateStudentBadge() {
    const badge = document.getElementById("studentBadge");
    if (!state.student) {
      badge.classList.add("hidden");
      return;
    }

    badge.textContent =
      `${config.grade}학년 ${state.student.classId}반 · ` +
      `${state.student.studentNumber} ${state.student.studentName}`;
    badge.classList.remove("hidden");
  }

  function populateClassOptions() {
    const selects = [
      document.getElementById("classSelect"),
      document.getElementById("galleryClassSelect"),
    ];

    selects.forEach((select) => {
      config.classes.forEach((classId) => {
        const option = document.createElement("option");
        option.value = classId;
        option.textContent = `${classId}반`;
        select.appendChild(option);
      });
    });
  }

  function renderLocations() {
    const grid = document.getElementById("locationGrid");
    grid.replaceChildren();

    locations.forEach((location) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "location-card";
      button.innerHTML = `
        <span class="location-index">${location.index}</span>
        <h3>${location.name}<br>${location.subtitle}</h3>
        <p>${location.description}</p>
        <span class="card-action">이 지역 선택 →</span>
      `;
      button.addEventListener("click", () => selectLocation(location.id));
      grid.appendChild(button);
    });
  }

  function selectLocation(locationId) {
    state.selectedLocationId = locationId;
    clearSelectedImages();
    saveState();
    renderExploreScreen();
    showScreen("explore");
  }

  function currentLocation() {
    return locations.find((item) => item.id === state.selectedLocationId);
  }

  function renderExploreScreen() {
    const location = currentLocation();
    if (!location) {
      showScreen("locations");
      return;
    }

    document.getElementById("exploreTitle").innerHTML =
      `${location.name}<br>${location.subtitle}`;
    document.getElementById("exploreDescription").textContent =
      location.description;
  }

  function buildNaverUrl(location) {
    const appName = encodeURIComponent(
      `${window.location.origin}${window.location.pathname}`,
    );

    const params =
      `lat=${location.latitude}&lng=${location.longitude}` +
      `&zoom=${location.zoom || 20}&appname=${appName}`;

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      return (
        `intent://map?${params}` +
        "#Intent;scheme=nmap;action=android.intent.action.VIEW;" +
        "category=android.intent.category.BROWSABLE;" +
        "package=com.nhn.android.nmap;end"
      );
    }

    return `nmap://map?${params}`;
  }

  function openNaverMap() {
    const location = currentLocation();
    if (!location) {
      return;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      window.open(
        `https://map.naver.com/p/search/${encodeURIComponent(location.naverQuery)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    const deepLink = buildNaverUrl(location);
    const clickedAt = Date.now();
    window.location.href = deepLink;

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.setTimeout(() => {
        if (Date.now() - clickedAt < 2200 && !document.hidden) {
          window.location.href = "https://apps.apple.com/app/id311867728";
        }
      }, 1600);
    }
  }

  function renderUploadScreen() {
    const location = currentLocation();
    if (!location || !state.student) {
      showScreen("locations");
      return;
    }

    document.getElementById("uploadLocationLabel").textContent =
      `${location.name} ${location.subtitle}`;
    document.getElementById("summaryClass").textContent =
      `${state.student.classId}반`;
    document.getElementById("summaryName").textContent =
      state.student.studentName;
    document.getElementById("summaryNumber").textContent =
      state.student.studentNumber;
    renderSelectedImages();
  }

  function revokePreviewUrls() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
  }

  function clearSelectedImages() {
    state.selectedFiles = [];
    const input = document.getElementById("imageInput");
    if (input) {
      input.value = "";
    }
    revokePreviewUrls();
    if (document.getElementById("previewGrid")) {
      renderSelectedImages();
    }
  }

  function fileKey(file) {
    return `${file.name}:${file.size}:${file.lastModified}`;
  }

  function validateImage(file) {
    if (!file.type.startsWith("image/")) {
      return "이미지 파일만 추가할 수 있습니다.";
    }

    if (file.size > config.maxImageBytes) {
      return "사진 한 장의 크기는 10MB 이하여야 합니다.";
    }

    return "";
  }

  function addSelectedFiles(files) {
    const errorElement = document.getElementById("uploadError");
    errorElement.textContent = "";

    const existing = new Set(state.selectedFiles.map(fileKey));
    let added = 0;

    Array.from(files).forEach((file) => {
      const error = validateImage(file);
      if (error) {
        errorElement.textContent = error;
        return;
      }

      const key = fileKey(file);
      if (existing.has(key)) {
        return;
      }

      existing.add(key);
      state.selectedFiles.push(file);
      added += 1;
    });

    if (!added && !state.selectedFiles.length && !errorElement.textContent) {
      errorElement.textContent = "추가할 이미지가 없습니다.";
    }

    renderSelectedImages();
  }

  function renderSelectedImages() {
    const section = document.getElementById("previewSection");
    const grid = document.getElementById("previewGrid");
    const count = document.getElementById("previewCount");
    const submitButton = document.getElementById("submitButton");

    if (!section || !grid || !count || !submitButton) {
      return;
    }

    revokePreviewUrls();
    grid.replaceChildren();

    if (!state.selectedFiles.length) {
      section.classList.add("hidden");
      count.textContent = "0장 선택됨";
      submitButton.disabled = true;
      submitButton.textContent = "사진 제출하기";
      return;
    }

    section.classList.remove("hidden");
    count.textContent = `${state.selectedFiles.length}장 선택됨`;
    submitButton.disabled = false;
    submitButton.textContent = `${state.selectedFiles.length}장 제출하기`;

    state.selectedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "preview-item";

      const image = document.createElement("img");
      const url = URL.createObjectURL(file);
      previewUrls.push(url);
      image.src = url;
      image.alt = `제출 사진 ${index + 1}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "preview-remove";
      removeButton.setAttribute("aria-label", `${index + 1}번째 사진 삭제`);
      removeButton.textContent = "×";
      removeButton.addEventListener("click", () => {
        state.selectedFiles.splice(index, 1);
        renderSelectedImages();
      });

      item.append(image, removeButton);
      grid.appendChild(item);
    });
  }

  function makeClipboardFile(blob, index) {
    const extension = blob.type === "image/jpeg" ? "jpg" : "png";
    return new File(
      [blob],
      `clipboard-${Date.now()}-${index + 1}.${extension}`,
      {
        type: blob.type || "image/png",
        lastModified: Date.now(),
      },
    );
  }

  async function pasteImagesFromClipboard() {
    const errorElement = document.getElementById("uploadError");
    errorElement.textContent = "";

    if (!navigator.clipboard || !navigator.clipboard.read) {
      errorElement.textContent =
        "이 브라우저에서는 클립보드 이미지 읽기를 지원하지 않습니다. 사진 파일 선택을 이용해 주세요.";
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();
      const files = [];

      for (const item of clipboardItems) {
        const imageTypes = item.types.filter((type) => type.startsWith("image/"));
        for (const type of imageTypes) {
          const blob = await item.getType(type);
          files.push(makeClipboardFile(blob, files.length));
        }
      }

      if (!files.length) {
        errorElement.textContent =
          "클립보드에서 이미지를 찾지 못했습니다. 캡처 후 다시 시도해 주세요.";
        return;
      }

      addSelectedFiles(files);
    } catch (error) {
      errorElement.textContent =
        "클립보드 접근이 허용되지 않았습니다. 브라우저 권한을 허용하거나 사진 파일 선택을 이용해 주세요.";
    }
  }

  function handlePasteEvent(event) {
    if (!screens.upload.classList.contains("active")) {
      return;
    }

    const files = Array.from(event.clipboardData?.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!files.length) {
      return;
    }

    event.preventDefault();
    addSelectedFiles(files);
  }

  async function submitImages() {
    const location = currentLocation();
    const button = document.getElementById("submitButton");
    const errorElement = document.getElementById("uploadError");

    if (!state.student || !location || !state.selectedFiles.length) {
      errorElement.textContent = "제출할 사진을 한 장 이상 추가해 주세요.";
      return;
    }

    button.disabled = true;
    button.textContent = "제출 중...";
    errorElement.textContent = "";

    try {
      await window.SubmissionApi.upload(
        {
          grade: String(config.grade),
          classId: state.student.classId,
          studentName: state.student.studentName,
          studentNumber: state.student.studentNumber,
          locationId: location.id,
          locationName: `${location.name} ${location.subtitle}`,
        },
        state.selectedFiles,
      );

      clearSelectedImages();
      showScreen("success");
    } catch (error) {
      errorElement.textContent =
        error instanceof Error ? error.message : "제출 중 오류가 발생했습니다.";
      button.disabled = false;
      button.textContent = `${state.selectedFiles.length}장 제출하기`;
    }
  }

  function maskName(name) {
    if (config.galleryNameMode === "full" || name.length <= 1) {
      return name;
    }
    if (name.length === 2) {
      return `${name[0]}○`;
    }
    return `${name[0]}○${name[name.length - 1]}`;
  }

  function renderGalleryFilters() {
    const row = document.getElementById("galleryFilters");
    row.replaceChildren();

    const filters = [
      { id: "", label: "전체" },
      ...locations.map((location) => ({
        id: location.id,
        label: location.name,
      })),
    ];

    filters.forEach((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        `filter-button ${state.galleryLocationId === filter.id ? "active" : ""}`;
      button.textContent = filter.label;
      button.addEventListener("click", () => {
        state.galleryLocationId = filter.id;
        renderGalleryFilters();
        loadGallery();
      });
      row.appendChild(button);
    });
  }

  async function loadGallery() {
    const classId = document.getElementById("galleryClassSelect").value;
    const grid = document.getElementById("galleryGrid");
    const status = document.getElementById("galleryStatus");

    grid.replaceChildren();
    status.textContent = "결과를 불러오는 중입니다...";

    try {
      const submissions = await window.SubmissionApi.list({
        classId,
        locationId: state.galleryLocationId,
      });

      status.textContent = `${classId}반 · ${submissions.length}개의 장면`;

      if (!submissions.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "아직 제출된 사진이 없습니다.";
        grid.appendChild(empty);
        return;
      }

      submissions.forEach((submission) => {
        const location =
          locations.find((item) => item.id === submission.locationId);
        const card = document.createElement("article");
        card.className = "gallery-card";

        const image = document.createElement("img");
        image.src = submission.imageUrl || submission.image_url || "";
        image.alt = `${location?.name || "탐방"} 제출 사진`;
        image.loading = "lazy";

        const info = document.createElement("div");
        info.className = "gallery-card-info";

        const studentLabel = document.createElement("strong");
        studentLabel.textContent =
          `${submission.studentNumber} ${maskName(submission.studentName)}`;

        const locationLabel = document.createElement("span");
        locationLabel.textContent = location
          ? `${location.name} ${location.subtitle}`
          : "";

        info.append(studentLabel, locationLabel);
        card.append(image, info);
        grid.appendChild(card);
      });
    } catch (error) {
      status.textContent = "결과를 불러오지 못했습니다.";
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        error instanceof Error ? error.message : "조회 중 오류가 발생했습니다.";
      grid.appendChild(empty);
    }
  }

  function openGallery() {
    const classSelect = document.getElementById("galleryClassSelect");
    classSelect.value = state.student?.classId || config.classes[0];
    state.galleryLocationId = "";
    renderGalleryFilters();
    showScreen("gallery");
    loadGallery();
  }

  function validateProfile() {
    const classId = document.getElementById("classSelect").value;
    const studentName = document.getElementById("studentName").value.trim();
    const studentNumber =
      document.getElementById("studentNumber").value.trim();
    const error = document.getElementById("profileError");

    if (!classId) {
      error.textContent = "반을 선택해 주세요.";
      return null;
    }
    if (studentName.length < 2) {
      error.textContent = "이름을 정확히 입력해 주세요.";
      return null;
    }
    if (!/^\d{2,10}$/.test(studentNumber)) {
      error.textContent = "학번은 숫자로 입력해 주세요.";
      return null;
    }

    error.textContent = "";
    return { classId, studentName, studentNumber };
  }

  function bindEvents() {
    document.getElementById("profileForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const student = validateProfile();
      if (!student) {
        return;
      }

      state.student = student;
      saveState();
      showScreen("locations");
    });

    document.getElementById("openNaverButton").addEventListener(
      "click",
      openNaverMap,
    );

    document.getElementById("goUploadButton").addEventListener("click", () => {
      renderUploadScreen();
      showScreen("upload");
    });

    document.getElementById("imageInput").addEventListener("change", (event) => {
      addSelectedFiles(event.target.files || []);
      event.target.value = "";
    });

    document.getElementById("pasteImageButton").addEventListener(
      "click",
      pasteImagesFromClipboard,
    );

    document.getElementById("addMoreButton").addEventListener("click", () => {
      document.getElementById("imageInput").click();
    });

    document.getElementById("clearImagesButton").addEventListener(
      "click",
      clearSelectedImages,
    );

    document.getElementById("submitButton").addEventListener(
      "click",
      submitImages,
    );

    document.getElementById("submitMoreButton").addEventListener("click", () => {
      renderUploadScreen();
      showScreen("upload");
    });

    document.getElementById("viewGalleryButton").addEventListener(
      "click",
      openGallery,
    );

    document.getElementById("galleryClassSelect").addEventListener(
      "change",
      loadGallery,
    );

    document.querySelectorAll("[data-action='back-profile']").forEach((button) => {
      button.addEventListener("click", () => showScreen("profile"));
    });

    document.querySelectorAll("[data-action='back-locations']").forEach((button) => {
      button.addEventListener("click", () => showScreen("locations"));
    });

    document.querySelectorAll("[data-action='back-explore']").forEach((button) => {
      button.addEventListener("click", () => showScreen("explore"));
    });

    document.getElementById("homeButton").addEventListener("click", () => {
      showScreen(state.student ? "locations" : "profile");
    });

    document.addEventListener("paste", handlePasteEvent);
  }

  function restoreForm() {
    if (!state.student) {
      return;
    }

    document.getElementById("classSelect").value = state.student.classId;
    document.getElementById("studentName").value = state.student.studentName;
    document.getElementById("studentNumber").value = state.student.studentNumber;
  }

  function init() {
    populateClassOptions();
    renderLocations();
    restoreState();
    restoreForm();
    bindEvents();

    if (state.student) {
      showScreen("locations");
    } else {
      showScreen("profile");
    }
  }

  init();
})();
