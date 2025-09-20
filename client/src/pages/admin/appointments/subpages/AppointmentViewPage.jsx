// FileName: /AppointmentModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '@/lib/axiosClient';
import { useSocketClient } from "@/context/authContext";
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import PopupModal from '@/components/modals/PopupModal';
import Modal from '@/components/modals/Modal';
import StyledButton from '@/components/buttons/StyledButton';
import Toast from '@/features/Toast';
import { validateAppointmentSchedule } from '@/utils/scheduleValidation';
import { normalizeStatus } from '../components/statusUtils';
import AppointmentFileViewer from '../components/AppointmentFileViewer';

export const AppointmentViewPage = ({
  showModal,
  modalData: propModalData,
  onClose: propOnClose,
  onSend: propOnSend,
  updateAppointmentStatus: propUpdateAppointmentStatus,
  showRespondSection = true,
  showToast: propShowToast
}) => {
  // Check if we're being used as a route component
  const { encoded } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocketClient();
  const isRouteComponent = !!encoded;

  // State for when used as route component
  const [routeModalData, setRouteModalData] = useState(null);
  const [loading, setLoading] = useState(isRouteComponent);
  const [toastConfig, setToastConfig] = useState({
    message: '',
    type: 'success'
  });

  // Use prop data or route data
  const modalData = isRouteComponent ? routeModalData : propModalData;

  // Determine if we should show the respond section
  const shouldShowRespondSection = () => {
    if (!showRespondSection) return false;

    // If we're in route mode, check where we came from
    if (isRouteComponent && location.state?.cameFrom) {
      // Show respond section for pending and schedule tabs
      // Hide respond section for forms and visitorRecords (attendance/completed appointments)
      return location.state.cameFrom === 'pending' ||
        location.state.cameFrom === 'schedule';
    }

    return true;
  };

  // Toast functions for route mode
  const showToast = useCallback((message, type = 'success') => {
    if (propShowToast) {
      propShowToast(message, type);
    } else {
      setToastConfig({
        message,
        type
      });
    }
  }, [propShowToast]);

  const hideToast = useCallback(() => {
    setToastConfig(prevConfig => ({
      ...prevConfig,
      message: ''
    }));
  }, []);


  // Fetch appointment details when used as route
  const fetchAppointmentDetails = useCallback(async (appointmentId) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/auth/appointment/${appointmentId}`);
      setRouteModalData({
        ...response.data,
        showRespond: true,
      });
    } catch (error) {
      console.error('Failed to fetch appointment details:', error);
      showToast('Failed to load appointment details', 'error');
      navigate('/admin/appointment');
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate]);

  // Update appointment status function for route mode
  const routeUpdateAppointmentStatus = useCallback(async (appointmentId, newStatus, presentCount = undefined) => {
    try {
      const requestData = { status: newStatus };
      if (presentCount !== undefined) {
        requestData.present_count = presentCount;
      }

      await axiosClient.patch(
        `/auth/appointment/${appointmentId}/status`,
        requestData
      );

      showToast(`Status updated successfully`, 'success');

      // Refresh appointment data
      if (routeModalData?.appointmentId) {
        fetchAppointmentDetails(routeModalData.appointmentId);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showToast('Failed to update appointment status', 'error');
    }
  }, [routeModalData, showToast, fetchAppointmentDetails]);

  // Use prop function or route function
  const updateAppointmentStatus = isRouteComponent ? routeUpdateAppointmentStatus : propUpdateAppointmentStatus;

  // Close handler
  const onClose = useCallback(() => {
    if (propOnClose) {
      propOnClose();
    } else {
      // Check if location state has cameFrom
      const cameFrom = location.state?.cameFrom;
      if (cameFrom === 'schedule') {
        navigate('/admin/schedule');
      } else if (cameFrom === 'visitorRecords' || cameFrom === 'forms' || cameFrom === 'pending') {
        // Navigate back to appointments page with the correct tab
        navigate('/admin/appointment', { state: { activeTab: cameFrom } });
      } else {
        navigate('/admin/appointment');
      }
    }
  }, [propOnClose, navigate, location.state]);


  // Send handler
  const onSend = useCallback(() => {
    if (propOnSend) {
      propOnSend();
    } else {
      showToast(`Message sent to ${modalData?.email || 'visitor'}`, 'success');
      navigate('/admin/appointment');
    }
  }, [propOnSend, modalData, showToast, navigate]);

  // Fetch data when used as route component
  useEffect(() => {
    if (isRouteComponent && encoded) {
      try {
        const decoded = atob(encoded);
        // Extract appointment ID from the decoded string
        // The format could be either:
        // 1. Old format: "123 " (just ID with space)
        // 2. New format: "John Doe - Confirmed - Jan 15 - 10:00 AM - 12:00 PM - 5 visitors"
        // 3. Attendance format: "Appointment 123 - John Doe - Jan 15, 2024 - Purpose..."

        let appointmentId;

        // Extract appointment ID from the beginning of the decoded string
        // Format is now simply: "123 John Doe"
        const match = decoded.match(/^(\d+)\s/);
        if (match) {
          appointmentId = parseInt(match[1], 10);
        } else {
          console.error('Unable to extract appointment ID from breadcrumb:', decoded);
          navigate('/admin/appointment');
          return;
        }

        if (appointmentId) {
          fetchAppointmentDetails(appointmentId);
        } else {
          console.error('Invalid appointment ID:', decoded);
          navigate('/admin/appointment');
        }
      } catch (error) {
        console.error('Failed to decode appointment ID from URL:', error);
        navigate('/admin/appointment');
      }
    }
  }, [isRouteComponent, encoded, fetchAppointmentDetails, navigate]);

  // Socket listener for real-time updates when used as route
  useEffect(() => {
    if (!isRouteComponent || !routeModalData || !socket) return;

    const handleAppointmentChange = (changedAppointmentId) => {
      if (changedAppointmentId === routeModalData.appointmentId) {
        fetchAppointmentDetails(changedAppointmentId);
      }
    };

    socket.onDbChange("Appointment", "*", handleAppointmentChange);
    socket.onDbChange("AppointmentStatus", "*", handleAppointmentChange);

    return () => {
      socket.offDbChange("Appointment", "*", handleAppointmentChange);
      socket.offDbChange("AppointmentStatus", "*", handleAppointmentChange);
    };
  }, [isRouteComponent, routeModalData, fetchAppointmentDetails, socket]);
  const [approveVisit, setApproveVisit] = useState('');
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [approvalError, setApprovalError] = useState(false);
  const [presentCount, setPresentCount] = useState('');
  const [presentCountError, setPresentCountError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState(false);

  // State for modular modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // Function to execute on confirmation

  const [showPopupModal, setShowPopupModal] = useState(false);
  const [popupModalTitle, setPopupModalTitle] = useState('');
  const [popupModalMessage, setPopupModalMessage] = useState('');
  const [popupModalType, setPopupModalType] = useState('info');

  const token = localStorage.getItem('token');
  // const API_URL = import.meta.env.VITE_API_URL; // <--- REMOVE OR COMMENT OUT THIS LINE

  const convertTo12HourFormat = (time24h) => {
    if (!time24h) return '';
    if (time24h.includes('AM') || time24h.includes('PM')) {
      return time24h;
    }
    try {
      const timeRegex = /(\d{1,2})[:.h]?(\d{2})?/;
      const match = time24h.match(timeRegex);
      if (!match) return time24h;
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? `:${match[2]}` : ':00';
      const period = hours >= 12 ? 'PM' : 'AM';
      if (hours === 0) hours = 12;
      if (hours > 12) hours -= 12;
      return `${hours}${minutes} ${period}`;
    } catch (error) {
      console.error('Error converting time format:', error);
      return time24h;
    }
  };

  const formatTimeRange = (timeRange) => {
    if (!timeRange) return '';
    if (timeRange.includes('-')) {
      const [startTime, endTime] = timeRange.split('-').map(t => t.trim());
      return `${convertTo12HourFormat(startTime)} - ${convertTo12HourFormat(endTime)}`;
    }
    return convertTo12HourFormat(timeRange);
  };

  useEffect(() => {
    if (modalData && modalData.status) {
      const normalizedStatus = normalizeStatus(modalData.status);
      if (normalizedStatus === 'APPROVED') {
        setApproveVisit('');
      } else if (normalizedStatus === 'REJECTED') {
        setApproveVisit('no');
      } else if (normalizedStatus === 'COMPLETED') {
        setApproveVisit('arrive');
      } else if (normalizedStatus === 'FAILED') {
        setApproveVisit('cancel');
      } else {
        setApproveVisit('');
      }
    } else {
      setApproveVisit('');
    }
    setMessageError(false);
    setApprovalError(false);
    setPresentCountError(false);
    setActionError(false);
    setMessage("");
    setPresentCount('');
    setIsLoading(false);
    // Close any open sub-modals when modalData changes
    setShowConfirmModal(false);
    setShowPopupModal(false);
  }, [modalData]);

  // Show loading state when used as route component
  if (isRouteComponent && loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-2xl">Loading appointment details...</div>
      </div>
    );
  }

  // Return null if no data
  if (!isRouteComponent && (!showModal || !modalData)) return null;
  if (isRouteComponent && !modalData) return null;

  // Use normalized status for consistent checking
  const normalizedStatus = normalizeStatus(modalData.status);
  const isPending = normalizedStatus === 'PENDING';
  const isApproved = normalizedStatus === 'APPROVED';
  const isRejected = normalizedStatus === 'REJECTED';
  const isFailed = normalizedStatus === 'FAILED';
  const isCompleted = normalizedStatus === 'COMPLETED';
  const isCompletedOrFailed = isCompleted || isFailed;

  // This function will contain the actual logic to send email and update status
  const executeAppointmentAction = async () => {
    setIsLoading(true);
    let newStatus = modalData.status;
    let successMessage = '';
    let errorMessage = '';

    try {
      if (approveVisit === 'yes') {
        newStatus = 'APPROVED';
        successMessage = 'Appointment approved successfully!';
      } else if (approveVisit === 'no') {
        newStatus = 'REJECTED';
        successMessage = 'Appointment rejected successfully!';
      } else if (approveVisit === 'cancel') {
        newStatus = 'FAILED';
        successMessage = 'Appointment cancelled successfully!';
      } else if (approveVisit === 'arrive') {
        newStatus = 'COMPLETED';
        successMessage = 'Appointment marked as completed!';
      }

      const emailData = {
        recipientEmail: modalData.email || '',
        subject: `Appointment ${newStatus.toLowerCase()} - Museo Bulawan`,
        message: message,
        status: newStatus,
        appointmentId: modalData.appointmentId,
        appointmentDetails: {
          visitorName: `${modalData.fromFirstName} ${modalData.fromLastName}`,
          preferredDate: modalData.preferredDate,
          preferredTime: modalData.preferredTime,
          purpose: modalData.purpose
        }
      };

      let emailSent = false;
      try {
        await axiosClient.post(
          `/auth/send-email-notification`,
          emailData
        );
        console.log('Email notification sent.');
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        emailSent = false;
        // Log error but proceed with status update
      }

      if (approveVisit === 'arrive') {
        const presentValue = parseInt(presentCount, 10) || 0;
        await updateAppointmentStatus(modalData.appointmentId, newStatus, presentValue);
      } else {
        await updateAppointmentStatus(modalData.appointmentId, newStatus);
      }

      // Create a comprehensive log entry for the entire appointment response action
      try {
        const logData = {
          appointmentId: modalData.appointmentId,
          status: newStatus,
          presentCount: approveVisit === 'arrive' ? parseInt(presentCount, 10) || 0 : undefined,
          emailSent: emailSent,
          message: message,
          visitorName: `${modalData.fromFirstName} ${modalData.fromLastName}`,
          recipientEmail: modalData.email
        };

        // The logging will happen automatically through the backend middleware
        // when we update the appointment status, so we don't need a separate API call
        console.log('Appointment response completed with log data:', logData);
      } catch (logError) {
        console.error('Error creating log entry:', logError);
        // Don't fail the operation if logging fails
      }

      onSend && onSend(); // Trigger parent component's success callback
      setPopupModalTitle('Success');
      setPopupModalMessage(successMessage);
      setPopupModalType('info');
      setShowPopupModal(true);
      onClose(); // Close the main modal after successful action
    } catch (err) {
      console.error('Error while updating status or sending email:', err);
      errorMessage = 'Failed to update appointment. Please try again.';
      setPopupModalTitle('Error');
      setPopupModalMessage(errorMessage);
      setPopupModalType('danger');
      setShowPopupModal(true);
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false); // Ensure confirmation modal is closed
    }
  };

  // Handler for the "Done" button click - now triggers confirmation modal
  const handleSend = async () => {
    // --- Validation Logic ---
    if (isPending) {
      // Before approving, validate the appointment schedule
      if (approveVisit === 'yes' && modalData) {
        try {
          // Prepare appointment data for validation
          const appointmentData = {
            date: modalData.preferredDate ? modalData.preferredDate.split('T')[0] : null,
            startTime: modalData.start_time || '09:00',
            endTime: modalData.end_time || '10:00'
          };

          // Fetch existing schedules and appointments for validation
          const [schedulesResponse, appointmentsResponse] = await Promise.all([
            axiosClient.get(`/auth/schedules?date=${appointmentData.date}`),
            axiosClient.get('/auth/appointment')
          ]);

          // Filter approved appointments for the same date
          const approvedAppointments = appointmentsResponse.data.filter(appt => {
            const apptDate = appt.preferred_date ? appt.preferred_date.split('T')[0] : null;
            const status = appt.AppointmentStatus?.status || '';
            return apptDate === appointmentData.date && status.toUpperCase() === 'APPROVED';
          });

          // Combine schedules and approved appointments
          const existingEvents = [
            ...schedulesResponse.data.filter(schedule => schedule.status !== 'COMPLETED').map(schedule => ({
              date: schedule.date,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              availability: schedule.availability || 'SHARED',
              isSchedule: true
            })),
            ...approvedAppointments.map(appt => ({
              date: appt.preferred_date.split('T')[0],
              startTime: appt.start_time || '09:00',
              endTime: appt.end_time || '10:00',
              availability: 'SHARED',
              isAppointment: true
            }))
          ];

          // Validate the appointment
          const validationResult = validateAppointmentSchedule(appointmentData, existingEvents);
          if (!validationResult.isValid) {
            showToast(validationResult.error || 'Appointment time conflicts with existing schedules or is invalid.', 'error');
            return;
          }
        } catch (error) {
          console.error('Error validating appointment:', error);
          showToast('Failed to validate appointment schedule. Please try again.', 'error');
          return;
        }
      }

      if (!approveVisit) {
        setApprovalError(true);
        return;
      }
      if (!message.trim()) {
        setMessageError(true);
        return;
      }
      setConfirmModalTitle('Confirm Action');
      setConfirmModalMessage(`Are you sure you want to ${approveVisit === 'yes' ? 'approve' : 'reject'} this appointment?`);
      setConfirmAction(() => executeAppointmentAction); // Set the function to be called on confirm
      setShowConfirmModal(true);
    } else if (isApproved) {
      if (!approveVisit) {
        setActionError(true);
        return;
      }
      if (approveVisit === 'cancel' && !message.trim()) {
        setMessageError(true);
        return;
      }
      if (approveVisit === 'arrive') {
        if (!presentCount || parseInt(presentCount, 10) < 0) {
          setPresentCountError(true);
          return;
        }
      }
      setConfirmModalTitle('Confirm Action');
      setConfirmModalMessage(`Are you sure you want to ${approveVisit === 'cancel' ? 'cancel' : 'mark as arrived'} this appointment?`);
      setConfirmAction(() => executeAppointmentAction);
      setShowConfirmModal(true);
    }
  };

  const handleAllPresent = () => {
    setPresentCount(String(modalData.populationCount || '0'));
    setPresentCountError(false);
  };

  // Render content based on whether it's a route component or modal
  const renderContent = () => (
    <>
      {/* Header Section - Enlarged text for full page layout */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-6xl font-bold text-gray-900">
          {modalData.fromFirstName} {modalData.fromLastName}
        </h1>
        <div className="text-2xl text-gray-600 font-medium">
          {modalData.dateSent || "N/A"}
        </div>
      </div>

      <hr className="border-gray-400 mb-14" />

      {/* Main Content Grid - Optimized layout */}
      <div className={`grid grid-cols-1 gap-16 ${shouldShowRespondSection() ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Left Column - Contact Information + Notes */}
        <div className="space-y-8">
          {/* Contact Information Section - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 mt-1">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-medium text-gray-900 mb-1">Email</div>
                <div className="text-2xl text-blue-600 font-medium break-all">{modalData.email || 'N/A'}</div>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 mt-1">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-medium text-gray-900 mb-1">Phone</div>
                <div className="text-2xl text-blue-600 font-medium">{modalData.phone || 'N/A'}</div>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 col-span-1">
              <div className="w-6 h-6 mt-1">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-medium text-gray-900 mb-1">Address</div>
                <div className="text-2xl text-blue-600 font-medium">
                  {modalData.street || 'N/A'}, {modalData.barangay || 'N/A'}, {modalData.city_municipality || 'N/A'}, {modalData.province || 'N/A'}
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 mt-1">
                <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-medium text-gray-900 mb-1">Organization</div>
                <div className="text-2xl text-blue-600 font-medium">{modalData.organization || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Appointment Details Section - 2x2 Grid */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-2xl font-medium text-gray-900 mb-2">Purpose of Visit</div>
                <div className="text-2xl text-blue-600 font-medium">{modalData.purpose || 'N/A'}</div>
              </div>

              <div>
                <div className="text-2xl font-medium text-gray-900 mb-2">Population Count</div>
                <div className="text-2xl text-blue-600 font-medium">{modalData.populationCount || '0'}</div>
              </div>

              <div>
                <div className="text-2xl font-medium text-gray-900 mb-2">Preferred Date</div>
                <div className="text-2xl text-blue-600 font-medium">{modalData.preferredDate || 'N/A'}</div>
              </div>

              <div>
                <div className="text-2xl font-medium text-gray-900 mb-2">Preferred Time</div>
                <div className="text-2xl text-blue-600 font-medium">
                  {modalData.preferredTime
                    ? formatTimeRange(modalData.preferredTime)
                    : (modalData.start_time || modalData.end_time
                      ? `${convertTo12HourFormat(modalData.start_time || '')}${modalData.start_time && modalData.end_time ? ' - ' : ''
                      }${convertTo12HourFormat(modalData.end_time || '')}`
                      : "Flexible")}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {modalData.notes && (
            <div className="bg-gray-100 p-6 rounded-lg">
              <div className="text-2xl font-medium text-gray-900 mb-3">Notes</div>
              <div className="text-2xl text-blue-600 font-medium">{modalData.notes}</div>
            </div>
          )}
        </div>


        <div>
          <AppointmentFileViewer
            requestLetterFiles={modalData.request_letter_files || modalData.requestLetterFiles || []}
            containerHeight="h-[40rem]"
          />
        </div>



        {/* Right Column - Respond Section */}
        <div>
          {shouldShowRespondSection() && (
            <div>
              <h3 className="text-4xl font-bold mb-10">Respond</h3>

              {isPending && (
                <>
                  <div className="mb-10">
                    <div className="text-2xl font-medium mb-6">Approve Visit?</div>
                    <div className="flex gap-8">
                      <button
                        onClick={() => {
                          setApproveVisit('yes');
                          setApprovalError(false);
                        }}
                        className={`px-16 py-4 text-2xl rounded-md font-medium transition-colors ${approveVisit === 'yes'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => {
                          setApproveVisit('no');
                          setApprovalError(false);
                        }}
                        className={`px-16 py-4 text-2xl rounded-md font-medium transition-colors ${approveVisit === 'no'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        No
                      </button>
                    </div>
                    {approvalError && (
                      <div className="text-2xl text-red-500 mt-4 text-center font-medium">
                        Please select Yes or No before continuing.
                      </div>
                    )}
                  </div>

                  <div className="mb-10">
                    <div className="text-2xl font-medium mb-4">Leave a message</div>
                    <textarea
                      className={`w-full p-6 border ${messageError ? 'border-red-500' : 'border-gray-300'
                        } rounded-md h-[180px] resize-none text-xl`}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (e.target.value.trim()) {
                          setMessageError(false);
                        }
                      }}
                      placeholder="Enter message here (required)"
                    />
                    {messageError && (
                      <div className="text-2xl text-red-500 mt-3 font-medium">
                        Please enter a message for the visitor.
                      </div>
                    )}
                    <div className="text-xl text-gray-500 mt-4">
                      This will automatically send to{' '}
                      <span className="text-blue-600 font-medium">{modalData.email || 'the visitor'}</span>
                    </div>
                  </div>
                </>
              )}

              {isApproved && (
                <>
                  <div className="mb-6">
                    <div className="text-2xl mb-3">Appointment Action</div>
                    <div className="flex gap-6">
                      <StyledButton
                        onClick={() => {
                          setApproveVisit('cancel');
                          setActionError(false);
                          setMessageError(false);
                        }}
                        buttonColor={approveVisit === 'cancel' ? 'bg-red-600' : 'bg-gray-200'}
                        hoverColor={approveVisit === 'cancel' ? 'hover:bg-red-700' : 'hover:bg-gray-300'}
                        textColor={approveVisit === 'cancel' ? 'text-white' : 'text-gray-800'}
                        className="px-10 py-3 text-lg"
                      >
                        Cancel
                      </StyledButton>
                      <StyledButton
                        onClick={() => {
                          setApproveVisit('arrive');
                          setActionError(false);
                          setMessageError(false);
                        }}
                        buttonColor={approveVisit === 'arrive' ? 'bg-green-600' : 'bg-gray-200'}
                        hoverColor={approveVisit === 'arrive' ? 'hover:bg-green-700' : 'hover:bg-gray-300'}
                        textColor={approveVisit === 'arrive' ? 'text-white' : 'text-gray-800'}
                        className="px-10 py-3 text-lg"
                      >
                        Arrive
                      </StyledButton>
                    </div>
                    {actionError && (
                      <div className="text-xl text-red-500 mt-3">
                        Please select Cancel or Arrive before continuing.
                      </div>
                    )}
                  </div>

                  {approveVisit === 'cancel' && (
                    <div className="mb-6">
                      <div className="text-2xl mb-3">Cancellation Message</div>
                      <textarea
                        className={`w-full p-4 border ${messageError ? 'border-red-500' : 'border-gray-300'
                          } rounded-md min-h-[120px] max-h-[160px] overflow-y-auto resize-none text-lg`}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (e.target.value.trim()) {
                            setMessageError(false);
                          }
                        }}
                        placeholder="Enter cancellation reason (required)"
                      />
                      {messageError && (
                        <p className="text-xl text-red-500 mt-2">
                          Please enter a cancellation reason.
                        </p>
                      )}
                      <div className="text-xl text-gray-500 mt-3">
                        This will automatically send to{' '}
                        {modalData.email || 'the visitor'}
                      </div>
                    </div>
                  )}

                  {approveVisit === 'arrive' && (
                    <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-2xl font-bold mb-4">Attendance Details</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-4">
                        <div>
                          <div className="text-gray-600 text-lg mb-2">Expected Visitors:</div>
                          <div className="text-3xl font-semibold text-blue-600">
                            {modalData.populationCount || '0'}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-600 text-lg mb-2">Present:</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className={`border ${presentCountError ? 'border-red-500' : 'border-gray-300'
                                } rounded-md p-2 w-full text-lg font-medium`}
                              value={presentCount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                  setPresentCount(value);
                                  setPresentCountError(false);
                                }
                              }}
                              placeholder="Enter count"
                              min="0"
                            />
                            <StyledButton
                              onClick={handleAllPresent}
                              buttonColor="bg-green-500"
                              hoverColor="hover:bg-green-600"
                              textColor="text-white"
                              className="px-2 py-2 whitespace-nowrap text-base font-medium"
                            >
                              All Present
                            </StyledButton>
                          </div>
                          {presentCountError && (
                            <div className="text-lg text-red-500 mt-1">
                              Please enter how many visitors attended
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-lg font-medium mb-2">Completion Message</div>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md min-h-[65px] max-h-[100px] overflow-y-auto resize-none text-base"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter completion message (optional)"
                        />
                        <div className="text-base text-gray-500 mt-2">
                          This will automatically send to{' '}
                          <span className="text-blue-600 font-medium">{modalData.email || 'the visitor'}</span>
                        </div>
                      </div>

                      <div className="text-base text-gray-600 mt-3 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                        <span className="font-medium">Instructions:</span> Enter the number of visitors who actually attended. Click "All Present" if everyone arrived as expected.
                      </div>
                    </div>
                  )}
                </>
              )}

              {isRejected && (
                <div className="mb-8 text-center">
                  <div className="px-8 py-6 bg-gray-100 rounded-lg text-gray-700 text-xl">
                    This appointment has been rejected. No further actions are available.
                  </div>
                </div>
              )}

              {isCompletedOrFailed && (
                <div className="mb-8 text-center">
                  <div className="px-8 py-6 bg-gray-100 rounded-lg text-gray-700 text-xl">
                    This appointment is {modalData.status.toLowerCase()}. No further actions are
                    available.
                  </div>
                </div>
              )}

              {/* Done button at the bottom right of respond section */}
              {isPending && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`px-16 py-4 text-2xl rounded-md font-medium transition-colors ${isLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                  >
                    {isLoading ? 'Processing...' : 'Done'}
                  </button>
                </div>
              )}

              {/* Done button for approved appointments - only show when action is selected */}
              {isApproved && approveVisit && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`px-16 py-4 text-2xl rounded-md font-medium transition-colors ${isLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                  >
                    {isLoading ? 'Processing...' : 'Done'}
                  </button>
                </div>
              )}

              {(isCompletedOrFailed || isRejected) && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={onClose}
                    className="px-16 py-4 text-2xl bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );

  // Always render as full page layout - no modal behavior
  return (
    <>
      {/* Main Appointment View - Full tab page layout */}
      <div className="w-full h-fit bg-white flex flex-col overflow-hidden">
        {/* Back Button */}
        <div className="flex-shrink-0 p-4 pb-2 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-400 rounded-lg transition-colors bg-gray-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Appointments
          </button>
        </div>

        {/* Main Content - Full tab page layout */}
        <div className="flex-1 p-8 pt-4 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmModalTitle}
        message={confirmModalMessage}
        type="question"
        theme="light"
      />

      {/* Popup Modal for Success/Error */}
      <PopupModal
        isOpen={showPopupModal}
        onClose={() => setShowPopupModal(false)}
        title={popupModalTitle}
        message={popupModalMessage}
        type={popupModalType}
        theme="light"
      />

      {/* Toast */}
      {isRouteComponent && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={hideToast}
        />
      )}
    </>
  );
};

export default {
  AppointmentViewPage,
};



