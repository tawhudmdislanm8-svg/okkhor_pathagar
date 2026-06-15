import React, { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, KeyRound, AlertTriangle, CheckCircle2, Lock, Sparkles, RefreshCw, Smartphone, Network, Database, Download } from "lucide-react";
import { apiClient } from "../api";

export default function Settings() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // SMS Template configurations
  const [smsTemplate, setSmsTemplate] = useState("");
  const [smsTemplateLoading, setSmsTemplateLoading] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState("");
  const [smsErrorMsg, setSmsErrorMsg] = useState("");

  // Live SMS Gateway Configurations
  const [smsProvider, setSmsProvider] = useState("simulated"); // 'simulated', 'greenweb', 'bulksmsbd', 'custom'
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("");
  const [smsCustomUrl, setSmsCustomUrl] = useState("");
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewaySuccessMsg, setGatewaySuccessMsg] = useState("");
  const [gatewayErrorMsg, setGatewayErrorMsg] = useState("");

  // Google Sheets Sync Configurations
  const [sheetUrl, setSheetUrl] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetSuccessMsg, setSheetSuccessMsg] = useState("");
  const [sheetErrorMsg, setSheetErrorMsg] = useState("");
  const [testSyncLoading, setTestSyncLoading] = useState(false);
  const [fullSyncLoading, setFullSyncLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    const fetchSmsTemplate = async () => {
      setSmsTemplateLoading(true);
      try {
        const res = await apiClient.get("/sms/template");
        setSmsTemplate(res.template || "");
      } catch (err: any) {
        if (err?.message && (err.message.includes("সেশন") || err.message.includes("মেয়াদ") || err.message.includes("অননুমোদিত"))) {
          console.log("SMS template load deferred: session expired or unauthorized.");
        } else {
          console.warn("SMS template load failed:", err);
        }
      } finally {
        setSmsTemplateLoading(false);
      }
    };

    const fetchSmsGateway = async () => {
      setGatewayLoading(true);
      try {
        const res = await apiClient.get("/sms/gateway");
        setSmsProvider(res.provider || "simulated");
        setSmsApiKey(res.apiKey || "");
        setSmsSenderId(res.senderId || "");
        setSmsCustomUrl(res.customUrl || "");
      } catch (err: any) {
        if (err?.message && (err.message.includes("সেশন") || err.message.includes("মেয়াদ") || err.message.includes("অননুমোদিত"))) {
          console.log("SMS gateway load deferred: session expired.");
        } else {
          console.warn("SMS gateway settings error:", err);
        }
      } finally {
        setGatewayLoading(false);
      }
    };

    const fetchGoogleSheets = async () => {
      setSheetLoading(true);
      try {
        const res = await apiClient.get("/settings/googlesheets");
        setSheetUrl(res.webAppUrl || "");
        setAutoSync(!!res.isAutoSyncEnabled);
      } catch (err: any) {
        console.warn("Google Sheets load deferred:", err);
      } finally {
        setSheetLoading(false);
      }
    };

    fetchSmsTemplate();
    fetchSmsGateway();
    fetchGoogleSheets();
  }, []);

  const handleUpdateSmsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsErrorMsg("");
    setSmsSuccessMsg("");
    setSmsTemplateLoading(true);

    try {
      await apiClient.post("/sms/template", { template: smsTemplate });
      setSmsSuccessMsg("রিমাইন্ডার SMS টেমপ্লেট সফলভাবে আপডেট করা হয়েছে!");
    } catch (err: any) {
      setSmsErrorMsg(err.message || "টেমপ্লেট কাস্টমাইজেশন সেভ করা ব্যর্থ হয়েছে।");
    } finally {
      setSmsTemplateLoading(false);
    }
  };

  const handleUpdateSmsGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayErrorMsg("");
    setGatewaySuccessMsg("");
    setGatewayLoading(true);

    try {
      await apiClient.post("/sms/gateway", {
        provider: smsProvider,
        apiKey: smsApiKey,
        senderId: smsSenderId,
        customUrl: smsCustomUrl,
      });
      setGatewaySuccessMsg("SMS গেটওয়ে কনফিগারেশন সফলভাবে সেভ করা হয়েছে!");
    } catch (err: any) {
      setGatewayErrorMsg(err.message || "গেটওয়ে কনফিগারেশন সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setGatewayLoading(false);
    }
  };

  const handleSaveGoogleSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSheetErrorMsg("");
    setSheetSuccessMsg("");
    setSheetLoading(true);

    try {
      await apiClient.post("/settings/googlesheets", {
        webAppUrl: sheetUrl.trim(),
        isAutoSyncEnabled: autoSync
      });
      setSheetSuccessMsg("গুগল শিট কানেকশন সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!");
    } catch (err: any) {
      setSheetErrorMsg(err.message || "গুগল শিট সেটিংস সেভ করতে ডেটাবেস এরর হয়েছে।");
    } finally {
      setSheetLoading(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    setSheetErrorMsg("");
    setSheetSuccessMsg("");
    setTestSyncLoading(true);

    try {
      const res = await apiClient.post("/settings/googlesheets/test", {
        webAppUrl: sheetUrl.trim()
      });
      setSheetSuccessMsg(res.message || "পপ্রস্তাবিত গুগল শিট Web App-এ টেস্ট রেকর্ড পাঠানো হয়েছে!");
    } catch (err: any) {
      setSheetErrorMsg(err.message || "টেস্ট সংযোগ ব্যর্থ হয়েছে। আপনার Web App URL ও Apps Script-এর অ্যাক্সেস চেক করুন।");
    } finally {
      setTestSyncLoading(false);
    }
  };

  const handleSyncAllGoogleSheets = async () => {
    setSheetErrorMsg("");
    setSheetSuccessMsg("");
    setFullSyncLoading(true);

    try {
      const res = await apiClient.post("/settings/googlesheets/sync-all", {});
      setSheetSuccessMsg(res.message || "সকল বই, সদস্য ও উইশলিস্ট ডাটা গুগল শিটে ট্রান্সফার হওয়া শুরু হয়েছে!");
    } catch (err: any) {
      setSheetErrorMsg(err.message || "ফুল সিঙ্ক প্রসেসটি আরম্ভ করতে ব্যথ হয়েছে।");
    } finally {
      setFullSyncLoading(false);
    }
  };

  const handleImportFromGoogleSheets = async () => {
    setSheetErrorMsg("");
    setSheetSuccessMsg("");
    setImportLoading(true);

    try {
      const res = await apiClient.post("/settings/googlesheets/import-all", {});
      setSheetSuccessMsg(res.message || "গুগল শিট থেকে সফলভাবে সকল তথ্য সিস্টেমে ইম্পোর্ট করা হয়েছে!");
      
      // Dispatch an event so that App.tsx knows it needs to refresh books, members and logs state
      window.dispatchEvent(new Event("data-imported"));
    } catch (err: any) {
      setSheetErrorMsg(err.message || "গুগল শিট থেকে তথ্য ডাউনলোড/ইম্পোর্ট করতে ব্যর্থ হয়েছে।");
    } finally {
      setImportLoading(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentUsername || !currentPassword || !securityPassword || !newUsername || !newPassword) {
      setErrorMsg("অনুরোধটি সম্পন্ন করার জন্য ফর্মের সকল তথ্য পূরণ করুন।");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/change-credentials", {
        currentUsername: currentUsername.trim(),
        currentPassword: currentPassword,
        securityPassword: securityPassword.trim(),
        newUsername: newUsername.trim(),
        newPassword: newPassword,
      });

      // Clear new inputs but keep states clean
      setSuccessMsg(res.message || "ক্রেডেনশিয়াল সফলভাবে সংশোধিত হয়েছে!");
      setCurrentUsername("");
      setCurrentPassword("");
      setSecurityPassword("");
      setNewUsername("");
      setNewPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "ক্রেডেনশিয়াল সংশোধন করা ব্যর্থ হয়েছে। সিকিউরিটি পাসওয়ার্ড বা পূর্বের ইউজার তথ্য রি-চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      {/* Upper header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">৯. নিরাপত্তা ও অ্যাডমিন সেটিংস</h2>
        <p className="text-xs text-slate-400">আপনার পাঠাগার ম্যানেজমেন্ট একাউন্টের ইউজারনেম, সিকিউরড পাসওয়ার্ড এবং নিরাপত্তা কি পরিবর্তন করুন</p>
      </div>

      {/* Main glass box form container */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/15 relative overflow-hidden">
        
        {/* Glow corner elements */}
        <div className="absolute right-0 bottom-0 translate-x-20 translate-y-20 p-24 bg-purple-500/5 rotate-45 rounded-full pointer-events-none"></div>

        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-purple-500/10 pb-3 mb-6">
          <KeyRound size={16} className="text-purple-400" />
          ক্রীডেনশিয়াল পরিবর্তন সিস্টেমপ্যানেল
        </h3>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="bg-red-950/45 border border-red-500/25 p-4 rounded-xl text-xs text-red-300 flex items-center gap-3 mb-4 animate-shake">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/45 border border-emerald-500/25 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-3 mb-4 animate-pulse">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateCredentials} className="space-y-5 relative">
          
          {/* Current credentials row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">বর্তমান ইউজারনেম *</label>
              <input
                type="text"
                value={currentUsername}
                onChange={(e) => setCurrentUsername(e.target.value)}
                placeholder="বর্তমান Username দিন"
                className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400/70"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">বর্তমান পাসওয়ার্ড *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="বর্তমান Password দিন"
                className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400/70"
                required
                autoComplete="off"
              />
            </div>
          </div>

          {/* Security Password row */}
          <div className="p-4 bg-slate-930 rounded-xl border border-purple-500/10 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <ShieldCheck size={14} className="text-purple-400" />
              <span>নিরাপত্তা চেক (Security Code) *</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              ক্রেডেনশিয়াল পরিবর্তনের জন্য পাঠাগারের নিরাপত্তা কোড টাইপ করুন। ডিফল্ট কোড: <code className="text-cyan-400 font-mono text-[10px] font-bold">PASSWD</code>। এটি ভুল হলে ড্যাশবোর্ডের নিরাপত্তাজনিত কারণে পরিবর্তন বাতিল হবে।
            </p>
            <input
              type="password"
              value={securityPassword}
              onChange={(e) => setSecurityPassword(e.target.value)}
              placeholder="Security Password কোডটি টাইপ করুন"
              className="w-full text-xs p-3 bg-slate-950 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              required
              autoComplete="off"
            />
          </div>

          {/* New credentials row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-purple-500/5 pt-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-semibold text-cyan-400">নতুন ইউজারনেম *</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="নতুন নতুন Username দিন"
                className="w-full text-xs p-3 bg-slate-950 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-semibold text-cyan-400">নতুন পাসওয়ার্ড *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className="w-full text-xs p-3 bg-slate-950 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                required
                autoComplete="off"
              />
            </div>
          </div>

          {/* Submit action */}
          <div className="pt-4 border-t border-purple-500/5 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-purple-600/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Lock size={14} />
              )}
               ক্রেডেনশিয়াল আপডেট করুন
            </button>
          </div>

        </form>

      </div>

      {/* Dynamic SMS Template Settings Panel */}
      <div className="glass-panel-cyan p-6 rounded-2xl border border-cyan-500/15 relative overflow-hidden mt-6">
        <div className="absolute right-0 bottom-0 translate-x-20 translate-y-20 p-24 bg-cyan-500/5 rotate-45 rounded-full pointer-events-none"></div>

        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-cyan-500/10 pb-3 mb-6">
          <Sparkles size={16} className="text-cyan-400" />
          রিমাইন্ডার SMS মেসেজ টেমপ্লেট কাস্টমাইজেশন
        </h3>

        {smsErrorMsg && (
          <div className="bg-red-950/45 border border-red-500/25 p-4 rounded-xl text-xs text-red-300 flex items-center gap-3 mb-4">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{smsErrorMsg}</span>
          </div>
        )}

        {smsSuccessMsg && (
          <div className="bg-emerald-950/45 border border-emerald-500/25 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-3 mb-4 animate-pulse">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{smsSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSmsTemplate} className="space-y-4 relative">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex justify-between">
              <span>মেসেজ টেক্সট কাস্টমাইজ করুন *</span>
              <span className="text-cyan-400 font-mono text-[9px]">ডাইনামিক প্লেসহোল্ডার সমর্থন করে</span>
            </label>

            {smsTemplateLoading && !smsTemplate ? (
              <div className="h-28 bg-slate-950/50 rounded-xl flex items-center justify-center border border-cyan-500/10">
                <RefreshCw className="animate-spin text-cyan-400" size={20} />
              </div>
            ) : (
              <textarea
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                placeholder="আসসালামু আলাইকুম, আপনার ({bookName}) বইটি..."
                rows={5}
                className="w-full text-xs p-3.5 bg-slate-950 border border-cyan-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400/85 leading-relaxed font-sans"
                required
              />
            )}
          </div>

          {/* Quick Insert Placeholders Chips */}
          <div className="p-3 bg-slate-950/45 border border-cyan-500/5 rounded-xl space-y-2">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">দ্রুত সংযোগ ট্যাগ (পছন্দ অনুযায়ী ক্লিক করে শেষে যুক্ত করুন):</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSmsTemplate(prev => prev + " {bookName}")}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/20 text-cyan-300 text-[10px] rounded-lg font-mono font-bold transition-all cursor-pointer"
              >
                + {'{bookName}'} (বইয়ের নাম)
              </button>
              <button
                type="button"
                onClick={() => setSmsTemplate(prev => prev + " {memberName}")}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/20 text-cyan-300 text-[10px] rounded-lg font-mono font-bold transition-all cursor-pointer"
              >
                + {'{memberName}'} (সদস্যের নাম)
              </button>
              <button
                type="button"
                onClick={() => setSmsTemplate(prev => prev + " {returnDate}")}
                className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/20 text-cyan-300 text-[10px] rounded-lg font-mono font-bold transition-all cursor-pointer"
              >
                + {'{returnDate}'} (ফেরতের শেষ তারিখ)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-cyan-500/5 flex justify-end">
            <button
              type="submit"
              disabled={smsTemplateLoading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-cyan-600/10 flex items-center justify-center gap-1.5"
            >
              {smsTemplateLoading ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              রিমাইন্ডার টেমপ্লেট সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>

      {/* Live SMS Gateway Setup Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/15 relative overflow-hidden mt-6">
        <div className="absolute right-0 bottom-0 translate-x-20 translate-y-20 p-24 bg-purple-500/5 rotate-45 rounded-full pointer-events-none"></div>

        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-purple-500/10 pb-3 mb-6">
          <Smartphone size={16} className="text-purple-400" />
          রিয়েল SMS গেটওয়ে API কনফিগারেশন <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded border border-purple-500/20">ভবিষ্যতের জন্য</span>
        </h3>

        {gatewayErrorMsg && (
          <div className="bg-red-950/45 border border-red-500/25 p-4 rounded-xl text-xs text-red-300 flex items-center gap-3 mb-4">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{gatewayErrorMsg}</span>
          </div>
        )}

        {gatewaySuccessMsg && (
          <div className="bg-emerald-950/45 border border-emerald-500/25 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-3 mb-4 animate-pulse">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{gatewaySuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdateSmsGateway} className="space-y-4 relative">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex justify-between">
              <span>SMS সার্ভিস প্রোভাইডার সিলেক্ট করুন</span>
              <span className="text-purple-400 font-semibold text-[9px]">বর্তমানে অফলাইন/ফ্রি মোডে সক্রিয়</span>
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "simulated", label: "সিমুলেশন মোড (Free)", desc: "ব্রাউজার ও লগ সতর্কতা" },
                { id: "greenweb", label: "Greenweb SMS", desc: "Local GP/BL/etc API" },
                { id: "bulksmsbd", label: "BulkSMSBD", desc: "Sms Gateway system" },
                { id: "custom", label: "Custom API URL", desc: "অন্য যেকোনো API" },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    setSmsProvider(prov.id);
                    if (prov.id === "greenweb") {
                      setSmsCustomUrl("https://api.greenweb.com.bd/api.php?token={apiKey}&to={to}&message={message}");
                    } else if (prov.id === "bulksmsbd") {
                      setSmsCustomUrl("https://bulksmsbd.net/api/smsapi?api_key={apiKey}&type=text&number={to}&senderid={senderId}&message={message}");
                    } else if (prov.id === "simulated") {
                      setSmsCustomUrl("");
                    }
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    smsProvider === prov.id
                      ? "border-purple-500 bg-purple-500/10 text-white font-bold"
                      : "border-purple-500/10 bg-slate-950/40 text-slate-400 hover:border-purple-500/20"
                  }`}
                >
                  <p className="text-xs font-bold">{prov.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">{prov.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {smsProvider !== "simulated" && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-purple-500/10 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">API Key / Token *</label>
                  <input
                    type="password"
                    value={smsApiKey}
                    onChange={(e) => setSmsApiKey(e.target.value)}
                    placeholder="প্রোভাইডারের দেওয়া API Key দিন"
                    className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                    required={smsProvider !== "simulated"}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sender ID (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={smsSenderId}
                    onChange={(e) => setSmsSenderId(e.target.value)}
                    placeholder="ম্যাস্কিং আইডি /অনুমোদিত Sender ID"
                    className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">API গেটওয়ে URL লিঙ্ক</label>
                <input
                  type="text"
                  value={smsCustomUrl}
                  onChange={(e) => setSmsCustomUrl(e.target.value)}
                  placeholder="https://api.sms-service.com/send?to={to}&msg={message}"
                  className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                
                <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">
                  * ডাইনামিক ট্যাগসমূহ: <code className="text-cyan-400 font-bold">{'{apiKey}'}</code>, <code className="text-cyan-400 font-bold">{'{to}'}</code>, <code className="text-cyan-400 font-bold">{'{message}'}</code>, <code className="text-cyan-400 font-bold">{'{senderId}'}</code>। URL লোড করার সময়ে স্বয়ংক্রিয়ভাবে এগুলো প্রতিস্থাপিত হবে।
                </p>
              </div>
            </div>
          )}

          {/* Static Info for reference */}
          <div className="p-3 bg-slate-950/25 border border-purple-500/5 rounded-xl space-y-1 text-slate-400">
            <p className="text-[10px] font-semibold text-purple-300">💡 ফ্রি সিমুলেশন মোড কিভাবে কাজ করে?</p>
            <p className="text-[9px] leading-relaxed">
              কোনো এপিআই কী ছাড়াই ডিফল্ট অবস্থায় "সিমুলেশন মোড (Free)" সচল থাকবে। এর মাধ্যমে ব্রাউজার প্যানেলে সরাসরি সব মেম্বারের বকেয়া লিস্ট এবং ট্রাইগার শিডিউলে পূর্ণ মেসেজ দেখা যাবে ও ট্র্যাক করা যাবে কিন্তু কোনো রিয়াল মেসেজ ফি/টাকা কাটা যাবে না। পরে রিয়াল SMS পাঠাতে চাইলে শুধু উপর থেকে আপনার প্রোভাইডার সিলেক্ট করে এপিআই কি দিন।
            </p>
          </div>

          <div className="pt-4 border-t border-purple-500/5 flex justify-end">
            <button
              type="submit"
              disabled={gatewayLoading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-purple-600/10 flex items-center justify-center gap-1.5"
            >
              {gatewayLoading ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Smartphone size={14} />
              )}
              গেটওয়ে কনফিগারেশন সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>

      {/* Google Sheets Sync & Integration Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/15 relative overflow-hidden mt-6">
        <div className="absolute right-0 bottom-0 translate-x-20 translate-y-20 p-24 bg-purple-500/5 rotate-45 rounded-full pointer-events-none"></div>

        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-purple-500/10 pb-3 mb-6">
          <Database size={16} className="text-purple-400" />
          গুগল সিট (Google Sheets) অটো-সিঙ্ক ও ডেটা ইন্টিগ্রেশন
        </h3>

        {sheetErrorMsg && (
          <div className="bg-red-950/45 border border-red-500/25 p-4 rounded-xl text-xs text-red-300 flex items-center gap-3 mb-4">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <span>{sheetErrorMsg}</span>
          </div>
        )}

        {sheetSuccessMsg && (
          <div className="bg-emerald-950/45 border border-emerald-500/25 p-4 rounded-xl text-xs text-emerald-300 flex items-center gap-3 mb-4 animate-pulse">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{sheetSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveGoogleSheets} className="space-y-4 relative">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">গুগল স্ক্রিপ্ট Web App URL *</label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-xs p-3 bg-slate-950 border border-purple-500/15 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-mono"
              required
            />
            <p className="text-[9px] text-slate-500 mt-1">আপনার গুগল ড্রাইভে ক্রিয়েট করা Apps script ওয়েব লিংকটি এখানে পেস্ট করুন।</p>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              id="autoSyncCheck"
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500/20 bg-slate-950 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label htmlFor="autoSyncCheck" className="text-xs text-slate-300 font-bold select-none cursor-pointer">
              রিয়েল-টাইম অটো-সিঙ্ক সক্রিয় রাখুন (Auto-sync new Books & Members)
            </label>
          </div>

          <div className="border-t border-purple-500/10 pt-4 flex flex-wrap gap-3 justify-between items-center">
            {/* Left Actions - Test and Force Sync */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestGoogleSheets}
                disabled={testSyncLoading || !sheetUrl}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-500/40 text-slate-300 text-[10px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {testSyncLoading ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <Network size={12} className="text-cyan-400" />
                )}
                কানেকশন টেস্ট করুন
              </button>

              <button
                type="button"
                onClick={handleSyncAllGoogleSheets}
                disabled={fullSyncLoading || !sheetUrl}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/20 hover:border-purple-500/40 text-slate-300 text-[10px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="সিস্টেমের সমস্ত বই, মেম্বার এবং উইশলিস্টের ডাটা এক ক্লিকে সরাসরি গুগল শিটে ফোর্স আপলোড করবে।"
              >
                {fullSyncLoading ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <Database size={12} className="text-purple-400" />
                )}
                সকল ডাটা শিটে সিঙ্ক করুন (Bulk Sync)
              </button>

              <button
                type="button"
                onClick={handleImportFromGoogleSheets}
                disabled={importLoading || !sheetUrl}
                className="px-4 py-2 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/20 hover:border-cyan-500/45 text-cyan-300 text-[10px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 animate-pulse"
                title="গুগল শিটের 'Books', 'Members' এবং 'Wishlist' ট্যাবগুলো থেকে সরাসরি সমস্ত তথ্য লোকাল ডাটাবৈজে সিঙ্ক/ডাউনলোড করবে।"
              >
                {importLoading ? (
                  <RefreshCw className="animate-spin" size={12} />
                ) : (
                  <Download size={12} className="text-cyan-400" />
                )}
                শিট থেকে ডাটা ইম্পোর্ট করুন (Pull Data)
              </button>
            </div>

            {/* Right Action - Save Config */}
            <button
              type="submit"
              disabled={sheetLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {sheetLoading ? (
                <RefreshCw className="animate-spin" size={12} />
              ) : (
                <CheckCircle2 size={12} />
              )}
              কানেকশন সেভ করুন
            </button>
          </div>
        </form>

        {/* Detailed User Guide / Step-by-Step setup instructions */}
        <div className="mt-6 p-4 bg-slate-950/40 border border-purple-500/10 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-200">🚀 গুগল শিট সিঙ্ক করার জন্য আমাকে কী কী করতে হবে? (Step-by-Step Guide)</h4>
          
          <div className="space-y-3 text-[10px] text-slate-400 leading-relaxed font-sans">
            <div>
              <p className="font-bold text-purple-300 mb-0.5">ধাপ ১: গুগল স্প্রেডশিটে কলামগুলোর নাম সেট করুন</p>
              <p>আপনার জিমেইল একাউন্ট থেকে একটি নতুন **Google Sheet** খুলুন। প্রথম সারির কলামগুলোতে নিচের যেকোনো একটি ফরম্যাটে হেডারগুলো লিখে নিন (সিস্টেম যেকোনোটিই স্বয়ংক্রিয়ভাবে সনাক্ত করতে পারবে):</p>
              <div className="bg-slate-950 p-2 rounded-lg border border-purple-500/5 font-mono text-[9px] mt-1 space-y-1">
                <span className="text-slate-500">// বাংলা কলাম হেডারসমূহ:</span>
                <p className="text-cyan-400">সময়কাল, ধরন, পদক্ষেপ, আইডি, বইকোড, নাম, লেখক, প্রকাশনী, ফরমনম্বর, মোবাইল, ঠিকানা, অবস্থা</p>
                <div className="border-t border-slate-950 my-1"></div>
                <span className="text-slate-500">// ইংরেজি কলাম হেডারসমূহ (English equivalent columns):</span>
                <p className="text-purple-400">timestamp, type, action, id, code, name, author, publisher, formNumber, mobile, address, status</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-purple-300 mb-0.5">ধাপ ২: গুগল অ্যাপস স্ক্রিপ্ট কোড বসান</p>
              <p>স্প্রেডশিটের উপরের মেনুবার থেকে **Extensions &gt; Apps Script** অপশনে ক্লিক করুন। সেখানে পূর্বের সব কোড মুছে দিয়ে নিচের কোডটি হুবহু কপি করে পেস্ট করুন:</p>
              <pre className="bg-slate-950 p-2.5 rounded-lg border border-purple-500/5 font-mono text-[8px] text-slate-300 overflow-x-auto leading-normal whitespace-pre">
{`function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { books: [], members: [], wishlist: [] };
    
    // 1. Fetch Books from "Books" tab
    var booksSheet = ss.getSheetByName("Books");
    if (booksSheet) {
      var rows = booksSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row && row[5]) { // Row must have a Book Name
          result.books.push({
            id: row[3] || ("book-" + i),
            code: String(row[4] || ""),
            name: String(row[5] || ""),
            author: String(row[6] || ""),
            publisher: String(row[7] || ""),
            status: String(row[8] || "Available")
          });
        }
      }
    }
    
    // 2. Fetch Members from "Members" tab
    var membersSheet = ss.getSheetByName("Members");
    if (membersSheet) {
      var rows = membersSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row && row[5]) { // Row must have a Member Name
          result.members.push({
            id: row[3] || ("member-" + i),
            formNumber: String(row[4] || ""),
            name: String(row[5] || ""),
            mobile: String(row[6] || ""),
            address: String(row[7] || "")
          });
        }
      }
    }
    
    // 3. Fetch Wishlist from "Wishlist" tab
    var wishlistSheet = ss.getSheetByName("Wishlist");
    if (wishlistSheet) {
      var rows = wishlistSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row && row[4]) { // Row must have a Book Name
          result.wishlist.push({
            id: row[3] || ("wish-" + i),
            name: String(row[4] || ""),
            author: String(row[5] || ""),
            mobile: String(row[6] || ""),
            address: String(row[7] || "")
          });
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var p = e.parameter;
    var type = p.type || "General";
    
    // Choose Sheet Tab based on dynamic data type (Books, Members, Transactions, Wishlist, AuditLogs)
    var sheetName = "General";
    if (type === "Book" || type === "বই") sheetName = "Books";
    else if (type === "Member" || type === "সদস্য") sheetName = "Members";
    else if (type === "Issue" || type === "Return" || type === "Transaction" || type === "লেনদেন") sheetName = "Transactions";
    else if (type === "Wishlist" || type === "উইশলিস্ট") sheetName = "Wishlist";
    else if (type === "AuditLog" || type === "History" || type === "Log" || type === "ইতিহাস") sheetName = "Logs";
    
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Append matching English & Bengali headers dynamically
      if (sheetName === "Books") {
        sheet.appendRow(["দিনক্ষণ (Timestamp)", "ধরন (Type)", "একশন (Action)", "আইডি (ID)", "বইকোড (Code)", "বইয়ের নাম (Book Name)", "লেখক (Author)", "প্রকাশনা (Publisher)", "অবস্থা (Status)"]);
      } else if (sheetName === "Members") {
        sheet.appendRow(["দিনক্ষণ (Timestamp)", "ধরন (Type)", "একশন (Action)", "আইডি (ID)", "ফরম নম্বর (Form Number)", "সদস্যের নাম (Member Name)", "মোবাইল (Mobile)", "ঠিকানা (Address)"]);
      } else if (sheetName === "Transactions") {
        sheet.appendRow(["দিনক্ষণ (Timestamp)", "ধরন (Type)", "একশন (Action)", "আইডি (ID)", "বইকোড (Book Code)", "বইয়ের নাম (Book Name)", "সদস্যের নাম (Member Name)", "মোবাইল (Mobile)", "ঠিকানা (Address)", "শেষ তারিখ (Target Date)", "স্ট্যাটাস (Status)"]);
      } else if (sheetName === "Wishlist") {
        sheet.appendRow(["দিনক্ষণ (Timestamp)", "ধরন (Type)", "একশন (Action)", "আইডি (ID)", "বইয়ের নাম (Book Name)", "লেখক (Author)", "মোবাইল (Mobile)", "ঠিকানা (Address)"]);
      } else {
        sheet.appendRow(["দিনক্ষণ (Timestamp)", "ধরন (Type)", "একশন (Action)", "আইডি (ID)", "বিস্তারিত (Details)"]);
      }
    }
    
    // Find if record already exists based on ID or unique code/Form number to prevent duplicates
    var existingRowIndex = -1;
    var idToFind = p.id || "";
    var codeToFind = (p.code || p.bookCode || p.formNumber || "").toLowerCase().trim();
    var nameToFind = (p.name || p.bookName || "").toLowerCase().trim();
    var action = p.action || "";
    var isDeleteAction = (action === "মুছে ফেলা হয়েছে" || action === "Delete" || action === "Deleted");

    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row) continue;
      var rowId = String(row[3] || "");
      var rowCode = String(row[4] || "").toLowerCase().trim();
      var rowName = String(row[4] || row[5] || "").toLowerCase().trim();

      // Check ID match
      if (idToFind && rowId === idToFind) {
        existingRowIndex = i + 1;
        break;
      }
      // Check Code or Form Number fallback match
      if (codeToFind && rowCode === codeToFind) {
        existingRowIndex = i + 1;
        break;
      }
      // Check Wishlist Name match
      if (sheetName === "Wishlist" && nameToFind && rowName === nameToFind) {
        existingRowIndex = i + 1;
        break;
      }
    }

    // Handle delete action gracefully
    if (isDeleteAction && existingRowIndex !== -1) {
      sheet.deleteRow(existingRowIndex);
      return ContentService.createTextOutput("Deleted Successfully")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Set row values structured for specific sheet
    var rowData = [];
    if (sheetName === "Books") {
      rowData = [
        new Date(),
        p.type || "Book",
        p.action || "",
        p.id || "",
        p.code || p.bookCode || "",
        p.name || p.bookName || "",
        p.author || p.bookAuthor || "",
        p.publisher || "",
        p.status || "Available"
      ];
    } else if (sheetName === "Members") {
      rowData = [
        new Date(),
        p.type || "Member",
        p.action || "",
        p.id || "",
        p.formNumber || "",
        p.name || p.memberName || "",
        p.mobile || "",
        p.address || ""
      ];
    } else if (sheetName === "Transactions") {
      rowData = [
        new Date(),
        p.type || "Transaction",
        p.action || "",
        p.id || "",
        p.bookCode || p.code || "",
        p.bookName || p.name || "",
        p.memberName || p.name || "",
        p.mobile || "",
        p.address || "",
        p.date || "",
        p.status || ""
      ];
    } else if (sheetName === "Wishlist") {
      rowData = [
        new Date(),
        p.type || "Wishlist",
        p.action || "",
        p.id || "",
        p.name || p.bookName || "",
        p.author || "",
        p.mobile || "",
        p.address || ""
      ];
    } else {
      rowData = [
        new Date(),
        p.type || "Log",
        p.action || "",
        p.id || "",
        p.details || ""
      ];
    }

    // Check if we need to update existing row or append new row data
    if (existingRowIndex !== -1 && (sheetName === "Books" || sheetName === "Members" || sheetName === "Wishlist" || sheetName === "Transactions")) {
      var range = sheet.getRange(existingRowIndex, 1, 1, rowData.length);
      range.setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}`}
              </pre>
            </div>

            <div>
              <p className="font-bold text-purple-300 mb-0.5">ধাপ ৩: ওয়েব অ্যাপ ডেপ্লয়মেন্ট (Deploy as Web App)</p>
              <p>১. স্ক্রিপ্ট এডিটরের উপরে ডানদিকের কোণায় **Deploy &gt; New Deployment** এ ক্লিক করুন।</p>
              <p>২. গিয়ার (Settings) আইকনে ক্লিক করে **Web App** টাইপ সিলেক্ট করুন।</p>
              <p>৩. **Execute as:** অপশনে **"Me (tawhid22000...)"** রাখুন।</p>
              <p>৪. **Who has access:** অপশনে অবশ্যই **"Anyone"** সিলেক্ট করুন (এটি না দিলে অ্যাপ থেকে ডাটা আপলোড ব্যর্থ হবে)।</p>
              <p>৫. **Deploy** বাটনে চাপুন। প্রয়োজনীয় গুগল পারমিশন এক্সেস দিন এবং ডেপ্লয় শেষে যে **Web App URL** কপির অপশন পাবেন, তা কপি করে উপরে পেস্ট করে কানেকশন সম্পন্ন করুন!</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
