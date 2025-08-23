import { NavLink, useNavigate } from "react-router-dom";
import { formatDate, formatTimeDisplay } from "./dateUtils";
import { getStatusLabel } from "./statusUtils";

// ---------------- Appointment Form Item ----------------
export const AppointmentFormItem = ({
  activePreview,
  appointment,
  cameFrom = "forms",
}) => {
  const status = appointment.AppointmentStatus?.status || "To Review";
  const updatedAt = appointment.AppointmentStatus?.updated_at
    ? new Date(appointment.AppointmentStatus.updated_at).toLocaleString()
    : "N/A";

  const visitorName =
    `${appointment.Visitor?.first_name || ""} ${
      appointment.Visitor?.last_name || ""
    }`.trim() || "Unknown Visitor";

  return (
    <div
      state={{ cameFrom }}
      className={`${
        activePreview === appointment.appointment_id
          ? "bg-black rounded-md text-white hover:bg-gray-900"
          : "hover:bg-gray-300"
      } text-xl h-fit grid grid-cols-[15rem_1fr_11.7rem_9.5rem_12rem_16rem] cursor-pointer `}
    >
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {appointment.creation_date
          ? new Date(appointment.creation_date).toLocaleString()
          : "N/A"}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">{visitorName}</div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {formatTimeDisplay(appointment.start_time, appointment.end_time)}
      </div>
      <div className="px-4 flex items-center  border-b-1 border-gray-400">
        {getStatusLabel(status)}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {appointment.population_count}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">{updatedAt}</div>
    </div>
  );
};

// ---------------- Appointment Preview ----------------
export const AppointmentPreview = ({ appointment, cameFrom = "forms" }) => {
  const navigate = useNavigate();
  const visitorName =
    `${appointment.Visitor?.first_name || ""} ${
      appointment.Visitor?.last_name || ""
    }`.trim() || "Unknown Visitor";

  const breadcrumbText = `${appointment.appointment_id} ${visitorName}`;
  const encodedId = btoa(breadcrumbText);

  const appointmentInfo = [
    {
      Label: "Email",
      Value: appointment.Visitor?.email || "No Email",
    },
    {
      Label: "Phone Number",
      Value: appointment.Visitor?.phone || "No contact info",
    },
    {
      Label: "Address",
      Value:
        appointment.Visitor?.street +
          " " +
          appointment.Visitor?.barangay +
          " " +
          appointment.Visitor?.city_municipality +
          " " +
          appointment.Visitor?.province || "No Address",
    },
    {
      Label: "Organization",
      Value: appointment.Visitor?.organization || "No Organization",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-y-7">
      <div className="border-b-1 border-gray-400 flex items-center justify-between">
        <span className="mb-3 text-3xl font-semibold">{visitorName}</span>
        <span className="text-lg">{formatDate(appointment.creation_date)}</span>
      </div>

      {/* Contact Info */}
      <div className="w-full h-fit flex flex-col gap-y-3 border-b-1 border-gray-400 pb-5">
        {appointmentInfo.map(({ Label, Value }) => (
          <div key={Label} className="flex gap-x-2 w-full h-fit">
            <div className="w-full h-fit flex flex-col">
              <span className="text-xl font-semibold">{Label}</span>
              <span className="h-5 text-lg text-[#4E84D4]">{Value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Extra Info */}
      <div className="w-full h-fit gap-y-3 flex flex-col">
        <div className="flex flex-col">
          <span className="text-xl font-semibold">Purpose of visit:</span>
          <span className="h-5 text-lg text-[#4E84D4]">
            {appointment.purpose_of_visit}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold">Population count:</span>
          <span className="h-5 text-lg text-[#4E84D4]">
            {appointment.population_count}
          </span>
        </div>
        <div className="flex justify-between h-fit w-full">
          <div className="flex flex-col">
            <span className="text-xl font-semibold">Preferred date:</span>
            <span className="h-5 text-lg text-[#4E84D4]">
              {appointment.preferred_date || "No preferred date"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold">Preferred Time:</span>
            <span className="h-5 text-lg text-[#4E84D4]">
              {appointment.preferred_time || "No preferred time"}
            </span>
          </div>
        </div>

        <div className="w-full mt-7 h-fit rounded-md bg-gray-200 p-5 flex flex-col">
          <span className="text-xl">Notes:</span>
          <span className="h-37 overflow-y-auto text-lg text-[#4E84D4]">
            {appointment.additional_notes}
          </span>
        </div>
      </div>

      {/* Open Button */}
      <div className="w-full h-10 flex justify-end">
        <button
          className="flex items-center justify-center gap-x-2 px-4 rounded-sm bg-[#4E84D4] hover:bg-blue-900"
          onClick={() => navigate(encodedId)}
        >
          <span className="text-white font-medium">Open</span>
        </button>
      </div>
    </div>
  );
};

// ---------------- Attendance Item ----------------
export const AttendanceItem = ({ attendance, cameFrom = "attendance" }) => {
  const presentValue = attendance.present ?? "ongoing";
  const visitorName = attendance.visitorName || "Unknown Visitor";
  const breadcrumbText = `${attendance.appointment_id} ${visitorName}`;
  const encodedId = attendance.appointment_id ? btoa(breadcrumbText) : "#";

  return (
    <NavLink
      to={encodedId}
      state={{ cameFrom }}
      className="text-xl min-w-fit h-fit grid grid-cols-[15rem_1fr_12.3rem_11.5rem_12.5rem_13rem] hover:bg-gray-300 cursor-pointer"
    >
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {attendance.date}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {attendance.visitorName}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {attendance.purpose}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {attendance.preferredDate}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">
        {attendance.expectedVisitor}
      </div>
      <div className="px-4 py-3 border-b-1 border-gray-400">{presentValue}</div>
    </NavLink>
  );
};

// ---------------- Visitor Record Item ----------------
export const VisitorRecordItem = ({
  record,
  isExpanded,
  onToggle,
  cameFrom = "visitorRecords",
}) => {
  return (
    <>
      {/* Main Row */}
      <div
        className="text-xl h-fit  grid grid-cols-[1fr_1fr_39rem] cursor-pointer hover:bg-gray-300 border-b-1 border-gray-400"
        onClick={() => onToggle(record.id)}
      >
        <div className="px-4 py-3">{formatDate(record.date)}</div>
        <div className="px-4 py-3">{record.visitorName}</div>
        <div className="px-4 py-3 flex justify-between items-center">
          <span>{record.visitCount}</span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="w-full flex justify-end">
          <div className="w-[45%] my-4 mr-4 rounded-lg overflow-hidden shadow-sm shadow-black">
            {record.details && record.details.length > 0 ? (
              <div className="max-h-[10rem] overflow-y-auto">
                <table className="w-full border-collapse bg-white">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-400">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Purpose of visit
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Visitor Count
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Present
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.details.map((detail, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx !== record.details.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }
                      >
                        <td className="py-3 px-4 text-gray-800">
                          {detail.purpose}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-800">
                          {detail.visitorCount}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-800">
                          {detail.present}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-800">
                          {formatDate(detail.date)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {detail.appointment_id && (
                            <NavLink
                              to={btoa(
                                `${detail.appointment_id} ${
                                  record.visitorName || "Unknown Visitor"
                                }`
                              )}
                              state={{ cameFrom }}
                              className="text-blue-500 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </NavLink>
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
