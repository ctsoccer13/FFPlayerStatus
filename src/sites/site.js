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

  updateLocalLeague: function(league) {
    for(var i = 0; i < this.leagues.length; i++) {
      if(this.leagues[i].leagueId === league.leagueId) {
        this.leagues[i] = league;
      }
    }
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

  addPlayerToDict: function(player) {
    var parts = player.name.split(/\s+/);
    var firstName = parts[0].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
    var lastName = parts[1].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
    // if (parts.length > 2 && parts[2] !== 'Jr.') {
    //  lastName = parts[2].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
    // } else {
    //  lastName= parts[1].toLowerCase().replace(/[,\/#!$%\^&\*;:{}=~()]/g,'');
    // }
    // var firstName = player.name.substring(0, player.name.lastIndexOf(" ") + 1);
    // var lastName = player.name.substring(player.name.lastIndexOf(" ") + 1, player.name.length);
    // ^^ This won't work for "Odell Beckham Jr." -- last name will be Jr.

    if(!(lastName in window.playerDict)) {
      window.playerDict[lastName] = {};
    }
    window.playerDict[lastName][firstName] = player;
    // For players like C.J. Anderson with .'s in their name, which some type and others don't...
    if(firstName.indexOf(".")!== -1) {
      firstName = firstName.replace(/\./g, '');
      window.playerDict[lastName][firstName] = player;
    }
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
