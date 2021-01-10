# markdown-it-mdcat-table

Plugin for [markdown-it](https://github.com/markdown-it/markdown-it) markdown parser, adding mdcat.table syntax.

## Install

```bash
npm install markdown-it-mdcat-table --save
```

## Use

### init

````js
var md = require('markdown-it')()
        .use(require('markdown-it-mdcat-table'));

var src =  '```mdcat.table\n';
        += '|left  |center|right |\n';
        += '|:-----|:----:|-----:|\n';
        += '|      |>     |      |\n';
        += '|>     |hello |<     |\n';
        += '|      |<     |      |\n';
        += '\n';
        += '# hello\n';
        += 'Hello World!\n';
        += '```';
md.render(src);
````

### change code block name

````js
var md = require('markdown-it')()
        .use(require('markdown-it-mdcat-table'), { 'codeBlockName' : 'yourName'});
````


## License

[MIT](https://github.com/poyonshot/markdown-it-mdcat-table/blob/master/LICENSE)
