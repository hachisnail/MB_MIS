import { useState, useEffect } from "react";
import StyledButton from "../buttons/StyledButton";
import usePrompt from "../../hooks/usePrompt";
import ConfirmationModal from "../modals/ConfirmationModal";
import axiosClient from "../../lib/axiosClient";
import PopupModal from "../modals/PopupModal";

/**
 * Renders a form for inviting new users to the Museo Bulawan Management Information System.
 * It handles form input, validation, confirmation modals, and sending invitation data to the backend.
 */
const CreateUsers = () => {
  // State variables for form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [selected, setSelected] = useState(""); // Stores the selected role (e.g., "Admin", "ContentManager")

  // State variables for confirmation modals
  const [showClearConfirm, setShowClearConfirm] = useState(false); // Controls visibility of "Clear Form" confirmation
  const [showSendConfirm, setShowSendConfirm] = useState(false);   // Controls visibility of "Send Invitation" confirmation

  // State variables for general information/success/error modal
  const [showInfoModal, setShowInfoModal] = useState(false);     // Controls visibility of the info/success/error modal
  const [infoModalTitle, setInfoModalTitle] = useState("");      // Title for the info modal
  const [infoModalMessage, setInfoModalMessage] = useState("");  // Message content for the info modal
  const [infoModalType, setInfoModalType] = useState("info");    // Type of info modal (e.g., 'success', 'error', 'info')

  // State for form validation errors
  const [formErrors, setFormErrors] = useState({});

  // State for indicating if an API call is in progress
  const [isLoading, setIsLoading] = useState(false);

  /**
   * useEffect hook to dynamically clear validation errors as the user types and fixes input.
   * This effect runs whenever relevant form input states or formErrors state changes.
   */
  useEffect(() => {
    // Create a mutable copy of current errors to modify
    const errors = { ...formErrors };
    let hasChanges = false; // Flag to track if any error was cleared

    // Validate and clear email error if valid
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && errors.email) {
      delete errors.email;
      hasChanges = true;
    }

    // Validate and clear contact error if valid
    if (contact && /^(09|\+639)\d{9}$/.test(contact) && errors.contact) {
      delete errors.contact;
      hasChanges = true;
    }

    // Validate and clear firstName error if not empty
    if (firstName.trim() && errors.firstName) {
      delete errors.firstName;
      hasChanges = true;
    }

    // Validate and clear lastName error if not empty
    if (lastName.trim() && errors.lastName) {
      delete errors.lastName;
      hasChanges = true;
    }

    // Validate and clear role error if selected
    if (selected && errors.role) {
      delete errors.role;
      hasChanges = true;
    }

    // Only update formErrors state if actual changes were made to prevent unnecessary re-renders
    if (hasChanges) {
      setFormErrors(errors);
    }
  }, [firstName, lastName, email, contact, selected, formErrors]); // Dependencies: Re-run when these states change

  /**
   * Determines if the form has any unsaved changes (i.e., if any input field is not empty).
   * Used for the `usePrompt` hook to warn the user before leaving the page.
   */
  const isDirty =
    firstName !== "" ||
    lastName !== "" ||
    email !== "" ||
    contact !== "" ||
    selected !== "";

  // Hook to prompt the user about unsaved changes when navigating away
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty
  );

  /**
   * Handles the click event for the "Clear Inputs" button.
   * Shows a confirmation modal if the form has unsaved changes, otherwise resets the form immediately.
   */
  const clearInputs = () => {
    if (isDirty) {
      setShowClearConfirm(true); // Show confirmation if dirty
    } else {
      resetForm(); // Reset directly if clean
    }
  };

  /**
   * Resets all form inputs to their initial empty states and clears all validation errors.
   */
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setContact("");
    setSelected("");
    setFormErrors({}); // Clear all errors when form is reset
  };

  /**
   * Validates a single form field and updates the `formErrors` state accordingly.
   * This is typically used with `onBlur` events for immediate field-level validation feedback.
   * @param {string} name - The name of the field to validate (e.g., "email", "firstName").
   * @param {string} value - The current value of the field.
   * @returns {boolean} - True if the field is valid, false otherwise.
   */
  const validateField = (name, value) => {
    let isValid = true; // Assume valid initially
    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors }; // Create a copy to modify
      switch (name) {
        case "email":
          if (!value) {
            newErrors.email = "Email is required";
            isValid = false;
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
          } else {
            delete newErrors.email; 
          }
          break;

        case "contact":
          if (!value) {
            newErrors.contact = "Contact number is required";
            isValid = false;
          } else if (!/^(09|\+639)\d{9}$/.test(value)) {
            newErrors.contact =
              "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
            isValid = false;
          } else {
            delete newErrors.contact; 
          }
          break;

        case "firstName":
          if (!value.trim()) {
            newErrors.firstName = "First name is required";
            isValid = false;
          } else {
            delete newErrors.firstName; // Clear error if valid
          }
          break;

        case "lastName":
          if (!value.trim()) {
            newErrors.lastName = "Last name is required";
            isValid = false;
          } else {
            delete newErrors.lastName; // Clear error if valid
          }
          break;

        case "role":
          if (!value) {
            newErrors.role = "Please select a role";
            isValid = false;
          } else {
            delete newErrors.role; // Clear error if valid
          }
          break;
        default:
          break;
      }
      return newErrors; // Return the updated errors object
    });
    return isValid; // Return the validation result for the specific field
  };

  /**
   * Performs a comprehensive validation of the entire form.
   * This is typically called before attempting to submit the form.
    @returns {boolean} - True if all form fields are valid, false otherwise.
   */
  const validateForm = () => {
    let isValid = true; // Assume the entire form is valid initially
    const errors = {}; // Object to collect all errors

    // Validate first name
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    }

    // Validate email
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate contact number
    if (!contact) {
      errors.contact = "Contact number is required";
      isValid = false;
    } else if (!/^(09|\+639)\d{9}$/.test(contact)) {
      errors.contact =
        "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
      isValid = false;
    }

    // Validate role selection
    if (!selected) {
      errors.role = "Please select a role";
      isValid = false;
    }

    setFormErrors(errors); // Update the formErrors state with all found errors
    return isValid; // Return the overall form validation result
  };

  /**
   * Handles the click event for the "Send" button.
   * Validates the form and, if valid, shows the "Send Invitation" confirmation modal.
   */
  const handleSend = () => {
    const isValid = validateForm(); // Validate the entire form
    if (isValid) {
      setShowSendConfirm(true); // Show confirmation if form is valid
    }
  };

  /**
   * Sends the invitation data to the backend API.
   * This function is called after the user confirms sending the invitation.
   * It handles loading states, API calls, and displaying success/error messages.
   */
  const sendInvitationPayload = async () => {
    setIsLoading(true); // Set loading state to true, disabling inputs and buttons
    try {
      const response = await axiosClient.post("/auth/send-invitation", {
        first_name: firstName,
        last_name: lastName,
        email: email,
        contact_number: contact,
        role: selected,
      });

      // Handle successful API response
      setInfoModalTitle("Success!");
      setInfoModalMessage(response.data.message || "Invitation sent successfully.");
      setInfoModalType("info"); // Set modal type to success for styling
      setShowInfoModal(true); // Show the success modal
      resetForm(); // Clear the form on successful submission

    } catch (error) {
      // Handle API error response
      // Extract error message from response data or use a generic message
      const errorMessage = error.response?.data?.message || "Failed to send invitation. Please try again.";
      setInfoModalTitle("Error!");
      setInfoModalMessage(errorMessage);
      setInfoModalType("warning"); // Set modal type to error for styling
      setShowInfoModal(true); // Show the error modal
    } finally {
      setIsLoading(false); // Always set loading state to false after the request completes
    }
  };

  /**
   * Callback for when the user confirms sending the invitation.
   * Closes the confirmation modal and initiates the API call.
   */
  const confirmSend = () => {
    setShowSendConfirm(false); // Close the "Send Invitation" confirmation modal
    sendInvitationPayload(); // Call the async function to send data to backend
  };

  /**
   * Callback for when the user cancels sending the invitation.
   * Closes the confirmation modal.
   */
  const cancelSend = () => {
    setShowSendConfirm(false);
  };

  /**
   * Callback for when the user confirms clearing the form.
   * Resets the form and closes the confirmation modal.
   */
  const confirmClear = () => {
    resetForm(); // Reset form inputs
    setShowClearConfirm(false); // Close the "Clear Form" confirmation modal
  };

  /**
   * Callback for when the user cancels clearing the form.
   * Closes the confirmation modal.
   */
  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  // Predefined roles for the select options
  const roles = [
    {
      id: 1,
      label: "Admin",
      value: "Admin",
      description:
        "Administrators oversee the system’s integrity, user permissions, and settings.",
    },
    {
      id: 2,
      label: "Content Manager",
      value: "ContentManager",
      description:
        "Content Managers upload, edit, and maintain museum records and data.",
    },
    {
      id: 3,
      label: "Reviewer",
      value: "Reviewer",
      description:
        "Reviewers ensure the accuracy and validity of submitted artifacts and documents.",
    },
    {
      id: 4,
      label: "Viewer",
      value: "Viewer",
      description:
        "Viewers have read-only access to the system and cannot make changes.",
    },
  ];

  return (
    <>
      {/* Confirmation Modal for Clearing Inputs */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="dark"
      />

      {/* Confirmation Modal for Sending Invitation */}
      <ConfirmationModal
        isOpen={showSendConfirm}
        onClose={cancelSend}
        onConfirm={confirmSend}
        title="Send Invitation?"
        message="Are you sure you want to send this invitation? This action cannot be undone."
        type="question"
        theme="dark"
      />

      {/* General Information Modal (for success/error messages from API calls) */}
      <PopupModal
        // isOpen={showInfoModal}
        // onClose={() => setShowInfoModal(false)} // Simply close the modal
        // onConfirm={() => setShowInfoModal(false)} // Acts as an OK button to close the modal
        // title={infoModalTitle}
        // message={infoModalMessage}
        // type={infoModalType} // Dynamically set type ('success' or 'error') for appropriate icon/styling
        // theme="dark"

        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        message={infoModalMessage} // Use the state variable here
        buttonText="Ok"
        type={infoModalType}
        theme="dark"
      />

      {/* Modal for prompting user about unsaved changes on navigation */}
      {PromptModal}

      <div className="w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
          {/* Form section */}
          <form className="min-w-fit flex h-full p-2 gap-y-5 gap-x-10" onSubmit={(e) => e.preventDefault()}> {/* Prevent default browser form submission */}
            <div className="w-[40rem] h-fit flex flex-col gap-y-10">
              {/* Form header and description */}
              <div className="w-full h-fit flex flex-col gap-y-2">
                <span className="w-fit text-2xl font-semibold">Form</span>
                <span className="w-[40rem] text-[#9C9C9C] text-lg text-justify">
                  Use this form to invite a new staff member to the{" "}
                  <strong>Museo Bulawan Management Information System</strong>.
                  Invited users will receive a link to complete their account
                  setup by providing their <strong>position</strong>,{" "}
                  <strong>username</strong>, and <strong>password</strong>.
                </span>
              </div>
              <div className="w-[40rem] h-[1px] bg-[#373737] rounded"></div> {/* Separator line */}

              {/* First Name Input */}
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label
                  htmlFor="firstname"
                  className="text-xl w-fit font-semibold"
                >
                  First Name
                </label>
                <input
                  id="firstname"
                  placeholder="Francisco"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => validateField("firstName", firstName)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.firstName ? "border-red-500" : ""
                  }`}
                  disabled={isLoading} // Disable input during API call
                />
                {formErrors.firstName && (
                  <span className="text-red-500 text-sm">
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              {/* Last Name Input */}
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label
                  htmlFor="lastname"
                  className="text-xl w-fit font-semibold"
                >
                  Last Name
                </label>
                <input
                  id="lastname"
                  placeholder="Turko"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => validateField("lastName", lastName)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.lastName ? "border-red-500" : ""
                  }`}
                  disabled={isLoading} // Disable input during API call
                />
                {formErrors.lastName && (
                  <span className="text-red-500 text-sm">
                    {formErrors.lastName}
                  </span>
                )}
              </div>

              {/* Email Input */}
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="email" className="text-xl w-fit font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  placeholder="franciscoturko@gmail.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateField("email", email)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                  disabled={isLoading} // Disable input during API call
                />
                {formErrors.email && (
                  <span className="text-red-500 text-sm">
                    {formErrors.email}
                  </span>
                )}
              </div>

              {/* Contact Number Input */}
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label
                  htmlFor="contact"
                  className="text-xl w-fit font-semibold"
                >
                  Contact
                </label>
                <input
                  id="contact"
                  type="text"
                  placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  onBlur={() => validateField("contact", contact)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.contact ? "border-red-500" : ""
                  }`}
                  disabled={isLoading} // Disable input during API call
                />
                {formErrors.contact && (
                  <span className="text-red-500 text-sm">
                    {formErrors.contact}
                  </span>
                )}
              </div>
            </div>

            {/* Role Selection Section */}
            <div className="space-y-2 w-[40rem] pt-5 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-full h-fit flex flex-col ">
                  <label className="block text-2xl font-semibold mb-1">
                    Select Role
                  </label>
                  <div className="h-5">
                    {formErrors.role && (
                      <span className="text-red-500 text-md">
                        {formErrors.role}
                      </span>
                    )}
                  </div>
                </div>
                {/* Map through roles to create radio buttons and descriptions */}
                {roles.map((role) => (
                  <div key={role.id} className="flex flex-col">
                    <label
                      className={`w-fit cursor-pointer flex items-center text-2xl gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        selected === role.value
                          ? " text-violet-600 font-semibold bg-[#1a1a1a]"
                          : "text-white hover:border-blue-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selected === role.value}
                        onChange={(e) => {
                          setSelected(e.target.value);
                          validateField("role", e.target.value);
                        }}
                        className="form-radio text-violet-600 focus:ring-0 focus:ring-offset-0"
                        disabled={isLoading} // Disable input during API call
                      />
                      {role.label}
                    </label>
                    <div className="w-full pl-10">
                      <p className="text-xl text-gray-400 px-4 pt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="w-full h-fit flex justify-end gap-2">
                <StyledButton
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                  disabled={isLoading} // Disable button during API call
                >
                  Clear Inputs
                </StyledButton>
                <StyledButton
                  onClick={handleSend}
                  buttonColor="bg-violet-600"
                  hoverColor="hover:bg-violet-700"
                  textColor="text-white"
                  disabled={isLoading} // Disable button during API call
                >
                  {isLoading ? (<div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full"></div>) : "Send"} {/* Dynamic button text */}
                </StyledButton>
              </div>
            </div>
          </form>

          <div className="w-full h-full"></div> {/* Placeholder div */}
        </div>
      </div>
    </>
  );
};

export default CreateUsers;
