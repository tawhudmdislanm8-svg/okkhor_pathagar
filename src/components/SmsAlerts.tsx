import React, { useState, useEffect } from "react";
import { MessageSquare, Calendar, Phone, Smartphone, AlertTriangle, Send, RefreshCw, CheckCircle2 } from "lucide-react";
import { apiClient } from "../api";
import { SMSAlert } from "../types";

interface SmsAlertsProps {
  onRefreshStats: () => void;
}

export default function SmsAlerts({ onRefreshStats }: SmsAlertsProps) {
  const [alerts, setAlerts] = useState<SMSAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const list = await apiClient.get("/sms/scheduled");
      setAlerts(list);
    } catch (err: any) {
      setErrorMsg(err.message || "SMS শিডিউলার স্লট লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleManualSync = async () => {
    setSyncLoading(true);
    setSuccessMsg("");
    try {
      const res = await apiClient.post("/sms/trigger", {});
      setSuccessMsg(res.message || "শিডিউলার সফলভাবে রান হয়েছে। ওভারডিউ সতর্কতা SMS গ্রাহক মোবাইলে প্রস্তুত!");
      fetchAlerts();
      onRefreshStats();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "শিডিউল সিঙ্ক ব্যর্থ হয়েছে।");
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">৮. অটোমেটেড SMS কন্ট্রোল প্যানেল</h2>
          <p className="text-xs text-slate-400">মেয়াদোত্তীর্ণ বই জমা নেওয়ার জন্য শিডিউলড SMS অ্যালার্ট ও গ্রাহক বিবরণী</p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncLoading}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/15 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
        >
          {syncLoading ? (
            <RefreshCw className="animate-spin" size={14} />
          ) : (
            <Send size={14} />
          )}
          ম্যানুয়াল ক্রন শিডিউল সিঙ্ক করুন
        </button>
      </div>

      {/* Rules card banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-purple-500/10 flex items-start gap-3 text-slate-300 text-xs sm:text-sm">
        <Smartphone size={20} className="text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">স্বয়ংক্রিয় SMS সতর্কীকরণের নিয়মাবলী:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-xs">
            <li>বই ফেরত দেওয়ার নির্ধারিত দিন (Return Date) <b>দুপুর ২:০০ টায়</b> স্বয়ংক্রিয়ভাবে প্রথম SMS সচল হবে।</li>
            <li>যদি বই ফেরত না আসে, তবে প্রতি <b>২ দিন পর পর দুপুর ২:০০ টায়</b> এই সতর্কতা পাঠাগারে জমা নেওয়া পর্যন্ত চলতে থাকবে।</li>
            <li>সময় বাড়ানো (Extend Time) হলে পূর্ববর্তী লুপটি বাতিল হয়ে নতুন Return Date হিসেবে অ্যালার্টটি রিক্যালকুলেট হবে।</li>
            <li>আমাদের পাঠাগার হেল্পলাইন কন্টাক্ট নম্বর: <strong className="text-cyan-400">01333474848</strong></li>
          </ul>
        </div>
      </div>

      {/* Output notifications */}
      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 p-4 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* List content table panel */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">অ্যালার্টসমূহ লোড করা হচ্ছে...</div>
      ) : alerts.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-2xl">
          <p className="text-slate-400 text-sm">বর্তমানে কোনো বই সচল বা মেয়াদোত্তীর্ণ ঋণ অবস্থায় নাই। সচল ইস্যু করার প্যানেল চেক করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((al) => (
            <div
              key={al.id}
              className="glass-panel-cyan p-4 rounded-2xl border border-cyan-500/10 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-150"
            >
              <div className="space-y-3">
                
                {/* Book & borrower row */}
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{al.bookName}</h4>
                    <p className="text-[10px] text-slate-400">গ্রাহক: {al.memberName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${al.status === "Sent" ? "bg-emerald-950 text-emerald-300" : "bg-purple-950 text-purple-300"}`}>
                    {al.status === "Sent" ? "Dispatched / Sent" : "Scheduled"}
                  </span>
                </div>

                {/* Receiver and schedule info */}
                <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-400 border-t border-b border-purple-500/5 py-2">
                  <div>রিসিভার নম্বর: <span className="font-mono text-white font-semibold">{al.mobile}</span></div>
                  <div>রিটার্ন শেষ দিন: <span className="font-mono text-cyan-400 font-bold">{al.returnDate}</span></div>
                  <div className="col-span-2 mt-1">
                    শিডিউল সূত্র: <span className="text-purple-300 font-semibold">{al.triggerTime}</span>
                  </div>
                </div>

                {/* SMS content body */}
                <div className="bg-[#05070f] p-3 rounded-lg text-slate-300 font-sans text-xs relative max-h-24 overflow-y-auto">
                  <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <MessageSquare size={10} />
                    মোবাইল SMS বার্তা বিবরণী
                  </p>
                  <p className="text-[10px] leading-relaxed">{al.alertText}</p>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
