'use strict';


class AMQPEmailData {
    constructor(name, type, file, to, subject, content) {
        this.name = name;
        this.type = type;
        this.published_at = new Date();
        this.file = file;
        this.to = to;
        this.subject = subject;
        this.content = content;
    }
}

module.exports = AMQPEmailData;