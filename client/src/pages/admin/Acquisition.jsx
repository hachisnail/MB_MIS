import { useState, useCallback } from "react";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import Toast from "@/features/Toast";
import useToast from "../../components/list/commons";
import { formatDateForDisplay } from "@/components/list/commons";
import StyledButton from "../../components/buttons/StyledButton";
import { useNavigate } from "react-router-dom";

const Acquisition = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");


  const navigate = useNavigate();
  const tabs = [
    { key: "form", label: "Forms" },
    { key: "donator-records", label: "Donator Records" },
    { key: "transfer-status", label: "Transfer Status" },
  ];


  // set the values of this based on the db
  const formSummary = [
    { label: "Approved", value: "0" },
    { label: "Rejected", value: "0" },
    { label: "Donation", value: "0" },
    { label: "Lend", value: "0" },
  ];

  const formHeaders = [
    { label: "Date", width: "w-60" },
    { label: "Donator Name", width: "w-60" },
    { label: "Title", width: "" },
    { label: "Status", width: "w-60" },
    { label: "Updated", width: "w-60" },
  ];

  const transferHeaders = [
    { label: "Date", width: "w-60" },
    { label: "Donator Name", width: "w-60" },
    { label: "Title", width: "" },
    { label: "Status", width: "w-60" },
    { label: "Transfer Status", width: "w-60" },
    { label: "Acquisiton Date", width: "w-60" },
  ];
  const recordHeaders = [
    { label: "Date", width: "w-60" },
    { label: "Name of Donator/Lender", width: "" },
    { label: "Donations", width: "w-60" },
  ];
  const { toastConfig, showToast, hideToast } = useToast();

  const handleDateChange = useCallback(
    (date) => {
      setSelectedDate(date);
      if (date) {
        showToast(`Filtering data for ${formatDateForDisplay(date)}`, "info");
      } else {
        showToast("Showing all dates", "info");
      }
    },
    [showToast]
  );


  const headersMap = {
  "form": formHeaders,
  "transfer-status": transferHeaders,
  "donator-records": recordHeaders,
  };

  return (
    <>
      <div className="w-full h-full flex gap-x-5 overflow-scroll lg:flex-row flex-col">
        <div className="pb-5 min-w-[34rem] max-w-[34rem] h-full flex flex-col gap-y-7 ">
          <div className=" min-h-[3.2rem] flex items-start gap-x-2">
            {/* table setter */}
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                className={`w-fit cursor-pointer h-full px-4 rounded-lg border-1 text-2xl font-semibold  ${
                  activeTab === key
                    ? "bg-black text-white border-black"
                    : "border-gray-500"
                }`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="h-fit w-full flex flex-col gap-y-[5rem]">
            <div className="w-full h-[5rem] bg-black rounded-sm flex px-4 text-2xl items-center justify-between font-semibold">
              <span className="text-white">Total Forms</span>
              <span className="w-[6rem] h-[3rem] bg-[#D4DBFF] flex items-center justify-center rounded-md">
                5{/* total number of forms gets displayed here */}
              </span>
            </div>
            <div className="w-full h-fit flex flex-col gap-y-7">
              <span className="text-2xl font-semibold text-[#727272]">
                {formatDateForDisplay(selectedDate || new Date())}
              </span>
              {formSummary.map(({ label, value }) => (
                <div key={label} className="w-full h-fit flex justify-between">
                  <span className="text-2xl font-semibold">{label}</span>
                  <div className="w-[5rem] h-[2rem] flex items-center bg-[#D4DBFF] rounded-md justify-center">
                    <span className="text-2xl font-semibold">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <StyledButton
            buttonColor="bg-black"
            className="justify-between flex px-8 h-25 items-center shadow-md shadow-gray-600"
            onClick={()=> (navigate("/admin/acquisition/add-artifact"))}
          >
            <span className="text-3xl font-semibold">Add new artifacts</span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
          </StyledButton>
        </div>

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7">
          {/* right table */}
          <div className="w-full min-h-[3.2rem] flex gap-x-3 items-center ">
            {/* table utilities */}
            <TimelineDatePicker
              defaultValue={
                selectedDate ? selectedDate.toISOString().split("T")[0] : ""
              }
              onDateChange={(dateString) =>
                handleDateChange(dateString ? new Date(dateString) : null)
              }
              theme="light"
            />

            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
              <SearchBar
                theme="light"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search History"
              />
            </div>

            <CardDropdownPicker
              // value={`${columnFilter}|${sortDirection}`}
              // onChange={(value) => {
              //   const [column, direction] = value.split('|');
              //   setColumnFilter(column);
              //   setSortDirection(direction || 'asc');
              // }}
              placeholder="Sort By..."
              theme="light"
              // options={[
              //   { value: '', label: 'Sort By...' },
              //   ...(activeTab === 'forms' ? [
              //     { value: 'creation_date|asc', label: 'Creation Date (Oldest First)' },
              //     { value: 'creation_date|desc', label: 'Creation Date (Newest First)' },
              //     { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
              //     { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
              //     { value: 'preferred_time|asc', label: 'Preferred Time (Earliest First)' },
              //     { value: 'preferred_time|desc', label: 'Preferred Time (Latest First)' },
              //     { value: 'status|asc', label: 'Status (A-Z)' },
              //     { value: 'status|desc', label: 'Status (Z-A)' },
              //     { value: 'visitor_count|asc', label: 'Visitor Count (Low-High)' },
              //     { value: 'visitor_count|desc', label: 'Visitor Count (High-Low)' },
              //     { value: 'updated_at|asc', label: 'Last Updated (Oldest First)' },
              //     { value: 'updated_at|desc', label: 'Last Updated (Newest First)' }
              //   ] : activeTab === 'attendance' ? [
              //     { value: 'date|asc', label: 'Date (Oldest First)' },
              //     { value: 'date|desc', label: 'Date (Newest First)' },
              //     { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
              //     { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
              //     { value: 'purpose|asc', label: 'Purpose of Visit (A-Z)' },
              //     { value: 'purpose|desc', label: 'Purpose of Visit (Z-A)' },
              //     { value: 'preferred_date|asc', label: 'Preferred Date (Oldest First)' },
              //     { value: 'preferred_date|desc', label: 'Preferred Date (Newest First)' },
              //     { value: 'expected_visitor|asc', label: 'Expected Visitors (Low-High)' },
              //     { value: 'expected_visitor|desc', label: 'Expected Visitors (High-Low)' },
              //     { value: 'present|asc', label: 'Present Count (Low-High)' },
              //     { value: 'present|desc', label: 'Present Count (High-Low)' }
              //   ] : [
              //     { value: 'date|asc', label: 'Date (Oldest First)' },
              //     { value: 'date|desc', label: 'Date (Newest First)' },
              //     { value: 'visitor_name|asc', label: 'Visitor Name (A-Z)' },
              //     { value: 'visitor_name|desc', label: 'Visitor Name (Z-A)' },
              //     { value: 'visit_counts|asc', label: 'Visit Counts (Low-High)' },
              //     { value: 'visit_counts|desc', label: 'Visit Counts (High-Low)' }
              //   ])
              // ]}
            />
            <CardDropdownPicker
              // value={statusFilter}
              // onChange={setStatusFilter}
              placeholder="All Statuses"
              theme="light"
              // options={[
              //   { value: 'All Statuses', label: 'All Statuses' },
              //   { value: 'Confirmed', label: 'Confirmed' },
              //   { value: 'Rejected', label: 'Rejected' },
              //   { value: 'Failed', label: 'Failed' },
              //   { value: 'To Review', label: 'To Review' },
              //   { value: 'Completed', label: 'Completed' }
              // ]}
            />
          </div>

          <div className="w-full h-[61rem] flex flex-col">
            {/* table */}
            <div
              className={`grid ${
                (activeTab === "form" &&
                  "grid-cols-[auto_auto_1fr_auto_auto]") ||
                (activeTab === "transfer-status" &&
                  "grid-cols-[auto_auto_1fr_auto_auto_auto]") ||
                (activeTab === "donator-records" && "grid-cols-[auto_1fr_auto]")
              } py-4 gap-y-5 h-fit`}
            >
              {/* table header */}
                { (headersMap[activeTab] || []).map(({label, width}) => (
                 <div
                    key={label}
                    className={`${width} text-[#727272] font-semibold flex px-3 py-2 text-2xl`}
                  >
                    <span>{label}</span>
                  </div>

                ))

                }
            </div>
            <div className="w-full h-[55rem] border-t border-gray-400">
              {activeTab === "form" && (
                <>
                  {/* display list that contains forms */}
                  <div className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>forms</span>
                  </div>
                </>
              )}
              {activeTab === "donator-records" && (
                <>
                  {/* display list that contains donator-records form */}
                  <div className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>donator records</span>
                  </div>
                </>
              )}
              {activeTab === "transfer-status" && (
                <>
                  {/* display list that contains transfer-Status form */}
                  <div className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>transfer status</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* modals below */}
      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />
    </>
  );
};

export default Acquisition;
