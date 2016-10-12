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
		// this.requireIframe = true;
		this.baseUrl = 'http://games.espn.go.com/';

		// This is a little weird, but not sure where else to put it.
		this.urlToSport = {
			"ffl": "football",
			"flb": "baseball"
		};
	},

	// handleUserTeamsPage: function(userId, page) {
	// 	// var leagueElements = $(page).find('ul.my-teams li.user-entry:not(.signup) a.leagueoffice-link');
	// 	// var teamElements = $(page).find('ul.my-teams li.user-entry:not(.signup) a.clubhouse-link');

	// 	// if (leagueElements.length > 0 && userId !== undefined) {
	// 	// 	this.resetStorage();
	// 	// } else {
	// 	// 	// TODO(tyler): What should we do here? Show a popup? this can happen if the user has
	// 	// 	// logged out of espn as well.
	// 	// 	console.warn('no leagues found for user');
	// 	// 	console.log($(page));
	// 	// 	return;
	// 	// }
	// 	// for(var i = 0; i < leagueElements.length; i++) {
	// 	// 	var leagueElement = $(leagueElements[i]);
	// 	// 	var team = $(teamElements[i]);
	// 	// 	var leagueName = leagueElement.text();
	// 	// 	var teamName = team.text();
	// 	// 	var leagueOfficeLink = leagueElement.attr('href');
	// 	var leagues = this.getLeaguesFromStorage();

	// 		// var league = this.ff.getUrlVars("http://games.espn.com/ffl/freeagency?leagueId=703055&seasonId=2016");
	// 		// league.leagueName = 'Taco\'s Truck';
	// 		// league.teamName = 'Slob on my Cobb';
	// 		// league.site = 'espn';
	// 		// league.sport = 'football';
	// 		// league.playerIdToTeamIndex = {};

	// 		// this.addUserTeam(league);
	// 		// if (league.seasonId === '2014') {
	// 		// 	this.addUserTeam(userId, league);
	// 		// }
	// 	//}
	// },

	baseballFetchTakenPlayers: function(league) {
		console.log('baseball league', league);

		//batters
		//&slotCategoryGroup=1
		//pitchers = 2
		this._fetchTakenPlayersForLeague(league, undefined, 1);
		this._fetchTakenPlayersForLeague(league, undefined, 2);
	},


	footballFetchTakenPlayers: function(league) {
		this._fetchTakenPlayersForLeague(league);
	},

	getLocalLeague: function(league) {
		for(var i = 0; i < this.leagues.length; i++) {
			if (this.leagues[i].leagueId === league.leagueId) {
				return this.leagues[i];
			}
		}	
	},

	_fetchTakenPlayersForLeague: function(league, opt_offset, opt_slotCategoryGroup) {
		// var shortcut = league.sport === 'baseball' ? 'flb' : 'ffl
		// league = this.getLocalLeague(league);
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
	      	this.save();
	      }
	  	}, this)
		});

	},

	addPlayerToDict: function(player) {
		var firstName = player.name.split(/\s+/)[0].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
		var lastName = player.name.split(/\s+/)[1].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');

		if(!(lastName in window.playerDict)) {
			window.playerDict[lastName] = {};
		}
		window.playerDict[lastName][firstName] = player;
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
	           var name = nameDiv[0].innerText.split(",")[0];
	           if(name.includes("D/ST")) {
	           		var nametoks = name.split(/\s+/);
	           		name = nametoks[0] + " " + nametoks[1];
	           		var player = new Player(currPlayerId, name, null, "D/ST");
	           		listOfPlayers[currPlayerId] = player;
	           		this.addPlayerToDict(player);
	           		continue;
	           }
	           var tmp = nameDiv[0].innerText.split(" ")[2];
	           var team = tmp.split(/\s+/)[0];
	           var pos = tmp.split(/\s+/)[1];
	           var player = new Player(currPlayerId, name, team, pos);

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

	fetchPlayerOptionsForLeagueId: function(league) {
		var shortcut = league.sport === 'baseball' ? 'flb' : 'ffl';
		var regex = new RegExp(/\((.*?)\)/);
		var urlString = 'http://games.espn.go.com/' + shortcut + '/leaguesetup/settings?leagueId=' + league.leagueId;
		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
				var positionRows = $(data).find('.leagueSettingsTable .slotSectionMiniHeader').siblings();
				var ESPN_POSITIONS = [];
				for (var i = positionRows.length - 1; i >= 0; i--) {
					var children = $(positionRows[i]).children();
					var text = $(children[0]).text();

					var matches = regex.exec(text);
					if (matches[1]) {
						var ps = matchPlayerType(matches[1]);
						ESPN_POSITIONS = ESPN_POSITIONS.concat(ps);
					}
				}
				league.playerOptions = _.uniq(ESPN_POSITIONS);
				console.log('player options ', league)
				this.save();
			}, this)
		});


		var matchPlayerType = function(leaguePlayerOption) {
			var ESPN_POSITIONS = [];
			switch (leaguePlayerOption) {
			  case 'QB':
			    ESPN_POSITIONS.push('QB');
			    break;
			  case 'RB':
			    ESPN_POSITIONS.push('RB');
			    break;
			  case 'RB/WR':
			    ESPN_POSITIONS.push('RB'); ESPN_POSITIONS.push('WR');
			    break;
			  case 'WR':
			    ESPN_POSITIONS.push('WR');
			    break;
			  case 'WR/TE':
			    ESPN_POSITIONS.push('WR'); ESPN_POSITIONS.push('TE');
			    break;
			  case 'TE':
			    ESPN_POSITIONS.push('TE');
			    break;
			  case 'RB/WR/TE':
			    ESPN_POSITIONS.push('WR'); ESPN_POSITIONS.push('TE'); ESPN_POSITIONS.push('RB');
			    break;
			  case 'OP':
			    ESPN_POSITIONS.push('QB'); ESPN_POSITIONS.push('WR'); ESPN_POSITIONS.push('TE');
			    ESPN_POSITIONS.push('RB');
			    break;
			  case 'DT':
			    ESPN_POSITIONS.push('DT');
			    break;
			  case 'DE':
			    ESPN_POSITIONS.push('DE');
			    break;
			  case 'LB':
			    ESPN_POSITIONS.push('LB');
			    break;
			  case 'DL':
			    ESPN_POSITIONS.push('DT'); ESPN_POSITIONS.push('DE');
			    break;
			  case 'DT':
			    ESPN_POSITIONS.push('DT');
			    break;
			  case 'CB':
			    ESPN_POSITIONS.push('CB');
			    break;
			  case 'S':
			    ESPN_POSITIONS.push('S');
			    break;
			  case 'DB':
			    ESPN_POSITIONS.push('S');
			    ESPN_POSITIONS.push('CB');
			    break;
			  case 'DP':
			    ESPN_POSITIONS.push('S'); ESPN_POSITIONS.push('CB'); ESPN_POSITIONS.push('DT');
			    ESPN_POSITIONS.push('DE'); ESPN_POSITIONS.push('LB');
			    break;
			  case 'K':
			    ESPN_POSITIONS.push('K');
			    break;
			  case 'P':
			    ESPN_POSITIONS.push('P');
			    break;
			};
			return ESPN_POSITIONS;
		}
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





