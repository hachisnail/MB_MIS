import React from 'react'
import { NavLink } from 'react-router-dom'
import Breadcrumb from '../../components/Breadcrumb'

const Inventory = () => {
  return (
    <div className=' w-[137rem] h-[69rem] 3xl:w-[175rem] 3xl:h-[88rem] overflow-scroll'>



      
      <NavLink
            to="view"
            className='' end
          >
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
              <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
              <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
              <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
            </svg>
      </NavLink>
      
    </div>
  )
}

export default Inventory
