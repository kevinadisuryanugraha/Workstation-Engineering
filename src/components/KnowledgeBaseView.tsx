import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Search, Tag, ExternalLink, FileText, ArrowRight } from "lucide-react";
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

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm" dot>
                Operational Knowledge Base
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Runbooks & Incident Learnings</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Engineering Runbooks & Post-Incident Solutions
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Articles List */}
        <KokonutCard variant="default" className="p-0 overflow-hidden divide-y divide-slate-900/10" interactive={false}>
          {filtered.map((art) => (
            <motion.div
              key={art.id}
              whileHover={{ x: 2 }}
              onClick={() => setSelectedArticle(art)}
              className={cn(
                "p-4 cursor-pointer transition-colors relative bg-white",
                selectedArticle.id === art.id
                  ? "bg-[#e0e7ff] border-l-4 border-l-indigo-600"
                  : "hover:bg-[#FAF7EE]"
              )}
            >
              <Badge variant="secondary" size="sm">
                {art.category}
              </Badge>
              <h3 className="text-xs font-mono font-bold text-slate-950 mt-2 leading-snug">{art.title}</h3>
              <div className="flex flex-wrap gap-1 mt-2">
                {art.tags.map((t) => (
                  <span key={t} className="text-[10px] bg-[#FAF7EE] text-slate-800 font-mono font-bold px-1.5 py-0.2 rounded border border-slate-900">
                    #{t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </KokonutCard>

        {/* Right: Article Reader */}
        <KokonutCard variant="default" className="lg:col-span-2 p-6 space-y-4" interactive={false}>
          <div className="border-b border-slate-900/20 pb-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-mono font-bold">
              <span>Author: {selectedArticle.author}</span>
              <span>Updated: {selectedArticle.lastUpdated}</span>
            </div>
            <h2 className="text-base font-mono font-black text-slate-950">{selectedArticle.title}</h2>
            {selectedArticle.originTicketCode && (
              <Badge variant="success" size="sm" className="mt-2">
                Originated from resolved ticket: {selectedArticle.originTicketCode}
              </Badge>
            )}
          </div>

          <div className="p-4 bg-[#FAF7EE] rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] text-xs text-slate-950 leading-relaxed font-mono whitespace-pre-wrap">
            {selectedArticle.content}
          </div>
        </KokonutCard>
      </div>
    </div>
  );
};
