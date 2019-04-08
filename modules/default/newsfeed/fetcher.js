/* Magic Mirror
 * Fetcher
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var FeedMe = require("feedme");
var request = require("request");
var iconv = require("iconv-lite");
var convert = require('xml-js');
var QRCode = require('qrcode')


/* Fetcher
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute url string - URL of the news feed.
 * attribute reloadInterval number - Reload interval in milliseconds.
 * attribute logFeedWarnings boolean - Log warnings when there is an error parsing a news article.
 */

var Fetcher = function(url, reloadInterval, encoding, logFeedWarnings) {
	var self = this;
	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	var reloadTimer = null;
	var items = [];

	var fetchFailedCallback = function() {};
	var itemsReceivedCallback = function() {};

	/* private methods */

	/* fetchNews()
	 * Request the new items.
	 */

	 var fetchNews = () => {
		request('https://spectranews.org/headlines', {json: true}, function (error, response, body) {
  			console.log('error:', error); // Print the error if one occurred
  			console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  			console.log('body:', body); // Print the HTML for the Google homepage.
  			var lastCode = null;

  			body.forEach(function(item) { 
			  	getQRCode(item.url)
			  		.then(img => {
			  			var fullItem = "<div id=sourceText>" + item.source + "</div> <br />";

			  			if (lastCode != null) { 
			  				fullItem += lastCode;
			  			}

			  			fullItem += item.title + img;

			  			lastCode = img.replace("qrcode","previous");
			  			items.push(fullItem);
			  			
			  			
			  			if (items.count == body.count) {
			  				self.broadcastItems();
			  			}
			  		});
  			});
  		});
	 }

	 var getQRCode = (url) => {
	 	return new Promise((resolve, reject) => {
	 		var options = {
			  errorCorrectionLevel: 'H',
			  type: 'image/jpeg',
			  rendererOpts: {
			    quality: 0.3
			  }
			}
	 		QRCode.toDataURL(url, options, (err, url) => {
	 			if (err) {
	 				return reject(err);
	 			}
	 			var img = `<img id='qrcode' src=${url} alt='smile' height='150' width='150'>`;
	 			resolve(img);
	 		});
	 	});
	 }

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function() {
		console.log('Schedule update timer.');
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function() {
			fetchNews();
		}, reloadInterval);
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function(interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/* startFetch()
	 * Initiate fetchNews();
	 */
	this.startFetch = function() {
		fetchNews();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function() {
		if (items.length <= 0) {
			//console.log('No items to broadcast yet.');
			return;
		}
		//console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function(callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function(callback) {
		fetchFailedCallback = callback;
	};

	this.url = function() {
		return url;
	};

	this.items = function() {
		return items;
	};
};

module.exports = Fetcher;
