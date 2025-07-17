import Logo from "../assets/LOGO.png";
import bg from '../assets/Taoist Landscape Painting.jpg';

const ServerDown = () => {
  return (
    <div className="bg-cover bg-center bg-no-repeat w-screen h-screen flex items-center justify-center" style={{ backgroundImage: `url(${bg})`}}>
      <div className="w-fit h-fit flex flex-col items-center gap-y-10 px-10 pt-10 pb-25 bg-white rounded-xl shadow-2xl">
        <div className="flex gap-x-2 items-center">
          <img src={Logo} className="w-20" alt="Museo Bulawan Logo" />
          <i className="w-1 h-16 rounded-4xl bg-gray-600"></i>
          <div className="flex flex-col justify-center">
            <span className="text-4xl font-bold">Museo Bulawan</span>
            <span className="text-lg text-gray-600 font-semibold leading-3">
              Management Information System
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center">
            <span className="w-fit text-4xl font-semibold">
            Server down or Flags not set!
            </span>
            <span className="w-fit text-xl text-gray-500">
            Please contact server administrators immediately.
            </span>
        </div>
      </div>
    </div>
  );
};

export default ServerDown;
