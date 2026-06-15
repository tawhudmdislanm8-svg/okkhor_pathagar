import React from "react";
import { X, Printer } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dataType: "book" | "member" | "transaction" | "wishlist" | "note" | "history_list" | "books_list" | "members_list" | "general";
  data: any;
}

export default function PreviewModal({ isOpen, onClose, title, dataType, data }: PreviewModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("print-area")?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback if window.open is blocked by browser policies in iframe
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Hind Siliguri', sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #5b21b6;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo-title {
              font-size: 28px;
              color: #5b21b6;
              font-weight: 700;
              margin: 0;
            }
            .sub-title {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            /* Colors matching the colorful website design */
            .bg-gradient-header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
              color: white !important;
            }
            .bg-gradient-header-cyan {
              background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%) !important;
              color: white !important;
            }
            .heading {
              font-size: 20px;
              font-weight: 600;
              color: #111;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .field-grid {
              display: grid;
              grid-template-columns: 140px 1fr;
              row-gap: 12px;
              font-size: 15px;
              margin-bottom: 20px;
            }
            .field-name {
              font-weight: 600;
              color: #555;
            }
            .field-value {
              color: #111;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .table th, .table td {
              border: 1px solid #e2e8f0;
              padding: 12px 10px;
              text-align: left;
              font-size: 13px;
            }
            .table th {
              font-weight: 700;
            }
            .table-striped tbody tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              font-size: 12px;
              border-radius: 4px;
              font-weight: 500;
            }
            .badge-success { background: #d1fae5 !important; color: #065f46 !important; border: 1px solid #a7f3d0 !important; }
            .badge-danger { background: #fee2e2 !important; color: #991b1b !important; border: 1px solid #fecaca !important; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo-title">অক্ষর পাঠাগার (Akkhor Pathagar)</h1>
            <p class="sub-title">একটি আধুনিক ও সুরক্ষিত লাইব্রেরি ম্যানেজমেন্ট সিস্টেম</p>
          </div>
          <div>
            ${printContent}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} অক্ষর পাঠাগার। হেল্পলাইন: 01333474848</p>
            <p>স্লিপটি সিস্টেম ড্যাশবোর্ড থেকে স্বয়ংক্রিয়ভাবে তৈরি হয়েছে।</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Render HTML structure based on type
  const renderPreviewContent = () => {
    switch (dataType) {
      case "book":
        return (
          <div className="text-slate-800">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2 mb-4">বইয়ের বিবরণ স্লিপ</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-36 h-48 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                <img 
                  src={data.imageUrl && data.imageUrl.trim() ? data.imageUrl : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400"} 
                  alt={data.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-3 border-b border-dashed pb-2">
                  <span className="font-semibold text-slate-500 text-sm">বই কোড</span>
                  <span className="col-span-2 font-mono font-semibold text-purple-700 text-base">{data.code}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-dashed pb-2">
                  <span className="font-semibold text-slate-500 text-sm">বইয়ের নাম</span>
                  <span className="col-span-2 font-bold text-slate-900">{data.name}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-dashed pb-2">
                  <span className="font-semibold text-slate-500 text-sm">লেখক</span>
                  <span className="col-span-2 text-slate-800">{data.author}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-dashed pb-2">
                  <span className="font-semibold text-slate-500 text-sm">প্রকাশনা</span>
                  <span className="col-span-2 text-slate-800">{data.publisher}</span>
                </div>
                <div className="grid grid-cols-3 border-b border-dashed pb-2">
                  <span className="font-semibold text-slate-500 text-sm">বর্তমান স্ট্যাটাস</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${data.status === "Available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {data.status === "Available" ? "Available" : "Issued"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case "member":
        return (
          <div className="text-slate-800 space-y-4">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2">গ্রাহক সদস্য কার্ড</h2>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-400 font-semibold">সদস্যের নাম</p>
                <p className="text-base font-bold text-slate-900">{data.member.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">ফরম নম্বর (ID)</p>
                <p className="text-base font-bold text-purple-700 font-mono">#{data.member.formNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">মোবাইল নম্বর</p>
                <p className="text-sm text-slate-800 font-mono">{data.member.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">ঠিকানা</p>
                <p className="text-sm text-slate-800">{data.member.address}</p>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-700 mb-2">মোট ট্রানজেকশন তথ্য: {data.rentCount} বার বই নিয়েছে</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2 bg-white">
                {data.activeRents?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-red-600 mb-1">বর্তমানে নেওয়া বই (Issued)</h4>
                    {data.activeRents.map((r: any) => (
                      <div key={r.id} className="text-xs bg-red-50 text-red-800 p-2 rounded mb-1 border border-red-100">
                        <p className="font-bold">{r.bookName} ({r.bookCode})</p>
                        <p>ইস্যু: {r.issueDate} / ফেরত দেওয়ার শেষ তারিখ: {r.returnDate}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-green-700 mb-1">ফেরত নেওয়া বইয়ের ইতিহাস ({data.returnedHistory?.length})</h4>
                  {data.returnedHistory?.length === 0 ? (
                    <p className="text-xs text-slate-400">ইতিপূর্বে কোনো বই ফেরত দেওয়ার হিস্ট্রি নেই।</p>
                  ) : (
                    data.returnedHistory.map((r: any) => (
                      <div key={r.id} className="text-xs bg-slate-50 text-slate-700 p-2 rounded mb-1 border">
                        <p className="font-semibold">{r.bookName} ({r.bookCode})</p>
                        <p>ইস্যু: {r.issueDate} / সমর্পণ: {r.returnedAt || r.returnDate}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "transaction":
        return (
          <div className="text-slate-800 space-y-4">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2 text-center text-purple-800">বই ইস্যু ও রিটার্ন স্লিপ</h2>
            
            <div className="border border-dashed border-slate-300 p-4 space-y-3 bg-indigo-50/20 rounded-lg">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div><span className="font-semibold text-slate-500">লেনদেন আইডি:</span> <span className="font-mono text-xs">{data.id}</span></div>
                <div className="text-right"><span className="font-semibold text-slate-500">অবস্থা:</span> <span className={`px-2 py-0.5 rounded text-xs font-semibold ${data.status === "Issued" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{data.status === "Issued" ? "Issued (চলমান)" : "Returned (ফেরত)"}</span></div>
                
                <div className="col-span-2 border-t border-slate-200 my-2"></div>
                
                <div className="col-span-2 font-bold text-indigo-900 border-b pb-1">বইয়ের তথ্য</div>
                <div><span className="font-semibold text-slate-500">বই কোড:</span> <span className="font-mono text-purple-700">{data.bookCode}</span></div>
                <div><span className="font-semibold text-slate-500">বইয়ের নাম:</span> <span className="font-bold">{data.bookName}</span></div>
                <div><span className="font-semibold text-slate-500">লেখক:</span> <span>{data.author || "-"}</span></div>
                <div><span className="font-semibold text-slate-500">প্রকাশক:</span> <span>{data.publisher || "-"}</span></div>

                <div className="col-span-2 border-t border-slate-200 my-2"></div>
                
                <div className="col-span-2 font-bold text-indigo-900 border-b pb-1">সদস্যের তথ্য</div>
                <div><span className="font-semibold text-slate-500">সদস্যের নাম:</span> <span className="font-bold">{data.memberName}</span></div>
                <div><span className="font-semibold text-slate-500">ফরম নম্বর (ID):</span> <span className="font-mono text-purple-700">#{data.formNumber}</span></div>
                <div><span className="font-semibold text-slate-500">মোবাইল:</span> <span className="font-mono">{data.mobile}</span></div>
                <div><span className="font-semibold text-slate-500">ঠিকানা:</span> <span>{data.address || "-"}</span></div>

                <div className="col-span-2 border-t border-slate-200 my-2"></div>
                
                <div className="col-span-2 font-bold text-indigo-900 border-b pb-1 font-mono">সময়সীমা</div>
                <div><span className="font-semibold text-slate-500">ইস্যু ডেট:</span> <span className="font-bold font-mono text-green-700">{data.issueDate}</span></div>
                <div><span className="font-semibold text-slate-500">ফেরত শেষ দিন:</span> <span className="font-bold font-mono text-red-700">{data.returnDate}</span></div>
                {data.returnedAt && (
                  <div><span className="font-semibold text-slate-500">আসল ফেরত দিন:</span> <span className="font-bold font-mono text-purple-700">{data.returnedAt}</span></div>
                )}
              </div>

              {data.extensionHistory?.length > 0 && (
                <div className="top-dotted-border pt-2">
                  <p className="text-xs font-bold text-indigo-800">সময় এক্সটেনশন হিস্ট্রি:</p>
                  {data.extensionHistory.map((h: any, i: number) => (
                    <p key={i} className="text-xs text-slate-600">● {h.date}: {h.payload}</p>
                  ))}
                </div>
              )}

              {data.comments?.length > 0 && (
                <div className="top-dotted-border pt-2">
                  <p className="text-xs font-bold text-indigo-800">অ্যাডমিন নোট / মন্তব্য:</p>
                  {data.comments.map((c: string, i: number) => (
                    <p key={i} className="text-xs text-slate-600">● {c}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "wishlist":
        return (
          <div className="text-slate-800 space-y-4">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2">উইশলিস্ট বই স্লিপ</h2>
            <div className="border p-4 bg-purple-50 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold">বইয়ের নাম (ইচ্ছাতালিকা)</p>
                <p className="text-lg font-bold text-purple-900">{data.name}</p>
              </div>
              {data.author && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold">লেখক</p>
                  <p className="text-sm font-semibold">{data.author}</p>
                </div>
              )}
              {data.publisher && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold">প্রকাশনা</p>
                  <p className="text-sm">{data.publisher}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 font-semibold">সংরক্ষণের তারিখ</p>
                <p className="text-xs font-mono text-slate-500">{data.createdAt}</p>
              </div>
            </div>
          </div>
        );

      case "note":
        return (
          <div className="text-slate-800 space-y-4">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2">{data.title}</h2>
            <div className="border p-4 bg-amber-50/50 rounded-lg whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-sans border-amber-200">
              {data.content}
            </div>
            <div className="text-right text-xs text-slate-400">
              নতুন সংস্করণ: {data.updatedAt || data.createdAt}
            </div>
          </div>
        );

      case "history_list":
        return (
          <div className="text-slate-800">
            <h2 className="text-xl font-bold border-b border-purple-200 pb-2 mb-4">অডিট ট্রেইল ইতিহাস তালিকা</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2 text-left font-bold font-sans">তারিখ ও সময়</th>
                  <th className="border p-2 text-left font-bold font-sans">পরিবর্তন একশন</th>
                  <th className="border p-2 text-left font-bold font-sans">বিস্তারিত বিবরণ</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any) => (
                  <tr key={item.id}>
                    <td className="border p-2 font-mono">{item.timestamp}</td>
                    <td className="border p-2 font-bold text-purple-800">{item.action}</td>
                    <td className="border p-2">{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "books_list":
        return (
          <div className="text-slate-800">
            <div className="flex justify-between items-center bg-gradient-to-r from-purple-800 to-indigo-800 text-white p-4 rounded-xl mb-6 shadow">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-sans">লাইব্রেরির সর্বমোট বই ক্যাটালগ (All Books Catalogue)</h2>
                <p className="text-xs text-purple-100 mt-1">অক্ষর পাঠাগার নিবন্ধিত বইয়ের তালিকা ও মজুদ চিত্র</p>
              </div>
              <div className="bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full font-mono shrink-0">
                মোট বই: {data.length} টি
              </div>
            </div>
            <table className="table table-striped w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gradient-header">
                  <th className="border border-purple-200/50 p-2.5 text-left font-bold">বই কোড</th>
                  <th className="border border-purple-200/50 p-2.5 text-left font-bold">বইয়ের নাম</th>
                  <th className="border border-purple-200/50 p-2.5 text-left font-bold">লেখক</th>
                  <th className="border border-purple-200/50 p-2.5 text-left font-bold">প্রকাশনা</th>
                  <th className="border border-purple-200/50 p-2.5 text-center font-bold">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="border border-purple-100 p-2.5 font-mono font-bold text-purple-800">{item.code}</td>
                    <td className="border border-purple-100 p-2.5 font-bold text-slate-900">{item.name}</td>
                    <td className="border border-purple-100 p-2.5 text-slate-700">{item.author}</td>
                    <td className="border border-purple-100 p-2.5 text-slate-500">{item.publisher || "অজ্ঞাত"}</td>
                    <td className="border border-purple-100 p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${item.status === "Available" ? "badge-success" : "badge-danger"}`}>
                        {item.status === "Available" ? "মজুদ আছে" : "ধারকৃত (Issued)"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "members_list":
        return (
          <div className="text-slate-800">
            <div className="flex justify-between items-center bg-gradient-to-r from-cyan-800 to-blue-800 text-white p-4 rounded-xl mb-6 shadow">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-sans">নিবন্ধিত লাইব্রেরি সদস্য তালিকা (Library Members Directory)</h2>
                <p className="text-xs text-cyan-500 mt-1">অক্ষর পাঠাগার নিবন্ধিত সদস্যবৃন্দ ও যোগাযোগের বিবরণী</p>
              </div>
              <div className="bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full font-mono shrink-0">
                মোট মেম্বার: {data.length} জন
              </div>
            </div>
            <table className="table table-striped w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gradient-header-cyan">
                  <th className="border border-cyan-200/50 p-2.5 text-left font-bold">ফরম আইডি (ID)</th>
                  <th className="border border-cyan-200/50 p-2.5 text-left font-bold">সদস্যের নাম</th>
                  <th className="border border-cyan-200/50 p-2.5 text-left font-bold font-mono">মোবাইল নম্বর</th>
                  <th className="border border-cyan-200/50 p-2.5 text-left font-bold">ঠিকানা</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="border border-cyan-100 p-2.5 font-mono font-bold text-cyan-800">#{item.formNumber}</td>
                    <td className="border border-cyan-100 p-2.5 font-bold text-slate-900">{item.name}</td>
                    <td className="border border-cyan-100 p-2.5 font-mono text-slate-700">{item.mobile}</td>
                    <td className="border border-cyan-100 p-2.5 text-slate-500">{item.address || "অজ্ঞাত ঠিকানা"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="text-slate-800">
            <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Printable visual frame */}
          <div id="print-area">
            {renderPreviewContent()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-sm font-semibold"
          >
            বন্ধ করুন
          </button>
          
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors shadow-lg cursor-pointer flex items-center gap-2 text-sm font-semibold shadow-purple-600/20"
          >
            <Printer size={16} />
            PDF ডাউনলোড / প্রিন্ট
          </button>
        </div>

      </div>
    </div>
  );
}
