import { NavLink, useNavigate } from "react-router-dom";
import bgImage1 from "@/assets/06-AfternoonMealOfTheWorker 1.svg";
import na1 from "@/assets/visit_us.svg";
import na2 from "@/assets/support_us.svg";
import block1 from "@/assets/block1.svg";
import block2 from "@/assets/block2.png";
import { scrollToElementById } from "@/components/commons";
import { ScrollButton } from "../../../features/Utilities";

import { socialLinks } from "../../../components/commons";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CalendarComponent from "../../../features/CalendarComponent";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`;

const Home = () => {
  const navigate = useNavigate();

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

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_ORIGIN}/api/auth/public-articles`);
      setArticles(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load events.");
      setLoading(false);
    }
  };

  const encoded = (id, name) => {
    const encodedString = `${id}::${name}`;
    return btoa(encodedString);
  };

  // ---------- NEW: Event-only helpers for "What's On?" ----------
  const toISODate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // only events
  const eventArticles = useMemo(
    () => articles.filter((a) => String(a.content_type || "").toLowerCase() === "event"),
    [articles]
  );

  // today's events
  const todaysEvents = useMemo(
    () => eventArticles.filter((a) => toISODate(a.upload_date) === todayStr),
    [eventArticles, todayStr]
  );

  // pick today's events, otherwise the soonest future date's events
  let displayEvents = todaysEvents;
  if (displayEvents.length === 0) {
    const futureEvents = eventArticles
      .filter((a) => toISODate(a.upload_date) > todayStr)
      .sort((a, b) => toISODate(a.upload_date).localeCompare(toISODate(b.upload_date)));
    if (futureEvents.length > 0) {
      const nextDate = toISODate(futureEvents[0].upload_date);
      displayEvents = futureEvents.filter((a) => toISODate(a.upload_date) === nextDate);
    }
  }
  displayEvents = displayEvents.slice(0, 2);
  // -------------------------------------------------------------

  return (
    <div className="overflow-y-scroll snap-y snap-mandatory h-fit w-full">
      <div
        id="home"
        className="snap-start bg-cover bg-center bg-no-repeat w-screen rounded-sm h-screen pt-40 flex flex-col items-center"
        style={{ backgroundImage: `url(${bgImage1})` }}
        s
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
                onClick={() => {
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
              <button
                onClick={() => {
                  scrollToElementById("feedback", 0);
                }}
                className="w-48 h-16 bg-transparent hover:outline-1 hover:outline-black flex items-center justify-center outline-1 outline-white text-2xl font-medium text-white transition duration-300 hover:bg-white hover:text-black cursor-pointer"
              >
                FEEDBACK
              </button>
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
        className="snap-start pt-15 w-full bg-white min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <ScrollButton
          pt="50"
          title="Home"
          targetId="main-navbar-top"
          direction="left"
        />
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
              <div
                style={{ backgroundImage: `url(${bgImage1})` }}
                className="w-full h-full bg-cover bg-center bg-no-repeat "
              ></div>
            </div>
          </div>
        </div>

        <ScrollButton
          pt="0"
          title="Whats On?"
          targetId="whats_on"
          direction="right"
        />
      </section>

      <section
        id="whats_on"
        className="snap-start pt-15 w-full bg-white min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <ScrollButton
          pt="0"
          title="learn More"
          targetId="learn_more"
          direction="left"
        />

        <div className="w-full xl:justify-between max-h-[85vh] gap-y-20 xl:gap-y-0 xl:gap-x-10 h-auto flex xl:flex-row flex-col items-center overflow-hidden ">
          {/* calendar component */}
          <div className="h-fit min-w-fit w-fit relative">
            <img src={block2} alt="" className="h-[70rem] w-[85rem]" />
            <div className="absolute min-w-fit flex flex-col items-end justify-between top-20 h-[55rem] pr-20 w-[75rem] right-0 z-50">
              <div className="w-full h-fit">
                <CalendarComponent />
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

            {/* ---------- CHANGED: Use displayEvents (events only) ---------- */}
            <div className="w-[55rem] h-full flex flex-col justify-start gap-y-5">
              {displayEvents.length > 0 ? (
                displayEvents.map((article) => (
                  <NavLink
                    key={article.article_id}
                    to={`/article/${encoded(article.article_id, article.title)}`}
                    className="w-[33rem] mx-auto h-[20rem] md:w-[55rem] md:h-[30rem] bg-cover bg-center bg-no-repeat rounded-lg shadow-lg hover:opacity-90 transition"
                    style={{ backgroundImage: `url('${article.images}')` }}
                    title={article.title}
                  >
                    <div className="w-full h-full flex flex-col justify-end bg-opacity-30 p-4">
                      <span className="text-white text-2xl font-bold drop-shadow">
                        {article.title}
                      </span>
                      <span className="text-white text-lg">
                        {article.upload_date
                          ? new Date(article.upload_date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </NavLink>
                ))
              ) : (
                <>
                  <div
                    className="w-[33rem] mx-auto h-[20rem] md:w-[55rem] md:h-[30rem] bg-cover bg-center bg-no-repeat flex items-center justify-center text-gray-400"
                    style={{ backgroundImage: `url(${bgImage1})` }}
                  >
                    <span>No events today or upcoming.</span>
                  </div>
                  <div
                    className="w-[33rem] h-[20rem] mx-auto md:w-[55rem] md:h-[30rem] bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${bgImage1})` }}
                  />
                </>
              )}
            </div>
            {/* ------------------------------------------------------------- */}
          </div>
        </div>

        <ScrollButton
          pt="0"
          title="News & Events"
          targetId="news_events"
          direction="right"
        />
      </section>

      <section
        id="news_events"
        className="snap-start pt-15 w-full min-h-screen px-30 flex flex-col justify-center items-center"
      >
        <ScrollButton
          pt="0"
          title="Whats On?"
          targetId="whats_on"
          direction="left"
          textColor="text-gray-300"
          hoverTextColor="hover:text-gray-600"
        />

        <div className="w-full flex-col py-10 px-20 gap-y-20 xl:gap-y-0 flex overflow-hidden">
          <div className="flex items-center justify-start w-full text-gray-500">
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
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-xl font-hind font-extralight pt-1">
              DONT MISS
            </span>
          </div>
          <span className="text-white text-7xl font-hina">News & Events</span>

          <div className="w-full h-full px-8 py-3 grid xl:grid-cols-2 xl:grid-rows-2 grid-rows-4 grid-cols-1 gap-4 xl:gap-8">
            {loading && (
              <div className="col-span-2 text-white text-2xl text-center py-10">
                Loading events...
              </div>
            )}
            {error && (
              <div className="col-span-2 text-red-500 text-2xl text-center py-10">
                {error}
              </div>
            )}
            {!loading &&
              !error &&
              articles.slice(0, 4).map((article, index) => {
                const displayDate = article.upload_date
                  ? new Date(article.upload_date).toLocaleDateString()
                  : "No Date";

                return (
                  <NavLink
                    key={index}
                    to={`/article/${encoded(article.article_id, article.title)}`}
                    className="w-full h-full transition duration-300"
                  >
                    <div className="w-full h-full flex flex-col xl:flex-row gap-4 bg-black/50 p-3 rounded-lg">
                      <div className="w-full xl:w-2/5 h-[30rem] xl:h-full rounded-lg overflow-hidden">
                        <div
                          className="w-full h-full bg-cover bg-no-repeat bg-center"
                          style={{
                            backgroundImage: `url('${article.images}')`,
                          }}
                        />
                      </div>
                      <div className="w-full xl:w-3/5 flex flex-col justify-between gap-y-5">
                        <div className="w-full h-25">
                          <h3 className="text-2xl xl:text-5xl font-bold text-white overflow-hidden">
                            {article.title || "Untitled"}
                          </h3>
                        </div>
                        <div className="w-full h-fit flex gap-x-5">
                          <p className="w-50 text-xl text-[#787878]">
                            {displayDate}
                          </p>
                          <p className="text-xl  text-yellow-600">
                            {article.article_category || ""}
                          </p>
                        </div>
                        <div className="w-full h-50 flex break-words">
                          <span className=" overflow-hidden text-white text-xl">
                            {article.caption || ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
          </div>

          <div className="flex justify-end w-full text-gray-300 hover:text-gray-500">
            <button
              className="flex items-center cursor-pointer"
              onClick={() => {
                navigate("articles");
              }}
            >
              <span className="text-xl font-hind font-extralight pt-1">
                See All Events
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="72"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="-10" y1="12" x2="19" y2="12" />
                <polyline points="12 8 19 12 12 16" />
              </svg>
            </button>
          </div>
        </div>

        <ScrollButton
          pt="0"
          title="Support Us"
          targetId="support"
          direction="right"
          textColor="text-gray-300"
          hoverTextColor="hover:text-gray-600"
        />
      </section>

      <section
        id="support"
        className="snap-start pt-15 bg-white w-full min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <ScrollButton
          pt="0"
          title="News & Events"
          targetId="news_events"
          direction="left"
        />

        <div className="w-full xl:justify-center min-h-[85vh] gap-y-20 xl:gap-y-0 h-auto flex xl:flex-row flex-col items-center overflow-hidden">
          <div className="max-w-[90rem] h-[70rem] w-full flex flex-col px-12">
            <div className="w-full h-[35rem] flex items-center justify-center">
              <div className="w-[40rem] h-full flex justify-start">
                <div
                  className="w-[40rem] h-[35rem] bg-no-repeat bg-cover bg-center p-10"
                  style={{ backgroundImage: `url(${na1})` }}
                >
                  <div className="w-full h-full  outline-2 outline-white flex items-center justify-center"></div>
                </div>
              </div>

              <div className="w-[40rem] h-full flex flex-col gap-2 justify-center items-end pl-5">
                <div className="h-[10rem] w-full flex items-end text-left">
                  <span className="text-6xl font-bold font-hind">
                    VISIT US!
                  </span>
                </div>

                <div className="h-[11rem] flex">
                  <span className="text-3xl font-hind font-medium tracking-wide leading-11 text-left">
                    Explore the treasures of Museo Bulawan! Plan your visit
                    today by booking a tour or schedule an appointment for
                    research, interviews, and more.
                  </span>
                </div>

                <div className="h-[10rem] w-full flex t">
                  <NavLink to="/appointment">
                    <button className="w-auto h-auto border-black border-2 rounded-lg px-5 py-2 cursor-pointer hover:bg-gray-200">
                      <span className="text-3xl font-hind">
                        BOOK AN APPOINTMENT
                      </span>
                    </button>
                  </NavLink>
                </div>
              </div>
            </div>

            <div className="w-full h-[35rem] flex items-center justify-center">
              <div className="w-[40rem] h-full flex flex-col gap-2 justify-center items-end pr-5">
                <div className="h-[10rem] flex items-end text-right">
                  <span className="text-6xl font-bold font-hind">
                    YOUR SUPPORT MATTERS!
                  </span>
                </div>

                <div className="h-[11rem] flex">
                  <span className="text-3xl font-hind font-medium tracking-wide leading-11 text-right">
                    Help us preserve and celebrate our heritage! Contribute to
                    Museo Bulawan by donating or lending artifacts to enrich our
                    collection and share history with future generations
                  </span>
                </div>

                <div className="h-[10rem] w-full justify-end flex">
                  <NavLink to="/about/support">
                    <button className="w-auto h-auto border-black border-2 rounded-lg px-5 py-2 cursor-pointer hover:bg-gray-200">
                      <span className="text-3xl font-hind">SUPPORT</span>
                    </button>
                  </NavLink>
                </div>
              </div>

              <div className="w-[40rem] h-full flex justify-start">
                <div
                  className="w-[40rem] h-[35rem] bg-no-repeat bg-cover bg-center p-10"
                  style={{ backgroundImage: `url(${na2})` }}
                >
                  <div className="w-full h-full  outline-2 outline-white flex items-center justify-center"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollButton
          pt="-500"
          title="Your Voice Matters"
          targetId="feedback"
          direction="right"
        />
      </section>

      {/* Feedback Section */}
      <section
        id="feedback"
        className="snap-start pt-15 w-full bg-[#1C1B19] min-h-screen h-auto px-30 flex flex-col justify-center items-center"
      >
        <ScrollButton
          pt="0"
          title="Support Us"
          targetId="support"
          direction="left"
          textColor="text-gray-300"
          hoverTextColor="hover:text-gray-600"
        />

        <div className="w-full max-w-6xl mx-auto py-20">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center w-full text-[#EFBF04] mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-lg font-hind font-extralight px-4 pt-1 tracking-wide">
                MAKE YOUR VOICE HEARD
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h2 className="text-7xl font-hina font-bold mb-6 text-[#FCE6BC]">Your Voice Matters</h2>
            <p className="text-xl leading-relaxed max-w-3xl mx-auto text-gray-300">
              Help us improve our services and create better experiences for all visitors.
              Share your feedback about your museum visit or our website.
            </p>
          </div>

          {/* Feedback Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Appointment Feedback Card */}
            <NavLink
              to="/feedback/appointment"
              className="group"
            >
              <div className="bg-[#FCE6BC] h-full flex flex-col p-12 rounded-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                  <div className="w-20 h-20 flex items-center justify-center bg-white rounded-none border-2 border-[#1C1B19] group-hover:bg-[#1C1B19] transition-colors duration-300">
                    <svg
                      className="w-10 h-10 text-[#1C1B19] group-hover:text-[#FCE6BC] transition-colors duration-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <polyline points="10 14 12 16 14 14" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-3xl font-hind font-bold mb-4 text-[#1C1B19]">
                  Appointment Feedback
                </h3>
                <p className="text-lg leading-relaxed mb-8 text-gray-700 flex-grow">
                  Share your experience from your museum visit. Help us understand what we do well and where we can improve.
                </p>

                {/* Button */}
                <div className="flex items-center gap-3 text-[#1C1B19] font-hind font-semibold group-hover:gap-5 transition-all duration-300">
                  <span>Give Feedback</span>
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </NavLink>

            {/* Website Feedback Card */}
            <NavLink
              to="/feedback/website"
              className="group"
            >
              <div className="bg-[#FCE6BC] h-full flex flex-col p-12 rounded-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                  <div className="w-20 h-20 flex items-center justify-center bg-white rounded-none border-2 border-[#1C1B19] group-hover:bg-[#1C1B19] transition-colors duration-300">
                    <svg
                      className="w-10 h-10 text-[#1C1B19] group-hover:text-[#FCE6BC] transition-colors duration-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-3xl font-hind font-bold mb-4 text-[#1C1B19]">
                  Website Feedback
                </h3>
                <p className="text-lg leading-relaxed mb-8 text-gray-700 flex-grow">
                  Tell us about your experience browsing our website. Your input helps us make it better for everyone.
                </p>

                {/* Button */}
                <div className="flex items-center gap-3 text-[#1C1B19] font-hind font-semibold group-hover:gap-5 transition-all duration-300">
                  <span>Give Feedback</span>
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Footer Info */}
          <div className="text-center border-t border-gray-600 pt-12">
            <p className="text-lg text-gray-300 mb-8">
              Your feedback is confidential and helps us continuously improve our services.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#EFBF04]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span>ISO Standards Compliant</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full hidden sm:block" />
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#EFBF04]"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                </svg>
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollButton
          pt="0"
          title="Footer"
          targetId="feedback"
          direction="right"
          textColor="text-gray-300"
          hoverTextColor="hover:text-gray-600"
        />
      </section>
    </div>
  );
};

export default Home;
