import React from 'react'
import { useAuth } from '../../context/authContext'

const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div className='w-full h-full max-w-[138rem] 1xl:max-h-[75rem] 2xl:max-h-[87rem] mt-2 3xl:max-w-[175rem] 3xl:max-h-[88rem] overflow-scroll'>


    <span className='text-4xl font-semibold'>Welcome {user.fname}!</span>

    </div>
    
  )
}

export default Dashboard

