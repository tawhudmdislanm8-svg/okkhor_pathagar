import React, { useState } from "react";
import { Plus, Search, Trash2, Edit3, Image, Download, FilePlus2, Eye, FileText, Check, AlertCircle, RefreshCw, Database } from "lucide-react";
import { Book } from "../types";
import { apiClient } from "../api";

interface BookManagerProps {
  books: Book[];
  onAddBook: (bookData: Partial<Book>) => Promise<any>;
  onEditBook: (id: string, bookData: Partial<Book>) => Promise<any>;
  onDeleteBook: (id: string) => Promise<any>;
  onBulkImport: (booksList: any[]) => Promise<any>;
  onPreview: (book: Book) => void;
  onPreviewBooksList?: (books: Book[]) => void;
}

export default function BookManager({ books, onAddBook, onEditBook, onDeleteBook, onBulkImport, onPreview, onPreviewBooksList }: BookManagerProps) {
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  
  // Modals status
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Form states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookCode, setBookCode] = useState("");
  const [bookName, setBookName] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookPublisher, setBookPublisher] = useState("");
  const [bookImageUrl, setBookImageUrl] = useState("");

  // Bulk raw input
  const [bulkInput, setBulkInput] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState("");

  const [formErr, setFormErr] = useState("");
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteConfirmError, setDeleteConfirmError] = useState("");

  // Filter books matching search
  const filteredBooks = books.filter(b => {
    const matchesQ =
      b.code.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.author.toLowerCase().includes(searchVal.toLowerCase()) ||
      b.publisher.toLowerCase().includes(searchVal.toLowerCase());
    const matchesStatus = statusFilter ? b.status === statusFilter : true;
    return matchesQ && matchesStatus;
  });

  // Open Edit Dialog
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("অনুগ্রহ করে একটি ছবি ফাইল সিলেক্ট করুন।");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBookImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (book: Book) => {
    setSelectedBook(book);
    setBookCode(book.code);
    setBookName(book.name);
    setBookAuthor(book.author);
    setBookPublisher(book.publisher);
    setBookImageUrl(book.imageUrl);
    setIsEditOpen(true);
    setFormErr("");
  };

  // Handle Add Form Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookCode || !bookName || !bookAuthor || !bookPublisher) {
      setFormErr("বই কোড, নাম, লেখক এবং প্রকাশনার নাম আবশ্যক!");
      return;
    }
    try {
      await onAddBook({
        code: bookCode.toUpperCase().trim(),
        name: bookName.trim(),
        author: bookAuthor.trim(),
        publisher: bookPublisher.trim(),
        imageUrl: bookImageUrl.trim() || undefined,
      });
      // Reset form
      setBookCode("");
      setBookName("");
      setBookAuthor("");
      setBookPublisher("");
      setBookImageUrl("");
      setIsAddOpen(false);
      setFormErr("");
    } catch (err: any) {
      setFormErr(err.message || "সংরক্ষণ ব্যর্থ হয়েছে। কুয়েরি চেক করুন।");
    }
  };

  // Handle Edit Form Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (!bookCode || !bookName || !bookAuthor || !bookPublisher) {
      setFormErr("সব তথ্য পূরণ করুন!");
      return;
    }
    try {
      await onEditBook(selectedBook.id, {
        code: bookCode.toUpperCase().trim(),
        name: bookName.trim(),
        author: bookAuthor.trim(),
        publisher: bookPublisher.trim(),
        imageUrl: bookImageUrl.trim(),
      });
      setIsEditOpen(false);
      setSelectedBook(null);
      setFormErr("");
    } catch (err: any) {
      setFormErr(err.message || "সংরক্ষণ ব্যর্থ হয়েছে। কুয়েরি চেক করুন।");
    }
  };

  // Parse bulk text block copy-paste helper
  const handleBulkSubmit = async () => {
    setBulkError("");
    setBulkSuccessMsg("");
    if (!bulkInput.trim()) {
      setBulkError("অনুগ্রহ করে বইয়ের ডাটা ইনপুট বক্সে পেস্ট করুন।");
      return;
    }

    // Parse logic: Supports CSV (comma separated) or Tab Separated formats
    // Format expected: BookCode, BookName, Author, Publisher, ImageUrl (optional)
    const lines = bulkInput.split("\n");
    const parsedList: any[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      // Attempt split by tab first, then comma
      let cols = line.split("\t");
      if (cols.length < 3) {
        cols = line.split(",");
      }

      const code = cols[0]?.trim();
      const name = cols[1]?.trim();
      const author = cols[2]?.trim();
      const publisher = cols[3]?.trim() || "অজ্ঞাত প্রকাশনা";
      const imageUrl = cols[4]?.trim() || "";

      if (code && name && author) {
        parsedList.push({ code, name, author, publisher, imageUrl });
      }
    });

    if (parsedList.length === 0) {
      setBulkError("কোনো সঠিক ডাটা রো উদ্ধার করা যায়নি। ফর্ম্যাট চেক করুন: BookCode, BookName, Author, Publisher");
      return;
    }

    try {
      const res = await onBulkImport(parsedList);
      setBulkSuccessMsg(`অভিনন্দন! মোট ${res.importedCount} টি বই সফলভাবে ইম্পোর্ট করা হয়েছে। ডুপ্লিকেট বাতিল হয়েছে: ${res.duplicatesCount} টি।`);
      setBulkInput("");
    } catch (err: any) {
      setBulkError(err.message || "ইম্পোর্ট ব্যর্থ হয়েছে।");
    }
  };

  // Export current list to CSV
  const handleExportCSV = () => {
    if (books.length === 0) return;
    const headers = ["BookCode", "BookName", "Author", "Publisher", "Status"];
    const rows = books.map(b => [b.code, b.name, b.author, b.publisher, b.status]);
    
    // Prepare string
    const csvContent = "data:text/csv;charset=utf-8,\ufeff" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Akkhor_Library_Books_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFromSheets = async () => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      const res = await apiClient.post("/settings/googlesheets/import-all", {});
      setImportStatus({
        type: "success",
        msg: res.message || "গুগল শিট থেকে সর্বমোট তথ্য সফলভাবে ইম্পোর্ট করা হয়েছে!"
      });
      window.dispatchEvent(new Event("data-imported"));
      setTimeout(() => setImportStatus(null), 8000); // clear after 8s
    } catch (err: any) {
      setImportStatus({
        type: "error",
        msg: err.message || "গুগল শিট থেকে ডাটা ইম্পোর্ট করা সম্ভব হয়নি। দয়া করে সেটিংস পরীক্ষা করুন।"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">

      {importStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 shadow-lg ${importStatus.type === "success" ? "bg-emerald-950/60 border border-emerald-500/35 text-emerald-300 animate-pulse" : "bg-red-950/60 border border-red-500/35 text-red-300"}`}>
          {importStatus.type === "success" ? <Check size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-red-400 shrink-0" />}
          <span className="font-semibold">{importStatus.msg}</span>
        </div>
      )}

      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">বইয়ের রেজিস্ট্রি ও ব্যবস্থাপনা</h2>
          <p className="text-xs text-slate-400">লাইব্রেরির বই যুক্ত করুন, তথ্য সংশোধন করুন এবং স্ট্যাটাস পরিবর্তন পরিচালনা করুন</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setBulkInput("");
              setBulkError("");
              setBulkSuccessMsg("");
              setIsBulkOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-indigo-900/40 text-indigo-300 ring-1 ring-indigo-500/20 text-xs font-semibold rounded-lg hover:bg-indigo-950/40 transition-colors cursor-pointer"
          >
            <FilePlus2 size={14} />
            বাল্ক ইম্পোর্ট
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Csv এক্সপোর্ট
          </button>
          <button
            onClick={() => onPreviewBooksList && onPreviewBooksList(books)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-purple-900/40 text-purple-200 ring-1 ring-purple-500/25 text-xs font-bold rounded-lg hover:bg-purple-850/40 transition-colors cursor-pointer"
          >
            <FileText size={14} className="text-purple-400" />
            PDF প্রিন্ট
          </button>
          <button
            type="button"
            onClick={handleImportFromSheets}
            disabled={isImporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-950/50 hover:bg-cyan-900/40 text-cyan-200 ring-1 ring-cyan-500/30 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="গুগল শিট থেকে সমস্ত বর্তমান বই এবং সদস্যদের ডেটা ইম্পোর্ট/সিঙ্ক করবে।"
          >
            {isImporting ? (
              <RefreshCw size={14} className="text-cyan-400 animate-spin" />
            ) : (
              <Database size={14} className="text-cyan-400" />
            )}
            গুগল শিট থেকে লোড (Pull)
          </button>
          <button
            onClick={() => {
              setBookCode("");
              setBookName("");
              setBookAuthor("");
              setBookPublisher("");
              setBookImageUrl("");
              setFormErr("");
              setIsAddOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer shadow-md shadow-purple-600/10"
          >
            <Plus size={14} />
            নতুন বই যোগ
          </button>
        </div>
      </div>

      {/* Filter Options bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-purple-500/10">
        <div className="relative col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="কোড, নাম, লেখক বা প্রকাশক দিয়ে খুঁজুন..."
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 rounded-lg border border-purple-500/15 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-950 rounded-lg border border-purple-500/15 text-white focus:outline-none focus:border-cyan-400/60"
          >
            <option value="">সকল স্ট্যাটাস (Available & Issued)</option>
            <option value="Available">Available (তাত্ক্ষণিক লেনদেন যোগ্য)</option>
            <option value="Issued">Issued (বর্তমানে ধারকৃত)</option>
          </select>
        </div>
      </div>

      {/* Books Table Cards Layout */}
      {filteredBooks.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl">
          <p className="text-slate-400 text-sm">কোনো বই খুঁজে পাওয়া যায়নি। উপরের ইনপুট চেক করুন বা নতুন বই যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="glass-panel-cyan p-4 rounded-2xl border border-cyan-500/10 flex gap-4 hover:border-purple-500/30 duration-200 hover:-translate-y-0.5"
            >
              <div className="w-20 h-28 rounded bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shrink-0">
                <img 
                  src={book.imageUrl && book.imageUrl.trim() ? book.imageUrl : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"} 
                  alt={book.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-purple-900/40 text-purple-300 ring-1 ring-purple-500/20 uppercase tracking-wider truncate mb-1">
                      {book.code}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${book.status === "Available" ? "bg-emerald-950 text-emerald-300 ring-1 ring-emerald-500/20" : "bg-red-950 text-red-300 ring-1 ring-red-500/20"}`}>
                      {book.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-xs sm:text-sm truncate" title={book.name}>{book.name}</h3>
                  <p className="text-slate-400 text-xs truncate">{book.author}</p>
                  <p className="text-slate-500 text-[10px] truncate">প্রকাশক: {book.publisher}</p>
                </div>

                {/* Operations links and buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-purple-500/5 mt-2">
                  <button
                    onClick={() => onPreview(book)}
                    className="p-1.5 hover:bg-white/10 rounded text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors"
                    title="রিসিট স্লিপ এবং চোখের প্রাকদর্শন"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(book)}
                    className="p-1.5 hover:bg-white/10 rounded text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                    title="সংশোধন করুন"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmError("");
                      setBookToDelete(book);
                    }}
                    className="p-1.5 hover:bg-red-950/20 rounded text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD BOOK */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-purple-500/25 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-purple-400" />
              লাইব্রেরিতে নতুন বই এন্ট্রি
            </h3>
            
            {formErr && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">বই কোড / বারকোড *</label>
                <input
                  type="text"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value)}
                  placeholder="যেমন: BOK-106"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">বইয়ের নাম (বাংলা ইউনিকোড) *</label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="বইয়ের আকর্ষণীয় নাম লিখুন"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">লেখকের নাম *</label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="হুমায়ূন আহমেদ"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">প্রকাশনী প্রেস *</label>
                  <input
                    type="text"
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    placeholder="যেমনঃ অন্যপ্রকাশ"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">কভার ছবি</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="sm:col-span-1 h-28 bg-slate-950 rounded-xl overflow-hidden border border-purple-500/15 flex items-center justify-center relative group">
                    {bookImageUrl ? (
                      <>
                        <img src={bookImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBookImageUrl("")}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-bold transition-opacity cursor-pointer text-center"
                        >
                          মুছে ফেলুন
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-600">
                        <Image className="mx-auto mb-1 opacity-40" size={20} />
                        <span className="text-[9px]">ছবি নেই</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="sm:col-span-3 space-y-2">
                    <div className="relative border border-dashed border-purple-500/25 rounded-xl p-4 bg-slate-950/40 hover:bg-slate-950/70 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-0.5">
                        <p className="text-xs text-purple-400 font-bold group-hover:text-purple-300">
                          গ্যালারি থেকে ছবি আপলোড করুন
                        </p>
                        <p className="text-[10px] text-slate-500">মোবাইল ক্যামেরা বা গ্যালারি থেকে ছবি সিলেক্ট করুন</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">অথবা কভার ছবির URL পেস্ট করুন:</span>
                    </div>
                    
                    <input
                      type="url"
                      value={bookImageUrl.startsWith("data:") ? "" : bookImageUrl}
                      onChange={(e) => setBookImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/15 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-purple-700 hover:to-indigo-700 cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BOOK */}
      {isEditOpen && selectedBook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-cyan-500/25 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Edit3 size={18} className="text-cyan-400" />
              বইয়ের তথ্য সম্পাদন / সংশোধন
            </h3>
            
            {formErr && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">বই কোড (সংশোধন সম্ভব) *</label>
                <input
                  type="text"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">বইয়ের নাম *</label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">লেখক *</label>
                  <input
                    type="text"
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">প্রকাশনী *</label>
                  <input
                    type="text"
                    value={bookPublisher}
                    onChange={(e) => setBookPublisher(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">কভার ছবি</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                  <div className="sm:col-span-1 h-28 bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/15 flex items-center justify-center relative group">
                    {bookImageUrl ? (
                      <>
                        <img src={bookImageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBookImageUrl("")}
                          className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 text-xs font-bold transition-opacity cursor-pointer text-center"
                        >
                          মুছে ফেলুন
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-slate-600">
                        <Image className="mx-auto mb-1 opacity-40" size={20} />
                        <span className="text-[9px]">ছবি নেই</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="sm:col-span-3 space-y-2">
                    <div className="relative border border-dashed border-cyan-500/25 rounded-xl p-4 bg-slate-950/40 hover:bg-slate-950/70 transition-all text-center group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-0.5">
                        <p className="text-xs text-cyan-400 font-bold group-hover:text-cyan-300">
                          গ্যালারি থেকে নতুন ছবি আপলোড করুন
                        </p>
                        <p className="text-[10px] text-slate-500">মোবাইল ক্যামেরা বা গ্যালারি থেকে নতুন ছবি সিলেক্ট করুন</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider">অথবা কভার ছবির URL পেস্ট করুন:</span>
                    </div>
                    
                    <input
                      type="url"
                      value={bookImageUrl.startsWith("data:") ? "" : bookImageUrl}
                      onChange={(e) => setBookImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/15 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg text-xs font-bold hover:from-cyan-700 hover:to-teal-700 cursor-pointer"
                >
                  সংশোধন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK IMPORT */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-indigo-500/25 p-6 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 shrink-0">
              <FilePlus2 className="text-indigo-400" />
              বইয়ের ক্যাটালগ বাল্ক ইম্পোর্ট
            </h3>
            
            <p className="text-[11px] text-slate-400 mb-4 shrink-0">
              নিচে বক্সে নতুন বইয়ের তালিকা পেস্ট করুন। ফরম্যাট হতে হবে: <code className="text-cyan-400 font-mono text-[10px]">বই_কোড [Tab বা কমা] বই_নাম [Tab বা কমা] লেখকের_নাম [Tab বা কমা] প্রকাশনী_নাম</code>
              <br/>লাইন গ্যাপ দিয়ে একাধিক সারি পেস্ট করতে পারবেন (যেমন এক্সেল/সপ্রেডশিট থেকে কপি করে পেস্ট করুন)।
            </p>

            {bulkError && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2 shrink-0">
                <AlertCircle size={14} />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkSuccessMsg && (
              <div className="bg-emerald-950/55 border border-emerald-500/35 p-3 rounded-lg text-xs text-emerald-300 mb-3 flex items-center gap-2 shrink-0 animate-pulse">
                <Check size={14} />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="flex-1 overflow-auto py-2">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="BOK-201, দেবদাস, শরৎচন্দ্র চট্টোপাধ্যায়, দেব সাহিত্য কুটির&#10;BOK-202, নৌকাডুবি, রবীন্দ্রনাথ ঠাকুর, বেঙ্গল পাবলিশার্স"
                className="w-full h-64 p-3 bg-slate-950 border border-purple-500/20 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-purple-500/10 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-purple-700 hover:to-indigo-700 cursor-pointer"
              >
                ডাটা ইম্পোর্ট প্রসেস করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f1a] border border-red-500/30 p-6 rounded-2xl w-full max-w-md shadow-2xl shadow-red-950/20 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trash2 className="text-red-400 shrink-0" size={20} />
              বই মুছে ফেলার সতর্কতা!
            </h3>
            
            <div className="mt-2 text-slate-300 text-xs space-y-2">
              <p>আপনি কি নিশ্চিতভাবেই নিচের বইটি সিস্টেম থেকে মুছে ফেলতে চান?</p>
              <div className="p-3 bg-red-950/20 border border-red-500/15 rounded-lg space-y-1">
                <p><span className="text-slate-400">বইয়ের নাম:</span> <strong className="text-white text-sm">{bookToDelete.name}</strong></p>
                <p><span className="text-slate-400">বই কোড:</span> <span className="font-mono text-cyan-400 font-semibold">{bookToDelete.code}</span></p>
                <p><span className="text-slate-400">লেখক:</span> <span className="text-slate-200">{bookToDelete.author}</span></p>
              </div>
              <p className="text-[10px] text-amber-400 flex items-start gap-1.5 pt-1">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                সতর্কতা: এই অপারেশনটি সম্পাদন করার ফলে ডাটা চিরতরে হারিয়ে যেতে পারে এবং এটি আর ডিলিট বাতিল/পুনরুদ্ধার করা সম্ভব নয়।
              </p>
            </div>

            {deleteConfirmError && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mt-4 flex items-center gap-2 animate-pulse">
                <AlertCircle size={14} className="shrink-0" />
                <span>{deleteConfirmError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-5 mt-2 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => {
                  setBookToDelete(null);
                  setDeleteConfirmError("");
                }}
                className="px-4 py-2 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDeleteConfirmError("");
                    await onDeleteBook(bookToDelete.id);
                    setBookToDelete(null);
                  } catch (err: any) {
                    setDeleteConfirmError(err.message || "বইটি ডিলিট করা সম্ভব হয়নি।");
                  }
                }}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg text-xs font-bold hover:from-red-700 hover:to-rose-700 cursor-pointer shadow-md shadow-red-900/10 flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
