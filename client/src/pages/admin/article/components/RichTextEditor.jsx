import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";

// TipTap extensions
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
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

// Your custom extensions (adjust paths as needed)
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
        TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
        TextStyle,
        Image.configure({ draggable: true }),
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
        Youtube,
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

    // Expose a small API to the parent
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.state.doc.textContent || "",
      setContent: (html = "") => editor?.commands.setContent(html),
      focus: () => editor?.commands.focus(),
      // helper to run chains from parent (for things like setImage, setFontSize, etc.)
      runChain: (fn) => {
        if (!editor) return;
        const chain = editor.chain();
        fn(chain);
      },
    }));

    return (
      <div className="space-y-2">
        <label className={`font-bold ${errors?.description ? "text-red-600" : ""}`}>
          Body {errors?.description && "*"}
        </label>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-[#d6c2ad] rounded border border-black-400">
          {/* Headings */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor?.chain().focus().toggleHeading({ level }).run();
                  setIsDirty?.(true);
                }}
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
              onChange={(e) => {
                editor?.chain().focus().setFontSize(e.target.value).run();
                setIsDirty?.(true);
              }}
              className="px-1 py-1 border rounded text-sm"
              defaultValue="1em"
            >
              {fontSizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleHighlight().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("highlight") ? "bg-white" : ""}`}
              title="Highlight"
            >
              <HighlighterIcon size={11} />
            </button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Bold / Underline / Italic */}
          <div className="flex gap-1 ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleBold().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("bold") ? "bg-white" : ""}`}
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleUnderline().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("underline") ? "bg-white" : ""}`}
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleItalic().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("italic") ? "bg-white" : ""}`}
            >
              <Italic size={16} />
            </button>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  editor?.chain().focus().setTextAlign(dir).run();
                  setIsDirty?.(true);
                }}
                className={`p-1 border rounded ${editor?.isActive({ textAlign: dir }) ? "bg-white" : ""}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Columns */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "columnBlock",
                    content: [
                      { type: "column", content: [{ type: "paragraph" }] },
                      { type: "column", content: [{ type: "paragraph" }] },
                    ],
                  })
                  .run();
                setIsDirty?.(true);
              }}
              className="p-1 border rounded"
              title="Insert Two Column Layout"
            >
              <ColumnsIcon size={16} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "columnBlock",
                    content: [
                      { type: "column", content: [{ type: "paragraph" }] },
                      { type: "column", content: [{ type: "paragraph" }] },
                      { type: "column", content: [{ type: "paragraph" }] },
                    ],
                  })
                  .run();
                setIsDirty?.(true);
              }}
              className="p-1 border rounded flex items-center justify-center"
              title="Insert Three Column Layout"
            >
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
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleBulletList().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("bulletList") ? "bg-white" : ""}`}
              title="Bullet List"
            >
              <List size={18} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleOrderedList().run();
                editor?.chain().focus().updateAttributes("orderedList", { class: "roman-list" }).run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("orderedList", { class: "roman-list" }) ? "bg-white" : ""}`}
              title="Roman List"
            >
              <ListOrdered size={18} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleOrderedList().run();
                editor?.chain().focus().updateAttributes("orderedList", { class: "letter-list" }).run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("orderedList", { class: "letter-list" }) ? "bg-white" : ""}`}
              title="Letter List"
            >
              <ListOrdered size={18} />
            </button>
          </div>

          <div className="border-l h-6 mx-2" />

          {/* Insert Image / YouTube */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
              className="p-1 border rounded"
              title="Insert Image"
            >
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
          className="border rounded p-4 min-h-[21.5rem] max-h-[21.5rem]
                     sm:min-h-[10rem] sm:max-h-[5rem]
                     md:min-h-[36.5rem] md:max-h-[36.5rem]
                     lg:min-h-[36.5rem] lg:max-h-[36.5rem]
                     xl:min-h-[36.6rem] xl:max-h-[36.6rem]
                     2xl:min-h-[30rem] 2xl:max-h-[37rem]
                     overflow-auto prose focus:outline-none
                     [&_.youtube-video]:!w-full [&_.youtube-video]:!max-w-[400px] [&_.youtube-video]:!mx-auto font-hina"
          tabIndex={0}
          onClick={() => editor?.commands.focus()}
        >
          {/* Bubble Menu (shows on text selection) */}
          {editor && (
            <BubbleMenu
              editor={editor}
              tippyOptions={{ duration: 150, placement: "top" }}
              shouldShow={({ editor, state, from, to }) => {
                // show only when there is a text selection and not on images/table controls
                if (!editor?.isEditable) return false;
                if (from === to) return false;
                if (editor.isActive("image")) return false;
                return true;
              }}
              className="z-50"
            >
              
              <div className="flex items-center gap-1 rounded-md border border-neutral-300 bg-white/95 backdrop-blur px-1.5 py-1 shadow-lg">
                {/* Font Size + Highlight */}
          <div className="flex items-center gap-1">
            <TypeIcon size={16} className="text-gray-600" />
            <select
              onChange={(e) => {
                editor?.chain().focus().setFontSize(e.target.value).run();
                setIsDirty?.(true);
              }}
              className="px-1 py-1 border rounded text-sm"
              defaultValue="1em"
            >
              {fontSizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor?.chain().focus().toggleHighlight().run();
                setIsDirty?.(true);
              }}
              className={`p-1 border rounded ${editor?.isActive("highlight") ? "bg-white" : ""}`}
              title="Highlight"
            >
              <HighlighterIcon size={11} />
            </button>
          </div>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleBold().run();
                    setIsDirty?.(true);
                  }}
                  className={`p-1 rounded border ${editor.isActive("bold") ? "bg-neutral-100" : "bg-white"}`}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleItalic().run();
                    setIsDirty?.(true);
                  }}
                  className={`p-1 rounded border ${editor.isActive("italic") ? "bg-neutral-100" : "bg-white"}`}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleUnderline().run();
                    setIsDirty?.(true);
                  }}
                  className={`p-1 rounded border ${editor.isActive("underline") ? "bg-neutral-100" : "bg-white"}`}
                  title="Underline"
                >
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
