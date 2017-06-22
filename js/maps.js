var map;
var icons = {};
var markers = [];
var indices = [];
var founds = [];
var layers = {};

var game;
var level;
var gameFull;
var gamePublisher;
var mapMinZoom;
var mapMaxZoom;
var clickZoom;
var img_width;
var img_height;
var storageID;
var reset = false;

window.onload = init;

function init() {
	game = getQueryVariable("g");
	level = getQueryVariable("l");
	if(game == false) {
		sendHome();
	} else {
		loadJSON("game_info", game, infoLoaded);
	}
}

function reset_map(newGame, newLevel) {
	reset = true;
	game = newGame;
	level = newLevel;
	window.history.replaceState({}, game + " ( " + level + ") - Collectamaps", 'maps.html?g=' + game + "&l=" + level);
	map.remove();
	loadJSON("game_info", game, infoLoaded);
}

function make_map() {
	var m = L.map('map', {
		maxZoom: mapMaxZoom,
		minZoom: mapMinZoom,
		maxBounds: [img_height, img_width],
		maxBoundsViscosity: 0.75,
		crs: L.CRS.Simple
	});
	
	var mapBounds = new L.LatLngBounds(
		m.unproject([0, img_height], mapMaxZoom),
		m.unproject([img_width, 0], mapMaxZoom)
	);
	m.setMaxBounds(mapBounds);
	
	m.fitBounds(mapBounds);
	//m.setZoom(mapMinZoom+1);
	
	L.tileLayer(game + '/' + level + '/tiles/{z}/map_{x}_{y}.png', {
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
	
	//DEBUG PRINT ONLY
	m.on('click', function(e) {  
		var item = "diamond";
		var crs = map.options.crs;
		var zoom = map.getZoom();
		var layerPoint = crs.latLngToPoint(e.latlng, zoom).floor()
        console.log('{\n' + 
					'	"icon":	"' + item + '",\n' + 
					'	"x":	' + layerPoint.x + ',\n' +  
					'	"y":	' + layerPoint.y + ',\n' +  
					'	"desc":	"",\n' + 
					'	"gfy":	""\n' + 
					'},');
    });
					
	return m;
}
		
function loadJSON(file, folder, callback) {   
	var req = new XMLHttpRequest();
	req.overrideMimeType("application/json");
	req.open('GET', folder + '/' + file + '.json', true);
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == "200") {
		callback(req.responseText);
		} else if (req.status == "404") {
			sendHome();
		}
	};
	req.send(null); 
}

function sendHome() {
	window.location = "./";
}

function infoLoaded(response) {
	var infoJSON = JSON.parse(response);
	var levels = infoJSON["mapList"];
	gamePublisher = infoJSON["gamePublisher"];
	gameFull = infoJSON["gameFull"];
	
	if(level == false) {
		if(infoJSON["defaultLevel"] != null) {
			level = infoJSON["defaultLevel"];
		} else {
			level = "";
		}
	}
	var levelCont = document.getElementById("select-img-cont");
	var levelFab = document.getElementById("fab-select");
	while (levelCont.firstChild) {
		levelCont.removeChild(levelCont.firstChild);
	}
	if(levels != null) {
		levelFab.style.display = "flex";
		for(l in levels) {
			var lev = levels[l];
			levelCont.appendChild(make_SelectImage(lev));
			storageID = game + "-" + level;
		}
	} else {
		levelFab.style.display = "none";
		storageID = game;
	}
	
	founds = JSON.parse(localStorage.getItem(storageID));
	
	window.document.title = gameFull + " - Collectamaps"
	loadJSON("map_info", game + "/" + level, infoMapLoaded);
}

function make_SelectImage(l) {
	var ele = document.createElement("IMG");
	ele.className = "select-img";
	ele.src = game + "/" + l + "/icon.png";
	ele.onclick = function() {
		reset_map(game, l);
	}
	return ele;
}

function infoMapLoaded(response) {
	var infoJSON = JSON.parse(response);
	mapMinZoom = infoJSON["mapMinZoom"];
	mapMaxZoom = infoJSON["mapMaxZoom"];
	clickZoom = infoJSON["clickZoom"];
	img_width = infoJSON["img_width"];
	img_height = infoJSON["img_height"];
	
	if(infoJSON["credit"] != null) {
		document.getElementById("credit-cont").style.display = "block";
		document.getElementById("credit-logo").src = "icons/" + infoJSON["credit"] + "-logo.png";
		document.getElementById("credit-link").href = infoJSON["creditURL"];
	} else {
		document.getElementById("credit-cont").style.display = "none";
	}
	
	map = make_map();
	loadJSON("icons", game, iconsLoaded);
}

