import React, { useState, useEffect } from 'react';

const LiveClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-[#9590FF] mb-1">
                {formatTime(currentTime)}
            </div>
            <div className="text-xs text-gray-600 text-center">
                {formatDate(currentTime)}
            </div>
        </div>
    );
};

export default LiveClock;
