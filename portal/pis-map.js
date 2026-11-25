// ========================================
// PAWS MAPS (owner app and client app)
// ========================================
//
// One look for every map in both apps:
//   Daytime:  "Paws Blue" - soft blue streets, green parks, no business pins,
//             the walk drawn as an orange line with white paw prints.
//   Night:    "Night Walk" - dark map with a glowing amber route. It switches on
//             at sunset in Frisco and off at sunrise.
// A walk starts at a home marker; a walk that's happening ends in a pulsing dot.
//
// Walk maps on a visit screen are boxes with [data-pis-map-walk="<walk id>"]
// (live-hero.js puts them in the live and finished cards; the desktop Home banner
// has one during a walk). A box only loads
// once it is on screen (inside an open visit screen), keeps the same map when
// the screen redraws, and a live one adds new GPS points every few seconds
// until the screen is closed.
// ========================================

(() => {
    'use strict';
    if (window.PisMap) return;

    const LAT = 33.1507, LNG = -96.8236;   // Frisco, TX
    const DAY = { land: '#E9F0F8', route: '#F08A24', home: '#2C62C4', ring: '#FFFFFF', glyph: '#FFFFFF', end: '#FFFFFF' };
    const NIGHT = { land: '#14212D', route: '#FFB347', home: '#FFB347', ring: '#0F1A24', glyph: '#14212D', end: '#14212D' };

    // ---------- day or night (sunrise equation) ----------
    const rad = Math.PI / 180;
    function sunUpDown(n) {
        // n: whole days since Jan 1 2000; returns [sunrise, sunset] in ms
        const jStar = n - LNG / 360;
        const m = (357.5291 + 0.98560028 * jStar) % 360;
        const c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
        const l = (m + c + 180 + 102.9372) % 360;
        const transit = 2451545 + jStar + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * l * rad);
        const sinD = Math.sin(l * rad) * Math.sin(23.4397 * rad);
        const cosD = Math.sqrt(1 - sinD * sinD);
        const cosW = (Math.sin(-0.833 * rad) - Math.sin(LAT * rad) * sinD) / (Math.cos(LAT * rad) * cosD);
        const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / rad;
        const ms = j => (j - 2440587.5) * 86400000;
        return [ms(transit - w / 360), ms(transit + w / 360)];
    }
    function isNight(at = new Date()) {
        const forced = window.PisMap?.forceNight;
        if (typeof forced === 'boolean') return forced;
        const t = +at;
        const n = Math.round(t / 86400000 + 2440587.5 - 2451545);
        return ![n - 1, n, n + 1].some(k => { const [up, down] = sunUpDown(k); return t >= up && t < down; });
    }

    // ---------- map looks ----------
    const STYLE_DAY = [
        { elementType: 'geometry', stylers: [{ color: '#E9F0F8' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6A809A' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#F4F8FC' }, { weight: 3 }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#3F5A78' }] },
        { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#E1EAF4' }] },
        { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#E6EFF6' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#D2EAD8' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4E8A61' }] },
        { featureType: 'poi.park', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#D3E0ED' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7189A6' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#BCCFE2' }] },
        { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#C9D8E8' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#BBD8F0' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5E8FBF' }] }
    ];
    const STYLE_NIGHT = [
        { elementType: 'geometry', stylers: [{ color: '#14212D' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#7E93A8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#14212D' }, { weight: 3 }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#A9BACB' }] },
        { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#1A2A39' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#16301F' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4F8A66' }] },
        { featureType: 'poi.park', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#22364A' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1B2D3F' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7E93A8' }] },
        { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#2C465F' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#22384E' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#163450' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#5A84AD' }] }
    ];
    const looks = night => ({ styles: night ? STYLE_NIGHT : STYLE_DAY, backgroundColor: (night ? NIGHT : DAY).land });

    function create(element, extra = {}) {
        const night = isNight();
        const options = {
            mapTypeControl: false, streetViewControl: false, fullscreenControl: true, clickableIcons: false,
            keyboardShortcuts: false, gestureHandling: 'cooperative', ...extra, ...looks(night)
        };
        // the phone apps' web view can't do a real full screen for a map: no expand button there
        if (window.Capacitor?.isNativePlatform?.()) options.fullscreenControl = false;
        const map = new google.maps.Map(element, options);
        map.__pisNight = night;
        map.__pisRoutes = [];
        return map;
    }

    // Switch a map to day or night if the time has passed sunrise or sunset.
    function restyle(map) {
        if (!map?.setOptions) return false;
        const night = isNight();
        if (map.__pisNight === night) return false;
        map.__pisNight = night;
        map.setOptions(looks(night));
        (map.__pisRoutes || []).forEach(route => route.setNight(night));
        return true;
    }

    // ---------- route drawing ----------
    const PAW = 'M -1.7 1.2 a 1.7 1.4 0 1 0 3.4 0 a 1.7 1.4 0 1 0 -3.4 0 Z ' +
        'M -2.4 -1.3 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z ' +
        'M -1.3 -2.1 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z ' +
        'M -0.1 -2.1 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z ' +
        'M 1 -1.3 a 0.7 0.7 0 1 0 1.4 0 a 0.7 0.7 0 1 0 -1.4 0 Z';
    const svgIcon = (svg, size) => ({
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(size, size),
        anchor: new google.maps.Point(size / 2, size / 2)
    });
    const homeIcon = c => svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="${c.home}" stroke="${c.ring}" stroke-width="3"/><path d="M9.5 15.5 L15 10 L20.5 15.5 M11.5 14.3 V20 H18.5 V14.3" fill="none" stroke="${c.glyph}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`, 30);
    const endIcon = c => svgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="${c.end}" stroke="${c.route}" stroke-width="3.5"/></svg>`, 20);

    let NowDot = null;
    function nowDotClass() {
        if (NowDot) return NowDot;
        NowDot = class extends google.maps.OverlayView {
            constructor(position) {
                super();
                this.position = position;
                this.element = document.createElement('div');
                this.element.className = 'pis-map-now';
                this.element.setAttribute('aria-hidden', 'true');
            }
            onAdd() { this.getPanes().overlayLayer.appendChild(this.element); }
            draw() {
                const point = this.getProjection()?.fromLatLngToDivPixel(this.position);
                if (!point) return;
                this.element.style.left = `${point.x}px`;
                this.element.style.top = `${point.y}px`;
            }
            onRemove() { this.element.remove(); }
            move(position) { this.position = position; this.draw(); }
        };
        return NowDot;
    }

    const toPath = points => (points || [])
        .map(p => ({ lat: Number(p.latitude ?? p.lat), lng: Number(p.longitude ?? p.lng) }))
        .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0));

    function route(map, path, { live = false } = {}) {
        const g = google.maps;
        const line = new g.MVCArray(path.map(p => new g.LatLng(p.lat, p.lng)));
        const glow = new g.Polyline({ path: line, map, clickable: false, zIndex: 1 });
        const casing = new g.Polyline({ path: line, map, clickable: false, zIndex: 2 });
        const main = new g.Polyline({ path: line, map, clickable: false, zIndex: 3 });
        const home = new g.Marker({ map, clickable: false, zIndex: 5, title: 'Start' });
        const end = new g.Marker({ map, clickable: false, zIndex: 4, title: 'Finish' });
        let dot = null;
        let night = Boolean(map.__pisNight);

        function paint() {
            const c = night ? NIGHT : DAY;
            glow.setOptions({ visible: night, strokeColor: c.route, strokeOpacity: 0.28, strokeWeight: 15 });
            casing.setOptions({ visible: !night, strokeColor: '#FFFFFF', strokeOpacity: 1, strokeWeight: 11 });
            main.setOptions({
                strokeColor: c.route, strokeOpacity: 1, strokeWeight: night ? 5.5 : 6.5,
                icons: night ? [] : [{ icon: { path: PAW, fillColor: '#FFFFFF', fillOpacity: 1, strokeWeight: 0, scale: 1.15 }, offset: '14px', repeat: '28px' }]
            });
            home.setIcon(homeIcon(c));
            end.setIcon(endIcon(c));
            dot?.element.classList.toggle('is-night', night);
        }
        function place() {
            const count = line.getLength();
            home.setVisible(count > 0);
            if (count) home.setPosition(line.getAt(0));
            const last = count ? line.getAt(count - 1) : null;
            end.setVisible(Boolean(!live && last && count > 1));
            if (last) end.setPosition(last);
            if (live && last) {
                if (!dot) { const Dot = nowDotClass(); dot = new Dot(last); dot.element.classList.toggle('is-night', night); dot.setMap(map); }
                else dot.move(last);
            } else if (dot) { dot.setMap(null); dot = null; }
        }
        paint();
        place();
        const api = {
            add(points) { toPath(points).forEach(p => line.push(new g.LatLng(p.lat, p.lng))); place(); },
            setLive(value) { live = Boolean(value); place(); },
            setNight(value) { night = Boolean(value); paint(); },
            path: () => line.getArray(),
            remove() { [glow, casing, main, home, end].forEach(item => item.setMap(null)); dot?.setMap(null); }
        };
        map.__pisRoutes = [...(map.__pisRoutes || []), api];
        return api;
    }

    const FIT_MAX_ZOOM = 18;      // as close as a route view goes by itself (pinching in still goes closer)
    const boxSize = map => { const div = map.getDiv?.(); return div ? [div.clientWidth, div.clientHeight] : [0, 0]; };
    // has the box changed size since the map was last fitted to it? (a pixel or two doesn't count)
    const resized = map => { const [w, h] = boxSize(map), was = map.__pisFitSize; return !was || Math.abs(w - was[0]) > 24 || Math.abs(h - was[1]) > 24; };

    function fit(map, path, padding = 30, maxZoom = FIT_MAX_ZOOM) {
        const points = Array.isArray(path) ? path : path?.getArray?.() || [];
        if (!points.length) return;
        map.__pisFitSize = boxSize(map);
        if (points.length === 1) { map.setCenter(points[0]); if (map.getZoom?.() !== 17) map.setZoom(17); return; }
        const bounds = new google.maps.LatLngBounds();
        points.forEach(p => bounds.extend(p));
        // A short route used to zoom all the way in and then back out to a sensible distance, and on a live
        // walk that happened on every update: the map looked like it was jumping in and out. The zoom is
        // capped while fitting, so the map goes straight to where it will rest; the cap comes off once it
        // has settled, so pinching in closer still works.
        if (!('__pisZoomCap' in map)) map.__pisZoomCap = map.get?.('maxZoom') ?? null;
        map.setOptions({ maxZoom });
        map.fitBounds(bounds, padding);
        const lift = () => {
            if (!('__pisZoomCap' in map)) return;
            const cap = map.__pisZoomCap;
            delete map.__pisZoomCap;
            map.setOptions({ maxZoom: cap });
        };
        google.maps.event.addListenerOnce(map, 'idle', lift);
        clearTimeout(map.__pisCapTimer);
        map.__pisCapTimer = setTimeout(lift, 3000);       // in case the map never says it has settled
    }

    // Are any of these points outside the middle of what the map is showing (or about to walk off it)?
    function leaving(map, points) {
        if (!points.length) return false;
        const view = map.getBounds?.();
        if (!view) return true;
        const ne = view.getNorthEast(), sw = view.getSouthWest();
        const [w, h] = boxSize(map);
        const EDGE = 30;                                  // px; less than the room a fit leaves around the route
        const padLat = (ne.lat() - sw.lat()) * Math.min(0.3, EDGE / (h || 1)), padLng = (ne.lng() - sw.lng()) * Math.min(0.3, EDGE / (w || 1));
        return points.some(p => p.lat() > ne.lat() - padLat || p.lat() < sw.lat() + padLat || p.lng() > ne.lng() - padLng || p.lng() < sw.lng() + padLng);
    }

    // A whole walk on one map: home marker, route, end dot (or live dot).
    function drawWalk(element, points, { live = false, ...extra } = {}) {
        const path = toPath(points);
        element.innerHTML = '';
        const map = create(element, extra);
        const line = route(map, path, { live });
        fit(map, path);
        if (window.ResizeObserver) {
            // drawn before its box was on screen, or the box changed size: fit again (unless they moved the map)
            let moved = false;
            map.addListener?.('dragstart', () => { moved = true; });
            element.__pisWatcher?.disconnect();          // the same spot drawn again: one watcher, for the newest map
            const watcher = element.__pisWatcher = new ResizeObserver(() => {
                if (!element.isConnected) { watcher.disconnect(); return; }
                if (moved || !element.clientWidth || !resized(map)) return;
                fit(map, line.path());
            });
            watcher.observe(element);
        }
        return { map, route: line };
    }

    // ---------- styles for the boxes ----------
    const css = document.createElement('style');
    css.id = 'pis-map-css';
    css.textContent = `
        .pis-map-box { display: none; position: relative; height: 210px; margin: 0 0 8px; border-radius: 14px; overflow: hidden;
            border: 1px solid var(--live-line, #c7dbf7); background: ${DAY.land}; }
        .csd-overlay .pis-map-box, .vfm-body .pis-map-box { display: block; }
        .pis-map-box.is-night { background: ${NIGHT.land}; }
        .pis-map-canvas { position: absolute; inset: 0; }
        .pis-map-msg { position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 2; margin: 0 !important; padding: 8px 10px;
            border-radius: 10px; background: rgba(255,255,255,.94); color: #3f6595; font-size: 13px; font-weight: 700; line-height: 1.35; text-align: center; }
        .pis-map-box.is-empty .pis-map-msg { top: 50%; bottom: auto; transform: translateY(-50%); background: transparent; }
        .pis-map-box.is-night .pis-map-msg { background: rgba(20,33,45,.9); color: #c5d2df; }
        .pis-map-msg:empty { display: none; }
        .pis-map-now { position: absolute; width: 20px; height: 20px; margin: -10px 0 0 -10px; border-radius: 50%; box-sizing: border-box;
            background: ${DAY.route}; border: 3.5px solid #fff; box-shadow: 0 1px 4px rgba(15,40,70,.3); }
        .pis-map-now::before { content: ""; position: absolute; inset: -3.5px; border-radius: 50%; background: inherit; opacity: .45;
            animation: pisMapPulse 1.8s ease-out infinite; }
        .pis-map-now.is-night { background: ${NIGHT.route}; border-color: ${NIGHT.ring}; box-shadow: 0 0 12px rgba(255,179,71,.65); }
        @keyframes pisMapPulse { 0% { transform: scale(1); opacity: .45; } 100% { transform: scale(2.6); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .pis-map-now::before { animation: none; } }
    `;
    document.head.appendChild(css);

    // ---------- walk map boxes on visit screens ----------
    const boxes = new Map();       // walk id -> box state
    const seeds = new Map();       // walk id -> points already loaded elsewhere (the visit report)
    const POLL_MS = 6000;
    const db = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    const shown = el => el.isConnected && el.getClientRects().length > 0;

    function message(state, text) {
        const el = state.box.querySelector('.pis-map-msg');
        if (el && el.textContent !== text) el.textContent = text;
        state.box.classList.toggle('is-empty', !state.map);
    }

    async function fetchPoints(state) {
        const client = db();
        if (!client) throw new Error('No database connection');
        for (;;) {
            const { data, error } = await client.from('visit_walk_points')
                .select('sequence_number, latitude, longitude')
                .eq('walk_id', state.id).gt('sequence_number', state.seq)
                .order('sequence_number', { ascending: true }).limit(1000);
            if (error) throw error;
            if (!data?.length) break;
            addPoints(state, data);
            if (data.length < 1000) break;
        }
    }
    function addPoints(state, rows) {
        const fresh = rows.filter(row => row.sequence_number === undefined || Number(row.sequence_number) > state.seq);
        if (!fresh.length) return;
        fresh.forEach(row => { if (row.sequence_number !== undefined) state.seq = Math.max(state.seq, Number(row.sequence_number)); });
        const path = toPath(fresh);
        state.path.push(...path);
        if (state.route) state.route.add(path);
    }

    // How far the walk has gone according to the walk itself (client app). The walker's phone saves
    // route points first and the distance second, so distance without points means the points are
    // there but this app isn't being given them.
    function knownDistance(id) {
        try {
            if (typeof currentClientLiveWalks === 'undefined' || !currentClientLiveWalks?.values) return 0;
            for (const walk of currentClientLiveWalks.values()) if (Number(walk.id) === Number(id)) return Number(walk.distance_meters) || 0;
        } catch { /* not the client app */ }
        return 0;
    }
    function draw(state) {
        if (!state.path.length) {
            const withheld = state.live && state.loaded && knownDistance(state.id) > 15;
            if (withheld && !state.warned) { state.warned = true; console.warn('Walk map: the walk has distance but no route points could be read (database rule for visit_walk_points).'); }
            message(state, !state.live ? 'No route was recorded for this walk.'
                : withheld ? 'The route will show here when the walk is finished.'
                : 'The route shows up here once the walk gets going.');
            return;
        }
        if (!window.google?.maps) {
            message(state, 'Loading the map…');
            if ((state.waits = (state.waits || 0) + 1) < 40) setTimeout(() => draw(state), 500);
            else message(state, "The map couldn't load right now.");
            return;
        }
        if (!state.map) {
            const canvas = state.box.querySelector('.pis-map-canvas');
            state.map = create(canvas, { disableDefaultUI: true, fullscreenControl: true });
            state.route = route(state.map, [], { live: state.live });
            state.route.add(state.path);
            // once they move or zoom the map themselves, it stays where they put it
            const theirs = () => { state.moved = true; };
            // (one finger and a plain mouse wheel scroll the page, so those don't count)
            state.map.addListener('dragstart', theirs);
            state.map.addListener('dblclick', theirs);
            const early = { passive: true, capture: true };
            canvas.addEventListener('wheel', event => { if (event.ctrlKey || event.metaKey || document.fullscreenElement) theirs(); }, early);
            canvas.addEventListener('touchstart', event => { if (event.touches.length > 1) theirs(); }, early);
        } else {
            restyle(state.map);
        }
        state.box.classList.toggle('is-night', Boolean(state.map.__pisNight));
        message(state, '');
        if (!state.moved) follow(state);
    }

    // Keep the walk in the picture without the map jumping about: fit it once, then leave the map alone
    // until the walker nears the edge (or the box changes size). During a live walk the map then only
    // slides or zooms out, never back in; the finished walk gets one last fit of the whole route.
    function follow(state, noNewPoints = false) {
        if (!state.map || !state.route) return;           // the map didn't finish drawing: nothing to move
        const path = state.route.path();
        const fresh = noNewPoints ? [] : path.slice(state.seen || 0);
        if (!noNewPoints) state.seen = path.length;
        const [w, h] = boxSize(state.map);
        if (!w || !h) return;                             // not on screen yet
        const again = !state.fitted || resized(state.map);     // first time here, or a different size of box: a fresh fit
        if (!again && !leaving(state.map, fresh)) return;
        const closest = !again && state.live ? Math.min(FIT_MAX_ZOOM, state.map.getZoom() || FIT_MAX_ZOOM) : FIT_MAX_ZOOM;
        fit(state.map, path, state.live ? 44 : 30, closest);
        state.fitted = true;
    }

    async function load(state, afterThis = false) {
        if (state.busy) { if (afterThis) state.again = true; return; }   // afterThis: don't skip it, run it next
        state.busy = true;
        try {
            const seeded = seeds.get(state.id);
            if (seeded && state.seq < 0 && !state.live) { addPoints(state, seeded); seeds.delete(state.id); }
            else await fetchPoints(state);
            state.loaded = true;
            draw(state);
        } catch (error) {
            console.warn('Walk map:', error);
            if (!state.map) message(state, "The map couldn't load right now.");
        } finally {
            state.busy = false;
            if (state.again) { state.again = false; void load(state); }
        }
    }

    function stopPolling(state) { clearInterval(state.timer); state.timer = null; }
    function startPolling(state) {
        if (state.timer || !state.live) return;
        state.timer = setInterval(() => {
            if (!state.box.isConnected) { stopPolling(state); return; }
            if (document.hidden || !shown(state.box)) return;   // screen closed: stop drawing
            void load(state);
        }, POLL_MS);
    }

    function setUp(box, id, live) {
        box.dataset.pisReady = '1';
        box.innerHTML = '<div class="pis-map-canvas"></div><p class="pis-map-msg" role="status"></p>';
        const state = { id, box, live, seq: -1, path: [], map: null, route: null, timer: null, busy: false, moved: false };
        boxes.set(id, state);
        message(state, 'Loading the map…');
        void load(state);
        return state;
    }

    function scan() {
        document.querySelectorAll('[data-pis-map-walk]').forEach(box => {
            const id = Number(box.dataset.pisMapWalk);
            if (!id) return;
            const live = box.dataset.pisMapLive === '1';
            let state = boxes.get(id);
            if (state && state.box !== box) {
                const onTop = el => Boolean(el.closest('.csd-overlay:not([hidden]), .vfm:not([hidden])'));
                if (shown(state.box) && !(onTop(box) && !onTop(state.box))) return;   // already showing somewhere on screen
                // same map, no new map load (an open visit screen takes it from Home; it goes back when that closes)
                const looks = ['is-night', 'is-empty'].filter(c => state.box.classList.contains(c));
                if (state.box.isConnected) {
                    const spot = state.box.cloneNode(false);
                    spot.removeAttribute('data-pis-ready');
                    spot.classList.remove('is-night', 'is-empty');
                    state.box.replaceWith(spot);
                }
                state.box.className = box.className;    // the box takes the look of where it goes
                looks.forEach(c => state.box.classList.add(c));
                box.replaceWith(state.box);
            }
            if (!state) {
                if (!shown(box)) return;                 // only load what's on screen
                state = setUp(box, id, live);
            }
            if (state.live && !live) {
                // walk just finished: last points, then the finished look
                state.live = false;
                state.fitted = false;                    // one last fit, of the whole route
                stopPolling(state);
                state.route?.setLive(false);
                void load(state, true);
            }
            state.box.dataset.pisMapLive = state.live ? '1' : '0';
            if (state.live && state.box.isConnected) startPolling(state);
            if (state.map && shown(state.box) && restyle(state.map)) state.box.classList.toggle('is-night', state.map.__pisNight);
            // the same map shows on Home and on the visit screen, in boxes of different sizes
            // (and a map first drawn while its screen was closed gets its fit here)
            if (state.map && state.route && !state.moved && shown(state.box)) follow(state, true);
        });
        // keep a few maps for coming back; drop the oldest ones not on the page
        const off = [...boxes.values()].filter(s => !s.box.isConnected);
        off.forEach(stopPolling);
        off.slice(0, Math.max(0, off.length - 6)).forEach(s => { s.route?.remove(); boxes.delete(s.id); });
    }
    let queued = false;
    const queueScan = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; scan(); }); };
    new MutationObserver(queueScan).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { queueScan(); boxes.forEach(s => { if (s.live && shown(s.box)) void load(s); }); } });

    // ---------- every existing map gets the new look ----------
    if (typeof window.renderClientGoogleWalkRoute === 'function') {
        const original = window.renderClientGoogleWalkRoute;
        window.renderClientGoogleWalkRoute = function (visitId, walkPoints) {
            const element = document.getElementById(`client-walk-route-map-${visitId}`);
            if (!element || toPath(walkPoints).length < 2 || !window.google?.maps) return original.apply(this, arguments);
            try { drawWalk(element, walkPoints, { gestureHandling: 'cooperative' }); }
            catch (error) { console.warn('Walk map:', error); return original.apply(this, arguments); }
        };
    }
    if (typeof window.renderAdminGoogleWalkRoute === 'function') {
        const original = window.renderAdminGoogleWalkRoute;
        window.renderAdminGoogleWalkRoute = function (mapElement, walkPoints) {
            if (!mapElement || toPath(walkPoints).length < 2 || !window.google?.maps) return original.apply(this, arguments);
            try { drawWalk(mapElement, walkPoints, { gestureHandling: 'cooperative' }); }
            catch (error) { console.warn('Walk map:', error); return original.apply(this, arguments); }
        };
    }
    if (typeof window.renderAdminOptimizedRouteMap === 'function') {
        const original = window.renderAdminOptimizedRouteMap;
        window.renderAdminOptimizedRouteMap = function () {
            const result = original.apply(this, arguments);
            try { if (typeof adminBestRouteMap !== 'undefined' && adminBestRouteMap) { adminBestRouteMap.__pisNight = null; restyle(adminBestRouteMap); } }
            catch (error) { console.warn('Route map look:', error); }
            return result;
        };
    }

    const PisMap = window.PisMap = {
        isNight, sunUpDown, restyle, create, route, fit, drawWalk, toPath, scan,
        seed(walkId, points) { if (walkId && points?.length) seeds.set(Number(walkId), points); },
        forceNight: null
    };
})();
