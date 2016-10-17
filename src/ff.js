if (!window.ff) {
	window.ff = {};
}

ff.FF = function(storage) {
	this.storage = storage;

	this.espn = new ff.Espn(this);
	this.yahoo = new ff.Yahoo(this);
};

// ff.FF.prototype.getUserIds = function(callback) {
// 	async.parallel([
// 		_.bind(function(callback) {
// 			this.espn.getUserId(function(userId) {
// 				console.log('espn getUserId came back with', userId);
// 			  callback();
// 		  });
// 		}, this),
// 		// _.bind(function(callback) {
// 		// 	this.yahoo.getUserId(function(userId) {
// 		// 		console.log('yahoo getUserId came back with ', userId);
// 		// 		callback();
// 		// 	});
// 		// }, this),
// 	], _.bind(function(err, results) {
// 		this.installContext = false;
// 		callback({espn: this.espn.getSiteUserKey(), yahoo: this.yahoo.getSiteUserKey()});
// 	}, this));
// };

ff.FF.prototype.getLeaguesFromStorage = function() {
	var leagues = [];
	leagues = leagues.concat(this.espn.getLeaguesFromStorage());
	leagues = leagues.concat(this.yahoo.getLeaguesFromStorage());
	return leagues;
};

// Parses team info from URL
// Used by:
// - fetchTakenPlayersForLeague
ff.FF.prototype.getUrlVars = function(url) {
	var hash;
    var vars = {};
    var hashes = url.slice(url.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        // vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
};

// ff.FF.prototype.fetchPage = function(url, callback) {
// 	var waiting = false;
// 	var requestedUrl = '';
// 	function loadPage(url){ // Call this function to start
// 	    var frame = document.getElementsByTagName('iframe')[0];
// 	    frame.src = url;
// 	    waiting = true;
// 	    requestedUrl = url;
// 	};

// 	chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
// 	    if(request.loaded && waiting && request.loaded === requestedUrl){
// 	        document.getElementsByTagName('iframe')[0].src = 'about:blank';
// 	        waiting = false;
// 	        callback(request.page);
// 	    }
// 	});

// 	loadPage(url);
// };

ff.FF.prototype.updatePlayerStatus = function(player) {
	var leagues = this.getLeaguesFromStorage();
	player.leagueStatus.length = 0;
	for (var i = 0; i < leagues.length; ++i) {
		var league = leagues[i];
		var leagueId = league.leagueId;
		var teamId = league.teamId;

		var playerStatus = new PlayerStatus();
		playerStatus.site = league.site;
		playerStatus.leagueId = leagueId;
		playerStatus.leagueName = leagues[i].leagueName;

		var idForSite = player.id;
		var ownedByTeamId = league.playerIdToTeamIndex[idForSite];

		if (ownedByTeamId) {
			playerStatus.ownedByTeamName = league.shortNames[ownedByTeamId-1];
			if (ownedByTeamId === teamId) {
				playerStatus.status = DROP;
				playerStatus.actionUrl = this[league.site].buildDropUrl(idForSite, league);
			} else {
				playerStatus.status = TRADE;
				playerStatus.actionUrl = this[league.site].buildTradeUrl(idForSite, ownedByTeamId, league);
			}

			player.leagueStatus.push(playerStatus);
		} else {
			playerStatus.status = FREE_AGENT;
			playerStatus.actionUrl = this[league.site].buildFreeAgentUrl(idForSite, league);
			player.leagueStatus.push(playerStatus);
		}
	}
};

// TODO
ff.FF.prototype.playerSearch = function(searchSpace, playerName, callback) {
	var players = _.values(searchSpace);
	var names = _.keys(searchSpace);
	var validPlayers = _.filter(players, function(player) {
		return player.name.toLowerCase().indexOf(playerName) >= 0;
	});

	return callback(validPlayers);
};

// TODO: This needs to configure the actionUrls by sport and orgin of the league's site.
// If this call is coming from the parser, this will always be the espnId because
// it uses allNames to do the parsing.
ff.FF.prototype.getPlayerById = function(playerId) {
	var player = window.listOfPlayers[playerId];
	// We have to do this because Tony Curtis ID: 9434 exists in players.js but not in nameDict.js
	// TODO(tyler): Please pull all our data from the same data place...
	if (!player.id) {
		return;
	}
	this.updatePlayerStatus(player);

	return player;
};

ff.FF.prototype.getUserSettings = function () {
	return this.storage.get("global", "settings");
};

ff.FF.prototype.setUserSettings = function(settingObj) {
	var currSettings = this.getUserSettings();
	if (!currSettings) {
		currSettings = {};
	}

	var newSettingsKeys = _.keys(settingObj);
	for (var i = newSettingsKeys.length - 1; i >= 0; i--) {
		currSettings[newSettingsKeys[i]] = settingObj[newSettingsKeys[i]];
	}

	this.storage.set("global", "settings", currSettings);
};

// var POSITION_NAMES = {
//   0: 'QB',
//   2: 'RB',
//   4: 'WR',
//   6: 'TE',
//   8: 'DT',
//   9: 'DE',
//   10: 'LB',
//   12: 'CB',
//   13: 'S',
//   17: 'K',
//   18: 'P'
// };


PlayerStatus = function() {
	this.leagueId;
	this.leagueName;
	this.status;
	this.site;
	this.actionUrl;
	this.ownedByTeamName;
};

// Player = function(id) {
// 	this.id = id;
// 	this.name = window.players[id];
// 	this.leagueIds;
// 	if (!this.name) {
// 		return;
// 	}

// 	this.profileImage = 'http://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/' +
// 			this.id + '.png&w=350&h=254';
// 	this.playerProfileUrl = 'http://espn.go.com/nfl/player/_/id/' + this.id + '/';
// 	this.leagueStatus = [];
// 	this.positions = _.map(window.playerIdToPosition[id], function(val) {
// 		return POSITION_NAMES[val]
// 	});
// 	this.positions = this.positions.join(',');
// };

Player = function(id, name, team, pos, leagueId) {
	this.id = id;
	this.name = name;
	this.leagueIds;
	if (!this.name) {
		return;
	}
	this.team = team;
	var year = new Date().getFullYear();
	$.ajax({
		url: "http://games.espn.com/ffl/format/playerpop/overview?leagueId=" + leagueId + "&playerId=" + this.id + "&playerIdType=playerId&seasonId=" + year + "&xhr=1",
		type: "GET",
		success: function (response) {
			this.profileImage = $(response).find('.mugshot img').attr('src');
		}.bind(this)
	});
	this.playerProfileUrl = 'http://espn.go.com/nfl/player/_/id/' + this.id + '/';
	this.leagueStatus = [];
	this.positions = pos;
};

ff.FF.prototype.addBlacklistURL = function(url) {
	var currSettings = this.getUserSettings();
	var blacklist = currSettings===undefined ? [] : currSettings['blacklist'];
	if(blacklist===undefined) {
		blacklist = [];
	}

	if(blacklist.indexOf(url) == -1) {
		blacklist.push(url);
	}
	this.setUserSettings({'blacklist' : blacklist});
};

ff.FF.prototype.removeBlacklistURL = function(url) {
	var currSettings = this.getUserSettings();
	var blacklist = currSettings===undefined ? [] : currSettings['blacklist'];
	if(blacklist===undefined) {
		blacklist = [];
	}
	var idx = blacklist.indexOf(url);
	if(idx !== -1) {
		blacklist.splice(idx, 1);
	}
	this.setUserSettings({'blacklist' : blacklist});
};