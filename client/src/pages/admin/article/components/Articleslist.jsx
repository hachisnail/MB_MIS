import ListRowRenderer from "../../../../components/tables/ListRowRenderer";
import { useNavigate } from "react-router-dom";
import { STATUS, STATUS_LABELS } from '../components/articleStatus';

const Articleslist = ({ article, handleStatusChange, userRole, currentUserId, getStatusBadge, headers }) => {
  const navigate = useNavigate();
  const STATUS_CLASSES = {
    posted:    'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    rejected:  'bg-red-100 text-red-700',
    archived:  'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
  };

  const columns = [
    {
      key: "date",
      render: () =>
        article.upload_date
          ? new Date(article.upload_date).toLocaleDateString()
          : new Date(article.created_at).toLocaleDateString(),
    },
    { key: "title", render: () => article.title },
    { key: "author", render: () => article.author || "Unknown" },
    { key: "category", render: () => article.article_category },
    {
      key: "status",
      render: () =>
        userRole === 1 ? (
          <select
            value={article.status}
            onChange={(e) => handleStatusChange(article.article_id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className={`border rounded px-2 py-1 font-semibold ${STATUS_CLASSES[article.status] || ''}`}
            style={{ minWidth: "7rem", transition: "background 0.2s, color 0.2s" }}
          >
            {STATUS.map(s => (
              <option key={s.value} value={s.value}>
                {STATUS_LABELS[s.value] ?? s.label}
              </option>
            ))}
          </select>
        ) : (
          getStatusBadge(article.status)
        ),
    },
  ];

  const handleRowClick = () => {
    const encodedId = btoa(article.article_id + " " + article.title);
    const allowedRoles = [1, 2, 5];
    const isPrivileged = allowedRoles.includes(userRole);
    const isOwner = String(article.user_id) === String(currentUserId);

    navigate(`/admin/article/edit-article/${encodedId}`, {
      state: { forceReviewMode: isPrivileged && !isOwner }
    });
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

export default Articleslist;
