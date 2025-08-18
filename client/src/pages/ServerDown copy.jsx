import Logo from "@/assets/LOGO.png";
import bg from "@/assets/Image-1-1.jpg";
import ServerDownIco from "../assets/ServerDown.svg"

const ServerDown = () => {
  return (
    <div
      className="bg-cover bg-center bg-no-repeat w-screen h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="flex w-[40rem] text-black items-center flex-col gap-y-20 p-10 rounded-xl  bg-white opacity-75 shadow-black  shadow-xl">
        <div className="w-full">
          <div className="flex gap-x-2 items-center">
            <img src={Logo} className="w-20" alt="Museo Bulawan Logo" />
            <i className="w-1 h-16 rounded-4xl bg-black"></i>
            <div className="flex flex-col justify-center">
              <span className="text-4xl font-bold ">Museo Bulawan</span>
              <span className="text-lg text-gray-700 font-semibold leading-3">
                Management Information System
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-start ">
          <div className="flex flex-col w-full items-center  pl-20">
            <span className="text-6xl font-bold mb-5">500</span>
            <span className="text-3xl font-semibold">Server Down</span>
            <div className="flex text-xl">
              <span>Contact Server Administrators&nbsp;</span>

            </div>
          </div>
          <div className="h-60 flex items-end">
            <img src={ServerDownIco} className="w-25" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerDown;
