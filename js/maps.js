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
var fileFormat;
var storageID;
var reset = false;
var debug = true;
var debug_click;

window.onload = init;
window.onpopstate = popstate_map;

function init() {
	game = getQueryVariable("g");
	level = getQueryVariable("l");
	if(game == false) {
		sendHome();
	} else {
		loadJSON("game_info", game, infoLoaded, true);
	}
}

function reset_map(newGame, newLevel) {
	reset = true;
	game = newGame;
	level = newLevel;
	window.history.pushState({}, game + " ( " + level + ") - Collectamaps", 'maps.html?g=' + game + "&l=" + level);
	map.remove();
	clearMapLayers(layers);
	loadJSON("game_info", game, infoLoaded, true);
}

function popstate_map(event) {
	reset = true;
	game = getQueryVariable("g");
	level = getQueryVariable("l");
	if(level == false) {
		level = "";
	}
	map.remove();
	clearMapLayers(layers);
	loadJSON("game_info", game, infoLoaded, true);
}

function clearMapLayers() {
	for(l in layers) {
		layers[l].clearLayers();
	}
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
	
	L.tileLayer('maps/' + game + '/' + level + '/tiles/{z}/map_{x}_{y}.' + fileFormat, {
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
	
	//Autoplay videos on Chrome
	m.on('popupopen', function(e) {
		var video = e.popup._contentNode.getElementsByTagName("video")[0];
		if(video != null) video.play();
	});
					
	return m;
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
			make_SelectImage(lev, levelCont);
			storageID = game + "-" + level;
		}
		window.document.title = gameFull + " (" + stringPresentable(level) + ") - Collectamaps"
	} else {
		levelFab.style.display = "none";
		storageID = game;
		window.document.title = gameFull + " - Collectamaps"
		var extraButton = document.getElementById("option-item-game");
		if(extraButton != null) {
			extraButton.remove();
		}
	}
	
	if(localStorage.getItem(storageID)) {
		founds = JSON.parse(localStorage.getItem(storageID));
	} else {
		localStorage.setItem(storageID, "[]");
	}

	loadJSON("map_info", game + "/" + level, infoMapLoaded, true);
}

function make_SelectImage(l, cont) {
	var ele = document.createElement("DIV");
	ele.className = "select-div";
	ele.onclick = function() {
		reset_map(game, l);
	}
	
	var img = document.createElement("IMG");
	img.className = "select-img";
	img.src = 'maps/' + game + "/" + l + "/icon.png";
	
	var txt = document.createElement("DIV");
	txt.className = "select-txt";
	txt.innerHTML = stringPresentable(l);
	
	ele.appendChild(img);
	ele.appendChild(txt);
	
	cont.appendChild(ele);
	
	var txtWidth = txt.clientWidth;
	var fontSize = 0.8;
	while(txtWidth > 65) {
		fontSize -= 0.05;
		txt.style.fontSize = fontSize + "em";
		txtWidth = txt.clientWidth;
	}
	
	return;
}

function infoMapLoaded(response) {
	var infoJSON = JSON.parse(response);
	mapMinZoom = infoJSON["mapMinZoom"];
	mapMaxZoom = infoJSON["mapMaxZoom"];
	clickZoom = infoJSON["clickZoom"];
	img_width = infoJSON["img_width"];
	img_height = infoJSON["img_height"];
	
	if(infoJSON["fileType"] != null) {
		fileFormat = infoJSON["fileType"];
	} else {
		fileFormat = "png";
	}
	
	if(infoJSON["credit"] != null) {
		document.getElementById("credit-cont").style.display = "block";
		document.getElementById("credit-logo").src = "img/" + infoJSON["credit"] + "-logo.png";
		document.getElementById("credit-link").href = infoJSON["creditURL"];
	} else {
		document.getElementById("credit-cont").style.display = "none";
	}
	
	map = make_map();
	
	loadJSON("icons", game, iconsLoaded, true);
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
	
	//If DEBUG then allow adding of markers
	if(debug) {
		var contextDropDown = document.createElement("SELECT");
		contextDropDown.id = "contextDropDown";
		
		var opt;
		for(i in icons) {
			opt = document.createElement("option");
			opt.text = i;
			contextDropDown.add(opt); 
		}
		
		contextDropDown.onchange = function() {
			var crs = map.options.crs;
			var zoom = map.getZoom();
			var layerPoint = crs.latLngToPoint(debug_click, zoom).floor();
			var item = this.value;
			console.log('{\n' + 
					'	"icon":	"' + item + '",\n' + 
					'	"x":	' + layerPoint.x + ',\n' +  
					'	"y":	' + layerPoint.y + ',\n' +  
					'	"desc":	"",\n' + 
					'	"gfy":	""\n' + 
					'},');
			document.getElementById("contextDropDown").style.display = "none";
		}
		
		document.getElementsByTagName("BODY")[0].appendChild(contextDropDown);
		
		map.on('contextmenu', function(e) {
			debug_click = e.latlng;
			var dd = document.getElementById("contextDropDown");
			dd.style.display = "block";
			dd.style.top = e.containerPoint.y + "px";
			dd.style.left = e.containerPoint.x + "px";
		});
	}
		
	loadJSON("markers", game + "/" + level, markersLoaded);
	if(level != "") {
		loadJSON("teleports", game + "/" + level, teleportsLoaded);
	}
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

	localStorage.setItem(storageID, JSON.stringify(founds));
}