function iconsLoaded(response) {
	var iconJSON = JSON.parse(response);
	var table = document.getElementById("fab-table");
	var row;
	var cell;
	var buttons;
	
	for (var cat in iconJSON) {
		layers[cat] = new L.layerGroup().addTo(map);
		for (var i = 0; i < iconJSON[cat].length; i++) {
			var icon = iconJSON[cat][i];
			var iconShort = icon.name.replace(/\s/g,'').toLowerCase();
			icons[iconShort] = make_icon(icon.name, iconShort, cat);
		}
		if(!reset) {
			//Create rows in the filter table
			row = document.createElement("TR");
			cell = document.createElement("TD");
			cell.textContent = capitalize(cat);
			
			row.appendChild(cell);
			buttons = make_FilterButtons(cat);
			row.appendChild(buttons[0]);
			row.appendChild(buttons[1]);
			table.appendChild(row);
		}
	}
		
	loadJSON("markers", game + "/" + level, markersLoaded);
}

function capitalize(string) {
	string = string.replace(/([A-Z])/g, ' $1');
    string = string.replace(/^./, function(str){ return str.toUpperCase(); });
	return string;
}

function make_FilterButtons(cat) {
	var conts = [];
	var buttons = [];
	conts[0] = document.createElement("TD");
	conts[0].className = "checkCell";
	conts[0].innerHTML = '<input type="checkbox" name="filterToggle" value="' + cat + '" checked onclick="toggleFilter(this);">';
	conts[0].onclick = function() {
		toggleFilter(conts[0].childNodes[0]);
	};
	conts[1] = document.createElement("TD");
	conts[1].className = "checkCell";
	var button = document.createElement("INPUT");
	button.type = "radio";
	button.name = "filterOnly";
	button.value = cat;
	button.setAttribute('was-checked', false);
	button.onclick = function(e) {
		e.stopPropagation(); 
		button.checked = (button.getAttribute('was-checked') == 'true');
		onlyFilter(button);
		var radios = document.getElementById("fab-table").querySelectorAll('[type=radio]');
		for(var i = 0; i < radios.length; i++) {
			radios[i].setAttribute('was-checked', 'false');
		}
		button.setAttribute('was-checked', button.checked);
	}
	conts[1].appendChild(button);
	conts[1].onclick = function() {
		onlyFilter(button);
		var radios = document.getElementById("fab-table").querySelectorAll('[type=radio]');
		for(var i = 0; i < radios.length; i++) {
			radios[i].setAttribute('was-checked', 'false');
		}
		button.setAttribute('was-checked', button.checked);
	};
	return conts;
}

