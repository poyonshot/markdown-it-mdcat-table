# markdown-it-mdcat-table

Plugin for [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser, adding mdcat.table syntax.

## Install

```bash
npm install markdown-it-mdcat-table --save
```

## Use

### init

```js
var md = require('markdown-it')()
             .use(require('markdown-it-mdcat-table'));

var src = '!!!include(header.md)!!!\n\n*your content*\n\n!!!include(footer.md)!!!';
md.render(src);
```

## License

[MIT](https://github.com/poyonshot/markdown-it-mdcat-table/blob/master/LICENSE)
