import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

await loadDotEnv();

const config = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  password: process.env.BOT_PASSWORD || "0912",
  webhookSecret: process.env.BOT_WEBHOOK_SECRET || "",
  port: Number(process.env.PORT || 8787),
  chatsFile: resolve(process.cwd(), process.env.AUTHORIZED_CHATS_FILE || "authorized-chats.json"),
};

if (!config.token) {
  console.error("TELEGRAM_BOT_TOKEN is required.");
  process.exit(1);
}

const telegramApi = `https://api.telegram.org/bot${config.token}`;
const authorizedChats = new Set();
const pendingPasswordChats = new Set();
let updateOffset = 0;

await loadAuthorizedChats();
startHttpServer();
pollTelegramUpdates();

async function loadAuthorizedChats() {
  if (!existsSync(config.chatsFile)) {
    return;
  }

  try {
    const saved = JSON.parse(await readFile(config.chatsFile, "utf8"));
    for (const chatId of saved.chatIds || []) {
      authorizedChats.add(String(chatId));
    }
  } catch (error) {
    console.warn(`Could not read ${config.chatsFile}:`, error.message);
  }
}

async function saveAuthorizedChats() {
  const payload = {
    chatIds: [...authorizedChats],
    updatedAt: new Date().toISOString(),
  };

  await writeFile(config.chatsFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function startHttpServer() {
  const server = createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, {
          ok: true,
          authorizedChats: authorizedChats.size,
        });
        return;
      }

      if (request.method === "POST" && request.url === "/booking") {
        if (config.webhookSecret) {
          const receivedSecret = request.headers["x-booking-secret"];
          if (receivedSecret !== config.webhookSecret) {
            sendJson(response, 401, { ok: false, error: "Unauthorized" });
            return;
          }
        }

        const booking = await readJsonBody(request);
        await notifyAuthorizedChats(formatBookingMessage(booking));
        sendJson(response, 200, {
          ok: true,
          deliveredTo: authorizedChats.size,
        });
        return;
      }

      sendJson(response, 404, { ok: false, error: "Not found" });
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { ok: false, error: "Internal server error" });
    }
  });

  server.listen(config.port, () => {
    console.log(`Booking bot HTTP server is listening on http://localhost:${config.port}`);
    console.log("POST new bookings to /booking.");
  });
}

async function pollTelegramUpdates() {
  while (true) {
    try {
      const updates = await telegram("getUpdates", {
        offset: updateOffset,
        timeout: 25,
        allowed_updates: ["message"],
      });

      for (const update of updates.result || []) {
        updateOffset = update.update_id + 1;
        await handleTelegramMessage(update.message);
      }
    } catch (error) {
      console.error("Telegram polling failed:", error.message);
      await sleep(3000);
    }
  }
}

async function handleTelegramMessage(message) {
  if (!message?.chat?.id) {
    return;
  }

  const chatId = String(message.chat.id);
  const text = String(message.text || "").trim();

  if (text === "/start" || text === "/login") {
    if (authorizedChats.has(chatId)) {
      await sendMessage(chatId, "Ви вже підключені. Нові бронювання будуть приходити сюди.");
      return;
    }

    pendingPasswordChats.add(chatId);
    await sendMessage(chatId, "Введіть пароль для підключення до сповіщень.");
    return;
  }

  if (text === "/status") {
    const status = authorizedChats.has(chatId) ? "підключений" : "не підключений";
    await sendMessage(chatId, `Статус: ${status}.`);
    return;
  }

  if (text === "/stop") {
    authorizedChats.delete(chatId);
    pendingPasswordChats.delete(chatId);
    await saveAuthorizedChats();
    await sendMessage(chatId, "Сповіщення вимкнені для цього чату.");
    return;
  }

  if (pendingPasswordChats.has(chatId) || !authorizedChats.has(chatId)) {
    if (text === config.password) {
      authorizedChats.add(chatId);
      pendingPasswordChats.delete(chatId);
      await saveAuthorizedChats();
      await sendMessage(chatId, "Готово. Тепер сюди будуть приходити нові бронювання.");
      return;
    }

    pendingPasswordChats.add(chatId);
    await sendMessage(chatId, "Невірний пароль. Спробуйте ще раз.");
    return;
  }

  await sendMessage(chatId, "Бот тільки надсилає сповіщення про нові бронювання. Команди: /status, /stop.");
}

async function notifyAuthorizedChats(message) {
  if (authorizedChats.size === 0) {
    console.warn("New booking received, but there are no authorized chats yet.");
    return;
  }

  await Promise.all(
    [...authorizedChats].map(async (chatId) => {
      try {
        await sendMessage(chatId, message);
      } catch (error) {
        console.error(`Could not notify chat ${chatId}:`, error.message);
      }
    }),
  );
}

function formatBookingMessage(rawBooking) {
  const booking = normalizeBookingPayload(rawBooking);
  const lines = ["Нове бронювання"];

  if (booking.service) lines.push(`Послуга: ${booking.service}`);
  if (booking.name) lines.push(`Ім'я: ${booking.name}`);
  if (booking.phone) lines.push(`Телефон: ${booking.phone}`);
  if (booking.email) lines.push(`Email: ${booking.email}`);
  if (booking.partySize) lines.push(`Кількість гостей: ${booking.partySize}`);
  if (booking.startsAt) lines.push(`Початок: ${formatDateTime(booking.startsAt)}`);
  if (booking.endsAt) lines.push(`Кінець: ${formatDateTime(booking.endsAt)}`);
  if (booking.comment) lines.push(`Коментар: ${booking.comment}`);
  if (booking.status) lines.push(`Статус: ${booking.status}`);

  return lines.join("\n");
}

function normalizeBookingPayload(payload) {
  const record = payload?.record || payload?.booking || payload || {};
  const service =
    record.service_name ||
    record.serviceName ||
    record.service_slug ||
    record.serviceSlug ||
    record.service ||
    "";

  return {
    service,
    name: record.customer_name || record.customerName || record.name || "",
    phone: record.customer_phone || record.customerPhone || record.phone || "",
    email: record.customer_email || record.customerEmail || record.email || "",
    partySize: record.party_size || record.partySize || record.people || "",
    startsAt: record.start_at || record.startAt || record.starts_at || record.startsAt || "",
    endsAt: record.end_at || record.endAt || record.ends_at || record.endsAt || "",
    comment: record.comment || record.message || "",
    status: record.status || "",
  };
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Kyiv",
  }).format(date);
}

async function sendMessage(chatId, text) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

async function telegram(method, payload) {
  const response = await fetch(`${telegramApi}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram ${method} failed with ${response.status}`);
  }

  return data;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const envFile = await readFile(envPath, "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
