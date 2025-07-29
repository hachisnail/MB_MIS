import { NavLink } from "react-router-dom";

// Status color mapping
const statusColorMap = {
    'confirmed': 'bg-green-500 text-white',
    'rejected': 'bg-red-600 text-white',
    'failed': 'bg-orange-600 text-white',
    'to review': 'bg-purple-200 text-black',
    'completed': 'bg-blue-600 text-white',
    'default': 'bg-gray-200 text-gray-800'
};

// Helper functions
export const convertTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const cleanTime = timeStr.includes(':') ? timeStr.split(':').slice(0, 2).join(':') : timeStr;
    const [hourStr, minuteStr] = cleanTime.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || '0', 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
};

export const formatTimeDisplay = (start_time, end_time) => {
    if (!start_time || !end_time) {
        return 'Flexible';
    }
    const formattedStart = convertTo12Hour(start_time);
    const formattedEnd = convertTo12Hour(end_time);
    if (formattedStart && formattedEnd) {
        return `${formattedStart} - ${formattedEnd}`;
    }
    return 'Flexible';
};

export const standardizeStatus = (status) => {
    if (!status) return 'To Review';
    const formatted = status.toLowerCase().replace(/_/g, ' ');
    return formatted
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const getStatusLabel = (status) => {
    const standardStatus = standardizeStatus(status);
    const colorClass = statusColorMap[standardStatus.toLowerCase()] || statusColorMap.default;

    return (
        <span className={`${colorClass} h-9 w-30 px-2 py-1 rounded inline-flex items-center justify-center`}>
            {standardStatus}
        </span>
    );
};

export const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
};

export const formatDateForDisplay = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

// Appointment Form Item Component
export const AppointmentFormItem = ({ appointment, cameFrom = 'forms' }) => {
    const status = standardizeStatus(appointment.AppointmentStatus?.status || 'To Review');
    const updatedAt = appointment.AppointmentStatus?.updated_at
        ? new Date(appointment.AppointmentStatus.updated_at).toLocaleString()
        : 'N/A';
    // Include visitor name, status, and date in the encoded string for better breadcrumb display
    const visitorName = `${appointment.Visitor?.first_name || ''} ${appointment.Visitor?.last_name || ''}`.trim() || 'Unknown Visitor';
    const appointmentDate = appointment.preferred_date || appointment.creation_date;
    const formattedDate = appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const timeSlot = formatTimeDisplay(appointment.start_time, appointment.end_time);
    const visitorCount = appointment.population_count || '0';

    // Create a simple, readable breadcrumb with just the essential info
    const breadcrumbText = `${appointment.appointment_id} ${visitorName}`;
    const encodedId = btoa(breadcrumbText);

    return (
        <NavLink
            to={encodedId}
            state={{ cameFrom }}
            className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-6 cursor-pointer hover:bg-gray-300"
        >
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {appointment.creation_date
                    ? new Date(appointment.creation_date).toLocaleString()
                    : 'N/A'}
            </div>
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {appointment.Visitor?.first_name} {appointment.Visitor?.last_name}
            </div>
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {formatTimeDisplay(appointment.start_time, appointment.end_time)}
            </div>
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {getStatusLabel(status)}
            </div>
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {appointment.population_count}
            </div>
            <div className="px-4 py-3 border-b-1 border-gray-400">
                {updatedAt}
            </div>
        </NavLink>
    );
};

// Attendance Item Component
export const AttendanceItem = ({ attendance, cameFrom = 'attendance' }) => {
    const presentValue = attendance.present ?? 'ongoing';
    // Include visitor name and date in the encoded string for better breadcrumb display
    const visitorName = attendance.visitorName || 'Unknown Visitor';
    const attendanceDate = attendance.preferredDate || attendance.date;
    const formattedDate = attendanceDate ? new Date(attendanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const purposeShort = attendance.purpose ? attendance.purpose.substring(0, 30) + (attendance.purpose.length > 30 ? '...' : '') : '';

    // Create a simple, readable breadcrumb
    const breadcrumbText = `${attendance.appointment_id} ${visitorName}`;
    const encodedId = attendance.appointment_id ? btoa(breadcrumbText) : '#';

    return (
        <NavLink
            to={encodedId}
            state={{ cameFrom }}
            className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-6 hover:bg-gray-300 cursor-pointer"
        >
            <div className="px-4 py-3 border-b-1 border-gray-400">{attendance.date}</div>
            <div className="px-4 py-3 border-b-1 border-gray-400">{attendance.visitorName}</div>
            <div className="px-4 py-3 border-b-1 border-gray-400">{attendance.purpose}</div>
            <div className="px-4 py-3 border-b-1 border-gray-400">{attendance.preferredDate}</div>
            <div className="px-4 py-3 border-b-1 border-gray-400">{attendance.expectedVisitor}</div>
            <div className="px-4 py-3 border-b-1 border-gray-400">{presentValue}</div>
        </NavLink>
    );
};

// Visitor Record Item Component
export const VisitorRecordItem = ({ record, isExpanded, onToggle, cameFrom = 'visitorRecords' }) => {
    return (
        <>
            {/* Main Row */}
            <div
                className="min-w-[94rem] text-xl h-fit font-semibold grid grid-cols-3 cursor-pointer hover:bg-gray-300 border-b-1 border-gray-200"
                onClick={() => onToggle(record.id)}
            >
                <div className="px-4 py-4">{formatDate(record.date)}</div>
                <div className="px-4 py-4">{record.visitorName}</div>
                <div className="px-4 py-4 flex justify-between items-center">
                    <span>{record.visitCount}</span>
                    <svg
                        className={`w-5 h-5 mr-4 text-gray-500 transform ${isExpanded ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="min-w-[94rem] flex justify-end">
                    <div className="w-[45%] my-4 mr-4 rounded-lg overflow-hidden shadow-sm">
                        {record.details && record.details.length > 0 ? (
                            <div style={{
                                maxHeight: record.details.length > 3 ? 'calc(3*3.5rem)' : 'auto',
                                overflowY: record.details.length > 3 ? 'scroll' : 'visible',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#333 #ccc'
                            }}>
                                <table className="w-full border-collapse bg-white">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose of visit</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Visitor Count</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Present</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Date</th>
                                            <th className="w-10 py-3 px-2 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.details.map((detail, idx) => (
                                            <tr key={idx} className={idx !== record.details.length - 1 ? "border-b border-gray-200" : ""}>
                                                <td className="py-3 px-4 text-gray-800">{detail.purpose}</td>
                                                <td className="py-3 px-4 text-center text-gray-800">{detail.visitorCount}</td>
                                                <td className="py-3 px-4 text-center text-gray-800">{detail.present}</td>
                                                <td className="py-3 px-4 text-center text-gray-800">{formatDate(detail.date)}</td>
                                                <td className="py-3 px-2 text-right">
                                                    {detail.appointment_id ? (
                                                        <NavLink
                                                            to={btoa(`${detail.appointment_id} ${record.visitorName || 'Unknown Visitor'}`)}
                                                            state={{ cameFrom }}
                                                            className="text-blue-500 hover:text-blue-700"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </NavLink>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            <svg
                                                                className="w-5 h-5"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No details available for this record.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
