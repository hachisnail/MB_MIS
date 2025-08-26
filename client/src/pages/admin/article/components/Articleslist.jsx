import ListRowRenderer from "../../../../components/tables/ListRowRenderer";
import { useNavigate } from "react-router-dom";

const ArticlesListRow = ({ article, handleStatusChange, userRole, getStatusBadge, headers }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: "date",
      render: () =>
        article.upload_date
          ? new Date(article.upload_date).toLocaleDateString()
          : new Date(article.created_at).toLocaleDateString(),
    },
    {
      key: "title",
      render: () => article.title,
    },
    {
      key: "author",
      render: () => article.author || "Unknown",
    },
    {
      key: "category",
      render: () => article.article_category,
    },
    {
      key: "status",
      render: () =>
        userRole === 1 ? (
          <select
            value={article.status}
            onChange={(e) => handleStatusChange(article.article_id, e.target.value)}
            onClick={(e) => e.stopPropagation()} // Prevent row click
            className={`
              border rounded px-2 py-1 font-semibold
              ${article.status === "posted" ? "bg-green-100 text-green-700" : ""}
              ${article.status === "pending" ? "bg-yellow-100 text-yellow-700" : ""}
              ${article.status === "rejected" ? "bg-red-100 text-red-700" : ""}
              ${article.status === "archived" ? "bg-gray-100 text-gray-700" : ""}
              ${article.status === "scheduled" ? "bg-gray-100 text-blue-700" : ""}
            `}
            style={{ minWidth: "7rem", transition: "background 0.2s, color 0.2s" }}
          >
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
            <option value="scheduled">Scheduled</option>
          </select>
        ) : (
          getStatusBadge(article.status)
        ),
    },
  ];

  const handleRowClick = () => {
    const encodedId = btoa(article.article_id + " " + article.title);
    navigate(`/admin/article/edit-article/${encodedId}`);
  };


  return (
    <ListRowRenderer
      item={article}
      columns={columns}
      headers={headers}
      onRowClick={handleRowClick}
      hoverEffect={true}
    />
  );
};

export default ArticlesListRow;