function teleportsLoaded(response) {
	var teleportJSON = JSON.parse(response);
	
	//Add the first row
	layers["areaHighlights"] = new L.layerGroup().addTo(map);
	if(!reset) {
		var table = document.getElementById("fab-table");
		var row = document.createElement("TR");
		var cell = document.createElement("TD");
		cell.textContent = capitalize("areaHighlights");
		
		row.appendChild(cell);
		var buttons = make_FilterButtons("areaHighlights");
		row.appendChild(buttons[0]);
		row.appendChild(buttons[1]);
		table.insertBefore(row, table.children[1]);
	}
	
	if(reset) {
		if(!applyOnlyFilters()) {
			applyToggleFilters();
		}
		reset = false;
	}
	
	for (var t in teleportJSON) {
		var teleport = teleportJSON[t];
		var polygonPoints = [];
		for(var p in teleport.points) {
			var point = teleport.points[p];
			polygonPoints[p] = map.unproject([point.x, point.y], mapMaxZoom);
		}
		
		layers["areaHighlights"].addLayer(make_polygon(polygonPoints, teleport.level));
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
	return p;
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
	if(cmmarker.description != "") {
		popupString += "<i>" + cmmarker.description + "</i><br/>";
	}
	if(cmmarker.gfycat != "") {
		popupString+= "<div style='position:relative;padding-bottom:54%'><video class='help-video' playsinline loop width='100%' height='100%' style='position:absolute;top:0;left:0' autoplay muted><source src='https://thumbs.gfycat.com/" + cmmarker.gfycat + "-mobile.mp4' type='video/mp4'></video></div>";
		cmmarker.marker.on('click', markerClickVid);
	} else {
		cmmarker.marker.on('click', markerClickNo);
	}
	popupString+= "<div class='popup-bottom'><div class='found-check'><input type='checkbox' checked id='marker-" + cmmarker.id + "' onclick='fadeMarker(this, " + cmmarker.id + ")'></input><label for='marker-" + cmmarker.id + "'> I have found this</label></div><div class='found-link'><img alt='Link Icon' src='img/link.png'><span>Copy link to marker</span></div></div>";
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
	var fab = document.getElementById("fab-" + name);
	
	switch(name) {
		case "select":
			closeFAB('filter');
			closeFAB('options');
			fab.classList.remove("is-hidden");
			if(document.body.scrollWidth < 850) {
				document.getElementById("fab-filter").classList.add("is-hidden");
				document.getElementById("fab-options").classList.add("is-hidden");
			}
			height = (Math.ceil(document.getElementById("select-img-cont").childNodes.length/3) * 80) + 70;
			break;
		case "filter":
			closeFAB('select');
			closeFAB('options');
			if(document.body.scrollWidth < 850) {
				document.getElementById("fab-select").classList.add("is-hidden");
				document.getElementById("fab-options").classList.add("is-hidden");
			}
			height = ((document.getElementById("fab-table").childNodes.length - 1) * 22) + 70;
			break;
		case "options":
			closeFAB('select');
			closeFAB('filter');
			if(document.body.scrollWidth < 850) {
				document.getElementById("fab-select").classList.add("is-hidden");
				document.getElementById("fab-filter").classList.add("is-hidden");
			}
			height = ((document.getElementsByClassName("option-item").length) * 31) + 70;
			break;
	}
	
	var content = document.getElementById("fab-content-" + name);
	if(content.style.opacity != "1") {
		fab.classList.add("is-open");
		fab.style.height = height + "px";
		if((document.body.scrollWidth < 850 && height > document.body.scrollHeight-100) ||
		(document.body.scrollWidth >= 850 && height > document.body.scrollHeight-160)) {
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
	document.getElementById("fab-select").classList.remove("is-hidden");
	document.getElementById("fab-filter").classList.remove("is-hidden");
	document.getElementById("fab-options").classList.remove("is-hidden");
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
		a.href = 'maps/' + game + '/' + level + '/map.' + fileFormat;
		a.download = game + '-' + level + '.' + fileFormat;
	} else {
		a.href = 'maps/' + game + '/map.' + fileFormat;
		a.download = game + '.' + fileFormat;
	}

    a.click();
}

function resetMapProgress() {
	var msg;
	if(level != '') {
		msg = "By pressing the 'OK' button, you will clear all of your data for the " + stringPresentable(level) + " map.\n\nThis data includes; Which markers you have found.\n\nThis CANNOT be undone.";
	} else {
		msg = "By pressing the 'OK' button, you will clear all of your data for the " + gameFull + " map.\n\nThis data includes; Which markers you have found.\n\nThis CANNOT be undone."
	}
	
	if (confirm(msg) == true) {
        resetProgress(storageID);
    }
}

function resetGameProgress() {
	if (confirm("By pressing the 'OK' button, you will clear all of your data for EVERY map and sub-map for the " + gameFull + " game.\n\nThis data includes; Which markers you have found.\n\nThis CANNOT be undone.") == true) {
		for(var ls in localStorage) {
			if(ls.includes(game)) {
				resetProgress(ls);
			}
		}
	}
}

function resetProgress(str) {
	localStorage.setItem(str, "[]");
	founds = JSON.parse(localStorage.getItem(str));
	for(var m in markers) {
		if(founds[m]) {
			markers[m].marker.setOpacity(0.4);
			markers[m].found = true;
		} else {
			markers[m].marker.setOpacity(1.0);
			markers[m].found = false;
		}
	}
}