// extensions/SocialEmbed.js
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

const SocialEmbed = Node.create({
  name: "socialEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },      // embed URL (iframe or script src)
      platform: { default: "generic" }, // facebook, twitter, instagram, etc.
    };
  },

  parseHTML() {
    return [{ tag: "div[data-social-embed]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-social-embed": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => {
      const { src, platform } = node.attrs;

      if (!src) return <div className="border p-2">Invalid embed</div>;

      switch (platform) {
        case "facebook":
          return (
            <div className="my-2" data-social-embed>
              <iframe
                src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
                  src
                )}&show_text=true&width=500`}
                width="500"
                height="650"
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          );
        case "twitter":
        case "x":
          return (
            <blockquote className="twitter-tweet">
              <a href={src}>{src}</a>
            </blockquote>
          );
        case "instagram":
          return (
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={src}
              data-instgrm-version="14"
            >
              <a href={src}>{src}</a>
            </blockquote>
          );
        default:
          return (
            <div className="border p-2">
              <a href={src} target="_blank" rel="noopener noreferrer">
                {src}
              </a>
            </div>
          );
      }
    });
  },
});

export default SocialEmbed;
