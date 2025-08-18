import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppointmentForm from './components/AppointmentForm';
import usePrompt from '@/hooks/usePrompt';

const Appointment = () => {
  const navigate = useNavigate();
  const [isDirty, setIsDirty] = useState(false);

  // Use the prompt hook for navigation warnings
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty,
    "light"
  );

  // Listen for form changes to set isDirty
  useEffect(() => {
    const handleFormChange = () => {
      setIsDirty(true);
    };

    // Add event listener for form changes
    window.addEventListener('formChanged', handleFormChange);

    return () => {
      window.removeEventListener('formChanged', handleFormChange);
    };
  }, []);

  // Reset isDirty when form is submitted or cleared
  useEffect(() => {
    const handleFormReset = () => {
      setIsDirty(false);
    };

    window.addEventListener('formReset', handleFormReset);
    window.addEventListener('formSubmitted', handleFormReset);

    return () => {
      window.removeEventListener('formReset', handleFormReset);
      window.removeEventListener('formSubmitted', handleFormReset);
    };
  }, []);

  return (
    <>
      {PromptModal}
      <AppointmentForm user={null} />
    </>
  );
};

export default Appointment;
