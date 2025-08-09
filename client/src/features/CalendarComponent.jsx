import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';

const currentYear = new Date().getFullYear();

const PH_HOLIDAYS = [
  // 🇵🇭 Regular Holidays
  { date: `${currentYear}-01-01`, name: "New Year’s Day" },
  { date: `${currentYear}-04-09`, name: "Araw ng Kagitingan (Day of Valor)" },
  { date: `${currentYear}-05-01`, name: "Labor Day" },
  { date: `${currentYear}-06-12`, name: "Independence Day" },
  { date: `${currentYear}-11-30`, name: "Bonifacio Day" },
  { date: `${currentYear}-12-25`, name: "Christmas Day" },
  { date: `${currentYear}-12-30`, name: "Rizal Day" },
  // Movable Regular Holidays (update these dates yearly as needed)
  { date: `${currentYear}-04-17`, name: "Maundy Thursday" }, // 2025
  { date: `${currentYear}-04-18`, name: "Good Friday" },     // 2025
  { date: `${currentYear}-08-25`, name: "National Heroes Day" }, // 2025 (last Monday of August)

  // 📿 Special (Non-Working) Holidays
  { date: `${currentYear}-02-10`, name: "Chinese New Year" }, // 2025
  { date: `${currentYear}-02-25`, name: "EDSA People Power Anniversary" },
  { date: `${currentYear}-08-21`, name: "Ninoy Aquino Day" },
  { date: `${currentYear}-11-01`, name: "All Saints’ Day" },
  { date: `${currentYear}-11-02`, name: "All Souls’ Day (Special Working Holiday)" },
  { date: `${currentYear}-12-08`, name: "Feast of the Immaculate Conception" },
  { date: `${currentYear}-12-24`, name: "Christmas Eve (Special Working Holiday)" },
  { date: `${currentYear}-12-31`, name: "New Year’s Eve (Special Working Holiday)" },

  // 🕌 Islamic Holidays (Estimated)
  { date: `${currentYear}-03-31`, name: "Eid al-Fitr (estimated)" }, // 2025
  { date: `${currentYear}-06-06`, name: "Eid al-Adha (estimated)" }, // 2025
];

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_ORIGIN = BASE_URL.replace(/\/api$/, "");
const UPLOAD_PATH = `${SERVER_ORIGIN}/uploads/pictures/`; 

