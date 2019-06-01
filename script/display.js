Vue.component('multimessage', {
    template: '#multimessage-template',
    props: {
      messages: {
        type: Array,
        required: true 
      },
      phase: {
        type: Number,
        required: false,
        default: 0
      },
      field: {
        type: String,
        required: false,
        default: null
      },
      maxLength:{
        type: Number,
        required: false,
        default: 80
      }
    },
    computed: {
      message: function() {
        if (this.msgs.length > 0) {
          return this.msgs[parseInt(this.phase) % this.msgs.length];
        }
        else {
          return "";
        }
      },
      msgs: function() {
        var m = [];
        // add messages from messages prop
        if (this.field) {
          for (var i = 0; i < this.messages.length; i++) {
            if (typeof this.messages[i] === 'string' || this.messages[i] instanceof String) {
              if (this.messages[i] != "") {
                m.push(this.messages[i]);
              } 
            }
            else if (this.messages[i] != undefined) {
               m.push(this.messages[i][this.field]);
            }
          }
        }
        else {
          m = this.messages;
        }
        return m;
      }
    }
})