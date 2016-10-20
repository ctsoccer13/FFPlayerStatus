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
	chrome.alarms.create('updateLeagues', {delayInMinutes: 30, periodInMinutes: 30});
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
				sendResponse(this.fantasyFind[request.site].addUserTeam(request.league));
				break;

			case "removeTeam":
				sendResponse(this.fantasyFind[request.site].removeUserTeam(request.leagueId));
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

			case "addCustomMapping":
				sendResponse(this.fantasyFind.addCustomMapping(request.name, request.playerId));
				break;

			case "removeCustomMapping":
				sendResponse(this.fantasyFind.removeCustomMapping(request.name, request.playerId));
				break;

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
