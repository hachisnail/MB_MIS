import { useState } from "react";
import { NavLink } from "react-router-dom";
const Catalogue = () => {
const tabs = ["Latest", "Temporary",  "All"];
const [activeTab, setActiveTab] = useState("Latest");

const handleTabClick = (tabName) => {
  setActiveTab(tabName);
};
  return (
    <div className="w-screen min-w-fit pt-40  items-center min-h-screen flex flex-col">
      {/* <div className='w-full h-fit flex justify-center'>
            <span className='text-4xl'>Catalalogs</span>
        </div>
      <NavLink className="w-fit" to="/login">
        <span className='text-2xl font-semibold hover:text-gray-600'>login</span>
      </NavLink>
      <NavLink className="w-fit" to="/catalogs">
        <span className='text-2xl font-semibold hover:text-gray-600'>Catalogs</span>
      </NavLink> */}
      <div className="w-[84vw] mt-40 space-y-10 h-fit flex flex-col">
        <div className=" w-full h-fit flex items-center justify-between">
          <div className="w-fit h-fit min-w-fit flex space-x-5 items-center ">
            <i className={`h-40 w-2 rounded-sm bg-white`} />

            <div
              className={` flex flex-col text-7xl h-fit justify-center text-white`}
            >
              <span className="font-semibold leading-18">Museo</span>
              <span className="font-semibold leading-18">Bulawan</span>
            </div>
          </div>
          <NavLink to="/appointment">
            <button className="w-70 h-16 bg-transparent hover:outline-1 hover:outline-black flex items-center justify-center outline-1 outline-white text-2xl font-medium text-white transition duration-300 hover:bg-white hover:text-black cursor-pointer">
              BOOK A VISIT
            </button>
          </NavLink>
        </div>
        <div className="w-full h-fit min-w-fit">
          <span className="text-white text-8xl font-semibold">
            Current Collections
          </span>
        </div>

        <div className="flex mt-20 items-center space-x-5 mb-4">

           {tabs.map((label, idx) => (
      <button
        key={idx}
        onClick={() => handleTabClick(label)}
        className={`
          text-2xl text-white font-semibold pb-2   cursor-pointer focus:outline-none
          ${activeTab === label ? "border-b-2" : ""}
        `}
      >
        {label}
      </button>
    ))}

        </div>

         <div className="mt-4 p-4 border h-[35rem] w-full border-gray-300 rounded">
        {activeTab === 'Latest' && (
          <div className="text-white">
            <h2 className="text-2xl  font-bold mb-2">Latest Content</h2>
            <p>This is the content that is displayed when the "Latest" tab is active. It could be a list of recent items, news, etc.</p>
            <p>More latest information...</p>
          </div>
        )}

        {activeTab === 'Temporary' && (
          <div className="text-white w-full h-full">
            <h2 className="text-2xl  font-bold mb-2">Temporary Content</h2>
            <p>This is the content that is displayed when the "Temporary" tab is active. It might be temporary data, a different view, etc.</p>
            <p>Additional temporary details here.</p>
          </div>
        )}

        {activeTab === 'All' && (
          <div className="text-white w-full h-full">
            <h2 className="text-2xl  font-bold mb-2">All Content</h2>
            <p>This is the content that is displayed when the "All" tab is active. It might be temporary data, a different view, etc.</p>
            <p>Additional temporary details here.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Catalogue;
