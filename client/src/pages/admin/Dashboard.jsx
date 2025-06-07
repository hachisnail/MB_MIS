import React from 'react'
import { useAuth } from '../../context/authContext'

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className='w-[80rem] h-[41rem] bg-gray-300 overflow-scroll'>

      <span className='text-2xl font-semibold'>Welcome {user.fname}!</span>

    </div>
    
  )
}

export default Dashboard

