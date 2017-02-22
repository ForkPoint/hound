// TODO(knorton): Use something to bundle this more intelligently and get this
// out of the global scope.

var lib = {

    Signal : function() {
      this.listeners = [];

      this.tap = function(l) {
        // Make a copy of the listeners to avoid the all too common
        // subscribe-during-dispatch problem
        this.listeners = this.listeners.slice(0);
        this.listeners.push(l);
      },

      this.untap = function(l) {
        var ix = this.listeners.indexOf(l);
        if (ix == -1) {
          return;
        }

        // Make a copy of the listeners to avoid the all to common
        // unsubscribe-during-dispatch problem
        this.listeners = this.listeners.slice(0);
        this.listeners.splice(ix, 1);
      },

      this.raise = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        this.listeners.forEach(function(l) {
          l.apply(this, args);
        });
      }
    },

    ParamsFromQueryString : function(qs, params) {
      params = params || {};

      if (!qs) {
        return params;
      }

      qs.substring(1).split('&').forEach(function(v) {
        var pair = v.split('=');
        if (pair.length != 2) {
          return;
        }

        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      });


      return params;
    },

    ParamsFromUrl : function(params, defaults) {
      params = params || defaults || {
        q: '',
        i: 'nope',
        file : '',
        files: '',
        repos: '*'
      };
      return this.ParamsFromQueryString(location.search, params);
    },

    ExpandVars: function(template, values) {
      for (var name in values) {
        template = template.replace('{' + name + '}', values[name]);
      }
      return template;
    },

    UrlToRepo: function(repo, path, line, rev) {
        var url = repo.url.replace(/\.git$/, ''),
            pattern = repo['url-pattern'],
            filename = path.substring(path.lastIndexOf('/') + 1),
            anchor = line ? lib.ExpandVars(pattern.anchor, { line : line, filename : filename }) : '';

        // Determine if the URL passed is a GitHub wiki
        var wikiUrl = /\.wiki$/.exec(url);
        if (wikiUrl) {
          url = url.replace(/\.wiki/, '/wiki')
          path = path.replace(/\.md$/, '')
          anchor = '' // wikis do not support direct line linking
        }

        // Determine if the URL passed is to a locally cloned and tracked repo
        var fileUrl = /^file:\/\//.exec(url);
        if (fileUrl) {
          url = '/file?file=' + url.replace(/^file:\/\//, '')
          anchor = '' // the local file template does not support direct line linking
        }

        // Hacky solution to fix _some more_ of the 404's when using SSH style URLs.
        // This works for both github style URLs (git@github.com:username/Foo.git) and
        // bitbucket style URLs (ssh://hg@bitbucket.org/username/Foo).

        // Regex explained: Match either `git` or `hg` followed by an `@`.
        // Next, slurp up the hostname by reading until either a `:` or `/` is found.
        // Finally, grab all remaining characters.
        var sshParts = /(git|hg)@(.*?)(:|\/)(.*)/.exec(url);
        if (sshParts) {
          url = '//' + sshParts[2] + '/' + sshParts[4];
        }

        // I'm sure there is a nicer React/jsx way to do this:
        return lib.ExpandVars(pattern['base-url'], {
          url : url,
          path: path,
          rev: rev,
          anchor: anchor
        });
    }
};
