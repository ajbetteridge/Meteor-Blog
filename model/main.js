/*jslint node: true */
/*jslint nomen: true*/
/*global $, jQuery, Template, Meteor, Session, window, console, Accounts */

'use strict';

var Entries = new Meteor.Collection('entries');

Entries.allow({
    insert : function () {
        return false; // No inserts like that, use the methods defined below
    },
    update : function (userId, docs) {
        if (userId && docs[0].ownerId === userId) {
            return true;
        }
    },
    remove: function (userId, docs) {
        if (userId && docs[0].ownerId === userId) {
            return true;
        }
    }
});

function checkAdmin() {
    var user = Meteor.user();
    if (!("string" === typeof (user.username) && "admin" === user.username)) {
        throw new Meteor.Error(400, "Not logged in as admin");
    }
    return true;
}

Meteor.methods({
    'createNewEntry' : function (options) {
        var picture = 'object' === typeof options.pictureObject ? options.pictureObject : '';

        if ('string' === typeof options.title && 0 !== options.title.length
                && 'string' === typeof options.slug && 0 !== options.slug.length
                && 'string' === typeof options.teaser
                && 'string' === typeof options.body && 0 !== options.body.length
                && 'object' === typeof options.tags && 0 !== options.tags.length
                && ('string' === typeof options.created || ('object' === typeof options.created && 0 !== options.created.length))
                && 'string' === typeof options.createdNode && 0 !== options.createdNode.length
                && checkAdmin()) {

            return Entries.insert({
                title: options.title,
                slug: options.slug,
                teaser: options.teaser,
                body: options.body,
                overviewBody: options.overviewBody,
                tags: options.tags,
                picture: picture,
                ownerName: Meteor.user().username,
                ownerId: Meteor.userId(),
                created: options.created,
                createdNode: options.createdNode
            });
        }
    },
    'isAdmin' : function () {
        return checkAdmin();
    }
});