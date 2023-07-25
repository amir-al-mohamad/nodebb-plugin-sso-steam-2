'use strict';

(function (module) {
	const User = require.main.require('./src/user');
	const meta = require.main.require('./src/meta');
	const db = require.main.require('./src/database');
	const passport = require.main.require('passport');
	const passportSteam = require('passport-steam').Strategy;
	const nconf = require.main.require('nconf');
	const async = require.main.require('async');
	const winston = require.main.require('winston');

	const authenticationController = require.main.require('./src/controllers/authentication');

	const constants = Object.freeze({
		name: 'Steam',
		admin: {
			route: '/plugins/sso-steam',
			icon: 'fa-brands fa-steam',
		},
	});

	const Steam = {
		settings: {
			key: process.env.SSO_STEAM_KEY || undefined,
			disableRegistration: false,
			preventDeauth: false,
		},
	};

	Steam.init = function (data, callback) {
		const hostHelpers = require.main.require('./src/routes/helpers');

		hostHelpers.setupAdminPageRoute(data.router, '/admin/plugins/sso-steam', (_req, res) => {
			res.render('admin/plugins/sso-steam', {
				title: '[[sso-steam:admin.title]]',
				baseUrl: nconf.get('url'),
			});
		});

		
		meta.settings.get('sso-steam', (_, loadedSettings) => {
			if (loadedSettings.key) {
				Steam.settings.key = loadedSettings.key;
			}
			Steam.settings.disableRegistration = loadedSettings.disableRegistration === 'on';
			Steam.settings.preventDeauth = loadedSettings.preventDeauth === 'on';

			if (!Steam.settings.preventDeauth) {
				hostHelpers.setupPageRoute(data.router, '/deauth/steam', [data.middleware.requireUser], (req, res) => {
					res.render('plugins/sso-steam/deauth', {
						service: 'Steam',
					});
				});
				data.router.post('/deauth/steam', [data.middleware.requireUser, data.middleware.applyCSRF], (req, res, next) => {
					Steam.deleteUserData({
						uid: req.user.uid,
					}, (err) => {
						if (err) {
							return next(err);
						}
		
						res.redirect(`${nconf.get('relative_path')}/me/edit`);
					});
				});
			}

			callback();
		});
	};

	Steam.getStrategy = function (strategies, callback) {
		if (Steam.settings.key) {
			passport.use(new passportSteam({
				apiKey: Steam.settings.key,
				returnURL: `${nconf.get('url')}/auth/steam/callback`,
				realm: nconf.get('url'),
				passReqToCallback: true,
			}, ((req, _identifier, profile, done) => {
				if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
					// Save Steam-specific information to the user
					User.setUserField(req.user.uid, 'steamid', profile.id);
					db.setObjectField('steamid:uid', profile.id, req.user.uid);
					return done(null, req.user);
				}

				Steam.login(profile.id, profile.displayName, profile._json.avatarfull, (err, user) => {
					if (err) {
						return done(err);
					}

					authenticationController.onSuccessfulLogin(req, user.uid, (err) => {
						done(err, !err ? user : null);
					});
				});
			})));

			strategies.push({
				name: 'steam',
				url: '/auth/steam',
				callbackURL: '/auth/steam/callback',
				checkState: false,
				icon: constants.admin.icon,
				icons: {
					normal: 'fa-brands fa-steam',
					square: 'fa-brands fa-steam-square'
				},
				labels: {
					login: '[[sso-steam:sign-in-with-steam]]',
					register: '[[sso-steam:sign-up-with-steam]]'
				},
				color: '#66c0f4',
				scope: ''
			});
		}

		callback(null, strategies);
	};

	Steam.appendUserHashWhitelist = function (data, callback) {
		data.whitelist.push('steamid');
		setImmediate(callback, null, data);
	};

	Steam.getAssociation = function (data, callback) {
		User.getUserField(data.uid, 'steamid', (err, steamid) => {
			if (err) {
				return callback(err, data);
			}

			if (steamid) {
				data.associations.push({
					associated: true,
					url: `https://steamcommunity.com/profiles/${steamid}`,
					deauthUrl: Steam.settings.preventDeauth ? null : `${nconf.get('url')}/deauth/steam`,
					steamid: steamid,
					name: constants.name,
					icon: constants.admin.icon,
				});
			} else {
				data.associations.push({
					associated: false,
					url: `${nconf.get('url')}/auth/steam`,
					name: constants.name,
					icon: constants.admin.icon,
				});
			}

			callback(null, data);
		});
	};

	Steam.login = function (steamid, handle, picture, callback) {
		Steam.getUidBySteamId(steamid, (err, uid) => {
			if (err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing User
				callback(null, {
					uid: uid,
				});
			} else {
				// Abort user creation if registration via SSO is restricted
				if (Steam.settings.disableRegistration) {
					return callback(new Error('[[error:sso-registration-disabled, Steam]]'));
				}

				// New User
				User.create({ username: handle }, (err, uid) => {
					if (err) {
						return callback(err);
					}

					// Save steam-specific information to the user
					User.setUserField(uid, 'steamid', steamid);
					db.setObjectField('steamid:uid', steamid, uid);

					// Save their photo, if present
					if (picture) {
						User.setUserField(uid, 'uploadedpicture', picture);
						User.setUserField(uid, 'picture', picture);
					}

					callback(null, {
						uid: uid,
					});
				});
			}
		});
	};

	Steam.getUidBySteamId = function (steamid, callback) {
		db.getObjectField('steamid:uid', steamid, (err, uid) => {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
	};

	Steam.addMenuItem = function (custom_header, callback) {
		custom_header.authentication.push({
			route: constants.admin.route,
			icon: constants.admin.icon,
			name: constants.name,
		});

		callback(null, custom_header);
	};

	Steam.deleteUserData = function (data, callback) {
		const { uid } = data;

		async.waterfall([
			async.apply(User.getUserField, uid, 'steamid'),
			function (oAuthIdToDelete, next) {
				db.deleteObjectField('steamid:uid', oAuthIdToDelete, next);
			},
			function (next) {
				db.deleteObjectField(`user:${uid}`, 'steamid', next);
			},
		], (err) => {
			if (err) {
				winston.error(`[sso-steam] Could not remove SteamAuth data for uid ${uid}. Error: ${err}`);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = Steam;
}(module));
