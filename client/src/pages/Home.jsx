import React from 'react'
import { NavLink } from 'react-router-dom'

const Home = () => {
  return (
    <div className='w-screen min-h-screen flex flex-col'>
      <NavLink className="w-fit" to="/login">
        <span className='text-2xl font-semibold hover:text-gray-600'>login</span>
      </NavLink>
    </div>
  )
}

export default Home
