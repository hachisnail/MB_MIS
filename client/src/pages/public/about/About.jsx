import bgImage1 from "@/assets/440832115_947772303495782_6010038099693171993_n.svg";
import bgImage2 from "@/assets/8900f8_517f4f9ec7054b88a23b301bf31d6596~mv2 1.png"
import bgImage3 from "@/assets/455363415_812761527719886_1195461782753847821_n.png"
import bgImage4 from "@/assets/467396235_122120510066524881_2018490976163991958_n 2.png"
import bgImage5 from "@/assets/Bulawan-Museum-14 1.png"
import bgImage6 from "@/assets/Screenshot 2025-01-29 233139.png"

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

      <section className="w-full bg-white px-98 pt-32">
        {/* 1st Part */}
        <div className="flex flex-col md:flex-row gap-16 mb-32">
          <div className="md:w-2/5 text-justify text-2xl leading-relaxed">
            <p>
              The Museo Bulawan, also known as the Community Museum of Camarines Norte, embodies the rich cultural and historical essence of the province. Its origins trace back to 1995, when the construction of a new neo-classical provincial capitol building provided a fitting backdrop for the establishment of a museum. The Greco-Roman architecture of the building inspired a vision of timeless grandeur, making it an ideal setting to house artifacts and exhibits that celebrate the province's heritage.
            </p>
            <div
              className="mt-8 w-full h-[400px] bg-cover bg-center bg-no-repeat rounded"
              style={{ backgroundImage: `url(${bgImage5})` }}
            />
          </div>
          <div className="md:w-3/5">
            <h1 className="text-5xl font-serif mb-8 leading-tight">
              "A museum is a bridge that connects the past to the present, inspiring the future."
            </h1>
            <h2 className="font-serif font-semibold text-2xl mb-6">Humble Beginnings</h2>
            <p className="text-2xl leading-relaxed text-justify">
              Initially, the museum was situated in a modest space at the center of the capitol building's frontage, directly facing the main entrance. Despite its limited size, this initial venue served as a hub for various periodic exhibits and activities. It became an effective platform for the provincial government to foster cultural awareness and education among the youth and the community at large.
            </p>
            <p className="text-2xl leading-relaxed mt-6 text-justify">
              Through collaborations with national organizations such as the National Commission for Culture and the Arts (NCCA), the National Museum, and the National Historical Institute, the museum hosted numerous events that sparked a growing interest in local history and cultural preservation. These partnerships deepened the community's sense of identity and strengthened their connection to the national narrative.
            </p>
            <p className="text-2xl leading-relaxed mt-6 text-justify">
              This initial phase of the museum also served as a testament to the community's commitment to preserving their heritage despite spatial limitations. The intimate setting encouraged meaningful interactions between visitors and exhibits, fostering a deeper appreciation for the artifacts on display. Local artists, historians, and cultural advocates found a welcoming space to share their work and knowledge, further enriching the museum's offerings. These early efforts laid the groundwork for a vibrant cultural hub that would eventually grow into a larger and more comprehensive institution, embodying the community's dedication to celebrating and safeguarding their shared history.
            </p>
          </div>
        </div>
        <h1 className="text-4xl font-serif mb-8 leading-tight">
          “Heritage is not what we inherit from the past; it is what we preserve for the future.”
        </h1>
        {/* 2nd Part */}
        <div className="flex flex-col md:flex-row gap-16 mb-32">

          <div className="md:w-1/2">
            <div
              className="mt-8 w-full h-[400px] bg-cover bg-center bg-no-repeat rounded"
              style={{ backgroundImage: `url(${bgImage3})` }}
            />
          </div>
          <div className="md:w-1/2 text-lg leading-relaxed">

            <h2 className="font-serif font-semibold mb-6 text-4xl ">Expansion and Transformation</h2>
            <p className="text-3xl text-justify">
              The new location facilitated significant advancements in museum management, including systematic techniques in documentation, research, preservation, and exhibition. Enhanced marketing and promotional efforts further broadened the museum's reach, attracting a diverse audience of local residents and travelers.
            </p>
            <div className="flex mt-8 gap-8">
              <div className="text-[15rem] font-serif font-bold leading-none">O</div>
              <p className="flex-1 text-3xl text-justify">
                ver time, the museum's popularity and collections grew, outstripping the capacity of its original location. The year 2000 marked a pivotal moment in its history when the museum was relocated to a larger building adjacent to the provincial capitol. This move addressed the need for a more spacious venue, enabling improved collection displays and a more comfortable experience for visitors.
              </p>
            </div>

          </div>
        </div>

        {/* 3rd Part */}
        <div className="flex flex-col md:flex-row gap-16 mb-32">
          <div className="md:w-3/5 text-lg leading-relaxed">
            <h1 className="text-4xl font-serif mb-8">Museo Bulawan: A Beacon of Cultural Wealth</h1>
            <p className="text-3xl">
              The museum's name, Museo Bulawan—translated as “Golden Museum”—reflects Camarines Norte's distinction as a province historically linked to gold mining. This golden legacy resonates in the museum's exhibits and collections, which include:
            </p>
            <ul className="list-disc list-inside mt-6 space-y-3 text-2xl">
              <li>Numismatics: An extensive collection of coins and currencies.</li>
              <li>Portraits of Governors: A gallery honoring the province's leaders.</li>
              <li>Historical Panels: Computer-generated displays illustrating significant moments in local and national history.</li>
              <li>Local Heroes Exhibit: Tributes to the individuals who shaped the province's story.</li>
              <li>Tourism Showcases: Presentations highlighting the scenic beauty and cultural richness of Camarines Norte.</li>
            </ul>
          </div>
          <div className="md:w-2/5 flex items-center justify-center">
            <div
              className="w-full h-[400px] bg-cover bg-center bg-no-repeat rounded"
              style={{ backgroundImage: `url(${bgImage6})` }}
            />
          </div>
        </div>

        {/* 4th Part */}
        <div className="flex flex-col md:flex-row gap-16 mb-32">
          <div className="md:w-3/5 text-lg leading-relaxed">
            <h1 className="text-5xl font-serif mb-8">In addition to these exhibits...</h1>
            <p className="text-3xl text-justify">
              In addition to these exhibits, the museum hosts periodic events and activities designed to engage children and adults alike, further solidifying its role as a cornerstone of cultural education and community engagement.
            </p>
          </div>
          <div className="md:w-2/5 text-lg leading-relaxed">
            <h2 className="font-serif font-semibold mb-6 text-4xl">A Living Heritage</h2>
            <p className="text-2xl text-justify">
              Today, Museo Bulawan stands not just as a repository of artifacts but as a dynamic institution that bridges the past and present. It continues to inspire pride and curiosity among its visitors while contributing to the province's tourism appeal. As it moves forward, the museum remains committed to its mission of preserving and showcasing the golden heritage of Camarines Norte, ensuring that future generations can connect with their roots and celebrate their identity.
            </p>
          </div>
        </div>

        {/* 5th Part (Vision) */}
        <div className="relative w-full h-[400px] mb-32 text-white flex items-center justify-center text-center" style={{ backgroundImage: 'url(/path/to/vision-background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="relative max-w-6xl px-12">
            <h1 className="text-5xl font-serif font-bold mb-8">Vision</h1>
            <p className="text-xl leading-relaxed">
              Museo Bulawan is the leading and the most viewer-friendly community museum that serves as the prime center for education and communication of the rich cultural, artistic, and natural heritage and history of Camarines Norte and the limitless medium for preservation and exhibition of significant objects that strengthen the values of the people and deepen their patriotism and sense of identity.
            </p>
          </div>
        </div>

        {/* 6th Part (Mission) */}
        <div className="w-full max-w-6xl mx-auto text-center mb-32 bg-white">
          <h1 className="text-4xl font-serif font-bold mb-8">Mission</h1>
          <p className="text-xl leading-relaxed">
            Collect, research, conserve, exhibit and disseminate knowledge of significant past so as to enhance social life and sustain the efforts to social transformation and development. Educate, entertain and excite the various publics through systematic preservation, protection, promotion and publication of the material culture of the society. Sustain the process of social progress through the communicative function of the museum towards inculcation of values, greater appreciation and understanding of arts and culture as well as production of relevant information that boosts the pride of place of the people and their sense of national purpose.
          </p>
        </div>

        {/* 7th Part (Curator Message) */}
        <div className="w-full bg-[#1C1B19] text-white px-12 py-32 max-w-7xl mx-auto text-center rounded">
          <h2 className="text-3xl font-serif mb-8 text-[#FCE6BC]">A Message From The Museum Curator</h2>
          <div
            className="w-56 h-56 rounded-full bg-cover bg-center bg-no-repeat mx-auto mb-8"
            style={{ backgroundImage: `url(${bgImage4})` }}
          />
          <h1 className="text-4xl font-serif font-bold mb-8 text-[#FCE6BC]">Mr. Abel C. Icatlo</h1>
          <p className="text-xl leading-relaxed">
            Through the pages of history we saw the searing revolutionary fire of the nationalist heroes of Camarines Norte who convulsed in a determined uprising in Daet in April 1898 and later established the First Rizal Monument in December of that year. The seeds of freedom sown by the local heroes of this Province engendered an awakened nation and a people who were wont to pay the price of freedom. Through the wars and dictatorship, the people of Camarines Norte seasoned the challenges with perseverance and fortitude.
          </p>
          <p className="text-xl leading-relaxed mt-6">
            Museo Bulawan, which is a community museum, attempts to capture the rich panorama of struggle of the Local people. History aside, Museo Bulawan, showcases as well the exquisite treasure of this province which is gold. Actually, bulawan is a Filipino word for gold and it is said that Camarines Norte is a province that sits in a mound of gold.
          </p>
          <p className="text-xl leading-relaxed mt-6">
            Not only does the Provincial Government of Camarines Norte mind itself on the material development of the people but more so, it strives to zero in on the software of social and economic development which is the cultural, ethical and moral upliftment of the people. And there is no other way by which this can be effectively done except through the powerful tool of culture and arts.
          </p>
          <p className="text-xl leading-relaxed mt-6">
            Hence, genuine socio-economic progress becomes possible through the developmental firepower of culture clarified and inculcated in the minds and hearts of the people.
          </p>
          <p className="text-xl leading-relaxed mt-6">
            Museo Bulawan is dynamically spearheading this thrust on cultural development being at the forefront of heritage, cultural and artistic endeavors of the local government. And we hold the conviction that cultural development is the ultimate driving force to continually rekindle and spread courage, resiliency, integrity, moral strength and patriotic and nationalistic fervor.
          </p>
        </div>

        {/* 8th Part (Key People) */}
        <div className="w-full text-center px-12 py-32 bg-white max-w-8xl mx-auto rounded">
          <h1 className="text-5xl font-serif font-bold mb-6">Key People</h1>
          <h2 className="font-serif font-semibold text-3xl mb-6">Pure Professionalism</h2>
          <p className="max-w-6xl mx-auto text-3xl leading-relaxed mb-12">
            Our dedicated team of experienced professionals are always on the ball, utilizing their unique skills and passion to move the work of Museum. We’re always pushing ourselves to stay ahead of the curve and striving to perfect our programs. Meet some of our incredible employees below.
          </p>
          <div
            className="w-full h-[400px] bg-cover bg-center bg-no-repeat rounded"
            style={{ backgroundImage: `url(${bgImage2})` }}
          />
        </div>
      </section>
    </>
  );
};

export default About;
