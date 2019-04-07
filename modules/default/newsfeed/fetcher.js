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

  			body.forEach(function(item) { 
			  	getQRCode(item.url)
			  		.then(img => {
			  			console.log(img)
			  			items.push(item.title + img);
			  		//"<div id='spacing-div'>&nbsp;</div>"
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

	// var fetchNews = function() {
	// 	clearTimeout(reloadTimer);
	// 	reloadTimer = null;
	// 	myJson = null;
		

			
	// 	//items = ["Early Cambridge Analytica fears revealed","Poor People’s Campaign to launch bus tour in South Carolina","Markets Right Now: Stocks are opening lower on Wall Street","Who Will Be Thailand’s Next Prime Minister?","Analyzing Kazakhstan’s First Tenure at the UN Security Council","Emilia, Vaudeville Theatre, review: a galvanising slice of agit prop for the #MeToo generation","Most promising Alzheimer’s drug trial ends in failure: ‘We are getting pretty desperate’","India-Indonesia Naval Patrols Highlights Maritime Collaboration","Relative of African dictator admits to counterfeiting money","Singapore, Thailand, Vietnam & Hong Kong"];

	// 	items = null;
	// 	request('https://spectranews.org/headlines', function (error, response, body) {
 //  			console.log('error:', error); // Print the error if one occurred
 //  			console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
 //  			console.log('body:', body); // Print the HTML for the Google homepage.
 //  			items = body
		


		

	// 	var parser = new FeedMe();
	// 	console.log("pre parsing");
	// 	parser.on("item", function(item) {
	// 		console.log("parsing");
	// 		console.log("--------------\n\nITEMS:" + items);
	// 		// var options = {compact: true, ignoreComment: true, spaces: 4};
	// 		// item = convert.json2xml(json,options);
	// 		// console.log(item)
	// 		var title = item.title;
	// 		var description = item.description || item.summary || item.content || "";
	// 		var pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
	// 		var url = item.url || item.link || "";

	// 		if (title && pubdate) {

	// 			var regex = /(<([^>]+)>)/ig;
	// 			description = description.toString().replace(regex, "");

	// 			items.push({
	// 				title: title,
	// 				description: description,
	// 				pubdate: pubdate,
	// 				url: url,
	// 			});

	// 		} else if (logFeedWarnings) {
	// 			console.log("Can't parse feed item:");
	// 			console.log(item + "ITEM ");
	// 			console.log("Title: " + title);
	// 			console.log("Description: " + description);
	// 			console.log("Pubdate: " + pubdate);
	// 		}
	// 	});

	// 	parser.on("end",	function() {
	// 		console.log("end parsing - " + url);
	// 		self.broadcastItems();
	// 		scheduleTimer();
	// 	});

	// 	parser.on("error", function(error) {
	// 		console.log("ERRORRRRR")
	// 		fetchFailedCallback(self, error);
	// 		scheduleTimer();
	// 	});


	// 	nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
	// 	headers =	{"User-Agent": "Mozilla/5.0 (Node.js "+ nodeVersion + ") MagicMirror/"	+ global.version +	" (https://github.com/MichMich/MagicMirror/)",
	// 		"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
	// 		"Pragma": "no-cache"}

	// 	request({uri: url, encoding: null, headers: headers})
	// 		.on("error", function(error) {
	// 			console.log("REQUEST ERROR");
	// 			fetchFailedCallback(self, error);
	// 			scheduleTimer();
	// 		})
	// 		.pipe(iconv.decodeStream(encoding)).pipe(parser);
	// 	});

	// };

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
