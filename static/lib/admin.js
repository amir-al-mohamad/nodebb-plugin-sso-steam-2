'use strict';

define('admin/plugins/sso-steam', ['settings', 'alerts'], function (Settings, alerts) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('sso-steam', $('.sso-steam-settings'));

		$('#save').on('click', function () {
			Settings.save('sso-steam', $('.sso-steam-settings'), function () {
				alerts.alert({
					type: 'success',
					alert_id: 'sso-steam-saved',
					title: '[[sso-steam:admin.alert.save-success-title]]',
					message: '[[sso-steam:admin.alert.save-success]]',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});
	};

	return ACP;
});
