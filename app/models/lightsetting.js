var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var LightsettingSchema   = new Schema({
    color: String,
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    calculated: {
      type: Number,
      default: 0
    },
    rank: String,
    date: {
      type: Date,
      default: Date.now
    }
});

module.exports = mongoose.model('Lightsetting', LightsettingSchema);
