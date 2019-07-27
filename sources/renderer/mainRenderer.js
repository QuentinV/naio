const os = require( 'os' );
const { ipcRenderer } = require('electron' );

window.addEventListener('DOMContentLoaded', () => {
    for (const versionType of ['chrome', 'electron', 'node']) {
        document.getElementById(`${versionType}-version`).innerText = process.versions[versionType]
    }
});

ipcRenderer.on('networkInterfaces', ( event, networkInterfaces ) => {
    let html = '';
    networkInterfaces.forEach( networkInterface => {
        html +=
            `<div class="interface">
                <div class="name">${networkInterface.address}</div>
                <ul>
                    <li>Data: <span class="attrs">${ networkInterface.downloaded }</span></li>    
                    <li>Speed: <span class="attrs">${ networkInterface.downloadSpeed }</span></li>    
                    <li>Max download speed: <span class="attrs">${ networkInterface.maxDownloadSpeed }</span></li>    
                    <li>Limit download speed: <span class="attrs">${ networkInterface.limitDownloadSpeed }</span></li>    
                    <li>Priority: <span class="attrs">${ networkInterface.priority }</span></li>    
                </ul>
            </div>`;
    });

    document.querySelector( "#interfaces" ).innerHTML = html;
});