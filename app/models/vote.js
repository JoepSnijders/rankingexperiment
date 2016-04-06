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
    postedOn: {
      type: Date,
      default: Date.now
    }
});

module.exports = mongoose.model('Vote', VoteSchema);
