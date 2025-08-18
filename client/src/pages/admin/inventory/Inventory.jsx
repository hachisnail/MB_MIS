import { useState, useCallback } from "react";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import useToast from "../../../components/list/commons";
import Toast from "@/features/Toast";
import { SearchBar, CardDropdownPicker } from "@/features/Utilities";
import { formatDateForDisplay } from "../../../components/list/commons";
import { useNavigate } from "react-router-dom";

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("artifacts");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const inventorySuammary = [
    { label: "Total Artifacts", Value: "0" },
    { label: "Acquired", Value: "0" },
    { label: "Borrowing", Value: "0" },
    { label: "Under Maintenance", Value: "0" },
    { label: "On Display", Value: "0" },
    { label: "In Storage", Value: "0" },
  ];

  const tabs = [
    { key: "artifacts", label: "Artifacts" },
    { key: "acquired", label: "Acquired" },
    { key: "borrowing", label: "Borrowing" },
  ];

  const artifactsHeaders = [
    { label: "Title", width: "" },
    { label: "Donator Name", width: "" },
    { label: "Origin", width: "w-80" },
    { label: "Acquisition Date", width: "" },
    { label: "Type", width: "w-50" },
    { label: "Display Status", width: "" },
    { label: "Last Maintenance", width: "" },
    { label: "Contract Expiration", width: "" },
  ];

  const acquiredHeaders = [
    { label: "Title", width: "" },
    { label: "Donator Name", width: "" },
    { label: "Origin", width: "w-80" },
    { label: "Acquisition Date", width: "" },
    { label: "Display Status", width: "" },
    { label: "Last Maintenance", width: "" },
  ];

  const borrowingHeaders = [
    { label: "Title", width: "" },
    { label: "Donator Name", width: "" },
    { label: "Origin", width: "w-80" },
    { label: "Acquisition Date", width: "" },
    { label: "Display Status", width: "" },
    { label: "Last Maintenance", width: "" },
    { label: "Contract Information", width: "" },
  ];

  const headersMap = {
    artifacts: artifactsHeaders,
    acquired: acquiredHeaders,
    borrowing: borrowingHeaders,
  };

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

  return (
    <>
      <div className="w-full h-full items-center flex flex-col overflow-scroll gap-y-10">
        <div className="w-fit flex-wrap flex gap-7 items-center justify-center">
          {inventorySuammary.map(({ label, Value }) => (
            <div
              key={label}
              className="w-70 rounded-sm h-25 text-white bg-black font-semibold  flex flex-col items-center justify-center"
            >
              <span className="text-sm">{label}</span>
              <span className="text-5xl">{Value}</span>
            </div>
          ))}
        </div>

        <div className="w-full h-full flex flex-col gap-y-7 overflow-auto">
          {/* header + table utilities */}
          <div className="min-w-[100rem] min-h-[3.2rem] gap-x-5 flex ">
            <div className="min-w-[34rem] max-w-[34rem]  min-h-[3.2rem] flex items-start gap-x-2">
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
              // ]}
            />
            <CardDropdownPicker
              // value={statusFilter}
              // onChange={setStatusFilter}
              placeholder="All Statuses"
              theme="light"
              // options={[
              //   { value: 'All Statuses', label: 'All Statuses' },

              // ]}
            />
            <div className="h-full justify-end min-w-[13rem] flex items-center">
              <span className="text-2xl font-semibold text-[#727272]">
                {formatDateForDisplay(selectedDate || new Date())}
              </span>
            </div>
          </div>

          {/* table data */}
          <div className="w-full h-[52rem] flex flex-col">
            {/* table */}
            <div
              className={`grid ${
                (activeTab === "artifacts" &&
                  "grid-cols-[1fr_1fr_auto_auto_auto_auto_auto_auto]") ||
                (activeTab === "acquired" &&
                  "grid-cols-[1fr_1fr_auto_auto_auto_auto]") ||
                (activeTab === "borrowing" &&
                  "grid-cols-[1fr_1fr_auto_auto_auto_auto_auto]")
              } py-4 gap-y-5 h-fit`}
            >
              {/* table header */}
              {(headersMap[activeTab] || []).map(({ label, width }) => (
                <div
                  key={label}
                  className={`${width} text-[#727272] font-semibold flex px-3 py-2 text-2xl`}
                >
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="w-full h-[43.7rem] border-y border-gray-400">
              {activeTab === "artifacts" && (
                <>
                  {/* display list that artifacts records*/}
                  <div onClick={() => navigate(`YXJ0aWZhY3Qx`)} className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>artifacts artifacts</span>
                  </div>
                </>
              )}
              {activeTab === "acquired" && (
                <>
                  {/* display list that contains acquired artifacts */}
                  <div className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>acquired artifacts</span>
                  </div>
                </>
              )}
              {activeTab === "borrowing" && (
                <>
                  {/* display list that contains borrowing artifacts */}
                  <div className="text-2xl font-semibold py-2 flex justify-center border-gray-400 border-b-1">
                    <span>borrowing artifacts</span>
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

export default Inventory;
