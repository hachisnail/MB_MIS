import { useAuth } from "../../../context/authContext";
import StyledButton from "../../../components/buttons/StyledButton";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../../features/Utilities";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const topItems = [
  { label: "Total Artifacts", value: 0, path: { pathname: "/admin/inventory", state: { filter: "artifacts" } } },
  { label: "Acquired Artifacts", value: 0, path: { pathname: "/admin/inventory", state: { filter: "acquired" } } },
  { label: "Borrowed Artifacts", value: 0, path: { pathname: "/admin/inventory", state: { filter: "borrowing" } } },
  { label: "Displayed Artifacts", value: 0, path: { pathname: "/admin/inventory", state: { filter: "displayed" } } },

  ];


  return (
    <div className="w-full flex flex-col gap-y-10 pt-7 h-full overflow-scroll">
      <div className="flex justify-between">
        <span className="text-5xl font-bold font-hind">
          Welcome {user.username}!
        </span>
        <SearchBar />
      </div>

      <div className="w-full h-full flex gap-x-10">
        <div className=" min-w-[80rem] h-full gap-y-10 flex flex-col">
          <div className="w-full h-[16rem] flex gap-x-10 justify-center items-center">
            {/* top container 1/4 */}
            {topItems.map(({ label, value, path }) => {
              return (
                <div
                  key={label}
                  className={`w-[18rem] h-[15rem] rounded-[4rem] shadow-md   stroke-black shadow-gray-600 flex gap-x-[1rem] py-[1.5rem] pl-[1.5rem] ${
                    label === "Total Artifacts" &&
                    "bg-gradient-to-b from-[#251B0E] to-[#523d1f] text-white stroke-white"
                  }`}
                >
                  <div className="w-[11rem] h-full flex flex-col pt-4">
                    <span className="text-xl font-semibold w-fit">{label}</span>
                    <span className="ml-4 text-8xl w-fit">{value}</span>
                  </div>
                  <button
                    className="w-fit h-fit cursor-pointer"
                     onClick={() => navigate(path.pathname, { state: path.state })}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                      <path d="M15 9l-6 6" />
                      <path d="M15 15v-6h-6" />
                    </svg>
                  </button>
                </div>
              );
            })}

          </div>
          <div className="w-full h-[16rem]">
            {/* mid container 1/4 */}
            
            
            
            </div>
          <div className="w-full h-[30rem]">{/* bottom container 1/2 */}</div>
        </div>
        <div className="w-full h-full"></div>
      </div>

      {/* <NavLink to="/admin/sandbox" className="w-fit">
        <StyledButton className="w-fit">Open sandbox</StyledButton>
      </NavLink> */}
    </div>
  );
};

export default Dashboard;
