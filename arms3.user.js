// ==UserScript==
// @name ARMS/3
// @author haliphax (https://roadha.us)
// @version 0.1
// @include http://*urbandead.com/map.cgi*
// @exclude http://*urbandead.com/map.cgi?log*
// @namespace https://roadha.us
// @description Scouting utility for Urban Dead; report status of barricades/doors, generators, and zombies
// @require https://code.jquery.com/jquery-3.4.1.min.js
// @grant GM.xmlHttpRequest
// ==/UserScript==

/* TODO
- if we're outside, scan all map cells for zombies
*/

var logEnabled = true;

//--- DO NOT EDIT BELOW THIS LINE ---//

var version = '0.1';

function checkForConfig() {
	var $arms3 = $('#arms3');

	if ($arms3.length === 1) {
		var data = JSON.parse($arms3.val());

		clearTimeout(t);
		$arms3.remove();
		arms3(data);
	}
}

var t = setInterval(checkForConfig, 10);

function displayData(r, coords, inside)
{
	if (logEnabled) console.log(r);

	var now = new Date();
	var when = new Date(r.when * 1000);
	var age = (now - when) / 3600000;
	var ageClass = 'brandnew';

	// style based on age of report (in hours)
	if (age >= 24)
		ageClass = 'dead';
	else if (age >= 12)
		ageClass = 'old';
	else if (age >= 6)
		ageClass = 'stale';
	else if (age >= 3)
		ageClass = 'fresh';
	else if (age >= 1)
		ageClass = 'new';

	var add = '<span class="arms3 ' + ageClass + '" title="Reported ' + when.toString() + '">';

	if (r.hasOwnProperty('cades'))
		add += '<span class="cades ' + r.cades + '">' + r.cades + '</span>';

	if (r.hasOwnProperty('genny'))
		add += '<span class="genny ' + r.genny + '">' + r.genny + '</span>';

	if (r.ruin != 0)
		add += '<span class="ruin">' + (r.ruin < 0 ? '?' : r.ruin) + '</span>';

	var showAll = (typeof inside == 'undefined');
	var zin = (r.zeds.hasOwnProperty('in') ? r.zeds.in : (showAll ? 0 : null));
	var zout = (r.zeds.hasOwnProperty('out') ? r.zeds.out : (showAll ? 0 : null));

	if (showAll
		|| r.coords !== coords
		|| (inside && zout !== null)
		|| (!inside && zin !== null))
	{
		var zedHtml = '';

		if (zin !== null && (showAll || r.coords !== coords || !inside))
			zedHtml += 'I:' + zin + ' ';

		if (zout !== null && (showAll || inside))
			zedHtml += 'O:' + zout;

		if (zedHtml.length > 0)
			add += '<span class="zeds">' + zedHtml + '</span>';
	}

	add += '</span>';

	return add;
}

