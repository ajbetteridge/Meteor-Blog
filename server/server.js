/*jslint node: true */
/*jslint nomen: true*/
/*global $, _, jQuery, Template, Meteor, Session, window, console, Entries, Accounts */
'use strict';

// Publish statements
Meteor.publish('entries', function () {
    return Entries.find();
});

/*
 * When people create a user
 */

Accounts.onCreateUser(function (options, user) {
    user.profile = {};
    // Add anonymous tag and created to remove old anonymous accounts
    user.profile.anonymous = 1;
    user.profile.created = new Date();
    
    if ('admin' === user.username) {
        user.profile = options.profile;
    }

    return user;
});

Meteor.startup(function () {
    // Create admin if it isn't created already
    var adminIsAlreadyCreated = 0 < Meteor.users.find({ profile : {type : 'admin' } }).fetch().length;

    if (!adminIsAlreadyCreated) {
        Accounts.createUser({
            username    : 'admin',
            password    : 'admin',
            profile     : { type : 'admin' }
        });
    }

    /*
     * Fill in Testdata if you want to
     */
    // var i = 0,
    //     howMuch = 9;
    // for (; i < howMuch; i++) {
    //     Entries.insert({
    //         title: 'Title ' + i,
    //         slug: 'slug' + i,
    //         teaser: 'This is the teaser',
    //         overviewBody: '',
    //         tags: ['music', 'stuff', 'generated'],
    //         picture: '',
    //         body: '<p>Lorem ipsum</p><h3>Nur so da als platzhalter</h3><p>Lorem ipsum dolor sit amet, erant gubergren ea has, numquam tibique ea nec. Usu cu justo meliore facilisi, eu nonumes pertinax volutpat cum. No omnesque inimicus efficiendi pri. Ut has timeam vidisse, id enim hinc quo, equidem fierent disputando te sea.Lorem ipsum dolor sit amet, erant gubergren ea has, numquam tibique ea nec. Usu cu justo meliore facilisi, eu nonumes pertinax volutpat cum. No omnesque inimicus efficiendi pri. Ut has timeam vidisse, id enim hinc quo, equidem fierent disputando te sea.</p>',
    //         ownerName: 'testUser',
    //         ownerId: 'notARealId',
    //         created: (new Date('11.11.200' + i)),
    //         createdNode: (new Date('11.11.200' + i)).toDateString().substr(4) + ' ' + (new Date).toTimeString().substr(0, 5)
    //     });
    // }
});