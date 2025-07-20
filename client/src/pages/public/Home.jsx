import { NavLink } from "react-router-dom";
import bgImage1 from "@/assets/06-AfternoonMealOfTheWorker 1.png";
import block1 from "@/assets/block1.png";
import block2 from "@/assets/block2.png";
import { scrollToElementById } from "@/components/list/commons";

import { socialLinks } from "../../components/list/commons";

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
            {socialLinks
              .filter((link) => link.position === "left")
              .map((link) => (
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
                onClick={(e) => {
                  scrollToElementById("learn_more", 0);
                }}
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
                <svg
                  className="w-9"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                </svg>
                <div>
                  <span className="block text-xl font-bold">Museum Hours</span>
                  <span className="text-md font-normal leading-tight">
                    Open Daily 9:00am-5:00pm, Monday-Friday,
                  </span>
                </div>
              </div>

              <div className="text-white flex items-start gap-4">
                <svg
                  className="w-9"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  fill="currentColor"
                >
                  <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
                </svg>
                <div>
                  <span className="block text-xl font-bold">
                    Museum Location
                  </span>
                  <span className="text-md font-normal leading-tight">
                    Camarines Norte Provincial Capitol Grounds, Daet Philippines
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="min-w-fit w-10 text-white gap-y-30 pb-10 h-full flex flex-col justify-center">
            {socialLinks
              .filter((link) => link.position === "right")
              .map((link) => (
                <SocialLink key={link.name} {...link} />
              ))}
          </div>
        </div>
      </div>

      <section
        id="learn_more"
        className="pt-15 w-full bg-white min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <div className="flex w-full justify-start ">
          <button
            onClick={(e) => {
              scrollToElementById("main-navbar-top", 50);
            }}
            className="items-center text-2xl flex text-gray-600 hover:italic font-semibold rounded cursor-pointer hover:text-gray-900 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12l10 0" />
              <path d="M4 12l4 4" />
              <path d="M4 12l4 -4" />
              <path d="M20 4l0 16" />
            </svg>
            Home
          </button>
        </div>
        {/* <span className="text-2xl text-white font-semibold hover:text-gray-600">
          Learn more.
        </span> */}
        <div className="w-full xl:justify-between min-h-[85vh] gap-y-20 xl:gap-y-0 h-auto flex xl:flex-row flex-col items-center overflow-hidden">
          <div className="w-fit flex flex-col justify-center pl-20 min-w-fit h-full">
            <span className="w-[50rem] text-5xl font-hina text-justify">
              <span className="text-7xl text-[#EFBF04] ">Museo Bulawan</span>
              <span className="text-[#44C300]">,</span> known as the “Golden
              Museum,” is the leading and the most viewer-friendly community
              museum that serves as the nerve center for education and
              communication of the rich cultural, artistic and natural heritage
              and history of Camarines Norte, the ultimate medium for
              preservation, exhibition of significant objects that strengthen
              the values of the people and deepen their patriotism and sense of
              identity.
            </span>

            <NavLink
              className="mt-15 flex items-center w-fit gap-x-5 text-gray-600 hover:text-gray-800 stroke-gray-600"
              to="/about"
            >
              <svg
                width="30"
                height="1"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <rect width="30" height="1" />
              </svg>
              <span className="text-2xl  font-extralight ">
                About Museo Bulawan
              </span>
            </NavLink>
          </div>
          <div className="h-[50rem] w-fit relative">
            <img src={block1} alt="" className="z-25 min-w-fit h-[50rem]" />
            <div className="absolute top-25 h-[43.5rem] w-[67.5rem] p-15 right-0 z-50">
              {/* <span>this text should be manually aligned</span>
               */}
              <div
                // import dynamic picture as background image
                style={{ backgroundImage: `url(${bgImage1})` }}
                className="w-full h-full bg-cover bg-center bg-no-repeat "
              ></div>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-end ">
          <button
            onClick={(e) => {
              scrollToElementById("whats_on", 0);
            }}
            className="items-center text-2xl flex text-gray-600 hover:italic font-semibold rounded cursor-pointer hover:text-gray-900 transition"
          >
            Whats On?
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12l-10 0" />
              <path d="M20 12l-4 4" />
              <path d="M20 12l-4 -4" />
              <path d="M4 4l0 16" />
            </svg>
          </button>
        </div>
      </section>

      <section
        id="whats_on"
        className="pt-15 w-full bg-white min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <div className="flex w-full justify-start ">
          <button
            onClick={(e) => {
              scrollToElementById("learn_more", 0);
            }}
            className="items-center text-2xl flex text-gray-600 hover:italic font-semibold rounded cursor-pointer hover:text-gray-900 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12l10 0" />
              <path d="M4 12l4 4" />
              <path d="M4 12l4 -4" />
              <path d="M20 4l0 16" />
            </svg>
            Learn More
          </button>
        </div>

        <div className="w-full xl:justify-between min-h-[85vh] gap-y-20 xl:gap-y-0 xl:gap-x-10 h-auto flex xl:flex-row flex-col items-center overflow-hidden ">
          {/* calendar component */}
          <div className="h-fit min-w-fit w-fit relative">
            <img src={block2} alt="" className="h-[70rem] w-[85rem]" />
            <div className="absolute min-w-fit flex flex-col items-end justify-between top-20 h-[55rem] pr-20 w-[75rem] right-0 z-50">
              <div className="w-full h-fit">
                <span className="text-7xl font-hina">April</span>
              </div>

              <div className="w-full h-[45rem] bg-black rounded-md p-5 flex items-center justify-center">

                <span className="text-white">Calendar componenet</span>
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between py-10 flex-col min-h-[85vh] h-auto">
            <div className="w-fit min-h-fit flex items-end">
              <div className="hidden sm:flex w-1 h-full  flex-col">
                <div className="relative right-[45rem] -top-3 w-[45rem] h-9 flex flex-col items-end justify-between overflow-hidden">
                  <div className="w-full h-3 bg-black"></div>
                  <div className="w-[35rem] h-3 bg-black"></div>
                </div>
              </div>
              <span className="text-8xl font-hina">Whats On?</span>
            </div>

            <div className="w-[45rem] rounded-sm h-[29rem] bg-black flex items-center justify-center">
              <span className="text-white">image 1</span>
            </div>

            <div className="w-[45rem] rounded-sm h-[29rem] bg-black flex items-center justify-center">
              <span className="text-white">image 2</span>

            </div>


          </div>
        </div>

        <div className="flex w-full justify-end ">
          <button
            onClick={(e) => {
              scrollToElementById("news_events", 0);
            }}
            className="items-center text-2xl flex text-gray-600 hover:italic font-semibold rounded cursor-pointer hover:text-gray-900 transition"
          >
            News & Events
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12l-10 0" />
              <path d="M20 12l-4 4" />
              <path d="M20 12l-4 -4" />
              <path d="M4 4l0 16" />
            </svg>
          </button>
        </div>
      </section>

      <section
        id="news_events"
        className="pt-15 w-full h-screen flex justify-center"
      >
        <span className="text-2xl text-white font-semibold hover:text-gray-600">
          News & Events
        </span>
      </section>
      <section
        id="support"
        className="pt-15 w-full h-screen flex justify-center"
      >
        <span className="text-2xl text-white font-semibold hover:text-gray-600">
          Support
        </span>
      </section>
    </>
  );
};

export default Home;
