import React from 'react';
import { isToday } from '../../utils/calendarUtils.js';

export default function CalendarDay({
  cell,
  dayEvents,
  isSelected,
  onSelectDate,
  onOpenCreateForDate,
  onDayClick,
}) {
  const { day, dateString, isCurrentMonth } = cell;
  const isCurrentDay = isToday(dateString);
  const hasEvents = dayEvents.length > 0;
  const isActive = isSelected || (isCurrentDay && !isSelected);

  const handleClick = () => {
    if (onDayClick) {
      onDayClick(dateString, dayEvents);
    } else {
      onSelectDate(dateString);
      if (!hasEvents) {
        onOpenCreateForDate(dateString);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${day} ${dateString}${hasEvents ? `, ${dayEvents.length} events` : ''}`}
      className={`group relative h-16 sm:h-20 p-2 flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer select-none ${
        !isCurrentMonth
          ? 'text-slate-300'
          : isSelected
          ? 'bg-orange-50/70 font-bold'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Day Number / Active Pill */}
      <div
        className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-xl transition-all ${
          isSelected
            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 font-bold'
            : isCurrentDay
            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 font-bold'
            : !isCurrentMonth
            ? 'text-slate-300'
            : 'text-slate-700 group-hover:text-slate-900'
        }`}
      >
        {day}
      </div>

      {/* Orange Event Indicator Dot(s) */}
      <div className="h-2 flex items-center justify-center gap-1 mt-1">
        {dayEvents.slice(0, 3).map((_, idx) => (
          <span
            key={idx}
            className={`w-1.5 h-1.5 rounded-full ${
              isSelected || isCurrentDay ? 'bg-orange-300' : 'bg-orange-500'
            }`}
          />
        ))}
        {dayEvents.length > 3 && (
          <span
            className={`text-[9px] font-bold leading-none ${
              isSelected || isCurrentDay ? 'text-orange-200' : 'text-orange-600'
            }`}
          >
            +{dayEvents.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

