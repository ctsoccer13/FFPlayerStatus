# FFPlayerStatus
What it does:

At a high level, FFPlayerStatus gathers information about your fantasy league and uses it to inject HTML into webpages that allows you to see a player's status without needing to look at your league. Take a look at the screenshot below:

http://i.imgur.com/GPaxRth.png

Important note:
This currently only works for ESPN leagues (mostly due to the fact that most of my leagues are ESPN). I'm working on supporting Yahoo leagues in the future, but the implementation is very different and I don't have a timetable there yet. Due to being 6-7 weeks into the season already, I wanted to share this so others can benefit before the season ends.

How to get it:
The plugin's code is hosted at https://github.com/ctsoccer13/FFPlayerStatus
To get the code, you can either use git or download the zip package from the site above.
Using git:
Ensure you've downloaded and installed git
Run the command: git clone https://github.com/ctsoccer13/FFPlayerStatus.git
This will create a directory <wherever you ran the command>/FFPlayerStatus that holds the code

Using zip file:
Download the zip file and extract it somewhere.

How to install it:
After you've obtained the code, take note of where the FFPlayerStatus directory is located.
In Chrome:
- Click the '...' in the top left corner
- More tools
- Extensions
- On the Extensions page (chrome://extensions), click the 'Load unpacked extension...' button
- Find the FFPlayerStatus directory, highlight it, click OK

How to use it:
First, as I mentioned up there, this currently only works for ESPN leagues.
When you install the plugin, a settings page will load. You'll also notice a new icon beside the URL input. You can click that and hit Settings on the window to reach the same page.
On the settings page, there are 3 important inputs:
1) Teams
This is how the plugin knows where to get its information. All you need to do here is to paste your 'My Team' URL.
i.e. if you're looking at your roster, right-click on 'My Team' towards the top, Copy link address, and paste it into the box.
Your URL should follow the pattern of: http://games.espn.com/ffl/clubhouse?leagueId=XXXXXX&teamId=X&seasonId=2016 with numbers instead of X's
After you've put your URL in, you should see your team's name show up in the table below, meaning the plugin is working. 
Important things to note:
- Nothing works without at least one team input
- You can input multiple teams, just follow the same steps for each team

2) Blacklist
Sometimes I don't want the plugin to add hover popups on certain pages. If you enter a term here, it will prevent the plugin from running on any page with that term in the URL.
So, for example, if I put 'reddit' in there, it won't load for any reddit page. However, if I put 'reddit.com/r/nfl', annotations will still show on /r/FF.

3) Custom Mappings
We here at /r/FF love our nicknames and I wanted to be able to still get the same functionality when someone says "Big Ben" instead of Ben Roethlisberger. So, this is where you can setup your own personal mappings. Hit Add, type a nickname into the left box, and search for the player in the right box. When both fields are filled, the mapping should start working the next time you load a page.
Keep in mind... I wanted to make this fairly static once you input something. So, after you click out of a box, that field is set. You can remove the entire mapping, but you can't go back in to edit the field.

Known Issues:
- Players with the same name (looking at you, David Johnson) may show the incorrect player
- RES and other infinite scrolling sites doesn't render the plugin on new content

Closing Notes:
At this point, I think I've talked enough and you should have a pretty good idea of how to setup and use the plugin. For the most part, it's worked pretty well for me. 
For my own sanity, I also want to point out that, while I am a software developer by trade, I don't have a lot of experience in web development. Some of the code was pulled from an outdated plugin and may not be the newest, fanciest way of doing something. I'm also still developing, optimizing, and cleaning up the code. So, all that said, there will be bugs and the code is still pretty messy. I'm open to feedback, optimizations, and feature requests, but I'm also working on my own list of TODOs and optimizing as I can.