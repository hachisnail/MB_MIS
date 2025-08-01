import { useNavigate } from "react-router-dom";
import bg from "@/assets/Taoist Landscape Painting.jpg";
import Logo from "@/assets/LOGO.png";
import NoMatchIco from "../assets/NoMatchIco.svg"

const NoMatch = () => {
  const navigate = useNavigate();

  const handleGoBack = (e) => {
    e.preventDefault();
    navigate(-1);
  };

  return (
    <div
      className="bg-cover bg-center bg-no-repeat flex items-center h-screen w-screen justify-center"
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
          <div className="flex flex-col w-full items-center  pl-28">
            <span className="text-6xl font-bold mb-5">404</span>
            <span className="text-3xl font-semibold">Are you lost?</span>
            <div className="flex text-xl">
              <span>go back to &nbsp;</span>
              <button
                onClick={handleGoBack}
                className="hover:text-blue-900 text-blue-600 underline cursor-pointer"
              >
                previous page.
              </button>
            </div>
          </div>
          <div className="h-60 flex items-end">
            <img src={NoMatchIco} className="w-60" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoMatch;
