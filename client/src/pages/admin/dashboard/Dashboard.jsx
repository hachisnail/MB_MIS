import { useAuth } from "../../../context/authContext";
import StyledButton from "../../../components/buttons/StyledButton";
import { NavLink } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className="w-full flex flex-col gap-y-2 pt-15 h-full overflow-scroll">
      <span className="text-4xl font-semibold">Welcome {user.fname}!</span>
      <NavLink to="/admin/sandbox" className="w-fit">
        <StyledButton className="w-fit">Open sandbox</StyledButton>
      </NavLink>


      
    </div>
  );
};

export default Dashboard;
