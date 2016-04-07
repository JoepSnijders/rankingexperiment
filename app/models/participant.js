var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ParticipantSchema   = new Schema({
    participant: {
      type: Number,
      default: 0
    },
    condition: {
        type: String,
        default: 'A'
    },
    connectedOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Participant', ParticipantSchema);
