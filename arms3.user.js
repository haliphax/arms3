// ==UserScript==
// @name ARMS/3
// @author haliphax (https://roadha.us)
// @version 0.1
// @include http://*urbandead.com/map.cgi*
// @include http://map.dssrzs.org/*
// @exclude http://*urbandead.com/map.cgi?log*
// @namespace https://roadha.us
// @description Scouting utility for Urban Dead; report status of barricades/doors, generators, and zombies
// @require https://code.jquery.com/jquery-3.4.1.min.js
// @grant GM.xmlHttpRequest
// ==/UserScript==

var logEnabled = true;

//--- DO NOT EDIT BELOW THIS LINE ---//

var stylesheet = '\
	<style> \
		/* Base styles */ \
		.arms3 { display: block; font-size: 8pt; font-family: sans-serif; } \
		.arms3 > * { color: #fff; background-color: #000; padding: 1px; margin-right: 1px; border: 1px solid #fff; } \
		/* Freshness */ \
		.arms3.brandnew { opacity: 1; } \
		.arms3.new { opacity: .8; } \
		.arms3.fresh { opacity: .7; } \
		.arms3.stale { opacity: .6; } \
		.arms3.old { opacity: .5 } \
		.arms3.dead { opacity: .4 } \
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
	</style>';

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

	if (r.hasOwnProperty('ruin') && r.ruin != 0)
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
	if (document.location.host == 'map.dssrzs.org')
		dssrzs(data);
	else
		ud(data);
}

function dssrzs(data) {
	if ($('.map-container .map').length == 0)
		return;

	var currid = null;

	for (var k in data.chars) {
		currid = k;
		break;
	}

	var auth = {
		'X-ARMS3-Key': currid + ':' + data.chars[currid].key,
		'X-ARMS3-Version': GM.info.script.version
	};
	var tl = $('.map td:first .loc .p').text().replace(',', '-');
	var br = $('.map td:last .loc .p').text().replace(',', '-');

	GM.xmlHttpRequest({
		headers: auth,
		method: 'GET',
		url: data.chars[currid].url + '/report/' + tl + '/' + br,
		onload: function(d) {
			var intel = JSON.parse(d.responseText);

			if (logEnabled) {
				console.log('[ARMS/3] Intel:');
				console.log(intel);
			}

			$('body').append(stylesheet);

			for (var i = 0; i < intel.length; i++) {
				var html = displayData(intel[i]);
				var split = intel[i].coords.split('-');

				$(html).insertBefore($('#x' + split[0] + 'y' + split[1] + ' .loc .n'));
			}
		}
	});
}

function ud(data) {
	var currid = /\d+$/.exec($('td.cp .gt > a:first').attr('href'))[0];

	if (!(!!data.chars[currid])) {
		if (logEnabled) console.log('[ARMS/3] Character not configured');

		return;
	}
	else if ($('td.cp table.c').text().indexOf('asleep') >= 0) {
		if (logEnabled) console.log('[ARMS/3] Character is asleep');

		return;
	}

	if (logEnabled) console.log('[ARMS/3] Character: ' + currid);

	var now = new Date();
	var text = $('td.gp .gt').text();
	var auth = {
		'X-ARMS3-Key': currid + ':' + data.chars[currid].key,
		'X-ARMS3-Version': GM.info.script.version
	};
	var coords = $('input[name="homex"]').val() + '-' + $('input[name="homey"]').val();
	var reports = [];
	var report = {
		coords: coords,
		zeds: {}
	};
	var inside = (text.indexOf('You are inside') >= 0);
	var cades = /(quite|very|extremely)? ?(?:(loosely|lightly)|(strongly|heavily)) b|(?:wide)? (open)(?:s directly)|is (closed)/i.exec(text);

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

	var ruin = !!(/(?:been|fallen into) ruin|ransacked/.exec(text));

	if (ruin) {
		var $repair = $('.gp form[action$="map.cgi?repair"]');
		var cost = /\d+/.exec($repair.text());

		if (cost)
			report.ruin = Math.round(cost[0]);
		else if ($repair.length > 0)
			report.ruin = 1;
		else
			report.ruin = -1;
	}
	else
		report.ruin = 0;

	if (inside) {
		var genny = /generator has been set up here.\s*(?:It (?:(is out)|(only)|(is running low)))?/.exec(text);

		if (genny) {
			if (genny[1])
				report.genny = 'E';
			else if (genny[2])
				report.genny = 'VL';
			else if (genny[3])
				report.genny = 'L';
			else
				report.genny = 'F';
		}
	}
	else if (/Lights are on inside./.test(text))
		report.genny = '?';

	var zeds = /\d+/.exec($('td.cp table.c td > input').parent().find('span.fz').text());

	report.zeds[inside ? 'in' : 'out'] = zeds ? Math.round(zeds[0]) : 0;
	reports.push(report);

	// gather info (zeds, lights) from surrounding area
	$('table.c input[type="hidden"]').each(function () {
		var surr = { coords: $(this).val() };

		// building is lit
		if ($(this).closest('td').find('input.ml').length > 0)
			surr.genny = '?';

		if (!inside) {
			var zeds = /\d+/.exec($(this).closest('td').find('.fz').text());

			surr.zeds = { out: zeds ? Math.round(zeds[0]) : 0 };
		}

		reports.push(surr);
	});

	if (logEnabled) {
		console.log('[ARMS/3] Report:');
		console.log(reports);
	}

	GM.xmlHttpRequest({
		headers: auth,
		data: JSON.stringify(reports),
		method: 'POST',
		url: data.chars[currid].url + '/report',
		onload: function(d) {
			if (logEnabled) console.log('[ARMS/3] Report submitted');

			var intel = JSON.parse(d.responseText);

			if (logEnabled) {
				console.log('[ARMS/3] Intel:');
				console.log(intel);
			}

			$('body').append(stylesheet);

			for (var i = 0; i < intel.length; i++) {
				var html = displayData(intel[i], coords, inside);
				var $btn = $('td.cp table.c input[name="v"][value="' + intel[i].coords + '"]');

				if ($btn.length == 0)
					$(html).insertBefore($('td.cp table.c tr:nth-child(3) td:nth-child(2) input'));
				else
					$(html).insertBefore($btn);
			}
		}
	});
}