const Calendar = () => {
  const now = new Date();
  const [currentDate] = useState(now); 
  const [currentMonth] = useState(now.getMonth());
  const [currentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);


  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${SERVER_ORIGIN}/api/auth/public-articles`);
      // Group articles by date (YYYY-MM-DD)
      const eventsByDate = {};
      response.data.forEach(article => {
        console.log("Article:", article);
        if (!article.upload_date) return;
        const dateStr = article.upload_date.split('T')[0];
        if (!eventsByDate[dateStr]) {
          eventsByDate[dateStr] = [];
        }
        eventsByDate[dateStr].push(article);
      });
      setEvents(eventsByDate);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents({});
    }
  };

  // Calendar rendering helpers
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Get days from previous month
    const daysFromPrevMonth = firstDay;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    const days = [];
    
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push({
        day: i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month (to fill a 6-row grid)
    const totalDaysShown = 42; // 6 rows of 7 days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    for (let i = 1; days.length < totalDaysShown; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    const dateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    setSelectedDate(new Date(date.year, date.month, date.day));
    setSelectedEvents(events[dateStr] || []);
    setModalOpen(true);
  };

  // Check if a date is today
  const isToday = (date) => {
    return date.day === currentDate.getDate() && 
           date.month === currentDate.getMonth() && 
           date.year === currentDate.getFullYear();
  };

  const calendarDays = generateCalendarDays();

 const encodeId = (id, name) => {
  const encodedString = `${id}::${name}`;
  return btoa(encodedString);
};

  // Helper to check if a date is a PH holiday
  const getHoliday = (date) => {
    const dateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return PH_HOLIDAYS.find(h => h.date === dateStr);
  };

  return (
    <div className="w-full mx-auto md:px-4 py-8 flex flex-col gap-y-5">
      {/* Month Header */}
      <span className='text-8xl font-hina'>{monthNames[currentMonth]}</span>
      
      {/* Calendar Grid */}
      <div className="bg-white overflow-hidden shadow">
        {/* Calendar Header */}
        <div className="grid h-20 items-center grid-cols-7 bg-gray-900 text-white">
          {weekdays.map((day, index) => (
            <div key={index} className="py-2 h-full flex justify-center items-center text-center font-medium">
             <span className='text-xl font-semibold'>{day}</span> 
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
            const filteredEvents = (events[dateStr] || []).filter(
              event =>
                event.article_category &&
                ['exhibit', 'contests'].includes(event.article_category.toLowerCase()) // changed from 'contents'
            );
            const hasEvents = filteredEvents.length > 0;
            const isTodayDate = isToday(date);
            const holiday = getHoliday(date);

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-23 xl:h-28 border border-gray-200 p-2 cursor-pointer transition
                  ${!date.isCurrentMonth ? 'text-gray-400' : ''}
                  ${isTodayDate ? 'bg-[#e0c67d]' : ''}
                  ${hasEvents && !isTodayDate ? 'bg-yellow-100' : ''}
                  ${holiday ? 'bg-blue-100 border-blue-400' : ''}  // <-- light blue for holidays
                  hover:bg-gray-100
                `}
              >
                <span className={`text-sm ${isTodayDate ? 'font-bold' : ''}`}>
                  {date.day}
                </span>
                {/* Show holiday name if present */}
                {holiday && (
                  <div className="text-xs text-blue-600 font-bold truncate">{holiday.name}</div> // <-- blue text for holiday name
                )}
                {/* Show article titles if any */}
                {hasEvents && (
                  <div className="mt-1 space-y-1">
                    {filteredEvents.slice(0, 2).map((event, idx) => (
                      <div key={idx} className="text-xs truncate text-black font-semibold">
                        {event.title}
                      </div>
                    ))}
                    {filteredEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{filteredEvents.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          
          <div className="bg-white border-1 border-gray-400 w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {selectedDate?.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {/* Show holiday in modal title if present */}
                {selectedDate && (() => {
                  const modalDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                  const modalHoliday = PH_HOLIDAYS.find(h => h.date === modalDateStr);
                  return modalHoliday ? (
                    <span className="block text-red-600 text-base font-bold">{modalHoliday.name}</span>
                  ) : null;
                })()}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl cursor-pointer"></i>
              </button>
            </div>
            <div className="px-6 py-4">
              {selectedEvents.filter(
                event =>
                  event.article_category &&
                  ['exhibit', 'contests'].includes(event.article_category.toLowerCase()) // changed from 'contents'
              ).length === 0 ? (
                <p className="text-gray-500">No events for this date</p>
              ) : (
                <div className="space-y-4">
                  {selectedEvents
                    .filter(
                      event =>
                        event.article_category &&
                        ['exhibit', 'contests'].includes(event.article_category.toLowerCase()) // changed from 'contents'
                    )
                    .map((event, index) => (
                      <NavLink
                        key={index}
                        to={`/article/${encodeId(event.article_id, event.title)}`}
                        className="block border-b border-gray-200 pb-4 last:border-0 cursor-pointer hover:bg-gray-100 transition"
                        onClick={() => setModalOpen(false)}
                        title={event.title}
                      >
                        <h4 className="font-medium text-lg text-blue-700 underline">{event.title}</h4>
                        {event.article_category && (
                          <p className="text-gray-600 mt-1">{event.article_category}</p>
                        )}
                        {event.barangay && (
                          <p className="text-gray-600 mt-1">Barangay: {event.barangay}</p>
                        )}
                        {event.address && (
                          <p className="text-gray-600 mt-1">Municipality: {event.address}</p>
                        )}
                        {/* You can add more fields here if needed */}
                      </NavLink>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
