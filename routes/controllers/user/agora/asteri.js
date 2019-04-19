/* global include */

const validateObjectID = require( 'mongodb' ).ObjectID.isValid;

const asteri = include( 'models/user/agora' ).asteri;

module.exports.asteri = async function ( req, res ) {
  // Fetches all the fields and their values
  const id = req.user;
  const postId = req.body.postId;

  if ( !validateObjectID( postId ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'postId is not an objectID', postId } );

  const status = await asteri( id, postId );

  if ( status.error ) {
    return res.send( {
      'type': 'fail',
      'reason': status.error,
      postId
    } );
  } else {
    return res.send( {
      'type': 'success',
      'action': status.action
    } );
  }
};