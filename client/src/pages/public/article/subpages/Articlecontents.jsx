import React, { useEffect, useMemo, useState, useCallback, useRef} from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import texture from "@/assets/Texture.png";
import MSBLogo from "@/assets/MSBLogo.png";
import seal from "@/assets/seal.png";
import useEngagement from "../../../../../../server/src/hooks/useEngagement";
import { setEngagementEndpoint, trackTransition } from "../../../../../../server/src/services/engagementTracker";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

// --- utils ---
const decodeId = (encoded) => {
  try {
    const decoded = atob(encoded);
    const [decId, decName] = decoded.split("::");
    return { id: decId, name: decName };
  } catch {
    return { id: null, name: null };
  }
};
const encodeForRoute = (id, title) => btoa(`${id}::${title ?? ""}`);

// --- share helpers ---
const buildShareTargets = (url, title, text) => ({
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || text || "")}`,
  linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || "")}`,
  reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || "")}`,
  telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || text || "")}`,
  whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent((title ? title + " — " : "") + url)}`,
});

const ArticleContents = () => {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const { id: articleId, name: articleName } = decodeId(id);


// set tracker endpoint once
  useEffect(() => {
    setEngagementEndpoint(`${SERVER_ORIGIN}/api/engagement`);
  }, []);

  // transition: from previous article -> this article
  useEffect(() => {
    const from = location.state?.fromArticleId;
    if (from && articleId && String(from) !== String(articleId)) {
      trackTransition(from, articleId, null); // pass real userId if you have auth
    }
  }, [location.state, articleId]);

  // time + clicks
  useEngagement({ articleId, userId: null, containerRef });


  // compute canonical share URL
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.origin);
    url.pathname = location.pathname;
    url.search = location.search;
    url.hash = "";
    return url.toString();
  }, [location.pathname, location.search]);

  const titleForShare = useMemo(
    () => article?.title || articleName || "Check this article",
    [article, articleName]
  );

  const shareTargets = useMemo(
    () => buildShareTargets(shareUrl, titleForShare, article?.caption || ""),
    [shareUrl, titleForShare, article?.caption]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard");
    } catch (e) {
      // fallback prompt
      // eslint-disable-next-line no-alert
      prompt("Copy this link:", shareUrl);
    }
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: titleForShare, text: article?.caption || "", url: shareUrl });
      } catch (e) {
        // user cancelled / not supported
      }
    } else {
      handleCopy();
    }
  }, [shareUrl, titleForShare, article?.caption, handleCopy]);

  // --- data fetching ---
  useEffect(() => {
    if (!articleId) return;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${SERVER_ORIGIN}/api/auth/public-article/${articleId}`);
        if (!res.ok) throw new Error("Failed to fetch article");
        const data = await res.json();
        setArticle(data);
        setError(null);
      } catch (err) {
        setArticle(null);
        setError("Unable to load the article.");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

useEffect(() => {
  if (!article) return;

  const pickUnique = (arr) => {
    const seen = new Set();
    const out = [];
    for (const a of arr) {
      const key = String(a.article_id ?? a.id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
    return out;
  };

  // deterministic light shuffle so it isn’t always the same order
  const shuffleLight = (arr, seed = String(article.article_id || "")) => {
    let s = 0;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const hydrateByIds = async (ids) => {
    const tasks = ids.map(async (aid) => {
      try {
        const det = await fetch(`${SERVER_ORIGIN}/api/auth/public-article/${aid}`);
        if (!det.ok) return null;
        return await det.json();
      } catch {
        return null;
      }
    });
    return (await Promise.all(tasks)).filter(Boolean);
  };

  // Build a synthetic Markov-ish score from metadata when we have no transitions yet
  const syntheticRank = (others, current) => {
    const now = Date.now();
    return others
      .map((a) => {
        let score = 0;
        // category and location act like "co-occurrence" edges
        if (current.article_category && a.article_category === current.article_category) score += 3;
        if (current.address && a.address && a.address === current.address) score += 2;

        // recency weight ~ exp(-age / 30d)
        const ageDays = (now - new Date(a.upload_date || 0).getTime()) / (1000 * 60 * 60 * 24);
        const recency = Math.exp(-Math.max(0, ageDays) / 30); // 0..1
        score += recency; // small smooth boost

        return { a, score };
      })
      .sort((x, y) => y.score - x.score)
      .map((x) => x.a);
  };

  const fetchRelated = async () => {
    try {
      // 1) pool of articles for fallbacks & hydration
      const allRes = await fetch(`${SERVER_ORIGIN}/api/auth/public-articles`);
      const allJson = await allRes.json();
      const all = Array.isArray(allJson) ? allJson : [];

      // exclude current
      const others = all.filter((x) => String(x.article_id) !== String(article.article_id));

      // 2) engagement-based suggestions
      let suggestedDetailed = [];
      try {
        const sRes = await fetch(
          `${SERVER_ORIGIN}/api/engagement/suggest/next?fromId=${encodeURIComponent(
            article.article_id
          )}&limit=12`
        );
        if (sRes.ok) {
          const sData = await sRes.json();
          const ids = (sData?.next || []).map((x) => x.to).filter(Boolean);
          if (ids.length) suggestedDetailed = pickUnique(await hydrateByIds(ids));
        }
      } catch {
        // ignore, we’ll fall back
      }

      // 3) synthetic Markov fallback (and/or filler)
      const synthetic = syntheticRank(others, article);

      // 4) build final set: prefer suggestions, then fill from synthetic, then any recent leftovers
      const merged = pickUnique([
        ...suggestedDetailed,
        ...synthetic,
        ...others
          .slice()
          .sort((a, b) => new Date(b.upload_date || 0) - new Date(a.upload_date || 0)),
      ]);

      const chosen = shuffleLight(merged).slice(0, 4);
      setRelated(chosen);
    } catch {
      setRelated([]);
    }
  };

  fetchRelated();
}, [article, SERVER_ORIGIN]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"><p>Loading article...</p></div>
    );
  }

  if (!article || !articleId) {
    return (
      <div className="flex items-center justify-center h-screen"><p>{error || "Article not found."}</p></div>
    );
  }

  return (
    <div
    ref={containerRef}
      className="flex flex-col gap-y-4 h-auto w-screen pt-7"
      style={{ backgroundImage: `url(${texture})` }}
    >
      {/* Header band */}
      <div className="flex w-screen h-auto justify-center mb-[5rem] pt-40 font-hina">
        <div className="flex w-[140rem] h-auto items-stretch text-center text-[2rem] border-t-3 border-b-3 border-black">
          {/* Left Column */}
          <div className="flex flex-col items-end justify-start p-6 gap-4 basis-[22.5%]">
            <div className="flex gap-2 mb-2 mr-4">
              <img src={MSBLogo} alt="MSB Logo" className="w-10 h-10 inline-block" />
              <img src={seal} alt="Seal" className="w-10 h-10 inline-block" />
            </div>
            <div className="flex flex-col items-end text-[1.1rem] leading-tight">
              <span className="font-bold">
                The Provincial Government of <br />
                Camarines Norte
              </span>
              <span>
                Museum, Archives and Shrine <br />
                Curation Division
              </span>
            </div>
          </div>
          {/* Middle Column */}
          <div className="flex flex-col items-center justify-center p-6 border-l-3 border-r-3 border-black basis-[55%]">
            <span className="text-[3rem] font-bold">
              Museo {" "}
              <span className="text-[3rem] font-bold" style={{ color: "#F8BB1F", textShadow: "0 0 2px #bfa100" }}>B</span>
              ulawan News
            </span>
            <span className="text-[5rem] font-bold underline ">{articleName || article.title}</span>
            <span className="text-[2rem]">{article.author || "N/A"}</span>
          </div>
          {/* Right Column */}
          <div className="flex flex-col items-start justify-center p-6 gap-2 basis-[22.5%]">
            <span className="text-[1.3rem] font-semibold">
              {article.upload_date
                ? new Date(article.upload_date).toLocaleDateString("en-US", { weekday: "long" })
                : "N/A"}
            </span>
            <span className="text-[1.1rem]">
              {article.upload_date
                ? new Date(article.upload_date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                : "N/A"}
            </span>
            <span className="font-semibold">
              {article?.volume ? `Vol.${article.volume}` : "Vol.—"},{" "}
              {article?.sequence_number
                ? ((article?.content_type || "").toLowerCase() === "article"
                    ? `No.${article.sequence_number}`
                    : `Event #${article.sequence_number}`)
                : ((article?.content_type || "").toLowerCase() === "article" ? "No.—" : "Event #—")}
            </span>

          </div>
        </div>
      </div>



      {/* Body */}
      <div className="w-screen h-auto min-h-[79rem] mx-auto font-hina">
        <div className="max-w-[140rem] 3xl:max-w-[180rem] mx-auto text-[3rem]">
          {article.images && (
            <div className="flex justify-center p-[2rem]">
              <img
                src={article.images.startsWith("http") ? article.images : `${UPLOAD_PATH}${article.images}`}
                alt="Article Thumbnail"
                className="mx-[2.5rem] object-contain"
              />
            </div>
          )}
          <div className="p-10 prose max-w-none relative break-words">
            {article.description ? (
              <div className="editor-content-preview" dangerouslySetInnerHTML={{ __html: article.description }} />
            ) : (
              <p className="text-gray-400 italic text-xl">No article content available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Share Row */}
      <div className="w-full flex justify-center mb-6">
        <div className="flex items-center gap-3 flex-wrap px-4">
          <button data-track-click onClick={handleNativeShare} className="px-4 py-2 rounded-2xl bg-black text-white hover:opacity-90">Share</button>
          <a target="_blank" rel="noreferrer" href={shareTargets.facebook} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">Facebook</a>
          <a target="_blank" rel="noreferrer" href={shareTargets.x} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">X</a>
          <a target="_blank" rel="noreferrer" href={shareTargets.linkedin} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">LinkedIn</a>
          <a target="_blank" rel="noreferrer" href={shareTargets.reddit} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">Reddit</a>
          <a target="_blank" rel="noreferrer" href={shareTargets.telegram} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">Telegram</a>
          <a target="_blank" rel="noreferrer" href={shareTargets.whatsapp} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">WhatsApp</a>
          <button onClick={handleCopy} className="px-4 py-2 rounded-2xl border hover:bg-gray-50">Copy Link</button>
        </div>
      </div>

      {/* Related Articles */}
      <div className="w-full flex justify-center mt-16 mb-24 px-6">
        <div className="w-full max-w-[140rem]">
          <h2 className="text-4xl font-bold mb-6">Related Articles</h2>
          {related.length === 0 ? (
            <p className="text-gray-500 text-2xl">No related articles found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {related.map((ra) => (
                <Link
                  key={ra.article_id}
                  to={`/article/${encodeForRoute(ra.article_id, ra.title)}`}
                  state={{ fromArticleId: article.article_id }}
                  className="group border rounded-2xl overflow-hidden hover:shadow-lg transition bg-white"
                >
                  {ra.images && (
                    <img
                      src={ra.images.startsWith("http") ? ra.images : `${UPLOAD_PATH}${ra.images}`}
                      alt={ra.title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-2xl font-semibold group-hover:underline line-clamp-2">{ra.title}</h3>
                    <p className="text-lg text-gray-700 mt-2 line-clamp-2">{ra.caption || ""}</p>
                    <div className="text-base text-gray-600 mt-3 flex gap-2">
                      {ra.article_category && <span className="px-2 py-0.5 rounded-full bg-gray-100">{ra.article_category}</span>}
                      {ra.address && <span className="px-2 py-0.5 rounded-full bg-gray-100">{ra.address}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default ArticleContents;
