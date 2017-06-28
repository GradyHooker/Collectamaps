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
window.onpopstate = popstate_map;

function init() {
	console.log("OnLoad");
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
	window.history.pushState({}, game + " ( " + level + ") - Collectamaps", 'maps.html?g=' + game + "&l=" + level);
	map.remove();
	loadJSON("game_info", game, infoLoaded);
}

function popstate_map(event) {
	reset = true;
	game = getQueryVariable("g");
	level = getQueryVariable("l");
	if(level == false) {
		level = "";
	}
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
	
	L.tileLayer('maps/' + game + '/' + level + '/tiles/{z}/map_{x}_{y}.png', {
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
	
	//Autoplay videos on Chrome
	m.on('popupopen', function(e) {
		var video = e.popup._contentNode.getElementsByTagName("video")[0];
		if(video != null) video.play();
	});
					
	return m;
}
		
function loadJSON(file, folder, callback) {   
	var req = new XMLHttpRequest();
	req.overrideMimeType("application/json");
	req.open('GET', 'maps/' + folder + '/' + file + '.json', true);
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
		window.document.title = gameFull + " (" + stringPresentable(level) + ") - Collectamaps"
	} else {
		levelFab.style.display = "none";
		storageID = game;
		window.document.title = gameFull + " - Collectamaps"
	}
	
	founds = JSON.parse(localStorage.getItem(storageID));

	loadJSON("map_info", game + "/" + level, infoMapLoaded);
}

function make_SelectImage(l) {
	var ele = document.createElement("IMG");
	ele.className = "select-img";
	ele.src = 'maps/' + game + "/" + l + "/icon.png";
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
		document.getElementById("credit-logo").src = "img/" + infoJSON["credit"] + "-logo.png";
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
	
	//Add the first row
	if(level != "") {
		layers["areaHighlights"] = new L.layerGroup().addTo(map);
		if(!reset) {
			row = document.createElement("TR");
			cell = document.createElement("TD");
			cell.textContent = capitalize("areaHighlights");
			
			row.appendChild(cell);
			buttons = make_FilterButtons("areaHighlights");
			row.appendChild(buttons[0]);
			row.appendChild(buttons[1]);
			table.appendChild(row);
		}
	}
	
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
	
	if(level != "") {
		loadJSON("teleports", game + "/" + level, teleportsLoaded);
	}
}

function teleportsLoaded(response) {
	var teleportJSON = JSON.parse(response);
	
	for (var t in teleportJSON) {
		var teleport = teleportJSON[t];
		var polygonPoints = [];
		for(var p in teleport.points) {
			var point = teleport.points[p];
			polygonPoints[p] = map.unproject([point.x, point.y], mapMaxZoom);
		}
		
		polygon = make_polygon(polygonPoints, teleport.level);
	}
}

function make_polygon(points, level) {
	var options = {
		color: '#ff00dc',
		fillColor: '#ff00dc',
		fillOpacity: 0.2,
		weight: 2,
		opacity: 0.4
	};
	
	var p = L.polygon(points, options);
	p.on('click', function() {
		reset_map(game, level);
	});
	p.bindTooltip(stringPresentable(level), {sticky: true});
	layers["areaHighlights"].addLayer(p);
	return p;
}

function stringPresentable(s) {
	var split = s.split("-");
	s = "";
	for(var i = 0; i < split.length; i++) {
		if(split[i] == "ss") {
			split[i] = "SS";
		} else if(split[i] == "mt") {
			split[i] = "Mt.";
		} else {
			split[i] = split[i].charAt(0).toUpperCase() + split[i].substr(1).toLowerCase();
		}
		s += split[i];
		if(i+1 < split.length) {
			s += " ";
		}
	}

	return s;
}

function make_icon(name, shortname, filter) {
	return new CMIcon(name, shortname, filter);
}

function CMIcon(name, shortname, filter) {
	this.name = name;
	this.icon = L.icon({
		iconUrl: 'maps/' + game + '/markers/' + shortname + '.png',
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
		popupString+= "<div style='position:relative;padding-bottom:54%'><video class='help-video' playsinline loop width='100%' height='100%' style='position:absolute;top:0;left:0' autoplay muted><source src='https://thumbs.gfycat.com/" + cmmarker.gfycat + "-mobile.mp4' type='video/mp4'></video></div>";
		cmmarker.marker.on('click', markerClickVid);
	} else {
		cmmarker.marker.on('click', markerClickNo);
	}
	popupString+= "<div class='found-check'><input type='checkbox' checked id='marker-" + cmmarker.id + "' onclick='fadeMarker(this, " + cmmarker.id + ")'></input><label for='marker-" + cmmarker.id + "'> I have found this</label></div>";
	var popup = L.popup({
		className: "popup-" + cmmarker.id,
		minWidth : 340
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

function expandFAB(name) {
	var height;
	
	switch(name) {
		case "select":
			closeFAB('filter');
			closeFAB('options');
			height = (Math.ceil(document.getElementById("select-img-cont").childNodes.length/3) * 80) + 70;
			break;
		case "filter":
			closeFAB('select');
			closeFAB('options');
			height = ((document.getElementById("fab-table").childNodes.length - 1) * 22) + 80;
			break;
		case "options":
			closeFAB('select');
			closeFAB('filter');
			height = ((document.getElementsByClassName("option-item").length) * 31) + 70;
			break;
	}
	
	var content = document.getElementById("fab-content-" + name);
	if(content.style.opacity != "1") {
		var fab = document.getElementById("fab-" + name);
		fab.classList.add("is-open");
		fab.style.height = height + "px";
		if(height > document.body.scrollHeight-120) {
			fab.getElementsByClassName("fab-scroll-content")[0].classList.add("scrolling");
		} else {
			fab.getElementsByClassName("fab-scroll-content")[0].classList.remove("scrolling");
		}
	}
}

function closeFAB(name) {
	var content = document.getElementById("fab-content-" + name);
	if(content.style.opacity != "0") {
		var fab = document.getElementById("fab-" + name);
		fab.classList.remove("is-open");
		fab.style.height = "65px";
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
			button.parentNode.parentNode.childNodes[0].classList.add("not-applied");
		} else {
			button.checked = true;
			map.addLayer(layers[cat]);
			button.parentNode.parentNode.childNodes[0].classList.remove("not-applied");
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
			checks[i].parentNode.parentNode.childNodes[0].classList.add("not-applied");
		}
		map.addLayer(layers[cat]);
		button.checked = true;
		button.parentNode.parentNode.childNodes[0].classList.remove("not-applied");
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
			checks[i].parentNode.parentNode.childNodes[0].classList.remove("not-applied");
		} else {
			checks[i].parentNode.parentNode.childNodes[0].classList.add("not-applied");
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
			radios[i].parentNode.parentNode.childNodes[0].classList.remove("not-applied");
		} else {
			radios[i].parentNode.parentNode.childNodes[0].classList.add("not-applied");
		}
	}
	return checked;
}

function downloadImage() {
	var a  = document.createElement('a');
    if(level != "") {
		a.href = 'maps/' + game + '/' + level + '/map.png';
		a.download = game + '-' + level + '.png';
	} else {
		a.href = 'maps/' + game + '/map.png';
		a.download = game + '.png';
	}

    a.click();
}

function resetMapProgress() {

}

function resetGameProgress() {

}