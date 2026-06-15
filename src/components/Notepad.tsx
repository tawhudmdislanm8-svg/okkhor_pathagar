import React, { useState, useEffect } from "react";
import { ListPlus, Trash2, Edit, Save, Eye, Search, AlertCircle, RefreshCw, FileText, AlertTriangle } from "lucide-react";
import { Note } from "../types";
import { apiClient } from "../api";

interface NotepadProps {
  onPreviewNote: (note: Note) => void;
}

export default function Notepad({ onPreviewNote }: NotepadProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  
  // Adding Note forms
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // Editing Note forms
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [formErr, setFormErr] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await apiClient.get("/notes");
      setNotes(data);
      if (data.length > 0 && !activeNote) {
        selectNote(data[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "নোট লোড করা সম্ভব হয়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const selectNote = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setFormErr("");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr("");
    if (!newTitle.trim()) {
      setFormErr("শিরোনাম দিতে হবে!");
      return;
    }

    try {
      const created = await apiClient.post("/notes", {
        title: newTitle.trim(),
        content: newContent.trim(),
      });
      setNewTitle("");
      setNewContent("");
      setIsNewOpen(false);
      
      // Reload lists and select
      const freshList = await apiClient.get("/notes");
      setNotes(freshList);
      selectNote(created);
    } catch (err: any) {
      setFormErr(err.message || "নোট তৈরি ব্যর্থ হয়েছে।");
    }
  };

  const handleUpdateSubmit = async () => {
    if (!activeNote) return;
    setFormErr("");
    if (!editTitle.trim()) {
      setFormErr("নোটের শিরোনাম আবশ্যক!");
      return;
    }

    try {
      const updated = await apiClient.put(`/notes/${activeNote.id}`, {
        title: editTitle.trim(),
        content: editContent,
      });
      // Refresh list
      const freshList = await apiClient.get("/notes");
      setNotes(freshList);
      // Keep selected
      setActiveNote(updated);
      setFormErr("সফলভাবে আপডেট করা হয়েছে!");
      setTimeout(() => setFormErr(""), 2000);
    } catch (err: any) {
      setFormErr(err.message || "আপডেট করা যায়নি।");
    }
  };

  const handleDeleteNote = async (id: string, name: string) => {
    setShowDeleteConfirm(true);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">৬. নোটপ্যাড ও গুরুত্বপূর্ণ স্মারকসমূহ</h2>
          <p className="text-xs text-slate-400">পাঠাগার পরিচালনার সুবিধার্থে যেকোনো প্রয়োজনীয় নোটিশ, সভার আলোচনা বা করণীয় তালিকা লিখে রাখুন</p>
        </div>
        <button
          onClick={() => {
            setNewTitle("");
            setNewContent("");
            setFormErr("");
            setIsNewOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/15 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ListPlus size={14} />
          নতুন নোট তৈরি করুন
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left pane: search and notes list */}
        <div className="col-span-1 md:col-span-4 glass-panel p-4 rounded-xl border border-purple-500/10 space-y-4 max-h-[85vh] flex flex-col">
          <div className="relative shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="নোট খুঁজুন..."
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-purple-500/15 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {loading ? (
              <p className="text-center text-xs text-slate-500 py-6">লোড হচ্ছে...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6 font-mono">নোট খালি।</p>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote && activeNote.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-100 ${isSelected ? "bg-purple-950/20 border-purple-500/50" : "bg-slate-900/30 border-purple-500/5 hover:border-cyan-500/20"}`}
                  >
                    <h4 className="font-bold text-white text-xs sm:text-sm truncate">{note.title}</h4>
                    <p className="text-slate-400 text-[10px] truncate mt-1">{note.content || "(ফ্রি টেক্সট নোটপ্যাড)"}</p>
                    <p className="text-[9px] text-slate-500 font-mono text-right mt-1.5">{note.updatedAt.split(" ")[0]}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: notepad visual editor window */}
        <div className="col-span-1 md:col-span-8 glass-panel-cyan p-5 rounded-xl border border-cyan-500/10 flex flex-col justify-between min-h-[50vh]">
          
          {!activeNote ? (
            <div className="py-24 text-center text-slate-500 text-xs flex-1">
              ডানদিকের প্যানেলে নোট সম্পাদনা করতে বাম পাশের স্মারক তালিকায় ক্লিক করুন।
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3 shrink-0">
                  <div className="flex-1 mr-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full font-bold text-white bg-transparent border-none p-1 text-base focus:outline-none focus:ring-1 focus:ring-cyan-400/20 rounded"
                    />
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => onPreviewNote(activeNote)}
                      className="p-1.5 bg-slate-950/60 ring-1 ring-cyan-500/10 text-cyan-400 hover:text-cyan-300 rounded cursor-pointer"
                      title="👁 চোখের প্রাকদর্শন স্লিপ ও PDF"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(activeNote.id, activeNote.title)}
                      className="p-1.5 bg-slate-950/60 ring-1 ring-red-500/10 text-red-400 hover:text-red-300 rounded cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {formErr && (
                  <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 shrink-0 ${formErr.includes("সফল") ? "bg-emerald-950/40 border border-emerald-500/20 text-emerald-400" : "bg-red-950/40 border border-red-500/20 text-red-400"}`}>
                    <AlertCircle size={13} />
                    <span>{formErr}</span>
                  </div>
                )}

                <div className="flex-1 py-1">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="নোটের টেক্সট পরিবর্তন ও পরিমার্জন করুন..."
                    className="w-full h-72 p-3 bg-slate-950/60 rounded-xl border border-cyan-500/10 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-cyan-500/5 pt-3 shrink-0">
                <span>শেষ পরিবর্তন: {activeNote.updatedAt}</span>
                <button
                  type="button"
                  onClick={handleUpdateSubmit}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-lg text-xs font-bold hover:from-cyan-700 hover:to-teal-600 cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-600/15"
                >
                  <Save size={13} />
                  পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* CREATE NEW NOTE MODAL */}
      {isNewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-purple-500/25 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-120">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={18} className="text-purple-400" />
              স্মার্ট নোটপ্যাডে নতুন নোট তৈরি
            </h3>
            
            {formErr && (
              <div className="bg-red-950/55 border border-red-500/35 p-3 rounded-lg text-xs text-red-400 mb-3 flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{formErr}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">নোটের প্রধান শিরোনাম *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="যেমন: নতুন তালিকা বইয়ের ঘাটতি"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">বিস্তারিত বিবরণ লিখুন (বাংলা ইউনিকোড)</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="এখানে আপনার মনের মতো সাজিয়ে সভার বিবরণ, পরিকল্পনা বা গুরুত্বপূর্ণ কাজের নোট লিখুন..."
                  className="w-full text-xs p-2.5 h-44 bg-slate-950 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="px-4 py-2 bg-slate-900 border text-slate-400 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-purple-700 hover:to-indigo-700 cursor-pointer"
                >
                  তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && activeNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b0f1a] border border-red-500/25 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-120 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={18} />
              নোট মুছে ফেলার সতর্কতা
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <span className="font-bold text-white">'{activeNote.title}'</span> নোটটি সম্পূর্ণ মুছে ফেলতে চান? এই পরিবর্তনটি আর ফিরে পাওয়া যাবে না।
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiClient.delete(`/notes/${activeNote.id}`);
                    setActiveNote(null);
                    setShowDeleteConfirm(false);
                    fetchNotes();
                  } catch (err: any) {
                    setFormErr(err.message || "ডিলিট করা যায়নি।");
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
