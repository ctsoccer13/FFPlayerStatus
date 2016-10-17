(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

var _gaq = _gaq || [];
var extensionId = chrome.i18n.getMessage("@@extension_id");
if (extensionId === 'ebaejgmbadoagcjkhimjifjhlckdmmbi') {
	_gaq.push(['_setAccount', 'UA-42785662-1']);
}
var MILLISECONDS_ONE_DAY = 86400000;
var MILLISECONDS_ONE_HOUR = 3600000;

var loginTab;

this.fantasyFind = new ff.FF(FFStorage);
var listOfPlayers = {};
var listOfPlayersInit = false;
var playerDict = {};

chrome.runtime.onInstalled.addListener(function(details) {
	// Force install for latest update;
	details.reason = 'install';

	if (details.reason == 'install') {
		var tempSettings = this.fantasyFind.getUserSettings();
		localStorage.clear();

		// Re-create FF because the sites loaded their information from disk.
		this.fantasyFind = new ff.FF(FFStorage);

		if (tempSettings !== undefined) {
			this.fantasyFind.setUserSettings(tempSettings);
		} else {
			this.fantasyFind.setUserSettings({inline: true});
		}
		// Don't get rid of the callback otherwise this won't work.
		chrome.tabs.create({url: 'settings.html', active: true}, function(tab) {});
	} else if (details.reason == 'update') {
		chrome.tabs.create({url: 'settings.html', active: true}, function(tab) {});
	}
});

var loadInstallPage = function() {
	chrome.tabs.create({url: 'install.html', active: true}, function(tab) {
		loginTab = tab;
	});
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		switch (request.method) {
			case 'getPlayerById':
				var player = this.fantasyFind.getPlayerById(request.playerId);
				sendResponse(player);
				break;

				// User logged in on the FE script
			// case 'yahooAuth':
			// case 'espnAuth':

			// 	var userId = request.userId;
			// 	var site = request.site;
			// 	console.log(site, ' has been authed with ', userId);
			// 	this.fantasyFind[site].setUserId(userId);

			// 	_gaq.push(['_trackEvent', 'Install', site + ' Auth Success']);

			// 	// Fetch the users teams and display them.
			// 	this.fantasyFind[site].fetchUserTeams(false /* forceReset */, function() {
			// 		if (loginTab) {
			// 			chrome.tabs.remove(loginTab.id);
			// 			loginTab = null;
			// 		}

			// 		var closeMsg = site + 'CloseTab';
			// 		// We have to ask the install script to close the tab for who knows what reason.
			// 		chrome.runtime.sendMessage({method: closeMsg});
			// 		chrome.runtime.sendMessage({method: 'loginSuccess',
			// 			userId: this.fantasyFind[site].getSiteUserKey(), site: site});
			// 	});
			// 	break;

			// case 'installFetchUserId':
			// 	console.log('Background is requesting to fetch all the user ids')
			// 	this.installContext = true;
			// 	// This happens to also get all the user teams as well.
			// 	this.fantasyFind.getUserIds(function(userIds) {
			// 		sendResponse(userIds);
			// 	});
			// 	break;

			// case 'parseUserRoster':
			// 	this.espn.fetchTakenPlayersForAllLeagues();
			// 	break;

			// case 'hardReset':
			// 	async.parallel([
			// 		_.bind(function(callback) {
			// 			this.fantasyFind.espn.fetchUserTeams(true /* forceReset */, function() {
			// 				callback();
			// 			});
			// 		}, this),
			// 		_.bind(function(callback) {
			// 			this.fantasyFind.yahoo.fetchUserTeams(true /* forceReset */, function() {
			// 				callback();
			// 			});
			// 		}, this),
			// 	], _.bind(function(err, results) {
			// 		this.installContext = false;
			// 		sendResponse({finishedAt: 0});
			// 	}, this));
			// 	break;

			case 'playerSearch':
				this.fantasyFind.playerSearch(window.listOfPlayers, request.query, function(results) {
					results.forEach(function(p) {
						this.fantasyFind.updatePlayerStatus(p);
					});
					sendResponse({results: results});
				});
				break;

			case "changeLeagueVisibility":
				var leagueId = request.leagueId;
				var hidden = request.hidden;
				this.fantasyFind.hideLeague(leagueId, hidden);
				break;

			case "changeSetting":
				this.fantasyFind.setUserSettings(request.query);
				break;

			case "getSettings":
				sendResponse(this.fantasyFind.getUserSettings());
				break;

			case "addBlacklistURL":
				sendResponse(this.fantasyFind.addBlacklistURL(request.url));
				break;

			case "removeBlacklistURL":
				sendResponse(this.fantasyFind.removeBlacklistURL(request.url));
				break;

			case "logStuff":
				_gaq.push(request.data);
				break;

			case "addTeam":
				// this.fantasyFind[request.site]._fetchTakenPlayersForLeague(request.league);
				sendResponse(this.fantasyFind[request.site].addUserTeam(request.league));
				break;

			case "checkAllPlayers":
				if(!window.listOfPlayersInit) {
					window.listOfPlayerInit = true;
					//this.fantasyFind[request.site].resetLeagues();
					this.fantasyFind[request.site].fetchAllPlayersForLeague(request.league, window.listOfPlayers);
				}
				sendResponse(true);
				break;
			case "getDict":
				sendResponse(window.playerDict);
				break;
		}
		return true;
});


