if (!window.ff) {
	window.ff = {};
}

ff.Yahoo = Site.extend({

	init: function(ff) {
		this._super(ff, 'yahoo');
		this.baseUrl = 'http://football.fantasysports.yahoo.com/';
	},

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

	refreshTakenPlayers: function(league) {
		league.playerIdToTeamIndex = {};
		this.fetchTakenPlayers(league);
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

	fetchAllPlayersForLeague: function(league, listOfPlayers, settingsPort) {
		this._fetchAllPlayersForLeague(league, listOfPlayers, 'O', settingsPort);
		this._fetchAllPlayersForLeague(league, listOfPlayers, 'K');
	},

	_fetchAllPlayersForLeague: function(league, listOfPlayers, position, port, offset) {
		var urlString = this.getFetchPlayersUrl(league, false, position);
		if (offset !== undefined) {
			urlString += '&count=' + offset;
		}
		console.log(urlString);

		$.ajax({
			url: urlString,
			data: 'text',
			error: function() {
				console.log("error");
			},
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
	      	this._fetchAllPlayersForLeague(league, listOfPlayers, position, port, offset);
	      } else {
	      	console.log("done");
	      	if(port !== undefined) {
	      		port.postMessage({status: "addLeagueComplete"});
	      	}
	      }
	  	}, this)
		});
	},

	addPlayerIdsForSite: function(league, port) {
		this._addPlayerIdsForSite(league, 'O', port);
		this._addPlayerIdsForSite(league, 'K');
	},

	_addPlayerIdsForSite: function(league, position, port, offset) {
		var urlString = this.getFetchPlayersUrl(league, false, position);
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
	           if(lastName==='jr.' || lastName==='sr.' || lastName==='v' || lastName==='ii' || lastName==='iii') {
	           	lastName = names[names.length-2].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
	           }
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
	           		player.otherIds[league.site] = currPlayerId;
	           }
	      }
	      if (elements.length === 25) {
	      	if (offset === undefined) {
	      		offset = 0;
	      	}
	      	offset += 25;
	      	this._addPlayerIdsForSite(league, position, port, offset);
	      } else {
	      	console.log("done");
	      	if(port !== undefined) {
	      		port.postMessage({status: "addLeagueComplete"});
	      	}
	      }
	  	}, this)
		});
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
			'mid2=' + ownedByTeamId + '&tpids[]=' + playerId;
	},

	buildFreeAgentUrl: function(playerId, league) {
		//f1/302311/addplayer?apid=25802
		return this.baseUrl + 'f1/' + league.leagueId + '/' + league.teamId + '/addplayer?apid=' + playerId;
	}
});







