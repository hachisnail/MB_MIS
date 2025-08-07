import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axiosClient from "../../lib/axiosClient";
import TimelineDatePicker from "../../features/TimelineDatePicker";
import { SearchBar, CardDropdownPicker } from "../../features/Utilities";
import Articleslist from "../../components/list/Articleslist";
import { useAuth } from "../../context/authContext";


const ArticleForm = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const allowedRoles = [1, 2, 5]; // Add article privs
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, ""); // "http://localhost:5000"
  const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/auth/articles`);
      // Ensure response.data is always an array
      setArticles(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(
        "Failed to load articles. Check that the API server is running."
      );
      setArticles([]); // <-- Always reset to empty array on error
      setLoading(false);
    }
  };


  // Filter the articles by searchTerm, category, and status
  const filteredArticles = articles.filter((article) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      article.title?.toLowerCase().includes(term) ||
      article.author?.toLowerCase().includes(term) ||
      article.article_category?.toLowerCase().includes(term);

    const matchesCategory =
      !selectedCat || article.article_category === selectedCat;

    const matchesStatus =
      !selectedStatusFilter || article.status === selectedStatusFilter;


    const matchesDate = filterDate
      ? new Date(article.created_at).toDateString() ===
        new Date(filterDate).toDateString()
      : true;
    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const postedCount = articles.filter(
    (article) => article.status === "posted"
  ).length;
  const pendingCount = articles.filter(
    (article) => article.status === "pending"
  ).length;
  const totalCount = articles.length;

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      await axiosClient.put(
        `/auth/article/${articleId}`,
        { status: newStatus }
      );

      setArticles((prev) =>
        prev.map((a) =>
          a.article_id === articleId ? { ...a, status: newStatus } : a
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Unable to update article status.");
    }
  };

const getStatusBadge = (status) => {
  let color = "";
  let bg = "";
  let label = "";
  switch (status) {
    case "posted":
      color = "text-green-700";
      bg = "bg-green-100";
      label = "Posted";
      break;
    case "pending":
      color = "text-yellow-700";
      bg = "bg-yellow-100";
      label = "Pending";
      break;
    case "rejected": // Added rejected status styling
      color = "text-red-700";
      bg = "bg-red-100";
      label = "Rejected";
      break;
    case "archived": // Added archived status styling
      color = "text-gray-700";
      bg = "bg-gray-100";
      label = "Archived";
      break;
    default:
      color = "text-gray-700";
      bg = "bg-gray-200";
      label = status;
  }
  return (
    <span
      className={`px-2 py-1 font-semibold ${color} ${bg} rounded border border-gray-400`} 
      style={{
        minWidth: "7rem", 
        display: "inline-block",
        textAlign: "center" 
      }}
    >
      {label}
    </span>
  );
};

  const { user } = useAuth();
const userRole = user.roleId; 
const userPosition = user.position


const filterStatus = [
  { label: "Status", value: "" }, 
  { label: "Pending", value: "pending" },
  { label: "Posted", value: "posted" },
  { label: "Rejected", value: "rejected" },
  { label: "Archived", value: "archived" },
];


const CatOptions = [
  { label: "Category", value: "" }, 
  { label: "Article", value: "Article" },
  { label: "Education", value: "Education" },
  { label: "Exhibit", value: "Exhibit" },
  { label: "Contests", value: "Contests" },
  { label: "Other", value: "Other" },
];

  

  return (
    
    <>
    <div className="relative w-full h-full  select-none flex overflow-hidden">
      <div className="w-full h-full flex flex-col gap-y-5  pb-7  overflow-hidden">

        <div className="w-full h-full flex flex-col xl:flex-row gap-y-5 xl:gap-x-5  ">
          {/* Left: Info and Add */}
          <div className="min-w-[34rem] h-full flex flex-col gap-y-7">
            <div className="w-full max-w-[35rem] text-gray-500 h-[3.5rem] flex py-0 gap-x-2 items-center">
              <button className="px-4 h-full border-1 border-black text-white bg-black rounded-lg">
                <span className="text-2xl font-semibold">Articles</span>
              </button>
            </div>

            <div className="w-full h-full flex flex-col gap-y-[5rem]">
              <div className="bg-[#161616] px-4 h-[5rem] flex justify-between items-center rounded-sm">
                <span className="text-2xl text-white font-semibold">Articles</span>
                <div className="w-[6rem] h-[3rem] bg-[#D4DBFF] flex items-center justify-center rounded-md">
                  <span className="text-2xl text-black font-semibold">{totalCount || 0}</span>
                </div>
              </div>

              <div className="w-full h-auto flex flex-col gap-y-7">
                <span className="text-2xl font-semibold text-[#727272]">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </span>

                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Posted</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{postedCount || 0}</span>
                  </div>
                </div>

                <div className="w-full h-fit flex justify-between items-center">
                  <span className="text-2xl font-semibold">Pending</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{pendingCount || 0}</span>
                  </div>
                </div>

                {userRole && allowedRoles.includes(userRole) && (
                    <NavLink to="add-article">
                      <button className="cursor-pointer flex items-center justify-between w-full px-6 py-4 bg-[#6BFFD5] text-black font-medium">
                        <span className="text-2xl font-semibold">
                          Add New Article
                        </span>
                        <span className="border-2 border-black rounded-full p-2 flex items-center justify-center">
                          <i className="fas fa-plus text-xl"></i>
                        </span>
                      </button>
                    </NavLink>
                  )}
              </div>
            </div>
          </div>

          {/* Right: Filters and List */}
          <div className="w-full h-full flex flex-col gap-y-7">
            <div className="w-full h-fit flex gap-x-3 items-center">     
              <TimelineDatePicker onDateChange={setFilterDate} theme="light" />
              <SearchBar theme="light" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <CardDropdownPicker value={selectedCat} onChange={setSelectedCat} placeholder="Categories" theme="light" options={CatOptions} />
              <CardDropdownPicker value={selectedStatusFilter} onChange={setSelectedStatusFilter} placeholder="Status" theme="light" options={filterStatus} />
            </div>

            <div className="bg-[#F0F0F0] min-w-[60rem] w-full font-semibold grid grid-cols-5 justify-between mb-7">
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Date</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Title</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Author</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Category</div>
              <div className="text-[#727272] text-2xl border-l-1 px-3 py-2">Status</div>
            </div>

            <div className="w-full min-w-[60rem] overflow-y-auto h-full border-t-1 border-t-gray-400" style={{ maxHeight: "68rem" }}>
              {loading ? (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-gray-500 flex flex-col items-center">
                    <i className="fas fa-inbox text-5xl mb-4"></i>
                    <p>Loading articles...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-red-500 flex flex-col items-center">
                    <i className="fas fa-exclamation-circle text-5xl mb-4"></i>
                    <p>{error}</p>
                    <button
                      onClick={fetchArticles}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <Articleslist
                    key={article.article_id}
                    article={article}
                    // handleRowClick={handleRowClick}
                    handleStatusChange={handleStatusChange}
                    userRole={userRole}
                    getStatusBadge={getStatusBadge}
                  />
                ))
              ) : (
                <div className="min-w-[60rem] h-full py-16 flex justify-center items-center border-b-1 border-gray-400">
                  <div className="text-2xl text-gray-500 flex flex-col items-center">
                    <i className="fas fa-inbox text-5xl mb-4"></i>
                    <p>No article found</p>
                    <p className="text-lg mt-2">Try adjusting your filters or search criteria</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    </>
  );
};

export default ArticleForm;
