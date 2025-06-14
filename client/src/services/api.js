// src/services/api.js
import axiosClient from "../lib/axiosClient";

export const authAPI = {
  validateToken: (token) => 
    axiosClient.get(`/auth/validate-token/${token}`),
  
  completeRegistration: (token, data) => 
    axiosClient.post(`/auth/complete-registration/${token}`, data),

  resendInvitation: (email) =>
  axiosClient.post('/auth/resend-invitation', { email }),

checkEmailAvailability: (email) =>
  axiosClient.get(`/auth/check-email/${email}`),

};


