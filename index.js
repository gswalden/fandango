var request = require('request')
  , cheerio = require('cheerio')
  , http = require('http')
  , util = require('util')
  , ms = require('ms')
  ;

if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  var mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY, 
    domain: process.env.MAILGUN_DOMAIN
  });
}

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

    var urls = JSON.parse(body.files['urls.json'].content);

    urls.forEach(function(url) {
      request(url, function(err, res, body) {
        if (err) return;

        var $ = cheerio.load(body);
        $('.showtimes-movie-title').each(function() {
          var title = $(this).text();
          if (title.match(/martian/i) || title.match(/(star\s+wars|awakens)/i)) {
            mailgun.messages().send({
              from: process.env.EMAIL_FROM,
              to: process.env.EMAIL_TO,
              subject: util.format('Tickets found for %s!', title),
              text: url
            }, function (err) {
              if (err) 
                console.log(err);
            });
          } else {
            console.log('No match for ' + title);
          }
        });
      });
    });
  }); 
}

setInterval(curl, ms('30min'));
curl();

var server = http.createServer(function(req, res) {
  res.end('Get in and get it!');
}).listen(8000, function() {
  console.log('Listening…');
});

