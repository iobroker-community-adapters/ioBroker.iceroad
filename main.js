'use strict';

const utils = require('@iobroker/adapter-core');
const axios = require('axios');

const urls = ['', '', '',''];
//const thisUrl ='';

//define data
let res = [];
let data_callsLeft  = [];
let data_callsDailyLimit  = [];
let data_requestdate  = [];
let data_forecastid  = [];
let data_forecasttext  = [];
let data_forecastcity  = [];
let data_forecastdate  = [];
let data_callsResetInSeconds = [];

class Iceroad extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'iceroad',
		});
		this.on('ready', this.onReady.bind(this));
		//this.on('stateChange', this.onStateChange.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute 'native') is accessible via
		// this.config:
		this.log.debug("start iceroad");

		await this.create_delete_state();
		await this.getwarning();
		this.stop();
	}


	async getwarning () {

		const mail_active1 = this.config.mail_active1;
		const mail_active2 = this.config.mail_active2;
		const mail_active3 = this.config.mail_active3;
		const mail_active4 = this.config.mail_active4;
		const mail_active = [mail_active1, mail_active2, mail_active3, mail_active4]
		this.log.debug("mail_active:" + mail_active);

		const location_active1 = true;
		const location_active2 = this.config.location_active2;
		const location_active3 = this.config.location_active3;
		const location_active4 = this.config.location_active4;
		const location_active = [location_active1, location_active2, location_active3, location_active4]
		this.log.debug("location_active:" + location_active);

		const location_name1 = this.config.Location_Name1;
		const location_name2 = this.config.Location_Name2;
		const location_name3 = this.config.Location_Name3;
		const location_name4 = this.config.Location_Name4;
		const location_name = [location_name1, location_name2, location_name3, location_name4]
		this.log.debug("location_name:" + location_name);

		const apikey1 = this.config.APIK1;
		const apikey2 = this.config.APIK2;
		const apikey3 = this.config.APIK3;
		const apikey4 = this.config.APIK4;
		const apikey = [apikey1, apikey2, apikey3, apikey4]
		this.log.debug("apikey:" + apikey);

		const lon1 = this.config.longitude1;
		const lon2 = this.config.longitude2;
		const lon3 = this.config.longitude3;
		const lon4 = this.config.longitude4;
		const lon = [lon1, lon2, lon3, lon4];
		this.log.debug("lon:" + lon);

		const lat1 = this.config.latitude1;
		const lat2 = this.config.latitude2;
		const lat3 = this.config.latitude3;
		const lat4 = this.config.latitude4;
		const lat = [lat1, lat2, lat3, lat4]
		this.log.debug("lat:" + lat);

		const email_from1 = this.config.email_from1;
		const email_from2 = this.config.email_from2;
		const email_from3 = this.config.email_from3;
		const email_from4 = this.config.email_from4;
		const email_from = [email_from1, email_from2, email_from3, email_from4]
		this.log.debug("email_from:" + email_from);

		const email_to1 = this.config.email_to1;
		const email_to2 = this.config.email_to2;
		const email_to3 = this.config.email_to3;
		const email_to4 = this.config.email_to4;
		const email_to = [email_to1, email_to2, email_to3, email_to4]
		this.log.debug("email_to:" + email_to);

		const email_subject1 = this.config.email_subject1;
		const email_subject2 = this.config.email_subject2;
		const email_subject3 = this.config.email_subject3;
		const email_subject4 = this.config.email_subject4;
		const email_subject = [email_subject1, email_subject2, email_subject3, email_subject4];
		this.log.debug("email_subject:" + email_subject);

		const email_message1 = this.config.email_message1;
		const email_message2 = this.config.email_message2;
		const email_message3 = this.config.email_message3;
		const email_message4 = this.config.email_message4;
		const email_message = [email_message1, email_message2, email_message3, email_message4];
		this.log.debug("email_message:" + email_message);

		const email_drop1 = this.config.email_drop1;
		const email_drop2 = this.config.email_drop2;
		const email_drop3 = this.config.email_drop3;
		const email_drop4 = this.config.email_drop4;
		const email_drop = [email_drop1, email_drop2, email_drop3, email_drop4];
		this.log.debug("email_drop:" + email_drop);

		const pushover_active1 = this.config.pushover_active1;
		const pushover_active2 = this.config.pushover_active2;
		const pushover_active3 = this.config.pushover_active3;
		const pushover_active4 = this.config.pushover_active4;
		const pushover_active = [pushover_active1, pushover_active2, pushover_active3, pushover_active4];
		this.log.debug("pushover_active:" + pushover_active);

		const pushover_drop1 = this.config.pushover_drop1;
		const pushover_drop2 = this.config.pushover_drop2;
		const pushover_drop3 = this.config.pushover_drop3;
		const pushover_drop4 = this.config.pushover_drop4;
		const pushover_drop = [pushover_drop1, pushover_drop2, pushover_drop3, pushover_drop4];
		this.log.debug("pushover_drop:" + pushover_drop);

		const pushover_title1 = this.config.pushover_title1;
		const pushover_title2 = this.config.pushover_title2;
		const pushover_title3 = this.config.pushover_title3;
		const pushover_title4 = this.config.pushover_title4;
		const pushover_title = [pushover_title1, pushover_title2, pushover_title3, pushover_title4];
		this.log.debug("pushover_title:" + pushover_title);

		const pushover_message1 = this.config.pushover_message1;
		const pushover_message2 = this.config.pushover_message2;
		const pushover_message3 = this.config.pushover_message3;
		const pushover_message4 = this.config.pushover_message4;
		const pushover_message = [pushover_message1, pushover_message2, pushover_message3, pushover_message4];
		this.log.debug("pushover_message:" + pushover_message);

		const pushover_prio1 = this.config.pushover_prio1;
		const pushover_prio2 = this.config.pushover_prio2;
		const pushover_prio3 = this.config.pushover_prio3;
		const pushover_prio4 = this.config.pushover_prio4;
		const pushover_prio = [pushover_prio1, pushover_prio2, pushover_prio3, pushover_prio4];
		this.log.debug("pushover_prio:" + pushover_prio);

		const telegram_text1 = this.config.telegram_text1;
		const telegram_text2 = this.config.telegram_text2;
		const telegram_text3 = this.config.telegram_text3;
		const telegram_text4 = this.config.telegram_text4;
		const telegram_text = [telegram_text1, telegram_text2, telegram_text3, telegram_text4];
		this.log.debug("telegram_text:" + telegram_text);

		const test_massage = this.config.test_massage;
		this.log.debug("test_massage:" + test_massage);

		const telegram_active1 = this.config.telegram_active1;
		const telegram_active2 = this.config.telegram_active2;
		const telegram_active3 = this.config.telegram_active3;
		const telegram_active4 = this.config.telegram_active4;
		const telegram_active = [telegram_active1, telegram_active2, telegram_active3, telegram_active4];
		this.log.debug("telegram_active:" + telegram_active);

		const telegram_drop1 = this.config.telegram_drop1;
		const telegram_drop2 = this.config.telegram_drop2;
		const telegram_drop3 = this.config.telegram_drop3;
		const telegram_drop4 = this.config.telegram_drop4;
		const telegram_drop = [telegram_drop1, telegram_drop2, telegram_drop3, telegram_drop4];
		this.log.debug("telegram_drop:" + telegram_drop);

		const telegram_user1 = this.config.telegram_user1;
		const telegram_user2 = this.config.telegram_user2;
		const telegram_user3 = this.config.telegram_user3;
		const telegram_user4 = this.config.telegram_user4;
		const telegram_user = [telegram_user1, telegram_user2, telegram_user3, telegram_user4];
		this.log.debug("telegram_user: :" + telegram_user);

		const link = this.config.linkdata;
		this.log.debug("link: :" + link);
		this.log.debug("apikey: :" + apikey);

		if (location_active1) {
			if (!link || !apikey[0] || !lat[0] || !lon[0]) {
				this.log.error("Please check your config. Linkdata, API-key and location missing for location 1");
			} else {
				urls[0] = link + '?key=' + apikey[0] + '&lat=' + lat[0] + '&lng=' + lon[0];
			}

			this.log.debug("link0: :" + urls[0]);
		}
		if (location_active2) {
			if (!link || !apikey[0] || !lat[0] || !lon[0]) {
				this.log.error("Please check your config. Linkdata, API-key and location missing for location 2");
			} else {
				urls[1] = link + '?key=' + apikey[1] + '&lat=' + lat[1] + '&lng=' + lon[1];
			}
			this.log.debug("link1: " + urls[1]);
		}
		if (location_active3) {
			if (!link || !apikey[0] || !lat[0] || !lon[0]) {
				this.log.error("Please check your config. Linkdata, API-key and location missing for location 3");
			} else {
				urls[2] = link + '?key=' + apikey[2] + '&lat=' + lat[2] + '&lng=' + lon[2];
			}
			this.log.debug("link2: " + urls[2]);
		}
		if (location_active4) {
			if (!link || !apikey[0] || !lat[0] || !lon[0]) {
				this.log.error("Please check your config. Linkdata, API-key and location missing for location 4");
			} else {
				urls[3] = link + '?key=' + apikey[3] + '&lat=' + lat[3] + '&lng=' + lon[3];
			}
			this.log.debug("link3: " + urls[3]);
		}

		for (let url_read_index = 0; url_read_index < 5; url_read_index++) {

			//this.log.debug("ThisUrl: :" + thisUrl);
			if (location_active[url_read_index] && urls[url_read_index]) {
				this.log.debug("location_active[url_read_index]: " + location_active[url_read_index]);
				try {
					const response = await axios({
						method: 'get',
						//	baseURL: 'https://data.sensor.community/airrohr/v1/sensor/',
						url: urls[url_read_index],
						timeout: 5000
						//responseType: 'json'
					});
					this.log.debug("axios done");
					res = response.data.result;

					this.log.info("response.data.result: " + JSON.stringify(response.data.result));
					this.log.info("response.data: " + JSON.stringify(response.data));

					const res_data = response.data;
					const data_message = res_data.message;
					const data_code = res_data.code;

					this.log.debug("data_code: " + data_code);
					this.log.debug("location_active:" + url_read_index + " : " + location_active[url_read_index]);

					await this.setStateAsync(url_read_index + '.code', {val: data_code, ack: true});

					if (data_code === 200 && location_active[url_read_index]) {

						data_callsLeft = res_data.callsLeft;
						data_callsDailyLimit = res_data.callsDailyLimit;

						data_requestdate = res.requestDate;
						data_forecastid = res.forecastId;
						data_forecasttext = res.forecastText;
						data_forecastcity = res.forecastCity;
						data_forecastdate = res.forecastDate;
						data_callsResetInSeconds = res_data.callsResetInSeconds;

						await this.setStateAsync(url_read_index + '.requestDate', {val: data_requestdate, ack: true});
						await this.setStateAsync(url_read_index + '.forecastId', {val: data_forecastid, ack: true});
						await this.setStateAsync(url_read_index + '.forecastText', {val: data_forecasttext, ack: true});
						await this.setStateAsync(url_read_index + '.forecastCity', {val: data_forecastcity, ack: true});
						await this.setStateAsync(url_read_index + '.forecastDate', {val: data_forecastdate, ack: true});

						await this.setStateAsync(url_read_index + '.message', {
							val: JSON.stringify(data_message),
							ack: true
						});
						await this.setStateAsync(url_read_index + '.callsLeft', {val: data_callsLeft, ack: true});
						await this.setStateAsync(url_read_index + '.callsDailyLimit', {
							val: data_callsDailyLimit,
							ack: true
						});
						await this.setStateAsync(url_read_index + '.callsResetInSeconds', {
							val: data_callsResetInSeconds,
							ack: true
						});
						await this.setStateAsync(url_read_index + '.location_name', {
							val: location_name[url_read_index],
							ack: true
						});

						if (mail_active[url_read_index] && (data_forecasttext === 'Eis!' || test_massage)) {

							this.log.debug(url_read_index + ".send mail");
							const x = this.textslice(email_subject[url_read_index], data_forecastdate);   // Function is called, return value will end up in x
							const y = this.textslice(email_message[url_read_index], data_forecastdate);   // Function is called, return value will end up in x

							email_subject[url_read_index] = x;
							email_message[url_read_index] = y;
							this.sendTo(email_drop[url_read_index], {
								from: email_from[url_read_index],
								to: email_to[url_read_index], // comma separated multiple recipients.
								subject: email_subject[url_read_index],
								text: email_message[url_read_index]
							});
						}

						if (pushover_active[url_read_index] && (data_forecasttext === 'Eis!' || test_massage)) {
							this.log.debug("pushover_message:" + pushover_message[url_read_index]);

							const x = this.textslice(pushover_message[url_read_index], data_forecastdate);   // Function is called, return value will end up in x
							const y = this.textslice(pushover_title[url_read_index], data_forecastdate);   // Function is called, return value will end up in x

							pushover_message[url_read_index] = x;
							pushover_title[url_read_index] = y;

							this.sendTo(pushover_drop[url_read_index], {
								message: pushover_message[url_read_index],
								title: pushover_title[url_read_index],
								priority: parseInt(pushover_prio[url_read_index])
							});
						}

						if (telegram_active[url_read_index] && (data_forecasttext === 'Eis!' || test_massage)) {
							this.log.debug("telegram_text:" + telegram_text[url_read_index]);

							const x = this.textslice(telegram_text[url_read_index], data_forecastdate);   // Function is called, return value will end up in x

							telegram_text[url_read_index] = x;

							this.sendTo(telegram_drop[url_read_index], {
								user: telegram_user[url_read_index],
								text: telegram_text[url_read_index],
							});

						}

					} else if (data_code === 300) {
						this.log.error(url_read_index + ".missing latitude and longitude");

						this.errorcases(url_read_index, data_message, location_name[url_read_index]);

					} else if (data_code === 400) {

						this.log.error(url_read_index + ".api-key is missing");

						this.errorcases(url_read_index, data_message, location_name[url_read_index]);

					} else if (data_code === 401) {

						this.log.error(url_read_index + ".invalid api-key");

						this.errorcases(url_read_index, data_message, location_name[url_read_index]);

					} else if (data_code === 402) {

						this.log.error(url_read_index + ".daily call limit reached");

						this.errorcases(url_read_index, data_message, location_name[url_read_index]);
					}
				} catch (e) {
					this.log.error(url_read_index + ".error:" + e);
				}
			}
		}
	}

	async errorcases(c,f,e) {
		var d = new Date();
		var dd = d.getUTCDate();
		var mm = d.getUTCMonth() + 1;
		var yy= d.getUTCFullYear();
		var h = d.getHours();
		var m = d.getMinutes();
		var uhrzeit =  (h <= 9 ? '0' + h : h ) + ':' +  (m <= 9 ? '0' + m : m);
		var datum = yy + '-' + (mm <= 9 ? '0' + mm : mm ) + '-' +  (dd <= 9 ? '0' + dd : dd);


		await this.setStateAsync(c + '.message', {val: JSON.stringify(f), ack: true});
		await this.setStateAsync(c + '.requestDate', {val: datum + ' ' + uhrzeit, ack: true});
		await this.setStateAsync(c + '.forecastId', {val: 0, ack: true});
		await this.setStateAsync(c + '.forecastText', {val: '0', ack: true});
		await this.setStateAsync(c + '.forecastCity', {val: '0', ack: true});
		await this.setStateAsync(c + '.forecastDate', {val: datum + ' ' + uhrzeit, ack: true});
		await this.setStateAsync(c + '.callsLeft', {val: 0, ack: true});
		await this.setStateAsync(c + '.callsDailyLimit', {val: 0, ack: true});
		await this.setStateAsync(c + '.callsResetInSeconds', {val: 0, ack: true});
		await this.setStateAsync(c + '.location_name', {val: e, ack: true});
	}

	async textslice(a,b) {

		let result1 = a.indexOf('+datum');
		let result2 = a.indexOf('+date');

		if (result1 !== -1 ){
			let text1 = a.slice(0, result1 );
			let text2 = a.slice(result1 + 6, a.length);
			a=(text1 + b + ' ' + text2);
		} else if(result2 !== -1){
			let text1 = a.slice(0, result2 );
			let text2 = a.slice(result2 + 6, a.length);
			a =(text1 + b + ' ' + text2);
		}
		return a;
	}

	async create_delete_state (){

		let location_active1 = true;
		let location_active2 = this.config.location_active2;
		let location_active3 = this.config.location_active3;
		let location_active4 = this.config.location_active4;
		let location_active = [location_active1,location_active2,location_active3,location_active4];

		for (let create_index = 0; create_index < 5; create_index++) {
			if (location_active[create_index]) {
				await this.setObjectNotExistsAsync(create_index + '.requestDate', {
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
				await this.setObjectNotExistsAsync(create_index+'.forecastId', {
					type: 'state',
					common: {
						name: 'forecastId',
						type: 'number',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.forecastText', {
					type: 'state',
					common: {
						name: 'forecastText',
						type: 'string',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.forecastCity', {
					type: 'state',
					common: {
						name: 'forecastCity',
						type: 'string',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.forecastDate', {
					type: 'state',
					common: {
						name: 'forecastDate',
						type: 'string',
						role: 'value.time',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.message', {
					type: 'state',
					common: {
						name: 'message',
						type: 'string',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.code', {
					type: 'state',
					common: {
						name: 'code',
						type: 'number',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.callsLeft', {
					type: 'state',
					common: {
						name: 'callsLeft',
						type: 'number',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.callsDailyLimit', {
					type: 'state',
					common: {
						name: 'callsDailyLimit',
						type: 'number',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.callsResetInSeconds', {
					type: 'state',
					common: {
						name: 'callsResetInSeconds',
						type: 'number',
						role: 'value',
						unit: 's',
						read: true,
						write: false
					},
					native: {}
				});
				await this.setObjectNotExistsAsync(create_index+'.location_name', {
					type: 'state',
					common: {
						name: 'location_name',
						type: 'string',
						role: 'value',
						read: true,
						write: false
					},
					native: {}
				});

			} else {
				await this.delObjectAsync(create_index + '.requestDate');
				await this.delObjectAsync(create_index + '.forecastId');
				await this.delObjectAsync(create_index + '.forecastText');
				await this.delObjectAsync(create_index + '.forecastCity');
				await this.delObjectAsync(create_index + '.forecastDate');
				await this.delObjectAsync(create_index + '.message');
				await this.delObjectAsync(create_index + '.code');
				await this.delObjectAsync(create_index + '.callsLeft');
				await this.delObjectAsync(create_index + '.callsDailyLimit');
				await this.delObjectAsync(create_index + '.callsResetInSeconds');
				await this.delObjectAsync(create_index + '.location_name');
			}
		}
	}


	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// clearTimeout(timeout2);.
			// clearInterval(interval1);
			callback();
		} catch (e) {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	/*onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}*/
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Iceroad(options);
} else {
	// otherwise start the instance directly
	new Iceroad();
}
