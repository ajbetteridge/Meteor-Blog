/*jslint nomen: true*/
/*jslint browser: true*/
/*global $, _, jQuery, Template, Meteor, Session, window, console, Entries, Accounts, moment, filepicker */

(function () {
    'use strict';

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
        Session.set('animateElements', true); // Set animating entries to true

        // Default variables *DO NOT CHANGE*
        Session.set('currentlyLoaded', Session.get('loadOnStartup'));
        Session.set('pageStartup', false);
        Session.set('thereAreNoEntries', false);

        // Show that there are now entries available after one second
        Meteor.setTimeout(function () {
            $('#noEntriesAvaiable').removeClass('hide');
        }, 1000);

        // Adding awesome keybindings
        Meteor.Keybindings.add({
            'alt+a' : function () { Meteor.Router.to('/add'); },
            'alt+h' : function () { Meteor.Router.to('/'); }
        });
    });

    Accounts.ui.config({
        passwordSignupFields: 'USERNAME_ONLY'
    });

    Meteor.subscribe('entries');

    /**
     * Helper Functions
     */

    function defineEntriesOnStartup() {
        var i,
            definedNumber,
            allEntries = Entries.find({}, { sort: { created: -1 } }).fetch(),
            entriesLength = allEntries.length;

        // Check how many entries have to be loaded to display the post
        for (i = 0; i < entriesLength; i += 1) {
            if (Session.get('currentPostSlug') === allEntries[i].slug) {
                definedNumber = i +  Session.get('loadOnStartup');
            }
        }

        // Only change the Session variable if its bigger of course
        if (Session.get('currentlyLoaded') < definedNumber) {
            Session.set('currentlyLoaded', definedNumber);

        }
    }

    function generateArchive(entries) {
        var first = entries.pop(),
            last = entries.shift(),
            archiveArray = [],
            yearDifference = moment(last.created).format('YYYY') - moment(first.created).format('YYYY');

        if (0 > yearDifference) {
            // When the first and last entry are in the same month
            archiveArray.push(moment(first.created).format('MMM-DD-YYYY'));
        } else {
            entries.unshift(last);
            entries.push(first);
            _.each(entries, function (value) {
                var date = moment(value.created);
                archiveArray.push(date.format('MMM-DD-YYYY'));
            });

            // Duplicate free array
            archiveArray = _.uniq(archiveArray, true);
        }

        return archiveArray;
    }

    function resetSessionValues() {
        Session.set('archive', false);
        Session.set('tagFiltering', '');
        Session.set('currentPostSlug', '');
        Session.set('animateElements', false);
    }

    Meteor.Router.add({
        '/add' : function () {
            Session.set('pictureObject', {});
            Session.set('uploadedPictures', false);
            Session.set('couldntUploadedPictures', false);
            Session.set('succesfullyCreated', false);
            return 'admin';
        },
        '/post/:slug' : function (slug) {
            Session.set('animateElements', false);
            Session.set('currentPostSlug', slug);
            return 'home';
        },
        '/' : function () {
            resetSessionValues();
            $('#blogSearch').val('');
            Session.set('searchValue', '');
            return 'home';
        },
        '/tags/:tag' : function (tag) {
            resetSessionValues();
            Session.set('tagFiltering', tag.replace(/[\_]/g, ' '));
            return 'home';
        },
        '/archive/:date' : function (date) {
            resetSessionValues();
            Session.set('archive', date.split('-').join(' '));
            return 'home';
        }
    });

    /**
     * Home Template (together with footer, blogBody and header)
     * for displaying the latest blog posts
     */

    Template.home.rendered = function () {
        var offsetTop,
            offset,
            handle;
        // First time loaded
        if (!Session.get('pageStartup')) {
            defineEntriesOnStartup();
            // If the offset is defined, to the animation
            if (null !== $('#' + Session.get('currentPostSlug')).offset()) {
                offset = $('#' + Session.get('currentPostSlug')).offset();
                if (offset) {
                    offsetTop = offset.top;
                    $('html, body').animate({
                        scrollTop: offsetTop
                    }, Session.get('animationToPost'));
                    Session.set('pageStartup', true);
                }
            }
        }

        // Add autoloading if true
        handle = Meteor.setTimeout(function () {
            if (Session.get('autoload')) {
                $('#autoloader').waypoint(function (e, direction) {
                    if ('down' === direction) {
                        Session.set('animateElements', false);
                        Session.set('currentlyLoaded', Session.get('currentlyLoaded') + Session.get('numberLoad'));
                    }
                    e.preventDefault();
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

    Template.blogBody.helpers({
        entry: function () {
            var entries,
                selector = {},
                archive = Session.get('archive') ? new RegExp(Session.get('archive'), 'i') : false,
                tag = Session.get('tagFiltering'),
                search = Session.get('searchValue') ? new RegExp(Session.get('searchValue'), 'i') : false;

            // If searching for specific month
            if (archive) {
                selector = { createdNode: archive };
            } else if (tag) {
                // If searching for a tag
                selector = { tags: tag };
            }

            // If user is searching
            if (search) {
                selector = _.extend(selector, { $or: [
                    { title: search },
                    { body: search },
                    { teaser: search },
                    { createdNode: search },
                    { ownerName: search }
                ] });
            }

            // Check if there are any entries loaded and set session variable if not
            entries = Entries.find(selector, { sort: { created: -1 }, limit: Session.get('currentlyLoaded') });
            Session.set('thereAreNoEntries', 0 === entries.fetch().length);
            return entries;
        },
        thereAreNoEntries: function () {
            return Session.get('thereAreNoEntries');
        },
        hasLoadMoreButton: function () {
            return Session.get('loadMoreButton');
        },
        isAutoload: function () {
            return Session.get('autoload');
        },
        hasTeaser: function () {
            return 0 !== this.teaser.length;
        },
        tag: function () {
            var tagArray = [];
            _.each(Entries.find().fetch(), function (entry) {
                tagArray = _.union(tagArray, entry.tags);
            });

            return tagArray;
        },
        tagSlug: function () {
            return this.replace(/[\s]/g, '_');
        },
        tagIsActive: function () {
            return Session.get('tagFiltering') === this;
        },
        moreEntries: function () {
            var allEntries = Entries.find().fetch().length,
                currentlyLoaded = Session.get('currentlyLoaded');

            if (currentlyLoaded < allEntries) {
                return true;
            }
        },
        archiveMonth: function () {
            var returnArray = [],
                allEntries = Entries.find({}, { sort: { created: -1 } }).fetch();

            if (2 < allEntries.length) {
                returnArray = generateArchive(allEntries);
            }
            return returnArray;
        },
        animateClass: function () {
            return Session.get('animateElements') ? 'animateOneSec' : '';
        },
        nodeArchive: function () {
            return moment(this).format('MMMM YYYY');
        }
    });

    Template.blogBody.events({
        'click #loadMore' : function (e) {
            Session.set('animateElements', false);
            Session.set('currentlyLoaded', Session.get('currentlyLoaded') + Session.get('numberLoad'));
            e.preventDefault();
        },
        'keyup #blogSearch' : function (e) {
            Session.set('searchValue', $('#blogSearch').val());
            e.preventDefault();
        }
    });

    Template.entry.helpers({
        isOwner: function () {
            return Meteor.userId() === this.ownerId;
        },
        clickedOn: function () {
            return this.slug === Session.get('currentPostSlug');
        },
        shortenedBody: function () {
            return this.teaser || this.overviewBody;
        },
        hasPicture: function () {
            return 'undefined' !== typeof this.picture.url;
        },
        momentAgo: function () {
            return moment(this.created).fromNow();
        },
        animateClass: function () {
            return Session.get('animateElements') ? 'animateOneSec' : '';
        },
        tag: function () {
            return this.tags;
        },
        tagSlug: function () {
            return this.replace(/[\s]/g, '_');
        }
    });

    Template.entry.rendered = function () {
        Session.set('editBody', false);
    };

    Template.entry.events({
        'click .entryTag' : function () {
            $('html, body').animate({
                scrollTop: 0
            });
        },
        'click .editBody' : function (e) {
            var blogBody = $(e.toElement).parent().children('.blogBody'),
                bodyContent = $(blogBody).html();

            if (!Session.get('editBody')) {
                $(blogBody).hallo({
                    plugins: {
                        'halloformat': {},
                        'halloheadings': {},
                        'halloblock': {},
                        'hallolink' : {},
                        'halloimage': {},
                        'hallojustify': {},
                        'hallolists': {}
                    }
                });
                $(e.toElement).html('Save body');
                Session.set('editBody', true);
            } else {
                $(blogBody).hallo({editable: false});
                Entries.update({  _id: this._id }, { $set: { body: bodyContent } });
                Session.set('editBody', false);
            }
        },
        'click h2.postTitle' : function () {
            // Add animation if it's focused on a page
            Session.set('currentPostSlug', this.slug);
            // Works just with timeout
            Meteor.setTimeout(function () {
                var reachedBottomOfPage = $(window).scrollTop() + $(window).height() === $(document).height(),
                    offset = $('#' + Session.get('currentPostSlug')).offset(),
                    offsetTop = offset.top;

                if (!reachedBottomOfPage) {
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

    Template.admin.rendered = function () {
        $('#tags').select2({
            tags: ['music', 'house', 'edm'],
            tokenSeparators: [","]
        });
    };

    Template.admin.helpers({
        uploadedPictures: function () {
            return Session.get('uploadedPictures');
        },
        couldntUploadPictures: function () {
            return Session.get('couldntUploadPictures');
        },
        succesfullyCreated: function () {
            return Session.get('succesfullyCreated');
        },
        currentUserIsAdmin: function () {
            var user = Meteor.user();
            if (user) {
                if ('object' === typeof user.profile) {
                    return 'admin' === user.profile.type;
                }
            }
        }
    });

    Template.admin.events({
        'submit #adminForm' : function (e) {
            var title = $('#title').val(),
                slug = $('#slug').val().replace(/[\s]+/g, ''),
                teaser = $('#teaser').val() || '',
                body = $('#blogBody').html(),
                overviewBody = $('#blogBody').children().first().html(),
                tags = $("#tags").select2("val"),
                picture = Session.get('pictureObject');

            if (0 !== title.length && 0 !== slug.length && 0 !== body.length && 0 !== tags.length) {
                Meteor.call('isAdmin');
                Meteor.call('createNewEntry', {
                    title: title,
                    slug: slug,
                    teaser: teaser,
                    body: body,
                    overviewBody: overviewBody,
                    tags: tags,
                    pictureObject: picture
                });

                $('#title').val('');
                $('#slug').val('');
                $('#teaser').val('');
                Session.set('pictureObject', {});
                Session.set('succesfullyCreated', true);
                $('#blogBody').html('<p>First paragraph for overview, Click me to edit.</p>');
            }

            e.preventDefault();
        },
        'click #blogBody' : function () {
            $('.editable').hallo({
                plugins: {
                    'halloformat': {},
                    'halloheadings': { headers: [1, 2,3,4] },
                    'halloblock': {},
                    'halloimage': {},
                    'hallolink' : {},
                    'hallojustify': {},
                    'hallolists': {}
                }
            });
        },
        'click #uploadImage' : function (e) {
            // Set key
            filepicker.setKey('APD47djbReiqvQFGlAVckz');

            // Show popup
            filepicker.pick({
                mimetypes: ['image/*'],
                maxSize: 1920 * 1080
            }, function (FPFile) {
                Session.set('pictureObject', FPFile);
                Session.set('uploadedPictures', true);
            }, function (FPError) {
                // On fail
                console.log("File had error uploading!");
                console.log(FPError.toString());
                Session.set('couldntUploadPictures', true);
            });

            e.preventDefault();
        }
    });
}());