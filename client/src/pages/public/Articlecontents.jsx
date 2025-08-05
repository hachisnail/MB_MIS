import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import texture from "../../assets/Texture.png"
import MSBLogo from "../../assets/MSBLogo.png";
import seal from "../../assets/seal.png";


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
    <div className="flex flex-col gap-y-4 min-h-fit h-fit w-screen pt-7"
            style={{ backgroundImage: `url(${texture})` }}
    
    >
     
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
                The Provincial Government of <br />Camarines Norte
            </span>
            <span>Museum, Archives and Shrine <br />Curation Division</span>
        </div>
    </div>
    {/* Middle Column */}
    <div className="flex flex-col items-center justify-center p-6 border-l-3 border-r-3 border-black basis-[55%]">
        <span className="text-[3rem] font-bold">
            Museo{" "}
            <span
                className="text-[3rem] font-bold"
                style={{ color: "#F8BB1F", textShadow: "0 0 2px #bfa100" }}
            >
                B
            </span>
            ulawan News
        </span>
        <span className="text-[5rem] font-bold underline ">
            {article.title}
        </span>
        <span className="text-[2rem]">
            {article.author || "N/A"}
        </span>
    </div>
    {/* Right Column */}
    <div className="flex flex-col items-start justify-center p-6 gap-2 basis-[22.5%]">
        <span className="text-[1.3rem] font-semibold">
            {article.upload_date
                ? new Date(article.upload_date).toLocaleDateString("en-US", {
                      weekday: "long",
                  })
                : "N/A"}
        </span>
        <span className="text-[1.1rem]">
            {article.upload_date
                ? new Date(article.upload_date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                  })
                : "N/A"}
        </span>
        <span className="font-semibold text-[1.1rem]">
            Vol.2, No.3
        </span>
    </div>
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
          <div className="p-10 prose max-w-none
                      min-h-[18rem] max-h-[24rem]
                      sm:min-h-[22rem] sm:max-h-[28rem]
                      md:min-h-[26rem] md:max-h-[32rem]
                      lg:min-h-[30rem] lg:max-h-[30rem]
                      xl:min-h-[32rem] xl:max-h-[32rem]
                      2xl:min-h-[34rem] 2xl:max-h-[34rem]
                      overflow-y-auto
                      relative
                      break-words">
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
