const express = require( 'express' );
const router = express.Router();
const validator = require( 'validator' );
const validateObjectID = require( 'mongodb' ).ObjectID.IsValid;

const ensureUserAuthenticated = require( './../../../helpers/ensureUserAuthentication' ).ensureUserAuthenticated;
const ensureNotUserAuthenticated = require( './../../../helpers/ensureUserAuthentication' ).ensureNotUserAuthenticated;

const getUserRolesById = require( './../../../models/get' ).getUserRolesById;
const getRoleIdByName = require( './../../../models/get' ).getRoleIdByName;

const antiAgorize = require( './../../../models/user/agora' ).antiAgorize;
const validateAuthorById = require( './../../../models/user/agora' ).validateAuthorById;

router.post( '/antiagorize', ensureUserAuthenticated, async function( req, res ) {
  // Fetches all the fields and their values
  const id = req.user;
  const postId = req.body.postId;

  if ( !validateObjectID( postId ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'postId is not an objectID', postId } );

  if ( await validateAuthorById( id, postId ) ) {
    await antiAgorize( postId );
  } else {
    // Failed
  }

} );

module.exports = router;