// A little bit janky, but works incredibly better than chrome.tabs.update.
setInterval(function() {
	console.log('INTERVAL UPDATE');

	var lastLeagueUpdate = FFStorage.get('global', 'lastLeagueUpdate');
	if ((!lastLeagueUpdate) || (lastLeagueUpdate + MILLISECONDS_ONE_HOUR) < Date.now()) {
		console.log('no update in ages fetching new teams');
		// this.fantasyFind.espn.fetchUserTeams(true /* forceReset */);
		// this.fantasyFind.yahoo.fetchUserTeams(true /* forceReset */);
	}
}, MILLISECONDS_ONE_HOUR);


// setInterval(function() {
// 	this.fantasyFind.yahoo.getTransactions();
// }, 5 * 60 * 60 * 1000);


// var playersFetchedByPosition = function (sport, positionKey, allNames, playerIdToPositionDict, nameDict) {
// 	this.FFStorage.set("global","football_player_names", allNames);
// 	this.FFStorage.set("global", "football_player_ID_TO_POSITION", playerIdToPositionDict);
// 	this.FFStorage.set("global", "football_player_name_dict", nameDict);
// 	this.FFStorage.set("global", "football_players", newPlayers);
// 	console.log("Fetched:" + positionKey);
// };

// var POSITIONS = {
// 	QB: 0,
// 	RB: 2,
// 	WR: 4,
// 	TE: 6,
// 	DT: 8,
// 	DE: 9,
// 	LB: 10,
// 	CB: 12,
// 	S: 13,
// 	K: 17,
// 	P: 18
// };


// var BB_POSITIONS = {
// 	'C': 0,
// 	'1B': 1,
// 	'2B': 2,
// 	'3B': 3,
// 	'SS': 4,
// 	'OF': 5,
// 	'LF': 8,
// 	'CF': 9,
// 	'RF': 10,
// 	'DH': 11,
// 	'P': 13,
// 	'SP': 14,
// 	'RP': 15,
// 	'DL': 17,
// 	'IF': 19
// }


// var newPlayers = {};
// var nameDict = {};
// var allNames = {};
// var playerIdToPositionDict = {};
// var test = [];
// var tick =0;
// var getAllESPNPlayers = function(sport, leagueId, offset, positionId, positionKey) {

// 	var urlString = 'http://games.espn.go.com/ffl/freeagency?leagueId=' + leagueId + '&seasonId=' + 2014 + '&avail=-1' +
// 		'&slotCategoryId=' + positionId;
// 	if (offset !== undefined) {
// 		urlString += '&startIndex=' + offset;
// 	}

// 	$.ajax({
// 		url: urlString,
// 		data: 'text',
// 		success: _.bind(function(data) {
// 			var elements = $($('<div>').html(data)[0]).find('table.playerTableTable tr.pncPlayerRow');
// 			//Should be each player row
// 			for(var i = 0; i < elements.length; i++) {
// 				var currPlayerRow = $(elements[i]);
// 				var currPlayerId =	$(currPlayerRow).attr('id').substring(4);
// 				// So janky, hope this structure doesn't event change.
// 				var name = $($(currPlayerRow.children()[0]).children()[0]).text();
// 				newPlayers[currPlayerId] = name;
// 				var parts = name.split(' ');
// 				name = name.toLowerCase();
// 				firstName = parts[0].toLowerCase();
// 				lastName = parts[1].toLowerCase();

// 			   	var anchorParent = $($(currPlayerRow.children()[0]));
// 		        var teamPositionStr = anchorParent.html().match(/<\/a>(,|\*,)(.*)/)[0];
// 		        teamPositionStr = teamPositionStr.replace(/<\/a>(,|\*,)/, "");
// 		        teamPositionStr = teamPositionStr.replace("</td>", "");
// 		        var teamPositionArr = teamPositionStr.split("&nbsp;");
// 		        var currPlayerTeam =  teamPositionArr[0];
// 		        var currPlayerPosition = teamPositionArr[1];

// 				if (!allNames[name]) {
// 					allNames[name] = {id: currPlayerId, name: name, position: positionKey, team: currPlayerTeam};
// 				}

