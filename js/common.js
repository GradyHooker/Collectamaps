function loadJSON(file, folder, callback, index) {   
	var req = new XMLHttpRequest();
	req.overrideMimeType("application/json");
	if(!index) {
		req.open('GET', 'maps/' + folder + '/' + file + '.json', true);
	} else {
		req.open('GET', file + '.json', true);
	}
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