// src/components/DayScheduler.jsx

import React from 'react';
import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';

// ---------------- UTILITY FUNCTIONS ----------------
function timeStringToMinutes(str) {
    const [hourStr, minuteStr] = str.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10) || 0;
    return hour * 60 + minute;
}

function formatTimeTo12H(str) {
    let [hour, minute] = str.split(':');
    hour = parseInt(hour, 10);
    minute = parseInt(minute, 10) || 0;

    const suffix = hour >= 12 ? 'pm' : 'am';
    const normalized = hour % 12 || 12;
    const minuteStr = minute.toString().padStart(2, '0');
    return `${normalized}:${minuteStr}${suffix}`;
}

function eventsOverlap(a, b) {
    return a.start < b.end && b.start < a.end;
}

// Safely build a YYYY-MM-DD string from a Date object (no UTC offset).
function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// ---------------- DAY SCHEDULER ----------------
const DayScheduler = ({
    appointments,
    selectedDate,
    onSelectAppointment,
    selectedAppointment,
    isLoading
}) => {
    // Convert `selectedDate` to local date string
    const selectedDateStr = getLocalDateString(selectedDate);

    // Add debugging logs
    console.log("DayScheduler Debug:");
    console.log("- Selected Date String:", selectedDateStr);
    console.log("- Total appointments received:", appointments.length);
    console.log("- Appointments data:", appointments);

    // Filter only events that match the selectedDate (by string comparison)
    const filteredEvents = appointments.filter((apt) => {
        console.log(`- Checking appointment: ${apt.id}, date: ${apt.date}, matches: ${apt.date === selectedDateStr}`);
        return apt.date === selectedDateStr;
    });

    console.log("- Filtered events count:", filteredEvents.length);
    console.log("- Filtered events:", filteredEvents);

    // Our day runs from 7:00am to 6:00pm
    const dayStart = 7 * 60;
    const dayEnd = 18 * 60;
    const totalMinutes = dayEnd - dayStart;

    // Convert appointments to structured data
    const events = filteredEvents.map((apt) => {
        const start = timeStringToMinutes(apt.startTime);
        const end = timeStringToMinutes(apt.endTime);
        return { ...apt, start, end };
    });

    // Sort events by start time
    events.sort((a, b) => a.start - b.start);

    // 1) Build "clusters" of events that overlap in time
    events.forEach((e) => {
        e.clusterId = -1;
    });
    let clusterIndex = 0;

    for (let i = 0; i < events.length; i++) {
        if (events[i].clusterId === -1) {
            const stack = [events[i]];
            events[i].clusterId = clusterIndex;
            while (stack.length > 0) {
                const current = stack.pop();
                for (let j = 0; j < events.length; j++) {
                    if (
                        events[j].clusterId === -1 &&
                        eventsOverlap(current, events[j])
                    ) {
                        events[j].clusterId = clusterIndex;
                        stack.push(events[j]);
                    }
                }
            }
            clusterIndex++;
        }
    }

    // 2) For each cluster, assign sub-lanes so overlapping events share width
    const clusterCount = clusterIndex;
    for (let c = 0; c < clusterCount; c++) {
        const clusterEvents = events.filter((e) => e.clusterId === c);
        clusterEvents.sort((a, b) => a.start - b.start);

        const lanes = [];
        for (const ev of clusterEvents) {
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                const lane = lanes[i];
                const lastInLane = lane[lane.length - 1];
                if (ev.start >= lastInLane.end) {
                    lane.push(ev);
                    placed = true;
                    break;
                }
            }
            if (!placed) lanes.push([ev]);
        }

        lanes.forEach((lane, laneIndex) => {
            lane.forEach((ev) => {
                ev.laneIndex = laneIndex;
                ev.laneCount = lanes.length;
            });
        });
    }

    const handleMouseEnter = (e) => {
        const parentRect = e.currentTarget.parentNode.getBoundingClientRect();
        const hoverCard = e.currentTarget.querySelector('.hover-card');
        if (!hoverCard) return;

        hoverCard.style.removeProperty('top');
        hoverCard.style.removeProperty('left');
        hoverCard.style.removeProperty('transform-origin');

        setTimeout(() => {
            const hoverRect = hoverCard.getBoundingClientRect();

            // -- RIGHT OVERFLOW --
            if (hoverRect.right > parentRect.right) {
                const overflowRight = hoverRect.right - parentRect.right + 8;
                hoverCard.style.left = `-${overflowRight}px`;
                hoverCard.style.transformOrigin = 'top right';
            }

            // -- LEFT OVERFLOW --
            if (hoverRect.left < parentRect.left) {
                const overflowLeft = parentRect.left - hoverRect.left + 8;
                hoverCard.style.left = `${overflowLeft}px`;
                hoverCard.style.transformOrigin = 'top left';
            }

            // -- BOTTOM OVERFLOW --
            if (hoverRect.bottom > parentRect.bottom) {
                const overflowBottom = hoverRect.bottom - parentRect.bottom + 8;
                hoverCard.style.top = `-${overflowBottom}px`;
            }

            // -- TOP OVERFLOW --
            if (hoverRect.top < parentRect.top) {
                const overflowTop = parentRect.top - hoverRect.top + 8;
                hoverCard.style.top = `${overflowTop}px`;
            }
        }, 10);
    };

    const handleMouseLeave = (e) => {
        const hoverCard = e.currentTarget.querySelector('.hover-card');
        if (!hoverCard) return;

        hoverCard.style.removeProperty('top');
        hoverCard.style.removeProperty('left');
        hoverCard.style.removeProperty('transform-origin');
    };

    return (
        <div className="w-full h-full relative bg-gray-200 overflow-hidden">
            {/* Left timeline ruler */}
            <div
                className="absolute left-0 top-0 bottom-0 bg-gray-900 text-white z-10 rounded-md"
                style={{ width: '4.5rem' }}
            >
                {Array.from({ length: (dayEnd - dayStart) / 60 }).map((_, idx) => {
                    const hour = dayStart / 60 + idx;
                    return (
                        <div
                            key={hour}
                            className="relative border-b border-gray-700"
                            style={{ height: `${100 / ((dayEnd - dayStart) / 60)}%` }}
                        >
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                {formatTimeTo12H(`${hour.toString().padStart(2, '0')}:00`)}
                            </span>
                        </div>
                    );
                })}
                <div
                    className="relative"
                    style={{
                        height: `${100 / ((dayEnd - dayStart) / 60)}%`
                    }}
                >
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {formatTimeTo12H(`${(dayEnd / 60).toString().padStart(2, '0')}:00`)}
                    </span>
                </div>
            </div>

            {/* Main scheduler area */}
            <div
                className="absolute top-0 bottom-0 right-0"
                style={{ left: '4.5rem' }}
            >
                {/* Hour lines */}
                {Array.from({ length: (dayEnd - dayStart) / 60 + 1 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute left-0 w-full border-t border-gray-300 rounded-md"
                        style={{
                            top: `calc(${(i / ((dayEnd - dayStart) / 60)) * 100}%)`
                        }}
                    />
                ))}

                {/* Empty state message when no events */}
                {events.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white bg-opacity-80 rounded-lg p-6 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900">No events scheduled</h3>
                            <p className="text-gray-600 mt-1">There are no schedules or appointments for this day.</p>
                        </div>
                    </div>
                )}

                {/* Render each event */}
                {events.map((ev) => {
                    const startOffset = ev.start - dayStart;
                    const endOffset = ev.end - dayStart;
                    const top = (startOffset / totalMinutes) * 100;
                    const height = ((endOffset - startOffset) / totalMinutes) * 100;

                    const width = `${100 / ev.laneCount}%`;
                    const left = `${(ev.laneIndex / ev.laneCount) * 100}%`;

                    // Highlight if selected
                    const isSelected = selectedAppointment && selectedAppointment.id === ev.id;

                    return (
                        <div
                            key={ev.id}
                            onClick={() => {
                                if (selectedAppointment && selectedAppointment.id === ev.id) {
                                    onSelectAppointment(null);
                                } else {
                                    onSelectAppointment(ev);
                                }
                            }}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            className="group absolute p-1 cursor-pointer"
                            style={{
                                top: `${top}%`,
                                height: `${height}%`,
                                left,
                                width
                            }}
                        >
                            {/* Normal (non-hover) view - SIMPLIFIED */}
                            <div
                                className={`
                  w-full h-full
                  border ${isSelected ? 'border-white bg-gray-500 text-white' : 'border-gray-300 bg-white'}
                  rounded shadow-sm p-2
                  transition-all overflow-hidden
                  group-hover:opacity-0
                  ${ev.isAppointment ? 'border-l-4 border-l-blue-500' : ''}
                  ${ev.isSchedule && ev.availability === 'EXCLUSIVE' ? 'border-l-4 border-l-red-500' : ''}
                  ${ev.isSchedule && ev.availability === 'SHARED' ? 'border-l-4 border-l-green-500' : ''}
                `}
                            >
                                {/* Check if duration is 15 minutes or less */}
                                {(timeStringToMinutes(ev.endTime) - timeStringToMinutes(ev.startTime)) <= 15 ? (
                                    // Compact row layout for very short events
                                    <div className="flex items-center justify-between h-full space-x-2">
                                        {/* Title and badge in middle */}
                                        <div className="flex-1 min-w-0 flex items-center space-x-2">
                                            <span className="font-bold text-xs truncate">
                                                {ev.title}
                                            </span>
                                            <span className={`
                        text-[10px] px-1.5 py-0.5 rounded-full
                        ${ev.isAppointment ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                      `}>
                                                {ev.isAppointment ? 'Appt' : 'Sched'}
                                            </span>
                                        </div>
                                        <p className={`absolute bottom-1 right-2 text-[10px] sm:text-xs ${isSelected ? '' : 'text-gray-400'}`}>
                                            {formatTimeTo12H(ev.startTime)} - {formatTimeTo12H(ev.endTime)}
                                        </p>
                                    </div>
                                ) : (
                                    // Original layout for longer events
                                    <div className="pl-2 h-full flex flex-col justify-between relative">
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-xs sm:text-sm truncate">
                                                {ev.title}
                                            </p>

                                            {ev.isAppointment && ev.organizer && (
                                                <p className="text-[10px] sm:text-xs truncate">
                                                    Visitor: {ev.organizer}
                                                </p>
                                            )}

                                            {ev.isAppointment && ev.numPeople && (
                                                <p className="text-[10px] sm:text-xs truncate">
                                                    {ev.numPeople}
                                                </p>
                                            )}

                                            <p className={`text-[10px] sm:text-xs truncate ${ev.isAppointment ? 'text-blue-500' : 'text-green-500'}`}>
                                                {ev.isAppointment ? 'Appointment' : 'Schedule'}
                                            </p>
                                        </div>

                                        <p className={`absolute bottom-1 right-2 text-[10px] sm:text-xs ${isSelected ? '' : 'text-gray-400'}`}>
                                            {formatTimeTo12H(ev.startTime)} - {formatTimeTo12H(ev.endTime)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Hover (expanded) view */}
                            <div
                                className={`
    hover-card
    absolute top-0 left-0 w-[20rem] max-w-[90vw]
    min-h-[8rem]
    border ${isSelected ? 'border-white' : 'border-gray-300'}
    rounded-lg shadow-2xl p-4
    flex flex-col justify-between
    z-50 opacity-0 group-hover:opacity-100
    transition-all duration-300 ease-in-out
    ${isSelected ? 'bg-gray-500 text-white' : 'bg-white'}
    origin-top-left
    ${ev.isAppointment ? 'border-l-4 border-l-blue-500' : ''}
    ${ev.isSchedule && ev.availability === 'EXCLUSIVE' ? 'border-l-4 border-l-red-500' : ''}
    ${ev.isSchedule && ev.availability === 'SHARED' ? 'border-l-4 border-l-green-500' : ''}
  `}
                                style={{
                                    width: '20rem',
                                    height: 'auto',
                                    minHeight: '8rem',
                                }}
                            >

                                <div className="pl-3 flex-1 flex flex-col justify-between relative">
                                    {/* Content area with proper spacing */}
                                    <div className="flex-1 overflow-visible pb-8">
                                        {/* Title with proper formatting */}
                                        <p className="font-bold text-base mb-1 break-words">{ev.title}</p>

                                        {/* For appointments only, show visitor information */}
                                        {ev.isAppointment && ev.organizer && (
                                            <p className="text-sm mb-1 break-words">
                                                <span className="font-medium">Visitor:</span> {ev.organizer}
                                            </p>
                                        )}

                                        {/* People count only for appointments */}
                                        {ev.isAppointment && ev.numPeople && (
                                            <p className="text-sm mb-2 break-words">{ev.numPeople}</p>
                                        )}

                                        {/* Type badges - more detailed in hover mode */}
                                        <div className="mt-1 mb-1 flex flex-wrap gap-1">
                                            {ev.isAppointment && (
                                                <>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium inline-block mb-1">
                                                        <i className="fas fa-calendar-check mr-1"></i> Appointment
                                                    </span>
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium inline-block mb-1">
                                                        <i className="fas fa-users mr-1"></i> Shared
                                                    </span>
                                                </>
                                            )}

                                            {ev.isSchedule && (
                                                <>
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium inline-block mb-1">
                                                        <i className="fas fa-calendar mr-1"></i> Schedule
                                                    </span>
                                                    <span className={`px-2 py-1 ${ev.availability === 'EXCLUSIVE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} rounded-md text-xs font-medium inline-block mb-1`}>
                                                        <i className={`fas ${ev.availability === 'EXCLUSIVE' ? 'fa-lock' : 'fa-users'} mr-1`}></i>
                                                        {ev.availability === 'EXCLUSIVE' ? 'Exclusive' : 'Shared'}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Description with limit to prevent overflow */}
                                        {ev.description && (
                                            <div className="mt-2">
                                                <p className="text-sm break-words text-gray-600 max-h-16 overflow-y-auto">
                                                    {ev.description.length > 100 ? `${ev.description.substring(0, 100)}...` : ev.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time at the bottom */}
                                    <p className={`absolute bottom-0 right-3 text-xs sm:text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                        {formatTimeTo12H(ev.startTime)} - {formatTimeTo12H(ev.endTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DayScheduler;
