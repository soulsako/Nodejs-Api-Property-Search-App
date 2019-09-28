//Set global enviroment variables
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION. SHUTTING DOWN...');
  process.exit(1);
});

//Start the application
const app = require('./app');

//Connect to database
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true, 
  useCreateIndex: true, 
  useFindAndModify: false
})
.then(() => {
  console.log('DB connection successful');
});


//Start the server on the following port
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION. SHUTTING DOWN...');
  server.close(() => {
    process.exit(1);
  })
});
