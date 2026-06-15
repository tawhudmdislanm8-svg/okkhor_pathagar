import React from "react";
import { BookOpen, CheckCircle, ShieldAlert, Award, FileSpreadsheet, Users, RefreshCw, Send } from "lucide-react";
import { DashboardData } from "../types";

interface DashboardProps {
  data: DashboardData | null;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  onPostSmsCheck: () => void;
}

export default function Dashboard({ data, onRefresh, onNavigate, onPostSmsCheck }: DashboardProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="animate-spin text-purple-400 mb-4 h-10 w-10" />
        <span className="text-slate-400 font-semibold font-sans">ড্যাশবোর্ড লোড হচ্ছে...</span>
      </div>
    );
  }

  const { stats, charts } = data;

  // Maximum issues for normalizer mapping
  const maxIssuesInChart = Math.max(...charts.monthlyReport.map(item => Math.max(item.issues, item.returns, 1)));

  // SVG Chart calculation parameters
  const chartHeight = 160;
  const paddingBottom = 25;
  const listCount = charts.monthlyReport.length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Title and Sync Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">পেশাদার ড্যাশবোর্ড</span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">পাঠাগার পরিচালনার রিয়েল-টাইম পরিমাপক পরিসংখ্যান</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onPostSmsCheck}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold ring-1 ring-purple-500/20 bg-purple-900/20 text-purple-300 rounded-lg hover:bg-purple-950/40 cursor-pointer transition-colors"
          >
            <Send size={14} />
            অবিলম্বে SMS শিডিউল সিঙ্ক
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-purple-500/10 hover:border-cyan-500/25 cursor-pointer text-slate-300 hover:text-cyan-400 transition-all"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Desk */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Total books card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 p-6 bg-purple-500/5 rotate-12 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">মোট বই সংখ্যা</span>
            <BookOpen size={18} className="text-purple-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white font-mono">{stats.totalBooks}</h3>
            <p className="text-[10px] text-cyan-400 mt-1 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate("books")}>তালিকা দেখুন →</p>
          </div>
        </div>

        {/* Available books card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Available বই</span>
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-400 font-mono">{stats.availableBooks}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">তাত্ক্ষণিক লেনদেন যোগ্য</p>
          </div>
        </div>

        {/* Issued card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Issued বই</span>
            <BookOpen size={18} className="text-cyan-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-cyan-400 font-mono">{stats.issuedBooks}</h3>
            <p className="text-[10px] text-cyan-400 mt-1 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate("issue")}>রিটার্ন গ্রহণ করুন →</p>
          </div>
        </div>

        {/* Late Returns card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-red-500/30 transition-all border-red-500/10">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">Late বই (Overdue)</span>
            <ShieldAlert size={18} className="text-red-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-red-500 font-mono">{stats.lateBooks}</h3>
            <p className="text-[10px] text-red-400 mt-1 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate("sms")}>সতর্কতা প্রেরণ →</p>
          </div>
        </div>

        {/* Today's Transactions card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">আজকের লেনদেন</span>
            <FileSpreadsheet size={18} className="text-orange-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white font-mono">{stats.todaysTransactions}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate("history")}>লগ হিস্ট্রি →</p>
          </div>
        </div>

        {/* Total Members card */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-medium">মোট সদস্য সংখ্যা</span>
            <Users size={18} className="text-amber-400" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white font-mono">{stats.totalMembers}</h3>
            <p className="text-[10px] text-amber-300 mt-1 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate("members")}>সদস্য প্যানেল →</p>
          </div>
        </div>

      </div>

      {/* 3. Deep Analytic Charts Layout (Custom Responsive SVG Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Chart A: Monthly issue/returns */}
        <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-base font-bold text-white">মাসভিত্তিক বই লেনদেন</h3>
              <p className="text-slate-400 text-[11px]">বিগত ৬ মাসের বই ইস্যু এবং জমা রেকর্ডের তুলনামূলক রেখাচিত্র</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 font-sans">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>ইস্যু
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 ml-1"></span>ফিরতি
            </div>
          </div>

          <div className="w-full relative py-2">
            {charts.monthlyReport.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-500 text-xs">কোনো ডাটা পাওয়া যায়নি।</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  {/* Dynamic Custom Chart with interactive SVG layout */}
                  <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-44 overflow-visible font-sans">
                    {/* Horizontal lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const yVal = chartHeight - paddingBottom - ratio * (chartHeight - paddingBottom - 10);
                      const num = Math.round(ratio * maxIssuesInChart);
                      return (
                        <g key={i} className="opacity-40">
                          <line x1="40" y1={yVal} x2="480" y2={yVal} stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />
                          <text x="32" y={yVal + 3} fill="#94a3b8" fontSize="9" textAnchor="end">{num}</text>
                        </g>
                      );
                    })}

                    {/* Rendering double bars side by side */}
                    {charts.monthlyReport.map((item, idx) => {
                      const colWidth = 440 / listCount;
                      const xBase = 50 + idx * colWidth + colWidth / 4;
                      
                      const barWidth = 12;
                      const issueBarHeight = ((item.issues || 0) / maxIssuesInChart) * (chartHeight - paddingBottom - 20);
                      const returnBarHeight = ((item.returns || 0) / maxIssuesInChart) * (chartHeight - paddingBottom - 20);

                      const issueY = chartHeight - paddingBottom - issueBarHeight;
                      const returnY = chartHeight - paddingBottom - returnBarHeight;

                      return (
                        <g key={idx} className="group">
                          {/* Issue bar */}
                          <rect
                            x={xBase - barWidth}
                            y={issueY}
                            width={barWidth}
                            height={Math.max(issueBarHeight, 2)}
                            fill="url(#purpleGlowGrd)"
                            rx="2"
                            className="transition-all duration-300 hover:brightness-125"
                          />
                          {/* Return bar */}
                          <rect
                            x={xBase + 2}
                            y={returnY}
                            width={barWidth}
                            height={Math.max(returnBarHeight, 2)}
                            fill="url(#cyanGlowGrd)"
                            rx="2"
                            className="transition-all duration-300 hover:brightness-125"
                          />
                          {/* Hover tooltip hint labels */}
                          <text x={xBase} y={Math.min(issueY, returnY) - 5} fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle" className="hidden group-hover:block">
                            ই:{item.issues} / ফে:{item.returns}
                          </text>
                          {/* Label bottom */}
                          <text x={xBase} y={chartHeight - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="500">
                            {item.month}
                          </text>
                        </g>
                      );
                    })}

                    <defs>
                      <linearGradient id="purpleGlowGrd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id="cyanGlowGrd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Popular Books and Active Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Popular books */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award size={15} className="text-cyan-400" />
                সবচেয়ে জনপ্রিয় বইসমূহ
              </h3>
              {charts.popularBooks.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-6">কোনো বুক ট্রানজেকশন হিস্ট্রি নেই।</p>
              ) : (
                <div className="space-y-3">
                  {charts.popularBooks.map((item, i) => {
                    const topCount = charts.popularBooks[0]?.count || 1;
                    const pct = (item.count / topCount) * 100;
                    return (
                      <div key={item.code} className="group cursor-pointer" onClick={() => onNavigate("search-smart")}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-300 truncate max-w-[120px]">{item.name}</span>
                          <span className="text-cyan-400 font-bold font-mono">{item.count} বার</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-930 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active members */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award size={15} className="text-purple-400" />
                সবচেয়ে সক্রিয় পাঠক সদস্য
              </h3>
              {charts.activeMembers.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-6">কোনো সদস্য লিজ ইতিহাস পাওয়া যায়নি।</p>
              ) : (
                <div className="space-y-3">
                  {charts.activeMembers.map((item, i) => {
                    const topCount = charts.activeMembers[0]?.count || 1;
                    const pct = (item.count / topCount) * 100;
                    return (
                      <div key={item.formNumber} className="group cursor-pointer hover:bg-white/5 p-1 rounded" onClick={() => onNavigate("members")}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-300 truncate max-w-[120px]">{item.name}</span>
                          <span className="text-purple-400 font-bold font-mono">#{item.formNumber} ({item.count})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-930 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-400 to-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. Display list of overdue loans */}
      <div className="glass-panel p-5 rounded-2xl border border-red-500/10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-red-500"></span>
              অপ্রদত্ত ও মেয়াদোত্তীর্ণ বই তালিকা (Late Returns)
            </h3>
            <p className="text-slate-400 text-[10px] mt-0.5">নিচের সদস্যদের বই জমা দেওয়ার সময়সীমা অতিবাহিত হয়েছে। তাদের SMS রিকল শিডিউল সচল আছে।</p>
          </div>
          <button
            onClick={() => onNavigate("sms")}
            className="text-xs text-cyan-400 hover:underline cursor-pointer font-semibold"
          >
            সতর্কীকরণ SMS প্যানেল →
          </button>
        </div>

        {charts.lateReportLoans.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">অসাধারণ! বর্তমানে কোনো মেয়াদোত্তীর্ণ বই পেন্ডিং নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-purple-500/10 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">বই বিবরণ</th>
                  <th className="py-2">সদস্য তথ্য</th>
                  <th className="py-2">মোবাইল নম্বর</th>
                  <th className="py-2 font-mono">নির্ধারিত সময়সীমা</th>
                  <th className="py-2">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/5">
                {charts.lateReportLoans.map(item => (
                  <tr key={item.id} className="hover:bg-red-500/5 duration-100">
                    <td className="py-2.5">
                      <p className="font-bold text-white">{item.bookName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.bookCode}</p>
                    </td>
                    <td className="py-2.5">
                      <p className="font-semibold text-purple-200">{item.memberName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">ফরম: #{item.formNumber}</p>
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">{item.mobile}</td>
                    <td className="py-2.5 text-red-400 font-bold font-mono">{item.returnDate}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-900/40 text-red-400 border border-red-500/20">
                        OVERDUE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
