import React from 'react'
import { NavLink } from 'react-router-dom';
import Logo from '../../assets/LOGO.png';

const PublicFooter = () => {


  return  (
    <>
    <div className='w-screen min-h-85 bg-[#1C1B19] py-10 overflow-x-hidden'>
      <div className='max-w-[140rem] 3xl:max-w-[185rem] flex flex-col h-auto min-h-60 mx-auto '>
        <div className='w-full h-12 flex items-center gap-x-4 px-10 border-b-2 border-white'>
          <NavLink to="/">
            <span  className='text-white text-xl'>Home</span>
          </NavLink>
          <div className='h-8 w-0.5 bg-white'></div>
          <NavLink to="/content">
            <span className='text-white text-xl'>News & Events</span>
          </NavLink>
          <div className='h-8 w-0.5 bg-white'></div>
          <NavLink to="/about">
            <span  className='text-white text-xl'>About us</span>
          </NavLink>
        </div>
        <div className='w-full h-full  flex flex-col sm:flex-row pt-6'>
          <div className='w-full h-full min-h-[18rem]   px-10'>  

            <div className='w-full min-h-[6rem] gap-x-4 flex items-center h-full'> 
              <img src={Logo} alt="Museo Bulawan Logo" className='w-[6rem]'/>
              <span className='text-6xl font-bold text-white'>MUSEO BULAWAN</span>
            </div>

            <div className='w-full min-h-[7rem] flex items-end p-3 h-full'> 

              <span className='font-300 text-3xl text-white font-serif'>
                Helping us raise awareness regarding Camnortenos identity is crucial, and your support can make a significant difference.
              </span>

            </div>
            <div className='w-full flex-row flex items-center min-h-[5rem] h-full'> 

              <div className='pl-6 py-3 w-fit h-full  '>
                <span className='text-white text-md font-serif tracking-wider'>
                  We gratefully accept donations or just lending of your artifact will greatly help us.<br/>
                  &copy; {new Date().getFullYear()} Museo Bulawan. All rights reserved.
                </span>
              </div>
              <div className=' h-[5rem] flex items-center justify-center w-full max-w-[20rem]'>
                <NavLink to='/support' className='w-[17rem] flex items-center justify-center font-semibold bg-white h-[4rem]'>
                  <span className='text-3xl'>   
                    Contribute
                  </span>
                </NavLink>
              </div>

            </div>


          </div>
          <div className='w-full h-full flex min-h-[18rem] pt-[3rem]'>
            <div className='w-full h-full flex flex-col gap-y-3 justify-start items-center sm:items-start sm:pl-20'>

              <span className='font-bold text-3xl mb-2 text-white w-fit'>
                Visit Us
              </span>
              <NavLink to='/about'>
                <span className='text-2xl underline text-white w-fit'>
                  About Us
                </span>
              </NavLink>

              <NavLink to='/appointment'>

              <span className='text-2xl underline text-white w-fit'>
                Book a Tour
              </span>
              </NavLink>
              <NavLink to='/support'>
              <span className='text-2xl underline text-white w-fit'>
                Contact Us
              </span>
             </NavLink>
            </div>
            <div className='w-full h-full flex flex-col gap-y-3 justify-start  pl-5 sm:pl-30'>
              <span className='font-bold text-3xl mb-2 text-white w-fit'>
                Opening Hours
              </span>
              <span className='text-2xl text-white w-fit'>
                Camarines Norte Provincial Capitol Grounds, <br/>
                Daet Philippines
              </span>
              <span className='text-2xl text-white w-fit'>
                Open Daily 9:00am-5:00pm, <br/>
                Monday- Friday,
              </span>
             
              </div>
          </div>
          
        </div>
        
      </div>
        
     
        
    </div>
    </>
  )
}

export default PublicFooter
