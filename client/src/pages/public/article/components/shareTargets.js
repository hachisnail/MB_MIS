// utils/shareTargets.js
export const buildShareTargets = (
  url,
  title = "",
  text = "",
  {
    x = { via: "", hashtags: [] },     // e.g., { via: "MuseoBulawan", hashtags: ["CamarinesNorte","Museo"] }
    facebook = { quote: "" },          // FB doesn’t allow body text; `quote` is allowed for sharer/feed
  } = {}
) => {
  const safeUrl   = encodeURIComponent(url);
  const safeTitle = encodeURIComponent(title || "");
  const safeText  = encodeURIComponent(text || "");
  const xText     = encodeURIComponent(title || text || "");
  const xParams   = new URLSearchParams({
    url,
    text: xText,
  });
  if (x?.via) xParams.set("via", x.via);
  if (x?.hashtags?.length) xParams.set("hashtags", x.hashtags.join(","));

  // Facebook: text body cannot be prefilled; `quote` shows above the link preview.
  // If you have FB App, you could also use the Feed Dialog. The sharer works fine for most use-cases.
  const fbParams = new URLSearchParams({ u: url });
  if (facebook?.quote) fbParams.set("quote", facebook.quote);

  return {
    // Facebook (prefill quote + use OG tags for title/desc/image)
    facebook: `https://www.facebook.com/sharer/sharer.php?${fbParams.toString()}`,

    // X / Twitter (prefill text + url; can add via/hashtags)
    x: `https://twitter.com/intent/tweet?${xParams.toString()}`,

    // LinkedIn (only takes the URL; previews come from your OG tags)
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${safeUrl}`,

    // Reddit (supports url + title)
    reddit: `https://www.reddit.com/submit?url=${safeUrl}&title=${safeTitle}`,

    // Telegram (supports url + text)
    telegram: `https://t.me/share/url?url=${safeUrl}&text=${encodeURIComponent(title || text || "")}`,

    // WhatsApp (single text field; put title + url)
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      (title ? `${title} — ` : "") + url
    )}`,

    // Bonus: email share
    email: `mailto:?subject=${safeTitle}&body=${encodeURIComponent((text ? text + "\n\n" : "") + url)}`
  };
};
