import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookMarked,
  SearchCode,
  ArrowUpDown,
  Users2,
  Heart,
  FileEdit,
  History,
  MailWarning,
  Sliders,
  LogOut,
  DownloadCloud,
  FileArchive,
  Image,
  Sparkles,
  RefreshCw,
  Lock,
  Menu,
  X
} from "lucide-react";
import JSZip from "jszip";

// Inner view components
import Dashboard from "./components/Dashboard";
import BookManager from "./components/BookManager";
import SmartSearch from "./components/SmartSearch";
import IssueReturn from "./components/IssueReturn";
import MemberManager from "./components/MemberManager";
import Wishlist from "./components/Wishlist";
import Notepad from "./components/Notepad";
import AuditLogView from "./components/AuditLogView";
import SmsAlerts from "./components/SmsAlerts";
import Settings from "./components/Settings";
import PreviewModal from "./components/PreviewModal";

import { apiClient } from "./api";
import { Book, WishlistItem, Note, AuditLog } from "./types";
import akkhorLogo from "./assets/images/akkhor_logo_1781456142605.jpg";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [username, setUsername] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth form states
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dynamic lists states
  const [books, setBooks] = useState<Book[]>([]);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [triggerLogs, setTriggerLogs] = useState(0); // Trigger reload in Audit History

  // Logo upload simulator states
  const [logoUrl, setLogoUrl] = useState<string>(""); 
  const [logoBase64, setLogoBase64] = useState<string>(akkhorLogo);
  const [isLogoLoading, setIsLogoLoading] = useState(false);

  // Shared Preview Modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewDataType, setPreviewDataType] = useState<any>("general");
  const [previewData, setPreviewData] = useState<any | null>(null);

  // --- 1. SESSION VERIFICATION & BOOT ---
  const checkSession = async () => {
    setAuthChecking(true);
    try {
      const token = localStorage.getItem("okkhor_pathagar_token");
      if (token) {
        const res = await apiClient.get("/auth/verify");
        if (res.authenticated) {
          setIsAuthenticated(true);
          setUsername(res.username);
          loadCoreData();
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Listen to session expiry events
    const handleAuthExpired = () => {
      setIsAuthenticated(false);
      localStorage.removeItem("okkhor_pathagar_token");
    };

    const handleDataImported = () => {
      loadCoreData();
      setTriggerLogs(prev => prev + 1);
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    window.addEventListener("data-imported", handleDataImported);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
      window.removeEventListener("data-imported", handleDataImported);
    };
  }, []);

  // --- 2. DYNAMIC SYSTEM LOAD LOOPS ---
  const loadCoreData = async () => {
    try {
      // 1. Fetch books list
      const booksList = await apiClient.get("/books");
      setBooks(booksList);

      // 2. Fetch dashboard specs
      const dbStats = await apiClient.get("/dashboard");
      setDashboardData(dbStats);

      // 3. Filter active issued items for timing change dropdown picker
      if (dbStats.charts?.lateReportLoans) {
        const issuesList = await apiClient.get("/history");
        const activeLoans = issuesList.filter((i: any) => i.action === "বই ইস্যু" || i.action === "সময় বাড়ানো" || i.action === "সময় কমানো");
        // Get actual active issues from server-side active items
        const allStats = await apiClient.get("/dashboard");
        // Filter active transactions
        const activeRents = allStats.charts.lateReportLoans; // placeholder or calculations
      }
      
      const smsScheduled = await apiClient.get("/sms/scheduled");
      // Map currently active borrows from warnings list
      const activeBorns = smsScheduled.map((item: any) => ({
        id: item.issueId || item.id.replace("sms-", "").split("-")[0],
        bookCode: item.bookCode || "BOK-103",
        bookName: item.bookName,
        memberName: item.memberName,
        returnDate: item.returnDate,
      }));
      // Filter out duplicates if any
      const uniqueBorns = activeBorns.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.id === v.id) === i);
      setActiveIssues(uniqueBorns);

    } catch (err: any) {
      if (err?.message && (err.message.includes("সেশন") || err.message.includes("মেয়াদ") || err.message.includes("অননুমোদিত"))) {
        console.log("ডাটা সিঙ্কিং বিলম্বে করা হবে: সেশন নেই বা শেষ হয়েছে।");
      } else {
        console.warn("ডাটা সিঙ্কিং এরর হয়েছে", err);
      }
    }
  };

  const handleRefreshStats = () => {
    loadCoreData();
    setTriggerLogs(prev => prev + 1);
  };

  // --- 3. LOG IN SUBMISSIONS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    if (!loginUser || !loginPass) {
      setLoginErr("ইউজারনেম ও পাসওয়ার্ড দুটোই সরবরাহ করুন!");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await apiClient.post("/auth/login", {
        username: loginUser.trim(),
        password: loginPass,
      });

      localStorage.setItem("okkhor_pathagar_token", res.token);
      setIsAuthenticated(true);
      setUsername(res.username);
      loadCoreData();
      setLoginUser("");
      setLoginPass("");
    } catch (err: any) {
      setLoginErr(err.message || "লগইন ব্যর্থ হয়েছে! ক্লামসি ক্রেডেনশিয়ালস।");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- 4. SIGN OUT ACTION ---
  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch (err) {}
    localStorage.removeItem("okkhor_pathagar_token");
    setIsAuthenticated(false);
    setUsername("");
  };

  // --- 5. LOGO UPLODER IMAGE SIMULATOR ---
  // Background Auto Crop, margins white space removal simulator
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLogoLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        // Create an offline Canvas viewport to auto-crop whitespace and margins
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setLogoBase64(event.target?.result as string);
          setIsLogoLoading(false);
          return;
        }

        // Draw image first
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imgData.data;

        // Find bounding box coordinates of non-white non-alpha pixels
        let minX = img.width, maxX = 0, minY = img.height, maxY = 0;
        let found = false;

        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const index = (y * img.width + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const a = pixels[index + 3];

            // If pixel is not transparent, and not pure white (with some tolerance)
            const isWhite = r > 245 && g > 245 && b > 245;
            const isTransparent = a < 20;

            if (!isWhite && !isTransparent) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              found = true;
            }
          }
        }

        // Clip margins and crop bounding box
        if (found) {
          const cropWidth = maxX - minX + 1;
          const cropHeight = maxY - minY + 1;
          
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropWidth;
          cropCanvas.height = cropHeight;
          const cropCtx = cropCanvas.getContext("2d");
          
          if (cropCtx) {
            cropCtx.drawImage(img, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            setLogoBase64(cropCanvas.toDataURL());
          } else {
            setLogoBase64(event.target?.result as string);
          }
        } else {
          setLogoBase64(event.target?.result as string);
        }
        setIsLogoLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  // --- 6. ZIP ARCHIVE EXPORT (BULK DOWNLOAD) ---
  const handleBulkZipDownload = async () => {
    try {
      // Fetch full backup collections from backend
      const rawData = await apiClient.get("/bulk-raw");
      
      const zip = new JSZip();

      // Convert Books to Tab separated Spreadsheet CSV
      const booksHeaders = ["ID", "BookCode", "BookName", "Author", "Publisher", "Status"];
      const booksRows = rawData.books.map((b: any) => [b.id, b.code, b.name, b.author, b.publisher, b.status]);
      const booksCSV = "\ufeff" + [booksHeaders.join("\t"), ...booksRows.map((r: any) => r.join("\t"))].join("\n");
      zip.file("1_Akkhor_Books_Database.xls", booksCSV); // Saves as .xls so excel opens perfectly UTF-8

      // Convert Members to Spreadsheet CSV
      const membersHeaders = ["FormNumber", "MemberName", "Mobile", "Address"];
      const membersRows = rawData.members.map((m: any) => [m.formNumber, m.name, m.mobile, m.address]);
      const membersCSV = "\ufeff" + [membersHeaders.join("\t"), ...membersRows.map((r: any) => r.join("\t"))].join("\n");
      zip.file("2_Akkhor_Members_List.xls", membersCSV);

      // Convert Transactions to Spreadsheet CSV
      const issueHeaders = ["ID", "BookCode", "BookName", "MemberName", "Mobile", "Address", "IssueDate", "ReturnDate", "Status"];
      const issueRows = rawData.issues.map((i: any) => [i.id, i.bookCode, i.bookName, i.memberName, i.mobile, i.address, i.issueDate, i.returnDate, i.status]);
      const issueCSV = "\ufeff" + [issueHeaders.join("\t"), ...issueRows.map((r: any) => r.join("\t"))].join("\n");
      zip.file("3_Akkhor_Transactions_Registry.xls", issueCSV);

      // Convert History logs to CSV
      const logsHeaders = ["ID", "Timestamp", "Action", "Details"];
      const logsRows = rawData.auditLogs.map((l: any) => [l.id, l.timestamp, l.action, l.details]);
      const logsCSV = "\ufeff" + [logsHeaders.join("\t"), ...logsRows.map((r: any) => r.join("\t"))].join("\n");
      zip.file("4_Akkhor_Audit_Trail_History.xls", logsCSV);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `Okkhor_Pathagar_Bulk_Database_Backup_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("ব্যাকআপ জিপ ফাইল ডাউনলোড করা সম্ভব হয়নি।");
    }
  };

  // --- 7. SHARED ACTION PREVIEW POPUP DISPATCHERS ---
  const dispatchBookPreview = (book: Book) => {
    setPreviewTitle(`বইপত্র স্লিপ - ${book.name}`);
    setPreviewDataType("book");
    setPreviewData(book);
    setIsPreviewOpen(true);
  };

  const dispatchMemberPreview = (profileData: any) => {
    setPreviewTitle(`সদস্য বিবরণ স্লিপ - ${profileData.member.name}`);
    setPreviewDataType("member");
    setPreviewData(profileData);
    setIsPreviewOpen(true);
  };

  const dispatchTransactionPreview = (issueRecord: any) => {
    setPreviewTitle(`ধারকৃত বই স্লিপ - ${issueRecord.id}`);
    setPreviewDataType("transaction");
    setPreviewData(issueRecord);
    setIsPreviewOpen(true);
  };

  const dispatchWishlistPreview = (wishItem: WishlistItem) => {
    setPreviewTitle(`ইচ্ছাতালিকা স্লিপ - ${wishItem.name}`);
    setPreviewDataType("wishlist");
    setPreviewData(wishItem);
    setIsPreviewOpen(true);
  };

  const dispatchNotePreview = (note: Note) => {
    setPreviewTitle(`নোটপ্যাড স্লিপ - ${note.title}`);
    setPreviewDataType("note");
    setPreviewData(note);
    setIsPreviewOpen(true);
  };

  const dispatchSingleLogPreview = (log: AuditLog) => {
    setPreviewTitle(`একক পরিবর্তন অডিট স্লিপ - #${log.id}`);
    setPreviewDataType("general");
    setPreviewData({
      "লেনদেন আইডি/লগ আইডি": log.id,
      "পরিবর্তনের অ্যাকশন": log.action,
      "তারিখ ও সময় (সেকেন্ড সহ)": log.timestamp,
      "অ্যাকশন সম্পর্কিত সবিশেষ তথ্য": log.details,
    });
    setIsPreviewOpen(true);
  };

  const dispatchBulkHistoryPreview = (filteredLogs: AuditLog[]) => {
    setPreviewTitle("অডিট ট্রেইল পরিবর্তন প্রতিবেদন");
    setPreviewDataType("history_list");
    setPreviewData(filteredLogs);
    setIsPreviewOpen(true);
  };

  const dispatchBooksListPreview = (booksList: Book[]) => {
    setPreviewTitle("লাইব্রেরির সর্বমোট বই ক্যাটালগ");
    setPreviewDataType("books_list");
    setPreviewData(booksList);
    setIsPreviewOpen(true);
  };

  const dispatchMembersListPreview = (membersList: any[]) => {
    setPreviewTitle("নিবন্ধিত লাইব্রেরি সদস্য তালিকা");
    setPreviewDataType("members_list");
    setPreviewData(membersList);
    setIsPreviewOpen(true);
  };

  // --- 8. SUBMISSIONS PROXIES TO REFRESH LOCAL STATES ---
  const handleAddBookProxy = async (bookData: Partial<Book>) => {
    const res = await apiClient.post("/books", bookData);
    handleRefreshStats();
    return res;
  };

  const handleEditBookProxy = async (id: string, bookData: Partial<Book>) => {
    const res = await apiClient.put(`/books/${id}`, bookData);
    handleRefreshStats();
    return res;
  };

  const handleDeleteBookProxy = async (id: string) => {
    const res = await apiClient.delete(`/books/${id}`);
    handleRefreshStats();
    return res;
  };

  const handleBulkImportProxy = async (booksList: any[]) => {
    const res = await apiClient.post("/books/bulk-import", { booksList });
    handleRefreshStats();
    return res;
  };

  const handleIssueBookProxy = async (payload: any) => {
    const res = await apiClient.post("/issues", payload);
    handleRefreshStats();
    return res;
  };

  const handleReturnBookProxy = async (payload: any) => {
    const res = await apiClient.post("/issues/return", payload);
    handleRefreshStats();
    return res;
  };

  const handleChangeTimeProxy = async (payload: any) => {
    const res = await apiClient.post("/issues/time-change", payload);
    handleRefreshStats();
    return res;
  };

  const handleInstantSmsCheck = async () => {
    try {
      const res = await apiClient.post("/sms/trigger", {});
      alert(res.message || "তাত্ক্ষণিক SMS শিডিউলার স্লট সম্পূর্ণ চেক করা হয়েছে!");
      handleRefreshStats();
    } catch (err: any) {
      alert("সময় চেক করতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // Nav tab buttons mapping
  const navTabs = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { id: "books", label: "বই ক্যাটালগ", icon: BookMarked },
    { id: "search-smart", label: "স্মার্ট অনুসন্ধান", icon: SearchCode },
    { id: "issue", label: "ইস্যু ও রিটার্ন", icon: ArrowUpDown },
    { id: "members", label: "সদস্য তালিকা", icon: Users2 },
    { id: "wishlist", label: "উইশলিস্ট", icon: Heart },
    { id: "notes", label: "নোট ও প্যাড", icon: FileEdit },
    { id: "history", label: "অডিট লগ ইতিহাস", icon: History },
    { id: "sms", label: "রিমাইন্ডার ও এসএমএস", icon: MailWarning },
    { id: "settings", label: "সেটিংস", icon: Sliders }
  ];

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
        
        {/* Glow ambient backdrops */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative z-10 text-center space-y-6">
          
          {/* Logo brand */}
          <div className="flex flex-col items-center gap-1.5 pt-2">
            {logoBase64 ? (
              <div className="w-16 h-16 rounded-2xl bg-white border border-purple-500/30 overflow-hidden shadow-xl flex items-center justify-center p-1">
                <img src={logoBase64} alt="Library Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow-xl shadow-purple-600/15 flex items-center justify-center text-white text-3xl font-black border border-white/10">
                অ
              </div>
            )}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mt-3 font-sans">
              অক্ষর পাঠাগার
            </h1>
            <p className="text-xs text-slate-400">একাউন্ট সেশন সুরক্ষিত করুন</p>
          </div>

          {/* Validation report alert */}
          {loginErr && (
            <div className="bg-red-950/45 border border-red-500/25 p-3 rounded-xl text-xs text-red-400 flex items-center justify-center gap-2 animate-pulse">
              <span>{loginErr}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 ml-1">ইউজারনেম (Username)</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="okkhor"
                className="w-full px-4 py-3 bg-[#05070f]/45 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/20 text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 ml-1">পাসওয়ার্ড (Password)</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#05070f]/45 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/20 text-xs sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-750 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl shadow-purple-600/10 hover:shadow-cyan-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={15} />}
              লগইন করুন
            </button>
          </form>

          <p className="text-[10px] text-slate-500">
            অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে ডিফল্ট ইউজারনেম ও পাসওয়ার্ড দিয়ে সাবমিট দিন।
          </p>

        </div>
      </div>
    );
  }

  // MASTER AUTHENTICATED PANEL
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white relative">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/[0.02] backdrop-blur-md border-b border-white/10 px-4 py-3 md:px-6 flex items-center justify-between">
        
        {/* Brand logotypes and logo uploader */}
        <div className="flex items-center gap-3">
          
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Glowing dynamic circular logo banner with uploader helper */}
          <div className="relative group cursor-pointer" title="নতুন লোগো পরিবর্তন করুন (Auto Background Crop)">
            <label htmlFor="logo-uploader-input" className="cursor-pointer block relative">
              {isLogoLoading ? (
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-500/20 flex items-center justify-center">
                  <RefreshCw size={14} className="animate-spin text-purple-400" />
                </div>
              ) : logoBase64 ? (
                <div className="w-10 h-10 rounded-xl bg-white border border-purple-500/30 overflow-hidden shadow flex items-center justify-center p-0.5">
                  <img src={logoBase64} alt="Library Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 shadow flex items-center justify-center text-white text-xl font-bold border border-white/10">
                  অ
                </div>
              )}
              {/* Overlaid edit camera icon */}
              <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-950 text-[8px] text-cyan-400 rounded-full border border-purple-500/30 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                +
              </div>
            </label>
            <input
              type="file"
              id="logo-uploader-input"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-1.5 font-sans">
              অক্ষর পাঠাগার
            </h1>
            <p className="text-[10px] text-slate-400 font-sans tracking-wide">স্মার্ট লাইব্রেরি সিস্টেম</p>
          </div>

        </div>
        
        {/* User context profile and actions */}
        <div className="flex items-center gap-3">
          
          {/* Unified ZIP backup download indicator */}
          <button
            onClick={handleBulkZipDownload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0e1428]/80 text-[10px] sm:text-xs font-bold text-cyan-400 border border-cyan-500/20 hover:border-cyan-400/40 rounded-lg shadow cursor-pointer transition-colors"
            title="সব ডেটাবেজ এক্সপোর্ট করুন (ZIP ব্যাকআপ)"
          >
            <FileArchive size={14} />
            ZIP ক্যাটালগ ব্যাকআপ
          </button>

          {/* User profile identifier badge */}
          <div className="bg-slate-900/60 border border-purple-500/10 p-1 px-3 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-300">অ্যাডমিন ডিরেক্টর ({username})</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-red-950/20 text-red-400 hover:text-red-300 border border-red-500/10 hover:border-red-500/20 rounded-lg cursor-pointer transition-colors"
            title="নিরাপদে একাউন্ট লগআউট করুন"
          >
            <LogOut size={14} />
          </button>
        </div>

      </header>

      {/* 2. Main Sidebar & Canvas Container Layout */}
      <div className="flex flex-1 relative min-h-[calc(100vh-65px)]">
        
        {/* Desk Nav Sidebar Drawer */}
        <aside className="hidden md:block w-64 bg-[#080c16]/55 border-r border-purple-500/10 p-4 shrink-0 space-y-6">
          <div className="space-y-1 pt-2">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "bg-gradient-to-r from-purple-900/40 to-indigo-950/40 text-purple-300 font-bold border border-purple-500/20 shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom credit logs info */}
          <div className="pt-6 border-t border-purple-500/5 text-[10px] text-slate-500 space-y-2">
            <p>● হেল্পলাইন: 01333474848</p>
            <p className="font-mono">সেশন: srv-run-2026</p>
          </div>
        </aside>

        {/* Mobile floating responsive drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm pr-16 animate-in slide-in-from-left-4 duration-150">
            <div className="w-full max-w-xs h-full bg-[#080c16] border-r border-purple-500/20 p-5 space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
                <p className="font-bold text-white text-xs uppercase tracking-wider">মেনু নেভিগেশন</p>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {navTabs.map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "bg-purple-950/40 text-purple-300 font-bold border border-purple-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Backup Link */}
              <div className="pt-4 border-t border-purple-500/5">
                <button
                  onClick={() => {
                    handleBulkZipDownload();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-950/40 hover:bg-cyan-950 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/20"
                >
                  <FileArchive size={14} />
                  ZIP ক্যাটালগ ব্যাকআপ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Pages Container Canvas */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-150">
            
            {activeTab === "dashboard" && (
              <Dashboard
                data={dashboardData}
                onRefresh={handleRefreshStats}
                onNavigate={(tab) => setActiveTab(tab)}
                onPostSmsCheck={handleInstantSmsCheck}
              />
            )}

            {activeTab === "books" && (
              <BookManager
                books={books}
                onAddBook={handleAddBookProxy}
                onEditBook={handleEditBookProxy}
                onDeleteBook={handleDeleteBookProxy}
                onBulkImport={handleBulkImportProxy}
                onPreview={dispatchBookPreview}
                onPreviewBooksList={dispatchBooksListPreview}
              />
            )}

            {activeTab === "search-smart" && (
              <SmartSearch onPreviewTransaction={dispatchTransactionPreview} />
            )}

            {activeTab === "issue" && (
              <IssueReturn
                onIssueBook={handleIssueBookProxy}
                onReturnBook={handleReturnBookProxy}
                onChangeTime={handleChangeTimeProxy}
                activeIssues={activeIssues}
                onRefreshAll={handleRefreshStats}
              />
            )}

            {activeTab === "members" && (
              <MemberManager
                onRefreshStats={handleRefreshStats}
                onPreviewMemberSlip={dispatchMemberPreview}
                onPreviewMembersList={dispatchMembersListPreview}
              />
            )}

            {activeTab === "wishlist" && (
              <Wishlist
                onPreviewWishlist={dispatchWishlistPreview}
                onRefreshStats={handleRefreshStats}
              />
            )}

            {activeTab === "notes" && (
              <Notepad onPreviewNote={dispatchNotePreview} />
            )}

            {activeTab === "history" && (
              <AuditLogView
                onPreviewSingleLog={dispatchSingleLogPreview}
                onPreviewBulkHistory={dispatchBulkHistoryPreview}
                logsTrigger={triggerLogs}
              />
            )}

            {activeTab === "sms" && (
              <SmsAlerts onRefreshStats={handleRefreshStats} />
            )}

            {activeTab === "settings" && <Settings />}

          </div>
        </main>

      </div>

      {/* 4. SHARED EYE PREVIEW TEMPLATE MODAL */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewTitle}
        dataType={previewDataType}
        data={previewData}
      />

    </div>
  );
}
