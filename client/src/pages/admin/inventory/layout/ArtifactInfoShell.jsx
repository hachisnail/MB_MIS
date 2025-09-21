
const ArtifactInfoShell = ({left, right, className=""}) => {
  return (
    <div className={`px-1 min-w-fit w-full h-full rounded-md items-center justify-center gap-x-3 flex-col md:flex-row md:gap-x-20 flex ${className}`}>
      <div className="relative w-fit h-fit">
        {left}
      </div>
      <div className="w-fit md:w-full h-full flex flex-col gap-y-5">
        {right}
      </div>
    </div>
  )
}

export default ArtifactInfoShell;
