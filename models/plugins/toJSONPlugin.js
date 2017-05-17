function toJSONPlugin(schema, options) {
    schema.set('toJSON', {
        transform: (doc, ret, options) => {
            ret.id = ret._id;
            ret.created_at = ret._id.getTimestamp();
            delete ret._id;
            delete ret.__v;
        }
    });
}

module.exports = toJSONPlugin;