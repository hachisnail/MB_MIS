import bgImage1 from "@/assets/440832115_947772303495782_6010038099693171993_n.svg";

const About = () => {
  return (
    <>
    <div className="w-screen pt-40 h-auto  items-center  min-w-fit min-h-fit flex flex-col">
      <div
        className="w-screen h-[40rem] bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: `url(${bgImage1})` }}>
          
        </div>
    </div>
    <section id="about_more" className="pt-15 w-full h-screen flex justify-center">
      {/* about us sectiion container */}
    </section>
    {/* add more sections... */}
    </>
  )
}

export default About
