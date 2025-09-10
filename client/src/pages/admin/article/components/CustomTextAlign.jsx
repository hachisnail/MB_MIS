// src/components/CustomTextAlign.js
import TextAlign from "@tiptap/extension-text-align";

const CustomTextAlign = TextAlign.extend({
  addGlobalAttributes() {
    // Same targets as your config
    const types = this.options.types || ["heading", "paragraph"];

    return [
      {
        types,
        attributes: {
          textAlign: {
            default: null,
            // read from data-attr first, then style
            parseHTML: element =>
              element.getAttribute("data-text-align") ||
              element.style?.textAlign ||
              null,
            // write style + data-attr so preview can rely on either
            renderHTML: attrs => {
              if (!attrs.textAlign) return {};
              return {
                style: `text-align:${attrs.textAlign}`,
                "data-text-align": attrs.textAlign,
              };
            },
          },
        },
      },
    ];
  },
});

export default CustomTextAlign;