function markersLoaded(response) {
	var markerJSON = JSON.parse(response);
	
	var new_found = false;
	if(founds == null) {
		founds = [];
		new_found = true;
	}
	
	for (var m in markerJSON) {
		var marker = markerJSON[m];
		markers[m] = make_marker(marker.icon, marker.x, marker.y, marker.desc, marker.gfy, m);
		if(new_found) {
			founds[m] = false;
		} else {
			if(founds[m]) {
				markers[m].marker.setOpacity(0.4);
				markers[m].found = true;
			}
		}
		layers[icons[marker.icon].filter].addLayer(markers[m].marker);
		indices[markers[m].marker._leaflet_id] = parseInt(m);
	}
	
	if(reset) {
		if(!applyOnlyFilters()) {
			applyToggleFilters();
		}
		reset = false;
	}
	
	localStorage.setItem(storageID, JSON.stringify(founds));
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

function make_marker(icon, x, y, description, gfycat, id) {
	return CMMarker(icon, x, y, description, gfycat, id);
}

function CMMarker(ic, x, y, description, gfycat, id) {
	var cmmarker = {
		icon: icons[ic],
		marker: L.marker(
				map.unproject([x, y], mapMaxZoom),
				{icon: icons[ic].icon}
			),
		description: description,
		gfycat: gfycat,
		found: false,
		id: id,
	};
	
	var popupString = "";
	popupString += "<b>" + cmmarker.icon.name + "</b><br/>";
	popupString += "<i>" + cmmarker.description + "</i><br/>";
	if(cmmarker.gfycat != "") {
		popupString+= "<div style='position:relative;padding-bottom:54%'><iframe src='https://gfycat.com/ifr/" + cmmarker.gfycat + "' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0'></iframe></div>";
		//Non-repsonsive <iframe src='https://gfycat.com/ifr/CourteousColossalAntelope' frameborder='0' scrolling='no' width='640' height='428' allowfullscreen></iframe>
		cmmarker.marker.on('click', markerClickVid);
	} else {
		cmmarker.marker.on('click', markerClickNo);
	}
	popupString+= "<div class='found-check'><input type='checkbox' checked id='marker-" + cmmarker.id + "' onclick='fadeMarker(this, " + cmmarker.id + ")'></input><label for='marker-" + cmmarker.id + "'> I have found this</label></div>";
	var popup = L.popup({
		className: "popup-" + cmmarker.id
	})
	popup.setContent(popupString)
	cmmarker.marker.bindPopup(popup);
	
	return cmmarker;
}

function markerClickVid(e) {
	markerClick(e, 0.000250);
}

function markerClickNo(e) {
	markerClick(e, 0.000082);
}

function markerClick(e, offset) {
	var marker = e.target;
	var popup = marker.getPopup();
	var content = popup.getContent();
	if(!markers[indices[marker._leaflet_id]].found) {
		popup.setContent(content.replace("checked", ""));
	} else {
		popup.setContent(content.replace("checkbox'", "checkbox' checked"));
	}
	var markerCenter = e.target.getLatLng();
	newCenter = new L.LatLng(
		markerCenter.lat + offset,
		markerCenter.lng
	);
	
	if(map.getZoom() >= clickZoom) {
		map.setView(newCenter, map.getZoom());
	} else {
		map.setView(newCenter, clickZoom);
	}
	
}

function fadeMarker(checkbox, id) {
	if(checkbox.checked) {
		markers[id].marker.setOpacity(0.4);
		markers[id].found = true;
		founds[id] = true;
	} else {
		markers[id].marker.setOpacity(1.0);
		markers[id].found = false;
		founds[id] = false;
	}
	localStorage.setItem(storageID, JSON.stringify(founds));
}

function expandFilters() {
	closeSelect();
	var content = document.getElementById("fab-content-filter");
	if(content.style.opacity != "1") {
		var fab = document.getElementById("fab-filter");
		fab.classList.add("is-open");
		fab.style.height = (content.clientHeight-5) + "px";
	}
}

function closeFilters() {
	var content = document.getElementById("fab-content-filter");
	if(content.style.opacity != "0") {
		var fab = document.getElementById("fab-filter");
		fab.classList.remove("is-open");
		fab.style.height = "65px";
	}
}

function expandSelect() {
	closeFilters();
	var content = document.getElementById("fab-content-select");
	if(content.style.opacity != "1") {
		var fab = document.getElementById("fab-select");
		fab.classList.add("is-open");
		var rows = Math.ceil(document.getElementById("select-img-cont").childNodes.length/3);
		fab.style.height = (rows*80 + 80) + "px";
	}
}

function closeSelect() {
	var content = document.getElementById("fab-content-select");
	if(content.style.opacity != "0") {
		var fab = document.getElementById("fab-select");
		fab.classList.remove("is-open");
	}
}

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}

function toggleFilter(button) {
	if(!button.disabled) {
		var cat = button.value;
		if(button.checked) {
			button.checked = false;
			map.removeLayer(layers[cat]);
		} else {
			button.checked = true;
			map.addLayer(layers[cat]);
		}
	}
}

function onlyFilter(button) {
	var cat = button.value;
	if(button.checked) {
		applyToggleFilters();
		button.checked = false;
	} else {
		var table = document.getElementById("fab-table");
		var checks = table.querySelectorAll('[type=checkbox]');
		for(var l in layers) {
			map.removeLayer(layers[l]);
		}
		for(var i = 0; i < checks.length; i++) {
			checks[i].disabled = true;
		}
		map.addLayer(layers[cat]);
		button.checked = true;
	}
}

function applyToggleFilters() {
	var checks = document.getElementById("fab-table").querySelectorAll('[type=checkbox]');
	for(var l in layers) {
		map.removeLayer(layers[l]);
	}
	for(var i = 0; i < checks.length; i++) {
		checks[i].disabled = false;
		if(checks[i].checked) {
			map.addLayer(layers[checks[i].value]);
		}
	}
}

function applyOnlyFilters() {
	var checked = false;
	var radios = document.getElementById("fab-table").querySelectorAll('[type=radio]');
	for(var l in layers) {
		map.removeLayer(layers[l]);
	}
	for(var i = 0; i < radios.length; i++) {
		if(radios[i].checked) {
			map.addLayer(layers[radios[i].value]);
			checked  = true;
		}
	}
	return checked;
}