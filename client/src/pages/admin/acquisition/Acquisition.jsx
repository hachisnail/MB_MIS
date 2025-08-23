import { useState, useCallback, useEffect } from "react";
import {
  SearchBar,
  CardDropdownPicker,
  TableHeaderContainer,
  SummaryPanel,
} from "@/features/Utilities";
import {
  formatDateForDisplay,
  ErrorBox,
  EmptyMessage,
  LoadingSpinner,
} from "@/components/commons";

import ListRenderer from "@/components/tables/ListRenderer";
import { useNavigate } from "react-router-dom";
import { AcquisitionItem } from "./components/Acquisitonlist";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import axiosClient from "@/lib/axiosClient";
import useToast from "@/components/commons";

const Acquisition = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [acquisitions, setAcquisiitons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // ✅ Add missing state
  const [transferFilter, setTransferFilter] = useState("All");

  const navigate = useNavigate();

  //tabs + header management
  const tabs = [
    { key: "form", label: "Forms" },
    { key: "donator-records", label: "Donator Records" },
    { key: "transfer-status", label: "Transfer Status" },
  ];

  const formHeaders = [
    { label: "Creation Date", width: 13 },
    { label: "Donors Name", width: "1fr" },
    { label: "Title", width: "1fr" },
    { label: "Status", width: 12 },
    { label: "Type", width: 10 },
  ];

  const transferHeaders = [
    { label: "Date", width: 15 },
    { label: "Donors Name", width: 15 },
    { label: "Title" },
    { label: "Status", width: 15 },
    { label: "Transfer Status", width: 15 },
    { label: "Acquisiton Date", width: 15 },
  ];

  const recordHeaders = [
    { label: "Date", width: "w-60" },
    { label: "Name of Donor/Lender", width: "" },
    { label: "Donations", width: "w-60" },
  ];

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

  const filteredAcquisitions = acquisitions.filter((item) => {
    const statusMatch =
      statusFilter === "All Statuses" ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    const transferMatch =
      transferFilter === "All" ||
      item.transfer_status?.toLowerCase() === transferFilter.toLowerCase();

    const searchMatch =
      item?.ContributionArtifact?.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.Contributor?.first_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      item?.Contributor?.last_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return statusMatch && transferMatch && searchMatch;
  });

  const headersMap = {
    form: formHeaders,
    "transfer-status": transferHeaders,
    "donator-records": recordHeaders,
  };

  useEffect(() => {
    fetchAcquiisitons();
  }, []);

  const fetchAcquiisitons = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get(`/auth/contributions`);
      setAcquisiitons(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(
        "Failed to load articles. Check that the API server is running."
      );
      setAcquisiitons([]);
      setIsLoading(false);
    }
  };
  // console.log(acquisitions);
  const totalCount = acquisitions.length;
  const approvedCount = acquisitions.filter(
    (a) => a.status === "approved"
  ).length;
  const rejectedCount = acquisitions.filter(
    (a) => a.status === "rejected"
  ).length;
  const pendingCount = acquisitions.filter(
    (a) => a.status === "pending"
  ).length;
  const donationCount = acquisitions.filter(
    (a) => a.contribution_type === "donation"
  ).length;
  const lendingCount = acquisitions.filter(
    (a) => a.contribution_type === "lending"
  ).length;

  return (
    <>
      <div className="w-full h-full flex gap-x-15 overflow-scroll lg:flex-row flex-col">
        <SummaryPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Total Acquisitions"
          totalCount={totalCount}
          dateLabel={formatDateForDisplay(selectedDate || new Date())}
          summaryData={[
            { label: "Approved", value: approvedCount },
            { label: "Rejected", value: rejectedCount },
            { label: "Pending", value: pendingCount },
            { label: "Donation", value: donationCount },
            { label: "Lend", value: lendingCount },
          ]}
          button={{
            label: "Add new acquisition",
            onClick: () => navigate("/admin/acquisition/add-artifact"),
          }}
        />

        <div className="w-full h-full flex flex-col min-w-[43.75rem] gap-y-7">
          {/* table */}
          <div className="w-full min-h-[3.2rem] flex gap-x-3 items-center">
            {/* Date filter */}
            <TimelineDatePicker
              defaultValue={
                selectedDate ? selectedDate.toISOString().split("T")[0] : ""
              }
              onDateChange={(dateString) =>
                handleDateChange(dateString ? new Date(dateString) : null)
              }
              theme="light"
            />

            {/* Search bar */}
            <div className="[&_input]:text-black [&_input]:placeholder-gray-500">
              <SearchBar
                theme="light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search History"
              />
            </div>

            {/* Status filter */}
            <CardDropdownPicker
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              theme="light"
              options={[
                { value: "All Statuses", label: "All Statuses" },
                { value: "Approved", label: "Approved" },
                { value: "Rejected", label: "Rejected" },
                { value: "Pending", label: "Pending" },
              ]}
            />

            {/* Transfer status filter */}
            <CardDropdownPicker
              value={transferFilter}
              onChange={setTransferFilter}
              placeholder="All Transfer Statuses"
              theme="light"
              options={[
                { value: "All", label: "All Transfer Statuses" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Rejected", label: "Rejected" },
                { value: "Failed", label: "Failed" },
                { value: "To Review", label: "To Review" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </div>

          <div className="w-full h-full flex flex-col">
            {/* table */}

            <TableHeaderContainer headers={headersMap[activeTab]} />

            <div className="w-full h-[52rem] 3xl:h-[67rem] border-y overflow-y-auto border-gray-400">
              {activeTab === "form" && (
                <>
                  <ListRenderer
                    isLoading={isLoading}
                    error={error}
                    items={filteredAcquisitions}
                    renderItem={(item) => (
                      <AcquisitionItem key={item.contribution_id} item={item} headers={formHeaders} />
                    )}
                    emptyMessage="No acquisitions found!"
                  />
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
