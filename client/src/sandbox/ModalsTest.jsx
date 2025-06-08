import React, { useState } from "react";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import PopupModal from "../components/modals/PopupModal";
import TooltipButton from "../components/buttons/TooltipButton";
import ContextMenu from "../components/modals/ContextMenu";
import StyledButton from "../components/buttons/StyledButton";

export const ModalsTest = () => {
  // State for Popup Modals
  const [isInfoPopupOpen, setInfoPopupOpen] = useState(false);
  const [isWarningPopupOpen, setWarningPopupOpen] = useState(false);
  const [isDangerPopupOpen, setDangerPopupOpen] = useState(false);

  // State for Confirmation Modals
  const [isQuestionConfirmOpen, setQuestionConfirmOpen] = useState(false);
  const [isDangerConfirmOpen, setDangerConfirmOpen] = useState(false);
  const [isWarningConfirmOpen, setWarningConfirmOpen] = useState(false);

  const menuItems = [
    { label: "Edit", onClick: () => alert("Edit clicked") },
    {
      label: "Delete",
      onClick: () => alert("Delete clicked"),
      disabled: false,
    },
    { label: "Disabled Option", onClick: () => {}, disabled: true },
  ];

  const handleConfirm = (type) => {
    alert(`Confirmed ${type}!`);
    // Close corresponding confirmation modal
    if (type === "question") setQuestionConfirmOpen(false);
    else if (type === "danger") setDangerConfirmOpen(false);
    else if (type === "warning") setWarningConfirmOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 p-6">
      <h1 className="text-3xl font-semibold mb-4">
        Modal and Tooltip Buttons Demo
      </h1>

      {/* Popup Modals Section */}
      <section>
        <h2 className="text-xl font-medium mb-2">Popup Modals</h2>
        <div className="flex gap-4 flex-wrap">
          <TooltipButton
            buttonText="Open Info Popup"
            tooltipText="Click to open info popup modal"
            className="w-fit"
            onClick={() => setInfoPopupOpen(true)}
          />
          <TooltipButton
            buttonText="Open Warning Popup"
            tooltipText="Click to open warning popup modal"
            className="w-fit"
            onClick={() => setWarningPopupOpen(true)}
          />
          <TooltipButton
            buttonText="Open Danger Popup"
            tooltipText="Click to open danger popup modal"
            className="w-fit"
            onClick={() => setDangerPopupOpen(true)}
          />
        </div>

        {/* Popup Modals */}
        <PopupModal
          isOpen={isInfoPopupOpen}
          onClose={() => setInfoPopupOpen(false)}
          title="Info Popup"
          message="This is an info popup modal."
          buttonText="Close"
          type="info"
        />
        <PopupModal
          isOpen={isWarningPopupOpen}
          onClose={() => setWarningPopupOpen(false)}
          title="Warning Popup"
          message="This is a warning popup modal."
          buttonText="Close"
          type="warning"
        />
        <PopupModal
          isOpen={isDangerPopupOpen}
          onClose={() => setDangerPopupOpen(false)}
          title="Danger Popup"
          message="This is a danger popup modal."
          buttonText="Close"
          type="danger"
        />
      </section>

      {/* Confirmation Modals Section */}
      <section>
        <h2 className="text-xl font-medium mb-2">Confirmation Modals</h2>
        <div className="flex gap-4 flex-wrap">
          <TooltipButton
            buttonText="Open Question Confirmation"
            tooltipText="Click to open question confirmation modal"
            className="w-fit"
            onClick={() => setQuestionConfirmOpen(true)}
          />
          <TooltipButton
            buttonText="Open Danger Confirmation"
            tooltipText="Click to open danger confirmation modal"
            className="w-fit"
            onClick={() => setDangerConfirmOpen(true)}
          />
          <TooltipButton
            buttonText="Open Warning Confirmation"
            tooltipText="Click to open warning confirmation modal"
            className="w-fit"
            onClick={() => setWarningConfirmOpen(true)}
          />
        </div>

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={isQuestionConfirmOpen}
          onClose={() => setQuestionConfirmOpen(false)}
          onConfirm={() => handleConfirm("question")}
          title="Are you sure?"
          message="Do you want to proceed with this action?"
          type="question"
        />
        <ConfirmationModal
          isOpen={isDangerConfirmOpen}
          onClose={() => setDangerConfirmOpen(false)}
          onConfirm={() => handleConfirm("danger")}
          title="Dangerous Action!"
          message="This action is irreversible. Confirm carefully."
          type="danger"
        />
        <ConfirmationModal
          isOpen={isWarningConfirmOpen}
          onClose={() => setWarningConfirmOpen(false)}
          onConfirm={() => handleConfirm("warning")}
          title="Warning!"
          message="Please be aware of the consequences before confirming."
          type="warning"
        />
      </section>


    {/* sample styled button with extended classname for tailwind further styling */}
     <StyledButton onClick={() => alert("Clicked!")} className="w-fit">
        click me!
      </StyledButton>


      <ContextMenu menuItems={menuItems}>
        <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Right-click anywhere in this box</p>
        </div>
      </ContextMenu>
    </div>
  );
};

export default ModalsTest;
