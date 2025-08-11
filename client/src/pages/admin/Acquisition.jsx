import { useState, useCallback } from "react";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import Toast from "@/features/Toast";
import useToast from "../../components/list/commons";
import { formatDateForDisplay } from "@/components/list/commons";
import StyledButton from "../../components/buttons/StyledButton";
import { useNavigate } from "react-router-dom";
import { TableHeaderContainer, SummaryPanel } from "../../features/Utilities";

const Acquisition = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  //tabs + header management
  const tabs = [
    { key: "form", label: "Forms" },
    { key: "donator-records", label: "Donator Records" },
    { key: "transfer-status", label: "Transfer Status" },
  ];

  const formHeaders = [
    { label: "Date", width: 15 },
    { label: "Donator Name", width: "auto" },
    { label: "Title" },
    { label: "Status", width: "1fr" },
    { label: "Updated", width: 10 },
  ];

  const transferHeaders = [
    { label: "Date", width: 15 },
    { label: "Donator Name", width: 15 },
    { label: "Title" },
    { label: "Status", width: 15 },
    { label: "Transfer Status", width: 15 },
    { label: "Acquisiton Date", width: 15 },
  ];

  const recordHeaders = [
    { label: "Date", width: "w-60" },
    { label: "Name of Donator/Lender", width: "" },
    { label: "Donations", width: "w-60" },
  ];

  // set the values of this based on the db
  const formSummary = [
    { label: "Approved", value: "0" },
    { label: "Rejected", value: "0" },
    { label: "Donation", value: "0" },
    { label: "Lend", value: "0" },
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
        
        <SummaryPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Total Forms"
          totalCount={0}
          dateLabel={formatDateForDisplay(selectedDate || new Date())}
          summaryData={[
            { label: "Approved", value: "0" },
            { label: "Rejected", value: "0" },
            { label: "Donation", value: "0" },
            { label: "Lend", value: "0" },
          ]}
          button={{
            label: "Add new artifacts",
            onClick: () => navigate("/admin/acquisition/add-artifact")
          }}
        />

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7">
          {/* table */}
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

          <div className="w-full h-full flex flex-col">
            {/* table */}

            <TableHeaderContainer headers={headersMap[activeTab]} />

            <div className="w-full h-[55rem] 3xl:h-[67rem] border-y border-gray-400">
              {activeTab === "form" && (
                <>
                  {/* display list that contains forms */}
                  <div
                    onClick={() => navigate("lending/acq1")}
                    className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1"
                  >
                    <span>acquisition forms</span>
                  </div>
                  <div
                    onClick={() => navigate("donation/don1")}
                    className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1"
                  >
                    <span>donation forms</span>
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
