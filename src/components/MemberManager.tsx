import React, { useState, useEffect } from "react";
import { UserPlus, Search, Phone, MapPin, ClipboardList, BookOpen, Clock, CheckCircle2, Eye, RefreshCw, AlertCircle, Trash2, AlertTriangle, Database, Check } from "lucide-react";
import { Member } from "../types";
import { apiClient } from "../api";

interface MemberManagerProps {
  onRefreshStats: () => void;
  onPreviewMemberSlip: (profileData: any) => void;
  onPreviewMembersList?: (members: Member[]) => void;
}

export default function MemberManager({ onRefreshStats, onPreviewMemberSlip, onPreviewMembersList }: MemberManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Adding single Member states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addForm, setAddForm] = useState("");
  const [addMobile, setAddMobile] = useState("");
  const [addAddress, setAddAddress] = useState("");

  const [formErr, setFormErr] = useState("");

  // Active highlighted member profile details
  const [activeProfile, setActiveProfile] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load members on mount
  const fetchMembers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await apiClient.get("/members");
      setMembers(data);
      if (data.length > 0 && !activeProfile) {
        // Auto-select first member's profile for beautiful UX
        fetchProfile(data[0].formNumber);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "মেম্বার তালিকা লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    const handleImportedReload = () => {
      fetchMembers();
    };

    window.addEventListener("data-imported", handleImportedReload);
    return () => {
      window.removeEventListener("data-imported", handleImportedReload);
    };
  }, []);

  const handleImportFromSheets = async () => {
    setIsImporting(true);
    setImportStatus(null);
    try {
      const res = await apiClient.post("/settings/googlesheets/import-all", {});
      setImportStatus({
        type: "success",
        msg: res.message || "গুগল শিট থেকে সর্বমোট তথ্য সফলভাবে ইম্পোর্ট করা হয়েছে!"
      });
      fetchMembers();
      onRefreshStats();
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

  const fetchProfile = async (formNum: string) => {
    setProfileLoading(true);
    try {
      const profile = await apiClient.get(`/members/${formNum}/profile`);
      setActiveProfile(profile);
    } catch (err: any) {
      if (err?.message && (err.message.includes("সেশন") || err.message.includes("মেয়াদ") || err.message.includes("অননুমোদিত"))) {
        console.log("সদস্য প্রোফাইল লোড করা যায়নি: সেশন নেই।");
      } else {
        console.warn("প্রোফাইল লোড সমস্যা:", err);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!addName || !addForm || !addMobile) {
      setFormErr("নাম, ফরম নম্বর এবং মোবাইল নাম্বার আবশ্যক!");
      return;
    }

    try {
      await apiClient.post("/members", {
        name: addName.trim(),
        formNumber: addForm.trim(),
        mobile: addMobile.trim(),
        address: addAddress.trim(),
      });
      // Clear
      setAddName("");
      setAddForm("");
      setAddMobile("");
      setAddAddress("");
      setIsAddOpen(false);
      
      // Reload
      fetchMembers();
      onRefreshStats();
    } catch (err: any) {
      setFormErr(err.message || "মেম্বার তৈরি ব্যর্থ হয়েছে।");
    }
  };

  // Searching matching members client-side
  const filteredList = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.formNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {importStatus && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-3 shadow-lg ${importStatus.type === "success" ? "bg-emerald-950/60 border border-emerald-500/35 text-emerald-300 animate-pulse" : "bg-red-950/60 border border-red-500/35 text-red-300"}`}>
          {importStatus.type === "success" ? <Check size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-red-400 shrink-0" />}
          <span className="font-semibold">{importStatus.msg}</span>
        </div>
      )}
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">৪. সদস্য ব্যবস্থাপনা (Member Management)</h2>
          <p className="text-xs text-slate-400">লাইব্রেরিতে পাঠক সদস্য যোগ করুন এবং সদস্য আইডি অনুযায়ী বিস্তারিত ব্যবহারের ইতিহাস অডিট করুন</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => onPreviewMembersList && onPreviewMembersList(members)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/25 rounded-lg text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-cyan-900/40 transition-colors"
          >
            <ClipboardList size={14} className="text-cyan-400" />
            PDF প্রিন্ট
          </button>
          <button
            type="button"
            onClick={handleImportFromSheets}
            disabled={isImporting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-cyan-950/50 hover:bg-cyan-900/40 text-cyan-200 ring-1 ring-cyan-500/30 text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            title="গুগল শিট থেকে সমস্ত বর্তমান সদস্যের ডেটা ইম্পোর্ট/সিঙ্ক করবে।"
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
              setFormErr("");
              setIsAddOpen(true);
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/15 flex items-center justify-center gap-1.5 cursor-pointer transition-transform"
          >
            <UserPlus size={14} />
            ম্যানুয়াল নতুন সদস্য যোগ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Search and Sorted List */}
        <div className="col-span-1 lg:col-span-5 glass-panel p-4 rounded-2xl border border-purple-500/10 space-y-4 max-h-[80vh] flex flex-col">
          
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম বা ফরম আইডি লিখে খুঁজুন..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-purple-500/15 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {loading ? (
              <p className="text-center text-xs text-slate-500 py-6">তালিকা লোড হচ্ছে...</p>
            ) : filteredList.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">কোনো সদস্য নিবন্ধিত পাওয়া যায়নি।</p>
            ) : (
              filteredList.map((m) => {
                const isActive = activeProfile && activeProfile.member.formNumber === m.formNumber;
                return (
                  <div
                    key={m.formNumber}
                    onClick={() => fetchProfile(m.formNumber)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${isActive ? "bg-purple-950/30 border-purple-500/50" : "bg-slate-900/40 border-purple-500/5 hover:border-cyan-500/20"}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{m.name}</h4>
                      <span className="font-mono text-[10px] font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded shrink-0">
                        #{m.formNumber}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{m.mobile}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: member active detailed profile summaries */}
        <div className="col-span-1 lg:col-span-7 glass-panel-cyan p-5 rounded-2xl border border-cyan-500/10 min-h-[40vh] flex flex-col justify-between">
          
          {profileLoading ? (
            <div className="py-24 flex flex-col items-center justify-center flex-1">
              <RefreshCw className="animate-spin text-cyan-400 mb-2" size={24} />
              <p className="text-xs text-slate-400">প্রোফাইল লোড হচ্ছে...</p>
            </div>
          ) : !activeProfile ? (
            <div className="py-24 text-center text-slate-500 text-xs flex-1">
              বিস্তারিত ব্যবহারের রেকর্ড এবং ব্যবহারের চক্রসমূহ দেখতে বামে সদস্য তালিকায় ক্লিক করুন।
            </div>
          ) : (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Member Profile Card Details Header */}
                <div className="flex justify-between items-start border-b border-cyan-500/10 pb-3 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5">{activeProfile.member.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.1">
                      <MapPin size={11} className="text-purple-400 shrink-0" />
                      স্থায়ী ঠিকানা: {activeProfile.member.address}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold font-mono text-cyan-400">ID: #{activeProfile.member.formNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-end gap-1 font-mono">
                      <Phone size={10} className="text-emerald-400 shrink-0" />
                      {activeProfile.member.mobile}
                    </p>
                  </div>
                </div>

                {/* Dashboard metric summary counters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">মোট বই লেনদেন সংখ্যা</p>
                    <p className="text-2xl font-extrabold text-white mt-1 font-mono">{activeProfile.rentCount} বার</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-purple-500/5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">বর্তমানে নেওয়া বই (Issued)</p>
                    <p className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{activeProfile.activeRents.length} টি</p>
                  </div>
                </div>

                {/* Active Books and histories block */}
                <div className="space-y-3 pt-2">
                  
                  {/* Presently Active borrows */}
                  <div>
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1.5 uppercase">
                      <BookOpen size={13} className="text-purple-400" />
                      বর্তমানে ধারকৃত বইসমূহ ({activeProfile.activeRents.length})
                    </h4>
                    {activeProfile.activeRents.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2 bg-[#05070f]/40 p-3 rounded">এই মুহূর্তে কোনো বই ইস্যু করা নাই।</p>
                    ) : (
                      <div className="space-y-2">
                        {activeProfile.activeRents.map((item: any) => (
                          <div key={item.id} className="p-2.5 bg-purple-950/15 border border-purple-500/10 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-white mb-0.5">{item.bookName}</p>
                              <p className="text-[9px] text-purple-300 font-mono italic">কোড: {item.bookCode} | ইস্যু ডেট: {item.issueDate}</p>
                            </div>
                            <span className="text-[10px] text-red-400 font-bold font-mono bg-red-950/60 border border-red-500/20 px-2 py-0.5 rounded">
                              ফেরত দিন: {item.returnDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Previous books return lists */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mb-1.5 uppercase">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      ফেরত দেওয়া বইয়ের ইতিহাস ({activeProfile.returnedHistory.length})
                    </h4>
                    {activeProfile.returnedHistory.length === 0 ? (
                      <p className="text-[11px] text-slate-500 py-2 bg-[#05070f]/40 p-3 rounded">ইতিপূর্বে বই ফেরত দেওয়ার কোনো ইতিহাস নেই।</p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                        {activeProfile.returnedHistory.map((item: any) => (
                          <div key={item.id} className="p-2.5 bg-slate-900/60 border border-cyan-500/5 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-slate-200 mb-0.5">{item.bookName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">কোড: {item.bookCode} | ইস্যু: {item.issueDate}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-emerald-400 font-semibold font-mono bg-emerald-950/60 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                                ফেরত এসেছে: {item.returnedAt || item.returnDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Slips preview triggers */}
              <div className="pt-4 border-t border-cyan-500/5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-slate-950 border border-red-500/20 hover:border-red-500/50 hover:text-red-400 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-red-950/20 cursor-pointer transition-colors w-full sm:w-auto justify-center"
                >
                  <Trash2 size={12} />
                  সদস্য মুছে ফেলুন
                </button>
                <button
                  onClick={() => onPreviewMemberSlip(activeProfile)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-[#0e1629] border border-cyan-500/20 hover:border-cyan-400 px-4 py-2.5 rounded-lg text-cyan-400 hover:bg-slate-900 cursor-pointer transition-colors w-full sm:w-auto justify-center"
                >
                  <Eye size={12} />
                  গ্রাহক স্লিপ চোখের প্রাকদর্শন ও PDF
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MANUAL REGISTER NEW APP MEMBER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-purple-500/25 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-120">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus size={18} className="text-purple-400" />
              ম্যানুয়াল নতুন সদস্য রেজিস্ট্রি
            </h3>
            
            {formErr && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">সদস্যের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="যেমন: আরিফ উদ্দিন"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">ফরম নম্বর (ID) *</label>
                  <input
                    type="text"
                    value={addForm}
                    onChange={(e) => setAddForm(e.target.value)}
                    placeholder="যেমনঃ 1004"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    value={addMobile}
                    onChange={(e) => setAddMobile(e.target.value)}
                    placeholder="যেমনঃ 01333..."
                    className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">গ্রাহকের ঠিকানা</label>
                <input
                  type="text"
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  placeholder="যেমন: উত্তরা, ঢাকা"
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
                  সদস্য যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && activeProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b0f1a] border border-red-500/25 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={18} />
              সদস্য মুছে ফেলার সতর্কতা
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <span className="font-bold text-white">'{activeProfile.member.name}'</span> (ID: #{activeProfile.member.formNumber}) সদস্যকে মুছে ফেলতে চান? উনার ব্যবহারের সব লেনদেন রেকর্ড ড্যাশবোর্ড থেকে মুছে যাবে।
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-705 text-slate-300 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiClient.delete(`/members/${activeProfile.member.formNumber}`);
                    setActiveProfile(null);
                    setShowDeleteConfirm(false);
                    fetchMembers();
                    onRefreshStats();
                  } catch (err: any) {
                    alert(err.message || "মুছে ফেলা সফল হয়নি।");
                    setShowDeleteConfirm(false);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
