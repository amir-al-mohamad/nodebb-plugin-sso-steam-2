<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
			<div class="alert alert-info">
				<strong>[[sso-steam:admin.quick-start.title]]</strong>
				<ol>
					<li>
						[[sso-steam:admin.quick-start.doamin]]
						<a href="http://steamcommunity.com/dev/apikey" target="_blank">[[sso-steam:admin.quick-start.manager]] <i class="fa fa-external-link"></i></a>
					</li>
					<li>[[sso-steam:admin.quick-start.screen]]</li>
					<li>[[sso-steam:admin.quick-start.values]]
						<ul>
							<li>[[sso-steam:admin.quick-start.environment]]
								<ul>
									<li><code>export SSO_STEAM_KEY='[[sso-steam:admin.api-key]]'</code></li>
								</ul>
							</li>
							<li>[[sso-steam:admin.quick-start.form]]</li>
						</ul>
					</li>
					<li>[[sso-steam:admin.quick-start.restart]]</li>
				</ol>
			</div>
			<form role="form" class="sso-steam-settings">
				<div class="mb-3">
					<label for="key">[[sso-steam:admin.api-key]]</label>
					<input type="text" name="key" title="[[sso-steam:admin.api-key]]" class="form-control input-lg" placeholder="[[sso-steam:admin.api-key]]">
				</div>
				<div class="form-check">
					<input type="checkbox" class="form-check-input" id="disableRegistration" name="disableRegistration" />
					<label for="disableRegistration" class="form-check-label">
						[[sso-steam:admin.sign-up-disable]]
					</label>
					<p class="form-text">
						[[sso-steam:admin.sign-up-disable-info]]
					</p>
					<input type="checkbox" class="form-check-input" id="preventDeauth" name="preventDeauth" />
					<label for="preventDeauth" class="form-check-label">
						[[sso-steam:admin.prevent-deauth]]
					</label>
					<p class="form-text">
						[[sso-steam:admin.prevent-deauth-info]]
					</p>
				</div>
			</form>
		</div>
	</div>
</div>
