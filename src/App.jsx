import React, { useState, useEffect } from 'react';
import { buildCalendarGrid, isDateSelectable } from './data/date';
import { fetchToday, fetchSlots } from './api';

const MONTHS_NOMINATIVE = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const DAYS_OF_WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function App() {
  // Состояния для "сегодня" (инициализация с сервера)
  const [todayDate, setTodayDate] = useState(null);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState(null);

  // Состояния календаря и выбора
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Состояния для слотов времени
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  // 1. Загружаем сегодняшнюю дату при открытии страницы
  const loadToday = async () => {
    try {
      setIsLoadingToday(true);
      setTodayError(null);
      const data = await fetchToday();

      const serverToday = new Date(data.year, data.month, data.day);
      setTodayDate(serverToday);
      setCurrentMonth(data.month);
      setCurrentYear(data.year);
      setSelectedDay(data.day);
    } catch (err) {
      setTodayError('Не удалось загрузить календарь. Попробуйте ещё раз.');
    } finally {
      setIsLoadingToday(false);
    }
  };

  useEffect(() => {
    loadToday();
  }, []);

  // 2. Загружаем слоты при изменении выбранной даты (с защитой от гонки запросов)
  useEffect(() => {
    if (!selectedDay || !todayDate) return;

    let isCancelled = false;

    async function loadSlots() {
      try {
        setIsLoadingSlots(true);
        setSlotsError(null);
        const data = await fetchSlots({
          day: selectedDay,
          month: currentMonth,
          year: currentYear,
        });

        if (!isCancelled) {
          setSlots(data.slots);
        }
      } catch (err) {
        if (!isCancelled) {
          setSlotsError('Ошибка загрузки слотов. Попробуйте выбрать дату снова.');
          setSlots([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();
    return () => {
      isCancelled = true;
    };
  }, [selectedDay, currentMonth, currentYear, todayDate]);

  // --- Обработчики событий ---
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
    setSelectedTime(null);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setSelectedTime(null);
  };

  const handleSlotClick = (time) => {
    setSelectedTime(time);
  };

  // --- Сценарий 1: Первичная загрузка или ошибка инициализации ---
  if (isLoadingToday) {
    return (
      <div className="booking-page">
        <p>Загрузка календаря...</p>
      </div>
    );
  }

  if (todayError) {
    return (
      <div className="booking-page">
        <p style={{ color: 'red' }}>{todayError}</p>
        <button onClick={loadToday}>Повторить</button>
      </div>
    );
  }

  const calendarGrid = buildCalendarGrid(currentYear, currentMonth);

  return (
    <div className="booking-page">
      {/* Шапка */}
      <header className="calendar-header">
        <button onClick={handlePrevMonth}>&lt;</button>
        <h2>{MONTHS_NOMINATIVE[currentMonth]} {currentYear}</h2>
        <button onClick={handleNextMonth}>&gt;</button>
      </header>

      {/* Сетка календаря */}
      <div className="calendar-grid">
        {DAYS_OF_WEEK.map((dayName, index) => (
          <div key={index} className="weekday-label">{dayName}</div>
        ))}

        {calendarGrid.map((day, index) => {
          const isSelectable = isDateSelectable(day, currentMonth, currentYear, todayDate);
          const isSelected = day === selectedDay;

          let dayClass = 'calendar-day';
          if (!isSelectable) dayClass += ' disabled';
          if (isSelected && isSelectable) dayClass += ' active';

          return (
            <button
              key={index}
              className={dayClass}
              disabled={!isSelectable}
              onClick={() => day && handleDayClick(day)}
            >
              {day || ''}
            </button>
          );
        })}
      </div>

      {/* Слоты времени */}
      <div className="time-slots">
        <h3>Доступные слоты</h3>

        {!selectedDay && <p>Выберите день в календаре</p>}

        {selectedDay && isLoadingSlots && <p>Загрузка слотов...</p>}

        {selectedDay && slotsError && (
          <p style={{ color: 'red' }}>{slotsError}</p>
        )}

        {selectedDay && !isLoadingSlots && !slotsError && (
          <div className="slots-list">
            {slots.length === 0 ? (
              <p>На этот день свободных слотов нет</p>
            ) : (
              slots.map((slot) => {
                const isTimeSelected = slot.time === selectedTime;
                return (
                  <button
                    key={slot.time}
                    className={`slot-btn ${isTimeSelected ? 'active' : ''}`}
                    onClick={() => handleSlotClick(slot.time)}
                  >
                    {slot.time}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Панель информации */}
      <footer className="booking-bottom-bar">
        <p>
          Выбранная дата:{' '}
          <strong>
            {selectedDay
              ? `${selectedDay} ${MONTHS_GENITIVE[currentMonth]} ${currentYear} года`
              : 'не выбрана'}
          </strong>
        </p>
        <p>
          Время: <strong>{selectedTime ? selectedTime : 'не выбрано'}</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
