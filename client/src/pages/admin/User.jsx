import TooltipButton from "../../components/buttons/TooltipButton";

const User = () => {
  return (
    <div className="w-full h-full p-5 flex flex-col 1xl:h-[69rem] 2xl:max-h-[81rem] 3xl:max-h-[88rem] ">
      <div className="w-full min-h-[33rem] overflow-y-scroll flex-col xl:flex-row py-5 items-center flex border-t-1 border-[#373737]">
        <div className="p-1 w-full xl:min-w-[60rem] h-full max-h-[38rem] flex flex-col">
          {/* Upper Left panel */}
          <span className="w-fit text-2xl font-semibold">Users</span>
          <span className="w-70 text-lg text-[#9C9C9C]">
            Manage system users by assigning roles, updating account details,
            and controlling access levels.
          </span>
          <TooltipButton
            buttonText="Invite People"
            tooltipText="Click to invite new users to the system."
            buttonColor="bg-[#6F3FFF]"
            hoverColor="hover:bg-violet-700"
            textColor="text-white"
            tooltipColor="bg-violet-800 text-white"
            className="w-fit mt-5"
            onClick={() => setInfoPopupOpen(true)}


          />

        </div>

        <div className="w-full h-full max-h-[38rem] bg-[#1C1B19] border-[#373737] border-1 rounded-md">
          {/* Upper right panel */}
        </div>
      </div>
      <div className="w-full min-h-[32rem] py-5 overflow-y-scroll flex-col xl:flex-row border-t-1 items-center border-[#373737] flex">
        <div className="w-full xl:min-w-[60rem] h-full flex flex-col max-h-[35rem]">
          {/* Upper Left panel */}
          <span className="w-fit text-2xl font-semibold">Users</span>
          <span className="w-70 text-lg text-[#9C9C9C]">
            Manage system users by assigning roles, updating account details,
            and controlling access levels.
          </span>



        </div>
        <div className="w-full max-h-[35rem] h-full bg-[#1C1B19] border-[#373737] border-1 rounded-md"></div>
      </div>
    </div>
  );
};

export default User;
