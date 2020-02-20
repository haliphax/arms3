// ==UserScript==
// @name ARMS/3 configuration
// @author haliphax (https://roadha.us)
// @version 0.1
// @include http://*urbandead.com/map.cgi*
// @exclude http://*urbandead.com/map.cgi?log*
// @namespace https://roadha.us
// ==/UserScript==

var data = {
	configVersion: '0.1',
	chars: {
		'CharacterIdGoesHere': {
			url: 'http://url.for.arms3.server',
			key: 'SecretKeyGoesHere'
		}
	}
}

//--- DO NOT EDIT BELOW THIS LINE ---//

var el = document.createElement('input');

el.id = 'arms3';
el.type = 'hidden';
el.value = JSON.stringify(data);
document.body.appendChild(el);
