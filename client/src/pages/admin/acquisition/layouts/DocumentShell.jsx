const DocumentShell = ({ left, middle, right, className = "" }) => {
  return (
    <div
      className={`w-full h-full rounded-md grid grid-cols-[43rem_1fr_40rem] ${className}`}
    >
      <section className="col-span-1 w-full h-full bg-black relative overflow-visible flex flex-col">
        {left}
      </section>

      <section className="col-span-1 w-full h-full flex flex-col">
        {middle}
      </section>

      <section className="col-span-1 w-full h-full rounded-r-md flex justify-between flex-col">
        {right}
      </section>
    </div>
  );
};

export default DocumentShell;
