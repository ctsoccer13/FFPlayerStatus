if (!window.ff) {
	window.ff = {};
}

//http://games.YAHOO.go.com/ffl/format/playerpop/overview?leagueId=264931&playerId=12483&playerIdType=playerId&seasonId=2013&xhr=1
var YAHOO_BASE_URL = '';
var YAHOO_SEASON_ID = '2013';

var FREE_AGENT = 1;
var DROP = 2;
var TRADE = 3;

var YAHOO_POSITIONS = {
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

var YAHOO_POSITION_NAMES = {
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


ff.Yahoo = Site.extend({
	init: function(ff) {
		this._super(ff, 'yahoo');

		// We can't use the base 'http://sports.yahoo.com/fantasy/'
		// because Yahoo loads the team and user information asynchronously, and we can't use
		// and iFrame for Yahoo.
		this.fetchUserInfoUrl = 'http://football.fantasysports.yahoo.com/';

		// This is a little weird, but not sure where else to put it.
		this.urlToSport = {
			"football": "football",
			"baseball": "baseball"
		};
		this.baseUrl = 'http://football.fantasysports.yahoo.com/';
	},

	handleUserTeamsPage: function(userId, page) {
		var leagueElements = $(page).find('.Nav-fantasy').find('dd');
		var teamElements = $(page).find('.Nav-fantasy').find('dt');

		if (leagueElements.length > 0 && userId !== undefined) {
			this.resetStorage();
		} else {
			// TODO(tyler): What should we do here? Show a popup? this can happen if the user has
			// logged out of YAHOO as well.
			console.warn('no leagues found for user');
			console.log($(page));
			return;
		}

		for(var i = 0; i < leagueElements.length; i++) {
			var league = $(leagueElements[i]);
			var team = $(teamElements[i]);
			var leagueName = league.text();
			var teamName = team.text();
			var url = team.children().attr('href');
			var sport = this.getSportForLeagueUrl(url);

			// TODO Clean this garbage up.
			if (sport !== 'baseball' && sport !== 'football') {
				console.warn('Failed to find a valid sport from ', url);
				continue;
			}
			var leagueOfficeLink;

			// Build the regex as a string based on sport instead.
			if (sport === 'baseball') {
				leagueOfficeLink = team.children().attr('href').match(/\/b1\/([0-9]+\/[0-9]+)/);
			} else {
				leagueOfficeLink = team.children().attr('href').match(/\/f1\/([0-9]+\/[0-9]+)/);
			}

			var split = leagueOfficeLink[1].split('/');

			var league = {};
			league.leagueName = leagueName;
			league.teamName = teamName;
			league.leagueId = split[0];
			league.teamId = split[1];
			league.link = team.children().attr('href');
			league.sport = sport;
			league.site = this.site;
			league.seasonId = '2014';
			league.playerIdToTeamIndex = {};

			// Assuming these are all 2013 teams...
			this.addUserTeam(league);
		}
	},

	baseballFetchTakenPlayers: function(league) {
		//This gets Pitchers
		this.fetchTakenPlayersForLeagueAndPositionType(league, 'P');
		//This gets BAtters
		this.fetchTakenPlayersForLeagueAndPositionType(league, 'B');
	},

	footballFetchTakenPlayers: function(league) {
		this.fetchTakenPlayersForLeagueAndPositionType(league, 'O');
			// If the league supports defensive players
		this.fetchTakenPlayersForLeagueAndPositionType(league, 'DP');
	},

	getFetchPlayersUrl: function (league, positionType) {
		var sportUrlShort = '';
		if (league.sport === 'baseball') {
			sportUrlShort = 'b1';
		} else if (league.sport === 'football') {
			sportUrlShort = 'f1'
		}

		var urlString = 'http://'+ league.sport + '.fantasysports.yahoo.com/' + sportUrlShort + '/' + league.leagueId + '/players?&sort=PR&sdir=1&status=T';
		urlString += '&pos=' + positionType +'&stat1=S_S_2013&jsenabled=1&jsenabled=1';

		return urlString;
	},

	fetchTakenPlayersForLeagueAndPositionType: function(league, positionType, offset) {
		urlString = this.getFetchPlayersUrl(league, positionType);
		if (offset !== undefined) {
			urlString += '&count=' + offset;
		}
		console.log(urlString);

		var findOwnerIndex = function (headerDivs) {
			var index = false;
			for (var i = 0; i < headerDivs.length; i++) {
				var currHeaderDiv = headerDivs[i];
				if($(currHeaderDiv).html().toLowerCase() === "owner") {
					index = i;
				}
			}

			return index;
		};

		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
		      var elements = $($('<div>').html(data)[0]).find('.players tbody tr');
		      //Should be each player row

		      var ownerIndex = findOwnerIndex($(data).find(".players thead tr.Last th>div"));

		      for(var i = 0; i < elements.length; i++) {
						var currPlayerRow = $(elements[i]);
						var playerAnchor = $(currPlayerRow.children()[1]).find('.name');
						var ownerAnchor = $(currPlayerRow.children()[ownerIndex]).find('a');

						var currPlayerId =  $(playerAnchor).attr('href').match(/players\/([0-9]+)/)[1];
						var owningTeamId = $(ownerAnchor).attr('href').match(/\/[0-9]+\/([0-9]+)/)[1];
						if (owningTeamId) {
							this.addPlayerMapping(league, currPlayerId, owningTeamId);
						}
		      }
		      if (elements.length === 25) {
		      	if (offset === undefined) {
		      		offset = 0;
		      	}
		      	offset += 25;
		      	this.fetchTakenPlayersForLeagueAndPositionType(league, positionType, offset)
		      }
	  	}, this)
		});
	},

	//http://football.fantasysports.yahoo.com/f1/302311/2/settings
	fetchPlayerOptionsForLeagueId: function(league) {
		var regex = new RegExp(/\((.*?)\)/);
		var urlString = 'http://football.fantasysports.yahoo.com/f1/' + league.leagueId + '/2/settings';
		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
				var positionStrings =
					$(data).find("#settings-table td:contains('Roster') + .typeStandard b").text();
				var options = positionStrings.split(',');

				var YAHOO_POSITIONS = [];
				for (var i = options.length - 1; i >= 0; i--) {
					var option = options[i].trim();
					console.log('found yahoo player position ', option);
					if (option) {
						var ps = matchPlayerType(option);
						YAHOO_POSITIONS = YAHOO_POSITIONS.concat(ps);
					}
				}
				league.playerOptions = _.uniq(YAHOO_POSITIONS);
				console.log('player options ', league.playerOptions)
				this.save();
			}, this)
		});


		var matchPlayerType = function(leaguePlayerOption) {
			var YAHOO_POSITIONS = [];
			switch (leaguePlayerOption) {
			  case 'QB':
			    YAHOO_POSITIONS.push('QB');
			    break;
			  case 'RB':
			    YAHOO_POSITIONS.push('RB');
			    break;
			  case 'WR':
			    YAHOO_POSITIONS.push('WR');
			    break;
			  case 'TE':
			    YAHOO_POSITIONS.push('TE');
			    break;
			  case 'Q/W/R/T':
			  	YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE'); YAHOO_POSITIONS.push('RB'); YAHOO_POSITIONS.push('QB');
			  	break;
			  case 'W/R/T':
			    YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE'); YAHOO_POSITIONS.push('RB');
			    break;
			  case 'W/R':
			    YAHOO_POSITIONS.push('RB'); YAHOO_POSITIONS.push('WR');
			    break;
			  case 'W/T':
			    YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE');
			    break;
			  case 'OP':
			    YAHOO_POSITIONS.push('QB'); YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE');
			    YAHOO_POSITIONS.push('RB');
			    break;
			  case 'DT':
			    YAHOO_POSITIONS.push('DT');
			    break;
			  case 'DL':
			    YAHOO_POSITIONS.push('DT'); YAHOO_POSITIONS.push('DE');
			    break;
			  case 'DE':
			    YAHOO_POSITIONS.push('DE');
			    break;
			  case 'LB':
			    YAHOO_POSITIONS.push('LB');
			    break;
			  case 'DL':
			    YAHOO_POSITIONS.push('DT'); YAHOO_POSITIONS.push('DE');
			    break;
			  case 'DT':
			    YAHOO_POSITIONS.push('DT');
			    break;
			  case 'CB':
			    YAHOO_POSITIONS.push('CB');
			    break;
			  case 'S':
			    YAHOO_POSITIONS.push('S');
			    break;
			  case 'DB':
			    YAHOO_POSITIONS.push('S');
			    YAHOO_POSITIONS.push('CB');
			    break;
			  case 'D':
			    YAHOO_POSITIONS.push('S'); YAHOO_POSITIONS.push('CB'); YAHOO_POSITIONS.push('DT');
			    YAHOO_POSITIONS.push('DE'); YAHOO_POSITIONS.push('LB');
			    break;
			  case 'K':
			    YAHOO_POSITIONS.push('K');
			    break;
			};
			return YAHOO_POSITIONS;
		}
	},

	buildDropUrl: function(playerId, league) {
		// This can be comboed into dropping and adding at the same time
		// http://football.fantasysports.yahoo.com/f1/302311/addplayer?apid=25802&dpid=24912

		///f1/302311/2/dropplayer?dpid=24912
		return this.baseUrl + 'f1/' + league.leagueId + '/' + league.teamId + '/dropplayer?dpid=' + playerId;
	},

	buildTradeUrl: function(playerId, ownedByTeamId, league) {
		var params = {
			teamId: ownedByTeamId,
			leagueId: league.leagueId,
			trans: '4_' + playerId + '_'
		};

		// 2 is your team id
		// stage=1 must be present
		// mid2=3 2 is your team id to their team id
		// tpids = the player you want
		///f1/302311/2/proposetrade?stage=1&mid2=3&tpids[]=7200
		return this.baseUrl + 'f1/' + league.leagueId + '/' + league.teamId + '/proposetrade?stage=1&' +
			'mid' + league.teamId + '=' + ownedByTeamId + '&tpids[]=' + playerId;
	},

	buildFreeAgentUrl: function(playerId, league) {
		//f1/302311/addplayer?apid=25802
		return this.baseUrl + 'f1/' + league.leagueId + '/' + league.teamId + '/addplayer?apid=' + playerId;
	},

	getTransactions: function() {
		for (var i = this.leagues.length - 1; i >= 0; i--) {
			var league = this.leagues[i];
			var url = this.baseUrl + 'f1/' + league.leagueId + '/transactions';
			this.getTransactionsForLeague(league, url);
		};

	},

	getTransactionsForLeague: function(league, url) {
		this.makeRequest(url, _.bind(function(data) {
			var transactions = $(data).find('#transactions');
			if (transactions.length === 0) {
				return;
			}
			$(data).find('#transactions').find('tbody').find('tr').each(function(trIndex, tr) {
				// This is gonna suck
				var regex = /players\/(\d*)$/;
				var transaction = $(tr).find('td:nth-child(2) div');
				if (transaction.length === 1) {
					var href = $($(transaction[0]).find('a')[0]).attr('href');
					// Extract from this "http://sports.yahoo.com/nfl/players/24788"
					var playerId = regex.exec(href)[1];
					var tranType = $($(transaction[0]).find('h6')).text().trim();
					if (tranType === 'Free Agent') {
						tranType = 'Add';
					} else if (tranType === 'To Waivers') {
						tranType = 'Drop';
					} else if (tranType === 'Trade?') {
						tranType = 'Trade';
					}

					if (playerId && tranType) {
						//Report to server.
					}


				} else if (transaction.length > 1) {
					// Report an add/drop or trade or something....
					// This was a combo add/drop

					// A trade might have more than 2.. test this.


				}

			});
		}, this));
	}

});







