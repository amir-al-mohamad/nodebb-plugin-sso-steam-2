# NodeBB Steam SSO

NodeBB Plugin that allows users to login/register via their Steam account.

## Installation

    npm install nodebb-plugin-sso-steam-2

## Configuration

1. Add domain via [API Manager](http://steamcommunity.com/dev/apikey)
2. You will be shown a screen with your **API key**
3. You can set these values in two ways:
    * Use environment variables
        * export `SSO_STEAM_KEY='API key'`
    * Use the form below (this behavior overrides environment variables)
4. Save and restart NodeBB via the ACP toolbar.
