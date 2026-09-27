const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
const VALID_CLASSES = new Set(["A", "B", "C", "D", "E"]);
const VALID_LOCATIONS = new Set([
  "ansan",
  "itaewon",
  "seorae",
  "daerim",
  "gwanghui",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (request.method === "OPTIONS") {
        return corsResponse(request, env, new Response(null, { status: 204 }));
      }

      if (url.pathname === "/health") {
        return jsonResponse(request, env, { ok: true });
      }

      if (url.pathname === "/admin/connect-google") {
        return startGoogleOAuth(request, env);
      }

      if (url.pathname === "/oauth/callback") {
        return finishGoogleOAuth(request, env);
      }

      if (url.pathname === "/submissions" && request.method === "POST") {
        return corsResponse(
          request,
          env,
          await createSubmissions(request, env),
        );
      }

      if (url.pathname === "/submissions" && request.method === "GET") {
        return corsResponse(
          request,
          env,
          await listSubmissions(request, env),
        );
      }

      if (url.pathname.startsWith("/images/") && request.method === "GET") {
        return corsResponse(
          request,
          env,
          await proxyImage(request, env),
        );
      }

      return corsResponse(
        request,
        env,
        json({ error: "Not found" }, 404),
      );
    } catch (error) {
      console.error(error);
      return corsResponse(
        request,
        env,
        json({ error: "Internal server error" }, 500),
      );
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function jsonResponse(request, env, data, status = 200) {
  return corsResponse(request, env, json(data, status));
}

function corsResponse(request, env, response) {
  const origin = request.headers.get("Origin");
  const headers = new Headers(response.headers);

  if (origin && origin === env.ALLOWED_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function makeId() {
  return crypto.randomUUID();
}

function encodeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(env) {
  const raw = decodeBase64(env.TOKEN_ENCRYPTION_KEY);
  if (raw.byteLength !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptSecret(value, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(env);
  const encoded = new TextEncoder().encode(value);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );

  return `${encodeBase64(iv)}.${encodeBase64(encrypted)}`;
}

async function decryptSecret(value, env) {
  const [ivValue, encryptedValue] = value.split(".");
  if (!ivValue || !encryptedValue) {
    throw new Error("Invalid encrypted token.");
  }

  const key = await encryptionKey(env);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(ivValue) },
    key,
    decodeBase64(encryptedValue),
  );

  return new TextDecoder().decode(decrypted);
}

async function setSetting(env, key, value) {
  await env.DB.prepare(
    `INSERT INTO settings(key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key)
     DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  )
    .bind(key, value, new Date().toISOString())
    .run();
}

async function getSetting(env, key) {
  const row = await env.DB.prepare(
    "SELECT value FROM settings WHERE key = ?",
  )
    .bind(key)
    .first();

  return row?.value || null;
}

function oauthRedirectUri(request) {
  return `${new URL(request.url).origin}/oauth/callback`;
}

async function startGoogleOAuth(request, env) {
  const url = new URL(request.url);
  if (url.searchParams.get("setup_key") !== env.ADMIN_SETUP_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  const state = makeId();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", oauthRedirectUri(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", DRIVE_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      "Set-Cookie":
        `mc_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return null;
}

async function finishGoogleOAuth(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const expectedState = cookieValue(request, "mc_oauth_state");
  const code = url.searchParams.get("code");

  if (!state || !expectedState || state !== expectedState || !code) {
    return new Response("Invalid OAuth callback.", { status: 400 });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: oauthRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${body}`);
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.refresh_token) {
    return new Response(
      "Google refresh token was not returned. Reconnect with consent.",
      { status: 400 },
    );
  }

  const encryptedRefreshToken = await encryptSecret(
    tokenData.refresh_token,
    env,
  );
  await setSetting(env, "google_refresh_token", encryptedRefreshToken);

  const rootFolderId = await createDriveFolder(
    tokenData.access_token,
    "multi_culture",
    null,
  );
  await setSetting(env, "root_folder_id", rootFolderId);

  return new Response(
    "Google Drive 연결이 완료되었습니다. 이 창을 닫고 학습지 설정을 계속하세요.",
    {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "Set-Cookie":
          "mc_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      },
    },
  );
}

async function accessToken(env) {
  const encrypted = await getSetting(env, "google_refresh_token");
  if (!encrypted) {
    throw new Error("Google Drive is not connected.");
  }

  const refreshToken = await decryptSecret(encrypted, env);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token.");
  }

  const data = await response.json();
  return data.access_token;
}

async function createDriveFolder(token, name, parentId) {
  const metadata = {
    name,
    mimeType: DRIVE_FOLDER_MIME,
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Drive folder creation failed: ${body}`);
  }

  const data = await response.json();
  return data.id;
}

function escapeDriveQuery(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findOrCreateFolder(token, name, parentId) {
  const query = [
    `name = '${escapeDriveQuery(name)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME}'`,
    "trashed = false",
    `'${escapeDriveQuery(parentId)}' in parents`,
  ].join(" and ");

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "files(id,name)");
  url.searchParams.set("pageSize", "10");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Drive folder lookup failed.");
  }

  const data = await response.json();
  if (data.files?.length) {
    return data.files[0].id;
  }

  return createDriveFolder(token, name, parentId);
}

function extensionForType(type) {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[type] || "img";
}

async function uploadDriveFile(token, parentId, file) {
  const metadata = {
    name: `${makeId()}.${extensionForType(file.type)}`,
    parents: [parentId],
  };

  const initResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type,
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!initResponse.ok) {
    const body = await initResponse.text();
    throw new Error(`Drive upload initialization failed: ${body}`);
  }

  const uploadUrl = initResponse.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Drive upload location was not returned.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type,
      "content-length": String(file.size),
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text();
    throw new Error(`Drive upload failed: ${body}`);
  }

  const data = await uploadResponse.json();
  return data.id;
}

