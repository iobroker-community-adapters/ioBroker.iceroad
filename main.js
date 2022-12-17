/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const { resolve } = require('path');
const axios = require('axios').default;

const urls = [];
//const thisUrl ='';

//define data
let res = [];
let data_callsLeft = [];
let data_callsDailyLimit = [];
let data_requestdate = [];
let data_forecastid = [];
let data_forecasttext = [];
let data_forecastcity = [];
let data_forecastdate = [];
let data_callsResetInSeconds = [];
let user_locationName = '';

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
		this.log.debug('start iceroad');

		this.locationData = [];
		this.apiUrl = 'https://api.eiswarnung.de/';

		if (this.config.tableLocation !== undefined && this.config.tableLocation.length !== 0) {
			await this.getTableData();
			await this.create_delete_state();
			await this.getwarning();
			this.stop();
		} else {
			this.log.warn('IceRoad - No Data found, please check your adapter configuration');
			this.stop();
		}
	}

	/**
	 *  get usersettings from table
	 */
	async getTableData() {
		const tableLocationData = this.config.tableLocation;

		for (const i in locationData) {
			this.locationData.push({
				id: i,
				active: locationData[i].locationActiveCheckbox,
				lat: locationData[i].latitude,
				lng: locationData[i].longitude,
				name: locationData[i].locationname,
				apiKey: locationData[i].apiKey,
				sendNotifiy: locationData[i].sendmessageCheckbox,
				url: `${this.apiUrl}?key=${locationData[i].apikey}&lat=${locationData[i].latitude}&lng=${locationData[i].longitude}`,
			});
		}
	}

	async getLastState(uri) {
		const lastStateOfForecastID = await this.getStateAsync(uri + '.forecastId');
		if (lastStateOfForecastID) {
			this.lastStateOfFID = lastStateOfForecastID.val;
		}
	}

	async fetchData(requestUrl) {
		return axios({
			method: 'get',
			baseURL: this.apiUrl,
			url: requestUrl,
			timeout: 3000,
			responseType: 'json',
		})
			.then((response) => {
				this.log.debug(`received ${response.status} response from "${requestUrl}" with content: ${JSON.stringify(response.data)}`);
				return response.data;
			})
			.catch((error) => {
				if (error.response) {
					// The request was made and the server responded with a status code
					this.log.warn(`received error ${error.response.status} response from "${requestUrl}" with content: ${JSON.stringify(error.response.data)}`);
				} else if (error.request) {
					// The request was made but no response was received
					// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// http.ClientRequest in node.js
					this.log.info(error.message);
				} else {
					// Something happened in setting up the request that triggered an Error
					this.log.error(error.message);
				}
			});
	}

	async getwarning() {
		this.log.debug(JSON.stringify(this.locationData));

		for (const i in this.locationData) {
			if (this.locationData[i].active) {
				let uri = this.locationData[i].id;
				const url = this.locationData[i].url;
				// get last State of datapoint to send messages only on state change
				await this.getLastState(uri);

				/*=============================================
				=          		get data			          =
				=============================================*/
				if (this.locationData[i].active && url) {
					try {
						const response = await this.fetchData(url);
						res = response.result;
						const res_data = response;
						const data_message = res_data.message;
						const data_code = res_data.code;

						this.log.debug('data_code: ' + data_code);
						// this.log.debug('location_active:' + uri + ' : ' + location_active[uri]);

						/*=============================================
						=          		 fill datapoints	          =
						=============================================*/
						await this.setStateAsync(uri + '.code', {
							val: data_code,
							ack: true,
						});

						if (data_code === 200 && this.locationData[i].active) {
							data_callsLeft = res_data.callsLeft;
							data_callsDailyLimit = res_data.callsDailyLimit;

							data_requestdate = res.requestDate;
							data_forecastid = res.forecastId;
							data_forecasttext = res.forecastText;
							data_forecastcity = res.forecastCity;
							data_forecastdate = res.forecastDate;
							data_callsResetInSeconds = res_data.callsResetInSeconds;

							if (this.locationData[i].name !== undefined) {
								user_locationName = this.locationData[i].name;
							} else {
								user_locationName = res.forecastCity;
							}

							await this.setStateAsync(uri + '.requestDate', {
								val: data_requestdate,
								ack: true,
							});
							await this.setStateAsync(uri + '.forecastId', {
								val: data_forecastid,
								ack: true,
							});
							await this.setStateAsync(uri + '.forecastText', {
								val: data_forecasttext,
								ack: true,
							});

							await this.setStateAsync(uri + '.forecastCity', {
								val: data_forecastcity,
								ack: true,
							});
							await this.setStateAsync(uri + '.forecastDate', {
								val: data_forecastdate,
								ack: true,
							});

							await this.setStateAsync(uri + '.message', {
								val: JSON.stringify(data_message),
								ack: true,
							});
							await this.setStateAsync(uri + '.callsLeft', {
								val: data_callsLeft,
								ack: true,
							});
							await this.setStateAsync(uri + '.callsDailyLimit', {
								val: data_callsDailyLimit,
								ack: true,
							});
							await this.setStateAsync(uri + '.callsResetInSeconds', {
								val: data_callsResetInSeconds,
								ack: true,
							});
							await this.setStateAsync(uri + '.location_name', {
								val: user_locationName,
								ack: true,
							});

							/*=============================================
							=            send notification		          =
							=============================================*/
							const lastStateChangeofID = await this.getStateAsync(uri + '.forecastId');
							let lastContact = Math.round((new Date() - new Date(lastStateChangeofID.lc)) / 1000 / 60 / 60);

							if (this.locationData[i].sendNotifiy) {
								if (data_forecastid !== this.lastStateOfFID) {
									switch (data_forecastid) {
										case 0: // No ICE
											await this.sendNotification(`Neuer Eisstatus für ${user_locationName}: ${data_forecasttext}`);
											break;

										case 1: // ICE
											await this.sendNotification(`Neuer Eisstatus für ${user_locationName}: ${data_forecasttext}`);
											break;

										case 2: // Maybe ICE
											await this.sendNotification(`Neuer Eisstatus für ${user_locationName}: ${data_forecasttext}`);
											break;
									}
								} else if (this.config.checkReminderMessage && lastContact > this.config.reminderHours) {
									switch (data_forecastid) {
										case 1: // ICE
											await this.sendNotification(`Eisstatus für ${user_locationName}: ${data_forecasttext}`);
											break;

										case 2: // Maybe ICE
											await this.sendNotification(`Eisstatus für ${user_locationName}: ${data_forecasttext}`);
											break;
									}
								}
							}
						} else if (data_code === 300) {
							this.log.error(uri + '.missing latitude and longitude');

							this.errorcases(uri, data_message, user_locationName);
						} else if (data_code === 400) {
							this.log.error(uri + '.api-key is missing');

							this.errorcases(uri, data_message, user_locationName);
						} else if (data_code === 401) {
							this.log.error(uri + '.invalid api-key');

							this.errorcases(uri, data_message, user_locationName);
						} else if (data_code === 402) {
							this.log.error(uri + '.daily call limit reached');

							this.errorcases(uri, data_message, user_locationName);
						}
					} catch (e) {
						this.log.error(uri + '.error:' + e);
					}
				}
			}
		}
	}

	/**
	 * @param {object} obj - State of datapoint
	 */
	async getInitValue(obj) {
		//state can be null or undefinded
		const foreignState = await this.getForeignStateAsync(obj);
		if (foreignState) return foreignState.val;
	}

	/**
	 * Notification service
	 * @param {string} text - Text which should be send
	 */
	async sendNotification(text) {
		// Pushover
		try {
			if (this.config.instancePushover) {
				//first check if instance is living
				const pushoverAliveState = await this.getInitValue('system.adapter.' + this.config.instancePushover + '.alive');

				if (!pushoverAliveState) {
					this.log.warn('Pushover instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instancePushover, 'send', {
						message: text,
						title: this.config.titlePushover,
						device: this.config.devicePushover,
						priority: this.config.prioPushover,
					});
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Pushover]', error);
		}

		// Telegram
		try {
			if (this.config.instanceTelegram) {
				//first check if instance is living
				const telegramAliveState = await this.getInitValue('system.adapter.' + this.config.instanceTelegram + '.alive');

				if (!telegramAliveState) {
					this.log.warn('Telegram instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceTelegram, 'send', {
						text: text,
						user: this.config.deviceTelegram,
						chatId: this.config.chatIdTelegram,
					});
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Telegram]', error);
		}

		// Whatsapp
		try {
			if (this.config.instanceWhatsapp) {
				//first check if instance is living
				const whatsappAliveState = await this.getInitValue('system.adapter.' + this.config.instanceWhatsapp + '.alive');

				if (!whatsappAliveState) {
					this.log.warn('Whatsapp instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceWhatsapp, 'send', {
						text: text,
						phone: this.config.phoneWhatsapp,
					});
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Whatsapp]', error);
		}

		// Email
		try {
			if (this.config.instanceEmail) {
				//first check if instance is living
				const eMailAliveState = await this.getInitValue('system.adapter.' + this.config.instanceEmail + '.alive');

				if (!eMailAliveState) {
					this.log.warn('eMail instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					await this.sendToAsync(this.config.instanceEmail, 'send', {
						sendTo: this.config.sendToEmail,
						text: text,
						subject: this.config.subjectEmail,
					});
				}
			}
		} catch (error) {
			this.log.error('[sendNotification eMail]', error);
		}

		// Jarvis Notification
		try {
			if (this.config.instanceJarvis) {
				//first check if instance is living
				const jarvisAliveState = await this.getInitValue('system.adapter.' + this.config.instanceJarvis + '.alive');

				if (!jarvisAliveState) {
					this.log.warn('Jarvis instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceJarvis}.addNotification`,
						'{"title":"' + this.config.titleJarvis + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')","message": ' + jsonText + ',"display": "drawer"}',
					);
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Jarvis]', error);
		}

		// Lovelace Notification
		try {
			if (this.config.instanceLovelace) {
				//first check if instance is living
				const lovelaceAliveState = await this.getInitValue('system.adapter.' + this.config.instanceLovelace + '.alive');

				if (!lovelaceAliveState) {
					this.log.warn('Lovelace instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					const jsonText = JSON.stringify(text);
					await this.setForeignStateAsync(
						`${this.config.instanceLovelace}.notifications.add`,
						'{"message":' + jsonText + ', "title":"' + this.config.titleLovelace + ' (' + this.formatDate(new Date(), 'DD.MM.YYYY - hh:mm:ss') + ')"}',
					);
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Lovelace]', error);
		}

		// Synochat Notification
		try {
			if (this.config.instanceSynochat) {
				//first check if instance is living
				const synochatAliveState = await this.getInitValue('system.adapter.' + this.config.instanceSynochat + '.alive');

				if (!synochatAliveState) {
					this.log.warn('Synochat instance is not running. Message could not be sent. Please check your instance configuration.');
				} else {
					if (this.config.channelSynochat !== undefined) {
						await this.setForeignStateAsync(`${this.config.instanceSynochat}.${this.config.channelSynochat}.message`, text);
					} else {
						this.log.warn('Synochat channel is not set. Message could not be sent. Please check your instance configuration.');
					}
				}
			}
		} catch (error) {
			this.log.error('[sendNotification Synochat]', error);
		}
	} // <-- End of sendNotification function

	async errorcases(c, f, e) {
		var d = new Date();
		var dd = d.getUTCDate();
		var mm = d.getUTCMonth() + 1;
		var yy = d.getUTCFullYear();
		var h = d.getHours();
		var m = d.getMinutes();
		var uhrzeit = (h <= 9 ? '0' + h : h) + ':' + (m <= 9 ? '0' + m : m);
		var datum = yy + '-' + (mm <= 9 ? '0' + mm : mm) + '-' + (dd <= 9 ? '0' + dd : dd);

		await this.setStateAsync(c + '.message', {
			val: JSON.stringify(f),
			ack: true,
		});
		await this.setStateAsync(c + '.requestDate', {
			val: datum + ' ' + uhrzeit,
			ack: true,
		});
		await this.setStateAsync(c + '.forecastId', { val: 0, ack: true });
		await this.setStateAsync(c + '.forecastText', { val: '0', ack: true });
		await this.setStateAsync(c + '.forecastCity', { val: '0', ack: true });
		await this.setStateAsync(c + '.forecastDate', {
			val: datum + ' ' + uhrzeit,
			ack: true,
		});
		await this.setStateAsync(c + '.callsLeft', { val: 0, ack: true });
		await this.setStateAsync(c + '.callsDailyLimit', { val: 0, ack: true });
		await this.setStateAsync(c + '.callsResetInSeconds', { val: 0, ack: true });
		await this.setStateAsync(c + '.location_name', { val: e, ack: true });
	}

	async create_delete_state() {
		const locationData = this.config.tableLocation;

		for (let create_index = 0; create_index < 10; create_index++) {
			if (locationData[create_index]) {
				await this.setObjectNotExistsAsync(create_index + '.requestDate', {
					type: 'state',
					common: {
						name: 'requestDate',
						type: 'string',
						role: 'value.time',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.forecastId', {
					type: 'state',
					common: {
						name: 'forecastId',
						type: 'number',
						role: 'value',
						read: true,
						write: false,
						states: {
							0: 'Kein Eis!',
							1: 'Eis!',
							2: 'Vielleicht Eis.',
						},
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.forecastText', {
					type: 'state',
					common: {
						name: 'forecastText',
						type: 'string',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.forecastCity', {
					type: 'state',
					common: {
						name: 'forecastCity',
						type: 'string',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.forecastDate', {
					type: 'state',
					common: {
						name: 'forecastDate',
						type: 'string',
						role: 'value.time',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.message', {
					type: 'state',
					common: {
						name: 'message',
						type: 'string',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.code', {
					type: 'state',
					common: {
						name: 'code',
						type: 'number',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.callsLeft', {
					type: 'state',
					common: {
						name: 'callsLeft',
						type: 'number',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.callsDailyLimit', {
					type: 'state',
					common: {
						name: 'callsDailyLimit',
						type: 'number',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.callsResetInSeconds', {
					type: 'state',
					common: {
						name: 'callsResetInSeconds',
						type: 'number',
						role: 'value',
						unit: 's',
						read: true,
						write: false,
					},
					native: {},
				});
				await this.setObjectNotExistsAsync(create_index + '.location_name', {
					type: 'state',
					common: {
						name: 'location_name',
						type: 'string',
						role: 'value',
						read: true,
						write: false,
					},
					native: {},
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
