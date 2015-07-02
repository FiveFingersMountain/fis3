var root = fis.project.getProjectPath();

function markdownParse(settings) {
  var layout = fis.file(root + '/page/layout.html');
  
  function wrapper(title, content) {
    return layout.getContent()
            .replace('{{content}}', content)
            .replace('{{title}}', title);
  }

  return function (content, file, settings) {
    file.cache.addDeps(layout.realpath); // cache deps layout
    var marked = require('marked');
    var renderer = new marked.Renderer();
    content.match(/##([^#\n]+)/);
    var title = 'FIS3 : ' + (RegExp.$1 || "");

    renderer.heading = function(text, level) {
      var link = {};
      link.text = text;
      link.level = level;
      var escapedText = encodeURI(text);  
      if (level != 1) level += 1;
      return '<h' + level + ' class="' + (level == 1 ? 'page-header' : '') +
        (level == 3 ? '" id="' + text : '') +
        '"><a name="' +
        escapedText +
        '" href="#' +
        escapedText +
        '">'+ text + '</a>' +
        '</h' + level + '>';
    };
  
  
    renderer.link = function(href, title, text) {
      var out = '<a href="' + href + '"';

      if (href.indexOf('http') != 0) {
        var hash = '';
        var p;
        if ((p = href.indexOf('#')) > 0) {
          hash = href.substr(p);
          href = href.substr(0, p);
        }
        if (/\.md$/.test(href)) {
          href = fis.compile.lang.uri.ld + href + fis.compile.lang.uri.rd + encodeURI(hash);
        } else {
          href = encodeURI(href+hash);
        }
        out = '<a href="' + href + '"';
      }
  
      if (title) {
        out += ' title="' + title + '"';
      }
  
      out += '>' + text + '</a>';
      return out;
    };
  
    marked.setOptions({
      renderer: renderer,
      highlight: function(code) {
        return require('highlight.js').highlightAuto(code).value;
      },
      langPrefix: 'hljs lang-',
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false
    });
    content = marked(content);
    return file.isIndex ? content : wrapper(title, content);
  };
}


function buildNav() {
  return function (ret) {
    fis.util.map(ret.src, function (subpath, file) {
      if (!file.isDoc) return;
      file.setContent(
        file.getContent().replace('{{nav}}', ret.src['/docs/INDEX.md'].getContent())
      );
    });
  };
}

function replaceDefine (defines) {
  return function (ret) {
    fis.util.map(ret.src, function (subpath, file) {
      if (file.isHtmlLike) {
        var content = file.getContent();
        content = content.replace(/\{\{-([^}]+)\}\}/ig, function ($0, $1) {
          return (typeof defines[$1.trim()] == 'undefined') ? '' : defines[$1.trim()];
        });
        file.setContent(content);
      }
    });
  };
}

module.exports.markdownParse = markdownParse;
module.exports.buildNav = buildNav;
module.exports.replaceDefine = replaceDefine;