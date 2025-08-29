import { memo } from 'react';

const ScheduleItem = memo(({ tour, idx, formatTimeTo12H }) => {
    // Check if this is a flexible time appointment
    const isFlexibleTime = tour.startTime === "Flexible" || tour.hasFlexibleTime;

    return (
        <div
            className={`
        ${idx % 2 === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}
        p-3 rounded-lg flex items-center justify-between
      `}
        >
            <div className="flex items-center flex-grow">
                <div
                    className={`
            ${idx % 2 === 0 ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-800'}
            px-3 py-1.5 rounded mr-3 text-sm
          `}
                >
                    {isFlexibleTime
                        ? "Flexible"
                        : `${formatTimeTo12H(tour.startTime)}-${formatTimeTo12H(tour.endTime)}`
                    }
                </div>
                <div className="flex-grow">
                    <div className="font-medium">
                        {tour.organizer || 'No Name'}
                    </div>
                    <div className="text-sm truncate max-w-[150px]">
                        {tour.title}
                    </div>
                    {tour.numPeople && (
                        <div className="text-sm">{tour.numPeople}</div>
                    )}
                </div>
            </div>
            {tour.isDone && (
                <div className="bg-green-500 text-xs px-2 py-1 rounded whitespace-nowrap">
                    tour done
                </div>
            )}
        </div>
    );
});

ScheduleItem.displayName = 'ScheduleItem';

export default ScheduleItem;
