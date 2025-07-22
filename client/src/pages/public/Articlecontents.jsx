import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

const Appointment = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  // Decode base64 param (e.g., "13::My Title")
  const decodeId = (encoded) => {
    try {
      const decoded = atob(encoded);
      const [decId, decName] = decoded.split("::");
      return { id: decId, name: decName };
    } catch {
      return { id: null, name: null };
    }
  };

  const { id: articleId, name: articleName } = decodeId(id);

  useEffect(() => {
    if (!articleId) return;
    const fetchArticle = async () => {
      try {
        const res = await fetch(
          `${SERVER_ORIGIN}/api/auth/public-article/${articleId}`
        );
        if (!res.ok) throw new Error("Failed to fetch article");
        const data = await res.json();
        setArticle(data);
      } catch (err) {
        setArticle(null);
      }
    };
    fetchArticle();
  }, [articleId]);

  if (!article) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading article...</p>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col gap-y-4 min-h-fit h-fit w-screen pt-7">
      <div className="w-screen h-[20rem] font-hina">
        <span className="flex w-auto h-full text-center items-center justify-center text-[7rem]">
          {articleName || article.title}
        </span>
      </div>
      <div className="flex w-auto justify-center my-[5rem]">
        <div className="flex w-[70rem] h-auto items-center justify-center text-center text-[2rem]">
          <span className="w-1/4 h-[13rem] border border-black flex flex-col items-center justify-center">
            <h1 className="text-[1.5rem]">Date</h1>
            <p className="break-words whitespace-normal px-4">
              {article.upload_date
                ? new Date(article.upload_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </span>
          <span className="w-1/4 h-[13rem] border border-black flex flex-col items-center justify-center">
            <h1 className="text-[1.5rem]">Author</h1>
            <p className="break-words whitespace-normal px-4">
              {article.author || "N/A"}
            </p>
          </span>
          <span className="w-1/4 h-[13rem] border border-black flex flex-col items-center justify-center">
            <h1 className="text-[1.5rem]">Address</h1>
            <p className="break-words whitespace-normal px-4">
              {article.barangay && article.address
                ? `${article.barangay}, ${article.address}`
                : article.barangay
                ? article.barangay
                : article.address
                ? article.address
                : "N/A"}
            </p>
          </span>
          <span className="w-1/4 h-[13rem] border border-black flex flex-col items-center justify-center">
            <h1 className="text-[1.5rem]">
              {article.article_category || "N/A"}
            </h1>
          </span>
        </div>
      </div>
      <div className="w-screen h-auto min-h-[79rem] mx-auto font-hina">
        <div className="max-w-[140rem] 3xl:max-w-[180rem] mx-auto text-[3rem]">
          {article.images && (
            <div className="flex justify-center p-[2rem]">
              <img
                src={
                  article.images.startsWith("http")
                    ? article.images
                    : `${UPLOAD_PATH}${article.images}`
                }
                alt="Article Thumbnail"
                className="mx-[2.5rem] object-contain"
              />
            </div>
          )}
          <div className="p-4 prose max-w-none">
            {article.description ? (
              <div
                className="editor-content-preview"
                dangerouslySetInnerHTML={{ __html: article.description }}
              />
            ) : (
              <p className="text-gray-400 italic text-xl">
                No article content available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointment;
