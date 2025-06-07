import React from 'react'
import { useAuth } from '../../context/authContext'

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className=' w-[138rem] h-[75rem] mt-2 3xl:w-[175rem] 3xl:h-[88rem] overflow-scroll'>


      <span className='text-4xl font-semibold'>Welcome {user.fname}!</span>

    </div>
    
  )
}

export default Dashboard

