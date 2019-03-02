const express = require( 'express' );
const router = express.Router();
const validator = require( 'validator' );

const checkUsername = require( './../../models/check' ).checkUsername;
const checkEmail = require( './../../models/check' ).checkEmail;
const getAgreementVersion = require( './../../models/get' ).getAgreementVersion;
const createUser = require( './../../models/user/register' ).createUser;
const sendVerification = require( './../../models/user/register' ).sendVerification;
const validateProfilePicuture = require( './profilePicture' ).validateProfilePicuture;

module.exports.register_check_username = async function( req, res ) {
  const username = req.query.username;

  if ( typeof username != 'string' ) return res.send( { username: false } );

  return res.send( { username: await checkUsername( username ) } );
}

module.exports.register_check_email = async function( req, res ) {
  const email = req.query.email;

  if ( typeof email != 'string' ) return res.send( { email: false } );
  if ( !validator.isEmail( email ) ) return res.send( { email: false } );

  return res.send( { email: await checkEmail( email ) } );
}

module.exports.register = async function( req, res ) {
  // Fetches all the fields and their values
  const name = req.body.name;
  const username = req.body.username;
  const birthdate = req.body.birthdate;
  let email = req.body.email;
  const password = req.body.password;
  const gender = req.body.gender;

  // Checks that they all are strings, validatorjs only allows string (prevent errors)
  if ( typeof name != 'string' || typeof username != 'string' || typeof birthdate != 'string' || typeof email != 'string' || typeof password != 'string' || typeof gender != 'string' ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Only strings are accepted' } );

  // Normalises email according to validatorjs (see validatorjs documentation for rules)
  email = validator.normalizeEmail( email );

  // Validates name according to following rules: min 3 max 64 characters, min 2 names (e.g. Firstname Surname), only includes allowed characters (A-Z, a-z (including all diatrics), and - ' , . ')
  if ( !validator.isLength( name, { min: 3, max: 64 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Name length is either too long or too short', 'name': name } );
  if ( name.split( ' ' ).filter( n => n ).length < 2 ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Not enough names, at least first name and surname', 'name': name } );
  if ( !/^(([A-Za-zÀ-ÖØ-öø-ÿ\-\'\,\.\ ]+))$/.test( name ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Invalid characters in name', 'name': name } );

  // Validates username according to following rules: min 3 max 24 characters and only includes valid characters (A-Z, a-z, 0-9, and _)
  if ( !validator.isLength( username, { min: 3, max: 24 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Username length is either too long or too short', 'username': username } );
  if ( !/^(\w+)$/.test( username ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Invalid characters in username', 'username': username } );

  // Validates birthdate according to following rules: makes sure that the date is correct length, makes sure that is is a date (strict, i.e. that is is a valid date too. See validatorjs documentation), and that is actually is a birthdate (i.e. is before the current date).
  if ( !validator.isLength( birthdate, { min: 10, max: 12 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'birthdate length is either too long or too short', 'birthdate': birthdate } );
  if ( !validator.isISO8601( birthdate, { strict: true } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Malformed date for birthdate', 'birthdate': birthdate } );
  if ( !validator.isBefore( birthdate ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Back to the future?', 'birthdate': birthdate } );

  // Validates email according to following rules: min 6 max 255 characters (per email address definition) and is a valid email.
  if ( !validator.isLength( email, { min: 6, max: 255 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'email length is either too long or too short', 'email': email } );
  if ( !validator.isEmail( email ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Malformed email address', 'email': email } );

  // Validates password according to following rules: min 8 max 72 characters, includes at least one character and one number
  if ( !validator.isLength( password, { min: 8, max: 72 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Password length is either too long or too short', 'password': password } );
  if ( !/((.*[a-öA-Ö])(.*[0-9]))|((.*[0-9])(.*[a-öA-Ö]))/.test( password ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Password is not strong enough', 'password': password } );

  // Validates gender according to following rules: is an integer between 0 and 3.
  if ( !validator.isInt( gender, { min: 0, max: 3 } ) ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Gender is malformed', 'gender': gender } );

  const amountOfFiles = Object.keys( req.files ).length;
  let profilePicture = null;
  if ( amountOfFiles > 1 ) return res.status( 400 ).send( { "type": "fail", "reason": "too many files uploaded" } );
  if ( amountOfFiles ) {
    const profilePictureBuffer = req.files.profilePicture.data;
    const pictureValidation = await validateProfilePicuture( profilePictureBuffer, req.files.profilePicture.truncated );
    if ( pictureValidation.error ) return res.status( 400 ).send( { "type": "fail", "reason": pictureValidation.reason } );
    profilePicture = profilePictureBuffer;
  }

  // Validates that the username and email does not already exist and retrieves the current agreement version
  const [ usernameExists, emailExists, agreementVersion ] = await Promise.all( [
    checkUsername( username ),
    checkEmail( email ),
    getAgreementVersion(),
  ] );

  // Returns errors if the email/username already exists.
  if ( !emailExists ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Email address already exists', 'email': email } );
  if ( !usernameExists ) return res.status( 400 ).send( { 'type': 'fail', 'reason': 'Username already exists', 'username': username } );

  // Formats date so it can be parsed into a date object
  // The long name function parses the users name so that each initial letter is capatalised (exclues von, van, and etc). E.g. fiRsTNAme SuRNAme => Firstname Surname. May be removed later.
  const date = birthdate.split( '-' );
  const user = {
    'email': email,
    'password': password,
    'name': name.toLowerCase().split( ' ' ).filter( n => n ).map( ( s ) => ( [ 'von', 'van', 'de', 'der', 'los', 'ibn', 'd´' ].indexOf( s ) == -1 ) ? s.charAt( 0 ).toUpperCase() + s.substring( 1 ) : s ).join( ' ' ),
    'username': username,
    'usernameLower': username.toLowerCase(),
    'birthdate': new Date( Date.UTC( date[ 0 ], date[ 1 ] - 1, date[ 2 ] ) ),
    'gender': parseInt( gender ),
    'profilePicture': profilePicture,
    'resetPasswordToken': null,
    'resetPasswordExpires': null,
    'verified': true,
    'verificationToken': null,
  }

  //creates user
  await createUser( user );
  //await sendVerification(  user.email );

  return res.status( 201 ).send( { type: 'success', username: user.username, name: user.name, email: user.email } );
}