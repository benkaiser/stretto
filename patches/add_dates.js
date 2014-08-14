// this script is for if you are running a version <= e84e38c (2014-08-14)

// make a fake blank app object to attach the db to
var app = {};
// attach the db to the app
require(__dirname + '/../db.js')(app);
// update the dates
var now_milli = Date.now();
app.db.songs.update({}, { $set: { date_added: now_milli, date_modified: now_milli}}, {multi: true}, function(err, numReplaced){
  if(err){
    console.log(err);
  } else {
    console.log("Updated: " + numReplaced);
  }
});
