import React, { useState } from "react";
import ListRowRenderer from "../../../../components/tables/ListRowRenderer";
import { NavLink } from "react-router-dom";
import { formatDate } from "./dateUtils";

const VisitorRecordListRow = ({
    record,
    headers,
    cameFrom = "visitorRecords"
}) => {
    const columns = [
        {
            key: "date",
            render: () => formatDate(record.date),
        },
        {
            key: "visitor_name",
            render: () => record.visitorName || "Unknown Visitor",
        },
        {
            key: "visit_count",
            render: () => record.visitCount || 0,
        },
    ];

    // Prepare details for expansion with View links
    const details = record.details && record.details.length > 0
        ? record.details.map((detail, idx) => ({
            key: `${record.id}-${idx}`,
            "Purpose of visit": detail.purpose,
            "Visitor Count": detail.visitorCount,
            "Present": detail.present,
            "Date": formatDate(detail.date),
            "Action": detail.appointment_id ? (
                <NavLink
                    to={btoa(
                        `${detail.appointment_id} ${record.visitorName || "Unknown Visitor"
                        }`
                    )}
                    state={{ cameFrom }}
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    View
                </NavLink>
            ) : ""
        }))
        : [];

    return (
        <ListRowRenderer
            item={record}
            columns={columns}
            headers={headers}
            details={details}
            onRowClick={null} // Let ListRowRenderer handle expansion
            hoverEffect={true}
            cameFrom={cameFrom}
            rowKey={record.id}
        />
    );
};

export default VisitorRecordListRow;
