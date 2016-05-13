var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var VoteSchema   = new Schema({
    lightSetting: {
      type: Schema.Types.ObjectId,
      ref: 'Lightsetting'
    },
    type: String,
    currentUpvotes: {
      type: Number,
      default: 0
    },
    currentDownvotes: {
        type: Number,
        default: 0
    },
    currentCalculated: {
      type: Number,
      default: 0
    },
    currentTotalCalculated: {
      type: Number,
      default: 9999
    },
    currentTotalUpvotes: {
      type: Number,
      default: 9999
    },
    currentTotalDownvotes: {
      type: Number,
      default: 9999
    },
    participant: {
      type: Number,
      default: 9999
    },
    condition: String,
    postedOn: {
      type: Date,
      default: Date.now
    },
    color: String,
    rank: Number
});

module.exports = mongoose.model('Vote', VoteSchema);
