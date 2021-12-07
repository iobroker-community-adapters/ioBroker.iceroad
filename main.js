
/**
 *
 * ice road adapter
 * written by Patrick Walther
 *
 */

'use strict';

// you have to require the utils module and call adapter function
const schedule = require('node-schedule');
const utils =    require('@iobroker/adapter-core');

//const request = require('request')
const axios = require('axios');
var adapter = new utils.Adapter('iceroad');

let thisUrl ='';

// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.debug('cleaned everything up...');

	    clearTimeout(timer);
		callback();

    } catch (e) {
        callback();
    }
});

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
   main();
});

function main() {
	let lon = adapter.config.longitude;
	let lat  = adapter.config.latitude;
	let apikey= adapter.config.APIK;
	let link = adapter.config.linkdata;

	let urls  = link +'?key=' + apikey + '&lat=' + lat + '&lng=' + lon;

	adapter.log.debug('link: '  +urls);
	thisUrl = urls;
	getwarning();

}

// request data from server
const calc = schedule.scheduleJob('datenübertragen', '*/60 * * * *', async function () {
	getwarning ();
});


async function getwarning () {


		if (thisUrl) {
			await axios
				.get(thisUrl)
				.then (async function(response) {
					adapter.log.debug('axios done');

					let res = response.data.result;
					adapter.log.info('Json axios ' + JSON.stringify(response.data.result));

					let res_data = response.data;
					let data_message = res_data.message;
					let data_code = res_data.code;
					adapter.log.debug("data_code: " + data_code);

					if (data_code == 200 ){




						let data_callsLeft = res_data.callsLeft;
						let data_callsDailyLimit = res_data.callsDailyLimit;

						let data_requestdate = res.requestDate;
						let data_forecastid = res.forecastId;
						let data_forecasttext = res.forecastText;
						let data_forecastcity = res.forecastCity;
						let data_forecastdate = res.forecastDate;

						//adapter.setState('object', {val: JSON.stringify(response.data.result), ack: true});
						adapter.setState('requestDate', {val: data_requestdate, ack: true});
						adapter.setState('forecastId', {val: data_forecastid, ack: true});
						adapter.setState('forecastText', {val: data_forecasttext, ack: true});
						adapter.setState('forecastCity', {val: data_forecastcity, ack: true});
						adapter.setState('forecastDate', {val: data_forecastdate, ack: true});

						adapter.log.debug('object'+JSON.stringify(response.data.result));
						adapter.log.debug('message'+data_message);
						adapter.log.debug('code'+ data_code);
						adapter.log.debug('callsLeft'+data_callsLeft);
						adapter.log.debug('callsDailyLimit'+data_callsDailyLimit);



					} else if (data_code == 300) {
						adapter.log.error('missing latitude and longitude');
						adapter.setState('message', {val: data_message, ack: true});
					} else if (data_code == 400) {
						adapter.log.error('api-key is missing');
						adapter.setState('message', {val: data_message, ack: true});
					} else if (data_code == 401){
						adapter.log.error('invalid api-key');
						adapter.setState('message', {val: data_message, ack: true});
					} else if (data_code == 402){
						adapter.log.error('daily call limit reached');
						adapter.setState('message', {val: data_message, ack: true});
					}

				})
			/*		.catch(function(error) {
                        adapter.log.error('Axios Error ' + error);

                    });*/

		}
}


