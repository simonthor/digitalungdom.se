const express = require( 'express' );
const router = express.Router();
const validator = require( 'validator' );

const handleError = require( './../../../helpers/handleError' ).handleError;

const checkEmail = require( './../../../models/check' ).checkEmail;

router.post( '/register_check_email', async function( req, res ) {
  try {
    const email = req.body.email;
    if ( typeof email != 'string' ) return { email: false };
    if ( !validator.isEmail( email ) ) return { email: false };

    return res.send( { email: await checkEmail( db, email ) } );
  } catch ( e ) {
    handleError( e );
  }
} );

module.exports = router;