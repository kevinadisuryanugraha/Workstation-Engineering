import React, { useState } from "react";
import { MarkdownView } from "./ui/MarkdownView";
import { motion, AnimatePresence } from "motion/react";
import {
  Code2,
  BookOpen,
  Search,
  Copy,
  Check,
  ChevronRight,
  Database,
  Shield,
  Layers,
  FileText,
  Download,
  Share2
} from "lucide-react";
import { blueprintSections, BlueprintSection } from "../blueprintData";
import { KokonutCard } from "./ui/KokonutCard";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

export const BlueprintView: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<BlueprintSection>(blueprintSections[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copied, setCopied] = useState(false);

  const categories = ["ALL", "Strategy & Arch", "Data & Workflow", "Systems & Security", "Delivery & Plan"];

  const filteredSections = blueprintSections.filter((sec) => {
    const matchesSearch =
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.number.includes(searchQuery);
    const matchesCategory = selectedCategory === "ALL" || sec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyContent = () => {
    navigator.clipboard.writeText(selectedSection.contentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFullBlueprint = () => {
    const fullDoc = blueprintSections
      .map((s) => `# SECTION ${s.number}: ${s.title}\nCategory: ${s.category}\n\n${s.contentMarkdown}\n\n---\n`)
      .join("\n");
    const blob = new Blob([fullDoc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "WORKSTATION_MASTER_PRD_TECHNICAL_SPEC_01-21.md";
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <KokonutCard variant="default" className="p-5" interactive={false}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan" size="sm" dot>
                Engineering Blueprint Hub
              </Badge>
              <span className="text-xs text-slate-600 font-mono font-bold">Sections 01 — 21 Full Specification</span>
            </div>
            <h1 className="text-lg sm:text-xl font-mono font-black text-slate-950 tracking-tight">
              Technical Architecture, Database Schema (ERD), Protocols & Workflows
            </h1>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Comprehensive architectural specifications: REST API backend schemas, trust models, and agent daemons.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportFullBlueprint}
              className="px-3.5 py-2 rounded-xl bg-[#2ec4b6] hover:bg-[#25ad9f] text-xs font-mono font-bold text-slate-950 border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5 transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export Complete Specs (MD)</span>
            </motion.button>
          </div>
        </div>
      </KokonutCard>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] p-2.5 rounded-xl">
        <div className="flex items-center flex-nowrap shrink-0 overflow-x-auto bg-white p-1 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#18181b]">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "relative px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors outline-none cursor-pointer whitespace-nowrap",
                  isActive ? "text-slate-950" : "text-slate-600 hover:text-slate-950"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="blueprint-cat-pill"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-[#dcfce7] border border-emerald-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-600" />
          <input
            type="text"
            placeholder="Search specs (e.g. ERD, Agent)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#FAF7EE] text-xs text-slate-950 pl-8 pr-3 py-1.5 rounded-xl border-2 border-slate-900 focus:outline-none w-full font-mono font-semibold"
                aria-label="Search specs (e.g. ERD, Agent)"
              />
        </div>
      </div>

      {/* Split Grid: Left 21 Sections Navigator, Right Markdown Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sections List */}
        <KokonutCard variant="default" className="p-0 overflow-hidden max-h-[750px] flex flex-col" interactive={false}>
          <div className="p-3.5 border-b border-slate-900/20 bg-[#FAF7EE] flex items-center justify-between text-xs font-black text-slate-950 uppercase tracking-wider font-mono">
            <span>Sections (01–21)</span>
            <Badge variant="success" size="sm">
              {filteredSections.length} Items
            </Badge>
          </div>

          <div className="divide-y divide-slate-900/10 overflow-y-auto">
            {filteredSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec)}
                className={cn(
                  "w-full p-3.5 text-left transition-colors flex items-start justify-between gap-2 relative cursor-pointer",
                  selectedSection.id === sec.id
                    ? "bg-[#e0e7ff] text-slate-950 border-l-4 border-l-indigo-600"
                    : "hover:bg-[#FAF7EE] text-slate-600 hover:text-slate-950"
                )}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-950 border border-slate-900">
                      {sec.number}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-950 line-clamp-1">{sec.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-mono font-medium">{sec.summary}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </KokonutCard>

        {/* Right 2 Columns: Full Markdown Inspector */}
        <KokonutCard variant="default" className="lg:col-span-2 p-6 space-y-4" interactive={false}>
          <div className="flex items-center justify-between border-b border-slate-900/20 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan" size="sm">
                  SECTION {selectedSection.number}
                </Badge>
                <span className="text-xs text-slate-600 font-mono font-bold">{selectedSection.category}</span>
              </div>
              <h2 className="text-base font-mono font-black text-slate-950">{selectedSection.title}</h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyContent}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 border-2 border-slate-900 shadow-[2px_2px_0px_#18181b] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-800 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Spec"}</span>
            </motion.button>
          </div>

          {/* Rendered content */}
          <MarkdownView
            content={selectedSection.contentMarkdown}
            className="max-w-none text-xs leading-relaxed text-slate-950 bg-[#FAF7EE] p-5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#18181b]"
          />
        </KokonutCard>
      </div>
    </div>
  );
};
