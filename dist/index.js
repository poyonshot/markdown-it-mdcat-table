'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MdcatTablePlugin = void 0;
class TokenIterator {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }
    clone() {
        let it = new TokenIterator(this.tokens);
        it.pos = this.pos;
        return it;
    }
    get() {
        return this.tokens[this.pos];
    }
    isEnd() {
        return this.pos >= this.tokens.length;
    }
    advance(n = 1) {
        this.pos += n;
        if (this.isEnd()) {
            this.pos = this.tokens.length;
        }
    }
}
class TableItem {
    constructor() {
        this.label = '';
        this.startPos = 0;
        this.endPos = 0;
        this.tokens = [];
        this.content = "";
    }
}
var MergeSymbol;
(function (MergeSymbol) {
    MergeSymbol[MergeSymbol["None"] = 0] = "None";
    MergeSymbol[MergeSymbol["Left"] = 1] = "Left";
    MergeSymbol[MergeSymbol["Right"] = 2] = "Right";
    MergeSymbol[MergeSymbol["Up"] = 3] = "Up";
})(MergeSymbol || (MergeSymbol = {}));
class TableCell {
    constructor(row, column) {
        this.isRowEnd = false;
        this.symbol = MergeSymbol.None;
        this.customLabel = "";
        this.tokenOpen = null;
        this.tokenBegin = 0;
        this.tokenEnd = 0;
        this.row = row;
        this.column = column;
        this.curRow = row;
        this.curColumn = column;
        this.colspan = 1;
        this.rowspan = 1;
    }
    get label() {
        return (this.customLabel.length != 0) ? this.customLabel : `${this.curColumn}-${this.curRow}`;
    }
}
class MdcatTable {
    constructor() {
        this.tokens = [];
        this.cells = [];
        this.hasMergeSymbol = false;
        this.cellMap = new Map();
    }
    initCells(tokens) {
        var _a;
        this.tokens = tokens;
        this.cells = [];
        var it = new TokenIterator(tokens);
        if (it.isEnd() || (it.get().type !== 'table_open')) {
            return false;
        }
        var column = 0;
        var row = 0;
        const symbolMap = new Map();
        symbolMap.set("<", MergeSymbol.Left);
        symbolMap.set(">", MergeSymbol.Right);
        symbolMap.set("^", MergeSymbol.Up);
        for (; !it.isEnd(); it.advance()) {
            let token = it.get();
            if (token.type === 'td_open') {
                continue;
            }
            if (token.type === 'tr_close') {
                if (this.cells.length > 0) {
                    this.cells[this.cells.length - 1].isRowEnd = true;
                }
                column += 1;
                row = 0;
                continue;
            }
            if ((token.type === 'td_close') || (token.type === 'th_close')) {
                var cell = new TableCell(row, column);
                cell.row = row;
                cell.column = column;
                cell.tokenOpen = it.tokens[it.pos - 2];
                cell.tokenBegin = it.pos - 2;
                cell.tokenEnd = it.pos + 1;
                var lastToken = it.tokens[it.pos - 1];
                var str = lastToken.content.trim();
                cell.symbol = (_a = symbolMap.get(str)) !== null && _a !== void 0 ? _a : MergeSymbol.None;
                this.hasMergeSymbol = this.hasMergeSymbol || (cell.symbol == MergeSymbol.None);
                if (cell.symbol == MergeSymbol.None) {
                    cell.customLabel = str;
                }
                else {
                    cell.customLabel = str.slice(1);
                }
                this.cells.push(cell);
                row += 1;
                continue;
            }
            if (token.type === 'table_close') {
                it.advance();
                this.doInitCellMap();
                return true;
            }
        }
        return false;
    }
    mergeCell() {
        if (this.hasMergeSymbol) {
            this.doMergeCells();
            this.doAppendAttr();
            this.doRemoveMergedCells();
            this.doInitCellMap();
        }
    }
    doInitCellMap() {
        this.cellMap.clear();
        for (let cell of this.cells) {
            this.cellMap.set(cell.label, cell);
        }
    }
    doMergeCells() {
        if (!this.hasMergeSymbol) {
            return;
        }
        var targetCell = null;
        let rowCount = this.cells[this.cells.length - 1].row + 1;
        let columnCount = this.cells[this.cells.length - 1].column + 1;
        // 末尾から処理する
        for (var i = this.cells.length - 1; i >= 0; --i) {
            let cell = this.cells[i];
            if (cell.isRowEnd) {
                targetCell = null;
            }
            switch (cell.symbol) {
                case MergeSymbol.None:
                    targetCell = cell;
                    break;
                case MergeSymbol.Right:
                    if (targetCell != null) {
                        targetCell.curRow -= 1;
                        targetCell.colspan += 1;
                        cell.colspan -= 1;
                    }
                    break;
                case MergeSymbol.Left:
                    if (cell.row >= 1) {
                        this.cells[i - 1].colspan += cell.colspan;
                        cell.colspan = 0;
                    }
                    break;
                case MergeSymbol.Up:
                    if (cell.column >= 2) {
                        this.cells[i - rowCount].rowspan += cell.rowspan;
                        cell.rowspan = 0;
                    }
                    break;
            }
        }
        // for (let cell of this.cells)
        // {
        //     console.log(cell.label() + ` colspan=${cell.colspan}` + ` rowspan=${cell.rowspan}`);
        // }
    }
    doAppendAttr() {
        var _a, _b;
        for (let cell of this.cells) {
            if (cell.colspan >= 2) {
                (_a = cell.tokenOpen) === null || _a === void 0 ? void 0 : _a.attrSet("colspan", `${cell.colspan}`);
            }
            if (cell.rowspan >= 2) {
                (_b = cell.tokenOpen) === null || _b === void 0 ? void 0 : _b.attrSet("rowspan", `${cell.rowspan}`);
            }
        }
    }
    doRemoveMergedCells() {
        // 末尾から処理する
        for (var i = this.cells.length - 1; i >= 0; --i) {
            let cell = this.cells[i];
            let needDelete = (cell.rowspan == 0) || (cell.colspan == 0);
            if (!needDelete) {
                continue;
            }
            let cnt = cell.tokenEnd - cell.tokenBegin;
            this.tokens.splice(cell.tokenBegin, cnt);
            this.cells.splice(i, 1);
            for (var j = i; j < this.cells.length; ++j) {
                let c = this.cells[j];
                c.tokenBegin -= cnt;
                c.tokenEnd -= cnt;
            }
        }
    }
    updateCellContent(cellContent) {
        let cell = this.cellMap.get(cellContent.label);
        if (cell == null) {
            return;
        }
        let lastToken = this.tokens[cell.tokenEnd - 2];
        lastToken.children = [];
        lastToken.content = cellContent.content;
        lastToken.type = 'html_block';
    }
}
class MdcatTablePlugin {
    constructor(md, options, env) {
        // table タグの前にあるToken
        this.beforeTableTokens = [];
        // table タグ
        this.table = new MdcatTable();
        // セルの内容
        this.cellContents = [];
        this.md = md;
        this.options = options;
        this.env = env;
    }
    render(src) {
        var tokens = this.md.parse(src, this.env);
        if (this.init(tokens)) {
            this.table.mergeCell();
            this.updateCellContent();
            tokens = this.table.tokens;
        }
        let s = this.md.renderer.render(tokens, this.options, this.env);
        //console.log(s);
        return s;
    }
    findToken(tokens, begin, type) {
        for (var pos = begin; pos < tokens.length; ++pos) {
            if (tokens[pos].type === type) {
                return pos;
            }
        }
        return -1;
    }
    init(tokens) {
        // table タグが始まるまでの Token を設定します
        let tableStartPos = this.findToken(tokens, 0, 'table_open');
        if (tableStartPos < 0) {
            return false;
        }
        this.beforeTableTokens = tokens.splice(0, tableStartPos);
        // table タグを読み込みます
        let tableEndPos = this.findToken(tokens, 1, 'table_close');
        if (tableEndPos < 0) {
            return false;
        }
        tableEndPos += 1;
        this.table.initCells(tokens.splice(0, tableEndPos));
        // セルの内容を読み込みます
        if (!this.initCellContents(tokens)) {
            return false;
        }
        return true;
    }
    // セルの内容を読み込みます
    initCellContents(tokens) {
        this.cellContents = [];
        var it = new TokenIterator(tokens);
        while (!it.isEnd()) {
            var item = this.tableItem_p(it);
            if (item == null) {
                it.advance();
            }
            else {
                let children = item.tokens;
                if ((children.length == 3) && (children[0].type == "paragraph_open")) {
                    // <p>xxx</p> だけの場合
                    item.content = children[1].content;
                }
                else {
                    item.content = this.md.renderer.render(children, this.options, this.env);
                }
                this.cellContents.push(item);
            }
        }
        return true;
    }
    tableItem_p(it) {
        if (it.isEnd() || (it.get().type !== 'heading_open')) {
            return null;
        }
        let item = new TableItem();
        for (it.advance(); !it.isEnd(); it.advance()) {
            var token = it.get();
            if (token.type === 'inline') {
                item.label = token.content;
                continue;
            }
            if (token.type === 'heading_close') {
                it.advance();
                break;
            }
        }
        //開始位置
        item.startPos = it.pos;
        for (; !it.isEnd(); it.advance()) {
            if (it.get().type !== 'heading_open') {
                continue;
            }
            break;
        }
        //終了位置
        item.endPos = it.pos;
        item.tokens = it.tokens.slice(item.startPos, item.endPos);
        return item;
    }
    updateCellContent() {
        for (let c of this.cellContents) {
            this.table.updateCellContent(c);
        }
    }
}
exports.MdcatTablePlugin = MdcatTablePlugin;
module.exports = function mdcatTablePlugin(md, options) {
    var _a;
    var defaults = {
        enable: true,
        codeBlockName: "mdcat.table",
    };
    var opts = Object.assign({}, options || {});
    if (opts.enable == null) {
        opts.enable = defaults.enable;
    }
    if (((_a = opts.codeBlockName) !== null && _a !== void 0 ? _a : "") === "") {
        opts.codeBlockName = defaults.codeBlockName;
    }
    const defaultRender = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        var _a, _b;
        if ((_a = opts.enable) !== null && _a !== void 0 ? _a : false) {
            let token = tokens[idx];
            let info = token.info ? String(token.info).trim() : "";
            if (info === opts.codeBlockName) {
                const m = new MdcatTablePlugin(md, options, env);
                return m.render(token.content);
            }
        }
        return (_b = defaultRender === null || defaultRender === void 0 ? void 0 : defaultRender(tokens, idx, options, env, self).toString()) !== null && _b !== void 0 ? _b : "";
    };
    return md;
};
//# sourceMappingURL=index.js.map