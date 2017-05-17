/*
*   Elite Launcher's Main File
*   Author: Elite Bronze's Development Team
*/

const electron        = require('electron');
const app             = electron.app;
const BrowserWindow   = electron.BrowserWindow;
const Menu            = electron.Menu;
const path            = require('path');
const url             = require('url');

let mainWindow;

function createWindow()
{
	mainWindow = new BrowserWindow({
		width: 800, 
		height: 600, 
		title: "Elite Launcher", 
		frame: false, 
		transparent: false,
		resizable: false, 
		icon: __dirname + '/icon.png'
	});

	mainWindow.loadURL(url.format(
	{
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));

	mainWindow.on('closed', function()
	{
		mainWindow = null;
	});
}

app.on('ready', createWindow);

app.on('window-all-closed', function()
{
	if (process.platform !== 'darwin')
	{
		app.quit();
	}
});

app.on('activate', function()
{
	if (mainWindow === null)
	{
		createWindow();
	}
});

require('./launcher.elite.js');