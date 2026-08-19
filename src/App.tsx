import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Bell, Bookmark, Car, ChevronRight, CircleHelp, Clock3, Compass, Crosshair, Heart, Layers, MapPin, Minus, Moon, Navigation, Plus, Search, Sparkles, Sun, Trees, X } from 'lucide-react'
import { yandexMapStyle } from './yandexMapStyle'
import type { CategoryId } from './categories'
import { supabase } from './lib/supabase'

declare global { interface Window { Telegram?: { WebApp?: { ready: () => void; expand: () => void; HapticFeedback?: { impactOccurred: (style: string) => void } } }; ymaps3?: any } }

type Place = { id: string; name: string; kind: string; category: CategoryId; time: string; x: number; y: number; icon: string; description: string; coordinates?: Coordinates }
type Coordinates = [number, number]

const demoPlaces: Place[] = [
  { id: 'japanese-garden', name: 'Японский сад', kind: 'Сад · тихая прогулка', category: 'nature', time: '12 мин', x: 58, y: 28, icon: '⛩️', description: 'Камни, вода и сезонные растения. Лучше всего утром.' },
  { id: 'mirror-labyrinth', name: 'Зеркальный лабиринт', kind: 'Архитектура', category: 'art', time: '6 мин', x: 36, y: 50, icon: '◈', description: 'Один из самых фотогеничных объектов парка.' },
  { id: 'amphitheater', name: 'Амфитеатр', kind: 'События · искусство', category: 'activity', time: '9 мин', x: 73, y: 59, icon: '◒', description: 'Открытая площадка с концертами и показами.' },
  { id: 'krasnodar-cafe', name: 'Кафе «Краснодар»', kind: 'Ресторан · европейская', category: 'food', time: '4 мин', x: 46, y: 73, icon: '☕', description: 'Завтраки, десерты и терраса с видом на парк.' },
]

const routes = [
  ['Первое посещение', 'Главное за 1,5 часа', '✦'],
  ['Для свидания', 'Красивый свет и тихие места', '♡'],
  ['Фотолокации', '8 точек для кадра', '◌'],
  ['На час', 'Быстрый маршрут', '↗'],
]

