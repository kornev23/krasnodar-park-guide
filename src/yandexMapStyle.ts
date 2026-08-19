// Базовый спокойный стиль. Его можно заменить настройками из редактора стилей Яндекс Карт.
export const yandexMapStyle = [
  {
    tags: { any: ['transit_line'] },
    elements: 'geometry',
    stylers: [{ visibility: 'off' }],
  },
  {
    tags: { any: ['transit_line'] },
    elements: 'label',
    stylers: [{ visibility: 'off' }],
  },
  {
    tags: { any: ['poi'] },
    elements: 'label',
    stylers: [{ visibility: 'off' }],
  },
  {
    tags: { any: ['road'] },
    elements: 'label',
    stylers: [{ visibility: 'off' }],
  },
  {
    tags: { any: ['building'] },
    elements: 'geometry.fill',
    stylers: [{ color: '#e6e9e4' }, { saturation: -0.7 }],
  },
  {
    tags: { any: ['water'] },
    elements: 'geometry.fill',
    stylers: [{ color: '#b7dadd' }],
  },
]
