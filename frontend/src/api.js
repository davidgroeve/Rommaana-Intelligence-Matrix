import axios from "axios";

// Dynamic API URL for Local Dev vs Cloud Production
const isDev = import.meta.env.DEV;
const API_URL = isDev ? "http://localhost:8000/api" : "/api";

export const api = axios.create({
    baseURL: API_URL,
});

export const endpoints = {
    candidates: "/candidates",
    analysis: "/analyze",
    feedback: "/feedback",
    resume: (id) => `/candidates/${id}/resume`,
    download: (id) => `/candidates/${id}/download`,
    jobs: "/jobs",
    updateJob: (id) => `/jobs/${id}`,
    updateStatus: (id) => `/candidates/${id}/status`,
    investigate: (id) => `/candidates/${id}/investigate`,
};