export default function App() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<'guide' | 'map' | 'saved'>('guide')
  const [selected, setSelected] = useState<Place | null>(null)
  const [places, setPlaces] = useState<Place[]>(demoPlaces)
  const [saved, setSaved] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [locating, setLocating] = useState(false)
  const [location, setLocation] = useState(false)
  const [locationError, setLocationError] = useState(false)
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null)
  const [dark, setDark] = useState(false)
  const [mapMode, setMapMode] = useState<'guide' | 'details'>('details')
  const [mapView, setMapView] = useState({ scale: 1, x: 0, y: 0 })
  const mapRef = useRef<HTMLElement>(null)
  const gestureRef = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null)

  useEffect(() => {
    document.documentElement.style.setProperty('--tg-bg', '#f5f5f1')
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    const timer = window.setTimeout(() => setReady(true), 1250)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('places')
      .select('id,title,description,category_id,latitude,longitude,place_categories(title,icon)')
      .eq('status', 'published')
      .order('created_at')
      .then(({ data, error }) => {
        if (error || !data?.length) return
        const livePlaces = data.map((place: any): Place => ({
          id: place.id,
          name: place.title,
          kind: place.place_categories?.title ?? 'Место в парке',
          category: place.category_id as CategoryId,
          time: 'Смотрите на карте',
          x: 50,
          y: 50,
          icon: place.place_categories?.icon ?? '●',
          description: place.description,
          coordinates: [place.longitude, place.latitude],
        }))
        setPlaces(livePlaces)
      })
  }, [])

  const filtered = useMemo(() => places.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.kind.toLowerCase().includes(query.toLowerCase())), [query])
  const toggleSaved = (id: number) => setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const requestLocation = () => {
    setLocating(true)
    setLocationError(false)
    if (!navigator.geolocation) { setLocationError(true); setLocating(false); return }
    navigator.geolocation.getCurrentPosition(
      position => { setUserCoordinates([position.coords.longitude, position.coords.latitude]); setLocation(true); setLocating(false) },
      () => { setLocationError(true); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }
  const changeScale = (delta: number) => setMapView(view => ({ ...view, scale: Math.min(3, Math.max(1, Number((view.scale + delta).toFixed(2)))) }))
  const resetMap = () => setMapView({ scale: 1, x: 0, y: 0 })
  const clampPosition = (x: number, y: number, scale: number) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return { x, y }
    const maxX = ((scale - 1) * rect.width) / 2
    const maxY = ((scale - 1) * rect.height) / 2
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }
  const startMapDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    gestureRef.current = { x: event.clientX, y: event.clientY, viewX: mapView.x, viewY: mapView.y }
  }
  const dragMap = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gestureRef.current || mapView.scale === 1) return
    const start = gestureRef.current
    const position = clampPosition(start.viewX + event.clientX - start.x, start.viewY + event.clientY - start.y, mapView.scale)
    setMapView(view => ({ ...view, ...position }))
  }
  const navigate = (p: Place) => window.open(`https://yandex.ru/maps/?rtext=~45.0459,38.9662&rtt=mt`, '_blank')

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
  }, [dark])

  if (!ready) return <div className="splash"><div className="splash-orbit"><Trees size={32}/></div><p>Гид по парку</p><span>КРАСНОДАР</span></div>

  return <main className="app-shell">
    <header><div><p className="eyebrow">ДОБРЫЙ ДЕНЬ</p><h1>Парк <em>Краснодар</em></h1></div><button className="icon-button"><Bell size={19}/><i /></button></header>

    {!location && <section className="location-prompt glass"><div className="location-icon"><Crosshair size={20}/></div><div><b>С чего начнём прогулку?</b><p>{locationError ? 'Не удалось определить место — проверьте доступ' : 'Подберём маршрут по вашему старту'}</p></div><button onClick={requestLocation}>{locating ? 'Ищем…' : 'Геолокация'}</button></section>}

    {tab === 'guide' && <>
      <section className="hero">
        <div className="hero-glow"/><p className="eyebrow">ПЕРСОНАЛЬНЫЙ ГИД</p><h2>Сегодня — ваш<br/><em>идеальный маршрут.</em></h2><p className="hero-text">Выберите старт, а мы покажем парк в вашем ритме.</p>
        <div className="starts"><button onClick={requestLocation}><Crosshair/>Я здесь</button><button><Car/>На машине</button><button><MapPin/>От Панорамы</button><button><Navigation/>От парковки</button></div>
      </section>
      <section className="section-heading"><div><p className="eyebrow">ПРОВЕРЕННЫЕ СЦЕНАРИИ</p><h3>Куда отправимся?</h3></div><button className="text-button" onClick={() => setTab('map')}>Все <ChevronRight size={15}/></button></section>
      <section className="route-scroll">{routes.map(([title, sub, symbol], i) => <button className={`route-card r${i}`} key={title} onClick={() => setTab('map')}><span>{symbol}</span><b>{title}</b><small>{sub}</small><ChevronRight size={18}/></button>)}</section>
      <section className="section-heading nearby-head"><div><p className="eyebrow">РЯДОМ С ВАМИ</p><h3>Стоит заглянуть</h3></div><button className="round-arrow" onClick={() => setTab('map')}><ChevronRight size={20}/></button></section>
      <section className="place-list">{places.slice(0, 2).map(p => <PlaceRow key={p.id} p={p} saved={saved.includes(p.id)} onSave={() => toggleSaved(p.id)} onOpen={() => { setSelected(p); setTab('map') }}/>)}</section>
    </>}

    {tab === 'map' && <>
      <div className="map-top"><div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти место или маршрут"/><button onClick={() => setQuery('')}><X size={16}/></button></div><button className="filter"><CircleHelp size={20}/></button></div>
      <div className="map-mode-switch" aria-label="Режим карты"><button className={mapMode === 'guide' ? 'active' : ''} onClick={() => setMapMode('guide')}>Карта гида</button><button className={mapMode === 'details' ? 'active' : ''} onClick={() => setMapMode('details')}><Layers size={14}/> Яндекс Карты</button></div>
      {mapMode === 'guide' ? <section ref={mapRef} className="map map-illustrated" onPointerDown={startMapDrag} onPointerMove={dragMap} onPointerUp={() => { gestureRef.current = null }} onPointerCancel={() => { gestureRef.current = null }} onWheel={event => { event.preventDefault(); changeScale(event.deltaY > 0 ? -0.2 : 0.2) }}><div className="map-canvas" style={{ transform: `translate(${mapView.x}px, ${mapView.y}px) scale(${mapView.scale})` }}><img className="map-image" src={`${import.meta.env.BASE_URL}park-map.png`} alt="Схема парка Краснодар"/>{filtered.map(p => <button key={p.id} className={`pin ${selected?.id === p.id ? 'active' : ''}`} style={{left: `${p.x}%`, top: `${p.y}%`}} onClick={() => setSelected(p)}><span>{p.icon}</span></button>)}<div className="map-label">ПАРК КРАСНОДАР</div></div></section> : <YandexDetailMap userCoordinates={userCoordinates} places={places} onPlaceSelect={setSelected}/>} 
      <div className="map-tools">{mapMode === 'guide' && <><button title="Приблизить" onClick={() => changeScale(0.25)}><Plus size={19}/></button><button title="Отдалить" onClick={() => changeScale(-0.25)}><Minus size={19}/></button><button title="Сбросить карту" onClick={resetMap}><Compass size={19}/></button></>}<button title="Моё местоположение" onClick={requestLocation}><Crosshair size={19}/></button><button onClick={() => setDark(v => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></div>
      <section className="map-sheet glass">{selected ? <><div className="sheet-handle"/><div className="sheet-head"><div className="place-icon">{selected.icon}</div><div><p className="eyebrow">{selected.kind}</p><h3>{selected.name}</h3><p className="walk-time"><Clock3 size={14}/> Пешком {selected.time}</p></div><button onClick={() => toggleSaved(selected.id)} className="save"><Heart size={20} fill={saved.includes(selected.id) ? 'currentColor' : 'none'}/></button></div><p className="place-description">{selected.description}</p><button className="navigate" onClick={() => navigate(selected)}><Navigation size={18}/> Дойти сюда <span>· {selected.time}</span></button></> : <><div className="sheet-handle"/><p className="eyebrow">ИНТЕРАКТИВНАЯ КАРТА</p><h3>Выберите точку на карте</h3><p className="place-description">Мы подскажем, что рядом и как удобнее пройти.</p></>}</section>
    </>}

    {tab === 'saved' && <><section className="saved-hero"><Bookmark size={25}/><p className="eyebrow">ВАША КОЛЛЕКЦИЯ</p><h2>Сохранённые <em>места</em></h2></section><section className="place-list">{saved.length ? places.filter(p => saved.includes(p.id)).map(p => <PlaceRow key={p.id} p={p} saved onSave={() => toggleSaved(p.id)} onOpen={() => {setSelected(p); setTab('map')}}/>) : <div className="empty"><Heart size={27}/><b>Здесь появятся ваши места</b><p>Сохраняйте точки, чтобы вернуться к ним в следующий раз.</p></div>}</section></>}

    <nav><button className={tab === 'guide' ? 'selected' : ''} onClick={() => setTab('guide')}><Sparkles/><span>Для вас</span></button><button className={tab === 'map' ? 'selected' : ''} onClick={() => setTab('map')}><Compass/><span>Карта</span></button><button className={tab === 'saved' ? 'selected' : ''} onClick={() => setTab('saved')}><Bookmark/><span>Избранное</span></button></nav>
  </main>
}

function PlaceRow({ p, saved, onSave, onOpen }: {p: Place; saved: boolean; onSave: () => void; onOpen: () => void}) { return <article className="place-row"><button className="place-photo" onClick={onOpen}>{p.icon}</button><button className="place-data" onClick={onOpen}><p className="eyebrow">{p.kind}</p><h4>{p.name}</h4><small><Clock3 size={13}/> {p.time} пешком</small></button><button className={`heart ${saved ? 'filled' : ''}`} onClick={onSave}><Heart size={19} fill={saved ? 'currentColor' : 'none'}/></button></article> }

function YandexDetailMap({ userCoordinates, places, onPlaceSelect }: { userCoordinates: Coordinates | null; places: Place[]; onPlaceSelect: (place: Place) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
    if (!apiKey || !containerRef.current) { setError(true); return }
    let disposed = false
    let map: any
    const loadMap = async () => {
      try {
        if (!window.ymaps3) {
          await new Promise<void>((resolve, reject) => {
            const current = document.getElementById('yandex-maps-api') as HTMLScriptElement | null
            if (current) { current.addEventListener('load', () => resolve(), { once: true }); current.addEventListener('error', reject, { once: true }); return }
            const script = document.createElement('script')
            script.id = 'yandex-maps-api'
            script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`
            script.onload = () => resolve()
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        await window.ymaps3.ready
        if (disposed || !containerRef.current) return
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3
        map = new YMap(containerRef.current, { location: { center: userCoordinates ?? [38.9662, 45.0459], zoom: userCoordinates ? 17 : 15.4 }, type: 'map', zoomRounding: 'smooth' })
        map.addChild(new YMapDefaultSchemeLayer({ customization: yandexMapStyle }))
        map.addChild(new YMapDefaultFeaturesLayer({ zIndex: 1800 }))
        if (userCoordinates) {
          const dot = document.createElement('div')
          dot.className = 'yandex-user-dot'
          map.addChild(new YMapMarker({ coordinates: userCoordinates }, dot))
        }
        places.forEach(place => {
          if (!place.coordinates) return
          const marker = document.createElement('button')
          marker.className = 'yandex-place-marker'
          marker.type = 'button'
          marker.textContent = place.icon
          marker.setAttribute('aria-label', place.name)
          marker.onclick = () => onPlaceSelect(place)
          map.addChild(new YMapMarker({ coordinates: place.coordinates }, marker))
        })
      } catch { setError(true) }
    }
    void loadMap()
    return () => { disposed = true; map?.destroy?.() }
  }, [userCoordinates, places, onPlaceSelect])

  return <section className="map yandex-map">{error ? <div className="map-notice"><b>Подробная карта пока недоступна</b><p>Проверьте ключ Яндекс Карт и ограничение домена.</p></div> : <div ref={containerRef} className="yandex-map-host"/>}</section>
}
