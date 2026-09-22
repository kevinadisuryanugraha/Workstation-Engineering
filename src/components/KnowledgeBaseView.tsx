import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Search, Tag, ExternalLink, FileText, ArrowRight, X } from "lucide-react";
import { KnowledgeArticle } from "../types";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

interface KnowledgeBaseViewProps {
  articles: KnowledgeArticle[];
  isManagementView: boolean;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ articles, isManagementView }) => {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle>(articles[0]);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const renderArticleContent = () => {
    if (!selectedArticle) {
      return (
        <p className="text-sm text-slate-600 font-mono py-8 text-center">
          Pilih artikel di daftar untuk membaca runbook.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <div className="border-b-2 border-slate-900/10 pb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-mono font-bold flex-wrap gap-2">
            <span>Author: <strong className="text-slate-950">{selectedArticle.author}</strong></span>
            <span>Updated: {selectedArticle.lastUpdated}</span>
          </div>
          <h2 className="text-base sm:text-lg font-mono font-black text-slate-950">{selectedArticle.title}</h2>
          {selectedArticle.originTicketCode && (
            <Badge variant="success" size="sm" className="mt-2" dot>
              Originated from resolved ticket: {selectedArticle.originTicketCode}
            </Badge>
          )}
        </div>

        <div className="p-4 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] text-xs text-slate-950 leading-relaxed font-mono whitespace-pre-wrap">
          {selectedArticle.content}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <KokonutCard variant="default" className="p-4 sm:p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="cyan" size="sm" dot>
                Operational Knowledge Base
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Runbooks &amp; Incident Learnings</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
              Engineering Runbooks &amp; Post-Incident Solutions
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5 font-semibold">
              Resolved tickets automatically synthesize into verifiable runbooks so future incidents resolve in minutes.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search runbooks, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAF7EE] text-xs text-slate-950 pl-9 pr-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none font-mono font-semibold shadow-[2px_2px_0px_#18181b]"
              aria-label="Search runbooks, tags"
            />
          </div>
        </div>
      </KokonutCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Articles List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <KokonutCard variant="default" className="p-0 overflow-hidden rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] divide-y-2 divide-slate-900/10" interactive={false}>
            <div className="p-3.5 sm:p-4 border-b-2 border-slate-900 bg-[#FAF7EE] flex items-center justify-between">
              <span className="text-xs font-mono font-black text-slate-950 uppercase">
                Articles ({filtered.length})
              </span>
              <span className="text-[10px] font-mono text-slate-600 font-bold">Select to Read</span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-600">
                No matching runbooks found.
              </div>
            ) : (
              filtered.map((art) => (
                <motion.div
                  key={art.id}
                  whileHover={{ x: 2 }}
                  onClick={() => {
                    setSelectedArticle(art);
                    setShowMobileDrawer(true);
                  }}
                  className={cn(
                    "p-4 cursor-pointer transition-colors relative bg-white",
                    selectedArticle?.id === art.id
                      ? "bg-[#FAF7EE] border-l-4 border-l-indigo-600"
                      : "hover:bg-[#FAF7EE]"
                  )}
                >
                  <Badge variant="secondary" size="sm">
                    {art.category}
                  </Badge>
                  <h3 className="text-xs font-mono font-black text-slate-950 mt-2 leading-snug">{art.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {art.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-[#FAF7EE] text-slate-800 font-mono font-bold px-1.5 py-0.2 rounded border border-slate-900">
                        #{t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </KokonutCard>

          {/* Mobile active inspector bar */}
          {selectedArticle && (
            <div className="lg:hidden p-3 bg-[#FFFDF8] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Selected Runbook</span>
                <span className="text-xs font-mono font-black text-slate-950 truncate block">
                  {selectedArticle.title}
                </span>
              </div>
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="px-3 py-1.5 rounded-lg bg-[#2ec4b6] hover:bg-[#28ad9f] text-slate-950 border-2 border-slate-900 font-mono font-bold text-xs shadow-[1.5px_1.5px_0px_#18181b] shrink-0 active:translate-x-0.5 active:translate-y-0.5"
              >
                Read Runbook
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Article Reader (7 cols on lg, Desktop only) */}
        <div className="hidden lg:block lg:col-span-7">
          <KokonutCard variant="default" className="p-6 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#18181b] space-y-4" interactive={false}>
            {renderArticleContent()}
          </KokonutCard>
        </div>
      </div>

      {/* Mobile/Tablet Slide-Over Sheet Drawer */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end lg:hidden">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-[#FAF7EE] border-l-2 border-slate-900 p-4 sm:p-6 overflow-y-auto shadow-[-4px_0px_0px_#18181b] space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900/10">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
                  <h3 className="text-sm font-mono font-black text-slate-950">Runbook Reader</h3>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-lg border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 shadow-[1.5px_1.5px_0px_#18181b] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] p-4 sm:p-5">
                {renderArticleContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
