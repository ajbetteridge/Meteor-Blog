var Entries = new Meteor.Collection('entries');

Entries.allow({
    insert : function () {
        return false; // No inserts like that, use the methods defined below
    },
    update : function (userId, docs, fields, modifier) {
        if (userId && docs[0].ownerId === userId) {
            return true;
        }
    },
    remove: function(userId, docs) {
        if (userId && docs[0].ownerId === userId) {
            return true;
        }
    }
});

Meteor.methods({
    'createNewEntry' : function (options) {
        if ('string' === typeof options.title && 0 !== options.title.length
            && 'string' === typeof options.slug && 0 !== options.slug.length
            && 'string' === typeof options.teaser
            && 'string' === typeof options.body && 0 !== options.body.length
            && 'string' === typeof options.created || 'object' === typeof options.created && 0 !== options.created.length 
            && 'string' === typeof options.createdNode && 0 !== options.createdNode.length) {

            return Entries.insert({
                title: options.title,
                slug: options.slug,
                teaser: options.teaser,
                body: options.body,
                overviewBody: options.overviewBody,
                ownerName: Meteor.user().username,
                ownerId: Meteor.userId(),
                created: options.created,
                createdNode: options.createdNode
            });
        }
    }
})