import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bgImage1 from "@/assets/Fernando-Amorsolo-Women-Bathing-and-Washing Clothes-7463.svg";
import axios from "axios";

const municipalities = [
  "Basud", "Capalonga", "Daet", "Jose Panganiban", "Labo",
  "Mercedes", "Paracale", "San Lorenzo Ruiz", "San Vicente",
  "Santa Elena", "Talisay", "Vinzons"
];

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`; 

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Optional filters
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [municipality, setMunicipality] = useState("");

  // Use a state for the background image if it might change, otherwise keep as const
  const backgroundImage = bgImage1;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const response = await axios.get(`${SERVER_ORIGIN}/api/auth/public-articles`);
      const articlesList = response.data;

      // Fetch details for each article to get the address
      const detailedArticles = await Promise.all(
          articlesList.map(async (article) => {
            try {
              const detailRes = await axios.get(
                `${SERVER_ORIGIN}/api/auth/public-article/${article.article_id}`
              );
              // IMPORTANT: Merge the entire detailRes.data, not just address
              return { ...article, ...detailRes.data }; // This will overwrite 'images' with the full URL from detailRes.data
            } catch (detailErr) {
              console.error(`Failed to fetch detail for article ${article.article_id}:`, detailErr);
              return article;
            }
          })
        );

      setArticles(detailedArticles);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load articles:", err);
      setError("Failed to load articles. Please try again later.");
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesKeyword =
      !keyword ||
      article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
      article.author?.toLowerCase().includes(keyword.toLowerCase());

    const matchesCategory =
      !category ||
      article.article_category?.toLowerCase() === category.toLowerCase();

    const matchesMunicipality =
      !municipality ||
      (article.address &&
        article.address.toLowerCase().includes(municipality.toLowerCase()));

    return matchesKeyword && matchesCategory && matchesMunicipality;
  });

  // Encode (ID :: Title) into base64
  const encoded = (id, name) => {
    const encodedString = `${id}::${name}`;
    return btoa(encodedString);
  };

  // Check if image exists and is valid
  const isValidImage = (url) => {
    // Basic check for string validity and common "empty" values
    return typeof url === 'string' && url.trim() !== '' && url.trim() !== "undefined" && url.trim() !== "null";
  };

  return (
    // Main container that will allow scrolling for the entire page if content exceeds height
    <div className="w-screen pt-40 min-h-screen flex flex-col overflow-y-auto">
      {/* Background image container, now correctly marked as relative */}
      <div
        className="w-screen h-[40rem] bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Overlay for search/filter bar, positioned absolutely within the background image div */}
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="grid grid-cols-3 w-[90%] max-w-6xl h-15">
            {/* Keyword Input */}
              <div className="flex items-center justify-center bg-white text-black border-r border-black">
              <input
                type="text"
                placeholder="Search"
                className="w-full h-full px-4 text-4xl lg:text-5xl bg-transparent focus:outline-none"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative flex items-center justify-center bg-white text-black border-r border-black">
              <select
                className="w-full h-full px-4 text-4xl lg:text-5xl bg-transparent appearance-none focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category</option>
                <option value="Education">Education</option>
                <option value="Exhibit">Exhibit</option>
                <option value="Contests">Contests</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
              </select>
              <div className="pointer-events-none absolute right-2">
                <svg
                  className="h-8 w-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Municipality Dropdown */}
            <div className="relative flex items-center justify-center bg-white text-black border-r border-black">
              <select
                className="w-full h-full px-4 text-4xl lg:text-5xl bg-transparent appearance-none focus:outline-none"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              >
                <option value="">Municipality</option>
                {municipalities.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2">
                <svg
                  className="h-8 w-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            
          </div>
        </div>
      </div>

      {/* Articles Section - now directly below the hero section */}
      {/* Removed `h-screen` and `min-h-fit` from this div to allow it to grow */}
      <div className="w-full min-w-fit flex justify-center items-start py-10"> {/* Changed items-center to items-start for better flow */}
        <div className="w-full p-20 mx-auto flex justify-around">
          {loading && (
            <div className="text-center text-black text-xl">
              Loading articles...
            </div>
          )}
          {error && (
            <div className="text-center text-red-500 text-xl">{error}</div>
          )}
          {!loading && !error && filteredArticles.length === 0 && (
            <div className="text-center text-gray-600 text-xl">
              No articles found matching your criteria.
            </div>
          )}
          {!loading && !error && filteredArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 gap-x-20">
              {filteredArticles.map((article, index) => {
                const hasValidImage = isValidImage(article.images);
                const displayDate = article.upload_date
                  ? new Date(article.upload_date).toLocaleDateString()
                  : "No Date";

                return (
                  <Link
                    key={article.article_id || index}
                    to={`/article/${encoded(article.article_id, article.title)}`}
                    className="flex flex-col items-center text-center hover:opacity-90 transition duration-300"
                  >
                    <div className="w-full aspect-square overflow-hidden bg-gray-700 flex items-center justify-center">
                      {hasValidImage ? (
                        <img
                          src={
                            hasValidImage
                              ? article.images.startsWith("http")
                                ? article.images
                                : `${UPLOAD_PATH}${article.images}`
                              : ""
                          }
                          alt={`Article ${article.title || 'Untitled'}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentNode.classList.add(
                              "flex",
                              "flex-col",
                              "items-center",
                              "justify-center"
                            );
                            e.target.parentNode.innerHTML =
                              '<div class="flex flex-col items-center justify-center"><svg class="text-gray-300 text-5xl" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16V4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2z" /></svg><p class="text-gray-300 mt-2">No Image</p></div>';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-gray-300 mt-2">No Image</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[#F05454] text-base uppercase mt-2">
                      {article.article_category || "No Category"}
                    </p>
                    <h2 className="text-[#E5D2AC] italic text-[3rem] font-semibold mt-1">
                      {article.title || "Untitled"}
                    </h2>
                    <p className="text-gray-700 text-base mt-1">
                      {displayDate}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Articles;