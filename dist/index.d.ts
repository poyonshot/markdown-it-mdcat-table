import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
declare class TokenIterator {
    tokens: Token[];
    pos: number;
    constructor(tokens: Token[]);
    clone(): TokenIterator;
    get(): Token;
    isEnd(): boolean;
    advance(n?: number): void;
}
declare class TableItem {
    label: string;
    startPos: number;
    endPos: number;
    tokens: Token[];
    content: string;
}
declare enum MergeSymbol {
    None = 0,
    Left = 1,
    Right = 2,
    Up = 3
}
declare class TableCell {
    row: number;
    column: number;
    isRowEnd: boolean;
    curRow: number;
    curColumn: number;
    colspan: number;
    rowspan: number;
    symbol: MergeSymbol;
    customLabel: string;
    tokenOpen: Token | null;
    tokenBegin: number;
    tokenEnd: number;
    constructor(row: number, column: number);
    get label(): string;
}
declare class MdcatTable {
    tokens: Token[];
    cells: TableCell[];
    hasMergeSymbol: boolean;
    cellMap: Map<string, TableCell>;
    initCells(tokens: Token[]): boolean;
    mergeCell(): void;
    doInitCellMap(): void;
    doMergeCells(): void;
    doAppendAttr(): void;
    doRemoveMergedCells(): void;
    updateCellContent(cellContent: TableItem): void;
}
export declare class MdcatTablePlugin {
    md: MarkdownIt;
    options: MarkdownIt.Options;
    env: any;
    beforeTableTokens: Token[];
    table: MdcatTable;
    cellContents: TableItem[];
    constructor(md: MarkdownIt, options: MarkdownIt.Options, env: any);
    render(src: string): string;
    findToken(tokens: Token[], begin: number, type: string): number;
    init(tokens: Token[]): boolean;
    initCellContents(tokens: Token[]): boolean;
    tableItem_p(it: TokenIterator): TableItem | null;
    updateCellContent(): void;
}
export interface Options extends MarkdownIt.Options {
    enable?: boolean;
    codeBlockName?: string;
}
export {};
//# sourceMappingURL=index.d.ts.map