/*

----------------------------------------------------------
|
| Fantasy Find Storage
|
----------------------------------------------------------

- Just a helper object for dealing with local storage

*/


this.FFStorage = {
  get: function (user, key) {
    if (localStorage[user] === undefined) {
      return undefined;
    }

    var userGetObj = JSON.parse(localStorage[user]);
    return userGetObj[key];
  },
  set: function (user, key, value) {
    var userObj = {};
    if (localStorage[user] !== undefined) {
      userObj = JSON.parse(localStorage[user]);
    }
    userObj[key] = value;
    localStorage[user] = JSON.stringify(userObj);
  },
  setValue: function(key, value) {
    localStorage[key] = JSON.stringify(value);
  },
  getValue: function(key, value) {
    return localStorage[key] ? JSON.parse(localStorage[key]) : null;
  }
};