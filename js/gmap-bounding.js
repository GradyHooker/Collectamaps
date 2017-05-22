function updateEdge() {
	bounds = map.getBounds();
  
	sw = bounds.getSouthWest();
	ne = bounds.getNorthEast();

	var swLng = sw.lng();
	var swLat = sw.lat();

	var neLng = ne.lng();
	var neLat = ne.lat();
  
	if (swLng > neLng) {
		swLng -= 360;
	} 
	width = neLng - swLng;
  
	var left = Math.min(-180+(width/2),-0.000001);
	var right = Math.max(180-(width/2),0.000001);
	var divHeight = document.getElementById("map").clientHeight;
  
	var divCenterLat = fromPointToLatLng(new google.maps.Point(0, divHeight)).lat();
	var currentZoom = map.getZoom();

	var top = midpointLat();
	var bottom = -midpointLat();
  
	allowedBounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(bottom,left),
		new google.maps.LatLng(top,right));
}

function boxIn() {
	if (allowedBounds.contains(map.getCenter())) {
		return;
	} else {
		var mapCenter = map.getCenter();
		var divHeight = document.getElementById("map").clientHeight;
		var X = mapCenter.lng();
		var Y = mapCenter.lat();

		var AmaxX = allowedBounds.getNorthEast().lng();
		var AmaxY = allowedBounds.getNorthEast().lat();
		var AminX = allowedBounds.getSouthWest().lng();
		var AminY = allowedBounds.getSouthWest().lat();

		if (X < AminX) {
			X = AminX;
		}
		if (X > AmaxX) {
			X = AmaxX;
		}
		if (Y < AminY) {
			Y = AminY;
		}
		if (Y > AmaxY) {
			Y = AmaxY;
		}
		map.panTo(new google.maps.LatLng(Y, X));
	}
}

function fromPointToLatLng(point) {
	// value from 0 to 256
	var TILE_SIZE = 256;
	var pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2, TILE_SIZE / 2);
	var origin = new google.maps.Point(TILE_SIZE/2, TILE_SIZE/2);

	var pixelsPerLonDegree_ = TILE_SIZE / 360;
	var pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);

	var origin = pixelOrigin_;
	var lng = (point.x - origin.x) / pixelsPerLonDegree_;
	var latRadians = (point.y - origin.y) / -pixelsPerLonRadian_;
	var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
	return new google.maps.LatLng(lat, lng);
};

function degreesToRadians(deg) {
	return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
	return rad / (Math.PI / 180);
}

function midpointLat() {
	var divHeight = document.getElementById("map").clientHeight;
	var tileFactor = 1 << map.getZoom();
	var midpointFromTop = divHeight / tileFactor / 2;
	return fromPointToLatLng(new google.maps.Point(0, midpointFromTop)).lat();
}