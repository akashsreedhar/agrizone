let { MongoClient } = require('mongodb');
let state = {
    db: false
}
function connect(done) {
    try {
        const url = 'mongodb+srv://preetha:12345678910@cluster0.vcgujgy.mongodb.net/';
        const dbname = 'ecomerce';
        MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
            if (err) return done(err);
            state.db = client.db(dbname); 
            done();
        }); 
        //set 
    } catch (err) {
        console.error(err);
    } 
}
function get() {
    return state.db;
}
connect((err) => {
    if (err) {
        console.log('Database connection error : ' + err);
    } else {
        console.log('Database connected!');
    }
});
module.exports = {
    get
};