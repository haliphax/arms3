# Installing and configuring ARMS/3

## Prerequisites

In order to use the ARMS/3 client, you will need a browser or a browser
extension capable of running [UserScripts]. Here are a couple of
recommendations:

- Chrome
  - [TamperMonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Firefox
  - [GreaseMonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

## Installing the UserScripts

Now that you have a browser or an extension that can run UserScripts, it's time
to install the 2 UserScripts that ARMS/3 is composed of: the client and its
configuration.

### Client

The client is something you should mostly just enable and leave well enough
alone. There may be some debugging settings in there that you can work with in
order to troubleshoot issues, but otherwise it is meant to be a black box.

[Install the client UserScript](https://github.com/haliphax/arms3/raw/master/arms3.user.js)

### Configuration

The configuration is something you are _expected_ to modify once you've
downloaded it. This is where you will place your character ID number(s), the
URL endpoint of your ARMS3/ server(s), and your secret key(s). Note how all of
those are optionally plural--the ARMS/3 client can be configured to work with
multiple characters and multiple back-ends. _(Currently, however, the
integration with the DSSRZS map defaults to the first character listed in the
configuration. This will be improved in a future release.)_

[Install the configuration UserScript](https://github.com/haliphax/arms3/raw/master/arms3-config.user.js)

Once you've downloaded the UserScript for ARMS/3's configuration, there are a
couple of steps to take care of before you are done:

1. Disable automatic updating of the script. New releases of the configuration
   UserScript will be kept to an absolute minimum as to avoid interruption. If
   you need to update the configuration script, ARMS/3 will have a way to
   notify you.

2. Modify the script's contents and replace the placeholder values with your
   character and ARMS/3 service values. Optionally, if you have more than one
   character and back-end service to enter, extend the configuration's
   `chars` dictionary with additional keys and values. Remember to separate
   each character in the list with a comma! _(More in-depth instructions for
   this will be released eventually.)_

Here's what the guts of the configuration script (not counting the header and
anything below the "don't touch anything below this line" marker) should look
like before you modify it:

```javascript
var data = {
	configVersion: GM.info.script.version,
	chars: {
		'CharacterIdGoesHere': {
			url: 'http://url.for.arms3.server',
			key: 'SecretKeyGoesHere'
		}
	}
}
```

Here's what it should look like after, assuming your character ID was
**1234567**, your server was at **https://arms3.somewhere.xyz**, and your
secret key was **topsecret**:

```javascript
var data = {
	configVersion: GM.info.script.version,
	chars: {
		'1234567': {
			url: 'https://arms3.somewhere.xyz',
			key: 'topsecret'
		}
	}
}
```

If you had a second character, it would look something like this _(note the
comma between entries!)_:

```javascript
var data = {
	configVersion: GM.info.script.version,
	chars: {
		'1234567': {
			url: 'https://arms3.somewhere.xyz',
			key: 'topsecret'
		},
		'1234568': {
			url: 'https://another-arms3.somewhere-else.xyz',
			key: 'myotherpassword'
		}
	}
}
```

[UserScripts]: https://en.wikipedia.org/wiki/Userscript
