import React from "react";
import { NavLink } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";

const Inventory = () => {
  return (
    <div className=" w-[137rem] h-[69rem] 3xl:w-[175rem] 3xl:h-[88rem] overflow-scroll">
      <NavLink to="view" className="" end>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon"
        >
          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
        </svg>
      </NavLink>
    </div>
  );
};

export default Inventory;
