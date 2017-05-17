/*
*	Elite Launcher's Misc File
*	Elite Bronze's Development Team
*/


/* ======== */
/*  IMPORTS */
/* ======== */
const electron					= require("electron");
const fs						= require("fs");
const request					= require("request");
const DecompressZip				= require("decompress-zip");
const DownloadManager			= require("electron-download-manager");
const Store						= require('./store.js');
var path						= require("path");

/* ======== */
/*  DEFINES */
/* ======== */
const BrowserWindow				= electron.BrowserWindow;
const app						= electron.app;
const dialog					= electron.dialog;
var debug						= true;
var unzipper					= null;
const store						= new Store(
{
	configName: 'ver',
	defaults: {
    	gameVersion: 1
	}
});

/* ===== */
/*  URLS */
/* ===== */
var eliteWebsite				= "http://localhost.org";
var gUpdateUrl					= eliteWebsite + "/launcher/gamePatches";
var gGetVersionUrl				= eliteWebsite + "/launcher/gameVersion.json";

/* ============ */
/*  DIRECTORIES */
/* ============ */
var gDir						= "./";
var gCacheDir					= "./WDB";
var gUpdatesDir					= "./updates";

/* ================ */
/*  VERSION CONTROL */
/* ================ */
var gVersion 					= 1;
var gServerVersion 				= null;

/* ====== BOOT ====== */
function boot()
{
	DownloadManager.register({downloadFolder: gUpdatesDir});
	deleteCacheDir();
	if (!fs.existsSync((electron.app || electron.remote.app).getPath('userData') + '/ver.json'))
	{
		store.set('gameVersion', 1);
	}
	gVersion = store.get('gameVersion');
	hasGameUpdates();
}
/* ====== ==== ====== */

/* ====== AUTO-UPDATER [GAME] ====== */
function hasGameUpdates()
{
	request.get(gGetVersionUrl, function (error, response, body)
	{
		if (!error && response.statusCode == 200)
		{
			var data		= JSON.parse(body);
			gServerVersion	= data.version;

			if (gVersion != gServerVersion && gServerVersion > gVersion)
			{
				if (debug) console.log('Starting game patchs download...');
				getGameUpdates();
				store.set('gameVersion', gServerVersion);
				return;
			}

			if (debug) console.log('Hey ho, lets go!');
		}
		else
		{
			if (debug) console.log('An strange error happened, whoops!');
			dialog.showErrorBox('Elite Updater', 'Ocorreu um erro ao tentar verificar as atualizações');
			app.quit();
		}
	});
}

function getGameUpdates()
{
	var patches = [];
	for (patchId = gVersion + 1; patchId <= gServerVersion; patchId++)
	{
		if (debug) console.log('Adding patch(s) to the download queue...');
		patches.push(gUpdateUrl + "/patch-" + patchId + ".zip");
	}

	DownloadManager.bulkDownload({
	    urls: patches
	}, function(error, finished, errors)
	{
	    if (error)
	    {
	    	if (debug) console.log('An error occurred while we tried to download the update(s)');
	    	store.set('gameVersion', gVersion);
	        dialog.showErrorBox('Elite Updater', 'Ocorreu um erro ao tentar baixar a(s) atualização(ões), tente novamente.');
	        app.quit();
	        return;
	    }

	    if (debug) console.log('Ok, download(s) finished.');
	    unzipGameUpdates();
	});
}

function unzipGameUpdates()
{
	fs.readdir(gUpdatesDir, function(err, filenames)
	{
		if (err)
		{
			onError(err);
			return;
		}
		filenames.forEach(function(filename)
		{
			if (path.extname(filename) == '.zip')
			{
				unzipper = new DecompressZip(gUpdatesDir + '/' + filename);

				unzipper.extract({
				    path: gDir
				});

				unzipper.on('error', function (err)
				{
				    if (debug) console.log('Caught an error while we tried to unzip a patch file.');
				    store.set('gameVersion', gVersion);
				    dialog.showErrorBox('Elite Updater', 'Houve um erro ao tentar descompactar um arquivo de patch, tente novamente.');
				    app.quit();
				    return;
				});
				 
				unzipper.on('extract', function (log)
				{
				    if (debug) console.log('Finished extracting');
				    deleteGameUpdates(filename);
				});
				 
				unzipper.on('progress', function (fileIndex, fileCount)
				{
				    if (debug) console.log('Extracted file ' + (fileIndex + 1) + ' of ' + fileCount + ' (' + filename + ')');
				});
			}
		});
	});
}

function deleteGameUpdates(patch)
{
	if (debug) console.log('Deleting ' + patch);
	fs.unlinkSync(gUpdatesDir + '/' + patch);
}

function deleteCacheDir()
{
	if (fs.existsSync(gCacheDir))
	{
		if (debug) console.log('Deleting cache directory');
		fs.unlinkSync(gCacheDir);
	}
}
/* ====== =================== ====== */

boot();