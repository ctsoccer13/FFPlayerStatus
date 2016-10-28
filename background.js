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

this.fantasyFind = new ff.FF(FFStorage);

var listOfPlayers = {};					// Dict containing all known players in NFL - key=playerId, val=player object
var listOfPlayersInitESPN = false;		// Flag indicating ESPN players have been initialized
var listOfPlayersInitYahoo = false;		// Flag indicating Yahoo players have been initialized
var playerDict = {};					// Dict for looking up players by name
var settingsPort;						// Port for communicating between settings and background

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

	// Setup alarm/timer for periodic league updates
	chrome.alarms.create('updateLeagues', {delayInMinutes: 30, periodInMinutes: 30});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		switch (request.method) {

			// Fetch player object by player id
			case 'getPlayerById':
				var player = this.fantasyFind.getPlayerById(request.playerId);
				sendResponse(player);
				break;

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

			// Search for player by name
			case 'playerSearch':
				this.fantasyFind.playerSearch(window.listOfPlayers, request.query, function(results) {
					results.forEach(function(p) {
						this.fantasyFind.updatePlayerStatus(p);
					});
					sendResponse({results: results});
				});
				break;

			// case "changeLeagueVisibility":
			// 	var leagueId = request.leagueId;
			// 	var hidden = request.hidden;
			// 	this.fantasyFind.hideLeague(leagueId, hidden);
			// 	break;

			// Update/save user settings in local storage
			case "changeSetting":
				this.fantasyFind.setUserSettings(request.query);
				break;

			// Fetch user settings from local storage
			case "getSettings":
				sendResponse(this.fantasyFind.getUserSettings());
				break;

			// Add term to blacklist
			case "addBlacklistURL":
				sendResponse(this.fantasyFind.addBlacklistURL(request.url));
				break;

			// Remove term from blacklist
			case "removeBlacklistURL":
				sendResponse(this.fantasyFind.removeBlacklistURL(request.url));
				break;

			case "logStuff":
				_gaq.push(request.data);
				break;

			// Add team to local storage and get taken players
			case "addTeam":
				sendResponse(this.fantasyFind[request.site].addUserTeam(request.league));
				break;

			// Delete team from local storage and destroy league object
			case "removeTeam":
				sendResponse(this.fantasyFind[request.site].removeUserTeam(request.leagueId));
				break;

			// Update list of all players in both the list and name dict
			case "checkAllPlayers":
				// If neither ESPN or Yahoo has been initialized, we know this is the first run
				// so we need to populate the player list
				if(!window.listOfPlayersInitESPN && !window.listOfPlayersInitYahoo) {
					window.listOfPlayersInitESPN = request.site==='espn';
					window.listOfPlayersInitYahoo = request.site==='yahoo';
					//this.fantasyFind[request.site].resetLeagues();
					this.fantasyFind[request.site].fetchAllPlayersForLeague(request.league, window.listOfPlayers, settingsPort);
				} else {
				// We know that the player list must have been updated, and we have the potential to have different ID's from 
				// different sites. So we need to create a mapping between the different site's IDs
					if(request.site==='espn' && !window.listOfPlayersInitESPN) {
						this.fantasyFind[request.site].addPlayerIdsForSite(request.league, settingsPort);
						window.listOfPlayersInitESPN = true;
					} else if (request.site === 'yahoo' && !window.listOfPlayersInitYahoo) {
						this.fantasyFind[request.site].addPlayerIdsForSite(request.league, settingsPort);
						window.listOfPlayersInitYahoo = true;
					// We are adding a league for a site that has already been initialized. Not much to be done here.
					} else {
						settingsPort.postMessage({status: "addLeagueComplete"});
					}
				}
				sendResponse(true);
				break;

			// Fetch player name dict -- mainly used for parser.js
			case "getDict":
				sendResponse(window.playerDict);
				break;

			// Add a nickname->player mapping
			case "addCustomMapping":
				sendResponse(this.fantasyFind.addCustomMapping(request.name, request.playerId));
				break;

			// Remove a nickname mapping
			case "removeCustomMapping":
				sendResponse(this.fantasyFind.removeCustomMapping(request.name, request.playerId));
				break;

			// Get list of known mappings
			case "getCustomMapping":
				sendResponse(this.fantasyFind.getCustomMapping());
				break;
		}
		return true;
});

// Periodically update the taken players via chrome alarm
chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name==='updateLeagues') {
		var leagues = this.fantasyFind.getLeaguesFromStorage();
    	leagues = leagues || [];
    	for(var i = 0; i < leagues.length; i++) {
    		this.fantasyFind[leagues[i].site].refreshTakenPlayers(leagues[i]);
    	}
    }
});

// Handle the settings port. For now, all we need to do is store it to be used later
// The main point of the settings port is to send a message back to settings.js to
// re-enable the input field when the fetchAllPlayers function is done. Prevents collisions
// when mapping different sites' player IDs
chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name == "settings");
	window.settingsPort = port;
	// port.onMessage.addListener(function(msg) {
	// 	if(msg.)
	// })
});
