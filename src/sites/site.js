var Site = Class.extend({
  init: function(ff, siteName, sport){
    this.ff = ff;
    this.site = siteName;
    // this.sport = sport;
    // this.requireIframe = false;
    // this.fetchingUserId = false;
    this.baseUrl;
    this.userId;
    this.lastLogin;
    this.leagues = [];
    this.load();
  },

  // makeRequest: function(url, callback) {
  //   if (this.requireIframe) {
  //     this.ff.fetchPage(url, callback);
  //   } else {
  //     $.ajax({url: url, data: 'text', success: callback});
  //   }
  // },

  load: function() {
    // Kill this once storage is pulled from ff
    if (!this.ff) {
      return;
    }
    var site = this.ff.storage.getValue(this.site);
    if (site) {
      this.userId = this.site;
      this.lastLogin = site.lastLogin;
    }
  },

  save: function() {
    this.ff.storage.setValue(this.site, {
      userId: this.site,
      lastLogin: this.lastLogin
    });
    this.ff.storage.setValue(this.getSiteUserKey(), {'leagues': this.leagues});
  },

  // setUserId: function(userId) {
  //   this.userId = this.site;
  //   this.lastLogin = new Date();
  // },

  // getUserId: function(callback) {
  //   if (this.userId) {
  //     if (callback) {
  //       callback(this.userId);
  //     }
  //     return this.site;
  //   }
  //   this.fetchUserId(callback);
  // },

  // fetchUserId: function(callback) {
  //   if (this.fetchingUserId !== true) {
  //     this.fetchingUserId = true;

  //     this.makeRequest(this.fetchUserInfoUrl, _.bind(function(page) {
  //       var userId = this.handleUserIdPage_(page);
  //       this.fetchingUserId = false;
  //       // Fetching the user teams as well because for both ESPN and Yahoo we can do this
  //       // from their base pages.
  //       if (userId) {
  //         this.fetchUserTeams(true /* forceReset */, function() {
  //           callback(userId);
  //         });
  //       } else {
  //         callback(userId);
  //       }
  //     }, this));
  //   }
  // },

  // validateUserId_: function(page) {
  //   var userId = this.parseUserId(page);
  //   // No valid username was found.
  //   if (!userId) {
  //     console.warn('could not validate user id from page');
  //     // OMG this is so dirty, global scope vomit.
  //     console.log('no user id found', this.installContext);
  //     if (!this.installContext) {
  //       chrome.runtime.sendMessage({method: 'loginRequest', site: this.site}, function(response) {});
  //     }
  //     return null;
  //   }
  //   return userId;
  // },

  // handleUserIdPage_: function(page) {
  //   var userId = this.validateUserId_(page);
  //   if (userId) {
  //     this.setUserId(userId);
  //     this.save();
  //   }
  //   return userId;
  // },

  // fetchUserTeams: function(forceReset, opt_callback) {
  //   this.makeRequest(this.fetchUserInfoUrl, _.bind(function(page) {
  //     var userId = this.validateUserId_(page);
  //     if (!userId) {
  //       console.warn('Could not validate a user id. Aborting FetchUserTeams.');
  //       if (opt_callback) {
  //         opt_callback();
  //       }
  //       return;
  //     }

  //     if (forceReset === false && this.leagues.length > 0) {
  //       return;
  //     }
  //     this.resetLeagues();
  //     this.handleUserTeamsPage(userId, page);
  //     // Inform the callback of success.
  //     if (opt_callback) {
  //       opt_callback();
  //     }
  //     this.fetchTakenPlayersForAllLeagues(userId);
  //   }, this));
  // },

  fetchTakenPlayersForAllLeagues: function(userId) {
    var leagues = this.leagues;
    for (var i = 0; i < leagues.length; i++) {
      var league = leagues[i];
      if (league.sport === 'football') {
        this[league.sport + 'FetchTakenPlayers'](league);
      }
    }

    this.fetchPlayerOptionsForAllLeagues();
  },

  fetchPlayerOptionsForAllLeagues: function() {
    for (var i = 0; i < this.leagues.length; i++) {
      if (this.leagues[i].sport === 'football') {
        this.fetchPlayerOptionsForLeagueId(this.leagues[i]);
      }
    }
  },

  teamExists: function(league) {
    for (var i = 0; i < this.leagues.length; i++) {
      if (this.leagues[i].leagueId == league.leagueId) {
        return true;
      }
    }
    return false;
  },

  addUserTeam: function(leagueVars) {
    this.fetchTakenPlayers(leagueVars);
    var tempLeaguesObject = this.ff.storage.get(this.getSiteUserKey(), 'leagues');
    tempLeaguesObject = tempLeaguesObject || [];
    tempLeaguesObject.push(leagueVars);
    this.ff.storage.set(this.getSiteUserKey(), 'leagues', tempLeaguesObject);
    this.leagues.push(leagueVars);
  },

  removeUserTeam: function(leagueId) {
    for(var i = 0; i < this.leagues.length; i++) {
      if(this.leagues[i].leagueId === leagueId) {
        this.leagues.splice(i, 1);
        break;
      }
    }
    var leagues = this.ff.storage.get(this.getSiteUserKey(), 'leagues');
    leagues = leagues || [];
    for(var i = 0; i < leagues.length; i++) {
      if(leagues[i].leagueId === leagueId) {
        leagues.splice(i, 1);
        this.ff.storage.set(this.getSiteUserKey(), 'leagues', leagues);
        return;
      }
    }
  },

  addPlayerMapping: function(league, currPlayerId, owningTeamId) {
    league.playerIdToTeamIndex[currPlayerId] = owningTeamId;
    //this.save();
  },

  // getSportForLeagueUrl: function (leagueUrl) {
  //   var urlKeys = _.keys(this.urlToSport);
  //   for (var i = 0; i < urlKeys.length; i++) {
  //     var currKey = urlKeys[i];
  //     if (leagueUrl.indexOf(currKey) !== -1) {
  //       return this.urlToSport[currKey];
  //     }
  //   }
  //   return undefined;
  // },

  getLeaguesFromStorage: function() {
    var leagueInfo = this.ff.storage.getValue(this.getSiteUserKey());
    return leagueInfo && leagueInfo.leagues ? leagueInfo.leagues : [];
  },

  resetLeagues: function() {
    this.ff.storage.set(this.getSiteUserKey(), 'leagues', []);
    this.leagues = [];
  },

  resetStorage: function() {
    this.resetLeagues();
    this.ff.storage.set('global', 'lastLeagueUpdate', Date.now());
  },

  getSiteUserKey: function() {
    return this.site;
  }
});
