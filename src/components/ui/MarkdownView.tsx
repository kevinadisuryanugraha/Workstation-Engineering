import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../../lib/utils";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

/**
 * UI-Audit H-1 — renderer markdown untuk laporan & spesifikasi.
 * Mengganti render `<pre>` polos yang menampilkan sintaks `#`/`**` mentah.
 * Styling via `.md-view` di src/index.css (sesuai design system retro).
 */
export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className }) => (
  <div className={cn("md-view", className)}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);
