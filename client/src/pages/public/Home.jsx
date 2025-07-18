import { NavLink } from "react-router-dom";
import bgImage1 from "@/assets/06-AfternoonMealOfTheWorker 1.png";
import { socialLinks } from "@/components/list/commons";




const Home = () => {


const SocialLink = ({ href, name, iconPath, viewBox }) => (
  
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="[writing-mode:vertical-rl] rotate-180"
  >
    <div className="w-10 h-auto text-white flex items-center text-xl">
      <svg
        className="w-7 rotate-90 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill="currentColor"
      >
        <path d={iconPath} />
      </svg>
      <svg
        className="w-2 rotate-90 mb-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
      >
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
      </svg>
      <span>{name}</span>
    </div>
  </a>
);


  // const learnMore = { current: null };


  return (
    <>
      <div
        className="bg-cover bg-center bg-no-repeat w-screen rounded-sm h-screen pt-40 flex flex-col items-center"
        style={{ backgroundImage: `url(${bgImage1})` }}
      >
        <div className="w-[97vw] h-full min-w-fit flex justify-center">
          {/* Left Column */}
          <div className="min-w-fit w-10 text-white gap-y-30 pb-10 h-full flex flex-col justify-center">
            {socialLinks.filter(link => link.position === "left").map(link => (
              <SocialLink key={link.name} {...link} />
            ))}
          </div>

          {/* Middle Column */}
          <div className="w-full h-full px-25 pt-20">
            <div className="w-fit h-fit flex flex-col ">
              <span className="text-4xl xl:text-5xl w-full font-bold text-[#DAB765] drop-shadow-[3px_3px_0px_black]">
                WELCOME TO
              </span>
              <span className="text-8xl xl:text-9xl font-bold text-white drop-shadow-[3px_3px_0px_black] -mt-3">
                MUSEO <br /> BULAWAN
              </span>
            </div>

            <div className="w-fit h-fit text-2xl flex gap-x-5 my-10 sm:my-20">
              <button
                // onClick={() => learnMore.current?.scrollIntoView({ behavior: 'smooth' })}
                className="w-48 h-16 bg-white hover:outline-1 hover:outline-black flex items-center justify-center font-medium text-black transition duration-300 hover:shadow-lg cursor-pointer outline-1 outline-white"
              >
                Learn More
              </button>
              <NavLink to="/appointment">
                <button className="w-48 h-16 bg-transparent hover:outline-1 hover:outline-black flex items-center justify-center outline-1 outline-white text-2xl font-medium text-white transition duration-300 hover:bg-white hover:text-black cursor-pointer">
                  BOOK A VISIT
                </button>
              </NavLink>
            </div>

            <div className="ml-11 w-fit flex flex-col gap-y-5">
              <div className="text-white flex items-start gap-4">
                <svg className="w-9" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                  <path d="M256 0a256 256 0 1 1 0 512..." />
                </svg>
                <div>
                  <span className="block text-xl font-bold">Museum Hours</span>
                  <span className="text-md font-normal leading-tight">Open Daily 9:00am-5:00pm, Monday-Friday,</span>
                </div>
              </div>

              <div className="text-white flex items-start gap-4">
                <svg className="w-9" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M215.7 499.2C267..." />
                </svg>
                <div>
                  <span className="block text-xl font-bold">Museum Location</span>
                  <span className="text-md font-normal leading-tight">
                    Camarines Norte Provincial Capitol Grounds, Daet Philippines
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="min-w-fit w-10 text-white gap-y-30 pb-10 h-full flex flex-col justify-center">
            {socialLinks.filter(link => link.position === "right").map(link => (
              <SocialLink key={link.name} {...link} />
            ))}
          </div>
        </div>
      </div>

      <section id="gold" className="pt-10 w-full h-screen flex justify-center">
        <span className="text-2xl font-semibold hover:text-gray-600">This is the home page.</span>
      </section>
    </>
  );
};

export default Home;


