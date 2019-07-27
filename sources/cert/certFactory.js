const fs = require( 'fs' ).promises;
const fsc = require( 'fs' );
const path = require( 'path' );
const forge = require('node-forge');
const async = require( 'async' );
const caConfig = require( './caConfig' );

const pki = forge.pki;
const keysBits = 2048;

const certDirname = 'certs';
const keysDirname = 'keys';

const CertFactory = function( rootDir ) {
    this.rootDir = rootDir;
    this.certsDir = path.join( rootDir, certDirname );
    this.keysDir = path.join( rootDir, keysDirname );
};

CertFactory.prototype.getRootCert = async function() {
    if ( !fsc.existsSync( this.rootDir ) ) {
        await fs.mkdir( this.rootDir );
    }

    if ( !fsc.existsSync( this.certsDir ) ) {
        await fs.mkdir( this.certsDir );
    }

    if ( !fsc.existsSync( this.keysDir ) ) {
        await fs.mkdir( this.keysDir );
    }

    if ( !fsc.existsSync( path.join( this.certsDir, 'ca.pem' ) ) ) {
        return this.generateRoot();
    }
    return this.loadRoot();
};

CertFactory.prototype.generateRoot = async function() {
    return new Promise(   ( resolve, reject ) => {

        pki.rsa.generateKeyPair({ bits: keysBits }, ( err, keys ) => {
            if ( err ) {
                reject( err );
                return;
            }

            const cert = pki.createCertificate();

            // Keys
            cert.serialNumber = caConfig.randomSerialNumber();
            cert.publicKey = keys.publicKey;

            // Validity
            cert.validity.notBefore = new Date();
            cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

            // Attributes
            cert.setSubject( caConfig.certAttrs );
            cert.setIssuer( caConfig.certAttrs );
            cert.setExtensions( caConfig.certExtensions );

            cert.sign( keys.privateKey, forge.md.sha256.create() );

            async.parallel( [
                fs.writeFile.bind( null, path.join( this.certsDir, 'ca.pem' ), pki.certificateToPem( cert ) ),
                fs.writeFile.bind( null, path.join( this.keysDir, 'ca.private.key' ), pki.privateKeyToPem( keys.privateKey ) ),
                fs.writeFile.bind( null, path.join( this.keysDir, 'ca.public.key' ), pki.publicKeyToPem( keys.publicKey ) )
            ], () => {
                resolve( {
                    cert, keys
                } );
            } );
        });
    });
};

CertFactory.prototype.loadRoot = function() {

    return async.auto({
        certPEM: callback => {
            fsc.readFile( path.join( this.certsDir, 'ca.pem' ), 'utf-8', callback );
        },
        keyPrivatePEM: callback => {
            fsc.readFile( path.join( this.keysDir, 'ca.private.key' ), 'utf-8', callback );
        },
        keyPublicPEM: callback => {
            fsc.readFile( path.join( this.keysDir, 'ca.public.key' ), 'utf-8', callback );
        }
    } )
    .then( ( results ) => {
        return Promise.resolve( {
            cert:  pki.certificateFromPem( results.certPEM ),
            keys: {
                privateKey: pki.privateKeyFromPem( results.keyPrivatePEM ),
                publicKey: pki.publicKeyFromPem( results.keyPublicPEM )
            }
        } );
    });
};

CertFactory.prototype.generateForHosts = async function( root, hosts ) {
    if ( typeof ( hosts ) === "string" ) {
        hosts = [ hosts ];
    }

    const mainHost = hosts[0];

    const keys = pki.rsa.generateKeyPair( keysBits );

    const cert = pki.createCertificate();
    // keys
    cert.publicKey = keys.publicKey;
    cert.serialNumber = caConfig.randomSerialNumber();

    // Validity
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);

    // Config
    const attrsServer = caConfig.serverAttrs.slice(0);
    attrsServer.unshift({
        name: 'commonName',
        value: mainHost
    });

    cert.setSubject( attrsServer );
    cert.setIssuer( root.cert.issuer.attributes );
    cert.setExtensions( caConfig.serverExtensions.concat([{
        name: 'subjectAltName',
        altNames: hosts.map(function(host) {
            if (host.match(/^[\d\.]+$/)) {
                return {type: 7, ip: host};
            }
            return {type: 2, value: host};
        })
    }]));

    cert.sign( root.keys.privateKey, forge.md.sha256.create() );

    const certPem = pki.certificateToPem( cert );
    const keyPrivatePem = pki.privateKeyToPem( keys.privateKey );
    const keyPublicPem = pki.publicKeyToPem( keys.publicKey );

    const certFileName = this.certsDir + '/' + mainHost.replace( /\*/g, '_' ) + '.pem';
    fsc.writeFile( certFileName, certPem, error => {
        if ( error ) {
            console.error( "Failed to save certificate to disk in " + this.certsDir, error );
        }
    } );

    const privateKeyName = this.keysDir + '/' + mainHost.replace( /\*/g, '_' ) + '.key';
    fsc.writeFile( privateKeyName, keyPrivatePem, error => {
        if ( error ) {
            console.error( "Failed to save private key to disk in " + this.keysDir, error );
        }
    } );

    const publicKeyName = this.keysDir + '/' + mainHost.replace( /\*/g, '_' ) + '.public.key';
    fsc.writeFile( publicKeyName, keyPublicPem, error => {
        if ( error ) {
            console.error( "Failed to save public key to disk in " + this.keysDir, error );
        }
    } );

    // TODO Load file if existing otherwise generate certificates for specific hosts
    // const privateKeyValue = await fs.readFile( privateKeyName );
    // const certValue = await fs.readFile( certFileName );

    return Promise.resolve({
        cert: certPem,
        privateKey: keyPrivatePem
    });
};

module.exports = CertFactory;