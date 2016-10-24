var foundLastNames = {};

var addInlineAvailability = true;

var cachedResponses = {};

var playerDict = {};

var customMappings = {};

/**
 * Parse the DOM and search for valid player names. Surround names with <span>
 * tags.
 */
var injectMarkup = function(inNodes) {
	var nodes = [];

	var addMarkup = function(node, firstName, lastName, playerId) {
		var regex = new RegExp('(?![^<]*>|[^<>]*</)(' + firstName + '\\s' + lastName + ')', 'gi');
		//var regex = new RegExp('\\b(' + firstName + '\\s' + lastName + ')\\b', 'gi'); need to test this
		var surround = ' <span class="fantasy-finder" style=\"padding-right: 4px;\"><span class="ff-name" data-playerId="' + playerId +
			'"" style="display:inline;">$1</span></span> ';
		var newtext = node.replace(regex, surround);
		//html = html.replaceText(regex,surround);
		//text = text.replace(regex, surround);
		return newtext;
	};

	var addMarkupDST = function(node, team, playerId) {
		var regex = new RegExp('(' + team + '\\s' + 'D/ST' + ')', 'gi');
		var surround = '<span class="fantasy-finder" style=\"padding-right: 4px;\"><span class="ff-name" data-playerId="' + playerId +
			'"" style="display:inline;">$1</span></span>';
		var newtext = node.replace(regex, surround);
		return newtext;
	};

	var checkCustomMapping = function(text) {
		if(! _.isEmpty(window.customMappings)) {
			for (var key in window.customMappings) {
				var regex = new RegExp('\\b' + key.toLowerCase() + '\\b');
				var idx = text.toLowerCase().search(regex);
				if(idx !== -1) {
					var regex = new RegExp('(?![^<]*>|[^<>]*</)('+ key + ')', 'gi');
					var surround = ' <span class="fantasy-finder" style=\"padding-right: 4px;\"><span class="ff-name" data-playerId="' + window.customMappings[key] + '" style="display:inline;">$1</span></span> ';
					text = text.replace(regex, surround);
				}
			}
		}
		return text;
	};

	var findName = function(node) {
		var parts =  node.nodeValue.split(/\s/);
		var text = $(node).text();
		var parent = node.parentElement;
		if(parent.getAttribute('class')==="ff-name") return;
		var changed = false;
		for (var i = 0; i < parts.length; i++) {
			// This includes  ` and . - which break a.j. green da`quan etc..
			//var token = parts[i].toLowerCase().replace(/[\.,\/#!$%\^&\*;:{}=\`~()]/g,'');
			var token = parts[i].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()?"]/g,'');
			var nextTokenLastName = parts[i + 1] ? parts[i + 1].toLowerCase().replace(/['’]s$/g, '') : '';
			nextTokenLastName = nextTokenLastName.replace(/[,\/#!$%\^&\*;:{}=~()?."']/g,'');
			var nameHash = window['playerDict'][nextTokenLastName];
			// Is there a record for the first name and if the last name
			// has a record of the player id.
			var playerId = nameHash && nameHash[token] ? nameHash[token].id : '';
			if (nameHash && playerId) {
				if (nextTokenLastName==="dst") {
					text = addMarkupDST(text, parts[i], playerId)
				} else {
					text = addMarkup(text, token, nextTokenLastName, playerId);
				}
				// Optimization, just skip the next token.
				i++;
				changed = true;
				// Store the last name as one that has been found.
				foundLastNames[nextTokenLastName] = {playerId: playerId};
			// If we find another instance of a last name we looked up.
			} 
			// else if (foundLastNames[token]) {
			// 	text = addMarkup(text, token, '', foundLastNames[token].playerId);
			// 	changed = true;
			// }
		};
		var newtext = checkCustomMapping(text);
		if(newtext!==text) {
			text = newtext;
			changed = true;
		}
		if(changed === true) {
			var newNode = document.createElement('span');
			newNode.innerHTML = text;
			node.parentNode.insertBefore(newNode, node);
			node.parentNode.removeChild(node);
			//node.parentElement.innerHTML = text;
		}
	};

	var findTextNodes = function(index, node) {
		_findTextNodes(node);
	};
	var _findTextNodes = function(node) {
		// If this is a TEXT Node trim the whitespace and push.

		//console.log($(node).prop("tagName"));

		if (node.nodeType == 3 && node.nodeValue.trim()) {
			nodes.push(node);
			// There are probably other kinds of nodes we should be skipping.
		} else if ($(node).prop("tagName") !== undefined && $(node).prop("tagName").toLowerCase() === "iframe") {

		} else if (node.nodeName != 'SCRIPT') {

			$(node).contents().each(findTextNodes);
		}
	};

	var postMarkupAddAvailability = function () {
		var playerIdArr = _.uniq(_.map($(".ff-name[data-playerId]"), function (currNode) {
			return $(currNode).data().playerid;
		}));

		for (var i = playerIdArr.length - 1; i >= 0; i--) {
			var currPlayerId = playerIdArr[i];
			getPlayer(currPlayerId, function (player) {
				if (!player) {
					return;
				}

				var leagueStatusMap = {
					add: 0,
					drop: 0,
					trade: 0
				};
				if (player.leagueStatus !== undefined) {

					for (var i = player.leagueStatus.length - 1; i >= 0; i--) {
						var currLeagueStatus = player.leagueStatus[i];
						switch (currLeagueStatus.status) {
						case 1:
							leagueStatusMap.add++;
							break;
						case 2:
							leagueStatusMap.drop++;
							break;
						case 3:
							leagueStatusMap.trade++;
							break;
						}

					}
					$('.ff-name[data-playerid="' + player.id + '"]').each(function(i) {
						var found = $(this).find('#inline-availability-marker');
						if(found.length===0) {
							$(this).append(Handlebars.templates.InlineAvailability(leagueStatusMap));
						}
					});
				}
			});
		}
	};

	if (inNodes===undefined) {
		$(document.body).contents().each(findTextNodes);
	} else {
		inNodes.forEach(_findTextNodes);
	}

	for (var i = 0; i < nodes.length; ++i) {
		findName(nodes[i]);
	}

	if (addInlineAvailability) {
		postMarkupAddAvailability();
	}
};


/**
 * Register hover handlers and position the popup next to the player's name.
 */
var registerHoverHandlers = function(popup) {
	var cancelId;

	var handlerIn = _.bind(function(event) {
		var popupWidth = popup.width();
		clearTimeout(cancelId);
		popup.toggleClass('active', true);
		popup.toggleClass('arrow-right', false);

		var element = $(event.currentTarget);
		var position = element.offset();
		var popupLeft = position.left + $(element).width() + 20;

		if (popupLeft + popupWidth > $(window).width() - 50) {
			popupLeft = position.left - 50 - popupWidth;
			popup.toggleClass('arrow-right', true);
		}

		popup.css('left', popupLeft);
		popup.css('top', position.top - 50);
		fillPopup(element.data().playerid, handlerOut);

		// setTimeout(function () {
		// 	if($("#ff-popup ins.adsbygoogle").html().length === 0) {
		// 		$(".hidden-ad-trigger").click();
		// 	}
		// }, 500)

	}, window);

	var handlerOut = function(event) {
		// TODO: Cancel this timeout if a user makes interaction inside of the popup.
		cancelId = setTimeout(function() {
			popup.toggleClass('active', false);
		}, 500);
	};

	$('.ff-name').hover(handlerIn, handlerOut);
};

/**
 * Build popup.
 */
var buildPopup = function() {
	var popupHtml = '<div class="fantasy-finder"><div id="ff-popup"><div class="name"></div></div></div>';
	$(document.body).append(popupHtml)
};

/**
 * Render the popup with data, this is asynchronous because of the call to background.js
 */
var fillPopup = function(playerId, closeHandler) {
	getPlayer(playerId, function(player) {
		if (!player) {
			return;
		}

		var tempPlayer = $(Handlebars.templates.PopupTemplate(player));

		var tempPlayerImg = new Image();
		tempPlayerImg.src =  player.profileImage;
		tempPlayerImg.onload = function () {
			$("#ff-popup").find(".temp-default-player").replaceWith("<img src='" + player.profileImage + "'>");
		};

		$('#ff-popup').html(tempPlayer);
		$('#ff-popup .close').click(function(){
			$('#ff-popup').toggleClass('active', false);
		});

		var leagueId = 0;
		for (var i = 0; i < player.leagueStatus.length; i++) {
			var currLeague = player.leagueStatus[i];
			if(leagueId===undefined) {
				leagueId = currLeague.leagueId;
			}
			var leagueName = currLeague.status!==1 ? currLeague.leagueName + ' ' + currLeague.ownedByTeamName : currLeague.leagueName;
			var leagueEntry = $(Handlebars.templates.LeagueAvailabilityRow({
				league: leagueName,
				leagueSite: currLeague.site,
				btnName: getTextForPlayerLeagueStatus(currLeague.status),
				btnClass: "status" + currLeague.status,
				btnLink: currLeague.actionUrl,
				iconClass: getIconClassForPlayerLeagueStatus(currLeague.status),
				playerId: player.id,
				playerName: player.name
			}));

			$("#ff-popup .league-data").append(leagueEntry);
		}
		if (player.leagueStatus.length == 0) {
			$("#ff-popup .league-data").append('<br/><span class="not-available">' + player.name + '\'s position is not allowed in any of your leagues.</span>');
		}

		$('.ff-btn').click(function(event) {
			var data = $(event.currentTarget).data();
			chrome.runtime.sendMessage({method: 'logStuff', data: ['_trackEvent', 'PlayerAction', data.actionType, data.playerName + ':' + data.playerId, 1]});
			chrome.runtime.sendMessage({method: 'logStuff', data: ['_trackEvent', 'PlayerActionUrl', data.actionType, window.location.href]});

		});
		$(".player-section-header h2").click(function (event) {
			$(".player-section-header h2").removeClass("selected");
			var currHeader = $(event.currentTarget);
			var sectionTarget = currHeader.data().sectionRef;

			currHeader.addClass("selected");

			$("#ff-popup .player-data-section").removeClass("active");
			$("#ff-popup " + sectionTarget).addClass("active");
		});
		var year = new Date().getFullYear();
		//Add Stats
		$.ajax({
			url: location.protocol + "//games.espn.com/ffl/format/playerpop/overview?leagueId=" + leagueId + "&playerId=" + player.id + "&playerIdType=playerId&seasonId=" + year + "&xhr=1",

			type: "GET",
			success: function (response) {
				var jqResp = $(response);
				jqResp.find("#overviewTabs #moreStatsView0 .pc").remove();
				jqResp.find("#overviewTabs #moreStatsView0 table").removeAttr("style");
				$("#ff-popup .player-stats").html(jqResp.find("#overviewTabs #moreStatsView0").html());
				// if ($("#ff-popup .player-profile-img .temp-default-player").length) {
				// 	var img = jqResp.find('.mugshot img').attr('src');
				// 	player.profileImage = img;
				// 	$("#ff-popup").find("temp-default-player").replaceWith("<img src='" + player.profileImage + "'>");
				// }
			}
		});

		$('.player-statistics').click(function() {
			chrome.runtime.sendMessage({method: 'logStuff', data: ['_trackEvent', 'PopUpStats', player.name + ':' + player.id]});
		});

		chrome.runtime.sendMessage({method: 'logStuff', data: ['_trackEvent', 'PopUp', player.name + ':' + player.id]});
	});
};

var getTextForPlayerLeagueStatus = function (status) {
	var statusText = "";
	switch (status) {
		case 1:
			statusText = "Add";
			break;
		case 2:
			statusText = "Drop";
			break;
		case 3:
			statusText = "Trade";
			break;
	}
	return statusText;
};

var getIconClassForPlayerLeagueStatus = function (status) {
	var iconClass = "";
	switch (status) {
		case 1:
			iconClass = "fa fa-plus";
			break;
		case 2:
			iconClass = "fa fa-remove";
			break;
		case 3:
			iconClass = "fa fa-random";
			break;
	}
	return iconClass;
};

/**
 * Ask the background script for a players information.
 */
var getPlayer = function(playerId, callback) {
	if (cachedResponses[playerId]) {
		callback(cachedResponses[playerId]);
		console.log('cache hit');
		return;
	}

	chrome.runtime.sendMessage(
		{method: 'getPlayerById', playerId: playerId},
		function(response) {
			cachedResponses[playerId] = response;
			callback(response);
	});
};

var evaluateUrl = function(callback) {
	chrome.extension.sendMessage({method: "getSettings"}, function(response) {
		var settingDefaults = {
			inline: true,
			popup_trigger: "hover",
			popup_position: "hovercard",
			globalAnnotations: true,
			rosterAnnotations: true
		};
		response = _.extend(settingDefaults, response);


		var blacklist = [];
		// Cancel parsing if the user has explicitly turned off annotations.
		if (response.globalAnnotations === false) {
			return;
		}
		if (response.rosterAnnotations === false) {
			blacklist.push('espn.com/ffl');
			// blacklist.push('football.fantasysports.yahoo.com/f1');
		}


		addInlineAvailability = !!response.inline;
		var proceed = true;
		blacklist = response.blacklist ? blacklist.concat(response.blacklist) : blacklist;

		for (var i = 0; i < blacklist.length; i++) {
			if (window.location.href.indexOf(blacklist[i]) > -1)  {
				proceed = false;
				break;
			}
		};

		if (proceed) {
			callback();
		}
	});
}

if(performance.navigation.type == 1) {
	cachedResponses = {};
}

evaluateUrl(function() {
	chrome.runtime.sendMessage({method: 'getDict'}, function(response) {
  		window.playerDict = response;
  		chrome.runtime.sendMessage({method: 'getCustomMapping'}, function(response) {
  			window.customMappings = response;
  			buildPopup();
			var popup = $('#ff-popup');
			injectMarkup();
			registerHoverHandlers(popup);
		});
  	});
});

// var observer = new MutationObserver(function(mutations) {
// 	this.disconnect();
// 	for(var i = 0; i < mutations.length; i++) {
// 		if(mutations[i].addedNodes.length > 0) {
// 			var popup = $('#ff-popup');
// 			injectMarkup(mutations[i].addedNodes);
// 			registerHoverHandlers(popup);
// 		}
// 	}
// 	this.observe($("#siteTable").get(0), {childList: true, subtree: true});
// });
// observer.observe($("#siteTable").get(0), {childList: true, subtree: true});

// document.body.addEventListener('DOMNodeInserted', function(event) {
// 	if((event.target.tagName == 'DIV') && (event.target.getAttribute('id') && event.target.getAttribute('id').indexOf('siteTable') != -1)){
// 		evaluateUrl(function() {
// 			chrome.runtime.sendMessage({method: 'getDict'}, function(response) {
// 		  		window.playerDict = response;
// 		  		buildPopup();
// 				var popup = $('#ff-popup');
// 				injectMarkup();
// 				registerHoverHandlers(popup);
// 		  	});
// 		});
// 	}
// });