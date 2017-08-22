(function($){
    window.rps = window.rps || {};
    var postType = 'post';

    rps.getSearchUrl = function(){
        return window.rps.restUrl + 'wp/v2/' + postType + '/?per_page=50&search=';
    };

    rps.getPostUrl = function(){
        return window.rps.restUrl + 'wp/v2/' + postType + '/?include=';
    };

    rps.getMediaUrl = function(){
        return window.rps.restUrl + 'wp/v2/media/';
    }

    rps.initSearchInterface = function(elementIds, containerElementId, customPostType){
        var container = $('#' + containerElementId).addClass('rps-wrapper');
        postType = customPostType || postType;

        var initialPostIds = {};

        elementIds.forEach(function(id, index){
            var rpsId = id + '__rps';
            window.rps[rpsId] = {};
            window.rps[rpsId].resultTextBox = $('#' + id);
            window.rps[rpsId].elements = addPostColumn(rpsId, container);

            var initialPostId = $('#' + id).val();

            if (parseInt(initialPostId) > 0) {
                // unlikely, but possible, that the same post id is attached twice
                // so put the rpsIds in an array so the first isn't overwritten by the second
                if (!('p_' + initialPostId in initialPostIds)){
                    initialPostIds['p_' + initialPostId] = [];
                }
                initialPostIds['p_' + initialPostId].push(rpsId);
            }
        });

        loadPosts(initialPostIds);
    };

    function addPostColumn(columnId, container){
        var col = $('<div />').attr({class: 'rps-col'}).appendTo(container);
        var postPreview = $('<div><div></div><span></span></div>').attr({ class: 'rps-post-wrapper', id: columnId + '_post' }).appendTo(col);

        $('<button>Add/Change</button>').attr({ class: 'button', id: columnId + '_change_button'  }).on('click', showSearchForm).appendTo(col);
        $('<button>Remove</button>').attr({ class: 'button', id: columnId + '_remove_button'  }).on('click', detatchPost).appendTo(col);

        var searchForm = $('<div />').attr({ class: 'rps-search-form' }).appendTo(col);
        $('<label>Search</label>').attr({ for: columnId + '_search', class: 'rps-label' }).appendTo(searchForm);
        var searchField = $('<input />').attr({ id: columnId + '_search', class: 'rps-search' }).on('keyup', searchForPosts).appendTo(searchForm);
        var results = $('<select />').attr({ size: 8, class: 'rps-results', id: columnId + '_results' }).on('change', selectPost).appendTo(searchForm);

        $('<button>Close</button>').attr({ class: 'rps-close', id: columnId + '_close' }).on('click', closeSearchForm).appendTo(searchForm);

        return {
            postPreview: postPreview,
            search: searchField,
            searchForm: searchForm,
            results: results
        };
    }

    function getRpsIdFromEvent(event){
        var elementId = $(event.currentTarget).attr("id");

        return elementId.substr(0, elementId.indexOf('__rps') + 5);
    }

    function searchForPosts(e){
        var columnId = getRpsIdFromEvent(e);
        var rpsObject = window.rps[columnId];
        var searchTerm = $(e.currentTarget).val();
        var timestamp = Date.now();
        var cacheKey = "r_" + searchTerm;

        if (searchTerm.length < 3) {
            $(rpsObject.elements.results).empty();
            delete rpsObject.cachedResults;
            rpsObject.elements.search.removeClass("rps-loading");
            return;
        }
        
        rpsObject.elements.search.addClass("rps-loading");

        rpsObject.lastRequestTime = timestamp;
        rpsObject.cachedResults = rpsObject.cachedResults || {};

        if (cacheKey in rpsObject.cachedResults) {
            rpsObject.currentCacheKey = cacheKey;
            return displaySearchResults(rpsObject.elements.results, rpsObject.cachedResults[cacheKey].data);
        }

        $.get(window.rps.getSearchUrl() + encodeURIComponent(searchTerm), function(data){
            if (Array.isArray(data) && data.length > 0){
                rpsObject.cachedResults[cacheKey] = {
                    data: data,
                    timestamp: timestamp
                };

                // don't overwrite newer results that may have returned from the server sooner
                if (timestamp <= rpsObject.lastRequestTime) {
                    rpsObject.currentCacheKey = cacheKey;
                    displaySearchResults(rpsObject.elements.results, data);
                    rpsObject.elements.search.removeClass("rps-loading");
                }
            }
        });
    }

    function displaySearchResults(element, results){
        $(element).empty();
        results.forEach(function(post, index){
            $(element).append('<option value="' + post.id + '">' + post.title.rendered + '</option>');
        });
    }

    function selectPost(e){        
        var rpsId = getRpsIdFromEvent(e);    
        var rpsObject = window.rps[rpsId];
        $(rpsObject.resultTextBox).val($(e.currentTarget).val());

        closeSearchForm(e);

        var posts = rpsObject.cachedResults[rpsObject.currentCacheKey].data.filter(function(post, index){
            return (post.id == $(e.currentTarget).val()) ? true : false ;
        });

        if (posts.length == 1){ // there should only be one because we filter by id
            displayPost(rpsObject.elements.postPreview, posts[0]);
        }
    }

    function loadPosts(postIdObject){
        // postIdObject is an object of arrays, the key is the postId
        // array contains all the rpsIds that have that postId attached
        var postIds = Object.keys(postIdObject).map(function(val){
            return val.replace('p_','');
        }).join(',');
        
        if (postIds){
            $.get(window.rps.getPostUrl() + postIds, function(data){
                if (Array.isArray(data) && data.length > 0){
                    data.forEach(function(post){
                        postIdObject['p_' + post.id].forEach(function(rpsId){
                            displayPost(window.rps[rpsId].elements.postPreview, post);
                        });
                    });
                }
            });
        }
    }

    function displayPost(element, post){
        $(element).find('span').text(post.title.rendered);

        if (post.featured_media){
            $.get(rps.getMediaUrl() + post.featured_media, function(data){
                if (data.media_type == 'image'){
                    $(element).find('div').attr('style', 'background-image:url("' + data.media_details.sizes.thumbnail.source_url + '");');
                }
            });
        } else {
            $(element).find('div').attr('style', 'background-image:none;');
        }

    }

    function showSearchForm(e){
        e.preventDefault();
        var rpsId = getRpsIdFromEvent(e);   
        window.rps[rpsId].elements.searchForm.addClass('rps-searching');
        window.rps[rpsId].elements.search.focus();
    }

    function detatchPost(e){
        e.preventDefault();
        var rpsId = getRpsIdFromEvent(e);

        window.rps[rpsId].resultTextBox.val(0);
        window.rps[rpsId].elements.postPreview.find('span').text("");
        window.rps[rpsId].elements.postPreview.find('div').attr('style', 'background-image:none;');
    }

    function closeSearchForm(e){
        e.preventDefault();
        var rpsId = getRpsIdFromEvent(e);  
        window.rps[rpsId].elements.searchForm.removeClass('rps-searching');
    }

})(jQuery);