function arms3(data) {
	var currid = /\d+$/.exec($('td.cp .gt > a:first').attr('href'))[0];

	if (!(!!data.chars[currid])) {
		if (logEnabled) console.log('[ARMS/3] Character not configured');

		return;
	}
	else if ($('td.cp table.c').text().indexOf('asleep') >= 0) {
		if (logEnabled) console.log('[ARMS/3] Character is asleep');

		return;
	}

	console.log('[ARMS/3] Character: ' + currid);
	$('body').append(' \
		<style> \
			/* Base styles */ \
			.arms3 { display: block; font-size: 8pt; font-family: sans-serif; } \
			.arms3 > * { color: #fff; background-color: #000; padding: .1em; margin-right: .2em; border: 1px solid #fff; } \
			/* Freshness */ \
			.arms3.brandnew { opacity: 1; } \
			.arms3.new { opacity: .8; } \
			.arms3.fresh { opacity: .6; } \
			.arms3.stale { opacity: .4; } \
			.arms3.old { opacity: .2 } \
			.arms3.dead { opacity: .1 } \
			/* Barricades */ \
			.arms3 .cades { background-color: #000; border-color: #fff; } \
			.arms3 .cades.Opn, .arms3 .cades.Cls { color: #f00; } \
			.arms3 .cades.LoB, .arms3 .cades.LiB { color: Orange; } \
			.arms3 .cades.SB, .arms3 .cades.QSB, .arms3 .cades.VSB { color: Yellow; } \
			.arms3 .cades.HB, .arms3 .cades.VHB, .arms3 .cades.EHB { color: #0f0; } \
			/* Ruin/repair */ \
			.arms3 .ruin { background-color: #c00; color: #fff; } \
			/* Generators */ \
			.arms3 .genny { border-style: dotted; } \
			.arms3 .genny.E { color: #f00; } \
			.arms3 .genny.VL { color: Orange; } \
			.arms3 .genny.L { color: Yellow; } \
			.arms3 .genny.F { color: #0f0; } \
			/* Zeds */ \
			.arms3 .zeds { background-color: #0c0; color: #000; } \
		</style> \
	');

	var now = new Date();
	var text = $('td.gp .gt').text();
	var auth = {
		'X-ARMS3-Key': currid + ':' + data.chars[currid].key,
		'X-ARMS3-Version': version
	};
	var coords = $('input[name="homex"]').val() + '-' + $('input[name="homey"]').val();
	var report = {
		coords: coords,
		zeds: {}
	};
	var inside = (text.indexOf('You are inside') >= 0);
	var cades = /(quite|very|extremely)? ?(?:(loosely|lightly)|(strongly|heavily)) b|wide (open)|is (closed)/i.exec(text);

	if (cades) {
		report.cades = '';

		// Q/V/E
		if (cades[1]) report.cades += cades[1][0].toUpperCase();
		// Lo/Li
		else if (cades[2]) report.cades += (cades[2] == 'loosely' ? 'Lo' : 'Li');

		// S/H
		if (cades[3]) report.cades += cades[3][0].toUpperCase();

		// door
		if (cades[4]) report.cades += 'Opn';
		else if (cades[5]) report.cades += 'Cls';

		if (report.cades.length < 3) report.cades += 'B';
	}

	var ruin = !!(/(?:been|fallen into) ruin/.exec(text));

	if (ruin) {
		var cost = /\d+/.exec($('.gp form[action$="map.cgi?repair"]').text());

		if (cost)
			report.ruin = Math.round(cost[0]);
		else
			report.ruin = -1;
	}
	else
		report.ruin = 0;

	var genny = /generator has been set up here.\s*(?:It (?:(is out)|(only)|(is running low)))?/.exec(text);

	if (genny) {
		if (genny[1]) report.genny = 'E';
		else if (genny[2]) report.genny = 'VL';
		else if (genny[3]) report.genny = 'L';
		else report.genny = 'F';
	}

	var zeds = 0;
	var hasZeds = /\d+/.exec($('td.cp table.c td > input').parent().find('span.fz').text());

	if (!!hasZeds) zeds = Math.round(hasZeds[0]);

	report.zeds[inside ? 'in' : 'out'] = zeds;

	if (logEnabled) console.log(report);

	GM.xmlHttpRequest({
		headers: auth,
		data: JSON.stringify(report),
		method: 'POST',
		url: data.chars[currid].url + '/report',
		onload: function(d) {
			if (logEnabled) console.log('[ARMS/3] Report submitted');

			var report = JSON.parse(d.responseText);

			for (var i = 0; i < report.length; i++) {
				var html = displayData(report[i], coords, inside);
				var $btn = $('td.cp table.c input[name="v"][value="' + report[i].coords + '"]');

				if ($btn.length == 0)
					$(html).insertBefore($('td.cp table.c tr:nth-child(3) td:nth-child(2) input'));
				else
					$(html).insertBefore($btn);
			}
		}
	});
}
