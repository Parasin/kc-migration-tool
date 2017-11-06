const config    = require( './config' ),
      mongoose  = require( 'mongoose' ),
      Catalog   = require( './models/catalog' ),
      _         = require( 'underscore' ),
      Sequelize = require( 'sequelize' ),
      sequelize = new Sequelize( config.mysqlDB, config.mysqlUsername, config.mysqlPassword, {
        host    : config.mysqlHost,
        dialect : 'mysql',
        logging : false,
        pool    : {
          max     : 30,
          min     : 0,
          acquire : 30000,
          idle    : 10000
        }
      } );

let start = new Date();

mongoose.Promise = global.Promise;
mongoose.connect( config.dbUrl, {
  useMongoClient : true,
  autoReconnect  : true
}, ( err ) => {
  if ( err ) {
    throw err;
  }
  console.log( 'Mongo Database connection successful' );

  sequelize
      .authenticate()
      .then( () => {
        console.log( 'MySQL Database connection successful' );


        return getTables();
      } )
      .then( ( resultSet ) => {
        const tables   = resultSet.tables;
        let promiseArr = [];

        for ( let i = 0; i < tables.length; i++ ) {
          if ( !invalidApplication( tables[ i ] ) ) {
            promiseArr.push( getTableData( tables[ i ] ) );
          }
        }

        return Promise.all( promiseArr );
      } )
      .then( ( resultSet ) => {
        let promiseArr  = [],
            record      = {},
            application = '';
        for ( let i = 0; i < resultSet.length; i++ ) {
          for ( let j = 0; j < resultSet[ i ].data[ 0 ].length; j++ ) {
            record      = resultSet[ i ].data[ 0 ][ j ];
            application = record.application;

            if ( !invalidApplication( application ) ) {
              promiseArr.push( saveToMongo( record ) );
            }
          }
        }

        return Promise.all( promiseArr );
      } )
      .then( ( resultSet ) => {
        let end = new Date() - start;

        if ( resultSet && resultSet.length ) {
          console.log( `Successfully migrated ${resultSet.length} documents in %dms`, end );
          process.exit();
        }
      } )
      .catch( ( err ) => {
        console.error( 'ERROR encountered while migrating:', err );
      } );
} );

function getTables () {
  return new Promise( ( resolve, reject ) => {
    sequelize
        .query( 'SHOW TABLES' )
        .then( results => {
          if ( !results ) {
            return reject( {
              success : false,
              tables  : null
            } );
          }

          let tables = [];
          for ( let i = 0; i < results[ 0 ].length; i++ ) {
            tables.push( results[ 0 ][ i ].Tables_in_Catalogue );
          }

          return resolve( {
            success : true,
            tables  : tables
          } );
        } );
  } );
}

function getTableData ( table ) {
  return new Promise( ( resolve, reject ) => {
    let query = `SELECT category, sub_category AS subCategory, issue, script, work_instruction AS workInstruction, doc_link AS docLink FROM ${table}`;
    sequelize
        .query( query )
        .then( data => {
          if ( !data ) {
            return reject( {
              success : false,
              data    : null
            } );
          }

          if ( data.length ) {
            for ( let i = 0; i < data.length; i++ ) {
              for ( let j = 0; j < data[ i ].length; j++ ) {
                data[ i ][ j ].application = table;
              }
            }
          }

          return resolve( {
            success : true,
            data    : data
          } );
        } );
  } );
}

function saveToMongo ( data ) {
  return new Promise( ( resolve, reject ) => {
    if ( data ) {
      let options = {
            upsert : true,
            new    : true
          },
          entry   = new Catalog( _.pick( data, 'application', 'category', 'subCategory', 'issue', 'script', 'workInstruction', 'docLink' ) );

      entry.save( ( err, doc ) => {
        if ( err ) {
          return reject( {
            success : false,
            error   : err
          } );
        }

        return resolve( {
          success : true,
          data    : doc
        } );
      } );
    }
  } );
}

function invalidApplication ( application ) {
  return application === 'AppVersion' || application === 'Help' || application === 'Mapping' || application === 'Response' || application === 'Test' || application === 'User';
}
