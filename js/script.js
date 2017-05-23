function make_map() {
	var m = L.map('map', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		maxBounds: [img_height, img_width],
		maxBoundsViscosity: 0.75,
		crs: L.CRS.Simple
	}).setView([0, 0], mapMinZoom+1);
	
	var mapBounds = new L.LatLngBounds(
		m.unproject([0, img_height], mapMaxZoom),
		m.unproject([img_width, 0], mapMaxZoom)
	);
	m.setMaxBounds(mapBounds);
	
	L.tileLayer(game + '/tiles/{z}/map_{x}_{y}.png', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		attribution: 'Game Map & Icons &copy; ' + gamePublisher,
		noWrap: true,
		bounds: mapBounds
	}).addTo(m);
	
	return m;
}

function make_icon(name, shortname, filter) {
	return new CMIcon(name, shortname, filter);
}

function CMIcon(name, shortname, filter) {
	this.name = name;
	this.icon = L.icon({
		iconUrl: game + '/markers/' + shortname + '.png',
		iconSize:   [24, 24],
		iconAnchor: [12, 12]
	});
	this.filter = filter;
}

function make_marker(icon, x, y, description, gfycat) {
	return CMMarker(icon, x, y, description, gfycat);
}

function CMMarker(icon, x, y, description, gfycat) {
	this.icon = icon;
	this.marker = L.marker(
		map.unproject([x, y], mapMaxZoom),
		{icon: icon.icon}
	).addTo(map);
	this.description = description;
	this.gfycat = gfycat;
	this.found = false;
	
	var popupString = "";
	popupString += "<b>" + this.icon.name + "</b><br/>";
	popupString += "<i>" + this.description + "</i><br/>";
	if(this.gfycat != "") {
		popupString+= "<div style='position:relative;padding-bottom:54%'><iframe src='https://gfycat.com/ifr/" + "DelectableCompetentLcont" + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0'></iframe></div>";
		this.marker.on('click', markerClickVid);
	} else {
		this.marker.on('click', markerClickNo);
	}
	this.marker.bindPopup(popupString);
}

function markerClickVid(e) {
	markerClick(e, 0.000250);
}

function markerClickNo(e) {
	markerClick(e, 0.000082);
}

function markerClick(e, offset) {
	var markerCenter = e.target.getLatLng();
	newCenter = new L.LatLng(
		markerCenter.lat + offset,
		markerCenter.lng
	);
	
	map.setView(newCenter, clickZoom);
}

/*function markerClick(e) {
	var popUpHeight = document.getElementsByClassName("leaflet-popup-content-wrapper")[0].clientHeight + 5;
	var markerCenter = e.target.getLatLng();
	var root = Math.max((clickZoom - map.getZoom()) + 1, 1);
	switch(root) {
		case 1:
			break;
		case 2:
			popUpHeight = Math.sqrt(popUpHeight);
			break;
		case 3:
			popUpHeight = Math.cbrt(popUpHeight);
			break;
		default:
			popUpHeight = Math.pow(popUpHeight, 1/root);
			break;
	}
	var x = map.latLngToContainerPoint(markerCenter).x;
    var y = map.latLngToContainerPoint(markerCenter).y - popUpHeight/2;
    var newCenter = map.containerPointToLatLng([x, y]);
	
	map.setView(newCenter, clickZoom);
}*/