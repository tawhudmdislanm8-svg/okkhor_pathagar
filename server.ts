import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const DB_FILE = path.join(process.cwd(), "db.json");

// Password Hasher Helper
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Default credentials
const DEFAULT_USERNAME = "okkhor";
const DEFAULT_PASSWORD_HASH = hashPassword("pathagar");
const SECURITY_PASSWORD = "PASSWD";

// Helper to format date with seconds: YYYY-MM-DD HH:mm:ss
function formatCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Database Scheme Types
interface Book {
  id: string; // Unique UI identification
  code: string; // Unique Book Code
  name: string;
  author: string;
  publisher: string;
  imageUrl: string;
  status: "Available" | "Issued";
}

interface Member {
  formNumber: string; // Unique key, sorted by form number
  name: string;
  mobile: string;
  address: string;
}

interface IssueRecord {
  id: string;
  bookCode: string;
  bookName: string;
  author: string;
  publisher: string;
  memberName: string;
  formNumber: string;
  mobile: string;
  address: string;
  issueDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  status: "Issued" | "Returned";
  extensionHistory: Array<{
    date: string;
    action: "Extended" | "Reduced";
    payload: string; // days changed
  }>;
  comments: string[];
  returnedAt?: string;
}

interface WishlistItem {
  id: string;
  name: string;
  author: string;
  publisher: string;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string; // Format: YYYY-MM-DD HH:mm:ss
  action: string;
  details: string;
}

interface DatabaseSchema {
  admin: {
    username: string;
    passwordHash: string;
  };
  books: Book[];
  members: Member[];
  issues: IssueRecord[];
  wishlist: WishlistItem[];
  notes: Note[];
  auditLogs: AuditLog[];
  smsTemplate?: string;
  smsGateway?: {
    provider: string;
    apiKey: string;
    senderId: string;
    customUrl: string;
  };
  googleSheetsConfig?: {
    webAppUrl: string;
    isAutoSyncEnabled: boolean;
  };
}

// Initialize active database store
function getInitialDb(): DatabaseSchema {
  return {
    admin: {
      username: DEFAULT_USERNAME,
      passwordHash: DEFAULT_PASSWORD_HASH,
    },
    books: [
      {
        id: "b-1",
        code: "BOK-101",
        name: "পথের পাঁচালী",
        author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
        publisher: "signet press",
        imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400",
        status: "Available",
      },
      {
        id: "b-2",
        code: "BOK-102",
        name: "লালসালু",
        author: "সৈয়দ ওয়ালীউল্লাহ",
        publisher: "রেনেসাঁ পাবলিশার্স",
        imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
        status: "Available",
      },
      {
        id: "b-3",
        code: "BOK-103",
        name: "হিমুর হাতে কয়েকটি নীল পদ্ম",
        author: "হুমায়ূন আহমেদ",
        publisher: "অন্যপ্রকাশ",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
        status: "Issued",
      },
      {
        id: "b-4",
        code: "BOK-104",
        name: "গীতাঞ্জলি",
        author: "রবীন্দ্রনাথ ঠাকুর",
        publisher: "ইন্ডিয়ান পাবলিশিং হাউস",
        imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
        status: "Available",
      },
      {
        id: "b-5",
        code: "BOK-105",
        name: "শঙ্খনীল কারাগার",
        author: "হুমায়ূন আহমেদ",
        publisher: "অন্যপ্রকাশ",
        imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
        status: "Available",
      },
    ],
    members: [
      {
        formNumber: "1001",
        name: "আরিফ রহমান",
        mobile: "01712345678",
        address: "মিরপুর-১১, ঢাকা",
      },
      {
        formNumber: "1002",
        name: "ফাতেমা ইয়াসমিন",
        mobile: "01987654321",
        address: "ধানমন্ডি-৩২, ঢাকা",
      },
      {
        formNumber: "1003",
        name: "মামুনুল ইসলাম",
        mobile: "01555443322",
        address: "উত্তরা-সেক্টর ৫, ঢাকা",
      },
    ],
    issues: [
      {
        id: "i-1",
        bookCode: "BOK-103",
        bookName: "হিমুর হাতে কয়েকটি নীল পদ্ম",
        author: "হুমায়ূন আহমেদ",
        publisher: "অন্যপ্রকাশ",
        memberName: "আরিফ রহমান",
        formNumber: "1001",
        mobile: "01712345678",
        address: "মিরপুর-১১, ঢাকা",
        issueDate: "2026-06-10",
        returnDate: "2026-06-17",
        status: "Issued",
        extensionHistory: [],
        comments: ["প্রচ্ছদ একটু ছেঁড়া রয়েছে"],
      },
      {
        id: "i-2",
        bookCode: "BOK-101",
        bookName: "পথের পাঁচালী",
        author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
        publisher: "signet press",
        memberName: "ফাতেমা ইয়াসমিন",
        formNumber: "1002",
        mobile: "01987654321",
        address: "ধানমন্ডি-৩২, ঢাকা",
        issueDate: "2026-06-01",
        returnDate: "2026-06-08",
        status: "Returned",
        extensionHistory: [{ date: "2026-06-08", action: "Extended", payload: "3" }],
        comments: ["সময় মতো ফেরত এসেছে"],
        returnedAt: "2026-06-11",
      },
    ],
    wishlist: [
      {
        id: "w-1",
        name: "কড়ি ও কোমল",
        author: "রবীন্দ্রনাথ ঠাকুর",
        publisher: "বিশ্বভারতী",
        createdAt: "2026-06-12 11:30:00",
      },
    ],
    notes: [
      {
        id: "n-1",
        title: "পাঠক সমাবেশের তালিকা",
        content: "১. আগামী সপ্তাহে নতুন কিছু রবীন্দ্রনাথের উপন্যাস কিনতে হবে।\n২. ১৯ শে জুন একটি বিশেষ গুণীজন পর্যালোচনা সভা অনুষ্ঠিত হবে।",
        createdAt: "2026-06-12 11:15:00",
        updatedAt: "2026-06-12 11:15:00",
      }
    ],
    auditLogs: [
      {
        id: "log-1",
        timestamp: "2026-06-10 10:15:00",
        action: "বই যোগ",
        details: "বই কোড BOK-103 যোগ করা হয়েছে (হিমুর হাতে কয়েকটি নীল পদ্ম)",
      },
      {
        id: "log-2",
        timestamp: "2026-06-10 10:20:00",
        action: "বই ইস্যু",
        details: "আরিফ রহমান (M: 1001) কে BOK-103 বই ইস্যু করা হয়েছে। রিটার্ন ডেট: ১৭ জুন ২০২৬",
      },
      {
        id: "log-3",
        timestamp: "2026-06-12 11:30:00",
        action: "বই যোগ",
        details: "উইশলিস্টে 'কড়ি ও কোমল' যোগ করা হয়েছে",
      },
    ],
  };
}

// Read database
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading database file", err);
  }
  const initial = getInitialDb();
  writeDb(initial);
  return initial;
}

// Write database
function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Google Sheets Auto-Import Helper for logging in and initial verification auto-loading
async function importGoogleSheetsData(timeoutMs: number = 25000): Promise<any> {
  try {
    const db = readDb();
    const config = db.googleSheetsConfig;
    if (!config || !config.webAppUrl) {
      console.log("[Google Sheets Auto-Import] Skipped: Web App URL not configured.");
      return null;
    }

    console.log(`[Google Sheets Auto-Import] Syncing from ${config.webAppUrl}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await globalThis.fetch(config.webAppUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Akkhor-Pathagar-Library-System-AutoImport"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`[Google Sheets Auto-Import] Fetch failed with status ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`[Google Sheets Auto-Import] Apps Script returned error:`, data.error);
      return null;
    }

    let importedBooks = 0;
    let importedMembers = 0;
    let importedWishlist = 0;

    // Refresh db state AFTER the await to ensure we merge on the latest state
    const currentDb = readDb();

    // Import books safely
    if (Array.isArray(data.books)) {
      data.books.forEach((b: any) => {
        if (!b.code || !b.name) return;
        const exists = currentDb.books.some(existing => existing.code === b.code);
        if (!exists) {
          currentDb.books.unshift({
            id: b.id || `book-${Math.random().toString(36).substr(2, 9)}`,
            code: b.code,
            name: b.name,
            author: b.author || "অজ্ঞাত",
            publisher: b.publisher || "অজ্ঞাত প্রকাশনী",
            imageUrl: b.imageUrl?.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
            status: b.status || "Available"
          });
          importedBooks++;
        }
      });
    }

    // Import members safely
    if (Array.isArray(data.members)) {
      data.members.forEach((m: any) => {
        if (!m.formNumber || !m.name) return;
        const exists = currentDb.members.some(existing => existing.formNumber === m.formNumber);
        if (!exists) {
          currentDb.members.push({
            formNumber: m.formNumber,
            name: m.name,
            mobile: m.mobile || "",
            address: m.address || ""
          });
          importedMembers++;
        }
      });
    }

    // Import wishlist safely
    if (Array.isArray(data.wishlist)) {
      data.wishlist.forEach((w: any) => {
        if (!w.name) return;
        const exists = currentDb.wishlist.some(existing => existing.name === w.name);
        if (!exists) {
          currentDb.wishlist.unshift({
            id: w.id || `wish-${Math.random().toString(36).substr(2, 9)}`,
            name: w.name,
            author: w.author || "",
            publisher: w.publisher || "",
            createdAt: new Date().toISOString().split("T")[0]
          });
          importedWishlist++;
        }
      });
    }

    writeDb(currentDb);
    addLog("গুগল শিট স্বয়ংক্রিয় ডাউনলোড (লগইন)", `লগইন সফল হওয়ায় গুগল শিট থেকে ডাটা অটো-ইম্পোর্ট করা হয়েছে। নতুন বই: ${importedBooks}টি, নতুন সদস্য: ${importedMembers}টি, নতুন উইশলিস্ট: ${importedWishlist}টি।`);
    console.log(`[Google Sheets Auto-Import] Successfully imported. Books: ${importedBooks}, Members: ${importedMembers}, Wishlist: ${importedWishlist}`);
    return { importedBooks, importedMembers, importedWishlist };
  } catch (err: any) {
    console.error("[Google Sheets Auto-Import] Background import failed:", err);
    addLog("গুগল শিট স্বয়ংক্রিয় ডাউনলোড এরর (লগইন)", `লগইন করার পর অটো-ইম্পোর্ট করার সময় কানেকশন ও কোয়েরি এরর ঘটেছে: ${err.message || err}`);
    return null;
  }
}

