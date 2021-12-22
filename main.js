
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
let adapter = new utils.Adapter('iceroad');

//define urls
let options1 = ''; let options2 = ''; let options3 = ''; let options4= '';
let urls = [options1,options2,options3,options4]
let thisUrl ='';

//define data
let res = []
let res_data = []
let data_message = []
let data_code = []
let data_callsLeft  = []
let data_callsDailyLimit  = []
let data_requestdate  = []
let data_forecastid  = []
let data_forecasttext  = []
let data_forecastcity  = []
let data_forecastdate  = []
let data_callsResetInSeconds = []


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

	create_delete_state();
	getwarning();

}

async function getwarning () {

	let mail_active1 = adapter.config.mail_active1;
	let mail_active2 = adapter.config.mail_active2;
	let mail_active3 = adapter.config.mail_active3;
	let mail_active4 = adapter.config.mail_active4;
	let mail_active = [mail_active1,mail_active2,mail_active3,mail_active4]

	let location_active1 = true;
	let location_active2 = adapter.config.location_active2;
	let location_active3 = adapter.config.location_active3;
	let location_active4 = adapter.config.location_active4;
	let location_active = [location_active1,location_active2,location_active3,location_active4]

	let location_name1 = adapter.config.Location_Name1;
	let location_name2 = adapter.config.Location_Name2;
	let location_name3 = adapter.config.Location_Name3;
	let location_name4 = adapter.config.Location_Name4;
	let location_name = [location_name1,location_name2,location_name3,location_name4]

	let apikey1 =	adapter.config.APIK1;
	let apikey2 =	adapter.config.APIK2;
	let apikey3 =	adapter.config.APIK3;
	let apikey4 =	adapter.config.APIK4;
	let apikey = [apikey1,apikey2,apikey3,apikey4]


	let lon1 =	adapter.config.longitude1;
	let lon2 =	adapter.config.longitude2;
	let lon3 =	adapter.config.longitude3;
	let lon4 =	adapter.config.longitude4;
	let lon = [lon1,lon2,lon3,lon4]

	let lat1 =	adapter.config.latitude1;
	let lat2 =	adapter.config.latitude2;
	let lat3 =	adapter.config.latitude3;
	let lat4 =	adapter.config.latitude4;
	let lat = [lat1,lat2,lat3,lat4]


	let email_from1 = adapter.config.email_from1;
	let email_from2 = adapter.config.email_from2;
	let email_from3 = adapter.config.email_from3;
	let email_from4 = adapter.config.email_from4;
	let email_from = [email_from1,email_from2,email_from3,email_from4]

	let email_to1 = adapter.config.email_to1;
	let email_to2 = adapter.config.email_to2;
	let email_to3 = adapter.config.email_to3;
	let email_to4 = adapter.config.email_to4;
	let email_to = [email_to1,email_to2,email_to3,email_to4]

	let email_subject1 = adapter.config.email_subject1;
	let email_subject2 = adapter.config.email_subject2;
	let email_subject3 = adapter.config.email_subject3;
	let email_subject4 = adapter.config.email_subject4;
	let email_subject = [email_subject1,email_subject2,email_subject3,email_subject4]

	let email_message1 = adapter.config.email_message1;
	let email_message2 = adapter.config.email_message2;
	let email_message3 = adapter.config.email_message3;
	let email_message4 = adapter.config.email_message4;
	let email_message = [email_message1,email_message2,email_message3,email_message4]

	let link = adapter.config.linkdata;

	adapter.log.debug('apikey: '+ apikey);

	if(location_active1){
		urls[0]  = link +'?key=' + apikey[0] + '&lat=' + lat[0] + '&lng=' + lon[0];
		adapter.log.debug('link0: '  +urls[0]);
	}
	if(location_active2){
		urls[1]  = link +'?key=' + apikey[1] + '&lat=' + lat[1] + '&lng=' + lon[1];
		adapter.log.debug('link1: '  +urls[1]);
	}
	if(location_active3){
		urls[2]  = link +'?key=' + apikey[2] + '&lat=' + lat[2] + '&lng=' + lon[2];
		adapter.log.debug('link2: '  +urls[2]);
	}
	if(location_active4){
		urls[3]  = link +'?key=' + apikey[3] + '&lat=' + lat[3] + '&lng=' + lon[3];
		adapter.log.debug('link3: '  +urls[3]);
	}


		for (let url_read_index = 0; url_read_index<5;url_read_index++) {

			thisUrl = urls[url_read_index];
			adapter.log.debug('ThisUrl '+thisUrl);
			if (location_active[url_read_index] == true) {
				await axios
					.get(thisUrl)
					.then (async function(response) {
					adapter.log.debug('axios done');

					res = response.data.result;

					adapter.log.info('response.data.result: ' + JSON.stringify(response.data.result));
					adapter.log.info('response.data: ' + JSON.stringify(response.data));

					res_data = response.data;
					data_message = res_data.message;
					data_code = res_data.code;

					adapter.log.debug("data_code " + url_read_index + ": " + data_code);
					adapter.log.debug("location_active[url_read_index]  " + location_active[url_read_index]);
					if (data_code == 200 && location_active[url_read_index] == true) {

						data_callsLeft = res_data.callsLeft;
						data_callsDailyLimit = res_data.callsDailyLimit;

						data_requestdate = res.requestDate;
						data_forecastid = res.forecastId;
						data_forecasttext = res.forecastText;
						data_forecastcity = res.forecastCity;
						data_forecastdate = res.forecastDate;
						data_callsResetInSeconds = res_data.callsResetInSeconds;

						//adapter.setState('object', {val: JSON.stringify(response.data.result), ack: true});
						adapter.setState(url_read_index + '.requestDate', {val: data_requestdate, ack: true});
						adapter.setState(url_read_index + '.forecastId', {val: data_forecastid, ack: true});
						adapter.setState(url_read_index + '.forecastText', {val: data_forecasttext, ack: true});
						adapter.setState(url_read_index + '.forecastCity', {val: data_forecastcity, ack: true});
						adapter.setState(url_read_index + '.forecastDate', {val: data_forecastdate, ack: true});

						adapter.setState(url_read_index + '.message', {val: data_message, ack: true});
						adapter.setState(url_read_index + '.code', {val: data_code, ack: true});
						adapter.setState(url_read_index + '.callsLeft', {val: data_callsLeft, ack: true});
						adapter.setState(url_read_index + '.callsDailyLimit', {val: data_callsDailyLimit, ack: true});
						adapter.setState(url_read_index + '.callsResetInSeconds', {
							val: data_callsResetInSeconds,
							ack: true
						});
						adapter.setState(url_read_index + '.location_name', {val: location_name[url_read_index], ack: true});

						if (mail_active[url_read_index] == true && data_forecasttext =="Eis!") {

							adapter.log.debug(url_read_index + '.send mail');

							let text = 	email_subject[url_read_index];
							let result1 = text.indexOf("datum");
							let result2 = text.indexOf("date");

							if (result1 != -1 ){
								email_subject[url_read_index] = text.slice(0, -5);
								email_subject[url_read_index] = email_subject[url_read_index] + data_forecastdate;
							} else if(result2 != -1){
								email_subject[url_read_index] = text.slice(0, -4);
								email_subject[url_read_index] = email_subject[url_read_index]	+ ' - ' + data_forecastdate;
							}

							adapter.sendTo("email", {
								from:    email_subject[url_read_index],
								to:      email_to[url_read_index], // comma separated multiple recipients.
								subject: email_subject[url_read_index],
								text:   email_message[url_read_index]
							});
						}

						adapter.log.debug(url_read_index + '.object' + JSON.stringify(response.data.result));
						adapter.log.debug(url_read_index + '.message' + data_message);
						adapter.log.debug(url_read_index + '.code' + data_code);
						adapter.log.debug(url_read_index + '.callsLeft' + data_callsLeft);
						adapter.log.debug(url_read_index + '.callsDailyLimit' + data_callsDailyLimit);
						adapter.log.debug(url_read_index + '.data_callsResetInSeconds' + data_callsResetInSeconds);
						adapter.log.debug(url_read_index + '.location_name' + location_name[url_read_index]);

					} else if (data_code == 300) {
						adapter.log.error(url_read_index + '.missing latitude and longitude');
						adapter.setState(url_read_index + '.message', {val: data_message, ack: true});

						adapter.setState(url_read_index + '.requestDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastId', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastText', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastCity', {val: '0', ack: true});
						adapter.setState(url_read_index + '.forecastDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsLeft', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsDailyLimit', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsResetInSeconds', {val: 0, ack: true});
						adapter.setState(url_read_index + '.location_name', {val: location_name[url_read_index], ack: true});
					} else if (data_code == 400) {
						adapter.log.error(url_read_index + '.api-key is missing');
						adapter.setState(url_read_index + '.message', {val: data_message, ack: true});

						adapter.setState(url_read_index + '.requestDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastId', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastText', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastCity', {val: '0', ack: true});
						adapter.setState(url_read_index + '.forecastDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsLeft', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsDailyLimit', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsResetInSeconds', {val: 0, ack: true});
						adapter.setState(url_read_index + '.location_name', {val: location_name[url_read_index], ack: true});
					} else if (data_code == 401) {
						adapter.log.error(url_read_index + '.invalid api-key');
						adapter.setState(url_read_index + '.message', {val: data_message, ack: true});

						adapter.setState(url_read_index + '.requestDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastId', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastText', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastCity', {val: '0', ack: true});
						adapter.setState(url_read_index + '.forecastDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsLeft', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsDailyLimit', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsResetInSeconds', {val: 0, ack: true});
						adapter.setState(url_read_index + '.location_name', {val: location_name[url_read_index], ack: true});
					} else if (data_code == 402) {
						adapter.log.error(url_read_index + '.daily call limit reached');
						adapter.setState(url_read_index + '.message', {val: data_message, ack: true});

						adapter.setState(url_read_index + '.requestDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastId', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastText', {val: 0, ack: true});
						adapter.setState(url_read_index + '.forecastCity', {val: '0', ack: true});
						adapter.setState(url_read_index + '.forecastDate', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsLeft', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsDailyLimit', {val: 0, ack: true});
						adapter.setState(url_read_index + '.callsResetInSeconds', {val: 0, ack: true});
						adapter.setState(url_read_index + '.location_name', {val: location_name[url_read_index], ack: true});
					}

					})
					.catch(function(error) {

							adapter.log.error('Axios Error '+ error);

					});
			}

		}
}


async function create_delete_state (){

	let location_active1 = true;
	let location_active2 = adapter.config.location_active2;
	let location_active3 = adapter.config.location_active3;
	let location_active4 = adapter.config.location_active4;
	let location_active = [location_active1,location_active2,location_active3,location_active4]


	for (let create_index =0; create_index<5;create_index++){
		if (location_active[create_index] == true){

			await adapter.setObjectNotExistsAsync(create_index+'.requestDate', {
				type: 'state',
				common: {
					name: "requestDate",
					type: 'string',
					role: 'value.time',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.forecastId', {
				type: 'state',
				common: {
					name: "forecastId",
					type: 'number',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.forecastText', {
				type: 'state',
				common: {
					name: "forecastText",
					type: 'string',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.forecastCity', {
				type: 'state',
				common: {
					name: "forecastCity",
					type: 'string',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.forecastDate', {
				type: 'state',
				common: {
					name: "forecastDate",
					type: 'string',
					role: 'value.time',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.message', {
				type: 'state',
				common: {
					name: "message",
					type: 'string',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.code', {
				type: 'state',
				common: {
					name: "code",
					type: 'number',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.callsLeft', {
				type: 'state',
				common: {
					name: "callsLeft",
					type: 'number',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.callsDailyLimit', {
				type: 'state',
				common: {
					name: "callsDailyLimit",
					type: 'number',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.callsResetInSeconds', {
				type: 'state',
				common: {
					name: "callsResetInSeconds",
					type: 'number',
					role: 'value',
					unit: 's',
					read: true,
					write: false
				},
				native: {}
			});

			await adapter.setObjectNotExistsAsync(create_index+'.location_name', {
				type: 'state',
				common: {
					name: "location_name",
					type: 'string',
					role: 'value',
					read: true,
					write: false
				},
				native: {}
			});

		}else{
			await  adapter.delObjectAsync(create_index + '.requestDate');
			await  adapter.delObjectAsync(create_index + '.forecastId');
			await  adapter.delObjectAsync(create_index + '.forecastText');
			await  adapter.delObjectAsync(create_index + '.forecastCity');
			await  adapter.delObjectAsync(create_index + '.forecastDate');
			await  adapter.delObjectAsync(create_index + '.message');
			await  adapter.delObjectAsync(create_index + '.code');
			await  adapter.delObjectAsync(create_index + '.callsLeft');
			await  adapter.delObjectAsync(create_index + '.callsDailyLimit');
			await  adapter.delObjectAsync(create_index + '.callsResetInSeconds');
			await  adapter.delObjectAsync(create_index + '.location_name');
		}
	}
}


