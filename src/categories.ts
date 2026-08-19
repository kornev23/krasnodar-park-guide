export const categories = [
  { id: 'landmark', title: 'Достопримечательность', icon: '✦', color: '#315f48' },
  { id: 'art', title: 'Арт-объект', icon: '◈', color: '#725b99' },
  { id: 'photo', title: 'Фотолокация', icon: '◌', color: '#b8665d' },
  { id: 'nature', title: 'Сад и природа', icon: '❋', color: '#5a8b5d' },
  { id: 'food', title: 'Кафе и рестораны', icon: '☕', color: '#9b6d3c' },
  { id: 'entrance', title: 'Вход и транспорт', icon: '↗', color: '#47758a' },
  { id: 'service', title: 'Сервисы', icon: '●', color: '#67757c' },
  { id: 'activity', title: 'Активности', icon: '○', color: '#bd8558' },
] as const

export type CategoryId = (typeof categories)[number]['id']
