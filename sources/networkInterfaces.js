const os = require( 'os' );

const allInterfaces = {};

function randomInt( max ) {
    return Math.floor(Math.random() * Math.floor(max) );
}

function networkInterfacesUp() {
    const allNetworkInterfaces = os.networkInterfaces();
    return Object.keys( allNetworkInterfaces )
                .flatMap( n => {
                    const list = allNetworkInterfaces[n].filter( v => v.family === "IPv4" && !v.internal );

                    return list.length ? list[0] : [];
                } )
                .map( v => {
                    const address = v.address;
                    if ( typeof allInterfaces[ address ] === "undefined" ) {
                        allInterfaces[ address ] = {
                            downloaded: 0,
                            downloadSpeed: 0,
                            maxDownloadSpeed: null,
                            limitDownloadSpeed: null,
                            priority: null,
                            address
                        };
                    }
                    return allInterfaces[ address ];
                });
}

function getRandomInterface() {
    const interfaces = networkInterfacesUp();
    return interfaces[ randomInt( interfaces.length ) ];
}

module.exports = {
    networkInterfacesUp,
    getRandomInterface
};