// Google Sheets Sync Helper (Sends URL-encoded requests to support Google Apps Script with POST and retry-GET Fallback)
async function postToGoogleSheets(type: string, action: string, data: any) {
  try {
    const db = readDb();
    const config = db.googleSheetsConfig;
    if (!config || !config.webAppUrl) {
      console.log(`[Google Sheets Sync skipped] Auto-sync skipped: Web App URL is missing.`);
      return;
    }

    const params = new URLSearchParams();
    params.append("type", type);
    params.append("type_en", type);
    params.append("type_bn", type);
    params.append("action", action);
    params.append("action_en", action);
    params.append("action_bn", action);

    // Mapped fields supporting English & Bengali spreadsheet headers across books, members, wishlist & transactions
    params.append("id", data.id || data.formNumber || "");
    params.append("code", data.code || data.bookCode || "");
    params.append("bookCode", data.bookCode || data.code || "");
    params.append("বইকোড", data.bookCode || data.code || "");
    params.append("বারকোড", data.bookCode || data.code || "");

    params.append("name", data.name || data.bookName || data.memberName || "");
    params.append("bookName", data.bookName || data.name || "");
    params.append("memberName", data.memberName || data.name || "");
    params.append("নাম", data.name || data.bookName || data.memberName || "");
    params.append("বইয়েরনাম", data.bookName || data.name || "");
    params.append("সদস্যেরনাম", data.memberName || data.name || "");

    params.append("author", data.author || "");
    params.append("bookAuthor", data.author || "");
    params.append("লেখক", data.author || "");

    params.append("publisher", data.publisher || "");
    params.append("প্রকাশনী", data.publisher || "");

    params.append("status", data.status || "");
    params.append("অবস্থা", data.status || "");

    params.append("formNumber", data.formNumber || "");
    params.append("ফরমনম্বর", data.formNumber || "");
    params.append("ফরম_নম্বর", data.formNumber || "");

    params.append("mobile", data.mobile || "");
    params.append("মোবাইল", data.mobile || "");
    params.append("মোবাইল_নম্বর", data.mobile || "");

    params.append("address", data.address || "");
    params.append("ঠিকানা", data.address || "");

    const dateVal = data.issueDate || data.returnDate || data.createdAt || "";
    params.append("date", dateVal);

    const queryString = params.toString();
    const targetUrl = config.webAppUrl;

    console.log(`[Google Sheets] Syncing ${type} ('${data.name || data.formNumber || data.code}') to Google Sheet URL...`);
    
    // We send parameters in both URL query-string AND POST body to ensure maximum compatibility 
    // with different Google Apps Script configurations
    const finalUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + queryString;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds timeout for faster fallback

    let success = false;
    let resText = "";
    let usedMethod = "POST";

    try {
      console.log(`[Google Sheets] Trying POST payload for ${type}...`);
      const res = await globalThis.fetch(finalUrl, {
        method: "POST",
        body: queryString,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Akkhor-Pathagar-Library-System-POST"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      resText = await res.text();
      console.log(`[Google Sheets] POST response HTTP ${res.status}:`, resText);

      // Apps Scripts sometimes return HTML error or redirect warnings when posts aren't configured with CORS
      if (res.ok && !resText.includes("<!DOCTYPE html>") && !resText.toLowerCase().includes("error")) {
        success = true;
      }
    } catch (postErr: any) {
      console.warn(`[Google Sheets Async] POST sync failed, trying GET fallback. Error:`, postErr.message || postErr);
    }

    // FALLBACK TO GET!
    if (!success) {
      console.log(`[Google Sheets] POST failed or returned HTML error. Retrying with GET fallback...`);
      usedMethod = "GET";
      try {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 45000);
        
        const resGet = await globalThis.fetch(finalUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Akkhor-Pathagar-Library-System-GET"
          },
          signal: getController.signal
        });
        
        clearTimeout(getTimeoutId);
        resText = await resGet.text();
        console.log(`[Google Sheets GET Fallback] Response HTTP ${resGet.status}:`, resText);
        
        if (resGet.ok && !resText.includes("<!DOCTYPE html>") && !resText.toLowerCase().includes("error")) {
          success = true;
        }
      } catch (getErr: any) {
        console.warn(`[Google Sheets Sync] GET Fallback also failed:`, getErr.message || getErr);
      }
    }

    if (success) {
      addLog("গুগল শিট স্বয়ংক্রিয় সিঙ্ক", `সফলভাবে '${data.name || data.code || type}' গুগল শিটে সংরক্ষণ করা হয়েছে (পদ্ধতি: ${usedMethod})।`);
    } else {
      console.error(`[Google Sheets Sync Failed] Auto-sync did not save. Response text preview: ${resText.substring(0, 150)}`);
      addLog("গুগল শিট স্বয়ংক্রিয় সিঙ্ক ব্যর্থ", `'${data.name || data.code || type}' সিঙ্ক করার সময় গুগল শিট থেকে প্রত্যাখ্যাত বা কানেকশন ত্রুটি হয়েছে (পদ্ধতি: ${usedMethod})।`);
    }
  } catch (err: any) {
    const errorMsg = err.message || err;
    console.warn(`[Google Sheets] Failed to post to spreadsheet: ${errorMsg}`);
    addLog("গুগল শিট স্বয়ংক্রিয় সিঙ্ক ব্যর্থ", `গুগল শিটের সাথে সংযোগ করা সম্ভব হয়নি। এরর: ${errorMsg}`);
  }
}

