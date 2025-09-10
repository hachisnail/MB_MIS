import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axiosClient from "../../../lib/axiosClient";
import TimelineDatePicker from "../../../features/TimelineDatePicker";
import { SearchBar, CardDropdownPicker } from "../../../features/Utilities";
import Articleslist from "./components/Articleslist";
import { useAuth } from "../../../context/authContext";
import { TableHeaderContainer, SummaryPanel } from "../../../features/Utilities";
import ListRenderer from "../../../components/tables/ListRenderer";

const ArticleForm = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [activeTab, setActiveTab] = useState("articles");

  const tabs = [
    { key: "articles", label: "Articles" },
    { key: "pending", label: "Pending" },
    { key: "posted", label: "Posted" },
  ];

  const articleHeaders = [
    { label: "Date", width: 12 },
    { label: "Title", width: "1fr" },
    { label: "Author", width: "1fr" },
    { label: "Category", width: 10 },
    { label: "Status", width: 12 },
  ];

  const pendingHeaders = [
    { label: "Date", width: 12 },
    { label: "Title", width: "1fr" },
    { label: "Author", width: "1fr" },
    { label: "Category", width: 10 },
    { label: "Status", width: 12 },
  ];

  const postedHeaders = [
    { label: "Date", width: 12 },
    { label: "Title", width: "1fr" },
    { label: "Author", width: "1fr" },
    { label: "Category", width: 10 },
    { label: "Status", width: 12 },
  ];

  const headersMap = {
    articles: articleHeaders,
    pending: pendingHeaders,
    posted: postedHeaders,
  };

  const allowedRoles = [1, 2, 5];
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
  const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

  const navigate = useNavigate();

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
      setArticles([]);
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

    const matchesType =
    !selectedType || article.content_type === selectedType;

    const matchesStatus =
      !selectedStatusFilter || article.status === selectedStatusFilter;

    const matchesDate = filterDate
      ? new Date(article.created_at).toDateString() ===
      new Date(filterDate).toDateString()
      : true;
    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesDate;
  });

  // Filtered lists for each tab
  const filteredPending = filteredArticles.filter((a) => a.status === "pending");
  const filteredPosted = filteredArticles.filter((a) => a.status === "posted");

  const postedCount = articles.filter(
    (article) => article.status === "posted"
  ).length;
  const pendingCount = articles.filter(
    (article) => article.status === "pending"
  ).length;
  const rejectedCount = articles.filter(
    (article) => article.status === "rejected"
  ).length;
  const archivedCount = articles.filter(
    (article) => article.status === "archived"
  ).length;
  const scheduledCount = articles.filter(
    (article) => article.status === "scheduled"
  ).length;
  const totalCount = articles.length;

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      await axiosClient.put(`/auth/article/${articleId}`, {
        status: newStatus,
      });

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
      case "scheduled": // Added archived status styling
        color = "text-blue-700";
        bg = "bg-blue-100";
        label = "Scheduled";
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
          textAlign: "center",
        }}
      >
        {label}
      </span>
    );
  };

  const { user } = useAuth();
  const userRole = user.roleId;
  const userPosition = user.position;

  const filterStatus = [
    { label: "Status", value: "" },
    { label: "Pending", value: "pending" },
    { label: "Posted", value: "posted" },
    { label: "Rejected", value: "rejected" },
    { label: "Archived", value: "archived" },
    { label: "Scheduled", value: "scheduled" },
  ];

  const CatOptions = [
    { label: "Category", value: "" },
    { label: "Article", value: "Article" },
    { label: "Education", value: "Education" },
    { label: "Exhibit", value: "Exhibit" },
    { label: "Contests", value: "Contests" },
    { label: "Other", value: "Other" },
  ];


const TypeOptions = [
  { label: "Type", value: "" },
  { label: "Article", value: "article" },
  { label: "Event", value: "event" },
];

  return (
    <>
      <div className="w-full h-full flex gap-x-15 overflow-scroll lg:flex-row flex-col">
        <SummaryPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Total Articles"
          totalCount={totalCount || 0}
          dateLabel={new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          summaryData={[
            { label: "Posted", value: postedCount || 0 },
            { label: "Pending", value: pendingCount || 0 },
            { label: "Rejected", value: rejectedCount || 0 },
            { label: "Archived", value: archivedCount || 0 },
            { label: "Scheduled", value: scheduledCount || 0 },
          ]}
          button={
            userRole && allowedRoles.includes(userRole)
              ? {
                label: "Add new article",
                onClick: () => navigate("/admin/article/add-article"),
              }
              : undefined
          }
        />

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7">
          <div className="w-full min-h-[3.2rem] flex gap-x-3 items-center ">
            {/* table utilities */}
            <TimelineDatePicker onDateChange={setFilterDate} theme="light" />
            <SearchBar
              theme="light"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <CardDropdownPicker
              value={selectedCat}
              onChange={setSelectedCat}
              placeholder="Categories"
              theme="light"
              options={CatOptions}
            />
            <CardDropdownPicker
              value={selectedType}
              onChange={setSelectedType}
              placeholder="Type"
              theme="light"
              options={TypeOptions}
            />

            <CardDropdownPicker
              value={selectedStatusFilter}
              onChange={setSelectedStatusFilter}
              placeholder="Status"
              theme="light"
              options={filterStatus}
            />
          </div>
          <div className="w-full h-full flex flex-col">
            <TableHeaderContainer headers={headersMap[activeTab]} />
            <div className="w-full h-[52rem] 3xl:h-[67rem] overflow-y-auto border-y border-gray-400">
              {activeTab === "articles" && (
                <ListRenderer
                  isLoading={loading}
                  error={error}
                  items={filteredArticles}
                  emptyMessage="No appointment data available"
                  renderItem={(article) => (
                    <Articleslist
                      key={article.article_id}
                      article={article}
                      headers={articleHeaders}
                      handleStatusChange={handleStatusChange}
                      userRole={userRole}
                      currentUserId={user.id}
                      getStatusBadge={getStatusBadge}
                    />
                  )}
                />
              )}
              {activeTab === "pending" && (
                <ListRenderer
                  isLoading={loading}
                  error={error}
                  items={filteredPending}
                  emptyMessage="No pending articles"
                  renderItem={(article) => (
                    <Articleslist
                      key={article.article_id}
                      article={article}
                      headers={pendingHeaders}
                      handleStatusChange={handleStatusChange}
                      userRole={userRole}
                      currentUserId={user.id}
                      getStatusBadge={getStatusBadge}
                    />
                  )}
                />
              )}
              {activeTab === "posted" && (
                <ListRenderer
                  isLoading={loading}
                  error={error}
                  items={filteredPosted}
                  emptyMessage="No posted articles"
                  renderItem={(article) => (
                    <Articleslist
                      key={article.article_id}
                      article={article}
                      headers={postedHeaders}
                      handleStatusChange={handleStatusChange}
                      userRole={userRole}
                      currentUserId={user.id}
                      getStatusBadge={getStatusBadge}
                    />
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticleForm;
