/**
 * this script patches the db for if you are running a version <= e84e38c (2014-08-14)
 * it will run automatically on every launch, but should have relatively
 * little overhead.
 *
 * The comment above applies to the date_added and date_modified components,
 * however the below components regarding the disc / track fixes are much
 * slower (requires reading all the tracks again).
 * This patch relatest to versions <= 367bdeb (2015-11-09)
*/
var async = require('async');
var MM = require('musicmetadata');
var fs = require('fs');

module.exports = function(app) {
  // update the dates
  var now_milli = Date.now();

  // fix the date_added values
  app.db.songs.update(
    {date_added: {$exists: false}},
    {$set: {date_added: now_milli}}, {multi: true}, function(err, numReplaced) {
    if (err) {
      console.log(err);
    } else {
      if (numReplaced > 0) {
        console.log('Date added patch applied to: ' + numReplaced + ' rows');
      }
    }
  });

  // fix the date_modified values
  app.db.songs.update(
    {date_modified: {$exists: false}},
    {$set: {date_modified: now_milli}}, {multi: true}, function(err, numReplaced) {
    if (err) {
      console.log(err);
    } else {
      if (numReplaced > 0) {
        console.log('Date modified patch applied to: ' + numReplaced + ' rows');
      }
    }
  });

  // fix the disc / track number fields
  app.db.songs.find(
    {
      $and: [
        {disc: {$exists: false}},
        {track: {$exists: false}},
      ],
    }, function(err, documents) {
      if (err) {
        console.log(err);
      } else if (documents.length !== 0) {
        // fix the disc and track numbers
        // use a queue to run 10 of them in parellel at a time
        var queue = async.queue(function eachDocument(document, callback) {
          var readStream = fs.createReadStream(app.get('config').music_dir + document.location);
          var parser = new MM(readStream, function(err, result) {
            // don't wait for nedb to commit, run the next one!
            callback();
            console.log('done one' + document._id);

            // force close the read stream to increase performance
            // I think musicmetadata must not close it off
            readStream.close();

            // update the attributes
            // the object containing attributes to update
            var setObj;

            if (!err) {
              setObj = {
                disc: (result.disk || {no:0}).no || 0,
                track: (result.track || {no:0}).no || 0,
              };
            } else {
              setObj = {
                disc: 0,
                track: 0,
              };
            }

            // commit the update to the database
            app.db.songs.update({ _id: document._id }, {$set: setObj});
          });
        }, 4);

        queue.drain = function onFinished(err) {
          if (err) {
            console.log('Failed to fix disc numbers and durations: ' + err);
          } else {
            console.log('All disc numbers and durations added');
          }
        };

        // load all the documents into the queue
        queue.push(documents);

        // notify the console
        console.log('Adding track and disc numbers for ' + documents.length  + ' tracks. This will re-read those tracks from the filesystem.');
      }
    });
};
