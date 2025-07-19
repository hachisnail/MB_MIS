import bgImage1 from "@/assets/Fernando-Amorsolo-Women-Bathing-and-Washing Clothes-7463.png";

const Articles = () => {


  return (
    <div className="w-screen pt-40 h-auto gap-y-5  items-center  min-w-fit min-h-screen flex flex-col">
      <div
        className="w-screen h-[40rem] bg-cover bg-center bg-no-repeat "
        style={{ backgroundImage: `url(${bgImage1})` }}>

        </div>

      <div className="w-full min-w-fit  h-screen min-h-fit flex flex-nowrap justify-center items-center">
        {/* display news items here */}

      </div>

    </div>
  );
};

export default Articles;
