/**
 * this script patches the db for if you are running a version <= e84e38c (2014-08-14)
 * it will run automatically on every launch, but should have relatively
 * little overhead.
*/

module.exports = function(app){
  // update the dates
  var now_milli = Date.now();
  // fix the date_added values
  app.db.songs.update(
    {date_added: {$exists: false}},
    {$set: {date_added: now_milli}}, {multi: true}, function(err, numReplaced){
    if(err){
      console.log(err);
    } else {
      if(numReplaced > 0){
        console.log("Date added patch applied to: " + numReplaced + " rows");
      }
    }
  });
  // fix the date_modified values
  app.db.songs.update(
    {date_modified: {$exists: false}},
    {$set: {date_modified: now_milli}}, {multi: true}, function(err, numReplaced){
    if(err){
      console.log(err);
    } else {
      if(numReplaced > 0){
        console.log("Date modified patch applied to: " + numReplaced + " rows");
      }
    }
  });
};
