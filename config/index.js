let config = {
  dbUrl         : process.env.DB_URL || 'mongodb://localhost:27017/KC',
  mysqlDB       : process.env.MYSQLDB || '',
  mysqlHost     : process.env.MYSQLHOST || 'localhost',
  mysqlPassword : process.env.MYSQLPW || '',
  mysqlUsername : process.env.MYSQLUSERNAME || '',
  port          : process.env.PORT || 3000
};

module.exports = config;
