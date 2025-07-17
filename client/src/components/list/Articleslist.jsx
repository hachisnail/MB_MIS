// Articleslist.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Articleslist = ({ article, handleStatusChange, userRole, getStatusBadge }) => {
  const navigate = useNavigate();

  const handleRowClick = (prop) => {
  const encodedId = btoa(prop);
  navigate(`/admin/article/edit-article/${encodedId}`);
};


  return (
    <div
      key={article.article_id}
      className="min-w-[60rem] text-xl h-fit font-semibold grid grid-cols-5 cursor-pointer hover:bg-gray-300"
      onClick={() => handleRowClick(article.article_id + " " + article.title)}
    >
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {article.upload_date
          ? new Date(article.upload_date).toLocaleDateString()
          : new Date(article.created_at).toLocaleDateString()}
      </div>

      <div className="px-4 py-3 border-b-1 border-gray-400 truncate">
        {article.title}
      </div>

      <div className="px-4 py-3 border-b-1 border-gray-400">
        {article.author || "Unknown"}
      </div>

      <div className="px-4 py-3 border-b-1 border-gray-400">
        {article.article_category}
      </div>

      <div className="px-4 py-3 border-b-1 border-gray-400">
        {userRole === "admin" ? (
          <select
            value={article.status}
            onChange={(e) => {
              e.stopPropagation(); // Prevent triggering row click
              handleStatusChange(article.article_id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()} // Prevent triggering row click
            className={`
              border rounded px-2 py-1 font-semibold
              ${article.status === "posted" ? "bg-green-100 text-green-700" : ""}
              ${article.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
            `}
            style={{
              minWidth: "7rem",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            <option value="pending" className="text-yellow-700 bg-yellow-100">
              Pending
            </option>
            <option value="posted" className="text-green-700 bg-green-100">
              Posted
            </option>
          </select>
        ) : (
          getStatusBadge(article.status)
        )}
      </div>
    </div>
  );
};

export default Articleslist;
