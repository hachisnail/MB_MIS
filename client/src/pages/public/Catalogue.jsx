import React from 'react'
import { NavLink } from 'react-router-dom'

const Catalogue = () => {
  return (
    <div className='w-screen min-w-fit pt-40  min-h-screen flex flex-col'>
        <div className='w-full h-fit flex justify-center'>
            <span className='text-4xl'>Catalalogs</span>
        </div>
      <NavLink className="w-fit" to="/login">
        <span className='text-2xl font-semibold hover:text-gray-600'>login</span>
      </NavLink>
      <NavLink className="w-fit" to="/catalogs">
        <span className='text-2xl font-semibold hover:text-gray-600'>Catalogs</span>
      </NavLink>
    </div>
  )
}

export default Catalogue
