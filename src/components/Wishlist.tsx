import React, { useState, useEffect } from "react";
import { ListPlus, Trash2, Eye, Download, Search, AlertCircle, RefreshCw } from "lucide-react";
import { WishlistItem } from "../types";
import { apiClient } from "../api";

interface WishlistProps {
  onPreviewWishlist: (item: WishlistItem) => void;
  onRefreshStats: () => void;
}

export default function Wishlist({ onPreviewWishlist, onRefreshStats }: WishlistProps) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Adding item form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [wishName, setWishName] = useState("");
  const [wishAuthor, setWishAuthor] = useState("");
  const [wishPublisher, setWishPublisher] = useState("");

  const [formErr, setFormErr] = useState("");
  const [wishToDelete, setWishToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await apiClient.get("/wishlist");
      setWishlist(data);
    } catch (err: any) {
      setErrorMsg(err.message || "উইশলিস্ট ডাটা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleAddWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!wishName.trim()) {
      setFormErr("বইয়ের নাম দিতেই হবে!");
      return;
    }

    try {
      await apiClient.post("/wishlist", {
        name: wishName.trim(),
        author: wishAuthor.trim(),
        publisher: wishPublisher.trim(),
      });
      setWishName("");
      setWishAuthor("");
      setWishPublisher("");
      setIsAddOpen(false);
      fetchWishlist();
      onRefreshStats();
    } catch (err: any) {
      setFormErr(err.message || "সংরক্ষণ করা যায়নি।");
    }
  };

  const handleDeleteWish = async (id: string) => {
    try {
      await apiClient.delete(`/wishlist/${id}`);
      fetchWishlist();
      onRefreshStats();
    } catch (err: any) {
      alert(err.message || "ডিলিট করা যায়নি।");
    }
  };

  const filteredWish = wishlist.filter(item =>
    item.name.toLowerCase().includes(q.toLowerCase()) ||
    item.author.toLowerCase().includes(q.toLowerCase()) ||
    item.publisher.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">৫. বই উইশলিস্ট (Wishlist)</h2>
          <p className="text-xs text-slate-400">পাঠকদের চাহিদা বা কেনার জন্য প্রস্তাবিত বইয়ের তালিকা সংরক্ষণ করুন</p>
        </div>
        <button
          onClick={() => {
            setFormErr("");
            setIsAddOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ListPlus size={14} />
          ইচ্ছাতালিকায় বই যোগ করুন
        </button>
      </div>

      {/* Searching wishlist */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="উইশলিস্টে থাকা বই খুঁজুন..."
          className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-purple-500/15 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
        />
      </div>

      {/* Grid list container */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">উইশলিস্ট লোড হচ্ছে...</div>
      ) : filteredWish.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl">
          <p className="text-slate-400 text-sm">উইশলিস্টে কোনো বই সাজানো নেই। উপরের বাটন দিয়ে নতুন বই সাজান।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWish.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-4 rounded-xl border border-purple-500/10 flex flex-col justify-between hover:border-cyan-400/30 duration-200"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest uppercase bg-cyan-950 px-1.5 py-0.5 rounded">
                  WISHLIST ITEM
                </span>
                <h3 className="font-bold text-white text-sm sm:text-base pt-1">{item.name}</h3>
                <p className="text-slate-400 text-xs">লেখক: {item.author || "অজ্ঞাত"}</p>
                <p className="text-slate-500 text-[10px]">প্রকাশনা: {item.publisher || "অজ্ঞাত"}</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-purple-500/5 mt-3">
                <span className="text-[9px] font-mono text-slate-500">সংরক্ষিত: {item.createdAt.split(" ")[0]}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onPreviewWishlist(item)}
                    className="p-1.5 hover:bg-white/10 rounded text-cyan-400 cursor-pointer"
                    title="প্রাকদর্শন স্লিপ এবং PDF"
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => setWishToDelete(item)}
                    className="p-1.5 hover:bg-red-950/20 rounded text-red-400 cursor-pointer"
                    title="ডিলিট করুন"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG WISHLIST POPUP ADD */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-purple-500/25 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-120">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ListPlus size={18} className="text-purple-400" />
              উইশলিস্টে নতুন বই সংগ্রহ
            </h3>
            
            {formErr && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleAddWishSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">বইয়ের নাম *</label>
                <input
                  type="text"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="যেমন: পদ্মা নদীর মাঝি"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">লেখক (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={wishAuthor}
                  onChange={(e) => setWishAuthor(e.target.value)}
                  placeholder="মানিক বন্দ্যোপাধ্যায়"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">প্রকাশনা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={wishPublisher}
                  onChange={(e) => setWishPublisher(e.target.value)}
                  placeholder="যেমন: বেঙ্গল পাবলিশার্স"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
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
                  লিস্টে যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG WISHLIST POPUP CONFIRM DELETE */}
      {wishToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f1a] border border-red-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Trash2 className="text-red-400 shrink-0" size={16} />
              উইশলিস্ট আইটেম ডিলিট
            </h3>
            
            <p className="text-xs text-slate-300 mt-2">
              আপনি কি সত্যি উইশলিস্ট থেকে <strong className="text-white">'{wishToDelete.name}'</strong> বইটি ডিলিট করতে চান?
            </p>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-purple-500/5">
              <button
                type="button"
                onClick={() => setWishToDelete(null)}
                className="px-3 py-1.5 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-[11px] font-semibold cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await handleDeleteWish(wishToDelete.id);
                  } finally {
                    setWishToDelete(null);
                  }
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
