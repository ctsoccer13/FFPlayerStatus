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
			// renderPopupTrigger(response.popup_trigger);
			// renderPopupPosition(response.popup_position);
			renderAnnotations(response.globalAnnotations, response.rosterAnnotations);

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
	
	var setInlineAvailability = function(inline) {
		if (inline) {
			$(".inline-availability-settings-enable .ff-btn").removeClass("status2").addClass("status1");
		} else if (inline == false) {
			$(".inline-availability-settings-enable .ff-btn").removeClass("status1").addClass("status2");
		}
	};

	var renderInlineAvailability = function (inlineVal) {
	    setInlineAvailability(inlineVal);
		$(".inline-availability-settings-enable .ff-btn").click(_.bind(function (event) {
			var inlineEnabled = !$(event.currentTarget).hasClass("status1");
			var data = {
				inline: inlineEnabled
			};
			chrome.extension.sendMessage({
				method: 'changeSetting',
				query: data
			});
			setInlineAvailability(inlineEnabled);
		}, this));
	};

	// var renderPopupTrigger = function (popupTriggerVal) {
	// 	$(".popup-trigger").hide();

	// 	return;

	// 	var popupTriggerDom = $('<label><input type="radio" name="popupTriggerGroup" value="hover">Hover</label><br><label><input type="radio" name="popupTriggerGroup" value="click">Click</label><br>');

	// 	$(popupTriggerDom).find("[value='" + popupTriggerVal + "']").attr("checked", "checked");

	// 	$(".popup-trigger-settings").html(popupTriggerDom);
	// 	$("[name='popupTriggerGroup']").change(function (event) {
	//     	var value = {
	//     		popup_trigger: $(event.currentTarget).attr("value")
	//     	};
	//     	chrome.extension.sendMessage({method: 'changeSetting', query: value});
	//     	_gaq.push(['_trackEvent', 'popupTriggerSetting', value.popup_trigger]);
	//     });
	// };

	// var renderPopupPosition = function (popupPositionVal) {
	// 	var popupPositionDom = $('<label><input type="radio" name="popupPositionGroup" value="hovercard">Hovercard</label><br><label><input type="radio" name="popupPositionGroup" value="toprightcorner">Top Right Corner</label><br>');

	// 	$(popupPositionDom).find("[value='" + popupPositionVal + "']").attr("checked", "checked");

	// 	$(".popup-position-settings").html(popupPositionDom);
	// 	$("[name='popupPositionGroup']").change(function (event) {
	//     	var value = {
	//     		popup_position: $(event.currentTarget).attr("value")
	//     	};
	//     	chrome.extension.sendMessage({method: 'changeSetting', query: value});
	//     	_gaq.push(['_trackEvent', 'popupPositionSetting', value.popup_position]);
	//     });
	// };

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

	// Build and initialize league object
	// Called when teamlist_add_btn pressed
	var initLeague = function(url) {
		var league = parseURL(url);
		league.url = url;
		$.ajax({
			url: url,
			data: 'text',
			async: false,
			success: _.bind(function(response) {
				league.leagueName = getLeagueName(response);

				var teams = getLeagueTeams(response);
				league.teamName = teams[league.teamId];
				league.shortNames = getLeagueTeamsShortNames(teams);
				league.site = 'espn';
		    	league.sport = 'football';
				league.playerIdToTeamIndex = {};
	  		}, this)
		});
		return league;
	}

	// Fetch and parse all player team names in league
	var getLeagueTeams = function(response) {
		var teams= {};
		var listItems = $(response).find('#games-tabs1 li a');
		listItems.each(function(i, elem) {
			var parts = parseURL(elem.getAttribute("href"));
			teams[parts['teamId']] = $(elem).text();
		});
		return teams;
	}

	// Fetch and parse all shortname/abbreviations for team names in league
	var getLeagueTeamsShortNames = function(teams) {
		var abbrevs = [];
		for (var key in teams) {
			var parts = teams[key].split(/\s/);
			abbrevs[key] = parts[parts.length-1];
		}
		return abbrevs;
	}

	// Get user team name
	var getLeagueName = function(response) {
		var item = $(response).find("div.nav-main-breadcrumbs").children().eq(2);
		return $(item).text();
	}

	// Pull league variables from URL
	var parseURL = function(url) {
		var hash;
    	var league = {};
    	var hashes = url.slice(url.indexOf('?') + 1).split('&');
    	for(var i = 0; i < hashes.length; i++)
    	{
        	hash = hashes[i].split('=');
        	// vars.push(hash[0]);
        	league[hash[0]] = hash[1];
    	}
    	return league;
	};

	// ***** Yahoo functions *****
	// Currently not used
	var initLeagueYahoo = function(url) {
		var league = parseURLYahoo(url);
		league.url = url;
		$.ajax({
			url: url,
			data: 'text',
			async: false,
			success: _.bind(function(response) {
				league.leagueName = getLeagueNameYahoo(response);
				var teams = getLeagueTeamsYahoo(response);
				league.teamName = teams[league.teamId];
				league.shortNames = teams;
				league.site = 'yahoo';
		    	league.sport = 'football';
				league.playerIdToTeamIndex = {};
	  		}, this)
		});
		return league;
	};

	var getLeagueNameYahoo = function(response) {
		var text = $(response).find("span.Ta-end.Mend-sm").text();
		var end = text.replace("Viewing Info for League: ", "");
		var name = end.substring(0, end.indexOf(" ("));
		return name;
	};

	// Fetch and parse all player team names in league
	var getLeagueTeamsYahoo = function(response) {
		var teams= {};
		var myTeamElem = $(response).find('li.Navitem.Navitem-main.Wordwrap-bw');
		var listItems = $(response).find('ul.Nav-v.Dropdown.Nowrap.Nav-main.No-mtop.Fz-xxs').children();
		listItems.push(myTeamElem);
		listItems.each(function(i, elem) {
			var link = $(elem).children(":first");
			var parts = $(link).attr('href').split('/');
			teams[parts[3]] = $.trim($(link).text());
		});
		return teams;
	}

	var parseURLYahoo = function(url) {
		var league = {};
		var urlParts = url.split('.');
		var hashes = urlParts[urlParts.length-1].split('/');
		league['leagueId'] = hashes[2];
		league['teamId'] = hashes[3];
		return league;
	};

	// Teamlist - Insert row into table
	var addLeagueToTeamList = function(league) {
		var template = $('<tr><td class="tl-icon"><a href="' + league.url + '"><img id="teamlist-icon" src="images/' + league.site + '.png"/></a></td><td class="list-group-item tl-teamname" id="' + league.leagueId + '">' + league.teamName + '</td><td id="teamlist_remove_cell"><i class="fa fa-remove" id="team_remove_btn" aria-hidden="true"></i></td></tr>');
		$('#teamlist_tbl > tbody:last-child').append(template);
	}

	// Teamlist - rebuild table on page refresh
	var populateListOnLoad = function() {
		var leagues = this.FF.getLeaguesFromStorage();
		var leaguesLength = 0;
		if (!leagues) {
			console.warn('installer received no leagues for user');
		} else {
			leaguesLength = leagues.length;
		}
		for (var i = 0; i < leaguesLength; ++i) {
			addLeagueToTeamList(leagues[i]);
		}
	}

	// Blacklist - rebuild table on page refresh
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

	// Custom Mapping - rebuild table on page refresh
	var populateCustomMappings = function() {
		chrome.runtime.sendMessage({method: 'getCustomMapping'}, function(response) {
			var mappings = response;
			for (var key in mappings) {
				getPlayerIdAndAddRow(mappings, key);
			};
		});
	};

	// Custom mapping row - build a row from existing mappings (for page refresh)
	var getPlayerIdAndAddRow = function(mappings, key) {
		chrome.runtime.sendMessage({method: 'getPlayerById', playerId: mappings[key]}, function(player) {
			$('#custom-mapping-table > tbody:last-child').append(buildCMRowStatic(key, mappings[key], player.name));
		}.bind(this));
	}

	// Basic input validation for league URL
	var validateURL = function(url) {
		var reg = /^.*\?leagueId=.*&teamId=.*&seasonId=.*$/gi;
		return reg.test(url);
	}

	var validateURLYahoo = function(url) {
		var reg = /^.*\/.*\/\d+\/\d+$/gi;
		return reg.test(url);
	}

	$(document).ready(function() {
		// Assuming refresh, rebuild the lists on load
		populateListOnLoad();
		populateBlacklistOnLoad();
		populateCustomMappings();

		var port = chrome.runtime.connect({name: "settings"});
		port.onMessage.addListener(function(msg) {
			if (msg.status === 'allPlayersComplete') {
				$('#teamlist_input').prop('disabled', false);
		    	$('#teamlist_input').val('');
			}
		});

		// ***** Team list buttons *****
		// Team button - Add a team/league
		$('#teamlist_add_btn').click(function(){
			var url = $('#teamlist_input').val();
			if( !validateURL(url) && !validateURLYahoo(url) ) {
				$('#teamlist_ctnr').removeClass("has-success");
				$('#teamlist_ctnr').addClass("has-warning");

				$('#teamlist_input').removeClass("form-control-success");
				$('#teamlist_input').addClass("form-control-warning");

				return;
			} else {
				$('#teamlist_ctnr').removeClass("has-warning");
				$('#teamlist_ctnr').addClass("has-success");

				$('#teamlist_input').removeClass("form-control-warning");
				$('#teamlist_input').addClass("form-control-success");
			}
			$('#teamlist_input').prop('disabled', true);
			// ESPN league
			if(url.indexOf("espn") !== -1) {
				// Build league object, populate info
		    	var league = initLeague(url);
				addLeagueToTeamList(league);
		    	chrome.runtime.sendMessage({method: 'checkAllPlayers', site: 'espn', league: league}, function(response) {

		    	});
		    	chrome.runtime.sendMessage({method: 'addTeam', site: 'espn', league: league}, function(response) {});
		    }
		    // Yahoo league (not yet working)
		    if(url.indexOf("yahoo") !== -1) {
		    	// var YF = require('yahoo-fantasy');
		    	// var yf = new YF('dj0yJmk9bThpaW5rRFVhTnBhJmQ9WVdrOVdHNXFTMEpUTnpZbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1kNA--', '23fa5e57515e7ccdfc47e8702ad7911cd0ba76ad');
		    	var league = initLeagueYahoo(url);
		    	addLeagueToTeamList(league);
		    	chrome.runtime.sendMessage({method: 'checkAllPlayers', site: league.site, league: league}, function(response) {

		    	});
		    	chrome.runtime.sendMessage({method: 'addTeam', site: league.site, league: league}, function(response) {});
		    }
		});

		// Team button - 'Enter' handler
		$('#teamlist_input').keyup(function(event){
		    if(event.keyCode == 13){
		        $("#teamlist_add_btn").click();
		    }
		});

		// Team button - 'X'/Remove in row
		$('.teamlist').on('click', '#team_remove_btn', function() {
			chrome.runtime.sendMessage({method: 'removeTeam', site: 'espn', leagueId: $(this).closest('li').attr('id')}, function(response){
				$(this).closest('li').remove();
			}.bind(this));
		});

		// ***** Blacklist Buttons *****
		// Blacklist button - Add blacklist term
		$('#blacklist_add_btn').click(function() {
			var url = $('#blacklist_input').val();
			var element = '<tr><td>' + url + '</td><td id="blacklist_remove_cell"><i class="fa fa-remove" id="blacklist_remove_btn" aria-hidden="true"></i></td></tr>';
			$('#blacklist_tbl > tbody:last-child').append(element);
			$('#blacklist_input').val('');
			chrome.runtime.sendMessage({method: 'addBlacklistURL', url: url}, function(response){});
		});

		// Blacklist button - 'Enter' handler
		$('#blacklist_input').keyup(function(event){
		    if(event.keyCode == 13){
		        $("#blacklist_add_btn").click();
		    }
		});

		// Blacklist button - 'X'/Remove in row
		// Have to do .on('click'...) for dynamicaly added items
		$('#blacklist_tbl').on('click', '#blacklist_remove_btn', function(){
			chrome.runtime.sendMessage({method: 'removeBlacklistURL', url: $(this).closest('tr').text()}, function(response){
				$(this).closest('tr').remove();
			}.bind(this));
		});

		// ***** Custom mapping listeners *****
		// Custom mapping button - Add new mapping
		$('#cm_add_btn').click(function() {
			if($('#custom-mapping-table').find('input').length===0) {
				$('#custom-mapping-table > tbody:last-child').append(buildCMRowInput());
			}
		});

		// Custom mapping row - Player search input
		$('#custom-mapping-table').on('search', '#search', searchInput);

		// Custom mapping row - 'X'/Remove in row
		$('#custom-mapping-table').on('click', '#cm-remove-btn', function() {
			var row = $(this).closest('tr');
			var nickname = $(row).find('.cm-nickname-text').text();
			var playerId = $(row).find('.cm-player-text').attr('data-player-id');
			chrome.runtime.sendMessage({method: 'removeCustomMapping', playerId: playerId, name: nickname}, function(response){
				$(row).remove();
			}.bind(this, row));
		});

		// Custom mapping row - Nickname input
		$('#custom-mapping-table').on('blur', '#cm-nickname-input', function(){
			var row = $(this).closest("tr");
			var text = $('#cm-nickname-input').val();
			if (text !== '') {
				$(this).replaceWith('<span class="cm-nickname-text">' + text + '</span>');
				checkIfRowDone(row);
			}
		});

		// Custom mapping row - Player search select
		$('#custom-mapping-table').on('click', '.search-player', function() {
			var row = $(this).closest("tr");
			var player = $(this).find('.player-search-name > span').text();
			var playerId = $(this).attr('data-player-id');
			var inp = $(this).parent().parent().find('#search');
			inp.replaceWith('<span class="cm-player-text" data-player-id="' + playerId + '">' + player + '</span>');
			$(this).parent().remove();
			checkIfRowDone(row);
		});

		$('#custom-mapping-table').on('click', '#cm-edit-btn', function() {
			$(this).css("display", "none");
			var row = $(this).closest("tr");

			var playerNameSpan = $(row).find(".cm-player-text");
			var nicknameSpan = $(row).find(".cm-nickname-text");

			var playerName = playerNameSpan.text();
			var nickname = nicknameSpan.text();
			var playerId = $(row).find('.cm-player-text').attr('data-player-id');
			chrome.runtime.sendMessage({method: 'removeCustomMapping', playerId: playerId, name: nickname}, function(response){});

			playerNameSpan.replaceWith('<input id="search" class="form-control player-search-input" type="search" placeholder="i.e. Matt Ryan" results="10" autosave="player_search" onsearch="searchInput()" incremental="true"/><div id="cm-player-results"></div>');
			var pi = $(row).find("#search");
			$(pi).val(playerName);
			$(pi).trigger("search");
			nicknameSpan.replaceWith('<input type="text" class="form-control" placeholder="Nickname" id="cm-nickname-input">');
			var ni = $(row).find("#cm-nickname-input");
			$(ni).val(nickname);
		});
	});
	
	// Build a custom mapping row with input
	var buildCMRowInput = function() {
		var row = $('<tr><td class="cm-cell cm-nickname-cell"><input type="text" class="form-control" placeholder="Nickname" id="cm-nickname-input"></td><td class="cm-cell cm-player-results-cell"><input id="search" class="form-control player-search-input" type="search" placeholder="i.e. Matt Ryan" results="10" autosave="player_search" onsearch="searchInput()" incremental="true"/><div id="cm-player-results"></div></td><td class="cm-cell" id="cm-remove-cell"><i class="fa fa-edit cm-btn" id="cm-edit-btn" aria-hidden="true" style="display: none;"></i><i class="fa fa-remove cm-btn" id="cm-remove-btn" aria-hidden="true"></i></td></tr>');
		return row;
	};

	// Build a custom mapping row static - for page reload purposes
	var buildCMRowStatic = function(nickname, id, name) {
		var row = $('<tr><td class="cm-cell cm-nickname-cell"><span class="cm-nickname-text">' + nickname + '</span></td><td class="cm-cell cm-player-results-cell"><span class="cm-player-text" data-player-id="' + id + '">' + name + '</td><td class="cm-cell" id="cm-remove-cell"><i class="fa fa-edit cm-btn" id="cm-edit-btn" aria-hidden="true"></i><i class="fa fa-remove cm-btn" id="cm-remove-btn" aria-hidden="true"></i></td></tr>');
		return row;
	};

	// Test if both inputs in CM row are set
	var checkIfRowDone = function(row) {
		if($(row).find('input').length === 0) {
			var nickname = $(row).find('.cm-nickname-text').text();
			var playerId = $(row).find('.cm-player-text').attr('data-player-id');
			$(row).find("#cm-edit-btn").css("display", "inline");
			chrome.runtime.sendMessage({method: 'addCustomMapping', playerId: playerId, name: nickname}, function(response){});
		}
	};

	// Player search functionality - taken from browser_action and trimmed up
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

				var tempPlayer = $('<div class="search-player" data-player-id="' + player.id + '"><div class="player-img"><img class="fix-error" src="' + player.profileImage + '"></div><div class="player-search-name"><span>' + player.name + '</span><div class="player-positions">' + player.positions + '</div></div><div class="player-search-availability"></div><div class="player-search-expand" data-player-id="' + player.id + '"><span class="expand-icon icon-chevron-sign-right"></span></div><div class="player-details"><div class="player-details-header"><h2 class="selected" data-section-ref=".player-details-availability" data-player-id="' + player.id + '">Availability</h2><h2 data-section-ref=".player-details-stats" data-player-id="' + player.id + '">Stats</h2></div><div class="player-details-availability active player-details-section"></div><div class="player-details-stats player-details-section"><div class="loading-spinner icon-refresh icon-spin icon-large"></div></div></div></div>');

				tempPlayer.find(".fix-error").on("error", function (event) {
					$(event.currentTarget).attr("src", "images/default_profile.png");
				});

				container.append(tempPlayer);
			});

			if (response.results.length == 0) {
				container.append('<div class="no-search-results">No players found.</div>');
			}
		});
	};
})();