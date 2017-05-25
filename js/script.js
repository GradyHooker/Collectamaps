var map;
var icons = {};
var markers = [];

window.onload = init;

function init() {
	map = make_map();
	loadJSON("icons", iconsLoaded);
}

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
	
	m.on('zoomend', function() {
		if(map.getZoom() <= clickZoom-1) {
			map.closePopup();
		}
	});
	
	return m;
}
		
function loadJSON(file, callback) {   
	var req = new XMLHttpRequest();
	req.overrideMimeType("application/json");
	req.open('GET', game + '/' + file + '.json', true);
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == "200") {
		callback(req.responseText);
		}
	};
	req.send(null);  
}

function iconsLoaded(response) {
	var iconJSON = JSON.parse(response);
	
	for (var cat in iconJSON) {
		for (var i = 0; i < iconJSON[cat].length; i++) {
			var icon = iconJSON[cat][i];
			var iconShort = icon.name.replace(/\s/g,'').toLowerCase();
			icons[iconShort] = make_icon(icon.name, iconShort, cat);
		}
	}
	
	loadJSON("markers", markersLoaded);
}

function markersLoaded(response) {
	var markerJSON = JSON.parse(response);
	
	for (var m in markerJSON) {
		var marker = markerJSON[m];
		markers[m] = make_marker(marker.icon, marker.x, marker.y, marker.desc, marker.gfy);
	}
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

function CMMarker(ic, x, y, description, gfycat) {
	this.icon = icons[ic];
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
		popupString+= "<div style='position:relative;padding-bottom:54%'><iframe src='https://gfycat.com/ifr/" + this.gfycat + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0'></iframe></div>";
		//Non-repsonsive <iframe src='https://gfycat.com/ifr/CourteousColossalAntelope' frameborder='0' scrolling='no' width='640' height='428' allowfullscreen></iframe>
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