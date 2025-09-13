
const OverviewShell = ({ left, middle, right, className = "" }) => {
  return (
    <div className={`w-full h-full grid grid-cols-[1fr_43rem_47rem] ${className}`}>
    {/* Left column */}
      <section className="col-span-1 w-full h-full bg-[#1C1B19] rounded-l-md pt-20 px-10 gap-y-9 flex flex-col">
        {left}
      </section>

      {/* Middle column */}
      <section className="col-span-1 flex flex-col w-full h-full bg-[#1A0F0F] px-10 pt-20 gap-y-10">
        {middle}
      </section>

      {/* Right column */}
      <section className="col-span-1 w-full h-full bg-[#1D1911] rounded-r-md flex flex-col items-center pb-10 pt-13 px-10 gap-y-5">
        {right}
      </section>
    </div>
  )
}

export default OverviewShell
