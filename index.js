const {app, BrowserWindow} = require( 'electron' );
const path = require( 'path' );
const os = require( 'os' );

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow() {

    win = new BrowserWindow( {
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join( __dirname, 'sources/renderer/mainRenderer.js' )
        }
    } );

    win.loadFile( 'index.html' );

    // Open the DevTools.
    // win.webContents.openDevTools();

    win.on( 'closed', () => {
        win = null
    } );
}

app.on( 'ready', createWindow );

app.on( 'window-all-closed',  () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== 'darwin' ) {
        app.quit()
    }
} );

app.on( 'activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if ( win === null ) {
        createWindow();
    }
} );

require( './main' );

// Update UI
const { networkInterfacesUp } = require( './sources/networkInterfaces' );
setInterval( () => {
    win.webContents.send( 'networkInterfaces', networkInterfacesUp() );
}, 10000 );