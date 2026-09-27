(() => {
  "use strict";

  const config = window.MULTI_CULTURE_CONFIG;
  const dbName = "multiCultureDemoDb";
  const storeName = "submissions";
  let objectUrls = [];

  function openDemoDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("classId", "classId", { unique: false });
          store.createIndex("locationId", "locationId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function makeId() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function demoUpload(payload, imageFiles) {
    const imageFile = imageFiles[0];
    if (!imageFile || imageFiles.length !== 1) {
      throw new Error("지역별로 사진 1장만 제출할 수 있습니다.");
    }

    const db = await openDemoDb();
    const batchId = makeId();
    const submittedAt = new Date().toISOString();
    const submission = {
      ...payload,
      id: makeId(),
      batchId,
      submittedAt,
      imageBlob: imageFile,
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const previous = (request.result || []).find(
          (item) =>
            item.classId === payload.classId &&
            item.studentNumber === payload.studentNumber &&
            item.locationId === payload.locationId,
        );

        if (previous) {
          store.delete(previous.id);
        }
        store.put(submission);
      };

      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    db.close();
    return {
      batchId,
      count: 1,
      submissions: [submission],
    };
  }

  async function demoList({ classId, locationId }) {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];

    const db = await openDemoDb();
    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();

    return items
      .filter((item) => item.classId === classId)
      .filter((item) => !locationId || item.locationId === locationId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((item) => {
        const imageUrl = URL.createObjectURL(item.imageBlob);
        objectUrls.push(imageUrl);
        return { ...item, imageUrl };
      });
  }

  async function apiUpload(payload, imageFiles) {
    if (!config.backendUrl) {
      throw new Error("backendUrl이 설정되지 않았습니다.");
    }

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    imageFiles.forEach((imageFile) => {
      formData.append("images", imageFile, imageFile.name);
    });

    const response = await fetch(
      `${config.backendUrl.replace(/\/$/, "")}/submissions`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`업로드 실패: HTTP ${response.status}`);
    }

    return response.json();
  }

  async function apiList({ classId, locationId }) {
    if (!config.backendUrl) {
      throw new Error("backendUrl이 설정되지 않았습니다.");
    }

    const params = new URLSearchParams({ class_id: classId });
    if (locationId) {
      params.set("location_id", locationId);
    }

    const response = await fetch(
      `${config.backendUrl.replace(/\/$/, "")}/submissions?${params}`,
    );

    if (!response.ok) {
      throw new Error(`조회 실패: HTTP ${response.status}`);
    }

    const body = await response.json();
    return body.submissions || [];
  }

  window.SubmissionApi = {
    upload(payload, imageFiles) {
      return config.storageMode === "api"
        ? apiUpload(payload, imageFiles)
        : demoUpload(payload, imageFiles);
    },

    list(filters) {
      return config.storageMode === "api"
        ? apiList(filters)
        : demoList(filters);
    },
  };
})();
