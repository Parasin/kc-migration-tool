const mongoose = require( 'mongoose' );

let catalogSchema = mongoose.Schema( {
  application: {
    type: String,
    required: true,
    index: true
  },

  category : {
    type      : String,
    required  : true,
    lowercase : true,
    index     : true
  },

  subCategory : {
    type     : String,
    required : true
  },

  issue : {
    type     : String,
    required : true
  },

  script: {
    type: String
  },

  workInstruction: {
    type: String
  },

  docLink: {
    type: String
  },

  timesSearched: {
    type: Number,
    default: 0
  },

  lastModified : {
    type    : Date,
    default : Date.now()
  }
} );

module.exports = mongoose.model( 'Catalog', catalogSchema );