// Forced Google Sheets Sync helper ignoring isAutoSyncEnabled flag (used for bulk sync & test connection)
async function forcePostToGoogleSheets(webAppUrl: string, type: string, action: string, data: any) {
  try {
    const params = new URLSearchParams();
    params.append("type", type);
    params.append("type_en", type);
    params.append("type_bn", type);
    params.append("action", action);
    params.append("action_en", action);
    params.append("action_bn", action);

    // Mapped fields supporting English & Bengali spreadsheet headers across books, members, wishlist & transactions
    params.append("id", data.id || data.formNumber || "");
    params.append("code", data.code || data.bookCode || "");
    params.append("bookCode", data.bookCode || data.code || "");
    params.append("বইকোড", data.bookCode || data.code || "");
    params.append("বারকোড", data.bookCode || data.code || "");

    params.append("name", data.name || data.bookName || data.memberName || "");
    params.append("bookName", data.bookName || data.name || "");
    params.append("memberName", data.memberName || data.name || "");
    params.append("নাম", data.name || data.bookName || data.memberName || "");
    params.append("বইয়েরনাম", data.bookName || data.name || "");
    params.append("সদস্যেরনাম", data.memberName || data.name || "");

    params.append("author", data.author || "");
    params.append("bookAuthor", data.author || "");
    params.append("লেখক", data.author || "");

    params.append("publisher", data.publisher || "");
    params.append("প্রকাশনী", data.publisher || "");

    params.append("status", data.status || "");
    params.append("অবস্থা", data.status || "");

    params.append("formNumber", data.formNumber || "");
    params.append("ফরমনম্বর", data.formNumber || "");
    params.append("ফরম_নম্বর", data.formNumber || "");

    params.append("mobile", data.mobile || "");
    params.append("মোবাইল", data.mobile || "");
    params.append("মোবাইল_নম্বর", data.mobile || "");

    params.append("address", data.address || "");
    params.append("ঠিকানা", data.address || "");
    params.append("date", data.issueDate || data.returnDate || "");

    const queryString = params.toString();
    let targetUrl = webAppUrl;
    if (queryString) {
      targetUrl += (targetUrl.includes("?") ? "&" : "?") + queryString;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const res = await globalThis.fetch(targetUrl, {
      method: "POST",
      body: queryString,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Akkhor-Pathagar-Library-System-ForceSync"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    await res.text();
  } catch (err: any) {
    console.warn(`[Google Sheets Force] Sync failed for '${data.name || data.formNumber}': ${err.message || err}`);
  }
}

// Write Audit Log Helper
function addLog(action: string, details: string) {
  const db = readDb();
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: formatCurrentDateTime(),
    action,
    details,
  };
  db.auditLogs.unshift(log);
  writeDb(db);
}

// Simple token storage in memory for authentication checks
const ACTIVE_SESSIONS = new Set<string>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // CORS-like permissions (since it's a single container we keep it internal)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  // Auth Middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "অননুমোদিত! অনুগ্রহ করে লগইন করুন।" });
    }
    const token = authHeader.substring(7);
    if (!ACTIVE_SESSIONS.has(token)) {
      return res.status(401).json({ error: "সেশন মেয়াদ শেষ! আবার লগইন করুন।" });
    }
    next();
  };

  // ---------------- AUTH API ROUTES ----------------

  // Login Endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "ইউজারনেম ও পাসওয়ার্ড আবশ্যক!" });
    }

    const db = readDb();
    const inputHash = hashPassword(password);

    if (db.admin.username === username && db.admin.passwordHash === inputHash) {
      const token = `AP-${crypto.randomBytes(16).toString("hex")}`;
      ACTIVE_SESSIONS.add(token);

      console.log("[Google Sheets] Successful admin login! Triggering background auto-sync...");
      // Trigger background auto-sync with a healthy 60-second limit and do not block the login response
      importGoogleSheetsData(60000).catch(err => {
        console.error("[Google Sheets Auto-Import Login Background Error]:", err);
      });

      return res.json({ token, username: db.admin.username });
    } else {
      return res.status(401).json({ error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড!" });
    }
  });

  // Check Auth State Endpoint (Used on pages mounts/refreshes)
  app.get("/api/auth/verify", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ authenticated: false });
    }
    const token = authHeader.substring(7);
    if (ACTIVE_SESSIONS.has(token)) {
      const db = readDb();

      // Trigger automatic background sheet import (highly responsive, no races or aborts)
      importGoogleSheetsData(60000).catch(err => {
        console.error("[Google Sheets Auto-Import Verify Background Error]:", err);
      });

      return res.json({ authenticated: true, username: db.admin.username });
    }
    return res.json({ authenticated: false });
  });

  // Logout Endpoint
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      ACTIVE_SESSIONS.delete(token);
    }
    res.json({ message: "সফলভাবে লগআউট হয়েছে।" });
  });

  // Change Admin Credentials
  app.post("/api/auth/change-credentials", authenticateAdmin, (req, res) => {
    const { currentUsername, currentPassword, securityPassword, newUsername, newPassword } = req.body;

    if (!currentUsername || !currentPassword || !securityPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: "সব তথ্য পূরণ করা বাধ্যতামূলক!" });
    }

    if (securityPassword !== SECURITY_PASSWORD) {
      return res.status(400).json({ error: "ভুল সিকিউরিটি পাসওয়ার্ড!" });
    }

    const db = readDb();
    const currentHash = hashPassword(currentPassword);

    if (db.admin.username !== currentUsername || db.admin.passwordHash !== currentHash) {
      return res.status(400).json({ error: "বর্তমান ইউজারনেম বা পাসওয়ার্ড সঠিক নয়!" });
    }

    // Apply changes
    db.admin.username = newUsername;
    db.admin.passwordHash = hashPassword(newPassword);
    writeDb(db);

    addLog("অ্যাডমিন পরিবর্তন", `ইউজারনেম বা পাসওয়ার্ড পরিবর্তন করা হয়েছে। নতুন ইউজারনেম: ${newUsername}`);

    res.json({ success: true, message: "অ্যাডমিন ক্রেডেনশিয়াল সফলভাবে পরিবর্তিত হয়েছে।" });
  });

  // GET SMS template
  app.get("/api/sms/template", authenticateAdmin, (req, res) => {
    try {
      const db = readDb();
      const defaultTemplate = "আসসালামু আলাইকুম, আপনার ({bookName}) বইটি জমাদেয়ার সময় অতিক্রম হয়েছে। অনুগ্রহ করে বইটি অক্ষর পাঠাগার এ জমা দিয়ে আসুন। আমাদের পাঠাগার প্রতিদিন বিকাল ৪ টা থেকে রাত ৮ টা পর্যন্ত খোলা থাকে। বা আপনার বই যদি পড়া শেষ না হয়ে থাকে তাহলে অনুগ্রহ করে এই নাম্বারে call /WhatsApp এ যোগাযোগ করেন: 01333474848";
      const currentTemplate = db.smsTemplate || defaultTemplate;
      console.log("GET /api/sms/template: sending template");
      res.json({ template: currentTemplate });
    } catch (err: any) {
      console.error("GET /api/sms/template failed:", err);
      res.status(500).json({ error: "সার্ভার এরর। টেমপ্লেট লোড করা যায়নি।" });
    }
  });

  // POST SMS template
  app.post("/api/sms/template", authenticateAdmin, (req, res) => {
    try {
      console.log("POST /api/sms/template: body received", req.body);
      const template = req.body.template !== undefined ? req.body.template : req.body.smsTemplate;
      
      if (template === undefined || typeof template !== "string") {
        console.error("POST /api/sms/template: validation failed. Received template:", template);
        return res.status(400).json({ error: "সঠিক মেসেজ টেমপ্লেট টেক্সট প্রদান করুন।" });
      }
      
      const db = readDb();
      db.smsTemplate = template;
      writeDb(db);
      
      addLog("টেমপ্লেট আপডেট", "SMS রিমাইন্ডার পাঠানোর টেক্সট টেমপ্লেট পরিবর্তন করা হয়েছে।");
      console.log("POST /api/sms/template: successfully written to db.json");
      res.json({ success: true, message: "মেসেজ টেমপ্লেট সফলভাবে আপডেট করা হয়েছে।" });
    } catch (err: any) {
      console.error("POST /api/sms/template failed:", err);
      res.status(500).json({ error: "সার্ভারে সেভ করার সময় কোনো সমস্যা হয়েছে।" });
    }
  });

  // GET SMS Gateway Settings
  app.get("/api/sms/gateway", authenticateAdmin, (req, res) => {
    try {
      const db = readDb();
      const defaultGateway = {
        provider: "simulated",
        apiKey: "",
        senderId: "",
        customUrl: "https://api.example.com/sms/send?apiKey={apiKey}&to={to}&message={message}"
      };
      res.json(db.smsGateway || defaultGateway);
    } catch (err: any) {
      console.error("GET /api/sms/gateway failed:", err);
      res.status(500).json({ error: "সার্ভার এরর। গেটওয়ে সেটিংস লোড করা যায়নি।" });
    }
  });

  // POST SMS Gateway Settings
  app.post("/api/sms/gateway", authenticateAdmin, (req, res) => {
    try {
      const { provider, apiKey, senderId, customUrl } = req.body;
      if (!provider) {
        return res.status(400).json({ error: "প্রোভাইডার সিলেক্ট করা আবশ্যক।" });
      }

      const db = readDb();
      db.smsGateway = {
        provider: provider || "simulated",
        apiKey: apiKey || "",
        senderId: senderId || "",
        customUrl: customUrl || ""
      };
      writeDb(db);

      addLog("গেটওয়ে সেটিংস আপডেট", `SMS গেটওয়ে প্রোভাইডার হিসেবে '${provider}' সেট করা হয়েছে।`);
      res.json({ success: true, message: "SMS গেটওয়ে সেটিংস সফলভাবে আপডেট করা হয়েছে।" });
    } catch (err: any) {
      console.error("POST /api/sms/gateway failed:", err);
      res.status(500).json({ error: "সার্ভারে গেটওয়ে সেভ করার সময় সমস্যা হয়েছে।" });
    }
  });

  // GET Google Sheets Settings
  app.get("/api/settings/googlesheets", authenticateAdmin, (req, res) => {
    try {
      const db = readDb();
      const config = db.googleSheetsConfig || {
        webAppUrl: "",
        isAutoSyncEnabled: false
      };
      res.json(config);
    } catch (err: any) {
      console.error("GET /api/settings/googlesheets failed:", err);
      res.status(500).json({ error: "গুগল শিট কনফিগারেশন লোড করা যায়নি।" });
    }
  });

  // POST Google Sheets Settings
  app.post("/api/settings/googlesheets", authenticateAdmin, (req, res) => {
    try {
      const { webAppUrl, isAutoSyncEnabled } = req.body;
      const db = readDb();
      db.googleSheetsConfig = {
        webAppUrl: webAppUrl || "",
        isAutoSyncEnabled: !!isAutoSyncEnabled
      };
      writeDb(db);

      addLog("গুগল শিট সেটিংস আপডেট", `গুগল শিট Web App URL এবং অটো-সিঙ্ক সেটিংস আপডেট করা হয়েছে।`);
      res.json({ success: true, message: "গুগল শিট কানেকশন সেটিংস সফলভাবে সেভ করা হয়েছে।" });
    } catch (err: any) {
      console.error("POST /api/settings/googlesheets failed:", err);
      res.status(500).json({ error: "সার্ভারে গুগল শিট সেটিংস সেভ করতে সমস্যা হয়েছে।" });
    }
  });

  // POST Google Sheets Test Connection
  app.post("/api/settings/googlesheets/test", authenticateAdmin, async (req, res) => {
    try {
      const { webAppUrl } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ error: "পরীক্ষা করার জন্য একটি সঠিক Web App URL দিন।" });
      }

      console.log(`[Google Sheets Test] Testing connection to ${webAppUrl}...`);
      const params = new URLSearchParams();
      params.append("type", "টেস্ট কনেকশন");
      params.append("type_en", "Test Connection");
      params.append("action", "পরীক্ষা");
      params.append("action_en", "Test");
      params.append("name", "অক্ষর পাঠাগার সংযোগ পরীক্ষা");
      params.append("code", "TEST-COL-101");
      params.append("id", "TEST-ID-999");
      params.append("mobile", "01333474848");
      params.append("address", "অক্ষর পাঠাগার (টেস্ট রেকর্ড)");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await globalThis.fetch(webAppUrl, {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Akkhor-Pathagar-Test"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const text = await response.text();
      addLog("গুগল শিট টেস্ট", "গুগল শিট এর সাথে সংযোগ পরীক্ষা সাকসেসফুলি সম্পন্ন করা হয়েছে।");
      res.json({ success: true, message: "পপ্রস্তাবিত গুগল শিট Web App-এ টেস্ট রেকর্ড পাঠানো হয়েছে!", details: text });
    } catch (err: any) {
      console.error("[Google Sheets Test] connection failed:", err);
      res.status(500).json({ error: `সংযোগ স্থাপন বা টেস্ট রেকর্ড পাঠানো সম্ভব হয়নি। অনুগ্রহ করে নিশ্চিত হন আপনার Apps Script পাবলিশ (Deploy as Web App) করা হয়েছে এবং অ্যাক্সেস 'Anyone' দেয়া আছে। এরর: ${err.message || err}` });
    }
  });

  // POST Google Sheets Manual Full Synchronization
  app.post("/api/settings/googlesheets/sync-all", authenticateAdmin, async (req, res) => {
    try {
      const db = readDb();
      const config = db.googleSheetsConfig;
      if (!config || !config.webAppUrl) {
        return res.status(400).json({ error: "কোনো গুগল শিট Web App URL সেট করা নেই। দয়া করে সেটিংস প্রথমে সেট করে সেভ করুন।" });
      }

      const webAppUrl = config.webAppUrl;
      const booksList = db.books || [];
      const membersList = db.members || [];
      const wishlistList = db.wishlist || [];

      const totalItems = booksList.length + membersList.length + wishlistList.length;

      // Run synchronization in safe background timeouts so the HTTP request completes instantly
      setTimeout(async () => {
        try {
          console.log(`[Google Sheets Async Sync] Processing ${totalItems} items...`);
          // Sync books
          for (const book of booksList) {
            await forcePostToGoogleSheets(webAppUrl, "বই", "যোগ করা হয়েছে", book);
            await new Promise(resolve => setTimeout(resolve, 310)); // Rate limiting gap
          }
          // Sync members
          for (const member of membersList) {
            await forcePostToGoogleSheets(webAppUrl, "সদস্য", "যোগ করা হয়েছে", member);
            await new Promise(resolve => setTimeout(resolve, 310));
          }
          // Sync wishlist items
          for (const item of wishlistList) {
            await forcePostToGoogleSheets(webAppUrl, "উইশলিস্ট", "যোগ করা হয়েছে", item);
            await new Promise(resolve => setTimeout(resolve, 310));
          }
          console.log(`[Google Sheets Async Sync] Finished syncing all ${totalItems} items!`);
        } catch (bgErr) {
          console.error("[Google Sheets Async Sync] Error in background bulk sync:", bgErr);
        }
      }, 50);

      addLog("গুগল শিট ফুল সিঙ্ক", `ইউজারের অনুরোধে ব্যাকগ্রাউন্ডে সর্বমোট ${totalItems}টি বই, সদস্য ও উইশলিস্ট ডাটা গুগোল শিটে প্রেরণের কাজ শুরু করা হয়েছে।`);
      res.json({ success: true, message: `মোট ${totalItems}টি ডাটা (বই: ${booksList.length}টি, সদস্য: ${membersList.length}টি, উইশলিস্ট: ${wishlistList.length}টি) ব্যাকগ্রাউন্ড প্রসেসের মাধ্যমে গুগল শিটে ট্রান্সফার করা শুরু হয়েছে। এটি সম্পন্ন হতে কিছু সময় নিতে পারে।` });
    } catch (err: any) {
      console.error("POST /api/settings/googlesheets/sync-all failed:", err);
      res.status(500).json({ error: "সকল ডেটা সিঙ্ক ইনিশিয়েট করার সময় ইন্টারনাল সার্ভার এরর ঘটেছে।" });
    }
  });

  // ---------------- DASHBOARD DATA API ----------------

  app.get("/api/dashboard", authenticateAdmin, (req, res) => {
    const db = readDb();
    const todayStr = new Date().toISOString().split("T")[0];

    // Total books
    const totalBooks = db.books.length;
    // Available books
    const availableBooks = db.books.filter(b => b.status === "Available").length;
    // Issued books
    const issuedBooks = db.books.filter(b => b.status === "Issued").length;
    // Total members
    const totalMembers = db.members.length;

    // Late Issued books: returnDate is past, and status is "Issued"
    const lateBooks = db.issues.filter(issue => {
      if (issue.status !== "Issued") return false;
      const today = new Date(todayStr);
      const retDate = new Date(issue.returnDate);
      return retDate < today;
    }).length;

    // Today's transactions
    const todaysTransactions = db.issues.filter(issue => {
      const isTodayIssue = issue.issueDate === todayStr;
      const isTodayReturn = issue.returnedAt && issue.returnedAt.startsWith(todayStr);
      return isTodayIssue || isTodayReturn;
    }).length;

    // 1. Monthly Issue Data (last 6 months placeholder & calculated from db)
    // We can map issues by month names in Bengali
    const bnMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
    const issuesByMonthMap: Record<string, number> = {};
    const returnsByMonthMap: Record<string, number> = {};

    // Preset last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = bnMonths[d.getMonth()];
      issuesByMonthMap[mName] = 0;
      returnsByMonthMap[mName] = 0;
    }

    // Populate actual issue numbers
    db.issues.forEach(issue => {
      try {
        const issueD = new Date(issue.issueDate);
        const mIndex = issueD.getMonth();
        const mName = bnMonths[mIndex];
        if (mName in issuesByMonthMap) {
          issuesByMonthMap[mName]++;
        }

        if (issue.returnedAt) {
          const retD = new Date(issue.returnedAt);
          const retMName = bnMonths[retD.getMonth()];
          if (retMName in returnsByMonthMap) {
            returnsByMonthMap[retMName]++;
          }
        }
      } catch (err) {}
    });

    const monthlyReport = Object.keys(issuesByMonthMap).map(mName => ({
      month: mName,
      issues: issuesByMonthMap[mName],
      returns: returnsByMonthMap[mName] || 0,
    }));

    // 2. Most Popular Books
    const bookRentCounts: Record<string, { code: string; name: string; count: number }> = {};
    db.issues.forEach(issue => {
      const key = issue.bookCode;
      if (!bookRentCounts[key]) {
        bookRentCounts[key] = { code: issue.bookCode, name: issue.bookName, count: 0 };
      }
      bookRentCounts[key].count++;
    });

    const popularBooks = Object.values(bookRentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Most Active Members
    const memberIssueCounts: Record<string, { formNumber: string; name: string; count: number }> = {};
    db.issues.forEach(issue => {
      const key = issue.formNumber;
      if (!memberIssueCounts[key]) {
        memberIssueCounts[key] = { formNumber: issue.formNumber, name: issue.memberName, count: 0 };
      }
      memberIssueCounts[key].count++;
    });

    const activeMembers = Object.values(memberIssueCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Late return reports list
    const lateReportLoans = db.issues.filter(issue => {
      if (issue.status !== "Issued") return false;
      return new Date(issue.returnDate) < new Date(todayStr);
    });

    res.json({
      stats: {
        totalBooks,
        availableBooks,
        issuedBooks,
        lateBooks,
        todaysTransactions,
        totalMembers,
      },
      charts: {
        monthlyReport,
        popularBooks,
        activeMembers,
        lateReportLoans,
      },
    });
  });

  // ---------------- BOOK MANAGEMENT API ----------------

  // Search and Suggest
  app.get("/api/books/suggest", authenticateAdmin, (req, res) => {
    const q = (req.query.q || "").toString().toLowerCase();
    const db = readDb();

    const bengaliToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const parseNumberFromCode = (code: string): number => {
      let engCode = code.replace(/[০-৯]/g, (m) => bengaliToEnglish[m] || m);
      const match = engCode.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
      return Infinity;
    };
    const sortBooks = (arr: any[]) => {
      return [...arr].sort((a, b) => {
        const numA = parseNumberFromCode(a.code);
        const numB = parseNumberFromCode(b.code);
        if (numA !== numB) {
          return numA - numB;
        }
        return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
      });
    };

    if (!q) {
      return res.json(sortBooks(db.books).slice(0, 5));
    }

    const matches = db.books.filter(
      b =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
    );

    res.json(sortBooks(matches));
  });

  // Get books with query matching
  app.get("/api/books", authenticateAdmin, (req, res) => {
    const q = (req.query.q || "").toString().toLowerCase();
    const status = (req.query.status || "").toString();
    const db = readDb();

    let list = db.books;

    if (q) {
      list = list.filter(
        b =>
          b.code.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.publisher.toLowerCase().includes(q)
      );
    }

    if (status) {
      list = list.filter(b => b.status === status);
    }

    const bengaliToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const parseNumberFromCode = (code: string): number => {
      let engCode = code.replace(/[০-৯]/g, (m) => bengaliToEnglish[m] || m);
      const match = engCode.match(/\d+/);
      if (match) {
        return parseInt(match[0], 10);
      }
      return Infinity;
    };

    list = [...list].sort((a, b) => {
      const numA = parseNumberFromCode(a.code);
      const numB = parseNumberFromCode(b.code);
      if (numA !== numB) {
        return numA - numB;
      }
      return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
    });

    res.json(list);
  });

  // Add individual book
  app.post("/api/books", authenticateAdmin, async (req, res) => {
    const { code, name, author, publisher, imageUrl } = req.body;

    if (!code || !name || !author || !publisher) {
      return res.status(400).json({ error: "বই কোড, নাম, লেখক এবং প্রকাশনা আবশ্যক।" });
    }

    const db = readDb();

    // Check unique code
    if (db.books.find(b => b.code.toUpperCase() === code.toUpperCase())) {
      return res.status(400).json({ error: "এই বই কোডটি ইতিমধ্যেই ব্যবহৃত হয়েছে।" });
    }

    const newBook: Book = {
      id: `b-${Date.now()}`,
      code: code.toUpperCase(),
      name,
      author,
      publisher,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
      status: "Available",
    };

    db.books.unshift(newBook);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("বই", "যোগ করা হয়েছে", newBook).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("বই যোগ", `নতুন বই '${name}' (কোড: ${code}) সিস্টেমে যোগ করা হয়েছে।`);

    res.status(201).json(newBook);
  });

  // Edit book
  app.put("/api/books/:id", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { code, name, author, publisher, imageUrl, status } = req.body;

    if (!code || !name || !author || !publisher) {
      return res.status(400).json({ error: "বই কোড, নাম, লেখক এবং প্রকাশনা আবশ্যক।" });
    }

    const db = readDb();
    const bookIdx = db.books.findIndex(b => b.id === id);

    if (bookIdx === -1) {
      return res.status(404).json({ error: "বইটি পাওয়া যায়নি।" });
    }

    // Check duplicate code in other books
    const codeDuplicate = db.books.find(b => b.code.toUpperCase() === code.toUpperCase() && b.id !== id);
    if (codeDuplicate) {
      return res.status(400).json({ error: "এই বই কোডটি অন্য বইয়ের জন্য ব্যবহৃত হয়েছে।" });
    }

    const oldBook = db.books[bookIdx];
    const updatedBook: Book = {
      ...oldBook,
      code: code.toUpperCase(),
      name,
      author,
      publisher,
      imageUrl: imageUrl || oldBook.imageUrl,
      status: status || oldBook.status,
    };

    db.books[bookIdx] = updatedBook;
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("বই", "আপডেট করা হয়েছে", updatedBook).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("বই সম্পাদনা", `বই '${name}' (কোড: ${code}) এর সঠিক তথ্য আপডেট করা হয়েছে।`);

    res.json(updatedBook);
  });

  // Delete book
  app.delete("/api/books/:id", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const db = readDb();

    const book = db.books.find(b => b.id === id);
    if (!book) {
      return res.status(404).json({ error: "বইটি পাওয়া যায়নি।" });
    }

    // Check if book is currently issued
    if (book.status === "Issued") {
      return res.status(400).json({ error: "বইটি বর্তমানে সমর্পিত/ইস্যু অবস্থায় রয়েছে। রিটার্ন না করা পর্যন্ত ডিলিট সম্ভব নয়।" });
    }

    db.books = db.books.filter(b => b.id !== id);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("বই", "মুছে ফেলা হয়েছে", book).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("বই মুছে ফেলা", `বই '${book.name}' (কোড: ${book.code}) সিস্টেম থেকে মুছে ফেলা হয়েছে।`);

    res.json({ message: "বইটি সফলভাবে সিস্টেম থেকে মুছে ফেলা হয়েছে।" });
  });

  // Bulk Import
  app.post("/api/books/bulk-import", authenticateAdmin, (req, res) => {
    const { booksList } = req.body;

    if (!Array.isArray(booksList) || booksList.length === 0) {
      return res.status(400).json({ error: "বই তালিকা ত্রুটিযুক্ত।" });
    }

    const db = readDb();
    let importedCount = 0;
    let duplicatesCount = 0;

    booksList.forEach((bookItem: any) => {
      const { code, name, author, publisher, imageUrl } = bookItem;
      if (code && name && author) {
        const uCode = code.toUpperCase();
        if (!db.books.find(b => b.code === uCode)) {
          db.books.unshift({
            id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            code: uCode,
            name,
            author,
            publisher: publisher || "অজ্ঞাত প্রকাশনা",
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
            status: "Available",
          });
          importedCount++;
        } else {
          duplicatesCount++;
        }
      }
    });

    writeDb(db);
    addLog("বই বাল্ক ইম্পোর্ট", `${importedCount} টি বই বাল্ক ইম্পোর্ট করা হয়েছে। ডুপ্লিকেট বাদ পড়েছে: ${duplicatesCount} টি।`);

    res.json({ success: true, importedCount, duplicatesCount });
  });

  // ---------------- BOOK SEARCH & DETAILS ----------------

  app.get("/api/books/search-smart", authenticateAdmin, (req, res) => {
    const q = (req.query.q || "").toString().toLowerCase();
    const db = readDb();

    if (!q) {
      return res.json([]);
    }

    // Smart query search in books
    const matchingBooks = db.books.filter(
      b =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
    );

    const result = matchingBooks.map(book => {
      // Find the latest active issue record for this book code
      const issueRecords = db.issues.filter(issue => issue.bookCode === book.code).sort((a, b) => b.id.localeCompare(a.id));
      const activeIssue = issueRecords.find(i => i.status === "Issued");
      const lastReturned = issueRecords.find(i => i.status === "Returned");

      return {
        book,
        activeIssue: activeIssue || null,
        history: issueRecords,
      };
    });

    res.json(result);
  });

  // ---------------- MEMBER MANAGEMENT API ----------------

  app.get("/api/members/suggest", authenticateAdmin, (req, res) => {
    const q = (req.query.q || "").toString().toLowerCase();
    const db = readDb();

    if (!q) {
      return res.json(db.members.slice(0, 5));
    }

    const matches = db.members.filter(
      m => m.formNumber.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.mobile.toLowerCase().includes(q)
    );

    res.json(matches);
  });

  app.get("/api/members", authenticateAdmin, (req, res) => {
    const db = readDb();
    // Sort members by Form Number ascending
    const list = [...db.members].sort((a, b) => {
      return a.formNumber.localeCompare(b.formNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
    res.json(list);
  });

  // Get single member profile reports
  app.get("/api/members/:formNumber/profile", authenticateAdmin, (req, res) => {
    const { formNumber } = req.params;
    const db = readDb();

    const member = db.members.find(m => m.formNumber === formNumber);
    if (!member) {
      return res.status(404).json({ error: "সদস্য পাওয়া যায়নি।" });
    }

    // Get active rents
    const activeRents = db.issues.filter(i => i.formNumber === formNumber && i.status === "Issued");
    // Get returned history
    const returnedHistory = db.issues.filter(i => i.formNumber === formNumber && i.status === "Returned");
    // All logs
    const allRents = db.issues.filter(i => i.formNumber === formNumber);

    res.json({
      member,
      activeRents,
      returnedHistory,
      rentCount: allRents.length,
    });
  });

  app.post("/api/members", authenticateAdmin, async (req, res) => {
    const { name, formNumber, mobile, address } = req.body;

    if (!name || !formNumber || !mobile) {
      return res.status(400).json({ error: "সদস্যর নাম, ফরম নম্বর এবং মোবাইল নাম্বার আবশ্যক।" });
    }

    const db = readDb();

    if (db.members.find(m => m.formNumber === formNumber)) {
      return res.status(400).json({ error: "এই ফরম নম্বরটি দিয়ে ইতিমধ্যেই মেম্বার রেজিস্টার্ড রয়েছে।" });
    }

    const newMember: Member = {
      name,
      formNumber,
      mobile,
      address: address || "অজানা ঠিকানা",
    };

    db.members.push(newMember);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("সদস্য", "যোগ করা হয়েছে", newMember).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("সদস্য যোগ", `নতুন সদস্য ${name} (ফরম নম্বর: ${formNumber}) যোগ করা হয়েছে।`);

    res.status(201).json(newMember);
  });

  app.delete("/api/members/:formNumber", authenticateAdmin, async (req, res) => {
    const { formNumber } = req.params;
    const db = readDb();
    const index = db.members.findIndex(m => m.formNumber === formNumber);
    if (index === -1) {
      return res.status(404).json({ error: "সদস্য খুঁজে পাওয়া যায়নি।" });
    }
    
    const member = db.members[index];
    
    // Remove member from member list
    db.members.splice(index, 1);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("সদস্য", "মুছে ফেলা হয়েছে", member).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("সদস্য ডিলিট", `সদস্য '${member.name}' (ফরম নম্বর: ${formNumber}) কে মুছে ফেলা হয়েছে।`);

    res.json({ success: true, message: "সদস্য সফলভাবে মুছে ফেলা হয়েছে।" });
  });

  // ---------------- BOOK ISSUE SYSTEM ----------------

  app.post("/api/issues", authenticateAdmin, async (req, res) => {
    const {
      name,
      formNumber,
      mobile,
      address,
      bookCode,
      bookName,
      author,
      publisher,
      returnOption, // "1", "2", "7", "10", "manual"
      manualReturnDate,
    } = req.body;

    if (!name || !formNumber || !mobile || !bookCode || !bookName) {
      return res.status(400).json({ error: "সদস্যর তথ্য এবং বইয়ের কোড বা নাম আবশ্যক।" });
    }

    const db = readDb();

    // 1. Identify the book
    const book = db.books.find(b => b.code.toUpperCase() === bookCode.toUpperCase());
    if (!book) {
      return res.status(404).json({ error: "এই কোডযুক্ত বইটি লাইব্রেরিতে নিবন্ধিত নেই।" });
    }

    if (book.status === "Issued") {
      return res.status(400).json({ error: "বইটি ইতিমধ্যে ইস্যু করা আছে। ফেরত দেওয়ার পরই আবার ইস্যু করা যাবে।" });
    }

    // 2. Member auto creation/update check
    let member = db.members.find(m => m.formNumber === formNumber);
    if (!member) {
      member = {
        name,
        formNumber,
        mobile,
        address: address || "অজানা ঠিকানা",
      };
      db.members.push(member);
      addLog("সদস্য যোগ", `ইস্যু সময় তৈরি: নতুন সদস্য ${name} (ফরম: ${formNumber}) স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।`);
    } else {
      // Keep mobile/address updated
      member.name = name;
      member.mobile = mobile;
      member.address = address || member.address;
    }

    // 3. Compute Dates
    const today = new Date();
    const issueDateStr = today.toISOString().split("T")[0];

    let computedReturnDateStr = "";
    if (returnOption === "manual") {
      computedReturnDateStr = manualReturnDate;
    } else {
      const days = parseInt(returnOption, 10) || 7;
      const retDate = new Date();
      retDate.setDate(today.getDate() + days);
      computedReturnDateStr = retDate.toISOString().split("T")[0];
    }

    if (!computedReturnDateStr) {
      return res.status(400).json({ error: "একটি সঠিক রিটার্ন তারিখ নির্বাচন করুন।" });
    }

    const newIssue: IssueRecord = {
      id: `i-${Date.now()}`,
      bookCode: book.code,
      bookName: book.name,
      author: book.author,
      publisher: book.publisher,
      memberName: member.name,
      formNumber: member.formNumber,
      mobile: member.mobile,
      address: member.address,
      issueDate: issueDateStr,
      returnDate: computedReturnDateStr,
      status: "Issued",
      extensionHistory: [],
      comments: [],
    };

    // Update book status
    book.status = "Issued";

    db.issues.unshift(newIssue);
    writeDb(db);

    addLog("বই ইস্যু", `বই '${book.name}' (কোড: ${book.code}) সদস্য ${member.name} (ফরম: ${member.formNumber}) কে ইস্যু করা হয়েছে।`);
    
    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("লেনদেন", "ইস্যু করা হয়েছে", newIssue).catch(err => console.warn("[Google Sheets Background Error]:", err));

    res.status(201).json({ success: true, issue: newIssue });
  });

  // Return Book
  app.post("/api/issues/return", authenticateAdmin, async (req, res) => {
    const { bookCode, comments } = req.body;

    if (!bookCode) {
      return res.status(400).json({ error: "বই কোড আবশ্যক।" });
    }

    const db = readDb();

    // Find the active issued record
    const issueIdx = db.issues.findIndex(i => i.bookCode.toUpperCase() === bookCode.toUpperCase() && i.status === "Issued");
    if (issueIdx === -1) {
      return res.status(404).json({ error: "বইটির কোনো সক্রিয় ইস্যু অ্যাকাউন্ট পাওয়া যায়নি।" });
    }

    const book = db.books.find(b => b.code.toUpperCase() === bookCode.toUpperCase());
    if (book) {
      book.status = "Available";
    }

    const issue = db.issues[issueIdx];
    issue.status = "Returned";
    issue.returnedAt = new Date().toISOString().split("T")[0];
    if (comments) {
      issue.comments.push(comments);
    }

    writeDb(db);

    addLog("বই ফেরত", `বই '${issue.bookName}' (কোড: ${issue.bookCode}) সদস্য ${issue.memberName} থেকে ফেরত গ্রহণ করা হয়েছে।`);
    
    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("লেনদেন", "ফেরত দেওয়া হয়েছে", issue).catch(err => console.warn("[Google Sheets Background Error]:", err));

    res.json({ success: true, message: "বইটি সফলভাবে ফেরত গ্রহণ করা হয়েছে।" });
  });

  // Time Extension or Reduction
  app.post("/api/issues/time-change", authenticateAdmin, (req, res) => {
    const { issueId, action, days } = req.body; // action: "Extend" | "Reduce", days: number

    if (!issueId || !action || !days) {
      return res.status(400).json({ error: "প্রয়োজনীয় তথ্য অনুপস্থিত।" });
    }

    const db = readDb();
    const issue = db.issues.find(i => i.id === issueId);

    if (!issue) {
      return res.status(404).json({ error: "ইস্যু অ্যাকাউন্ট পাওয়া যায়নি।" });
    }

    if (issue.status !== "Issued") {
      return res.status(400).json({ error: "শুধুমাত্র চলমান ইস্যু বইয়ের সময় বৃদ্ধি/হ্রাস সম্ভব।" });
    }

    const currentDate = new Date(issue.returnDate);
    const offset = parseInt(days, 10);

    if (action === "Extend") {
      currentDate.setDate(currentDate.getDate() + offset);
      issue.extensionHistory.push({
        date: new Date().toISOString().split("T")[0],
        action: "Extended",
        payload: `${offset} দিন বাড়ানো হয়েছে`,
      });
      addLog("সময় বাড়ানো", `'${issue.bookName}' (কোড: ${issue.bookCode}) বইয়ের সময়সীমা ${offset} দিন বৃদ্ধি করা হয়েছে। নতুন তারিখ: ${currentDate.toISOString().split("T")[0]}`);
    } else {
      currentDate.setDate(currentDate.getDate() - offset);
      issue.extensionHistory.push({
        date: new Date().toISOString().split("T")[0],
        action: "Reduced",
        payload: `${offset} দিন কমানো হয়েছে`,
      });
      addLog("সময় কমানো", `'${issue.bookName}' (কোড: ${issue.bookCode}) বইয়ের সময়সীমা ${offset} দিন কমানো হয়েছে। নতুন তারিখ: ${currentDate.toISOString().split("T")[0]}`);
    }

    issue.returnDate = currentDate.toISOString().split("T")[0];
    writeDb(db);

    res.json({ success: true, newReturnDate: issue.returnDate });
  });

  // ---------------- WISHLIST API ----------------

  app.get("/api/wishlist", authenticateAdmin, (req, res) => {
    const db = readDb();
    res.json(db.wishlist);
  });

  app.post("/api/wishlist", authenticateAdmin, async (req, res) => {
    const { name, author, publisher } = req.body;

    if (!name) {
      return res.status(400).json({ error: "বইয়ের নাম থাকতে হবে।" });
    }

    const db = readDb();
    const newItem: WishlistItem = {
      id: `w-${Date.now()}`,
      name,
      author: author || "অজ্ঞাত",
      publisher: publisher || "অজ্ঞাত",
      createdAt: formatCurrentDateTime(),
    };

    db.wishlist.unshift(newItem);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("উইশলিস্ট", "যোগ করা হয়েছে", newItem).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("বই যোগ", `উইশলিস্টে নতুন বই '${name}' যোগ করা হয়েছে।`);

    res.status(201).json(newItem);
  });

  app.delete("/api/wishlist/:id", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const db = readDb();

    const item = db.wishlist.find(w => w.id === id);
    if (!item) {
      return res.status(404).json({ error: "আইটেমটি পাওয়া যায়নি।" });
    }

    db.wishlist = db.wishlist.filter(w => w.id !== id);
    writeDb(db);

    // Sync to Google Sheets asynchronously in the background so save is instant
    postToGoogleSheets("উইশলিস্ট", "মুছে ফেলা হয়েছে", item).catch(err => console.warn("[Google Sheets Background Error]:", err));

    addLog("বই মুছে ফেলা", `উইশলিস্ট থেকে বই '${item.name}' মুছে ফেলা হয়েছে।`);

    res.json({ success: true });
  });

  // ---------------- NOTEPAD / NOTES SYSTEM ----------------

  app.get("/api/notes", authenticateAdmin, (req, res) => {
    const db = readDb();
    res.json(db.notes);
  });

  app.post("/api/notes", authenticateAdmin, (req, res) => {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "নোটের শিরোনাম আবশ্যক।" });
    }

    const db = readDb();
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title,
      content: content || "",
      createdAt: formatCurrentDateTime(),
      updatedAt: formatCurrentDateTime(),
    };

    db.notes.unshift(newNote);
    writeDb(db);

    addLog("নোট তৈরি", `নোটের শিরোনাম: '${title}' সফলভাবে তৈরি হয়েছে।`);

    res.status(201).json(newNote);
  });

  app.put("/api/notes/:id", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "নোটের শিরোনাম আবশ্যক।" });
    }

    const db = readDb();
    const noteIdx = db.notes.findIndex(n => n.id === id);

    if (noteIdx === -1) {
      return res.status(404).json({ error: "নোটটি খুঁজে পাওয়া যায়নি।" });
    }

    db.notes[noteIdx] = {
      ...db.notes[noteIdx],
      title,
      content: content || "",
      updatedAt: formatCurrentDateTime(),
    };

    writeDb(db);
    res.json(db.notes[noteIdx]);
  });

  app.delete("/api/notes/:id", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDb();

    const note = db.notes.find(n => n.id === id);
    if (!note) {
      return res.status(404).json({ error: "নোটটি খুঁজে পাওয়া যায়নি।" });
    }

    db.notes = db.notes.filter(n => n.id !== id);
    writeDb(db);

    addLog("নোট মুছে ফেলা", `শিরোনাম: '${note.title}' নোটটি সম্পূর্ণ মুছে ফেলা হয়েছে।`);

    res.json({ success: true });
  });

  // ---------------- AUDIT HISTORY LOOPS ----------------

  app.get("/api/history", authenticateAdmin, (req, res) => {
    const q = (req.query.q || "").toString().toLowerCase();
    const actionFilter = (req.query.action || "").toString();
    const db = readDb();

    let list = db.auditLogs;

    if (q) {
      list = list.filter(l => l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
    }

    if (actionFilter) {
      list = list.filter(l => l.action === actionFilter);
    }

    res.json(list);
  });

  app.delete("/api/history/:id", authenticateAdmin, (req, res) => {
    const { id } = req.params;
    const db = readDb();

    db.auditLogs = db.auditLogs.filter(l => l.id !== id);
    writeDb(db);

    res.json({ success: true });
  });

  // Delete batch/filtered history
  app.delete("/api/history", authenticateAdmin, (req, res) => {
    const db = readDb();
    db.auditLogs = [];
    writeDb(db);

    addLog("ইতিহাস মুছে ফেলা", `লগ হিস্ট্রি রিবুট করা হয়েছে।`);

    res.json({ success: true, message: "সমস্ত হিস্ট্রি লোগ সফলভাবে বাতিল করা হয়েছে।" });
  });

  // ---------------- SIMULATED SMS SCHEDULER & LIST ----------------

  // Timezone-safe date difference calculation helper for Bangladesh UTC+6
  function getBangladeshDiffDays(todayStr: string, returnDateStr: string): number {
    try {
      const [tY, tM, tD] = todayStr.split("-").map(Number);
      const [rY, rM, rD] = returnDateStr.split("-").map(Number);
      
      const tDate = new Date(tY, tM - 1, tD, 12, 0, 0);
      const rDate = new Date(rY, rM - 1, rD, 12, 0, 0);
      
      const diffTime = tDate.getTime() - rDate.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      return -1;
    }
  }

  // Returns currently scheduled warnings
  app.get("/api/sms/scheduled", authenticateAdmin, (req, res) => {
    const db = readDb();
    const todayStr = new Date().toISOString().split("T")[0];

    const alerts: Array<{
      id: string;
      bookName: string;
      memberName: string;
      returnDate: string;
      mobile: string;
      status: "Scheduled" | "Sent";
      alertText: string;
      triggerTime: string;
      bookCode?: string;
      issueId?: string;
    }> = [];

    db.issues.forEach(issue => {
      if (issue.status !== "Issued") return;

      const diffDays = getBangladeshDiffDays(todayStr, issue.returnDate);

      // Rules:
      // - At return date 2:00 PM it triggers SMS.
      // - Every 2 days after return date it continues.
      // Determine if an alert was triggered today or is scheduled
      const rawTemplate = (db as any).smsTemplate || "আসসালামু আলাইকুম, আপনার ({bookName}) বইটি জমাদেয়ার সময় অতিক্রম হয়েছে। অনুগ্রহ করে বইটি অক্ষর পাঠাগার এ জমা দিয়ে আসুন। আমাদের পাঠাগার প্রতিদিন বিকাল ৪ টা থেকে রাত ৮ টা পর্যন্ত খোলা থাকে। বা আপনার বই যদি পড়া শেষ না হয়ে থাকে তাহলে অনুগ্রহ করে এই নাম্বারে call /WhatsApp এ যোগাযোগ করেন: 01333474848";
      
      const text = rawTemplate
        .replace(/{bookName}/g, issue.bookName)
        .replace(/{বইয়েরনাম}/g, issue.bookName)
        .replace(/{বইয়েরনাম}/g, issue.bookName)
        .replace(/{book}/g, issue.bookName)
        .replace(/{বই}/g, issue.bookName)
        .replace(/{memberName}/g, issue.memberName)
        .replace(/{সদস্যেরনাম}/g, issue.memberName)
        .replace(/{সদস্য}/g, issue.memberName)
        .replace(/{returnDate}/g, issue.returnDate)
        .replace(/{ফেরততারিখ}/g, issue.returnDate)
        .replace(/{তারিখ}/g, issue.returnDate);

      if (diffDays >= 0) {
        // Returned date is today or has passed
        const isTriggerDay = diffDays % 2 === 0;
        alerts.push({
          id: `sms-${issue.id}-${diffDays}`,
          bookName: issue.bookName,
          memberName: issue.memberName,
          returnDate: issue.returnDate,
          mobile: issue.mobile,
          status: isTriggerDay ? "Sent" : "Scheduled",
          alertText: text,
          triggerTime: `${issue.returnDate} দুপুর ২:০০ টা (আজ থেকে প্রতি ২ দিন অন্তর)`,
          bookCode: issue.bookCode,
          issueId: issue.id,
        });
      } else {
        // Scheduled in future
        alerts.push({
          id: `sms-${issue.id}-future`,
          bookName: issue.bookName,
          memberName: issue.memberName,
          returnDate: issue.returnDate,
          mobile: issue.mobile,
          status: "Scheduled",
          alertText: text,
          triggerTime: `${issue.returnDate} দুপুর ২:০০ টা`,
          bookCode: issue.bookCode,
          issueId: issue.id,
        });
      }
    });

    res.json(alerts);
  });

  // Trigger simulated cron job to run check immediately
  app.post("/api/sms/trigger", authenticateAdmin, async (req, res) => {
    try {
      const db = readDb();
      const todayStr = new Date().toISOString().split("T")[0];
      const gateway = db.smsGateway || { provider: "simulated", apiKey: "", senderId: "", customUrl: "" };

      // Find all live active alerts for today (corresponds to active overdue notifications that modulo hits)
      const activeAlerts: Array<{ mobile: string; text: string; memberName: string }> = [];

      db.issues.forEach(issue => {
        if (issue.status !== "Issued") return;

        const diffDays = getBangladeshDiffDays(todayStr, issue.returnDate);

        if (diffDays >= 0 && diffDays % 2 === 0) {
          const rawTemplate = db.smsTemplate || "আসসালামু আলাইকুম, আপনার ({bookName}) বইটি জমাদেয়ার সময় অতিক্রম হয়েছে। অনুগ্রহ করে বইটি অক্ষর পাঠাগার এ জমা দিয়ে আসুন। আমাদের পাঠাগার প্রতিদিন বিকাল ৪ টা থেকে রাত ৮ টা পর্যন্ত খোলা থাকে। বা আপনার বই যদি পড়া শেষ না হয়ে থাকে তাহলে অনুগ্রহ করে এই নাম্বারে call /WhatsApp এ যোগাযোগ করেন: 01333474848";
          const text = rawTemplate
            .replace(/{bookName}/g, issue.bookName)
            .replace(/{বইয়েরনাম}/g, issue.bookName)
            .replace(/{বইয়েরনাম}/g, issue.bookName)
            .replace(/{book}/g, issue.bookName)
            .replace(/{বই}/g, issue.bookName)
            .replace(/{memberName}/g, issue.memberName)
            .replace(/{সদস্যেরনাম}/g, issue.memberName)
            .replace(/{সদস্য}/g, issue.memberName)
            .replace(/{returnDate}/g, issue.returnDate)
            .replace(/{ফেরততারিখ}/g, issue.returnDate)
            .replace(/{তারিখ}/g, issue.returnDate);

          activeAlerts.push({
            mobile: issue.mobile,
            text,
            memberName: issue.memberName
          });
        }
      });

      let responseMsg = "পেন্ডিং সতর্কতা SMS শিডিউলসমূহ সফলভাবে সিঙ্ক করা হয়েছে। (সিমুলেশন মোড)";
      let logDetails = "অটোমেটেড SMS শিডিউল চেক করা হয়েছে এবং সক্রিয় ওভারডিউ সতর্কতা ফরোয়ার্ড করা হয়েছে।";

      // If a real SMS Gateway is configured
      if (gateway.provider && gateway.provider !== "simulated" && gateway.apiKey) {
        let successCount = 0;
        let failCount = 0;

        for (const alert of activeAlerts) {
          try {
            let url = "";

            // Normalize mobile number (remove non-digits)
            let rawMobile = alert.mobile.replace(/\D/g, "");
            let mobileWith88 = rawMobile.startsWith("88") ? rawMobile : "88" + rawMobile;
            let mobileWithout88 = rawMobile.startsWith("88") ? rawMobile.slice(2) : rawMobile;

            if (gateway.provider === "greenweb") {
              const encodedMsg = encodeURIComponent(alert.text);
              url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(gateway.apiKey)}&to=${encodeURIComponent(mobileWith88)}&message=${encodedMsg}`;
            } else if (gateway.provider === "bulksmsbd") {
              const encodedMsg = encodeURIComponent(alert.text);
              const senderParam = gateway.senderId ? `&senderid=${encodeURIComponent(gateway.senderId)}` : "";
              url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(gateway.apiKey)}&type=text&number=${encodeURIComponent(mobileWith88)}${senderParam}&message=${encodedMsg}`;
            } else if (gateway.provider === "custom") {
              let customUrlStr = gateway.customUrl || "";
              customUrlStr = customUrlStr
                .replace(/{apiKey}/g, encodeURIComponent(gateway.apiKey))
                .replace(/{token}/g, encodeURIComponent(gateway.apiKey))
                .replace(/{to}/g, encodeURIComponent(mobileWith88))
                .replace(/{mobile}/g, encodeURIComponent(mobileWith88))
                .replace(/{mobileNo}/g, encodeURIComponent(mobileWithout88))
                .replace(/{senderId}/g, encodeURIComponent(gateway.senderId))
                .replace(/{message}/g, encodeURIComponent(alert.text))
                .replace(/{msg}/g, encodeURIComponent(alert.text));
              
              url = customUrlStr;
            }

            if (url) {
              console.log(`Sending real SMS to ${alert.memberName} (${alert.mobile}) via ${gateway.provider}`);
              const apiRes = await fetch(url, { method: "GET" });
              const apiText = await apiRes.text();
              console.log(`Gateway response for ${alert.mobile}:`, apiText);
              successCount++;
            }
          } catch (smsErr) {
            console.error(`Failed to send real SMS to ${alert.mobile}:`, smsErr);
            failCount++;
          }
        }

        responseMsg = `বাস্তব SMS গেটওয়ে (${gateway.provider}) এর মাধ্যমে সতর্কতা রান করা হয়েছে। সফল: ${successCount}টি, ব্যর্থ: ${failCount}টি।`;
        logDetails = `বাস্তব SMS গেটওয়ে (${gateway.provider}) মারফত SMS পাঠানো রান হয়েছে। মোট সফল: ${successCount}, ব্যর্থ: ${failCount}।`;
      }

      addLog("SMS সতর্কতা রান", logDetails);
      res.json({ success: true, message: responseMsg });
    } catch (err: any) {
      console.error("SMS trigger endpoint runtime error:", err);
      res.status(500).json({ error: "SMS শিডিউলার রান করার সময় ইন্টারনাল ত্রুটি হয়েছে।" });
    }
  });

  // POST send a single instant manual SMS message
  app.post("/api/sms/send-single", authenticateAdmin, async (req, res) => {
    try {
      const { mobile, message } = req.body;
      if (!mobile || !message) {
        return res.status(400).json({ error: "মোবাইল এবং বার্তা উভয়ই প্রদান করা আবশ্যক।" });
      }

      const db = readDb();
      const gateway = db.smsGateway || { provider: "simulated", apiKey: "", senderId: "", customUrl: "" };

      let rawMobile = mobile.replace(/\D/g, "");
      let mobileWith88 = rawMobile.startsWith("88") ? rawMobile : "88" + rawMobile;
      let mobileWithout88 = rawMobile.startsWith("88") ? rawMobile.slice(2) : rawMobile;

      let logDetails = `ম্যানুয়াল একক SMS প্রেরণের চেষ্টা পাঠানো হয়েছে রিসিপেন্ট নম্বর: ${mobile}`;
      let responseMsg = "সফলভাবে একক SMS পাঠানো হয়েছে (সিমুলেশন মোড)";
      let success = true;

      if (gateway.provider && gateway.provider !== "simulated" && gateway.apiKey) {
        let url = "";
        const encodedMsg = encodeURIComponent(message);

        if (gateway.provider === "greenweb") {
          url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(gateway.apiKey)}&to=${encodeURIComponent(mobileWith88)}&message=${encodedMsg}`;
        } else if (gateway.provider === "bulksmsbd") {
          const senderParam = gateway.senderId ? `&senderid=${encodeURIComponent(gateway.senderId)}` : "";
          url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(gateway.apiKey)}&type=text&number=${encodeURIComponent(mobileWith88)}${senderParam}&message=${encodedMsg}`;
        } else if (gateway.provider === "custom") {
          let customUrlStr = gateway.customUrl || "";
          customUrlStr = customUrlStr
            .replace(/{apiKey}/g, encodeURIComponent(gateway.apiKey))
            .replace(/{token}/g, encodeURIComponent(gateway.apiKey))
            .replace(/{to}/g, encodeURIComponent(mobileWith88))
            .replace(/{mobile}/g, encodeURIComponent(mobileWith88))
            .replace(/{mobileNo}/g, encodeURIComponent(mobileWithout88))
            .replace(/{senderId}/g, encodeURIComponent(gateway.senderId))
            .replace(/{message}/g, encodedMsg)
            .replace(/{msg}/g, encodedMsg);
          url = customUrlStr;
        }

        if (url) {
          console.log(`Sending single SMS to ${mobile} via ${gateway.provider}: ${url}`);
          const apiRes = await fetch(url, { method: "GET" });
          const apiText = await apiRes.text();
          console.log(`Single SMS response for ${mobile}:`, apiText);
          
          if (apiText.toLowerCase().includes("error") || apiText.toLowerCase().includes("failed") || apiText.toLowerCase().includes("invalid")) {
            success = false;
            responseMsg = `গেটওয়ে থেকে এরর পাওয়া গেছে: ${apiText}`;
          } else {
            responseMsg = `সফলভাবে একক SMS পাঠানো হয়েছে! গেটওয়ে রেসপন্স: ${apiText}`;
          }
        }
      }

      addLog("ম্যানুয়াল SMS", `নম্বর ${mobile}-এ বার্তা প্রেরণ করা হয়েছে। বিবরণ: ${message}`);
      res.json({ success, message: responseMsg });
    } catch (err: any) {
      console.error("Single SMS send runtime error:", err);
      res.status(500).json({ error: `SMS পাঠাতে অভ্যন্তরীণ ত্রুটি হয়েছে: ${err.message || err}` });
    }
  });

  // POST Google Sheets Import database
  app.post("/api/settings/googlesheets/import-all", authenticateAdmin, async (req, res) => {
    try {
      const db = readDb();
      const config = db.googleSheetsConfig;
      if (!config || !config.webAppUrl) {
        return res.status(400).json({ error: "কোনো গুগল শিট Web App URL সেট করা নেই। দয়া করে সেটিংস প্রথমে সেট করে সেভ করুন।" });
      }

      console.log(`[Google Sheets Import] Fetching data from ${config.webAppUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await globalThis.fetch(config.webAppUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Akkhor-Pathagar-Library-System-Import"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.error) {
        return res.status(500).json({ error: `গুগল অ্যাপস স্ক্রিপ্ট এরর: ${data.error}` });
      }

      let importedBooks = 0;
      let importedMembers = 0;
      let importedWishlist = 0;

      // Import books safely
      if (Array.isArray(data.books)) {
        data.books.forEach((b: any) => {
          if (!b.code || !b.name) return;
          const exists = db.books.some(existing => existing.code === b.code);
          if (!exists) {
            db.books.unshift({
              id: b.id || `book-${Math.random().toString(36).substr(2, 9)}`,
              code: b.code,
              name: b.name,
              author: b.author || "অজ্ঞাত",
              publisher: b.publisher || "অজ্ঞাত প্রকাশনী",
              imageUrl: b.imageUrl?.trim() || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
              status: b.status || "Available"
            });
            importedBooks++;
          }
        });
      }

      // Import members safely
      if (Array.isArray(data.members)) {
        data.members.forEach((m: any) => {
          if (!m.formNumber || !m.name) return;
          const exists = db.members.some(existing => existing.formNumber === m.formNumber);
          if (!exists) {
            db.members.push({
              formNumber: m.formNumber,
              name: m.name,
              mobile: m.mobile || "",
              address: m.address || ""
            });
            importedMembers++;
          }
        });
      }

      // Import wishlist safely
      if (Array.isArray(data.wishlist)) {
        data.wishlist.forEach((w: any) => {
          if (!w.name) return;
          const exists = db.wishlist.some(existing => existing.name === w.name);
          if (!exists) {
            db.wishlist.unshift({
              id: w.id || `wish-${Math.random().toString(36).substr(2, 9)}`,
              name: w.name,
              author: w.author || "",
              publisher: w.publisher || "",
              createdAt: new Date().toISOString().split("T")[0]
            });
            importedWishlist++;
          }
        });
      }

      writeDb(db);
      addLog("গুগল শিট ডাটা ইম্পোর্ট", `গুগল শিট থেকে সর্বমোট সফলভাবে ডাটা ডাউনলোড ইম্পোর্ট করা হয়েছে। নতুন বই: ${importedBooks}টি, নতুন সদস্য: ${importedMembers}টি, নতুন উইশলিস্ট: ${importedWishlist}টি।`);
      
      res.json({
        success: true,
        message: `গুগল শিট থেকে ডাটা সফলভাবে ডাউনলোড ও ইম্পোর্ট করা হয়েছে!`,
        details: `নতুন ইম্পোর্টকৃত - বই: ${importedBooks}টি, সদস্য: ${importedMembers}জন, উইশলিস্ট: ${importedWishlist}টি।`
      });
    } catch (err: any) {
      console.error("[Google Sheets Import] Connection failed:", err);
      res.status(500).json({ error: `গুগল শিট থেকে ডাটা ডাউনলোড সম্ভব হয়নি। অনুগ্রহ করে নিশ্চিত হোন আপনার Apps Script-এ doGet(e) ফাংশনটি যুক্ত রয়েছে এবং Deploy-এ অ্যাক্সেস 'Anyone' দেয়া আছে। এরর: ${err.message || err}` });
    }
  });

  // Bulk ZIP download endpoint returns JSON files ready for zip downloads
  app.get("/api/bulk-raw", authenticateAdmin, (req, res) => {
    const db = readDb();
    res.json({
      books: db.books,
      members: db.members,
      issues: db.issues,
      auditLogs: db.auditLogs,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
});
