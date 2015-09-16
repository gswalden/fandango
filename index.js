var request = require('request')
  , cheerio = require('cheerio')
  // , http = require('http')
  , ms = require('ms')
  ;

var urls = [
  'http://www.fandango.com/amcloewslincolnsquare13_aabqi/theaterpage?date=10/2/2015',
  // 'http://www.fandango.com/amcloewslincolnsquare13_aabqi/theaterpage?date=12/18/2015',
];

function curl() {
  urls.forEach(function(url) {
    request(url, function(err, res, body) {
      if (err) return;

      var $ = cheerio.load(body);
      $('.showtimes-movie-title').each(function() {
        var title = $(this).text();
        if (title.match(/martian/i)) {
          console.log('Alert!');
        } else if (title.match(/(star\s+wars|awakens)/i)) {
          console.log('Alert!');
        } else {
          console.log('No match for ' + title);
        }
      });
    });
  });
}

setInterval(curl, ms('30min'));
curl();


// var server = http.createServer(function(req, res) {
//   res.end('Get in and get it!');
// }).listen(8000, function() {
//   console.log('Listening…');
// });