// 				if (!playerIdToPositionDict[currPlayerId]) {
// 					playerIdToPositionDict[currPlayerId] = [positionId];
// 				} else {
// 					playerIdToPositionDict[currPlayerId].push(positionId);
// 				}

// 				if (!nameDict[firstName]) {
// 					nameDict[firstName] = {};
// 					nameDict[firstName][lastName] = {id: currPlayerId, positions: [positionId]};
// 				} else if (nameDict[firstName][lastName]) {
// 					nameDict[firstName][lastName].positions.push(positionId);
// 				} else {
// 					nameDict[firstName][lastName] = {id: currPlayerId, positions: [positionId]};
// 				}
// 				// console.log('got player ', nameDict[firstName][lastName]);
// 				// console.log('got player ', firstName, lastName);
// 				test.push(firstName + ' ' + lastName);

// 				tick++;
// 			}
// 			if (elements.length === 50) {
// 				if (offset === undefined) {
// 					offset = 0;
// 				}
// 				offset += 50;
// 				getAllESPNPlayers(sport, leagueId, offset, positionId, positionKey);
// 			} else {
// 				playersFetchedByPosition(sport, positionKey, allNames, playerIdToPositionDict, nameDict);
// 			}
// 			}, this)
// 	});
// };

// var yIdsToNames = {};

// var getYFetchPlayersUrl = function (league, positionType) {
//   var sportUrlShort = '';
//   if (league.sport === 'baseball') {
//     sportUrlShort = 'b1';
//   } else if (league.sport === 'football') {
//     sportUrlShort = 'f1'
//   }

//   var urlString = 'http://'+ league.sport + '.fantasysports.yahoo.com/' + sportUrlShort + '/' + league.leagueId + '/players?&sort=PR&sdir=1';
//   urlString += '&pos=' + positionType +'&stat1=S_S_2014&jsenabled=1&jsenabled=1';

//   return urlString;
// };

//   // http://football.fantasysports.yahoo.com/f1/302311/players?&sort=PR&sdir=1&status=ALL&pos=QB&stat1=S_W_1&jsenabled=1&jsenabled=1

// var fetchYPlayersForLeagueAndPositionType = function(league, positionType, offset) {
//   urlString = getYFetchPlayersUrl(league, positionType);
//   if (offset !== undefined) {
//     urlString += '&count=' + offset;
//   }


//   $.ajax({
//     url: urlString,
//     data: 'text',
//     success: _.bind(function(data) {


//       var elements = $($('<div>').html(data)[0]).find('.players tbody tr');
//       //Should be each player row

//       // var ownerIndex = findOwnerIndex($(data).find(".players thead tr.Last th>div"));

//       for(var i = 0; i < elements.length; i++) {
//         var currPlayerRow = $(elements[i]);
//         var playerAnchor = $(currPlayerRow.children()[1]).find('.ysf-player-name a');
//         // var ownerAnchor = $(currPlayerRow.children()[ownerIndex]).find('a');

//         var currPlayerId =  $(playerAnchor).attr('href').match(/players\/([0-9]+)/)[1];
//         var currPlayerName = $(playerAnchor).html();
//         var anchorParent = $(playerAnchor).parent();
//         var teamPositionStr = anchorParent.find("span").html();
//         var teamPositionArr = teamPositionStr.split(" - ");
//         var currPlayerTeam =  teamPositionArr[0];
//         var currPlayerPosition = teamPositionArr[1];

//         yIdsToNames[currPlayerId] = {
//         	name: currPlayerName,
//         	position: currPlayerPosition,
//         	team: currPlayerTeam
//         };
//         // var owningTeamId = $(ownerAnchor).attr('href').match(/\/[0-9]+\/([0-9]+)/)[1];
//         // if (owningTeamId) {
//         //   this.addPlayerMapping(league.leagueId, currPlayerId, owningTeamId);
//         // }
//       }
//       if (elements.length === 25) {
//         if (offset === undefined) {
//           offset = 0;
//         }
//         offset += 25;
//         fetchYPlayersForLeagueAndPositionType(league, positionType, offset)
//       } else {
//         finishedYPlayers(positionType);
//       }
//     }, this)
//   });
// };

// var finishedYPlayers = function (positionType) {
//   console.log("Finished Y -" + positionType);
//   this.FFStorage.set("global", "yIdsToNames", yIdsToNames);
// };

// var getAllYahooPlayers = function(league) {
//   for (var key in POSITIONS) {
//     console.log("Getting Position:" + key);
//     fetchYPlayersForLeagueAndPositionType(league, key, 0);
//   }
// }

// getAllYahooPlayers({
//   sport:"football",
//   leagueId: 302311
// });

// for (var key in POSITIONS) {
// 	 console.log("Getting Position:" + key);
// 	 getAllESPNPlayers("football", 264931, 0, POSITIONS[key], key);
// }