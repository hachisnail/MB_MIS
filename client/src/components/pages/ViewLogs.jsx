import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axiosClient from "../../lib/axiosClient";
import { useSocketClient } from "../../context/authContext";

const ViewLogs = () => {
  const [Log, setLogs] = useState([]);

  const location = useLocation();
  const socket = useSocketClient();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const encodedId = decodeURIComponent(pathSegments[pathSegments.length - 1]);
  const log = atob(encodedId);
  const logId = parseInt(log);
  // console.log(logId)
  const fetchLog = async () => {
    try {
      const response = await axiosClient.get(`/auth/logs/${logId}`);
      console.log(response.data);

      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    fetchLog();

    const handleLogChange = () => fetchLog();

    if (socket) {
      socket.onDbChange("Log", "*", handleLogChange);
    }

    return () => {
      if (socket) {
        socket.offDbChange("Log", "*", handleLogChange);
      }
    };
  }, [socket]);

  return (
    <div className="w-full min-w-fit h-full pt-5 max-w-[137rem]  1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem]">
      <div className="w-full border-t border-gray-700 h-full flex flex-col gap-y-[2rem]"></div>
    </div>
  );
};

export default ViewLogs;
