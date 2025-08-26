import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import StyledButton from "@/components/buttons/StyledButton";
import usePrompt from "@/hooks/usePrompt";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import axiosClient from "@/lib/axiosClient";
import PopupModal from "@/components/modals/PopupModal";
import BackButton from "@/components/buttons/BackButton";
import { FormField } from "@/features/FormUtilities";

// ✅ Yup schema
const schema = yup.object().shape({
  firstName: yup.string().trim().required("First name is required"),
  lastName: yup.string().trim().required("Last name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  contact: yup
    .string()
    .required("Contact number is required")
    .matches(
      /^(09|\+639)\d{9}$/,
      "Please enter a valid PH number (09XXXXXXXXX or +639XXXXXXXXX)"
    ),
  role: yup.string().required("Please select a role"),
});

const CreateUsers = () => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalMessage, setInfoModalMessage] = useState("");
  const [infoModalType, setInfoModalType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      contact: "",
      role: "",
    },
  });

  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty
  );

  const clearInputs = () => {
    isDirty ? setShowClearConfirm(true) : reset();
  };

  const sendInvitationPayload = async (data) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/send-invitation", {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        contact_number: data.contact,
        role: data.role,
      });

      setInfoModalTitle("Success!");
      setInfoModalMessage(
        response.data.message || "Invitation sent successfully."
      );
      setInfoModalType("info");
      setShowInfoModal(true);
      reset();
    } catch (error) {
      setInfoModalTitle("Error!");
      setInfoModalMessage(
        error.response?.data?.message ||
          "Failed to send invitation. Please try again."
      );
      setInfoModalType("warning");
      setShowInfoModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSend = (data) => {
    setShowSendConfirm(false);
    sendInvitationPayload(data);
  };

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
      {/* Modals */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          reset();
          setShowClearConfirm(false);
        }}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="dark"
      />
      <ConfirmationModal
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={() => handleSubmit(confirmSend)()}
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

      {/* Form */}
      <div className="w-full h-full flex flex-col 1xl:h-[62rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem]">
        <div className="w-full h-full overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
          <form
            className="min-w-fit flex flex-col lg:flex-row h-full gap-y-5 gap-x-10"
            onSubmit={handleSubmit(() => setShowSendConfirm(true))}
          >
            {/* Left Column */}
            <div className="w-[40rem] p-1 h-fit flex flex-col gap-y-2 ">
              <span className="w-fit text-2xl font-semibold">Form</span>
              <span className="w-[40rem] text-[#9C9C9C] text-lg text-justify">
                Use this form to invite a new staff member to the{" "}
                <strong>Museo Bulawan Management Information System</strong>.
              </span>
              <div className="w-[40rem] my-7 h-[1px] bg-[#373737] rounded"></div>

              <FormField
                id="firstname"
                label="First Name"
                placeholder="Francisco"
                register={register("firstName")}
                error={errors.firstName}
                disabled={isLoading}
              />

              <FormField
                id="lastname"
                label="Last Name"
                placeholder="Turko"
                register={register("lastName")}
                error={errors.lastName}
                disabled={isLoading}
              />

              <FormField
                id="email"
                label="Email"
                placeholder="franciscoturko@gmail.com"
                type="email"
                register={register("email")}
                error={errors.email}
                disabled={isLoading}
              />

              <FormField
                id="contact"
                label="Contact"
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                register={register("contact")}
                error={errors.contact}
                disabled={isLoading}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-2 w-[40rem] pt-5 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <label className="block text-2xl font-semibold mb-1">
                  Select Role
                </label>
                <div className="h-5">
                  {errors.role && (
                    <span className="text-red-500 text-md">
                      {errors.role.message}
                    </span>
                  )}
                </div>
                {roles.map((role) => (
                  <div key={role.id} className="flex flex-col">
                    <label
                      className={`w-fit cursor-pointer flex items-center text-2xl gap-2 px-4 py-2 rounded-lg ${
                        watch("role") === role.value
                          ? "text-violet-600 font-semibold bg-[#1a1a1a]"
                          : "text-white hover:border-blue-400"
                      }`}
                    >
                      <input
                        type="radio"
                        value={role.value}
                        disabled={isLoading}
                        {...register("role")}
                        className="form-radio text-violet-600 focus:ring-0 focus:ring-offset-0"
                      />
                      {role.label}
                    </label>
                    <p className="text-xl text-gray-400 pl-10">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="w-full flex justify-end gap-2">
                <BackButton disabled={isLoading} PromptModal={PromptModal} />
                <StyledButton
                  type="button"
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                  disabled={isLoading}
                >
                  Clear Inputs
                </StyledButton>
                <StyledButton
                  type="submit"
                  buttonColor="bg-violet-600"
                  hoverColor="hover:bg-violet-700"
                  textColor="text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    "Send"
                  )}
                </StyledButton>
              </div>
            </div>


          </form>
        </div>
      </div>
    </>
  );
};

export default CreateUsers;
