if (process.env.NODE_ENV != 'production') {
  require('dotenv').load();
}

var request = require('request')
  , cheerio = require('cheerio')
  , http = require('http')
  , util = require('util')
  , ms = require('ms')
  , moment = require('moment-timezone')
  , _ = require('lodash')
  , Slack = require('slack-client')
  , slack = new Slack(process.env.SLACK_TOKEN)
  , channel
  ;


if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  var mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
  });
}

slack.on('open', function() {
  channel = slack.getChannelByName('the-bot-awakens');
  setInterval(curl, ms('30min'));
  curl();
}).on('message', function(message) {
  // console.log(message);
}).on('error', function(err) {
  console.log(err);
});

slack.login();

var movies = [
  {
    pattern: /(star\s+wars|awakens)/i,
    name: 'Star Wars: The Force Awakens',
    slack: true
  }
];

function curl() {
  request({
    uri: process.env.GIST_URL,
    headers: {
      'User-Agent': process.env.GITHUB_USER
    },
    json: true
  }, function(err, res, body) {
    if (err) {
      console.log(err);
      return;
    }

    var theaters = JSON.parse(body.files['urls.json'].content);

    _.forEach(theaters, function(theater) {
      request(theater.url, function(err, res, body) {
        if (err) return;

        var $ = cheerio.load(body);
        var foundTitles = [];
        $('.showtimes-movie-title').each(function() {
          foundTitles.push($(this).text());
        });
        _.forEach(movies, function(movie) {
          _.forEach(foundTitles, function(title) {
            if (title.match(movie.pattern)) {
              mailgun.messages().send({
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_TO,
                subject: util.format('Tickets found for %s!', title),
                text: theater.url
              }, function (err) {
                if (err)
                  console.log(err);
              });
              if (movie.slack) {
                channel.send(util.format('<!channel> Found, the tickets are!\n%s', theater.url));
              }
              slack.getDMByName('gregbot').send('Tickets! ' + theater.url);
              return false;
            } else {
              console.log(util.format('No match for %s @ %s', movie.name, theater.name));
              var now = moment().tz('America/New_York');
              // between 17:30 & 18:00
              var shouldBePosted = now.hour() >= 17 && now.minutes() >= 30 && now.hour() < 18;
              if (movie.slack && shouldBePosted) {
                channel.send(util.format('Found no tickets, I have. _(searched %s)_', theater.name));
              }
            }
          });
        });
      });
    });
  });
}

var server = http.createServer(function(req, res) {
  res.end('Get in and get it!');
}).listen(process.env.PORT || 8000, function() {
  console.log('Listening…');
});

