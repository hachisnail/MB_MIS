import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";

// TipTap extensions
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import CustomTextAlign from "../components/CustomTextAlign";
import TextStyle from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import Dropcursor from "@tiptap/extension-dropcursor";

// Your custom extensions
import { ColumnBlock, Column } from "../components/ColumBlock";
import FontSize from "../components/FontSize";
import CustomImage from "../components/CustomImage";

// Icons
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Columns as ColumnsIcon,
  Type as TypeIcon,
  List,
  ListOrdered,
  Highlighter as HighlighterIcon,
  Video as VideoIcon,
} from "lucide-react";

/**
 * Props:
 * - errors: { description?: string }
 * - setIsDirty: (bool) => void
 * - fontSizes: [{label, value}]
 * - onImageUpload: (event) => Promise<void> | void
 * - editable: boolean
 * - placeholder: string
 * - initialHTML?: string
 * - onUpdate?: ({ html, text }) => void
 */
const RichTextEditor = forwardRef(
  (
    {
      errors,
      setIsDirty,
      fontSizes,
      onImageUpload,
      editable = true,
      placeholder = "Start writing your article...",
      initialHTML = "",
      onUpdate,
    },
    ref
  ) => {
    const imageInputRef = useRef(null);

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        CustomTextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left","center","right","justify"] }),
        TextStyle,
        ColumnBlock,
        Column,
        FontSize,
        Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder }),
        Highlight,
        // 👇 Add a class hook to the YouTube iframe
        Youtube.configure({
          width: 640,      // doesn't matter; we clamp via CSS
          height: 360,
          allowFullscreen: true,
          HTMLAttributes: { class: "youtube-video" },
        }),
        Dropcursor.configure({ color: "blue", width: 2 }),
        CustomImage,
      ],
      content: initialHTML || "",
      editable,
      editorProps: {
        handleDrop(view, event, slice, moved) {
          if (moved) return false;
          const hasFiles = event.dataTransfer?.files?.length;
          if (!hasFiles) return false;
          const images = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
          if (images.length === 0) return false;
          if (onImageUpload) onImageUpload(event);
          return true;
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.state.doc.textContent || "";
        setIsDirty?.(true);
        onUpdate?.({ html, text });
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.state.doc.textContent || "",
      setContent: (html = "") => editor?.commands.setContent(html),
      focus: () => editor?.commands.focus(),
      runChain: (fn) => {
        if (!editor) return;
        const chain = editor.chain();
        fn(chain);
      },
    }));

    // --- helpers for columns (unchanged) ---
    const splitTextIntoNColumns = (text, n) => {
      const cleaned = (text || "").trim().replace(/\s+/g, " ");
      if (!cleaned) return Array.from({ length: n }, () => "");
      const words = cleaned.split(/\s+/);
      const totalChars = words.reduce((sum, w, i) => sum + w.length + (i === 0 ? 0 : 1), 0);
      let target = Math.ceil(totalChars / n);
      const chunks = [];
      let current = "";
      let curLen = 0;
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const add = (current ? " " : "") + w;
        if (curLen + add.length > target && chunks.length < n - 1) {
          chunks.push(current);
          current = w;
          curLen = w.length;
          const remainingTextLen =
            words.slice(i + 1).reduce((s, ww, j) => s + ww.length + (j === 0 ? 0 : 1), 0) + curLen;
          const colsLeft = n - chunks.length;
          target = Math.ceil(remainingTextLen / colsLeft);
        } else {
          current += add;
          curLen += add.length;
        }
      }
      chunks.push(current);
      while (chunks.length < n) chunks.push("");
      if (chunks.length > n) {
        const tail = chunks.splice(n - 1).join(" ");
        chunks[n - 1] = (chunks[n - 1] + " " + tail).trim();
      }
      return chunks;
    };

    const textToParagraphNodes = (text) => {
      const parts = (text || "")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return [{ type: "paragraph" }];
      return parts.map((p) => ({
        type: "paragraph",
        content: [{ type: "text", text: p }],
      }));
    };

    const distributeSelectionIntoColumns = (n) => {
      if (!editor) return;
      const { state } = editor;
      const { from, to, empty } = state.selection;
      if (empty || from === to) {
        const emptyColumns = Array.from({ length: n }, () => ({
          type: "column",
          content: [{ type: "paragraph" }],
        }));
        editor.chain().focus().insertContent({ type: "columnBlock", content: emptyColumns }).run();
        setIsDirty?.(true);
        return;
      }
      const selectedText = state.doc.textBetween(from, to, "\n\n", " ");
      const chunks = splitTextIntoNColumns(selectedText, n);
      const columnNodes = chunks.map((txt) => ({
        type: "column",
        content: textToParagraphNodes(txt),
      }));
      const columnBlockNode = { type: "columnBlock", content: columnNodes };
      editor.chain().focus().deleteRange({ from, to }).insertContent(columnBlockNode).run();
      setIsDirty?.(true);
    };

    return (
      <div className="space-y-2">
        <label className={`font-bold ${errors?.description ? "text-red-600" : ""}`}>
          Body {errors?.description && "*"}
        </label>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-[#d6c2ad] rounded border border-black-400">
          {/* Headings */}
          <div className="flex gap-1">
            {[1,2,3,4,5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor?.chain().focus().toggleHeading({ level }).run(); setIsDirty?.(true); }}
                className={`text-sm px-2 py-1 border rounded-sm ${editor?.isActive("heading", { level }) ? "bg-white" : ""}`}
              >
                H{level}
              </button>
            ))}
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Font Size + Highlight */}
          <div className="flex items-center gap-1">
            <TypeIcon size={16} className="text-gray-600" />
            <select
              onChange={(e) => { editor?.chain().focus().setFontSize(e.target.value).run(); setIsDirty?.(true); }}
              className="px-1 py-1 border rounded text-sm"
              defaultValue="1em"
            >
              {fontSizes.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor?.chain().focus().toggleHighlight().run(); setIsDirty?.(true); }}
              className={`p-1 border rounded ${editor?.isActive("highlight") ? "bg-white" : ""}`}
              title="Highlight"
            >
              <HighlighterIcon size={11} />
            </button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Bold / Underline / Italic */}
          <div className="flex gap-1 ml-2">
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleBold().run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("bold") ? "bg-white" : ""}`}><Bold size={16} /></button>
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleUnderline().run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("underline") ? "bg-white" : ""}`}><UnderlineIcon size={16} /></button>
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleItalic().run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("italic") ? "bg-white" : ""}`}><Italic size={16} /></button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Alignment */}
          <div className="flex gap-1">
            {[
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
              ["justify", AlignJustify],
            ].map(([dir, Icon]) => (
              <button
                key={dir}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); editor?.chain().focus().setTextAlign(dir).run(); setIsDirty?.(true); }}
                className={`p-1 border rounded ${editor?.isActive({ textAlign: dir }) ? "bg-white" : ""}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Columns */}
          <div className="flex gap-1">
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();distributeSelectionIntoColumns(2);}} className="p-1 border rounded" title="Split selection into 2 columns (or insert empty)">
              <ColumnsIcon size={16} />
            </button>
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();distributeSelectionIntoColumns(3);}} className="p-1 border rounded flex items-center justify-center" title="Split selection into 3 columns (or insert empty)">
              <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                <rect x="1" y="2" width="4" height="12" rx="1" fill="#555" />
                <rect x="7" y="2" width="4" height="12" rx="1" fill="#555" />
                <rect x="13" y="2" width="4" height="12" rx="1" fill="#555" />
              </svg>
            </button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Lists */}
          <div className="flex gap-1">
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleBulletList().run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("bulletList") ? "bg-white" : ""}`} title="Bullet List">
              <List size={18} />
            </button>
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleOrderedList().run();editor?.chain().focus().updateAttributes("orderedList", { class: "roman-list" }).run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("orderedList", { class: "roman-list" }) ? "bg-white" : ""}`} title="Roman List">
              <ListOrdered size={18} />
            </button>
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();editor?.chain().focus().toggleOrderedList().run();editor?.chain().focus().updateAttributes("orderedList", { class: "letter-list" }).run();setIsDirty?.(true);}} className={`p-1 border rounded ${editor?.isActive("orderedList", { class: "letter-list" }) ? "bg-white" : ""}`} title="Letter List">
              <ListOrdered size={18} />
            </button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Insert Image / YouTube */}
          <div className="flex gap-1">
            <button type="button" onClick={(e)=>{e.preventDefault();e.stopPropagation();imageInputRef.current?.click();}} className="p-1 border rounded" title="Insert Image">
              <ImageIcon size={16} />
            </button>
            <input type="file" ref={imageInputRef} onChange={onImageUpload} accept="image/*" className="hidden" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = prompt("Enter YouTube URL");
                if (url) {
                  editor?.chain().focus().setYoutubeVideo({ src: url }).run();
                  setIsDirty?.(true);
                }
              }}
              className="p-1 border rounded"
              title="Embed YouTube Video"
            >
              <VideoIcon size={18} />
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div
          className="
            border rounded p-4 min-h-[21.5rem] max-h-[21.5rem]
            sm:min-h-[10rem] sm:max-h-[5rem]
            md:min-h-[36.5rem] md:max-h-[36.5rem]
            lg:min-h-[36.5rem] lg:max-h-[36.5rem]
            xl:min-h-[36.6rem] xl:max-h-[36.6rem]
            2xl:min-h-[30rem] 2xl:max-h-[37rem]
            overflow-auto prose focus:outline-none

            /* 👇 Miniature YouTube in EDITOR (responsive clamps) */
            [&_.youtube-video]:w-full
            [&_.youtube-video]:mx-auto
            [&_.youtube-video]:!max-w-[18rem]
            sm:[&_.youtube-video]:!max-w-[22rem]
            md:[&_.youtube-video]:!max-w-[26rem]
            lg:[&_.youtube-video]:!max-w-[30rem]
            xl:[&_.youtube-video]:!max-w-[32rem]

            [&_iframe[src*='youtube']]:w-full
            [&_iframe[src*='youtube']]:h-auto
            [&_iframe[src*='youtube']]:aspect-video
            [&_iframe[src*='youtube']]:mx-auto
            [&_iframe[src*='youtube']]:!max-w-[18rem]
            sm:[&_iframe[src*='youtube']]:!max-w-[22rem]
            md:[&_iframe[src*='youtube']]:!max-w-[26rem]
            lg:[&_iframe[src*='youtube']]:!max-w-[30rem]
            xl:[&_iframe[src*='youtube']]:!max-w-[32rem]

            [&_iframe[src*='youtu.be']]:w-full
            [&_iframe[src*='youtu.be']]:h-auto
            [&_iframe[src*='youtu.be']]:aspect-video
            [&_iframe[src*='youtu.be']]:mx-auto
            [&_iframe[src*='youtu.be']]:!max-w-[18rem]
            sm:[&_iframe[src*='youtu.be']]:!max-w-[22rem]
            md:[&_iframe[src*='youtu.be']]:!max-w-[26rem]
            lg:[&_iframe[src*='youtu.be']]:!max-w-[30rem]
            xl:[&_iframe[src*='youtu.be']]:!max-w-[32rem]

            [&_iframe[src*='youtube-nocookie']]:w-full
            [&_iframe[src*='youtube-nocookie']]:h-auto
            [&_iframe[src*='youtube-nocookie']]:aspect-video
            [&_iframe[src*='youtube-nocookie']]:mx-auto
            [&_iframe[src*='youtube-nocookie']]:!max-w-[18rem]
            sm:[&_iframe[src*='youtube-nocookie']]:!max-w-[22rem]
            md:[&_iframe[src*='youtube-nocookie']]:!max-w-[26rem]
            lg:[&_iframe[src*='youtube-nocookie']]:!max-w-[30rem]
            xl:[&_iframe[src*='youtube-nocookie']]:!max-w-[32rem]
          "
          tabIndex={0}
          onClick={() => editor?.commands.focus()}
        >
          {/* Bubble Menu (shows on text selection) */}
          {editor && (
            <BubbleMenu
              editor={editor}
              tippyOptions={{ duration: 150, placement: "top" }}
              shouldShow={({ editor, state, from, to }) => {
                if (!editor?.isEditable) return false;
                if (from === to) return false;
                if (editor.isActive("image")) return false;
                return true;
              }}
              className="z-50"
            >
              <div className="flex items-center gap-1 rounded-md border border-neutral-300 bg-white/95 backdrop-blur px-1.5 py-1 shadow-lg">
                <div className="flex items-center gap-1">
                  <TypeIcon size={16} className="text-gray-600" />
                  <select
                    onChange={(e) => { editor?.chain().focus().setFontSize(e.target.value).run(); setIsDirty?.(true); }}
                    className="px-1 py-1 border rounded text-sm"
                    defaultValue="1em"
                  >
                    {fontSizes.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { editor?.chain().focus().toggleHighlight().run(); setIsDirty?.(true); }}
                    className={`p-1 border rounded ${editor?.isActive("highlight") ? "bg-white" : ""}`}
                    title="Highlight"
                  >
                    <HighlighterIcon size={11} />
                  </button>
                </div>
                <button type="button" onClick={()=>{editor.chain().focus().toggleBold().run();setIsDirty?.(true);}} className={`p-1 rounded border ${editor.isActive("bold") ? "bg-neutral-100" : "bg-white"}`} title="Bold">
                  <Bold size={14} />
                </button>
                <button type="button" onClick={()=>{editor.chain().focus().toggleItalic().run();setIsDirty?.(true);}} className={`p-1 rounded border ${editor.isActive("italic") ? "bg-neutral-100" : "bg-white"}`} title="Italic">
                  <Italic size={14} />
                </button>
                <button type="button" onClick={()=>{editor.chain().focus().toggleUnderline().run();setIsDirty?.(true);}} className={`p-1 rounded border ${editor.isActive("underline") ? "bg-neutral-100" : "bg-white"}`} title="Underline">
                  <UnderlineIcon size={14} />
                </button>
              </div>
            </BubbleMenu>
          )}

          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

export default RichTextEditor;
