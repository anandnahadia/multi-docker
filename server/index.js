const keys = require('./keys');

//Express App Setup
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// postgress client setup
const  { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
  });
pgClient.on("connect", (client) => {
    console.log('....im.............');
    client
      .query("CREATE TABLE IF NOT EXISTS values (number INT)")
      .catch((err) => console.error(err));
      
  });
  
console.log('.....end.....');
//Redis Client setup
const redis = require("redis");
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

//Express Route Handlers

app.get('/',(req,res) => {
    res.send('Hi');
})

app.get('/values/all',async (req,res) => {
    console.log('..here....');
    const values = await pgClient.query('SELECT * from values');
    console.log('.............val.........',values);
    res.send(values.rows);
})

app.get('/values/current',async (req,res) => {
    redisClient.hgetall('values',(err,values) => {
        res.send(values);
    })
})

app.post('/values',async(req,res) => {
    const index = req.body.index;
    if(parseInt(index) > 40){
        return res.status(422).send('Index too high!');
    }
    redisClient.hset('values',index, 'Nothing yet!');
    redisPublisher.publish('insert',index);
    pgClient.query('insert into values(number) values ($1)',[index]);
    res.send({working: true});
})
app.listen(5000,err => {
    console.log('listening');
})