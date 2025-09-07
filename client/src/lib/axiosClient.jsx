// /src/lib/axiosClient.js
import axios from "axios";
import { getBrowserId } from "./ids";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL + "/api",
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  try {
    const bid = getBrowserId();
    if (bid) config.headers["x-browser-id"] = bid;
  } catch {}
  return config;
});

export default axiosClient;
