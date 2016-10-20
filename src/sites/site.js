var Site = Class.extend({
  init: function(ff, siteName, sport){
    this.ff = ff;
    this.site = siteName;
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

  fetchTakenPlayersForAllLeagues: function(userId) {
    var leagues = this.leagues;
    for (var i = 0; i < leagues.length; i++) {
      var league = leagues[i];
      if (league.sport === 'football') {
        this.fetchTakenPlayers(league);
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
