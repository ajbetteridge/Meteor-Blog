/**
 * Router & Startup Configuration
 * with Variables that can be changed
 */

Meteor.startup(function () {
    // Set 'Global' Session Variables
    Session.set('loadOnStartup', 8); // How many entries to load on overview site
    Session.set('autoload', true); // Autoload or click to load more entries
    Session.set('numberLoad', 4); // How many to load when clicked / autoloaded
    Session.set('animationToPost', 1000); // AnimationLength (in ms) for scrolling to the post

    // Default variables
    Session.set('currentlyLoaded', Session.get('loadOnStartup'));
    Session.set('pageStartup', false);
    Session.set('thereAreNoEntries', false);
    
    // Checking if there are any entries loaded after 5 seconds change to 'no entries'
    Meteor.setTimeout(function () {
        Session.set('thereAreNoEntries', 0 === Entries.find().fetch().length);
    }, 5000);
});

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
});

Meteor.subscribe('entries');

Meteor.Router.add({
    '/post/:slug' : function (slug) {
        Session.set('currentPostSlug', slug);
        return 'home';
    },
    '/add' : 'admin',
    '/' : function () {
        Session.set('currentPostSlug', '');
        return 'home';
    }
});

/**
 * Helper Functions
 */

function defineEntriesOnStartup() {
    var i = 0,
        definedNumber,
        allEntries = Entries.find({}, { sort: { created: -1 } }).fetch(),
        entriesLength = allEntries.length;

    // Check how many entries have to be loaded to display the post
    for (;i < entriesLength; i++) if (Session.get('currentPostSlug') === allEntries[i].slug) {
        definedNumber = i +  Session.get('loadOnStartup');
    }

    // Only change the Session variable if its bigger of course
    if (Session.get('currentlyLoaded') < definedNumber) {
        Session.set('currentlyLoaded', definedNumber);

    }
}

/**
 * Home Template (together with footer, blogBody and header)
 * for displaying the latest blog posts
 */

Template.home.rendered = function () {
    // First time loaded
    if (!Session.get('pageStartup')) {
        defineEntriesOnStartup();
        // If the offset is defined, to the animation
        if (null !== $('#' + Session.get('currentPostSlug')).offset()) {
            var offset = $('#' + Session.get('currentPostSlug')).offset(),
                offsetTop = offset.top;
            $('html, body').animate({
                scrollTop: offsetTop
            }, Session.get('animationToPost'));
            Session.set('pageStartup', true);
        }
    }

    // Add autoloading if true
    var handle = Meteor.setTimeout(function () {
        if (Session.get('autoload')) {
            $('#autoloader').waypoint(function (e, direction) {
                if ('down' === direction) {
                    Session.set('currentlyLoaded', Session.get('currentlyLoaded') + Session.get('numberLoad'));
                }
            }, {
                offset : '130%',
                horizontal : true
            });
        } else {
            // Add a + button if want to load more entries (Session variable)
            Session.set('loadMoreButton', true);
        }
    }, 100);
};

Template.blogBody.entry = function () {
    return Entries.find({}, { sort: { created: -1 }, limit: Session.get('currentlyLoaded') });
};

Template.blogBody.thereAreNoEntries = function () {
    return Session.get('thereAreNoEntries');
};

Template.blogBody.hasLoadMoreButton = function () {
    return Session.get('loadMoreButton');
};

Template.blogBody.events({
    'click #loadMore' : function (e) {
        Session.set('currentlyLoaded', Session.get('currentlyLoaded') + Session.get('numberLoad'));
        e.preventDefault();
    }
})

Template.blogBody.moreEntries = function () {
    var allEntries = Entries.find().fetch().length,
        currentlyLoaded = Session.get('currentlyLoaded');

    if (currentlyLoaded < allEntries) {
        return true;
    }
};

Template.blogBody.isAutoload = function() {
    return Session.get('autoload');
};

Template.entry.hasTeaser = function () {
    return 0 !== this.teaser.length;
};

Template.entry.isOwner = function () {
    return Meteor.userId() == this.ownerId;
};

Template.entry.clickedOn = function () {
    return this.slug === Session.get('currentPostSlug');
};

Template.entry.shortenedBody = function () {
    return this.teaser || this.overviewBody;
};

Template.entry.events({
    'click .editBody' : function (e) {
        var blogBody = $(e.toElement).parent().children('.blogBody'),
            bodyContent = blogBody.children('p').first().html(),
            bodyContent = $(blogBody).html();

        if (this.body === bodyContent) {
            $(blogBody).aloha();
            $(e.toElement).html('Save body');
        } else {
            $(blogBody).mahalo();
            Entries.update({  _id: this._id }, { $set: { body: bodyContent } });
            $(e.toElement).html('Edit body');
        }
    },
    'click h2.postTitle' : function (e) {
        // Add animation if it's focused on a page
        Session.set('currentPostSlug', this.slug);
        // Works just with timeout
        Meteor.setTimeout(function () {
            var reachedBottomOfPage = $(window).scrollTop() + $(window).height() === $(document).height(),
                offset = $('#' + Session.get('currentPostSlug')).offset()
                offsetTop = offset.top;

            if(!reachedBottomOfPage) {
                $('html, body').animate({
                    scrollTop: offsetTop
                }, Session.get('animationToPost'));
            }
        }, 10);
    },
    'click .removeEntry' : function (e) {
        var button = $(e.toElement);
        if (!button.hasClass('really')) {
            button.addClass('really btn-danger').html('Really remove it?');
            e.preventDefault();
        } else {
            Entries.remove({ _id: this._id });
        }
    }
});

/**
 * Admin Template for creating new blog posts
 */

Template.admin.events({
    'submit #adminForm' : function (e) {
        var title = $('#title').val(),
            slug = $('#slug').val(),
            teaser = $('#teaser').val() || '',
            body = $('#blogBody').html(),
            overviewBody = $('#blogBody').children().first().html(),
            created = new Date,
            createdNode = created.toDateString().substr(4) + ' ' + created.toTimeString().substr(0, 5);
        if (0 !== title.length && 0 !== slug.length && 0 !== body.length) {
            Meteor.call('createNewEntry', {
                title: title,
                slug: slug,
                teaser: teaser,
                body: body,
                overviewBody: overviewBody,
                created: created,
                createdNode: createdNode
            });

            $('#title').val('');
            $('#slug').val('');
            $('#teaser').val('');
            $('.editable').mahalo();
            $('#blogBody').html('<p>First paragraph for overview, Click me to edit.</p>');
        }

        e.preventDefault();
    },
    'click #blogBody' : function () {
        $('.editable').aloha();
    }
});
