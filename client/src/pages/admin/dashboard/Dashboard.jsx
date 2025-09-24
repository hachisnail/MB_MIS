import { useAuth, useSocketClient } from "../../../context/authContext";
import StyledButton from "../../../components/buttons/StyledButton";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../../features/Utilities";
import LiveSocketBadge from "../../../sandbox/LiveSocketBadge";
import { MantineProvider } from '@mantine/core';
import { BarChart, AreaChart } from '@mantine/charts';
import { useEffect, useRef, useState, Fragment } from "react";
import { Transition } from "@headlessui/react";
import { createPortal } from "react-dom";
import axiosClient from "../../../lib/axiosClient";
import { encodeBase64 } from "../../../utils/base64";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL?.replace(/\/api$/, "");

const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocketClient();
  const navigate = useNavigate();

  // State for chart container height
  const chartContainerRef = useRef(null);
  const [chartHeight, setChartHeight] = useState(400);

  // State for appointment data
  const [appointmentRateData, setAppointmentRateData] = useState([]);
  const [appointmentPieData, setAppointmentPieData] = useState([]);
  const [appointmentLegendData, setAppointmentLegendData] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState(null);

  // State for visitor quota data
  const [visitorQuotaData, setVisitorQuotaData] = useState({ current: 0, total: 100, percentage: 0 });
  const [isLoadingVisitorData, setIsLoadingVisitorData] = useState(true);
  const [visitorDataError, setVisitorDataError] = useState(null);

  // State for pie chart tooltip
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  // State for schedules and queries data
  const [schedulesTodayData, setSchedulesTodayData] = useState([]);
  const [unreadQueriesData, setUnreadQueriesData] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);

  // State for artifact statistics
  const [artifactStats, setArtifactStats] = useState({
    total: 0,
    acquired: 0,
    borrowed: 0,
    displayed: 0
  });
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(true);
  const [artifactError, setArtifactError] = useState(null);

  // State for website traffic data
  const [websiteTrafficData, setWebsiteTrafficData] = useState([]);
  const [isLoadingWebsiteTraffic, setIsLoadingWebsiteTraffic] = useState(true);
  const [websiteTrafficError, setWebsiteTrafficError] = useState(null);

  // Function to fetch schedules for today
  const fetchSchedulesToday = async () => {
    try {
      setIsLoadingSchedules(true);

      // Get today's date in YYYY-MM-DD format using local timezone
      const today = new Date();
      const todayString = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

      console.log('Fetching schedules for today:', todayString);

      // Fetch schedules for today, excluding DATE_DISABLED
      const schedulesResponse = await axiosClient.get(`/auth/schedules?date=${todayString}`);
      const schedules = schedulesResponse.data;

      // Filter out DATE_DISABLED schedules and ensure date matches exactly
      const todaySchedules = schedules
        .filter(schedule => {
          const isValidSchedule = schedule.title !== 'DATE_DISABLED' && schedule.status === 'ACTIVE';
          const isToday = schedule.date === todayString;
          return isValidSchedule && isToday;
        })
        .map(schedule => ({
          type: schedule.title,
          time: `${schedule.start_time} - ${schedule.end_time}`,
          date: schedule.date,
          id: schedule.schedule_id,
          itemType: 'schedule' // Add identifier for display logic
        }));

      console.log('Today schedules found:', todaySchedules.length);

      // Fetch approved appointments for today (based on preferred_date)
      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      const appointments = appointmentsResponse.data;

      // Filter for approved appointments with preferred_date = today (strict date comparison)
      const todayApprovedAppointments = appointments
        .filter(appointment => {
          const status = appointment.AppointmentStatus?.status?.toUpperCase();
          const preferredDate = appointment.preferred_date;

          // Ensure strict date comparison - only today's appointments
          const isApproved = status === 'APPROVED';
          const isToday = preferredDate === todayString;

          return isApproved && isToday;
        })
        .map(appointment => ({
          type: appointment.purpose_of_visit || 'Appointment',
          time: appointment.start_time && appointment.end_time
            ? `${appointment.start_time} - ${appointment.end_time}`
            : 'Flexible',
          date: appointment.preferred_date,
          id: appointment.appointment_id,
          itemType: 'appointment' // Add identifier for display logic
        }));

      console.log('Today approved appointments found:', todayApprovedAppointments.length);

      // Combine schedules and approved appointments - only for today
      const combinedData = [...todaySchedules, ...todayApprovedAppointments];

      console.log('Total items for today:', combinedData.length);
      setSchedulesTodayData(combinedData);
    } catch (error) {
      console.error('Error fetching schedules and appointments:', error);
      setSchedulesTodayData([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Function to fetch unread queries (pending appointments and contributions)
  const fetchUnreadQueries = async () => {
    try {
      setIsLoadingQueries(true);

      // Fetch pending appointments
      const appointmentsResponse = await axiosClient.get('/auth/appointment');
      const appointments = appointmentsResponse.data;

      // Filter for pending appointments and transform data
      const pendingAppointments = appointments
        .filter(appointment => {
          const status = appointment.AppointmentStatus?.status?.toUpperCase();
          return status === 'PENDING';
        })
        .map(appointment => ({
          type: appointment.purpose_of_visit || 'Appointment',
          time: new Date(appointment.creation_date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          date: new Date(appointment.creation_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          id: appointment.appointment_id,
          itemType: 'appointment',
          creationDate: new Date(appointment.creation_date)
        }));

      // Fetch pending contributions using the same pattern as Acquisition.jsx
      const contributionsResponse = await axiosClient.get('/auth/contributions');
      const contributions = contributionsResponse.data;

      // Filter for pending contributions and transform data
      const pendingContributions = contributions
        .filter(contribution => {
          const status = contribution.status?.toLowerCase();
          return status === 'pending';
        })
        .map(contribution => {
          const artifact = contribution.ContributionArtifact || contribution.contributionartifact;
          const contributor = contribution.Contributor || contribution.contributor;
          const contributorName = `${contributor?.first_name || ''} ${contributor?.last_name || ''}`.trim();

          return {
            type: artifact?.title || 'Contribution',
            time: new Date(contribution.created_at || contribution.submission_date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            date: new Date(contribution.created_at || contribution.submission_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            }),
            id: contribution.contribution_id,
            itemType: 'contribution',
            creationDate: new Date(contribution.created_at || contribution.submission_date),
            contributorName: contributorName
          };
        });

      // Combine both appointments and contributions
      const combinedQueries = [...pendingAppointments, ...pendingContributions];

      // Sort by creation date (newest first) and limit to 5
      const sortedQueries = combinedQueries
        .sort((a, b) => b.creationDate - a.creationDate)
        .slice(0, 5)
        .map(({ creationDate, ...item }) => item); // Remove creationDate from final result

      setUnreadQueriesData(sortedQueries);
    } catch (error) {
      console.error('Error fetching unread queries:', error);
      setUnreadQueriesData([]);
    } finally {
      setIsLoadingQueries(false);
    }
  };

  // Function to fetch artifact statistics
  const fetchArtifactStats = async () => {
    try {
      setIsLoadingArtifacts(true);
      setArtifactError(null);

      // Fetch inventory using the same logic as Inventory.jsx (A then B)
      console.log("[Dashboard.jsx] fetching inventory for stats (A)", `${SERVER_ORIGIN}/api/auth/inventory`);
      const respA = await axios.get(`${SERVER_ORIGIN}/api/auth/inventory`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        validateStatus: () => true,
      });

      let rows;
      if (respA.status === 200 && Array.isArray(respA.data)) {
        rows = respA.data;
      } else {
        console.log("[Dashboard.jsx] (A) not array or wrong status, trying (B)", `${SERVER_ORIGIN}/api/inventory`);
        const respB = await axios.get(`${SERVER_ORIGIN}/api/inventory`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          validateStatus: () => true,
        });

        if (respB.status === 200 && Array.isArray(respB.data)) {
          rows = respB.data;
        } else {
          const sample = typeof respA.data === "string" ? respA.data.slice(0, 200) : JSON.stringify(respA.data)?.slice(0, 200);
          console.warn("[Dashboard.jsx] Inventory API did not return JSON array. Sample:", sample);
          throw new Error("Inventory API did not return JSON array");
        }
      }

      // Calculate statistics using the same logic as Inventory.jsx summary
      const total = rows.length;
      const acquired = rows.filter((r) => r.contribution_type !== "lending").length;
      const borrowed = rows.filter((r) => r.contribution_type === "lending").length;
      const displayed = rows.filter((r) => (r.display_status || "").toLowerCase().includes("display")).length;

      setArtifactStats({
        total,
        acquired,
        borrowed,
        displayed,
      });
    } catch (error) {
      console.error("Error fetching artifact statistics:", error);
      setArtifactError("Failed to load artifact data");
      setArtifactStats({
        total: 0,
        acquired: 0,
        borrowed: 0,
        displayed: 0,
      });
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Function to fetch visitor quota data
  const fetchVisitorQuotaData = async () => {
    try {
      setIsLoadingVisitorData(true);
      setVisitorDataError(null);

      // Fetch appointment statistics from the server
      const response = await axiosClient.get('/auth/appointment/stats');
      const stats = response.data;

      // Calculate visitor quota based on expected vs present visitors
      const expectedVisitors = stats.expectedVisitors || 0;
      const presentVisitors = stats.present || 0;

      // Set a reasonable maximum capacity (you can adjust this based on museum capacity)
      const maxCapacity = Math.max(expectedVisitors, 1000); // Use at least 1000 as baseline capacity

      const percentage = maxCapacity > 0 ? Math.round((presentVisitors / maxCapacity) * 100) : 0;

      setVisitorQuotaData({
        current: presentVisitors,
        total: maxCapacity,
        percentage: percentage
      });

    } catch (error) {
      console.error('Error fetching visitor quota data:', error);
      setVisitorDataError('Failed to load visitor data');
      // Fallback to default data
      setVisitorQuotaData({ current: 0, total: 100, percentage: 0 });
    } finally {
      setIsLoadingVisitorData(false);
    }
  };

  // Function to fetch website traffic data
  const fetchWebsiteTrafficData = async () => {
    try {
      setIsLoadingWebsiteTraffic(true);
      setWebsiteTrafficError(null);

      // Fetch website analytics data for the last 7 days
      const response = await axiosClient.get('/auth/analytics/website-traffic?days=7');
      const analyticsData = response.data;

      // Transform the data to match the chart's expected format
      const transformedData = processWebsiteTrafficData(analyticsData);
      setWebsiteTrafficData(transformedData);

    } catch (error) {
      console.error('Error fetching website traffic data:', error);
      setWebsiteTrafficError('Failed to load website traffic data');
      // Fallback to empty data
      setWebsiteTrafficData([]);
    } finally {
      setIsLoadingWebsiteTraffic(false);
    }
  };

  // Function to process website traffic data
  const processWebsiteTrafficData = (analyticsData) => {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return analyticsData.map(record => {
      const date = new Date(record.date);
      const dayName = dayNames[date.getDay()];

      return {
        day: dayName,
        Home: record.home_views || 0,
        NewsEvents: record.articles_views || 0, // articles represent news/events
        Catalogues: record.catalogue_views || 0,
        About: record.about_views || 0
      };
    });
  };

  // Function to fetch and process appointment data
  const fetchAppointmentData = async () => {
    try {
      setIsLoadingAppointments(true);
      setAppointmentError(null);

      // Fetch all appointments from the server
      const response = await axiosClient.get('/auth/appointment');
      const appointments = response.data;

      // Transform data to monthly format
      const monthlyData = processAppointmentsByMonth(appointments);
      setAppointmentRateData(monthlyData);

      // Transform data to pie chart format
      const { pieData, legendData } = processAppointmentsByPurpose(appointments);
      setAppointmentPieData(pieData);
      setAppointmentLegendData(legendData);

    } catch (error) {
      console.error('Error fetching appointment data:', error);
      setAppointmentError('Failed to load appointment data');
      // Fallback to empty data
      setAppointmentRateData([]);
      setAppointmentPieData([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Function to process appointments by month
  const processAppointmentsByMonth = (appointments) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    // Initialize all months with 0 appointments
    const monthlyCount = monthNames.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    // Count appointments by month for current year
    appointments.forEach(appointment => {
      if (appointment.creation_date) {
        const date = new Date(appointment.creation_date);
        if (date.getFullYear() === currentYear) {
          const monthName = monthNames[date.getMonth()];
          monthlyCount[monthName]++;
        }
      }
    });

    // Convert to array format expected by BarChart
    return monthNames.map(month => ({
      month,
      appointments: monthlyCount[month]
    }));
  };

  // Function to process appointments by purpose for pie chart
  const processAppointmentsByPurpose = (appointments) => {
    // Define the 7 specific appointment purposes with their colors
    const allPurposes = {
      'Research Paper': '#F9E0A5',
      'School Field Trip': '#D2B48C',
      'Museum Group Tour': '#6B4F2C',
      'Interviews': '#654321',
      'Collaboration Meetings': '#F2A93B',
      'Photography / Media Projects': '#3E2723',
      'Conservation Consultation': '#8B6F47'
    };

    // Initialize all purposes with 0 count
    const purposeCount = {};
    Object.keys(allPurposes).forEach(purpose => {
      purposeCount[purpose] = 0;
    });

    // Count appointments by purpose (only count the predefined ones)
    appointments.forEach(appointment => {
      if (appointment.purpose_of_visit) {
        const purpose = appointment.purpose_of_visit;
        if (allPurposes[purpose]) {
          purposeCount[purpose]++;
        }
        // Ignore purposes not in our predefined list
      }
    });

    // For legend: return all purposes (including zero counts)
    const allPurposesArray = Object.entries(allPurposes).map(([purpose, color]) => ({
      name: purpose,
      value: purposeCount[purpose],
      color: color
    }));

    // For pie chart: return only purposes with data > 0
    const pieDataOnly = allPurposesArray.filter(item => item.value > 0);

    // Return both datasets
    return {
      pieData: pieDataOnly.length > 0 ? pieDataOnly : allPurposesArray,
      legendData: allPurposesArray
    };
  };

  useEffect(() => {
    const updateChartHeight = () => {
      if (chartContainerRef.current) {
        const containerHeight = chartContainerRef.current.clientHeight;
        setChartHeight(Math.max(300, containerHeight - 10)); // Use full container height with minimal padding
      }
    };

    updateChartHeight();
    window.addEventListener('resize', updateChartHeight);

    return () => window.removeEventListener('resize', updateChartHeight);
  }, []);

  // Navigation handler function
  const handleItemNavigation = (item) => {
    try {
      if (item.itemType === 'appointment') {
        // For appointments: navigate to /admin/appointment/:encoded
        // Need to get visitor name for breadcrumb - using a placeholder for now
        const appointmentBreadcrumb = `${item.id} Visitor`;
        const encodedParam = btoa(appointmentBreadcrumb);
        navigate(`/admin/appointment/${encodedParam}`, {
          state: { cameFrom: 'schedule' }
        });
      } else if (item.itemType === 'contribution') {
        // For contributions: navigate to /admin/acquisition/:type/:encoded
        // Need to determine contribution type and get title
        const contributionBreadcrumb = `${item.id} ${item.type}`;
        const encodedParam = encodeBase64(contributionBreadcrumb);
        // Default to donation type - could be enhanced to get actual type from API
        navigate(`/admin/acquisition/donation/${encodedParam}`);
      } else if (item.itemType === 'schedule') {
        // For schedules: navigate to /admin/schedule and pass the schedule data to auto-select
        navigate('/admin/schedule', {
          state: {
            selectedScheduleId: item.id,
            selectedScheduleData: {
              id: item.id,
              title: item.type,
              startTime: item.time.split(' - ')[0],
              endTime: item.time.split(' - ')[1],
              date: item.date,
              isSchedule: true
            }
          }
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAppointmentData();
    fetchVisitorQuotaData();
    fetchSchedulesToday();
    fetchUnreadQueries();
    fetchArtifactStats();
    fetchWebsiteTrafficData();
  }, []);

  // Live updates via socket.io (pattern follows Appointments.jsx)
  useEffect(() => {
    if (!socket) return;

    const refreshAppointments = () => {
      fetchAppointmentData();
      fetchVisitorQuotaData();
      fetchUnreadQueries();
    };

    const refreshSchedules = () => {
      fetchSchedulesToday();
    };

    const refreshWebsiteAnalytics = () => {
      fetchWebsiteTrafficData();
    };

    // Appointments + Status changes -> update charts, stats, and unread queries
    socket.onDbChange("Appointment", "*", refreshAppointments);
    socket.onDbChange("AppointmentStatus", "*", refreshAppointments);

    // Schedules -> update "Schedules Today"
    socket.onDbChange("Schedule", "*", refreshSchedules);

    // Website analytics -> update traffic overview
    socket.onDbChange("WebsiteAnalytics", "*", refreshWebsiteAnalytics);

    // If inventory models emit in future, you can attach:
    // socket.onDbChange("CatalogArtifacts", "*", fetchArtifactStats);
    // socket.onDbChange("ContributionArtifacts", "*", fetchArtifactStats);
    // socket.onDbChange("ArtifactMetadata", "*", fetchArtifactStats);

    return () => {
      socket.offDbChange("Appointment", "*", refreshAppointments);
      socket.offDbChange("AppointmentStatus", "*", refreshAppointments);
      socket.offDbChange("Schedule", "*", refreshSchedules);
      socket.offDbChange("WebsiteAnalytics", "*", refreshWebsiteAnalytics);
      // socket.offDbChange("CatalogArtifacts", "*", fetchArtifactStats);
      // socket.offDbChange("ContributionArtifacts", "*", fetchArtifactStats);
      // socket.offDbChange("ArtifactMetadata", "*", fetchArtifactStats);
    };
  }, [socket]);

  // Dynamic topItems using real artifact statistics
  const topItems = [
    {
      label: "Total Artifacts",
      value: isLoadingArtifacts ? "..." : artifactStats.total,
      path: { pathname: "/admin/inventory", state: { filter: "artifacts" } },
    },
    {
      label: "Acquired Artifacts",
      value: isLoadingArtifacts ? "..." : artifactStats.acquired,
      path: { pathname: "/admin/inventory", state: { filter: "acquired" } },
    },
    {
      label: "Borrowed Artifacts",
      value: isLoadingArtifacts ? "..." : artifactStats.borrowed,
      path: { pathname: "/admin/inventory", state: { filter: "borrowing" } },
    },
    {
      label: "Displayed Artifacts",
      value: isLoadingArtifacts ? "..." : artifactStats.displayed,
      path: { pathname: "/admin/inventory", state: { filter: "displayed" } },
    },
  ];

  const walkIn = [
    { label: "Appointment", path: "/admin/appointment/walk-ins/" },
    { label: "Donation", path: "/admin/acquisition/add-artifact" },
  ];

  return (
    <div className="w-full flex flex-col gap-y-3 pt-5 3xl:pt-15 pb-1 px-1 h-full overflow-scroll">
      <div className="flex justify-between">
        <span className="text-5xl font-bold font-hind">
          Welcome {user.fname + " " + user.lname}!
        </span>
        {/* <SearchBar /> */}
      </div>

      <div className="w-full h-[36rem] flex gap-x-5">
        <div className="gap-y-5 flex flex-col justify-between">
          <div className="w-fit grid grid-cols-2 gap-3">
            {/* Artifact cards grid */}
            {topItems.map(({ label, value, path }) => {
              return (
                <div
                  key={label}
                  className={`w-[190px] h-[90px] 3xl:h-[105px] rounded-lg shadow-md shadow-gray-400 flex items-center justify-between px-4 py-3 ${label === "Total Artifacts"
                    ? "bg-gradient-to-b from-[#251B0E] to-[#523d1f] text-white"
                    : "bg-white border border-gray-200"
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="text-2xl font-medium mb-1">{label}</span>
                    <span className="text-4xl 3xl:text-6xl font-bold">{value}</span>
                    <span className="text-lg opacity-70">Total Artifacts</span>
                  </div>
                  <button
                    type="button"
                    className={`${label === "Total Artifacts" ? "border-white text-white hover:bg-white hover:text-[#3F2E1B]" : "border-[#3F2E1B] text-[#3F2E1B] hover:bg-[#3F2E1B] hover:text-white"} w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors`}
                    onClick={() =>
                      navigate(path.pathname, { state: path.state })
                    }
                    aria-label="Open"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="w-[39rem] bg-white rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-9 flex items-center justify-between gap-8">
            {/* Walk-ins section */}
            <h2 className="text-5xl font-bold text-gray-800">Walk-ins</h2>
            <div className="flex flex-col gap-3 w-[180px]">
              {walkIn.map(({ label }, idx) => {
                // Assign path depending on button
                const path =
                  label === "Appointment"
                    ? "/admin/appointment/walk-ins/"
                    : "/admin/acquisition/add-artifact3";

                return (
                  <button
                    onClick={() => navigate(path)}
                    key={idx}
                    className={`${label === "Appointment"
                      ? "bg-[#332613] text-white border-2 border-[#332613]"
                      : "bg-white border-2 border-[#332613] text-[#332613]"
                      } px-6 py-2 rounded-full flex items-center gap-3 w-full justify-between hover:opacity-90 transition-opacity cursor-pointer`}
                  >
                    <span className="text-2xl font-medium">{label}</span>
                    <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 17 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.79199 12.0415H9.20866V9.20817H12.042V7.7915H9.20866V4.95817H7.79199V7.7915H4.95866V9.20817H7.79199V12.0415ZM8.50033 15.5832C7.52046 15.5832 6.59963 15.4002 5.73783 15.0342C4.87602 14.6564 4.12637 14.1488 3.48887 13.5113C2.85137 12.8738 2.34373 12.1241 1.96595 11.2623C1.59998 10.4005 1.41699 9.4797 1.41699 8.49984C1.41699 7.51998 1.59998 6.59914 1.96595 5.73734C2.34373 4.87553 2.85137 4.12588 3.48887 3.48838C4.12637 2.85088 4.87602 2.34914 5.73783 1.98317C6.59963 1.60539 7.52046 1.4165 8.50033 1.4165C9.48019 1.4165 10.401 1.60539 11.2628 1.98317C12.1246 2.34914 12.8743 2.85088 13.5118 3.48838C14.1493 4.12588 14.651 4.87553 15.017 5.73734C15.3948 6.59914 15.5837 7.51998 15.5837 8.49984C15.5837 9.4797 15.3948 10.4005 15.017 11.2623C14.651 12.1241 14.1493 12.8738 13.5118 13.5113C12.8743 14.1488 12.1246 14.6564 11.2628 15.0342C10.401 15.4002 9.48019 15.5832 8.50033 15.5832ZM8.50033 14.1665C10.0823 14.1665 11.4222 13.6175 12.5201 12.5196C13.618 11.4217 14.167 10.0818 14.167 8.49984C14.167 6.91789 13.618 5.57796 12.5201 4.48005C11.4222 3.38213 10.0823 2.83317 8.50033 2.83317C6.91838 2.83317 5.57845 3.38213 4.48053 4.48005C3.38262 5.57796 2.83366 6.91789 2.83366 8.49984C2.83366 10.0818 3.38262 11.4217 4.48053 12.5196C5.57845 13.6175 6.91838 14.1665 8.50033 14.1665Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        <div className="w-full h-full bg-white rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-8 flex flex-col">
          <h3 className="text-2xl 3xl:text-4xl font-bold text-gray-900 mb-5">Appointment Rate</h3>
          <div ref={chartContainerRef} className="flex-1 w-full h-fit">
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#654321]"></div>
                  <span className="text-gray-600">Loading appointment data...</span>
                </div>
              </div>
            ) : appointmentError ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3 text-center">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-600 font-medium">{appointmentError}</span>
                  <button
                    onClick={fetchAppointmentData}
                    className="px-4 py-2 bg-[#654321] text-white rounded-md hover:bg-[#543619] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <MantineProvider>
                <BarChart
                  h="100%"
                  w="100%"
                  data={appointmentRateData}
                  dataKey="month"
                  series={[
                    { name: 'appointments', color: '#654321' },
                  ]}
                  tickLine="xy"
                  gridAxis="xy"
                  withXAxis
                  withYAxis
                  withTooltip
                  barProps={{ radius: 2 }}
                  xAxisProps={{
                    tickFormatter: (value) => value,
                    style: { fontSize: '12px', fill: '#374151' },
                  }}
                  yAxisProps={{
                    tickFormatter: (value) => value,
                    style: { fontSize: '12px', fill: '#374151' },
                  }}
                  gridProps={{
                    stroke: '#E5E7EB',
                    strokeWidth: 1,
                  }}
                />
              </MantineProvider>
            )}
          </div>
        </div>



        <div className="w-fit flex flex-row gap-x-5">
          <div className="w-[25rem] h-auto bg-white rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-8 flex flex-col">
            <h3 className="text-2xl 3xl:text-4xl font-bold text-gray-900 mb-6">Schedules Today</h3>

            <div className="flex flex-col gap-8">
              {isLoadingSchedules ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3F2E1B]"></div>
                    <span className="text-gray-600 text-sm">Loading schedules...</span>
                  </div>
                </div>
              ) : schedulesTodayData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-500 font-medium">No schedules for today</span>
                  </div>
                </div>
              ) : (
                schedulesTodayData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    {/* Left: icon + text */}
                    <div className="flex items-center gap-4">
                      {/* Dynamic Icon based on item type */}
                      <div className="w-10 h-10 flex items-center justify-center text-[#3F2E1B]">
                        {item.itemType === 'schedule' ? (
                          // Schedule Icon (Clock)
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                        ) : item.itemType === 'appointment' ? (
                          // Appointment Icon (Calendar)
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        ) : (
                          // Default Icon (Clock) for any other type
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12,6 12,12 16,14" />
                          </svg>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex flex-col leading-tight">
                        <span className="text-2xl font-semibold text-gray-900">{item.type}</span>
                        <span className="text-md 3xl:text-lg text-gray-700">{item.time}</span>
                      </div>
                    </div>

                    {/* Right: open arrow button */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full border-2 border-[#3F2E1B] text-[#3F2E1B] flex items-center justify-center hover:bg-[#3F2E1B] hover:text-white transition-colors"
                      onClick={() => handleItemNavigation(item)}
                      aria-label="Open"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>


          <div className="w-[25rem] h-auto bg-gradient-to-b from-[#251B0E] to-[#523d1f] rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-8 flex flex-col">
            <h3 className="text-2xl 3xl:text-4xl font-bold text-[#F2A93B] mb-6">Unread Queries</h3>

            <div className="flex flex-col gap-8">
              {isLoadingQueries ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F2A93B]"></div>
                    <span className="text-white text-sm opacity-90">Loading queries...</span>
                  </div>
                </div>
              ) : unreadQueriesData.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-white font-medium opacity-90">No pending queries</span>
                  </div>
                </div>
              ) : (
                unreadQueriesData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    {/* Left: icon + text */}
                    <div className="flex items-center gap-4">
                      {/* Dynamic Icon based on item type */}
                      <div className="w-10 h-10 flex items-center justify-center text-white">
                        {item.itemType === 'appointment' ? (
                          // Appointment Icon (Calendar)
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        ) : item.itemType === 'contribution' ? (
                          // Contribution Icon (Gift/Package)
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,12 20,22 4,22 4,12" />
                            <rect x="2" y="7" width="20" height="5" />
                            <line x1="12" y1="22" x2="12" y2="7" />
                            <path d="m5,7 0,-1a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v1" />
                            <path d="m19,7 0,-1a2,2 0 0,0 -2,-2h-4a2,2 0 0,0 -2,2v1" />
                          </svg>
                        ) : (
                          // Default Icon (Document) for any other type
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10,9 9,9 8,9" />
                          </svg>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex flex-col leading-tight">
                        <span className="text-2xl font-semibold text-[#F2A93B]">{item.type}</span>
                        <span className="text-sm 3xl:text-lg text-white opacity-90">{item.time} {item.date}</span>
                      </div>
                    </div>

                    {/* Right: open arrow button */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full border-2 border-white text-white flex items-center justify-center hover:bg-white hover:text-[#3F2E1B] transition-colors"
                      onClick={() => handleItemNavigation(item)}
                      aria-label="Open"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="w-full h-full flex flex-row gap-x-5">


        <div className="w-[50rem] h-full bg-gradient-to-b from-[#251B0E] to-[#523d1f] rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl 3xl:text-4xl font-bold text-white">Visitor Quota</h3>
            <span className="text-2xl font-semibold text-white">{visitorQuotaData.percentage}%</span>
          </div>

          <div className="flex-1 w-full flex items-center justify-center">
            {(() => {
              const width = 200;
              const height = 300;
              const radius = 28;
              const labelOffset = 60;
              const total = visitorQuotaData.total;
              const current = visitorQuotaData.current;
              const pct = Math.max(0, Math.min(1, current / total)); // clamp 0..1

              // Wave parameters
              const waveAmplitude = 14; // px
              const waves = 2; // number of waves across width
              const yBase = height * (1 - pct); // top of liquid

              // Build wave path by sampling points across the width
              const samples = 80;
              const pts = [];
              for (let i = 0; i <= samples; i++) {
                const x = (i / samples) * width;
                const y =
                  yBase + waveAmplitude * Math.sin((i / samples) * waves * 2 * Math.PI);
                pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
              }
              const pathD = `M 0 ${height} L ${pts.join(" L ")} L ${width} ${height} Z`;

              return (
                <div className="relative" style={{ width: width + labelOffset, height }}>
                  {/* Left scale labels */}
                  <div className="absolute left-0 top-1 text-white text-xl font-semibold select-none">
                    {total}
                  </div>
                  <div
                    className="absolute left-0 text-white text-xl font-semibold select-none"
                    style={{ top: yBase - 10 }}
                  >
                    {current}
                  </div>

                  {/* Tank with wave fill */}
                  <svg
                    width={width}
                    height={height}
                    style={{ position: "absolute", left: labelOffset, top: 0 }}
                  >
                    <defs>
                      <clipPath id="tankClip" clipPathUnits="userSpaceOnUse">
                        <rect x="0" y="0" width={width} height={height} rx={radius} ry={radius} />
                      </clipPath>
                      <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feOffset dx="0" dy="0" />
                        <feGaussianBlur stdDeviation="8" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="#000" floodOpacity="0.15" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                      </filter>
                    </defs>

                    <g clipPath="url(#tankClip)">
                      {/* Tank background with inner shadow */}
                      <rect
                        x="0"
                        y="0"
                        width={width}
                        height={height}
                        fill="#ffffff"
                        filter="url(#innerShadow)"
                      />
                      {/* Liquid with wave top */}
                      <path d={pathD} fill="#F2A93B" />
                    </g>

                    {/* Subtle border outline */}
                    <rect
                      x="0"
                      y="0"
                      width={width}
                      height={height}
                      rx={radius}
                      ry={radius}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>


        <div className="w-full h-full bg-white rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-8 flex flex-col">
          <h3 className="text-2xl 3xl:text-4xl font-bold text-gray-900 mb-4">Website Traffic Overview</h3>
          <div className="flex flex-1 w-full min-h-0">
            {/* Legend */}
            <div className="w-32 flex flex-col items-center justify-center gap-y-6 pr-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-7 border-2 border-[#383123] bg-[#8B7355]"></div>
                <span className="text-sm text-gray-800 font-medium mt-1">Home</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-7 border-2 border-[#80633A] bg-[#A0956B]"></div>
                <span className="text-sm text-gray-800 font-medium mt-1">News & Events</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-7 border-2 border-[#F3B763] bg-[#B8A87A]"></div>
                <span className="text-sm text-gray-800 font-medium mt-1">Catalogues</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-7 border-2 border-[#FFFFDB] bg-[#D4C899]"></div>
                <span className="text-sm text-gray-800 font-medium mt-1">About</span>
              </div>
            </div>


            {/* Chart */}
            <div className="flex-1 min-h-[300px]">
              {isLoadingWebsiteTraffic ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B7355]"></div>
                    <span className="text-gray-600">Loading website traffic data...</span>
                  </div>
                </div>
              ) : websiteTrafficError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-600 font-medium">{websiteTrafficError}</span>
                    <button
                      onClick={fetchWebsiteTrafficData}
                      className="px-4 py-2 bg-[#8B7355] text-white rounded-md hover:bg-[#6B5A42] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <MantineProvider>
                  <AreaChart
                    h="100%"
                    w="100%"
                    data={websiteTrafficData}
                    dataKey="day"
                    series={[
                      { name: 'About', color: '#D4C899' },
                      { name: 'Catalogues', color: '#B8A87A' },
                      { name: 'NewsEvents', color: '#A0956B' },
                      { name: 'Home', color: '#8B7355' },
                    ]}
                    tickLine="xy"
                    gridAxis="xy"
                    withXAxis
                    withYAxis
                    type="stacked"
                    strokeWidth={3}          // make lines thicker
                    fillOpacity={0.6}        // transparent area fill
                    curveType="linear"
                    connectNulls={false}
                    withDots={false}
                    gridProps={{
                      stroke: '#E5E7EB',
                      strokeWidth: 1,
                    }}
                    xAxisProps={{
                      style: { fontSize: '12px', fill: '#374151' },
                    }}
                    yAxisProps={{
                      style: { fontSize: '12px', fill: '#374151' },
                    }}
                  />
                </MantineProvider>
              )}
            </div>

          </div>
        </div>



        <div className="w-[104rem] h-full bg-white rounded-lg shadow-md shadow-gray-400 border border-gray-200 p-4 3xl:p-5 flex flex-col">
          <h3 className="text-2xl 3xl:text-4xl font-bold text-gray-900 mb-6">Appointment Rate</h3>
          <div className="flex items-center justify-between h-full">
            {/* Legend */}
            <div className="flex flex-col gap-y-4">
              {appointmentLegendData.map((item, index) => (
                <div key={index} className="flex items-center gap-x-3">
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-lg text-gray-700">{item.name}</span>
                </div>
              ))}
            </div>

            {/* Donut Chart (pure CSS to enforce perfect circle) */}
            <div className="flex-1 flex items-center justify-center">
              {(() => {
                const size = 320;
                const total = appointmentPieData.reduce((s, i) => s + i.value, 0);

                let start = 0;
                const stops = appointmentPieData
                  .map((i) => {
                    const pct = (i.value / total) * 100;
                    const s = start;
                    const e = s + pct;
                    start = e;
                    return `${i.color} ${s}% ${e}%`;
                  })
                  .join(", ");

                // Create SVG paths for each slice for better hover detection
                const slices = [];
                let currentAngle = 0;

                appointmentPieData.forEach((item, idx) => {
                  const pct = (item.value / total) * 100;
                  const sliceAngle = (pct / 100) * 360;

                  if (sliceAngle > 0) {
                    const startAngle = currentAngle - 90; // Start from top
                    const endAngle = currentAngle + sliceAngle - 90;

                    const outerRadius = size / 2;
                    const innerRadius = size * 0.28; // Inner radius for donut

                    // Calculate path coordinates
                    const x1 = size / 2 + outerRadius * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = size / 2 + outerRadius * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = size / 2 + outerRadius * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = size / 2 + outerRadius * Math.sin((endAngle * Math.PI) / 180);
                    const x3 = size / 2 + innerRadius * Math.cos((endAngle * Math.PI) / 180);
                    const y3 = size / 2 + innerRadius * Math.sin((endAngle * Math.PI) / 180);
                    const x4 = size / 2 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
                    const y4 = size / 2 + innerRadius * Math.sin((startAngle * Math.PI) / 180);

                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

                    const pathData = [
                      `M ${x1} ${y1}`,
                      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      `L ${x3} ${y3}`,
                      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                      'Z'
                    ].join(' ');

                    slices.push({
                      path: pathData,
                      color: item.color,
                      name: item.name,
                      value: item.value,
                      percentage: Math.round(pct)
                    });
                  }

                  currentAngle += sliceAngle;
                });

                // percentage labels positioned on the ring
                let cStart = 0;
                const labels = appointmentPieData.map((i, idx) => {
                  const pct = (i.value / total) * 100;
                  const midPct = cStart + pct / 2;
                  cStart += pct;
                  const angle = (midPct / 100) * 360;
                  const rad = ((angle - 90) * Math.PI) / 180;
                  // place labels in the middle of the ring thickness
                  const radius = size * 0.41;
                  const x = Math.cos(rad) * radius;
                  const y = Math.sin(rad) * radius;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: size / 2 + x,
                        top: size / 2 + y,
                        transform: "translate(-50%, -50%)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#ffffff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                      }}
                    >
                      {Math.round(pct)}%
                    </div>
                  );
                });

                return (
                  <div className="relative" style={{ width: size, height: size }}>
                    {/* SVG for interactive slices */}
                    <svg
                      width={size}
                      height={size}
                      className="absolute inset-0"
                      style={{ zIndex: 10 }}
                    >
                      {slices.map((slice, idx) => (
                        <path
                          key={idx}
                          d={slice.path}
                          fill={slice.color}
                          className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              content: `${slice.name}: ${slice.value} appointments (${slice.percentage}%)`
                            });
                          }}
                          onMouseMove={(e) => {
                            setTooltip(prev => ({
                              ...prev,
                              x: e.clientX,
                              y: e.clientY
                            }));
                          }}
                          onMouseLeave={() => {
                            setTooltip({ visible: false, x: 0, y: 0, content: '' });
                          }}
                        />
                      ))}
                    </svg>

                    {/* Fallback background gradient (for visual consistency) */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `conic-gradient(${stops})`,
                        zIndex: 1
                      }}
                    />

                    {/* Inner cutout */}
                    <div
                      className="absolute bg-white rounded-full"
                      style={{
                        width: size * 0.56,
                        height: size * 0.56,
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 0 0 2px #fff",
                        zIndex: 20
                      }}
                    />

                    {/* Center total text */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ left: 0, top: 0, zIndex: 30 }}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          style={{
                            fontSize: 64,
                            lineHeight: 1,
                            fontWeight: 800,
                            color: "#3F2E1B",
                          }}
                        >
                          {total}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#3F2E1B",
                          }}
                        >
                          Total Appointments
                        </div>
                      </div>
                    </div>

                    {/* Percentage labels */}
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>{labels}</div>

                    {/* Mantine-style Tooltip */}
                    {typeof window !== "undefined" &&
                      createPortal(
                        <Transition
                          as={Fragment}
                          show={tooltip.visible}
                          enter="transition ease-out duration-200"
                          enterFrom="opacity-0 translate-y-1"
                          enterTo="opacity-100 translate-y-0"
                          leave="transition ease-in duration-150"
                          leaveFrom="opacity-100 translate-y-0"
                          leaveTo="opacity-0 translate-y-1"
                        >
                          <div
                            role="tooltip"
                            style={{
                              position: "absolute",
                              top: tooltip.y - 35,
                              left: tooltip.x,
                              transform: "translateX(-50%)",
                              zIndex: 9999,
                            }}
                            className="bg-white text-gray-800 text-sm rounded py-1 px-2 whitespace-nowrap pointer-events-none select-none shadow-lg border border-gray-200"
                          >
                            {tooltip.content}
                            <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white border-r border-b border-gray-200" style={{ top: '100%', marginTop: '-4px' }}></div>
                          </div>
                        </Transition>,
                        document.body
                      )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>



      </div>


      {/* <div className="w-full h-[30rem] gap-x-10 flex items-center justify-center">

            <div className=" flex flex-col justify-center items-center w-[28rem] h-[29rem] rounded-[4rem] shadow-gray-600 shadow-md border-t border-gray-300">
              <span>Active Clients</span>
              <NavLink to="/admin/dashboard/sandbox/scokets-panel">
                <LiveSocketBadge />
              </NavLink>
            </div>
          </div> */}
      {/* <NavLink to="/admin/sandbox" className="w-fit">
        <StyledButton className="w-fit">Open sandbox</StyledButton>
      </NavLink> */}
    </div >
  );
};

export default Dashboard;
