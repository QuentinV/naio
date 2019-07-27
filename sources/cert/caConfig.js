function randomSerialNumber() {
    // generate random 16 bytes hex string
    let sn = '';
    for ( let i = 0; i < 4; i++ ) {
        sn += ( '00000000' + Math.floor( Math.random() * Math.pow( 256, 4 ) )
            .toString( 16 ) )
            .slice( -8 );
    }
    return sn;
}

const certAttrs = [
    {
        name: 'commonName',
        value: 'NaioProxyCA'
    },
    {
        name: 'countryName',
        value: 'Worldwide'
    },
    /* {
         shortName: 'ST',
         value: 'Internet'
     },
     {
         name: 'localityName',
         value: 'Worldwide'
     },*/
    {
        name: 'organizationName',
        value: 'Naio Proxy'
    },
    {
        shortName: 'OU',
        value: 'CA'
    }
];

const certExtensions = [
    {
        name: 'basicConstraints',
        cA: true
    },
    {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    },
    {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    },
    {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    },
    {
        name: 'subjectKeyIdentifier'
    }
];

const serverAttrs = [
    {
        name: 'countryName',
        value: 'Worldwide'
    },
    /*{
        shortName: 'ST',
        value: 'Internet'
    },
    {
        name: 'localityName',
        value: 'Worldwide'
    },*/
    {
        name: 'organizationName',
        value: 'Naio Proxy'
    },
    {
        shortName: 'OU',
        value: 'Naio Proxy Server Certificate'
    }
];

const serverExtensions = [
    {
        name: 'basicConstraints',
        cA: false
    },
    {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: false,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: false,
        emailProtection: false,
        timeStamping: false
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: false,
        objsign: false,
        sslCA: false,
        emailCA: false,
        objCA: false
    }, {
        name: 'subjectKeyIdentifier'
    }
];


module.exports = {
    randomSerialNumber,
    certAttrs,
    certExtensions,
    serverAttrs,
    serverExtensions
};