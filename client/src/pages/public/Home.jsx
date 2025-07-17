import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import bgImage1 from "../../assets/06-AfternoonMealOfTheWorker 1.png";

const Home = () => {
  return (
    <>
      <div
        className="bg-cover bg-center bg-no-repeat w-screen rounded-sm h-screen pt-40 flex flex-col items-center"
        style={{ backgroundImage: `url(${bgImage1})` }}
      >
        <div className="w-[97vw] h-full min-w-fit flex justify-center">
          <div className="min-w-fit w-10 text-white gap-y-30 pb-10 h-full flex flex-col justify-center">
            {/* left col */}

            <a
              href="https://www.facebook.com/museobulawancn"
              target="_blank"
              rel="noopener noreferrer"
              className="[writing-mode:vertical-rl] rotate-180"
            >
              <div className="w-10 h-auto  text-white flex items-center text-xl  ">
                <svg
                  className="w-7 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                  fill="currentColor"
                >
                  <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64h98.2V334.2H109.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H255V480H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z" />
                </svg>

                <svg
                  className="w-2 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                </svg>
                <span>Museo Bulawan</span>
              </div>
            </a>

            <a
              href="https://www.instagram.com/museobulawanofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="[writing-mode:vertical-rl] rotate-180"
            >
              <div className="w-10 h-auto  text-white flex items-center text-xl   ">
                <svg
                  className="w-7 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                  fill="currentColor"
                >
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                </svg>

                <svg
                  className="w-2 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                </svg>
                <span>museobulawanofficial</span>
              </div>
            </a>
          </div>
          <div className="w-full h-full px-25 pt-20">
            {/* middle col  */}

            <div className="w-fit h-fit flex flex-col ">
              <span className="text-4xl xl:text-5xl w-full font-bold text-[#DAB765]  drop-shadow-[3px_3px_0px_black] ">
                WELCOME TO
              </span>

              <span className="text-8xl xl:text-9xl font-bold text-white drop-shadow-[3px_3px_0px_black] -mt-3">
                MUSEO
                <br />
                BULAWAN
              </span>
            </div>

              <div className="w-fit h-fit text-2xl flex gap-x-5 my-10 sm:my-20">
              <button
                onClick={() =>
                  learnMore.current?.scrollIntoView({ behavior: 'smooth' })
                }
                className="w-48 h-16 hover:outline-1 hover:outline-black bg-white flex items-center justify-center font-medium text-black transition duration-300 hover:shadow-lg cursor-pointer outline-1 outline-white"
              >
                Learn More
              </button>

              <NavLink to="/appointment">
                <button className="w-48 h-16 hover:outline-1 hover:outline-black bg-transparent flex items-center justify-center outline-1 outline-white text-2xl font-medium text-white transition duration-300 hover:bg-white hover:text-black cursor-pointer">
                  BOOK A VISIT
                </button>
              </NavLink>
            </div>
            
            <div className="ml-11 w-fit flex flex-col gap-y-5">
              <div className="w-fit h-auto text-white flex items-start gap-4">
                <svg 
                className="w-9"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 512 512"
                fill="currentColor">
                <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/>
                </svg>

                <div>
                  <span className="block text-xl font-bold">Museum Hours</span>
                  <span className="text-md font-normal leading-tight">
                    Open Daily 9:00am-5:00pm, Monday-Friday,
                  </span>
                </div>
              </div>
              


    

              
              <div className="w-fit h-auto text-white flex items-start gap-4">
              <svg 
                className="w-9"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 384 512"
                fill="currentColor">


                <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
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



          <div className="min-w-fit w-10 text-white gap-y-30 pb-10 h-full flex flex-col justify-center">
            {/* right col */}

            <a
              href="https://www.tiktok.com/@museobulawan"
              target="_blank"
              rel="noopener noreferrer"
              className="[writing-mode:vertical-rl] rotate-180"
            >
              <div className="w-10 h-auto  text-white flex items-center text-xl  ">
                <svg
                  className="w-7 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                  fill="currentColor"
                >
                  <path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z" />
                </svg>

                <svg
                  className="w-2 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                </svg>
                <span>museobulawan</span>
              </div>
            </a>

            <a
              href="https://www.youtube.com/@museobulawanofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="[writing-mode:vertical-rl] rotate-180"
            >
              <div className="w-10 h-auto  text-white flex items-center text-xl   ">
                <svg
                  className="w-7 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                  fill="currentColor"
                >
                  <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
                </svg>

                <svg
                  className="w-2 rotate-90 mb-2 "
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z" />
                </svg>
                <span>Museo Bulawan (Abel C. Icatlo)</span>
              </div>
            </a>
          </div>
        </div>
      </div>
      <div id="gold" className="pt-10 w-full h-screen flex justify-center">
        <span className="text-2xl font-semibold hover:text-gray-600">
          This is the home page.
        </span>
      </div>
    </>
  );
};

export default Home;
