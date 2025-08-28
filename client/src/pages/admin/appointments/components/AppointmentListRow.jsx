import ListRowRenderer from "../../../../components/tables/ListRowRenderer";
import { useNavigate } from "react-router-dom";
import { formatTimeDisplay } from "./dateUtils";
import { getStatusLabel } from "./statusUtils";

const AppointmentListRow = ({
    appointment,
    headers,
    onRowClick,
    activePreviewId,
    cameFrom = "forms"
}) => {
    const navigate = useNavigate();

    const status = appointment.AppointmentStatus?.status || "To Review";
    const updatedAt = appointment.AppointmentStatus?.updated_at
        ? new Date(appointment.AppointmentStatus.updated_at).toLocaleString()
        : "N/A";

    const visitorName =
        `${appointment.Visitor?.first_name || ""} ${appointment.Visitor?.last_name || ""
            }`.trim() || "Unknown Visitor";

    // Base columns that are always present
    const baseColumns = [
        {
            key: "creation_date",
            render: () =>
                appointment.creation_date
                    ? new Date(appointment.creation_date).toLocaleString()
                    : "N/A",
        },
        {
            key: "visitor_name",
            render: () => visitorName,
        },
        {
            key: "preferred_time",
            render: () => {
                // First check if there's a preferred_time field with time range
                if (appointment.preferred_time && appointment.preferred_time.includes('-')) {
                    return appointment.preferred_time;
                }
                // Then check for start_time and end_time
                if (appointment.start_time || appointment.end_time) {
                    return formatTimeDisplay(appointment.start_time, appointment.end_time);
                }
                // Default to showing preferred_time if it exists, otherwise "Flexible"
                return appointment.preferred_time || "Flexible";
            },
        },
        {
            key: "status",
            render: () => getStatusLabel(status),
        },
        {
            key: "visitor_count",
            render: () => appointment.population_count || 0,
        },
    ];

    // Add "Last Updated" column only if not in pending tab
    const columns = cameFrom === "pending"
        ? baseColumns
        : [
            ...baseColumns,
            {
                key: "updated_at",
                render: () => updatedAt,
            },
        ];

    const handleRowClick = () => {
        if (onRowClick) {
            onRowClick(appointment);
        }
    };

    const isActive = activePreviewId === appointment.appointment_id;

    return (
        <ListRowRenderer
            item={appointment}
            columns={columns}
            headers={headers}
            onRowClick={handleRowClick}
            hoverEffect={true}
            rowClassName={isActive ? "bg-black text-white" : ""}
            cameFrom={cameFrom}
        />
    );
};

export default AppointmentListRow;
