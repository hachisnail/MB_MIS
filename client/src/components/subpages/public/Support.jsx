import { NavLink } from "react-router-dom";
import { ScrollRestoration } from "react-router-dom";
import backgroundImage from "@/assets/FERNANDO CUETO AMORSOLO, Girl with Jar.svg";

const Support = () => {
  return (
    <>
      <div className="bg-cover bg-center bg-no-repeat w-screen rounded-sm min-h-fit h-screen pt-40 flex flex-col items-center">
        <div className="max-w-[140rem] 3xl:max-w-[180rem] mx-auto min-h-[89%] flex flex-col sm:flex-row items-center gap-y-5 justify-center sm:p-20  sm:gap-x-20">
          <div className="w-full h-full flex flex-col justify-center sm:gap-y-10 gap-y-5">
            <div className="w-full min-h-fit px-5 sm:px-0">
              <span className="sm:text-6xl text-2xl  font-bold font-hina">
                Hello, let’s get in touch. <br />
                Do you want to donate/lend your artifact?
              </span>
            </div>
            <div className="w-full h-fit px-5 sm:pl-20  text-justify">
              <span className="w-full h-full text-xl sm:text-4xl font-hina">
                &nbsp;&nbsp;&nbsp;By supporting Museo Bulawan, you are not only
                helping to preserve important artifacts and historical objects
                but also contributing to the education and empowerment of future
                generations. This museum is more than just a place to view
                exhibits; it is a space for the community to connect, learn, and
                take pride in their shared heritage.
                <br />
              </span>
              <span className="w-full h-full text-xl sm:text-4xl font-hina">
                &nbsp;&nbsp;&nbsp;We invite you to join us in this important
                endeavor. Your support can make a significant difference in
                ensuring that the identity of the Camnorteños continues to
                thrive, fostering a deeper sense of patriotism and pride in our
                community. Together, we can keep the spirit of Camarines Norte
                alive for generations to come.
              </span>
            </div>
          </div>
          <div className="min-w-fit min-h-fit flex items-center justify-center">
            <div
              className="w-[40rem] h-[40rem] sm:w-[50rem] sm:h-[50rem] bg-no-repeat bg-cover bg-center p-10"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            >
              <div className="w-full h-full  outline-2 outline-white flex items-center justify-center">
                  <NavLink to="/about/support/contribution-form">

                <button className="w-40 cursor-pointer min-h-10 flex items-center justify-center outline-2 outline-[#867055]  bg-white xl:h-16 xl:w-60">
                    <span className="text-2xl xl:text-4xl font-hina ">
                      FORM{" "}
                    </span>
                </button>
                  </NavLink>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Support;
