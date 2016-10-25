if (!window.ff) {
	window.ff = {};
}

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

	// handleUserTeamsPage: function(userId, page) {
	// 	var leagueElements = $(page).find('.Nav-fantasy').find('dd');
	// 	var teamElements = $(page).find('.Nav-fantasy').find('dt');

	// 	if (leagueElements.length > 0 && userId !== undefined) {
	// 		this.resetStorage();
	// 	} else {
	// 		// TODO(tyler): What should we do here? Show a popup? this can happen if the user has
	// 		// logged out of YAHOO as well.
	// 		console.warn('no leagues found for user');
	// 		console.log($(page));
	// 		return;
	// 	}

	// 	for(var i = 0; i < leagueElements.length; i++) {
	// 		var league = $(leagueElements[i]);
	// 		var team = $(teamElements[i]);
	// 		var leagueName = league.text();
	// 		var teamName = team.text();
	// 		var url = team.children().attr('href');
	// 		var sport = this.getSportForLeagueUrl(url);

	// 		// TODO Clean this garbage up.
	// 		if (sport !== 'baseball' && sport !== 'football') {
	// 			console.warn('Failed to find a valid sport from ', url);
	// 			continue;
	// 		}
	// 		var leagueOfficeLink;

	// 		// Build the regex as a string based on sport instead.
	// 		if (sport === 'baseball') {
	// 			leagueOfficeLink = team.children().attr('href').match(/\/b1\/([0-9]+\/[0-9]+)/);
	// 		} else {
	// 			leagueOfficeLink = team.children().attr('href').match(/\/f1\/([0-9]+\/[0-9]+)/);
	// 		}

	// 		var split = leagueOfficeLink[1].split('/');

	// 		var league = {};
	// 		league.leagueName = leagueName;
	// 		league.teamName = teamName;
	// 		league.leagueId = split[0];
	// 		league.teamId = split[1];
	// 		league.link = team.children().attr('href');
	// 		league.sport = sport;
	// 		league.site = this.site;
	// 		league.seasonId = '2014';
	// 		league.playerIdToTeamIndex = {};

	// 		// Assuming these are all 2013 teams...
	// 		this.addUserTeam(league);
	// 	}
	// },

	getFetchPlayersUrl: function (league, taken, pos) {
		var sportUrlShort = '';
		if (league.sport === 'baseball') {
			sportUrlShort = 'b1';
		} else if (league.sport === 'football') {
			sportUrlShort = 'f1'
		}

		var urlString = 'http://'+ league.sport + '.fantasysports.yahoo.com/' + sportUrlShort + '/' + league.leagueId + '/players?&sort=PR&sdir=1&status=';
		urlString += taken ? 'T' : 'ALL';
		urlString += '&pos=' + pos + '&stat1=S_S_' + new Date().getFullYear() + '&jsenabled=1';

		return urlString;
	},

	fetchTakenPlayers: function(league) {
		this._fetchTakenPlayersForLeague(league, 'O');
		this._fetchTakenPlayersForLeague(league, 'K');
	},

	_fetchTakenPlayersForLeague: function(league, pos, offset) {
		urlString = this.getFetchPlayersUrl(league, true, pos);
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
		      		this._fetchTakenPlayersForLeague(league, pos, offset)
		      	}	else {
	      			this.updateLocalLeague(league);
	      			this.save();
	      		}
	  		}, this)
		});
	},

	fetchAllPlayersForLeague: function(league, listOfPlayers) {
		this._fetchAllPlayersForLeague(league, listOfPlayers, 'O');
		this._fetchAllPlayersForLeague(league, listOfPlayers, 'K');
	},

	_fetchAllPlayersForLeague: function(league, listOfPlayers, position, offset) {
		var urlString = this.getFetchPlayersUrl(league, false, position);
		if (offset !== undefined) {
			urlString += '&count=' + offset;
		}
		console.log(urlString);

		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
	      var elements = $($('<div>').html(data)[0]).find('.players tbody tr');
	      //Should be each player row
	      for(var i = 0; i < elements.length; i++) {
	           var currPlayerRow = $(elements[i]);
	           var playerAnchor = $(currPlayerRow.children()[1]).find('.name');

	           var currPlayerId =  $(playerAnchor).attr('href').match(/players\/([0-9]+)/)[1];
	           var name = $(playerAnchor).text();
	           // if(name.includes("D/ST")) {
	           // 		var nametoks = name.split(/\s+/);
	           // 		name = nametoks[0] + " " + nametoks[1];
	           // 		var player = new Player(currPlayerId, name, null, "D/ST", league.leagueId, '');
	           // 		listOfPlayers[currPlayerId] = player;
	           // 		this.addPlayerToDict(player);
	           // 		continue;
	           // }
	           var playerInfoAnchor = $(currPlayerRow.children()[1]).find('.ysf-player-name > span');
	           var parts = $(playerInfoAnchor).text().split(" - ");
	           var team = parts[0];
	           var pos = parts[1];
	           // var statusSpan = $(nameDiv).find("span");
	           // var status = statusSpan ? $(statusSpan).attr("title") : '';
	           var player = new Player(currPlayerId, name, team, pos, league.leagueId, 'yahoo');

	           listOfPlayers[currPlayerId] = player;
	           this.addPlayerToDict(player);
	      }
	      if (elements.length === 25) {
	      	if (offset === undefined) {
	      		offset = 0;
	      	}
	      	offset += 25;
	      	this._fetchAllPlayersForLeague(league, listOfPlayers, position, offset);
	      } else {
	      	console.log("done");
	      }
	  	}, this)
		});
	},

	addPlayerIdsForSite: function(league, offset) {
		var urlString = this.getFetchPlayersUrl(league);
		if (offset !== undefined) {
			urlString += '&count=' + offset;
		}
		$.ajax({
			url: urlString,
			data: 'text',
			success: _.bind(function(data) {
	      var elements = $($('<div>').html(data)[0]).find('.players tbody tr');
	      //Should be each player row
	      for(var i = 0; i < elements.length; i++) {
	           var currPlayerRow = $(elements[i]);
	           var playerAnchor = $(currPlayerRow.children()[1]).find('.name');

	           var currPlayerId =  $(playerAnchor).attr('href').match(/players\/([0-9]+)/)[1];
	           var name = $(playerAnchor).text();
	           // if(name.includes("D/ST")) {
	           // 		var nametoks = name.split(/\s+/);
	           // 		name = nametoks[0] + " " + nametoks[1];
	           // 		var player = new Player(currPlayerId, name, null, "D/ST", league.leagueId, '');
	           // 		listOfPlayers[currPlayerId] = player;
	           // 		this.addPlayerToDict(player);
	           // 		continue;
	           // }
	           var firstName = name.split(/\s+/)[0].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
	           var lastName = name.split(/\s+/)[1].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
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
	      if (elements.length === 25) {
	      	if (offset === undefined) {
	      		offset = 0;
	      	}
	      	offset += 25;
	      	this.fetchAllPlayersForLeague(league, offset);
	      } else {
	      	console.log("done");
	      }
	  	}, this)
		});
	},

	//http://football.fantasysports.yahoo.com/f1/302311/2/settings
	// fetchPlayerOptionsForLeagueId: function(league) {
	// 	var regex = new RegExp(/\((.*?)\)/);
	// 	var urlString = 'http://football.fantasysports.yahoo.com/f1/' + league.leagueId + '/2/settings';
	// 	$.ajax({
	// 		url: urlString,
	// 		data: 'text',
	// 		success: _.bind(function(data) {
	// 			var positionStrings =
	// 				$(data).find("#settings-table td:contains('Roster') + .typeStandard b").text();
	// 			var options = positionStrings.split(',');

	// 			var YAHOO_POSITIONS = [];
	// 			for (var i = options.length - 1; i >= 0; i--) {
	// 				var option = options[i].trim();
	// 				console.log('found yahoo player position ', option);
	// 				if (option) {
	// 					var ps = matchPlayerType(option);
	// 					YAHOO_POSITIONS = YAHOO_POSITIONS.concat(ps);
	// 				}
	// 			}
	// 			league.playerOptions = _.uniq(YAHOO_POSITIONS);
	// 			console.log('player options ', league.playerOptions)
	// 			this.save();
	// 		}, this)
	// 	});


	// 	var matchPlayerType = function(leaguePlayerOption) {
	// 		var YAHOO_POSITIONS = [];
	// 		switch (leaguePlayerOption) {
	// 		  case 'QB':
	// 		    YAHOO_POSITIONS.push('QB');
	// 		    break;
	// 		  case 'RB':
	// 		    YAHOO_POSITIONS.push('RB');
	// 		    break;
	// 		  case 'WR':
	// 		    YAHOO_POSITIONS.push('WR');
	// 		    break;
	// 		  case 'TE':
	// 		    YAHOO_POSITIONS.push('TE');
	// 		    break;
	// 		  case 'Q/W/R/T':
	// 		  	YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE'); YAHOO_POSITIONS.push('RB'); YAHOO_POSITIONS.push('QB');
	// 		  	break;
	// 		  case 'W/R/T':
	// 		    YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE'); YAHOO_POSITIONS.push('RB');
	// 		    break;
	// 		  case 'W/R':
	// 		    YAHOO_POSITIONS.push('RB'); YAHOO_POSITIONS.push('WR');
	// 		    break;
	// 		  case 'W/T':
	// 		    YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE');
	// 		    break;
	// 		  case 'OP':
	// 		    YAHOO_POSITIONS.push('QB'); YAHOO_POSITIONS.push('WR'); YAHOO_POSITIONS.push('TE');
	// 		    YAHOO_POSITIONS.push('RB');
	// 		    break;
	// 		  case 'DT':
	// 		    YAHOO_POSITIONS.push('DT');
	// 		    break;
	// 		  case 'DL':
	// 		    YAHOO_POSITIONS.push('DT'); YAHOO_POSITIONS.push('DE');
	// 		    break;
	// 		  case 'DE':
	// 		    YAHOO_POSITIONS.push('DE');
	// 		    break;
	// 		  case 'LB':
	// 		    YAHOO_POSITIONS.push('LB');
	// 		    break;
	// 		  case 'DL':
	// 		    YAHOO_POSITIONS.push('DT'); YAHOO_POSITIONS.push('DE');
	// 		    break;
	// 		  case 'DT':
	// 		    YAHOO_POSITIONS.push('DT');
	// 		    break;
	// 		  case 'CB':
	// 		    YAHOO_POSITIONS.push('CB');
	// 		    break;
	// 		  case 'S':
	// 		    YAHOO_POSITIONS.push('S');
	// 		    break;
	// 		  case 'DB':
	// 		    YAHOO_POSITIONS.push('S');
	// 		    YAHOO_POSITIONS.push('CB');
	// 		    break;
	// 		  case 'D':
	// 		    YAHOO_POSITIONS.push('S'); YAHOO_POSITIONS.push('CB'); YAHOO_POSITIONS.push('DT');
	// 		    YAHOO_POSITIONS.push('DE'); YAHOO_POSITIONS.push('LB');
	// 		    break;
	// 		  case 'K':
	// 		    YAHOO_POSITIONS.push('K');
	// 		    break;
	// 		};
	// 		return YAHOO_POSITIONS;
	// 	}
	// },

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
	}

	// getTransactions: function() {
	// 	for (var i = this.leagues.length - 1; i >= 0; i--) {
	// 		var league = this.leagues[i];
	// 		var url = this.baseUrl + 'f1/' + league.leagueId + '/transactions';
	// 		this.getTransactionsForLeague(league, url);
	// 	};

	// },

	// getTransactionsForLeague: function(league, url) {
	// 	this.makeRequest(url, _.bind(function(data) {
	// 		var transactions = $(data).find('#transactions');
	// 		if (transactions.length === 0) {
	// 			return;
	// 		}
	// 		$(data).find('#transactions').find('tbody').find('tr').each(function(trIndex, tr) {
	// 			// This is gonna suck
	// 			var regex = /players\/(\d*)$/;
	// 			var transaction = $(tr).find('td:nth-child(2) div');
	// 			if (transaction.length === 1) {
	// 				var href = $($(transaction[0]).find('a')[0]).attr('href');
	// 				// Extract from this "http://sports.yahoo.com/nfl/players/24788"
	// 				var playerId = regex.exec(href)[1];
	// 				var tranType = $($(transaction[0]).find('h6')).text().trim();
	// 				if (tranType === 'Free Agent') {
	// 					tranType = 'Add';
	// 				} else if (tranType === 'To Waivers') {
	// 					tranType = 'Drop';
	// 				} else if (tranType === 'Trade?') {
	// 					tranType = 'Trade';
	// 				}

	// 				if (playerId && tranType) {
	// 					//Report to server.
	// 				}


	// 			} else if (transaction.length > 1) {
	// 				// Report an add/drop or trade or something....
	// 				// This was a combo add/drop

	// 				// A trade might have more than 2.. test this.


	// 			}

	// 		});
	// 	}, this));
	// }

});







