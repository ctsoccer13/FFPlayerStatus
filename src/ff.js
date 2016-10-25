if (!window.ff) {
	window.ff = {};
}

ff.FF = function(storage) {
	this.storage = storage;

	this.espn = new ff.Espn(this);
	this.yahoo = new ff.Yahoo(this);
	this.customMappings = this.storage.get("global", "nicknames") || {};
};

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

		var idForSite;
		if (league.site === player.site) {
			idForSite = player.id;
		} else {
			idForSite = player.otherIds[league.site];
		}
		var ownedByTeamId = league.playerIdToTeamIndex[idForSite];

		if (ownedByTeamId) {
			playerStatus.ownedByTeamName = league.shortNames[ownedByTeamId];
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

ff.FF.prototype.playerSearch = function(searchSpace, playerName, callback) {
	var players = _.values(searchSpace);
	var names = _.keys(searchSpace);
	var validPlayers = _.filter(players, function(player) {
		return player.name.toLowerCase().indexOf(playerName) >= 0;
	});

	return callback(validPlayers);
};

ff.FF.prototype.getPlayerById = function(playerId) {
	var player = window.listOfPlayers[playerId];
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

ff.FF.prototype.addCustomMapping = function(nickname, playerId) {
	this.customMappings[nickname] = playerId;
	this.storage.set("global", "nicknames", this.customMappings);
};

ff.FF.prototype.removeCustomMapping = function(nickname, playerId) {
	delete this.customMappings[nickname];
	this.storage.set("global", "nicknames", this.customMappings);
};

ff.FF.prototype.getCustomMapping = function() {
	return this.customMappings;
};

PlayerStatus = function() {
	this.leagueId;
	this.leagueName;
	this.status;
	this.site;
	this.actionUrl;
	this.ownedByTeamName;
};

Player = function(id, name, team, pos, leagueId, site) {
	this.id = id;
	this.name = name;
	this.leagueIds;
	if (!this.name) {
		return;
	}
	this.team = team;
	var year = new Date().getFullYear();
	if(site === 'espn') {
		$.ajax({
			url: "http://games.espn.com/ffl/format/playerpop/overview?leagueId=" + leagueId + "&playerId=" + this.id + "&playerIdType=playerId&seasonId=" + year + "&xhr=1",
			type: "GET",
			success: function (response) {
				this.profileImage = $(response).find('.mugshot img').attr('src');
			}.bind(this)
		});
		this.playerProfileUrl = 'http://espn.go.com/nfl/player/_/id/' + this.id + '/';
	}
	else if (site === 'yahoo') {
		this.playerProfileUrl = 'http://sports.yahoo.com/nfl/players/' + this.id;
		$.ajax({
			url: this.playerProfileUrl,
			type: "GET",
			success: function (response) {
				var img = $(response).find('.player-image > img').css('background-image');
				if (img !== undefined) {
					img = img.replace('url(', '').replace(')', '').replace(/\"/gi, "");
				}
				this.profileImage = img;
			}.bind(this)
		});
	}
	this.site = site;
	this.otherIds = {};
	this.leagueStatus = [];
	this.positions = pos;
	// this.status = status;
};