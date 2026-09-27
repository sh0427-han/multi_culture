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
    const db = await openDemoDb();
    const batchId = makeId();
    const submittedAt = new Date().toISOString();

    const submissions = imageFiles.map((imageFile, index) => ({
      ...payload,
      id: makeId(),
      batchId,
      imageIndex: index,
      submittedAt,
      imageBlob: imageFile,
    }));

    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      submissions.forEach((submission) => store.put(submission));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    db.close();
    return {
      batchId,
      count: submissions.length,
      submissions,
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
