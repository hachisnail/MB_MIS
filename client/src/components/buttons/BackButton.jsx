import { useNavigate } from "react-router-dom";
import StyledButton from "./StyledButton";

const BackButton = () => {
  const navigate = useNavigate();

  const backTo = () => {
    navigate(-1);
  };
  return (
    <StyledButton
      onClick={backTo}
      buttonColor="bg-gray-600"
      hoverColor="hover:bg-gray-700"
      textColor="text-white"
      className="w-fit"
    >Go back</StyledButton>
  );
};

export default BackButton;
