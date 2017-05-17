/*
*	Elite Launcher's Misc File
*	Author: Elite Bronze's Development Team
*/

// -------
// Defines
// -------
const electron					= require("electron");
const fs						= require("fs");
const request					= require("request");
const DecompressZip				= require("decompress-zip");
const {download}				= require("electron-dl");
var path						= require("path");
const BrowserWindow				= electron.BrowserWindow;
const app						= electron.app;
const dialog					= electron.dialog;
var debug						= true;
var unzipper					= null;

// ------------
// Update Links
// ------------
var gameUpdateUrl				= "http://localhost.org/launcher/gamePatches/";
var verifyGameVersionUrl		= "http://localhost.org/launcher/gameVersion.json";

// ---
// DIR
// ---
var gameDir						= "./";
var cacheDir					= "./cache";
var gameUpdatesDir				= "./updates";

// ---------------
// Version Control
// ---------------
var gameVersion					= 1;
var mostUpdatedGameVersion		= null;
var gameNeedsUpdate				= null;


/* ------ AUTO-UPDATER [GAME] ------ */
function verifyGameUpdates()
{
	updateGameVersionVar();

	request.get(verifyGameVersionUrl, function(error, response, body)
	{
		if (!error && response.statusCode == 200)
		{
			var json				= JSON.parse(body);
			mostUpdatedGameVersion	= json.version;

			if (gameVersion != mostUpdatedGameVersion && mostUpdatedGameVersion > gameVersion)
			{
				if (debug) console.log('Trying to start the game update...');

				eraseCache();

				getGameUpdates();

				setVerToJsonFile(mostUpdatedGameVersion);

				return;
			}

			if (debug) console.log("We're good to go :)");

		} else
		{
			if (debug) console.log('Hmm... An strange error has occurred, try again!');

			dialog.showErrorBox('Elite Updater', 'Ocorreu um erro ao tentar verificar as atualizações, tente novamente.');

			app.quit();
		}
	});
}

function getGameUpdates()
{
	for (patchId = gameVersion + 1; patchId <= mostUpdatedGameVersion; patchId++)
	{
		if (debug) console.log("Downloading patch version: " + patchId + "...");

		download(BrowserWindow.getFocusedWindow(), gameUpdateUrl + 'patch-' + patchId + '.zip')
		.then(decompressGameUpdates(patchId))
		.catch(function()
		{
			if (debug) console.log("Ops, an error occourred while we try to download the game patch. Try again later.");

			dialog.showErrorBox('Elite Updater', 'Ocorreu um erro ao tentar baixar as atualizações, tente novamente.');

			app.quit();
		});

		if (patchId == mostUpdatedGameVersion)
		{
			return;
		}
	}
}

function decompressGameUpdates(patchId)
{
	if (fs.existsSync(gameUpdatesDir + "/patch-" + patchId + ".zip"))
	{
		if (debug) console.log("Decompressing patch " + patchId + "...");

		unzipper = new DecompressZip(gameUpdatesDir + "/patch-" + patchId + ".zip");

		unzipper.extract({
			path: gameDir
		});

		unzipper.on('extract', function(log)
		{
			if (debug) console.log('Done', log);

			deleteGameUpdates(patchId);
		});

		unzipper.on('error', function(err)
		{
			if (debug) console.log('Caught an error', err);

			dialog.showErrorBox('Elite Updater', 'Ocorreu um erro ao tentar descompactar o patch-' + patchId + '.zip');

			app.quit();

			return;
		});
	} else
	{
		setTimeout(function() {
			decompressGameUpdates(patchId);
		}, 2 * 1000);
	}
}

function deleteGameUpdates(patchId)
{
	if (debug) console.log("Deleting patch " + patchId + "...");

	fs.unlinkSync(gameUpdatesDir + "/patch-" + patchId + ".zip");
}

function eraseCache()
{
	if (fs.existsSync(cacheDir))
	{
		if (debug) console.log("Deleting cache folder");

		fs.unlinkSync(cacheDir);
	}
}

function setVerToJsonFile(id)
{
	var fileName		= "./config.json";
	var file			= require(fileName);
	file.gameVersion	= id;
	this.gameVersion 	= id;

	fs.writeFile(fileName, JSON.stringify(file), function (err) {
		if (err) return console.log(err);
	});
}

function updateGameVersionVar()
{
	if (!fs.existsSync('./config.json'))
	{
		var fileName		= "./config.json";
		var file			= require(fileName);
		file.gameVersion	= 1;

		fs.writeFile(fileName, JSON.stringify(file), function (err) {
			if (err) return console.log(err);
		});
	}

	var cfg 			= require("./config.json");
	this.gameVersion 	= cfg.gameVersion;
}
/* ------ =================== ------ */

/*
* 	Starts verifying if the game version is equals that the web server says
* 	If it has any patch(s) to download, then downloads the patch(s)
* 	Last but not least, decompress files and make the game ready to play
*/
verifyGameUpdates();