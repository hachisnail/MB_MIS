import bgImage1 from "@/assets/440832115_947772303495782_6010038099693171993_n.svg";

const About = () => {
  return (
    <>
      {/* Hero Background */}
      <div className="w-screen pt-40 h-auto flex flex-col items-center">
        <div
          className="w-screen h-[40rem] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage1})` }}
        />
      </div>

      <section id="about_more" className="w-full flex flex-col gap-20 pt-20 bg-white px-[30rem]">
        {/* 1st Part */}
        <div className="flex flex-col md:flex-row gap-10 px-6 md:px-20">
          <div className="w-full md:w-2/5">
            <p className="text-justify">
              The Museo Bulawan, also known as the Community Museum of Camarines
              Norte, embodies the rich cultural and historical essence of the
              province...
            </p>
          </div>
          <div className="w-full md:w-3/5">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              "A museum is a bridge that connects the past to the present,
              inspiring the future."
            </h1>
            <p className="font-bold mb-2">Humble Beginnings</p>
            <p className="text-justify">
              Initially, the museum was situated in a modest space at the center
              of the capitol building's frontage...
            </p>
          </div>
        </div>

        {/* 2nd Part */}
        <div className="flex flex-col md:flex-row gap-10 px-6 md:px-20">
          <div className="w-full md:w-1/2">
            <h1 className="text-3xl sm:text-5xl font-bold mb-10 leading-tight">
              “Heritage is not what we inherit from the past; it is what we
              preserve for the future.”
            </h1>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="font-bold mb-4">Expansion and Transformation</h2>
            <p>
              The new location facilitated significant advancements in museum
              management, including documentation, research, and preservation...
            </p>
            <div className="flex">
              <span className="text-9xl sm:text-[12rem] font-bold text-black leading-none mr-4">
                O
              </span>
              <p className="mt-10 text-justify">
                ver time, the museum's popularity and collections grew,
                outstripping the capacity of its original location...
              </p>
            </div>
          </div>
        </div>

        {/* 3rd Part */}
        <div className="flex flex-col md:flex-row gap-10 px-6 md:px-20">
          <div className="w-full md:w-2/5">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              Museo Bulawan: A Beacon of Cultural Wealth
            </h1>
            <p>
              The museum's name, Museo Bulawan—translated as “Golden
              Museum”—reflects Camarines Norte's distinction...
            </p>
            <ul className="list-disc ml-6 mt-4 space-y-2">
              <li>Numismatics: An extensive collection of coins and currencies.</li>
              <li>Portraits of Governors: A gallery honoring leaders.</li>
              <li>
                Historical Panels: Displays illustrating local and national
                history.
              </li>
              <li>
                Local Heroes Exhibit: Tributes to individuals who shaped the
                province.
              </li>
              <li>
                Tourism Showcases: Presentations highlighting cultural richness.
              </li>
            </ul>
          </div>
          <div className="w-full md:w-3/5 flex items-center justify-center">
            {/* Add exhibit image here */}
          </div>
        </div>

        {/* 4th Part */}
        <div className="flex flex-col md:flex-row gap-10 px-6 md:px-20">
          <div className="w-full md:w-3/5">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              In addition to these exhibits...
            </h1>
          </div>
          <div className="w-full md:w-2/5">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">
              A Living Heritage
            </h1>
            <p className="text-lg text-justify">
              Today, Museo Bulawan stands not just as a repository of artifacts
              but as a dynamic institution...
            </p>
          </div>
        </div>

        {/* 5th Part (Vision) */}
        <div className="w-full h-auto bg-cover bg-center bg-no-repeat flex items-center justify-center text-white px-8 py-20 bg-gray-900">
          <div className="max-w-5xl text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">Vision</h1>
            <p className="text-lg sm:text-2xl leading-relaxed">
              Museo Bulawan is the leading and most viewer-friendly community
              museum...
            </p>
          </div>
        </div>

        {/* 6th Part (Mission) */}
        <div className="w-full h-auto flex items-center justify-center text-center px-8 py-20">
          <div className="max-w-5xl">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">Mission</h1>
            <p className="text-lg sm:text-2xl leading-relaxed">
              Collect, research, conserve, exhibit and disseminate knowledge of
              the significant past...
            </p>
          </div>
        </div>

        {/* 7th Part (Curator Message) */}
        <div className="w-full bg-[#1C1B19] text-white px-8 py-20">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl mb-6 text-[#FCE6BC]">
              A Message From The Museum Curator
            </h2>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-[#FCE6BC]">
              Mr. Abel C. Icatlo
            </h1>
            <p className="text-lg sm:text-2xl leading-relaxed">
              Through the pages of history we saw the searing revolutionary fire
              of the nationalist heroes of Camarines Norte...
            </p>
          </div>
        </div>

        {/* 8th Part (Key People) */}
        <div className="w-full text-center px-8 py-20">
          <h1 className="text-4xl sm:text-6xl font-bold mb-4">Key People</h1>
          <h2 className="font-bold text-xl mb-4">Pure Professionalism</h2>
          <p className="max-w-4xl mx-auto text-lg leading-relaxed">
            Our dedicated team of experienced professionals are always on the
            ball, utilizing their unique skills...
          </p>
        </div>
      </section>
    </>
  );
};

export default About;
