import { ImageCarousel } from "../../../../features/Utilities"
import { useState } from "react";

const viewArtifacts = () => {
  const [maintenanceActive, setMaintenanceActive] = useState(false);

const artifactImg = [
  {
    src: "https://stockcake.com/i/historical-artifact-display_1355705_1099471", 
    label: "Ancient Weaponry Display"
  },
  {
    src: "https://stockcake.com/i/ancient-artifact-display_1330400_874474", 
    label: "Museum Urn Exhibit"
  },
  {
    src: "https://stockcake.com/i/ancient-artifacts-displayed_1355707_1099471", 
    label: "Armor & Relics Showcase"
  },
  {
    src: "https://stockcake.com/i/museum-artifact-collection_1247966_1088396", 
    label: "Mixed Artifacts Gallery"
  },
];

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full max-w-[52.5rem] h-full items-center flex flex-col gap-y-5">
        <div className="w-fit h-fit">
        <ImageCarousel images={artifactImg}/>
        </div>
        <div className="w-full h-15 flex items-center justify-center gap-x-7">
          <span className={`${maintenanceActive === true ? "text-white bg-black" : "border-2 "}  w-85 flex justify-center font-semibold text-4xl py-2 rounded-xl`}>On Maintenance</span>
                    <span className={`${maintenanceActive === false ? "text-white bg-black" : "border-2 "} w-85 flex justify-center font-semibold text-4xl py-2 rounded-xl`}>In Storage</span>
        </div>
      </div>
      <div className="w-full max-w-[74.8rem] h-full">

      </div>
    </div>
  )
}

export default viewArtifacts
