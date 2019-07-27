const http = require( 'http' );
const https = require( 'https' );
const net = require( 'net' );
const httpUtils = require( '../http-utils' );
const CertFactory = require( '../cert/certFactory' );
const ntInterfaces =  require( '../networkInterfaces' );

const httpPort = 8081;
const certFactory = new CertFactory( '.naio-certs' );

const httpsCtxServersByHost = {};

function accept( fullHost, req, finalRes ) {
    console.log( 'accept', req.method, req.url );

    if ( fullHost && typeof req.headers[ 'Range' ] === "undefined" ) {
        httpsCtxServersByHost[ fullHost ] = true;
    }

    const ntInterface = ntInterfaces.getRandomInterface();

    const options = {
        method: req.method,
        headers: getHeaders( req.headers ),
        localAddress: ntInterface.address,
    };

    const proxyRes = proxyResponse.bind( null, ntInterface, finalRes );

    let request;
    if ( fullHost ) {
        const { host, port } = httpUtils.getHostPort( fullHost, 443 );

        request = https.request({
            port, host,
            path: req.url,
            ...options
        }, proxyRes );
    } else {
        console.log( 'http request', req.url );
        request = http.request( req.url, options, proxyRes );
    }
    request.end();
}

function getHeaders( reqHeaders ) {
    const headers = {};
    for ( let name in reqHeaders ) {
        if ( reqHeaders.hasOwnProperty( name ) && !/^proxy\-/i.test( name ) ) {
            headers[ name ] = reqHeaders[ name ];
        }
    }
    return headers;
}

function proxyResponse( ntInterface, finalRes, res ) {
    finalRes.writeHead( res.statusCode, getHeaders( res.headers ) );
    httpUtils.pipeData( res, finalRes ).then( bufferSize => {
        ntInterface.downloaded += bufferSize;
    })
}

function onHttpConnect( req, socket, head ) {
    console.log( `HTTP Connect for ${req.url}` );

    getHostPort( req.url )
        .then( ( { host, port } ) => {
            transferRequest( host, port, socket, head );
        });
}

function transferRequest( host, port, socket, head ) {
    if ( head && head.length ) {
        socket.write( head );
    }

    socket.write( 'HTTP/1.1 200 OK\r\n' );
    socket.write( '\r\n' );

    socket.once( 'data', data => {
        socket.pause();

        // pipe data to https server
        const conn = net.connect({
            port, // tcp
            host,
            allowHalfOpen: true
        }, () => {
            conn.on('finish', () => {
                socket.destroy();
            });

            socket.on('close', () => {
                conn.end();
            });

            const connectKey = conn.localPort + ':' + conn.remotePort;

            socket.pipe( conn );
            conn.pipe( socket );
            socket.emit( 'data', data );

            conn.on( 'end', function () {
               // console.log( 'conn end', connectKey );
            } );

            return socket.resume();
        });

        // conn.on('error', function(err) {  });
        // socket.on('error', function(err) {  });
    } );
}

async function getHostPort( fullHost ) {
    const { host, port } = httpUtils.getHostPort( fullHost, 443 );
    const rootCert = await certFactory.getRootCert();

    return new Promise( ( resolve, reject ) => {
        const httpsServerCtx = httpsCtxServersByHost[ fullHost ];
        if ( httpsServerCtx === true ) {
            resolve( { host, port } );
        } else if ( httpsServerCtx ) {
            resolve( httpsServerCtx );
        } else {
            certFactory.generateForHosts( rootCert, host ).then( ca => {
                const httpsServer = https.createServer({
                    key: ca.privateKey,
                    cert: ca.cert,
                    hosts: [ host ]
                }, accept.bind( null, fullHost ) );

                httpsServer.listen( 0, () => {
                    const def = httpsCtxServersByHost[ fullHost ] = {
                        host: 'localhost',
                        port: httpsServer.address().port
                    };
                    resolve( def );
                });
            });
        }
    });
}

/*
    Init HTTP server
 */
const httpServer = http.createServer( accept.bind( null, null ) );
httpServer.on( 'connect', onHttpConnect );
httpServer.listen( httpPort );

/*
    TODO
    Think about Web socket & web socket ssl
    const wssServ = WebSocket.Server( { server: httpsServer } );
    wssServ.on( 'connection', ( ws, req ) => { .. } );
 */