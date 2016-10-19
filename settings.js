(function () {

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
	_gaq.push(['_trackPageview']);

	var settingDefaults = {
		inline: true,
		popup_trigger: "hover",
		popup_position: "hovercard",
		globalAnnotations: true,
		rosterAnnotations: true
	};

	this.FF = new ff.FF(FFStorage);
	this.leagues = [];

	var loadSettings = function (event) {
		chrome.extension.sendMessage({method: "getSettings"}, function (response) {
			response = _.extend(settingDefaults, response);

			renderInlineAvailability(response.inline);
			renderPopupTrigger(response.popup_trigger);
			renderPopupPosition(response.popup_position);
			renderAnnotations(response.globalAnnotations, response.rosterAnnotations);

			// this.FF.getUserIds(function(userIdObj) {
			// 	var siteKeys = _.keys(userIdObj);

			// 	if (siteKeys.length === 0) {
			// 		chrome.tabs.create({url: 'install.html', active: true}, function(tab) {});
			// 	} else {
			// 		renderUserTeams();
			// 	}
			// });

			/**
			*	Had to put this here because we don't have access to the dom structure at the beginning of the self executing function.
			*/
			$("#sync").click(function (event) {
				$('#loader').show();
				$('.sync-text').hide();
				chrome.extension.sendMessage({method: "hardReset"}, function(response) {
					$('#loader').hide();
					$('.sync-text').show();
			    });
			});
		});
	};

	var renderInlineAvailability = function (inlineVal) {
		var inlineDom = $('<div class=""><label><input id="inline-availability-check" type="checkbox" name="inline-availability" value="inline" />Show availability next to name.</label></div>');
		if (inlineVal === true) {
			$(inlineDom).find("#inline-availability-check").attr("checked", "checked");
		}
		$(".inline-settings").html(inlineDom);
		$("#inline-availability-check").change(function (event) {
	    	var value = {
	    		inline: $(event.currentTarget).is(":checked")
	    	};
	    	chrome.extension.sendMessage({method: 'changeSetting', query: value});
	    	_gaq.push(['_trackEvent', 'InlineSetting', value.inline]);
	    });

	};

	var renderPopupTrigger = function (popupTriggerVal) {
		$(".popup-trigger").hide();

		return;

		var popupTriggerDom = $('<label><input type="radio" name="popupTriggerGroup" value="hover">Hover</label><br><label><input type="radio" name="popupTriggerGroup" value="click">Click</label><br>');

		$(popupTriggerDom).find("[value='" + popupTriggerVal + "']").attr("checked", "checked");

		$(".popup-trigger-settings").html(popupTriggerDom);
		$("[name='popupTriggerGroup']").change(function (event) {
	    	var value = {
	    		popup_trigger: $(event.currentTarget).attr("value")
	    	};
	    	chrome.extension.sendMessage({method: 'changeSetting', query: value});
	    	_gaq.push(['_trackEvent', 'popupTriggerSetting', value.popup_trigger]);
	    });
	};

	var renderPopupPosition = function (popupPositionVal) {
		var popupPositionDom = $('<label><input type="radio" name="popupPositionGroup" value="hovercard">Hovercard</label><br><label><input type="radio" name="popupPositionGroup" value="toprightcorner">Top Right Corner</label><br>');

		$(popupPositionDom).find("[value='" + popupPositionVal + "']").attr("checked", "checked");

		$(".popup-position-settings").html(popupPositionDom);
		$("[name='popupPositionGroup']").change(function (event) {
	    	var value = {
	    		popup_position: $(event.currentTarget).attr("value")
	    	};
	    	chrome.extension.sendMessage({method: 'changeSetting', query: value});
	    	_gaq.push(['_trackEvent', 'popupPositionSetting', value.popup_position]);
	    });
	};

	var renderUserTeams = function() {
		// 99% of this code came from installed.js can we share this code somehow?
		var leagues = this.FF.getLeaguesFromStorage();
		var leaguesLength = 0;
		if (!leagues) {
			console.warn('installer received no leagues for user');
		} else {
			leaguesLength = leagues.length;
		}
		var div = $('#team-data');
		for (var i = 0; i < leaguesLength; ++i) {
			var template = $('<div class="league-row"><div class="league-text"><div class="league-col">' + leagues[i].leagueName + '</div> <div class="league-col">' +
			leagues[i].teamName + '</div></div><div class="ff-btn" data-league-id="' + leagues[i].leagueId + '"><div class="state-text state1">Active</div><div class="state-text state2">Inactive</div></div></div>');

			if (leagues[i].hidden === undefined || leagues[i].hidden !== 1) {
				template.find(".ff-btn").addClass("status1");
			} else {
				template.find(".ff-btn").addClass("status2");
			}

			div.append(template);
		}
		$(".league-table.hide").removeClass("hide");
		$(".win-info.hide").removeClass("hide");

		// new bogus code to be replaced.
		$('.visibility-settings .league-row .ff-btn').click(function(event) {
			var leagueClicked = $(event.currentTarget).data().leagueId;
			var hiddenProperty = $(event.currentTarget).hasClass("status1") ? 1 : 0;
			chrome.extension.sendMessage({method: 'changeLeagueVisibility',
				leagueId: leagueClicked,
				hidden: hiddenProperty
			});

			if (hiddenProperty === 1) {
				$(event.currentTarget).removeClass("status1").addClass("status2");
			} else {
				$(event.currentTarget).removeClass("status2").addClass("status1");

			}
			_gaq.push(['_trackEvent', 'leagueVisibility', hiddenProperty]);
		});
	};

	var renderAnnotations = function (globalAnnotations, rosterAnnotations) {
		setAnnotationsState(globalAnnotations, rosterAnnotations);
		$(".global-annotations-settings-enable .ff-btn").click(_.bind(function (event) {
			var annotationsEnabled = !$(event.currentTarget).hasClass("status1");
			var data = {
				globalAnnotations: annotationsEnabled,
				rosterAnnotations: annotationsEnabled
			};
			chrome.extension.sendMessage({
				method: 'changeSetting',
				query: data
			});
			_gaq.push(['_trackEvent', 'annotationsGlobalEnabled', data.globalAnnotations]);
			setAnnotationsState(annotationsEnabled, annotationsEnabled);
		}, this));
		$(".roster-annotations-settings-enable .ff-btn").click(_.bind(function (event) {
			var annotationsEnabled = !$(event.currentTarget).hasClass("status1");
			chrome.extension.sendMessage({
				method: 'changeSetting',
				query: {
					rosterAnnotations: annotationsEnabled
				}
			});
			_gaq.push(['_trackEvent', 'rosterAnnotations', annotationsEnabled]);
			setAnnotationsState(null, annotationsEnabled);
		}, this));
	};
	var setAnnotationsState = function (globalAnnotations, rosterAnnotations) {
		if (globalAnnotations) {
			$(".global-annotations-settings-enable .ff-btn").removeClass("status2").addClass("status1");
			$("#league-annotations").show();
		} else if (globalAnnotations == false) {
			$(".global-annotations-settings-enable .ff-btn").removeClass("status1").addClass("status2");
			$("#league-annotations").hide();
		}
		if (rosterAnnotations) {
			$(".roster-annotations-settings-enable .ff-btn").removeClass("status2").addClass("status1");
		} else if (rosterAnnotations == false) {
			$(".roster-annotations-settings-enable .ff-btn").removeClass("status1").addClass("status2");
		}
	}
	loadSettings();

	var getLeagueTeams = function(url) {
		var teams= {};
		$.ajax({
			url: url,
			data: 'text',
			async: false,
			success: _.bind(function(response) {
				var listItems = $(response).find('#games-tabs1 li a');
				listItems.each(function(i, elem) {
					var parts = parseURL(elem.getAttribute("href"));
					teams[parts['teamId']] = $(elem).text();
				});
	  		}, this)
		});
		return teams;
	}

	var getLeagueTeamsShortNames = function(teams) {
		var abbrevs = [];
		for (var key in teams) {
			var parts = teams[key].split(/\s/);
			abbrevs[key] = parts[parts.length-1];
		}
		return abbrevs;
	}

	var getLeagueName = function(url, league) {
		$.ajax({
			url: url,
			data: 'text',
			async: false,
			success: _.bind(function(response) {
				var item = $(response).find("div.nav-main-breadcrumbs").children().eq(2);
				league.leagueName = $(item).text();
	  		}, this)
		});
	}

	var getLeagueNameYahoo = function(url, league) {
		$.ajax({
			url: url,
			data: 'text',
			success: _.bind(function(response) {
				var item = $(response).find("title").text();
				league.leagueName = item;
			}, this)
		});
	};

	var parseURL = function(url) {
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

	var parseURLYahoo = function(url) {
		var league = {};
		var hashes = url.split('/');
		league['leagueId'] = hashes[hashes.length-2];
		league['teamId'] = hashes[hashes.length-1];
		return league;
	};

	var populateListOnLoad = function() {
		var leagues = this.FF.getLeaguesFromStorage();
		var leaguesLength = 0;
		if (!leagues) {
			console.warn('installer received no leagues for user');
		} else {
			leaguesLength = leagues.length;
		}
		for (var i = 0; i < leaguesLength; ++i) {
			var template = $('<tr><td class="tl-icon"><img id="teamlist-icon" src="images/espn.png"/></td><td class="list-group-item tl-teamname" id="' + leagues[i].leagueId + '">' + leagues[i].teamName + '</td><td id="teamlist_remove_cell"><i class="fa fa-remove" id="team_remove_btn" aria-hidden="true"></i></td></tr>');
			$('#teamlist_tbl > tbody:last-child').append(template);
		}
	}

	var populateBlacklistOnLoad = function() {
		var settings = this.FF.getUserSettings();
		if(settings) {
			var blacklist = settings['blacklist'];
			if(blacklist) {
				for (var i = 0; i < blacklist.length; i++) {
					$('#blacklist_tbl > tbody:last-child').append('<tr><td>' + blacklist[i] + '</td><td id="blacklist_remove_cell"><i class="fa fa-remove" id="blacklist_remove_btn" aria-hidden="true"></i></td></tr>');
				}
			}
		}
	}

	$(document).ready(function() {
		populateListOnLoad();
		populateBlacklistOnLoad();
		$('#teamlist_add_btn').click(function(){
			var url = $('#teamlist_input').val();
			if(url.indexOf("espn") !== -1) {
		    	var league = parseURL(url);
		    	var teams = getLeagueTeams(url);
		    	getLeagueName(url, league);
		    	league.teamName = teams[league.teamId];
		    	league.shortNames = getLeagueTeamsShortNames(teams);
		    	league.site = 'espn';
		    	league.sport = 'football';
				league.playerIdToTeamIndex = {};
				league.availablePlayers = {};
				var row = $('<tr><td class="tl-icon"><a href="' + url + '"><img id="teamlist-icon" src="images/espn.png"/></a></td><td class="list-group-item tl-teamname" id="' + league.leagueId + '">' + league.teamName + '</td><td id="teamlist_remove_cell"><i class="fa fa-remove" id="team_remove_btn" aria-hidden="true"></i></td></tr>');
				$('#teamlist_tbl > tbody:last-child').append(row);
				$('#teamlist_input').val('');
		    	//leagues.push(league);
		    	chrome.runtime.sendMessage({method: 'checkAllPlayers', site: 'espn', league: league}, function(response) {});
		    	chrome.runtime.sendMessage({method: 'addTeam', site: 'espn', league: league}, function(response) {});
		    }
		    if(url.indexOf("yahoo") !== -1) {
		    	// var YF = require('yahoo-fantasy');
		    	// var yf = new YF('dj0yJmk9bThpaW5rRFVhTnBhJmQ9WVdrOVdHNXFTMEpUTnpZbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1kNA--', '23fa5e57515e7ccdfc47e8702ad7911cd0ba76ad');
		    	var league = parseURLYahoo(url);
		    	getLeagueNameYahoo(url, league);
		    }
		});
		$('#blacklist_add_btn').click(function() {
			var url = $('#blacklist_input').val();
			var element = '<tr><td>' + url + '</td><td id="blacklist_remove_cell"><i class="fa fa-remove" id="blacklist_remove_btn" aria-hidden="true"></i></td></tr>';
			$('#blacklist_tbl > tbody:last-child').append(element);
			$('#blacklist_input').val('');
			chrome.runtime.sendMessage({method: 'addBlacklistURL', url: url}, function(response){});
		});
		$("#blacklist_input").keyup(function(event){
		    if(event.keyCode == 13){
		        $("#blacklist_add_btn").click();
		    }
		});
		$('#blacklist_tbl').on('click', '#blacklist_remove_btn', function(){
			$(this).closest('tr').remove();
			chrome.runtime.sendMessage({method: 'removeBlacklistURL', url: $(this).closest('tr').text()}, function(response){});
		});
		$('.teamlist').on('click', '#team_remove_btn', function() {
			$(this).closest('li').remove();
			chrome.runtime.sendMessage({method: 'removeTeam', site: 'espn', leagueId: $(this).closest('li').attr('id')}, function(response){});
		});
		$('#search').on('search', searchInput);
	});

var searchInput = function(event) {
	var value = $(event.target).val().trim().toLowerCase();
	$('#player-results').empty();
	if (value.length < 3) {
		return;
	}

	$('#player-results').append('<div class="loading-spinner icon-refresh icon-spin icon-large"></div>');

	chrome.extension.sendMessage({method: 'playerSearch', query: value}, function(response) {
		_gaq.push(['_trackEvent', 'Search', value]);
		var container = $('#cm-player-results');
		container.empty();

		response.results = _.sortBy(response.results, 'name');

		_.each(response.results, function(player) {

			var tempPlayer = $('<div class="search-player" data-player-id="' + player.id + '"><div class="player-img"><img class="fix-error" src="' + player.profileImage + '"></div><div class="player-search-name"><a target="_blank" href="' + player.playerProfileUrl + '">' + player.name + '</a><div class="player-positions">' + player.positions + '</div></div><div class="player-search-availability"></div><div class="player-search-expand" data-player-id="' + player.id + '"><span class="expand-icon icon-chevron-sign-right"></span></div><div class="player-details"><div class="player-details-header"><h2 class="selected" data-section-ref=".player-details-availability" data-player-id="' + player.id + '">Availability</h2><h2 data-section-ref=".player-details-stats" data-player-id="' + player.id + '">Stats</h2></div><div class="player-details-availability active player-details-section"></div><div class="player-details-stats player-details-section"><div class="loading-spinner icon-refresh icon-spin icon-large"></div></div></div></div>');

			tempPlayer.find(".fix-error").on("error", function (event) {
				$(event.currentTarget).attr("src", "images/default_profile.png");
			});

			container.append(tempPlayer);
		});

		if (response.results.length == 0) {
			container.append('<div class="no-search-results">No players found.</div>');
		}

		$(".search-player").on("click", function (event) {
			var playerId = $(event.currentTarget).data().playerId;
			console.log("chose " + playerId);
		});

		// $(".player-details-header h2").click(function (event) {
		// 	var currTarget = $(event.currentTarget);
		// 	var playerId = currTarget.data().playerId;
		// 	currTarget.parent().find("h2").removeClass("selected");
		// 	currTarget.addClass("selected");

		// 	var ref = currTarget.data().sectionRef;
		// 	$(".search-player[data-player-id='" + playerId + "'] .player-details-section").removeClass("active");
		// 	$(".search-player[data-player-id='" + playerId + "'] .player-details-section" + ref).addClass("active");

		// 	$.ajax({
		// 		url: location.protocol + "//games.espn.go.com/ffl/format/playerpop/overview?playerId=" + playerId + "&playerIdType=playerId&seasonId=2013&xhr=1",
		// 		type: "GET",
		// 		success: function (response) {
		// 			var jqResp = $(response);
		// 			jqResp.find("#overviewTabs #moreStatsView0 .pc").remove();
		// 			jqResp.find("#overviewTabs #moreStatsView0 table").removeAttr("style");
		// 			$(".search-player[data-player-id='" + playerId + "'] .player-details-stats").html(jqResp.find("#overviewTabs #moreStatsView0").html());
		// 		}
		// 	});
		// 	event.preventDefault();
		// 	event.stopPropagation();
		// 	return false;

		// });

		// $('.ff-btn').click(function(event) {
		// 	var data = $(event.currentTarget).data();
		// 	if (data.actionType !== undefined) {
		// 		_gaq.push(['_trackEvent', 'PlayerAction', data.actionType, data.playerName + ':' + data.playerId, 0]);
		// 	}
		// });
	});
};
})();