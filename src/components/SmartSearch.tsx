import React, { useState } from "react";
import { Search, MapPin, Phone, Calendar, Clock, MessageSquare, Eye, RefreshCw, Smartphone } from "lucide-react";
import { apiClient } from "../api";

interface SmartSearchResult {
  book: {
    id: string;
    code: string;
    name: string;
    author: string;
    publisher: string;
    imageUrl: string;
    status: "Available" | "Issued";
  };
  activeIssue: {
    id: string;
    bookCode: string;
    bookName: string;
    memberName: string;
    formNumber: string;
    mobile: string;
    address: string;
    issueDate: string;
    returnDate: string;
    status: "Issued" | "Returned";
    extensionHistory: Array<{ date: string; action: string; payload: string }>;
    comments: string[];
  } | null;
  history: any[];
}

interface SmartSearchProps {
  onPreviewTransaction: (record: any) => void;
}

export default function SmartSearch({ onPreviewTransaction }: SmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setHasSearched(true);
    try {
      const res = await apiClient.get(`/books/search-smart?q=${encodeURIComponent(searchTerm.trim())}`);
      setResults(res);
    } catch (err: any) {
      setErrorMsg(err.message || "সার্চ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">৩. স্মার্ট বই ট্র্যাকিং ও বিস্তারিত অনুসন্ধান</h2>
        <p className="text-xs text-slate-400">বইয়ের নাম, বই কোড, নির্দিষ্ট লেখক বা প্রকাশনী দিয়ে সার্চ করলেই পাবেন বইটির বর্তমান অবস্থান ও গ্রাহক বিবরণী</p>
      </div>

      {/* Target Search Box Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="বইয়ের নাম, বইয়ের কোড (যেমন: BOK-103) বা লেখকের নাম লিখে এন্টার চাপুন..."
            className="w-full text-xs pl-11 pr-4 py-3 bg-slate-950 rounded-xl border border-purple-500/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/10 cursor-pointer flex items-center gap-1 shrink-0 transition-opacity"
        >
          {loading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          অনুসন্ধান
        </button>
      </form>

      {/* Error report */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 text-red-400 border border-red-500/20 rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-cyan-400 mb-3" size={24} />
          <p className="text-xs text-slate-400">ডাটাবেইজ অনুসন্ধান করা হচ্ছে...</p>
        </div>
      )}

      {/* Output list section */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="glass-panel p-12 text-center rounded-2xl">
          <p className="text-slate-400 text-sm">দুঃখিত, ওই তথ্য সম্পর্কিত কোনো নিবন্ধিত বই পাওয়া যায়নি। আবার ট্রাই করুন।</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">মোট {results.length} টি সম্ভাব্য মিল পাওয়া গেছে:</p>

          <div className="space-y-4">
            {results.map((item) => {
              const { book, activeIssue } = item;
              return (
                <div
                  key={book.id}
                  className="glass-panel p-5 rounded-2xl border border-purple-500/15 flex flex-col md:flex-row gap-6 relative overflow-hidden"
                >
                  {/* Left Side: Cover, Title */}
                  <div className="w-full md:w-36 flex flex-col items-center gap-2 shrink-0">
                    <div className="w-full h-44 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-lg">
                      <img 
                        src={book.imageUrl && book.imageUrl.trim() ? book.imageUrl : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"} 
                        alt={book.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-purple-400 bg-purple-900/40 px-2.5 py-0.5 rounded border border-purple-500/10">
                      {book.code}
                    </span>
                  </div>

                  {/* Right Side: details and conditions */}
                  <div className="flex-1 space-y-4">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/10 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{book.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">লেখক: {book.author} | প্রকাশনী: {book.publisher}</p>
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${book.status === "Available" ? "bg-emerald-950 text-emerald-300 border border-emerald-500/20" : "bg-red-950 text-red-300 border border-red-500/20"}`}>
                          {book.status === "Available" ? "Available" : "Issued"}
                        </span>
                      </div>
                    </div>

                    {/* Rent Status Information Panel */}
                    {book.status === "Available" ? (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/10 flex items-center gap-3 text-slate-300 text-xs">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p>বইটি বর্তমানে লাইব্রেরিতে সংরক্ষণে রয়েছে। কোনো প্রকার বুকিং বা হোল্ড ছাড়া এই মুহূর্তে সরাসরি মেম্বারকে ইস্যু করা যাবে।</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeIssue ? (
                          <div className="bg-slate-900/60 rounded-xl p-4 border border-purple-500/15 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                              
                              {/* Borrower Profile */}
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">গ্রাহক সদস্য:</p>
                                <p className="font-bold text-white text-sm">{activeIssue.memberName}</p>
                                <p className="text-[10px] text-slate-400">ফরম আইডি: <strong className="font-mono text-purple-300">#{activeIssue.formNumber}</strong></p>
                              </div>

                              {/* Contacts */}
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">যোগাযোগের সূত্র:</p>
                                <p className="flex items-center gap-1.5 font-mono text-slate-200">
                                  <Phone size={12} className="text-cyan-400" />
                                  {activeIssue.mobile}
                                </p>
                                <p className="flex items-center gap-1.5 text-slate-400">
                                  <MapPin size={12} className="text-purple-400 shrink-0" />
                                  <span className="truncate">{activeIssue.address}</span>
                                </p>
                              </div>

                              {/* Dates row */}
                              <div className="space-y-1 md:col-span-2 border-t border-purple-500/5 pt-2 mt-1 grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">ইস্যু করার তারিখ:</p>
                                  <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 font-mono">
                                    <Calendar size={13} />
                                    {activeIssue.issueDate}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">রিটার্ন প্রদানের ডেটলাইন:</p>
                                  <p className="flex items-center gap-1.5 text-sm font-bold text-red-400 font-mono animate-pulse">
                                    <Clock size={13} />
                                    {activeIssue.returnDate}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Extension History tracking log */}
                            {activeIssue.extensionHistory && activeIssue.extensionHistory.length > 0 && (
                              <div className="border-t border-purple-500/5 pt-2 text-xs">
                                <p className="text-purple-300 font-semibold text-[10px] uppercase mb-1">সময় পরিবর্তন ইতিহাস (Time Extensions):</p>
                                <div className="space-y-1 max-h-20 overflow-y-auto">
                                  {activeIssue.extensionHistory.map((ext, idx) => (
                                    <p key={idx} className="text-[10px] text-slate-400">
                                      ● <b className="font-mono">{ext.date}</b> এ {ext.payload}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Comments tracking */}
                            {activeIssue.comments && activeIssue.comments.length > 0 && (
                              <div className="border-t border-purple-500/5 pt-2 text-xs">
                                <p className="text-cyan-400 font-semibold text-[10px] uppercase mb-1">অ্যাডমিন নোট / ক্ষতি বিবরণ:</p>
                                <div className="space-y-0.5 text-[10px] text-slate-300">
                                  {activeIssue.comments.map((comment, idx) => (
                                    <p key={idx} className="flex items-start gap-1">
                                      <MessageSquare size={10} className="mt-0.5 shrink-0 text-slate-500" />
                                      <span>{comment}</span>
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Slips downloads buttons */}
                            <div className="border-t border-purple-500/5 pt-2.5 flex justify-end gap-2">
                              <button
                                onClick={() => onPreviewTransaction(activeIssue)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow shadow-purple-900/30"
                              >
                                <Eye size={12} />
                                স্লিপ চোখের প্রাকদর্শন ও PDF
                              </button>
                            </div>

                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/10 text-xs text-orange-300">
                            বইটি সুনির্দিষ্ট হিসাব অনুযায়ী ধার করা দেখায় কিন্তু কোনো সঠিক ইস্যু ফাইল খুঁজে পাওয়া যায়নি।
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
