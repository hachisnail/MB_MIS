import { useState, useEffect,useRef } from "react";
import SocketClient from "../../lib/socketClient";
import SearchBar from "../../components/modals/SearchBar"
import axiosClient from "../../lib/axiosClient";
const socketUrl = import.meta.env.VITE_SOCKET_URL;

const Logs = () => {
const [logs, setLogs] = useState([]);

  const socketRef = useRef(null);


const fetchLogs = async () => {
    try {
      const response = await axiosClient.get(`/auth/logs`, {
        withCredentials: true,
      });
      setLogs(response.data);
       console.log(response.data);
    } catch (err) {
      // setFlagsError("Failed to ferch users!");
    } finally {
      // setIsLoading(false);
    }
}
    
  useEffect(() => {
    fetchLogs();

    const socket = new SocketClient(socketUrl);
    socketRef.current = socket;

    const handleUserChange = (action, data) => {
      console.log(`Silent refresh triggered from socket: ${action}`, data);
      fetchLogs();

    };

    socket.onDbChange("logs", "*", handleUserChange);

    return () => {
      socket.offDbChange("logs", "*", handleUserChange);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full h-full pt-5 max-w-[137rem] 1xl:max-h-[69rem] 2xl:max-h-[81rem] 3xl:max-w-[175rem] 3xl:max-h-[88rem] overflow-scroll">

      <div className='w-full h-full flex flex-col gap-y-[2rem]'> 
        <div className='w-full h-fit flex'>
          {/* header with searchbar */}
          <SearchBar theme='dark'/>


        </div>

        <div className="w-full h-full flex flex-col justify-between">
          <div className="w-full h-fit grid grid-cols-6">
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">ID</span>
            </div>
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">User</span>
            </div>
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Timestamp</span>
            </div>
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Tab</span>
            </div>
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Action</span>
            </div>
            <div className="h-10 border-gray-600 flex pl-5 items-center border-r-1 col-span-1">
              <span className="text-2xl ">Description</span>
            </div>

            
          </div>

          <div className="w-full h-[61rem] border-t-1 border-gray-600">

          </div>

        </div>
      </div>

      
    </div>
  )
}

export default Logs