function validStudentPayload(form) {
  const classId = String(form.get("classId") || "");
  const locationId = String(form.get("locationId") || "");
  const studentName = String(form.get("studentName") || "").trim();
  const studentNumber = String(form.get("studentNumber") || "").trim();

  return (
    VALID_CLASSES.has(classId) &&
    VALID_LOCATIONS.has(locationId) &&
    studentName.length >= 2 &&
    studentName.length <= 20 &&
    /^\d{2,10}$/.test(studentNumber)
  );
}

async function createSubmissions(request, env) {
  const form = await request.formData();
  if (!validStudentPayload(form)) {
    return json({ error: "Invalid submission fields." }, 400);
  }

  const images = form
    .getAll("images")
    .filter((value) => value instanceof File && value.type.startsWith("image/"));

  if (!images.length) {
    return json({ error: "At least one image is required." }, 400);
  }

  const maxBytes = 10 * 1024 * 1024;
  if (images.some((file) => file.size > maxBytes)) {
    return json({ error: "Each image must be 10MB or smaller." }, 400);
  }

  const token = await accessToken(env);
  const rootFolderId = await getSetting(env, "root_folder_id");
  if (!rootFolderId) {
    return json({ error: "Google Drive root folder is not configured." }, 503);
  }

  const classId = String(form.get("classId"));
  const locationId = String(form.get("locationId"));
  const classFolderId = await findOrCreateFolder(
    token,
    `${classId}반`,
    rootFolderId,
  );
  const locationFolderId = await findOrCreateFolder(
    token,
    locationId,
    classFolderId,
  );

  const batchId = makeId();
  const submittedAt = new Date().toISOString();
  const saved = [];

  for (const image of images) {
    const fileId = await uploadDriveFile(token, locationFolderId, image);
    const id = makeId();

    await env.DB.prepare(
      `INSERT INTO submissions(
        id, batch_id, grade, class_id, student_name, student_number,
        location_id, location_name, file_id, mime_type, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        batchId,
        String(form.get("grade") || "2"),
        classId,
        String(form.get("studentName")),
        String(form.get("studentNumber")),
        locationId,
        String(form.get("locationName") || locationId),
        fileId,
        image.type,
        submittedAt,
      )
      .run();

    saved.push({ id, fileId });
  }

  return json({
    batchId,
    count: saved.length,
    submittedAt,
  });
}

async function listSubmissions(request, env) {
  const url = new URL(request.url);
  const classId = url.searchParams.get("class_id") || "";
  const locationId = url.searchParams.get("location_id") || "";

  if (!VALID_CLASSES.has(classId)) {
    return json({ error: "Invalid class_id." }, 400);
  }

  let statement;
  if (locationId) {
    if (!VALID_LOCATIONS.has(locationId)) {
      return json({ error: "Invalid location_id." }, 400);
    }

    statement = env.DB.prepare(
      `SELECT id, class_id, student_name, student_number, location_id,
              location_name, file_id, submitted_at
       FROM submissions
       WHERE class_id = ? AND location_id = ?
       ORDER BY submitted_at DESC`,
    ).bind(classId, locationId);
  } else {
    statement = env.DB.prepare(
      `SELECT id, class_id, student_name, student_number, location_id,
              location_name, file_id, submitted_at
       FROM submissions
       WHERE class_id = ?
       ORDER BY submitted_at DESC`,
    ).bind(classId);
  }

  const result = await statement.all();
  const origin = new URL(request.url).origin;

  return json({
    submissions: (result.results || []).map((row) => ({
      id: row.id,
      classId: row.class_id,
      studentName: row.student_name,
      studentNumber: row.student_number,
      locationId: row.location_id,
      locationName: row.location_name,
      submittedAt: row.submitted_at,
      image_url: `${origin}/images/${row.file_id}`,
    })),
  });
}

async function proxyImage(request, env) {
  const fileId = new URL(request.url).pathname.split("/").pop();
  if (!fileId) {
    return new Response("Not found", { status: 404 });
  }

  const row = await env.DB.prepare(
    "SELECT mime_type FROM submissions WHERE file_id = ?",
  )
    .bind(fileId)
    .first();

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const token = await accessToken(env);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    return new Response("Image unavailable", { status: response.status });
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    response.headers.get("content-type") || row.mime_type,
  );
  headers.set("cache-control", "private, max-age=300");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}
