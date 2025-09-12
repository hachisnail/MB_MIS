import axios from "axios";
import axiosClient from "@/lib/axiosClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");

export const paths = {
  pictures: `${SERVER_ORIGIN}/uploads/pictures/`,
};

export const getArticle = (id) => axiosClient.get(`/auth/articles/${id}`);
export const listArticles = () => axiosClient.get(`/auth/articles`);

export const updateArticle = (id, formData) =>
  axiosClient.put(`/auth/article/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const createArticle = (formData) =>
  axios.post(`${BASE_URL}/auth/article`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadContentImage = (file) => {
  const formData = new FormData();
  formData.append("contentImages", file);
  return axios.post(`${BASE_URL}/auth/article/content-images`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
};
