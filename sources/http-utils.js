
/*function onData(data) {
    var current = Date.now();
    var timePassed = (current - lastCheck);
    lastCheck = current;
    allowance += timePassed * (rate / per);
    if (allowance > rate) allowance = rate;
    var length = data.length;
    if (allowance <= length) {
        var pauseTime = (length - allowance) / (rate / per);
        stream.pause();
        var dampenedPauseTime = pauseTime * 0.3 + prevPauseTime * 0.7;
        setTimeout(resume, dampenedPauseTime);
        prevPauseTime = dampenedPauseTime;
    }
    else prevPauseTime = 0;
    allowance -= length;
}*/


module.exports = {
    pipeData: ( resA, resB ) => {
        return new Promise( (resolve, reject) => {
            let dataSent = 0;
            resA
                .on( 'data', chunk => {
                    resB.write( chunk );
                    dataSent += ( chunk ? chunk.length : 0 );
                } )
                .on( 'end', ( err, chunk ) => {
                    resB.end( chunk || null );
                    resolve( dataSent );
                } )
        });
    },
    getBody: ( req ) => {
        return new Promise( ( resolve, reject) => {
            let body = [];
            req.on( 'data', ( chunk ) => {
                body.push( chunk );
            } ).on( 'end', () => {
                body = Buffer.concat( body ).toString();
                resolve( body );
            } );
        });
    },
    getHostPort: ( host, defaultPort ) => {
        let port = defaultPort;
        const result = /^([^:]+)(:([0-9]+))?$/.exec( host );
        if ( result != null ) {
            host = result[ 1 ];
            if ( result[ 2 ] != null ) {
                port = result[ 3 ];
            }
        }
        return { host, port: parseInt( port ) };
    }
};