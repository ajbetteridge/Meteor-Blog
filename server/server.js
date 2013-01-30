// Publish statements
Meteor.publish('entries', function () {
    return Entries.find();
});

Meteor.startup(function () {
    /*
     * Fill in Testdata if you want to
     */
    // var i = 0,
    //     howMuch = 50;
    // for (; i < howMuch; i++) {
    //     Entries.insert({
    //         title: 'Title ' + i,
    //         slug: 'slug' + i,
    //         teaser: '',
    //         body: '<p>Lorem ipsum</p><h3>Nur so da als platzhalter</h3><p>Lorem ipsum dolor sit amet, erant gubergren ea has, numquam tibique ea nec. Usu cu justo meliore facilisi, eu nonumes pertinax volutpat cum. No omnesque inimicus efficiendi pri. Ut has timeam vidisse, id enim hinc quo, equidem fierent disputando te sea.Lorem ipsum dolor sit amet, erant gubergren ea has, numquam tibique ea nec. Usu cu justo meliore facilisi, eu nonumes pertinax volutpat cum. No omnesque inimicus efficiendi pri. Ut has timeam vidisse, id enim hinc quo, equidem fierent disputando te sea.</p>',
    //         ownerName: 'testUser',
    //         ownerId: 'notARealId',
    //         created: (new Date),
    //         createdNode: (new Date).toDateString().substr(4) + ' ' + (new Date).toTimeString().substr(0, 5)
    //     });
    // }
});