const ArtifactDetailsShells = ({ left, middle, right, className = "" }) => {
  return (
    <div
      className={`w-full h-full rounded-md grid grid-cols-[43rem_1fr_52rem] 3xl:grid-cols-[43rem_1fr_auto] ${className}`}
    >
      <section className=" col-span-1 w-full h-full bg-black relative overflow-visible flex flex-col">
        {left}
      </section>

      <section className="col-span-1 w-full h-full flex flex-col overflow-y-auto ">
        {middle}
      </section>

      <section className="col-span-1 w-full h-full rounded-r-md flex justify-between flex-col ">
        {right}
      </section>
    </div>
  );
};

export default ArtifactDetailsShells;
