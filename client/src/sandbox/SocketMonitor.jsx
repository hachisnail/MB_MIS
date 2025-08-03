import { useEffect, useState } from 'react';
import { useSocketClient } from '../context/authContext';

const SocketMonitor = () => {
  const socketClient = useSocketClient();
  const [socketStats, setSocketStats] = useState([]);

useEffect(() => {
  if (socketClient) {
    console.log(socketClient);  // Check what socketClient is

    socketClient.on("socketStats", (stats) => {
      setSocketStats(stats);
    });

    socketClient.emit("requestSocketStats");
  }
}, [socketClient]);


  return (
    <div>
      <h2>Active Socket Stats</h2>
      <table>
        <thead>
          <tr>
            <th>Socket ID</th>
            <th>User ID</th>
            <th>Rooms</th>
            <th>Guest</th>
          </tr>
        </thead>
        <tbody>
          {socketStats.map((stat, index) => (
            <tr key={index}>
              <td>{stat.socketId}</td>
              <td>{stat.userId || 'Guest'}</td>
              <td>{stat.rooms.join(', ')}</td>
              <td>{stat.isGuest ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SocketMonitor;
