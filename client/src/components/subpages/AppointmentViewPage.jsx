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
      // Hide respond section if coming from attendance or visitor records
      return location.state.cameFrom === 'forms' || location.state.cameFrom === 'schedule';
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
      } else if (cameFrom === 'attendance' || cameFrom === 'visitorRecords') {
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
      if (modalData.status === 'CONFIRMED' || modalData.status === 'Confirmed') {
        setApproveVisit('');
      } else if (modalData.status === 'REJECTED' || modalData.status === 'Rejected') {
        setApproveVisit('no');
      } else if (modalData.status === 'COMPLETED' || modalData.status === 'Completed') {
        setApproveVisit('arrive');
      } else if (modalData.status === 'FAILED' || modalData.status === 'Failed') {
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

  const isToReview = modalData.status === 'TO_REVIEW' || modalData.status === 'To Review';
  const isConfirmed = modalData.status === 'CONFIRMED' || modalData.status === 'Confirmed';
  const isRejected = modalData.status === 'REJECTED' || modalData.status === 'Rejected';
  const isFailed = modalData.status === 'FAILED' || modalData.status === 'Failed';
  const isCompleted = modalData.status === 'COMPLETED' || modalData.status === 'Completed';
  const isCompletedOrFailed = isCompleted || isFailed;

  // This function will contain the actual logic to send email and update status
  const executeAppointmentAction = async () => {
    setIsLoading(true);
    let newStatus = modalData.status;
    let successMessage = '';
    let errorMessage = '';

    try {
      if (approveVisit === 'yes') {
        newStatus = 'CONFIRMED';
        successMessage = 'Appointment confirmed successfully!';
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
    if (isToReview) {
      // Before confirming, validate the appointment schedule
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

          // Filter confirmed appointments for the same date
          const confirmedAppointments = appointmentsResponse.data.filter(appt => {
            const apptDate = appt.preferred_date ? appt.preferred_date.split('T')[0] : null;
            const status = appt.AppointmentStatus?.status || '';
            return apptDate === appointmentData.date && status.toUpperCase() === 'CONFIRMED';
          });

          // Combine schedules and confirmed appointments
          const existingEvents = [
            ...schedulesResponse.data.filter(schedule => schedule.status !== 'COMPLETED').map(schedule => ({
              date: schedule.date,
              startTime: schedule.start_time,
              endTime: schedule.end_time,
              availability: schedule.availability || 'SHARED',
              isSchedule: true
            })),
            ...confirmedAppointments.map(appt => ({
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
      setConfirmModalMessage(`Are you sure you want to ${approveVisit === 'yes' ? 'confirm' : 'reject'} this appointment?`);
      setConfirmAction(() => executeAppointmentAction); // Set the function to be called on confirm
      setShowConfirmModal(true);
    } else if (isConfirmed) {
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
    setPresentCount(modalData.populationCount || '0');
    setPresentCountError(false);
  };

  // Render content based on whether it's a route component or modal
  const renderContent = () => (
    <>
      <div className="flex justify-between items-center mt-2">
        <h2 className="text-3xl font-bold">
          {modalData.fromFirstName} {modalData.fromLastName}
        </h2>
        <div className="text-lg">
          {modalData.dateSent || "N/A"}
        </div>
      </div>

      <hr className="border-gray-300 my-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
        <div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Email</div>
            <div className="text-blue-500 text-xl">{modalData.email || 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Phone Number</div>
            <div className="text-blue-500 text-xl">{modalData.phone || 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Address</div>
            <div className="text-blue-500 text-xl">
              {modalData.street || 'N/A'}, {modalData.barangay || 'N/A'}, {modalData.city_municipality || 'N/A'},{' '}
              {modalData.province || 'N/A'}
            </div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Organization</div>
            <div className="text-blue-500 text-xl">{modalData.organization || 'N/A'}</div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Purpose of Visit</div>
            <div className="text-blue-500 text-xl">{modalData.purpose || 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Population Count</div>
            <div className="text-blue-500 text-xl">{modalData.populationCount || '0'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Preferred Date</div>
            <div className="text-blue-500 text-xl">{modalData.preferredDate || 'N/A'}</div>
          </div>
          <div className="mb-4">
            <div className="text-gray-600 text-base mb-1">Preferred Time</div>
            <div className="text-blue-500 text-xl">
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

      <div className="mb-6">
        <div className="text-gray-600 text-base mb-1">Notes</div>
        <div className="text-blue-500 text-xl">{modalData.notes || 'N/A'}</div>
      </div>

      <hr className="border-gray-300 my-6" />

      {shouldShowRespondSection() && (
        <div>
          <h3 className="text-2xl font-bold mb-6">Respond</h3>

          {isToReview && (
            <>
              <div className="mb-6">
                <div className="text-lg mb-3">Approve Visit?</div>
                <div className="flex gap-4">
                  <StyledButton
                    onClick={() => {
                      setApproveVisit('yes');
                      setApprovalError(false);
                    }}
                    buttonColor={approveVisit === 'yes' ? 'bg-[#6F3FFF]' : 'bg-gray-200'}
                    hoverColor={approveVisit === 'yes' ? 'hover:bg-[#5F2FEF]' : 'hover:bg-gray-300'}
                    textColor={approveVisit === 'yes' ? 'text-white' : 'text-gray-800'}
                    className="px-8 py-3 text-lg"
                  >
                    Yes
                  </StyledButton>
                  <StyledButton
                    onClick={() => {
                      setApproveVisit('no');
                      setApprovalError(false);
                    }}
                    buttonColor={approveVisit === 'no' ? 'bg-red-600' : 'bg-gray-200'}
                    hoverColor={approveVisit === 'no' ? 'hover:bg-red-700' : 'hover:bg-gray-300'}
                    textColor={approveVisit === 'no' ? 'text-white' : 'text-gray-800'}
                    className="px-8 py-3 text-lg"
                  >
                    No
                  </StyledButton>
                </div>
                {approvalError && (
                  <p className="text-base text-red-500 mt-2">
                    Please select Yes or No before continuing.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <div className="text-lg mb-3">Leave a message</div>
                <textarea
                  className={`w-full p-4 border ${messageError ? 'border-red-500' : 'border-gray-300'
                    } rounded-md h-[120px] overflow-y-auto resize-none text-base`}
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
                  <p className="text-base text-red-500 mt-1">
                    Please enter a message for the visitor.
                  </p>
                )}
                <div className="text-base text-gray-500 mt-2">
                  This will automatically send to{' '}
                  {modalData.email || 'the visitor'}
                </div>
              </div>
            </>
          )}

          {isConfirmed && (
            <>
              <div className="mb-6">
                <div className="text-lg mb-3">Appointment Action</div>
                <div className="flex gap-4">
                  <StyledButton
                    onClick={() => {
                      setApproveVisit('cancel');
                      setActionError(false);
                      setMessageError(false);
                    }}
                    buttonColor={approveVisit === 'cancel' ? 'bg-red-600' : 'bg-gray-200'}
                    hoverColor={approveVisit === 'cancel' ? 'hover:bg-red-700' : 'hover:bg-gray-300'}
                    textColor={approveVisit === 'cancel' ? 'text-white' : 'text-gray-800'}
                    className="px-8 py-3 text-lg"
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
                    className="px-8 py-3 text-lg"
                  >
                    Arrive
                  </StyledButton>
                </div>
                {actionError && (
                  <p className="text-base text-red-500 mt-2">
                    Please select Cancel or Arrive before continuing.
                  </p>
                )}
              </div>

              {approveVisit === 'cancel' && (
                <div className="mb-6">
                  <div className="text-lg mb-3">Cancellation Message</div>
                  <textarea
                    className={`w-full p-4 border ${messageError ? 'border-red-500' : 'border-gray-300'
                      } rounded-md h-[120px] overflow-y-auto resize-none text-base`}
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
                    <p className="text-base text-red-500 mt-1">
                      Please enter a cancellation reason.
                    </p>
                  )}
                  <div className="text-base text-gray-500 mt-2">
                    This will automatically send to{' '}
                    {modalData.email || 'the visitor'}
                  </div>
                </div>
              )}

              {approveVisit === 'arrive' && (
                <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-xl font-bold mb-4">Attendance Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mb-4">
                    <div>
                      <div className="text-gray-600 text-base mb-2">Expected Visitors:</div>
                      <div className="text-2xl font-semibold">
                        {modalData.populationCount || '0'}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 text-base mb-2">Present:</div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          className={`border ${presentCountError ? 'border-red-500' : 'border-gray-300'
                            } rounded-md p-3 w-full text-lg`}
                          value={presentCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d+$/.test(value)) {
                              setPresentCount(value);
                              setPresentCountError(false);
                            }
                          }}
                          placeholder="Enter present count"
                          min="0"
                        />
                        <StyledButton
                          onClick={handleAllPresent}
                          buttonColor="bg-green-500"
                          hoverColor="hover:bg-green-600"
                          textColor="text-white"
                          className="px-3 py-3 whitespace-nowrap text-base"
                        >
                          All Present
                        </StyledButton>
                      </div>
                      {presentCountError && (
                        <p className="text-base text-red-500 mt-1">
                          Please enter how many visitors attended
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-lg mb-2">Completion Message</div>
                    <textarea
                      className="w-full p-4 border border-gray-300 rounded-md h-[120px] overflow-y-auto resize-none text-base"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter completion message (optional)"
                    />
                    <div className="text-base text-gray-500 mt-2">
                      This will automatically send to{' '}
                      {modalData.email || 'the visitor'}
                    </div>
                  </div>

                  <div className="text-base text-gray-500 mt-4">
                    Enter the number of visitors who actually attended. Click "All Present" if
                    everyone arrived.
                  </div>
                </div>
              )}
            </>
          )}

          {isRejected && (
            <div className="mb-6 text-center text-xl">
              <div className="px-6 py-3 bg-gray-100 rounded-lg text-gray-700">
                This appointment has been rejected. No further actions are available.
              </div>
            </div>
          )}

          {isCompletedOrFailed && (
            <div className="mb-6 text-center text-xl">
              <div className="px-6 py-3 bg-gray-100 rounded-lg text-gray-700">
                This appointment is {modalData.status.toLowerCase()}. No further actions are
                available.
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            {(isToReview || isConfirmed) && (
              <StyledButton
                onClick={handleSend}
                disabled={isLoading}
                buttonColor={isLoading ? 'bg-gray-400' : 'bg-[#6F3FFF]'}
                hoverColor={isLoading ? 'hover:bg-gray-400' : 'hover:bg-[#5F2FEF]'}
                textColor="text-white"
                className="px-10 py-3 text-lg font-medium"
              >
                {isLoading ? 'Processing...' : 'Done'}
              </StyledButton>
            )}

            {(isCompletedOrFailed || isRejected) && (
              <StyledButton
                onClick={onClose}
                buttonColor="bg-gray-500"
                hoverColor="hover:bg-gray-600"
                textColor="text-white"
                className="px-10 py-3 text-lg font-medium"
              >
                Close
              </StyledButton>
            )}
          </div>
        </div>
      )}

      {!shouldShowRespondSection() && (
        <div className="flex justify-end mt-6">
          <StyledButton
            onClick={onClose}
            buttonColor="bg-gray-500"
            hoverColor="hover:bg-gray-600"
            textColor="text-white"
            className="px-10 py-3 text-lg font-medium"
          >
            Close
          </StyledButton>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Main Appointment View - Render differently based on whether it's a route or modal */}
      {isRouteComponent ? (
        // Full page view when used as route component (like ViewLogs)
        <div className="w-full h-full pt-5 overflow-y-auto">
          <div className="w-full h-full flex flex-col gap-y-[2rem]">
            <div className="max-w-4xl mx-auto w-full px-8">
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                  onClick={onClose}
                  aria-label="Close view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                {/* Main Content */}
                <div className="pr-12">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Modal view when used as a prop-based component
        <div
          className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className="relative bg-[#F0F0F0] shadow-lg p-8 w-full h-full max-w-none max-h-none overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto py-4">
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <button
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div className="pr-12">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Toast for route component */}
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
