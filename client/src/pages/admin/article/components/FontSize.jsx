// components/FontSize.js
import { Extension } from '@tiptap/core';

// Normalize user input to valid CSS size
const normalizeCssSize = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  // bare number -> px
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
  // allow common units
  if (/^\d+(\.\d+)?(px|em|rem|%)$/.test(s)) return s;
  return s;
};

/**
 * FontSize implemented as a global attribute on the TextStyle mark.
 * - Renders <span style="font-size: ...">
 * - Parses inline font-size back into textStyle attrs on load
 */
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types, // textStyle
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => {
              const size = el.style?.fontSize || el.getAttribute?.('data-font-size');
              return size ? normalizeCssSize(size) : null;
            },
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return {
                style: `font-size: ${attrs.fontSize}`,
                'data-font-size': attrs.fontSize, // helpful if a sanitizer strips style
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: normalizeCssSize(fontSize) })
            .run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});

export default FontSize;
