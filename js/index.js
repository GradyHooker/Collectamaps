var gameList = [];

window.onload = init;

function init() {
	loadJSON("gameMaps", null, gameListLoaded, false, true);
	
	var searchBar = document.getElementById("search-bar");
	searchBar.oninput = searchGames;
	searchBar.onpropertychange  = searchGames;
}

function gameListLoaded(response) {
	var infoJSON = JSON.parse(response);
	var game;
	
	for(g in infoJSON) {
		game = infoJSON[g];
		game.searchScore = 0;
		gameList[g] = game;
	}
	
	gameList.sort(function(x, y) {
		if (x.name > y.name)
			return 1;
		if (x.name < y.name)
			return -1;
		return 0;
	});

	buildGameGrid(true);
}

function buildGameGrid(all) {
	var cont = document.getElementById("games-container");
	while (cont.firstChild) {
		cont.removeChild(cont.firstChild);
	}
	for(g in gameList) {
		if(all || gameList[g].searchScore > 0) { 
			make_gameBox(gameList[g], cont);
		}
	}
}

function make_gameBox(game, cont) {
	var link = document.createElement("A");
	link.href = "maps?g=" + game.shortName;
	link.className = "game";
	var image = document.createElement("IMG");
	image.src = "gametiles/" + game.shortName + ".jpg";
	image.alt = game.name + " image";
	link.appendChild(image);
	cont.appendChild(link);
}

function searchGames() {
	//Split search terms by space
	clearSearchScore();
	var terms = this.value.split(/[ ,//]+/).filter(Boolean);
	if(terms.length == 0) {
		gameList.sort(function(x, y) {
			if (x.name > y.name)
				return 1;
			if (x.name < y.name)
				return -1;
			return 0;
		});
		buildGameGrid(true);
		return;
	}
	//For each term, if a game contains it, add a searchScore
	var term;
	var game;
	var word;
	var gameSplit;
	for(t in terms) {
		term = terms[t].toLowerCase();
		for(g in gameList) {
			game = gameList[g];
			gameSplit = game.name.split(/[ ,//]+/).filter(Boolean);
			for(w in gameSplit) {
				word = gameSplit[w].toLowerCase();
				if(word == term) {
					//(+2 if is also a token)
					game.searchScore += 2;
					break;
				} else if (word.includes(term)) {
					game.searchScore += 1;
					break;
				}
			}
		}
	}
	//Sort games by searchScore
	gameList.sort(function(x, y) {
		if (y.searchScore != x.searchScore) {
			return y.searchScore - x.searchScore;
		} else {
			if (x.name > y.name)
				return 1;
			if (x.name < y.name)
				return -1;
			return 0;
		}
	});
	//Don't display if searchScore is 0
	buildGameGrid(false);
}

function clearSearchScore() {
	for(g in gameList) {
		gameList[g].searchScore = 0;
	}
}