import { useState, useEffect } from "react";
import StyledButton from "../buttons/StyledButton";
import usePrompt from "../../hooks/usePrompt";
import ConfirmationModal from "../modals/ConfirmationModal";
import axiosClient from "../../lib/axiosClient";
import PopupModal from "../modals/PopupModal";
import BackButton from "../buttons/BackButton";

const CreateUsers = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [selected, setSelected] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [infoModalType, setInfoModalType] = useState("info");
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactRegex = /^(09|\+639)\d{9}$/;

  useEffect(() => {
    setFormErrors((prev) => {
      const errors = { ...prev };
      if (email && emailRegex.test(email)) delete errors.email;
      if (contact && contactRegex.test(contact)) delete errors.contact;
      if (firstName.trim()) delete errors.firstName;
      if (lastName.trim()) delete errors.lastName;
      if (selected) delete errors.role;
      return errors;
    });
  }, [firstName, lastName, email, contact, selected]);

  const isDirty = firstName || lastName || email || contact || selected;
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty
  );

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setContact("");
    setSelected("");
    setFormErrors({});
  };

  const clearInputs = () => {
    isDirty ? setShowClearConfirm(true) : resetForm();
  };

  const validateField = (name, value) => {
    setFormErrors((prev) => {
      const errors = { ...prev };
      switch (name) {
        case "email":
          if (!value) errors.email = "Email is required";
          else if (!emailRegex.test(value)) errors.email = "Please enter a valid email address";
          else delete errors.email;
          break;
        case "contact":
          if (!value) errors.contact = "Contact number is required";
          else if (!contactRegex.test(value)) errors.contact = "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
          else delete errors.contact;
          break;
        case "firstName":
          if (!value.trim()) errors.firstName = "First name is required";
          else delete errors.firstName;
          break;
        case "lastName":
          if (!value.trim()) errors.lastName = "Last name is required";
          else delete errors.lastName;
          break;
        case "role":
          if (!value) errors.role = "Please select a role";
          else delete errors.role;
          break;
        default:
          break;
      }
      return errors;
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email) errors.email = "Email is required";
    else if (!emailRegex.test(email)) errors.email = "Please enter a valid email address";
    if (!contact) errors.contact = "Contact number is required";
    else if (!contactRegex.test(contact)) errors.contact = "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
    if (!selected) errors.role = "Please select a role";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSend = () => {
    if (validateForm()) setShowSendConfirm(true);
  };

  const sendInvitationPayload = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/send-invitation", {
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contact,
        role: selected,
      });
      setInfoModalTitle("Success!");
      setInfoModalMessage(response.data.message || "Invitation sent successfully.");
      setInfoModalType("info");
      setShowInfoModal(true);
      resetForm();
    } catch (error) {
      setInfoModalTitle("Error!");
      setInfoModalMessage(error.response?.data?.message || "Failed to send invitation. Please try again.");
      setInfoModalType("warning");
      setShowInfoModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSend = () => {
    setShowSendConfirm(false);
    sendInvitationPayload();
  };
  const cancelSend = () => setShowSendConfirm(false);
  const confirmClear = () => { resetForm(); setShowClearConfirm(false); };
  const cancelClear = () => setShowClearConfirm(false);

  const roles = [
    { id: 1, label: "Admin", value: "Admin", description: "Administrators oversee the system’s integrity, user permissions, and settings." },
    { id: 2, label: "Content Manager", value: "ContentManager", description: "Content Managers upload, edit, and maintain museum records and data." },
    { id: 3, label: "Reviewer", value: "Reviewer", description: "Reviewers ensure the accuracy and validity of submitted artifacts and documents." },
    { id: 4, label: "Viewer", value: "Viewer", description: "Viewers have read-only access to the system and cannot make changes." },
  ];

  return (
    <>
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="dark"
      />
      <ConfirmationModal
        isOpen={showSendConfirm}
        onClose={cancelSend}
        onConfirm={confirmSend}
        title="Send Invitation?"
        message="Are you sure you want to send this invitation? This action cannot be undone."
        type="question"
        theme="dark"
      />
      <PopupModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        message={infoModalMessage}
        buttonText="Ok"
        type={infoModalType}
        theme="dark"
      />
      {PromptModal}
      <div className="w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
          <form className="min-w-fit flex h-full p-2 gap-y-5 gap-x-10" onSubmit={(e) => e.preventDefault()}>
            <div className="w-[40rem] h-fit flex flex-col gap-y-2">
              <div className="w-full h-fit flex flex-col gap-y-2">
                <span className="w-fit text-2xl font-semibold">Form</span>
                <span className="w-[40rem] text-[#9C9C9C] text-lg text-justify">
                  Use this form to invite a new staff member to the <strong>Museo Bulawan Management Information System</strong>.
                  Invited users will receive a link to complete their account setup by providing their <strong>position</strong>, <strong>username</strong>, and <strong>password</strong>.
                </span>
              </div>
              <div className="w-[40rem] my-7 h-[1px] bg-[#373737] rounded"></div>
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="firstname" className="text-xl w-fit font-semibold">First Name</label>
                <div className="w-full h-18 flex flex-col">
                  <input
                    id="firstname"
                    placeholder="Francisco"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => validateField("firstName", firstName)}
                    className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${formErrors.firstName ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {formErrors.firstName && (
                    <span className="text-red-500 text-sm">{formErrors.firstName}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="lastname" className="text-xl w-fit font-semibold">Last Name</label>
                <div className="w-full h-18 flex flex-col">
                  <input
                    id="lastname"
                    placeholder="Turko"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => validateField("lastName", lastName)}
                    className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${formErrors.lastName ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {formErrors.lastName && (
                    <span className="text-red-500 text-sm">{formErrors.lastName}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="email" className="text-xl w-fit font-semibold">Email</label>
                <div className="w-full h-18 flex flex-col">
                  <input
                    id="email"
                    placeholder="franciscoturko@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => validateField("email", email)}
                    className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${formErrors.email ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {formErrors.email && (
                    <span className="text-red-500 text-sm">{formErrors.email}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="contact" className="text-xl w-fit font-semibold">Contact</label>
                <div className="w-full h-18 flex flex-col">
                  <input
                    id="contact"
                    type="text"
                    placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onBlur={() => validateField("contact", contact)}
                    className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${formErrors.contact ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                  {formErrors.contact && (
                    <span className="text-red-500 text-sm">{formErrors.contact}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 w-[40rem] pt-5 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-full h-fit flex flex-col ">
                  <label className="block text-2xl font-semibold mb-1">Select Role</label>
                  <div className="h-5">
                    {formErrors.role && (
                      <span className="text-red-500 text-md">{formErrors.role}</span>
                    )}
                  </div>
                </div>
                {roles.map((role) => (
                  <div key={role.id} className="flex flex-col">
                    <label
                      className={`w-fit cursor-pointer flex items-center text-2xl gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${selected === role.value ? " text-violet-600 font-semibold bg-[#1a1a1a]" : "text-white hover:border-blue-400"}`}
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
                        disabled={isLoading}
                      />
                      {role.label}
                    </label>
                    <div className="w-full pl-10">
                      <p className="text-xl text-gray-400 px-4 pt-1">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full h-fit flex justify-end gap-2">
                <BackButton disabled={isLoading} PromptModal={PromptModal} />
                <StyledButton
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                  disabled={isLoading}
                >
                  Clear Inputs
                </StyledButton>
                <StyledButton
                  onClick={handleSend}
                  buttonColor="bg-violet-600"
                  hoverColor="hover:bg-violet-700"
                  textColor="text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : "Send"}
                </StyledButton>
              </div>
            </div>
          </form>
          <div className="w-full h-full"></div>
        </div>
      </div>
    </>
  );
};

export default CreateUsers;
