import { useState, useEffect } from "react";
import StyledButton from "../buttons/StyledButton";
import usePrompt from "../../hooks/usePrompt";
import ConfirmationModal from "../modals/ConfirmationModal";

const CreateUsers = () => {
  // State variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [selected, setSelected] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Validate form on input changes
  useEffect(() => {
    const errors = { ...formErrors };

    // Clear email error when valid email is entered
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && errors.email) {
      delete errors.email;
    }

    // Clear contact error when valid PH number is entered
    if (contact && /^(09|\+639)\d{9}$/.test(contact) && errors.contact) {
      delete errors.contact;
    }

    // Clear firstName error when value exists
    if (firstName && errors.firstName) {
      delete errors.firstName;
    }

    // Clear lastName error when value exists
    if (lastName && errors.lastName) {
      delete errors.lastName;
    }

    // Clear role error when selected
    if (selected && errors.role) {
      delete errors.role;
    }

    setFormErrors(errors);
  }, [firstName, lastName, email, contact, selected]);

  const isDirty =
    firstName !== "" ||
    lastName !== "" ||
    email !== "" ||
    contact !== "" ||
    selected !== "";

  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty
  );

  // Function to clear the form
  const clearInputs = () => {
    if (isDirty) {
      setShowClearConfirm(true);
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setContact("");
    setSelected("");
    setFormErrors({});
  };

  // Function to validate each input field and trigger errors
  const validateField = (name, value) => {
    const errors = { ...formErrors };

    switch (name) {
      case "email":
        if (!value) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;

      case "contact":
        if (!value) {
          errors.contact = "Contact number is required";
        } else if (!/^(09|\+639)\d{9}$/.test(value)) {
          errors.contact =
            "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
        } else {
          delete errors.contact;
        }
        break;

      case "firstName":
        if (!value.trim()) {
          errors.firstName = "First name is required";
        } else {
          delete errors.firstName;
        }
        break;

      case "lastName":
        if (!value.trim()) {
          errors.lastName = "Last name is required";
        } else {
          delete errors.lastName;
        }
        break;

      case "role":
        if (!value) {
          errors.role = "Please select a role";
        } else {
          delete errors.role;
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form validation on submit
  const validateForm = () => {
    const errors = {};

    // Validate first name
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }

    // Validate last name
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    // Validate email
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate contact
    if (!contact) {
      errors.contact = "Contact number is required";
    } else if (!/^(09|\+639)\d{9}$/.test(contact)) {
      errors.contact =
        "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)";
    }

    // Validate role
    if (!selected) {
      errors.role = "Please select a role";
    }

    // Update state once
    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Handle send button click
  const handleSend = () => {
    const isValid = validateForm();
    if (isValid) {
      setShowSendConfirm(true);
    }
  };

  const confirmSend = () => {
    alert("Form submitted successfully!");
    resetForm();
    setShowSendConfirm(false);
  };

  const cancelSend = () => {
    setShowSendConfirm(false);
  };

  const confirmClear = () => {
    resetForm();
    setShowClearConfirm(false);
  };

  const cancelClear = () => {
    setShowClearConfirm(false);
  };

  // Roles for the user selection
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

      {PromptModal}

      <div className="w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
          <form className="min-w-fit flex h-full p-2 gap-y-5 gap-x-10">
            <div className="w-[40rem] h-fit flex flex-col gap-y-10">
              <span className="w-[40rem] text-xl text-justify">
                Use this form to invite a new staff member to the{" "}
                <strong>Museo Bulawan Management Information System</strong>.
                Invited users will receive a link to complete their account
                setup by providing their <strong>position</strong>,{" "}
                <strong>username</strong>, and <strong>password</strong>.
              </span>

              <div className="w-[40rem] h-[1px] bg-[#373737] rounded"></div>

              <div className="flex flex-col w-[40rem] gap-y-4">
                <label
                  htmlFor="firstname"
                  className="text-xl w-fit font-semibold"
                >
                  First Name
                </label>
                <input
                  id="firstname"
                  placeholder="Johnny"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => validateField("firstName", firstName)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.firstName ? "border-red-500" : ""
                  }`}
                />
                {formErrors.firstName && (
                  <span className="text-red-500 text-sm">
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              <div className="flex flex-col w-[40rem] gap-y-4">
                <label
                  htmlFor="lastname"
                  className="text-xl w-fit font-semibold"
                >
                  Last Name
                </label>
                <input
                  id="lastname"
                  placeholder="Sins"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => validateField("lastName", lastName)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.lastName ? "border-red-500" : ""
                  }`}
                />
                {formErrors.lastName && (
                  <span className="text-red-500 text-sm">
                    {formErrors.lastName}
                  </span>
                )}
              </div>

              <div className="flex flex-col w-[40rem] gap-y-4">
                <label htmlFor="email" className="text-xl w-fit font-semibold">
                  Email
                </label>
                <input
                  id="email"
                  placeholder="johnnysins@business.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => validateField("email", email)}
                  className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${
                    formErrors.email ? "border-red-500" : ""
                  }`}
                />
                {formErrors.email && (
                  <span className="text-red-500 text-sm">
                    {formErrors.email}
                  </span>
                )}
              </div>

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
                />
                {formErrors.contact && (
                  <span className="text-red-500 text-sm">
                    {formErrors.contact}
                  </span>
                )}
              </div>
            </div>

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

              <div className="w-full h-fit flex justify-end gap-2">
                <StyledButton
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                >
                  Clear Inputs
                </StyledButton>
                <StyledButton
                  onClick={handleSend}
                  buttonColor="bg-violet-600"
                  hoverColor="hover:bg-violet-700"
                  textColor="text-white"
                >
                  Send
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
