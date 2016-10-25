if (!window.ff) {
	window.ff = {};
}


var FREE_AGENT = 1;
var DROP = 2;
var TRADE = 3;

var ESPN_POSITIONS = {
  QB: 0,
  RB: 2,
  WR: 4,
  TE: 6,
  DT: 8,
  DE: 9,
  LB: 10,
  CB: 12,
  S: 13,
  K: 17,
  P: 18
};

var ESPN_POSITION_NAMES = {
  0: 'QB',
  2: 'RB',
  4: 'WR',
  6: 'TE',
  8: 'DT',
  9: 'DE',
  10: 'LB',
  12: 'CB',
  13: 'S',
  17: 'K',
  18: 'P'
};

ff.Espn = Site.extend({
	init: function(ff) {
		this._super(ff, 'espn');

		this.fetchUserInfoUrl = 'http://www.espn.com/fantasy';
		this.baseUrl = 'http://games.espn.go.com/';
	},

	getLocalLeague: function(league) {
		for(var i = 0; i < this.leagues.length; i++) {
			if (this.leagues[i].leagueId === league.leagueId) {
				return this.leagues[i];
			}
		}	
	},

	// updateLocalLeague: function(league) {
	// 	for(var i = 0; i < this.leagues.length; i++) {
	// 		if(this.leagues[i].leagueId === league.leagueId) {
	// 			this.leagues[i] = league;
	// 		}
	// 	}
	// },

	refreshTakenPlayers: function(league) {
		league.playerIdToTeamIndex = {};
		this.fetchTakenPlayers(league);
	},

	fetchTakenPlayers: function(league) {
		this._fetchTakenPlayersForLeague(league);
	},

	_fetchTakenPlayersForLeague: function(league, opt_offset, opt_slotCategoryGroup) {
		var urlString = 'http://games.espn.go.com/ffl/freeagency?leagueId=' + league.leagueId + '&seasonId=' + league.seasonId + '&avail=4';
		if (!!opt_offset) {
			urlString += '&startIndex=' + opt_offset;
		}
		if (!!opt_slotCategoryGroup) {
			urlString += '&slotCategoryGroup=' + opt_slotCategoryGroup
		}

		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
	      var elements = $($('<div>').html(data)[0]).find('table.playerTableTable tr.pncPlayerRow');
	      //Should be each player row
	      for(var i = 0; i < elements.length; i++) {
	           var currPlayerRow = $(elements[i]);
	           var currPlayerId =  $(currPlayerRow).attr('id').substring(4);
	           var owningTeamEl = $(currPlayerRow).find('td:nth-child(3) a');

	           if ($(owningTeamEl).length > 0) {
	             var owningTeamUrlVars = this.ff.getUrlVars($(owningTeamEl).attr('href'));
	             var owningTeamId = owningTeamUrlVars.teamId;
	             this.addPlayerMapping(league, currPlayerId, owningTeamId);
	       	   }
	      }
	      if (elements.length === 50) {
	      	if (opt_offset === undefined) {
	      		opt_offset = 0;
	      	}
	      	opt_offset += 50;
	      	this._fetchTakenPlayersForLeague(league, opt_offset, opt_slotCategoryGroup);
	      } else {
	      	this.updateLocalLeague(league);
	      	this.save();
	      }
	  	}, this)
		});

	},

	fetchAllPlayersForLeague: function(league, listOfPlayers, opt_offset) {
		var urlString = 'http://games.espn.go.com/ffl/freeagency?leagueId=' + league.leagueId + '&seasonId=' + league.seasonId + '&avail=-1';
		if (!!opt_offset) {
			urlString += '&startIndex=' + opt_offset;
		}
		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
	      var elements = $($('<div>').html(data)[0]).find('table.playerTableTable tr.pncPlayerRow');
	      //Should be each player row
	      for(var i = 0; i < elements.length; i++) {
	           var currPlayerRow = $(elements[i]);
	           var currPlayerId =  $(currPlayerRow).attr('id').substring(4);
	           var nameDiv = $(currPlayerRow).find('td.playertablePlayerName');
	           var parts = nameDiv[0].innerText.split(",");
	           var name = parts[0];
	           if(name.includes("D/ST")) {
	           		var nametoks = name.split(/\s+/);
	           		name = nametoks[0] + " " + nametoks[1];
	           		var player = new Player(currPlayerId, name, null, "D/ST", league.leagueId, 'espn');
	           		listOfPlayers[currPlayerId] = player;
	           		this.addPlayerToDict(player);
	           		continue;
	           }
	           var team = parts[1].split(/\s+/)[1];
	           var pos = parts[1].split(/\s+/)[2];
	           var statusSpan = $(nameDiv).find("span");
	           var status = statusSpan ? $(statusSpan).attr("title") : '';
	           var player = new Player(currPlayerId, name, team, pos, league.leagueId, 'espn');

	           listOfPlayers[currPlayerId] = player;
	           this.addPlayerToDict(player);
	      }
	      if (elements.length === 50) {
	      	if (opt_offset === undefined) {
	      		opt_offset = 0;
	      	}
	      	opt_offset += 50;
	      	this.fetchAllPlayersForLeague(league, listOfPlayers, opt_offset);
	      }
	  	}, this)
		});
	},

	addPlayerIdsForSite: function(league, opt_offset) {
		var urlString = 'http://games.espn.go.com/ffl/freeagency?leagueId=' + league.leagueId + '&seasonId=' + league.seasonId + '&avail=-1';
		if (!!opt_offset) {
			urlString += '&startIndex=' + opt_offset;
		}
		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
	      var elements = $($('<div>').html(data)[0]).find('table.playerTableTable tr.pncPlayerRow');
	      //Should be each player row
	      for(var i = 0; i < elements.length; i++) {
	           var currPlayerRow = $(elements[i]);
	           var currPlayerId =  $(currPlayerRow).attr('id').substring(4);
	           var nameDiv = $(currPlayerRow).find('td.playertablePlayerName');
	           var parts = nameDiv[0].innerText.split(",");
	           var name = parts[0];
	           if(name.includes("D/ST")) {
	           		continue;
	           // 		var nametoks = name.split(/\s+/);
	           // 		name = nametoks[0] + " " + nametoks[1];
	           }
	           var names = name.split(/\s+/);
	           var firstName = names[0].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
	           var lastName = names[names.length-1].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
	           if(window.playerDict[lastName]===undefined) {
	           	console.log("no entry for " + firstName + " " + lastName);
	           	continue;
	           }
	           var player = window.playerDict[lastName][firstName];
	           if(player === undefined) {
	           		var oldFirstName = firstName; 
	           		if(firstName === 'steven') firstName = 'stephen';
	           		else if (firstName==='stephen') firstName = 'steven';
	           		else if (firstName==='rob') firstName = 'robert';
	           		else if (firstName==='robert') firstName = 'rob';
	           		else if (firstName==='benjamin') firstName = 'benny';
	           		else if (firstName==='benny') firstName = 'benjamin';
	           		else if (firstName==='walt') firstName = 'walter';
	           		else if (firstName==='walter') firstName = 'walt';
	           		player = window.playerDict[lastName][firstName];
	           		window.playerDict[lastName][oldFirstName] = player;
	           }
	           if(player !== undefined) {
	           		player.otherIds['espn'] = currPlayerId;
	           }
	      }
	      if (elements.length === 50) {
	      	if (opt_offset === undefined) {
	      		opt_offset = 0;
	      	}
	      	opt_offset += 50;
	      	this.addPlayerIdsForSite(league, opt_offset);
	      }
	  	}, this)
		});
	},

	buildDropUrl: function(playerId, league) {
		var params = {
			leagueId: league.leagueId,
			teamId: league.teamId,
			incoming: 1,
			trans: '3_' + playerId + '_' + league.teamId +'_20_-1_1001'
		};

		//ffl/clubhouse?leagueId=291420&teamId=1&incoming=1&trans=3_1428_1_20_-1_1001')
		return this.baseUrl + 'ffl/clubhouse?' + $.param(params);
	},

	buildTradeUrl: function(playerId, ownedByTeamId, league) {
		var params = {
			teamId: ownedByTeamId,
			leagueId: league.leagueId,
			trans: '4_' + playerId + '_'
		};

		//ffl/trade?teamId=1&leagueId=264931&trans=4_10452_
		return this.baseUrl + 'ffl/trade?' + $.param(params);
	},

	buildFreeAgentUrl: function(playerId, league) {
		var params = {
			incoming: 1,
			leagueId: league.leagueId,
			trans: '2_' + playerId + '_-1_1001_' + league.teamId +'_20'
		};

		//ffl/freeagency?leagueId=264931&incoming=1&trans=2_8416_-1_1001_1_20'

		//ffl/freeagency?leagueId=264931&incoming=1&trans=2_11252_-1_1001_2_20'
		return this.baseUrl + 'ffl/freeagency?' + $.param(params);
	}
});





