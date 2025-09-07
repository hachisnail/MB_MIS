import { useAuth } from "../../../context/authContext";
import StyledButton from "../../../components/buttons/StyledButton";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "../../../features/Utilities";
import LiveSocketBadge from "../../../sandbox/LiveSocketBadge";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const topItems = [
    {
      label: "Total Artifacts",
      value: 0,
      path: { pathname: "/admin/inventory", state: { filter: "artifacts" } },
    },
    {
      label: "Acquired Artifacts",
      value: 0,
      path: { pathname: "/admin/inventory", state: { filter: "acquired" } },
    },
    {
      label: "Borrowed Artifacts",
      value: 0,
      path: { pathname: "/admin/inventory", state: { filter: "borrowing" } },
    },
    {
      label: "Displayed Artifacts",
      value: 0,
      path: { pathname: "/admin/inventory", state: { filter: "displayed" } },
    },
  ];

  const walkIn = [
    { label: "Appointment", path: "/admin/appointment/walk-ins/" },
    { label: "Donation", path: "/admin/dashboard" },
  ];

  return (
    <div className="w-full flex flex-col gap-y-10 pt-15 h-full overflow-scroll">
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
                  className={`w-[18rem] h-[15rem] rounded-[4rem] shadow-md  border-t border-gray-300  stroke-black shadow-gray-600 flex gap-x-[1rem] py-[1.5rem] pl-[1.5rem] ${
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
                    onClick={() =>
                      navigate(path.pathname, { state: path.state })
                    }
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
          <div className="w-full h-[14rem] flex gap-x-10 items-center justify-center">
            {/* mid container 1/4 */}

            <div className="rounded-[4rem] px-[2rem] w-[38rem] h-[13rem] shadow-gray-600 shadow-md items-center justify-between flex border-t border-gray-300">
                <span className="ml-7 text-6xl font-hind font-semibold">Walk-Ins</span>
              <div className="w-fit h-fit flex flex-col items-end rounded-[2rem] gap-y-5">
                {walkIn.map(({ label, path }, idx)=> {

                  return(
                    <button
                    onClick={()=> navigate(`/admin/appointment/walk-ins/`)}
                    key={idx} className={`${label === "Appointment" ? "bg-[#332613] text-white " : " border-2 border-[#332613]"} px-5 cursor-pointer flex items-center w-57 h-16 rounded-[4rem] justify-between`}>
                    <span className="text-xl font-semibold">{label}</span>


                    <svg width="19" height="19" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.79199 12.0415H9.20866V9.20817H12.042V7.7915H9.20866V4.95817H7.79199V7.7915H4.95866V9.20817H7.79199V12.0415ZM8.50033 15.5832C7.52046 15.5832 6.59963 15.4002 5.73783 15.0342C4.87602 14.6564 4.12637 14.1488 3.48887 13.5113C2.85137 12.8738 2.34373 12.1241 1.96595 11.2623C1.59998 10.4005 1.41699 9.4797 1.41699 8.49984C1.41699 7.51998 1.59998 6.59914 1.96595 5.73734C2.34373 4.87553 2.85137 4.12588 3.48887 3.48838C4.12637 2.85088 4.87602 2.34914 5.73783 1.98317C6.59963 1.60539 7.52046 1.4165 8.50033 1.4165C9.48019 1.4165 10.401 1.60539 11.2628 1.98317C12.1246 2.34914 12.8743 2.85088 13.5118 3.48838C14.1493 4.12588 14.651 4.87553 15.017 5.73734C15.3948 6.59914 15.5837 7.51998 15.5837 8.49984C15.5837 9.4797 15.3948 10.4005 15.017 11.2623C14.651 12.1241 14.1493 12.8738 13.5118 13.5113C12.8743 14.1488 12.1246 14.6564 11.2628 15.0342C10.401 15.4002 9.48019 15.5832 8.50033 15.5832ZM8.50033 14.1665C10.0823 14.1665 11.4222 13.6175 12.5201 12.5196C13.618 11.4217 14.167 10.0818 14.167 8.49984C14.167 6.91789 13.618 5.57796 12.5201 4.48005C11.4222 3.38213 10.0823 2.83317 8.50033 2.83317C6.91838 2.83317 5.57845 3.38213 4.48053 4.48005C3.38262 5.57796 2.83366 6.91789 2.83366 8.49984C2.83366 10.0818 3.38262 11.4217 4.48053 12.5196C5.57845 13.6175 6.91838 14.1665 8.50033 14.1665Z" fill="currentColor"/>
                    </svg>

                    </button>
                  )
                })}

              </div>
            </div>

            <div className="flex justify-center items-center rounded-[4rem] w-[38rem] h-[13rem] shadow-gray-600 shadow-md bg-gradient-to-b from-[#251B0E] to-[#523d1f] text-white stroke-white">

              <span>to be filled</span>
            </div>
          </div>
          <div className="w-full h-[30rem] gap-x-10 flex items-center justify-center">
            {/* bottom container 1/2 */}
            <div className="flex justify-center items-center w-[18rem] h-[29rem] rounded-[4rem] shadow-gray-600 shadow-md bg-gradient-to-b from-[#251B0E] to-[#523d1f] text-white stroke-white">
              <span>to be filled</span>

            </div>
            <div className="flex justify-center items-center w-[28rem] h-[29rem] rounded-[4rem] shadow-gray-600 shadow-md border-t border-gray-300">
              <span>to be filled</span>

            </div>
            <div className=" flex flex-col justify-center items-center w-[28rem] h-[29rem] rounded-[4rem] shadow-gray-600 shadow-md border-t border-gray-300">
              <span>Active Clients</span>
<LiveSocketBadge />
            </div>



          </div>
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
