import { useNavigate } from "react-router-dom";
import StyledButton from "@/components/buttons/StyledButton";

const BackButton = ({ disabled = false }) => {
  const navigate = useNavigate();

  const backTo = () => {
    if (!disabled) {
      navigate(-1);
    }
  };

  return (
    <StyledButton
      onClick={backTo}
      disabled={disabled}
      buttonColor="bg-neutral-600"
      hoverColor="hover:bg-gray-700"
      textColor="text-white"
      className="w-fit flex gap-x-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12l10 0" />
        <path d="M4 12l4 4" />
        <path d="M4 12l4 -4" />
        <path d="M20 4l0 16" />
      </svg>
      Return
    </StyledButton>
  );
};

export default BackButton;
