// Имитация задержки сети
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Имитация получения "сегодняшней" даты с сервера
export async function fetchToday() {
  await delay(600);

  // Имитация случайной ошибки (примерно в 10% случаев, можно проверить сценарий ошибки)
  if (Math.random() < 0.1) {
    throw new Error('Ошибка сервера при загрузке даты (500)');
  }

  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth(), // 0-индексный месяц, как на сервере по ТЗ
    year: now.getFullYear(),
  };
}

// Имитация получения слотов времени для выбранной даты
export async function fetchSlots({ day, month, year }) {
  await delay(500);

  // Имитация случайной ошибки (примерно в 15% случаев)
  if (Math.random() < 0.15) {
    throw new Error('Не удалось загрузить слоты (500)');
  }

  // Генерируем разный набор слотов в зависимости от дня, чтобы было видно обновление
  const allTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const slots = allTimes
    .filter((_, index) => (day + index) % 3 !== 0)
    .map((time) => ({ time }));

  return {
    date: { day, month, year },
    slots,
  };
}
