var show_debug = null;

utils = {
    debug: function(output) {
        if (show_debug == null) {
            // set show_debug for first run on this page
            utils.storage_get("debug", function (debug_){
                if (debug_ === "on") {
                    show_debug = true;
                }
                else {
                    show_debug = false;
                }
            });
        }
        if (show_debug) {
            if (typeof output === "string") {
                console.log("Transmogrify for Plex log: " + output);
            }
            else {
                console.log(output);
            }
        }
    },

    getExtensionVersion: function() {
        var version = self.options.version;
        return version;
    },

    getOptionsURL: function() {
        var url = self.options.optionspage;
        return url;
    },

    openOptionsPage: function() {
        self.port.emit("open_options_page", {});
    },

    insertOverlay: function() {
        // don't run if overlay exists on page
        utils.debug("Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            utils.debug("Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        utils.debug("Inserted overlay");

        return overlay;
    },

    storage_set: function(key, value) {
        self.port.emit("storage_set", {"key": key, "value": value});
    },

    storage_get: function(key, callback) {
        self.port.emit("storage_get", {"key": key});
        self.port.once("storage_response-" + key, function(results) {
            callback(results);
        });
    },

    storage_get_all: function(callback) {
        self.port.emit("storage_get_all", {});
        self.port.once("storage_response_all", function(results) {
            callback(results);
        });
    },

    storage_remove: function(key) {
        self.port.emit("storage_remove", {"key": key});
    },

    cache_set: function(key, data) {
        utils.storage_get("cache_keys", function(cache_keys) {
            // check if cache keys don't exist yet
            if (!cache_keys) {
                cache_keys = {};
            }

            // store cached url keys with timestamps
            cache_keys[key] = {"timestamp": new Date().getTime()};
            utils.storage_set("cache_keys", cache_keys);

            // store cached data with url key
            utils.storage_set(key, data);
        });
    },

    cache_get: function(key, callback) {
        utils.storage_get(key, function(result) {
            if (result) {
                utils.debug("Cache hit");
                callback(result);
            }
            else {
                utils.debug("Cache miss");
                callback(null);
            }
        });
    },

    getResourcePath: function(resource) {
        return (self.options.resourcepath + resource);
    },

    getApiKey: function(api_name) {
        var api_key = self.options.apikeys[api_name];
        return api_key;
    },

    getXML: function(url, callback) {
        utils.debug("Fetching XML from " + url);
        self.port.emit("xml_request", {"request_url": url});
        self.port.once("xml_response-" + url, function(results) {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(results,"text/xml");
            callback(xmlDoc);
        });
    },

    getJSONWithCache: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        utils.cache_get("cache-" + url, function(result) {
            if (result) {
                callback(result);
            }
            else {
                // cache missed or stale, grabbing new data
                utils.getJSON(url, function(result) {
                    utils.cache_set("cache-" + url, result);
                    callback(result);
                });
            }
        });
    },

    getJSON: function(url, callback) {
        utils.debug("Fetching JSON from " + url);
        self.port.emit("json_request", {"request_url": url});
        self.port.once("json_response-" + url, function(results) {
            callback(results);
        });
    },

    setDefaultOptions: function(callback) {
        utils.storage_get_all(function(results) {
            if (!("movie_trailers" in results)) {
                utils.storage_set("movie_trailers", "on");
            }

            if (!("letterboxd_link" in results)) {
                utils.storage_set("letterboxd_link", "on");
            }

            if (!("random_picker" in results)) {
                utils.storage_set("random_picker", "on");
            }

            if (!("random_picker_only_unwatched" in results)) {
                utils.storage_set("random_picker_only_unwatched", "off");
            }

            if (!("missing_episodes" in results)) {
                utils.storage_set("missing_episodes", "on");
            }

            if (!("rotten_tomatoes_link" in results)) {
                utils.storage_set("rotten_tomatoes_link", "off");
            }

            if (!("rotten_tomatoes_audience" in results)) {
                utils.storage_set("rotten_tomatoes_audience", "on");
            }

            if (!("rotten_tomatoes_citizen" in results)) {
                utils.storage_set("rotten_tomatoes_citizen", "non_us");
            }

            if (!("trakt_movies" in results)) {
                utils.storage_set("trakt_movies", "on");
            }

            if (!("trakt_shows" in results)) {
                utils.storage_set("trakt_shows", "on");
            }

            if (!("plex_server_address" in results) || !("plex_server_port" in results)) {
                utils.storage_set("plex_server_address", "");
                utils.storage_set("plex_server_port", "");
            }

            if (!("split_added_deck" in results)) {
                utils.storage_set("split_added_deck", "on");
            }

            if (!("canistreamit" in results)) {
                utils.storage_set("canistreamit", "off");
            }

            if (!("imdb_link" in results)) {
                utils.storage_set("imdb_link", "on");
            }

            if (!("actor_profiles" in results)) {
                utils.storage_set("actor_profiles", "on");
            }

            if (!("last_version" in results)) {
                utils.storage_set("last_version", "");
            }

            if (!("debug" in results)) {
                utils.storage_set("debug", "off");
            }

            if (callback) {
                callback();
            }
        });
    }
}