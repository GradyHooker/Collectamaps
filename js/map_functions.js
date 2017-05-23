function make_map() {
	var m = L.map('map', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		crs: L.CRS.Simple
	}).setView([0, 0], mapMaxZoom-1);
	
	var mapBounds = new L.LatLngBounds(
		m.unproject([0, img_height], mapMaxZoom),
		m.unproject([img_width, 0], mapMaxZoom)
	);
	m.fitBounds(mapBounds);
	
	L.tileLayer(game + '/tiles/{z}/map_{x}_{y}.png', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		attribution: 'Game Map & Icons &copy; ' + gamePublisher,
		noWrap: true,
		bounds: mapBounds
	}).addTo(m);
	
	return m;
}

function make_icon(name) {
	return L.icon({
		iconUrl: game + '/markers/' + name + '.png',
		iconSize:   [24, 24],
		iconAnchor: [12, 12]
	});
}

function make_marker(icon, x, y) {
	return L.marker(
		map.unproject([x, y], mapMaxZoom),
		{icon: icon}
	).addTo(map);
}