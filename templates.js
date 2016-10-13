this["Handlebars"] = this["Handlebars"] || {};
this["Handlebars"]["templates"] = this["Handlebars"]["templates"] || {};

this["Handlebars"]["templates"]["InlineAvailability"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, self=this, functionType="function", escapeExpression=this.escapeExpression;

function program1(depth0,data) {
  
  
  return "active";
  }

  buffer += "<span id=\"inline-availability-marker\" class=\"inline-availability\">\n	<span class=\"availability-type add-leagues ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.add), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n		<span class=\"ff-icon-plus\"></span>\n		<span class=\"inline-availability-txt\">";
  if (helper = helpers.add) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.add); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n	</span>\n	<span class=\"availability-type drop-leagues ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.drop), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n		<span class=\"ff-icon-remove\"></span>\n		<span class=\"inline-availability-txt\">";
  if (helper = helpers.drop) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.drop); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n	</span>\n	<span class=\"availability-type trade-leagues ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.trade), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n		<span class=\"ff-icon-random\"></span>\n		<span class=\"inline-availability-txt\">";
  if (helper = helpers.trade) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.trade); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n	</span>\n</span>\n";
  return buffer;
  });

this["Handlebars"]["templates"]["LeagueAvailabilityRow"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"league-row\">\n	<div class=\"league-row-padder\">\n		<div class=\"site-icon ";
  if (helper = helpers.leagueSite) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.leagueSite); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" ></div>\n		<div class=\"league-name\">";
  if (helper = helpers.league) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.league); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n		<a class=\"ff-btn-link\" href=\"";
  if (helper = helpers.btnLink) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.btnLink); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" target=\"_blank\">\n			<div class=\"ff-btn ";
  if (helper = helpers.btnClass) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.btnClass); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-player-id=\"";
  if (helper = helpers.playerId) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.playerId); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-player-name=\"";
  if (helper = helpers.playerName) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.playerName); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\" data-action-type=\"";
  if (helper = helpers.btnName) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.btnName); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n				<span class=\"ff-btn-icon ";
  if (helper = helpers.iconClass) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.iconClass); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"></span>\n				<div class=\"ff-btn-text\">";
  if (helper = helpers.btnName) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.btnName); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n			</div>\n		</a>\n	</div>\n</div>";
  return buffer;
  });

this["Handlebars"]["templates"]["PopupTemplate"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"popup-arrow\"><div class=\"popup-arrow-inner\"></div></div>\n<div class=\"close\">X</div>\n<div class=\"player-profile-img\">\n	<div class=\"temp-default-player\"></div>\n</div>\n<div class=\"player-info\">\n	<div class=\"player-name\">\n		<a target=\"_blank\" href=\"";
  if (helper = helpers.playerProfileUrl) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.playerProfileUrl); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n			";
  if (helper = helpers.name) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.name); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n		</a>\n	</div>\n	<div class=\"player-positions\">\n		";
  if (helper = helpers.positions) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.positions); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n	</div>\n</div>\n<div class=\"player-league-data\">\n	<div class=\"player-section-header\"><h2 class=\"selected pointer\" data-section-ref=\".league-data\">Availability</h2><h2 class=\"pointer player-statistics\" data-section-ref=\".player-stats\">Stats</h2></div>\n	<div class=\"league-data player-data-section active\"></div>\n	<div class=\"player-stats player-data-section\"></div>\n</div>";
  return buffer;
  });