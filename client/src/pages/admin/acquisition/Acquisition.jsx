import { useState, useCallback, useEffect, useMemo } from "react";
import {
  SearchBar,
  CardDropdownPicker,
  TableHeaderContainer,
  SummaryPanel,
} from "@/features/Utilities";
import {
  formatDateForDisplay
} from "@/components/commons";

import ListRenderer from "@/components/tables/ListRenderer";
import { useNavigate } from "react-router-dom";
import { AcquisitionItem, DonorRecordsItem } from "./components/Acquisitonlist";
import TimelineDatePicker from "@/features/TimelineDatePicker";
import Toast from "@/features/Toast";
import axiosClient from "@/lib/axiosClient";
import useToast from "@/components/commons";
import { useSocketClient } from "@/context/authContext";



const Acquisition = () => {
  const [activeTab, setActiveTab] = useState("pendings");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [acquisitions, setAcquisiitons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaryData, setSummaryData] = useState({
    totalCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    donationCount: 0,
    lendingCount: 0,
    completedCount: 0,
  });

  const [transferFilter, setTransferFilter] = useState("All");

  const navigate = useNavigate();

  //tabs + header management
  const tabs = [
    { key: "pendings", label: "Pendings" },
    { key: "form", label: "Forms" },
    { key: "donator-records", label: "Donator Records" },
  ];

  const formHeaders = [
    { label: "Creation Date", width: 13 },
    { label: "Donors Name", width: "1fr" },
    { label: "Title", width: "1fr" },
    { label: "Status", width: 12 },
    { label: "Type", width: 10 },
    { label: "Last Updated", width: 15 },
  ];

  const pendingHeaders = [
    { label: "Date", width: 15 },
    { label: "Donors Name" },
    { label: "Title" },
    { label: "Status", width: 15 },
    { label: "Transfer Type", width: 15 },
    { label: "Last Updated", width: 15 },
  ];

  const recordHeaders = [
    { label: "Name", width: "1fr" },
    { label: "Email", width: 20 },
    { label: "Province", width: 15 },
    { label: "City", width: 15 },
    { label: "Contributions", width: 15 },
  ];

  const formSummary = [
    { label: "Approved", value: "0" },
    { label: "Rejected", value: "0" },
    { label: "Donation", value: "0" },
    { label: "Lend", value: "0" },
  ];

  const { toastConfig, showToast, hideToast } = useToast();
  const socket = useSocketClient();

  // --- Donor de-dupe helpers ---
  const norm = (s) => (s ?? "").toString().trim().toLowerCase();
  const fullName = (c) => `${c?.first_name || ""} ${c?.last_name || ""}`.trim();

  // birth_date ay inaasahan mula backend (ISO or YYYY-MM-DD)
  const makeDonorKey = (contributor) => {
    const name = fullName(contributor);
    const email = contributor?.email ?? "";
    const bdate = contributor?.birth_date ?? ""; // fallback kung wala pa sa payload
    return `${norm(name)}|${norm(bdate)}|${norm(email)}`;
  };

  const dedupeDonors = (rows) => {
    if (!Array.isArray(rows) || !rows.length) return [];
    const map = new Map();

    for (const row of rows) {
      // Support 3 possible data structures:
      // 1) { Contributor: {...}, Contributions: [...] }
      // 2) { contributor: {...}, Contributions: [...] } 
      // 3) Top-level contributor row: { first_name, last_name, ..., Contributions: [...] }
      const c0 = row?.Contributor ?? row?.contributor ?? row;
      if (!c0 || (!c0.first_name && !c0.last_name && !c0.email)) continue;
      const key = makeDonorKey(c0);

      if (!map.has(key)) {
        map.set(key, {
          ...row,
          // Standardize: always have .Contributor for renderer
          Contributor: c0,
          Contributions: Array.isArray(row?.Contributions)
            ? [...row.Contributions]
            : Array.isArray(row?.contributions)
              ? [...row.contributions]
              : [],
        });
      } else {
        const acc = map.get(key);
        const next = Array.isArray(row?.Contributions)
          ? row.Contributions
          : Array.isArray(row?.contributions)
            ? row.contributions
            : [];
        acc.Contributions = [...(acc.Contributions || []), ...next];

        // Keep first non-empty location fields
        if (!acc.Contributor.province && c0.province) acc.Contributor.province = c0.province;
        if (!acc.Contributor.city && c0.city) acc.Contributor.city = c0.city;

        map.set(key, acc);
      }
    }

    for (const val of map.values()) {
      const cs = val.Contributions || [];
      val.total_contributions = cs.length;
      cs.sort((a, b) => new Date(b?.submission_date || 0) - new Date(a?.submission_date || 0));
    }

    return Array.from(map.values()).sort((a, b) => {
      const aLatest = a.Contributions?.[0]?.submission_date;
      const bLatest = b.Contributions?.[0]?.submission_date;
      return new Date(bLatest || 0) - new Date(aLatest || 0);
    });
  };

  const donorRecords = useMemo(() => {
    if (activeTab !== "donator-records") return [];
    return dedupeDonors(acquisitions);
  }, [activeTab, acquisitions]);

  const filteredDonorRecords = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    if (!q) return donorRecords;
    return donorRecords.filter((row) => {
      const c = row?.Contributor ?? row?.contributor ?? {};
      const name = `${c.first_name || ""} ${c.last_name || ""}`.trim().toLowerCase();
      return (
        name.includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.province || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (String(c.birth_date || "")).toLowerCase().includes(q)  // Safer string conversion
      );
    });
  }, [donorRecords, searchQuery]);


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
    const artifact = item?.ContributionArtifact || item?.contributionartifact;
    const contributor = item?.Contributor || item?.contributor;

    const statusMatch =
      statusFilter === "All Statuses" ||
      item.status?.toLowerCase() === statusFilter.toLowerCase();

    const transferMatch =
      transferFilter === "All" ||
      item.transfer_status?.toLowerCase() === transferFilter.toLowerCase();

    const searchMatch =
      artifact?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contributor?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contributor?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && transferMatch && searchMatch;
  });


  const headersMap = {
    form: formHeaders,
    pendings: pendingHeaders,
    "donator-records": recordHeaders,
  };

  useEffect(() => {
    setAcquisiitons([]);
    setError("");
    setIsLoading(true);
    fetchAcquisitons();
    fetchSummary();
  }, [activeTab, statusFilter]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleContributionChange = () => {
      console.log("[Socket] Contribution data changed, refreshing...");
      fetchAcquisitons();
      fetchSummary();
    };

    // Listen for all contribution-related model changes
    socket.onDbChange("Contributors", "*", handleContributionChange);
    socket.onDbChange("Contributions", "*", handleContributionChange);
    socket.onDbChange("LendingDetails", "*", handleContributionChange);
    socket.onDbChange("ContributionArtifacts", "*", handleContributionChange);
    socket.onDbChange("ContributionTimelines", "*", handleContributionChange);
    socket.onDbChange("ContributionSessions", "*", handleContributionChange);

    return () => {
      // Clean up socket listeners
      socket.offDbChange("Contributors", "*", handleContributionChange);
      socket.offDbChange("Contributions", "*", handleContributionChange);
      socket.offDbChange("LendingDetails", "*", handleContributionChange);
      socket.offDbChange("ContributionArtifacts", "*", handleContributionChange);
      socket.offDbChange("ContributionTimelines", "*", handleContributionChange);
      socket.offDbChange("ContributionSessions", "*", handleContributionChange);
    };
  }, [socket]);

  const fetchAcquisitons = async () => {
    try {
      setIsLoading(true);
      setError("");

      let endpoint = "/auth/contributions";
      let params = {};

      switch (activeTab) {
        case "pendings":
          endpoint = "/auth/contributions";
          params.status = ["pending", "approved"];
          break;

        case "form":
          endpoint = "/auth/contributions";
          params.status = ["completed", "canceled"];
          break;

        case "donator-records":
          endpoint = "/auth/contributions/donors/";
          break;

        default:
          break;
      }

      // cleanup undefined
      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key]
      );

      // ✅ Build query manually so arrays become ?status=a&status=b
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      });

      const qs = searchParams.toString();
      const url = qs ? `${endpoint}?${qs}` : endpoint;
      const response = await axiosClient.get(url);

      let data = response.data || [];

      if (activeTab === "pendings") {
        data.sort((a, b) => {
          if (a.status === "pending" && b.status === "approved") return -1;
          if (a.status === "approved" && b.status === "pending") return 1;
          return 0;
        });
      }

      setAcquisiitons(data);
      console.log("Fetched:", data);
    } catch (err) {
      console.error("Error fetching acquisitions:", err);
      setError("Failed to load acquisitions. Check that the API server is running.");
      setAcquisiitons([]);
    } finally {
      setIsLoading(false);
    }
  };



  const fetchSummary = async () => {
    try {
      const params = {};
      if (selectedDate) {
        params.fromDate = selectedDate.toISOString().split("T")[0];
        params.toDate = selectedDate.toISOString().split("T")[0];
      }

      const response = await axiosClient.get("/auth/contributions/summary", {
        params,
      });
      const data = response.data;
      console.log()

      setSummaryData({
        totalCount: data.totalCount,
        approvedCount: data.approvedCount,
        rejectedCount: data.rejectedCount,
        pendingCount: data.pendingCount,
        donationCount: data.donationCount,
        lendingCount: data.lendingCount,
        completedCount: data.completedCount,
      });
    } catch (err) {
      console.error("Error fetching summary:", err);
      setSummaryData({
        totalCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        donationCount: 0,
        lendingCount: 0,
        completedCount: 0,
      });
    }
  };

  // console.log(acquisitions);

  return (
    <>
      <div className="w-full h-full flex gap-x-15 overflow-scroll lg:flex-row flex-col">
        <SummaryPanel
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          title="Total Acquisitions"
          totalCount={summaryData.totalCount}
          dateLabel={formatDateForDisplay(selectedDate || new Date())}
          summaryData={[
            { label: "Approved", value: summaryData.approvedCount },
            { label: "Rejected", value: summaryData.rejectedCount },
            { label: "Pending", value: summaryData.pendingCount },
            { label: "Donation", value: summaryData.donationCount },
            { label: "Lend", value: summaryData.lendingCount },
            { label: "Completed", value: summaryData.completedCount },

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
            {activeTab === "donator-records" ? null : (
              <>
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
              </>
            )}
          </div>

          <div className="w-full h-full flex flex-col">
            {/* table */}

            <TableHeaderContainer headers={headersMap[activeTab]} />
            <div className="w-full h-[52rem] 3xl:h-[67rem] border-y overflow-y-auto border-gray-400">
              <ListRenderer
                isLoading={isLoading}
                error={error}
                items={
                  activeTab === "donator-records"
                    ? filteredDonorRecords
                    : filteredAcquisitions
                }
                renderItem={(item, index) => {
                  if (activeTab === "form") {
                    return (
                      <AcquisitionItem
                        key={`${item.contribution_id}-${index}`}
                        item={item}
                        headers={formHeaders}
                      />
                    );
                  }

                  if (activeTab === "donator-records") {
                    return (
                      <DonorRecordsItem
                        key={`${item.contributor_id}-${index}`}
                        item={item}
                        headers={recordHeaders}
                      />
                    );
                  }

                  if (activeTab === "pendings") {
                    return (
                      <AcquisitionItem
                        key={`${item.contribution_id}-${index}`}
                        item={item}
                        headers={pendingHeaders}
                      />
                    );
                  }

                  return null;
                }}
              />
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
