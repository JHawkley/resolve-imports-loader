const babelParser = require('./babel-helper').makeParser();
const pathHelper_legacy = require('./utils').pathHelper_legacy;
const extractExportSpecifiers = require('./extractExportSpecifiers');
const extractImportSpecifiers = require('./extractImportSpecifiers');

/** @typedef {import('./utils').SpecifierProps} SpecifierProps */

/**
 * Small wrapper over the Babylon ES6 AST.
 * @deprecated Use {@link import('./specResolver')|SpecResolver} to extract
 * specifiers from a file instead.
 */
class AST {
    /**
     * Initializes a new instance of {@link AST}.
     * @param {*} ast The AST to wrap.
     * @param {import('./resolver')} resolver The resolver to use when resolving a file.
     * @param {string} sourcePath The path to the file from which this AST was parsed.
     */
    constructor(ast, resolver, sourcePath) {
        this.ast = ast;
        this.resolver = resolver;
        this.sourcePath = sourcePath;

        // an adapter for the old resolver class
        this.resolveSpecifierProps = request =>
            pathHelper_legacy(request, sourcePath, resolver);
    }

    /**
     * Parses the specified JS/ES6 file with the Babel parser
     * and returns the AST.
     * @param {string} filePath The path to the file to parse.
     * @param {import('./resolver')} resolver The resolver to use to resolve the specified file.
     * @returns The AST of the specified file or null if the specified
     * file could not be found or could not be parsed.
     */
    static parseFrom(filePath, resolver) {
        const ast = babelParser(filePath);
        return ast ? new AST(ast, resolver, filePath) : null;
    }

    /**
     * Resolves the absolute path to the specified file,
     * relative to the file being parsed.
     * @param {string} request The path to resolve.
     * @returns {string} The absolute path to the specified file or
     * null if the path could not be resolved.
     */
    resolve(request) {
        return this.resolver.resolveFile(path, this.sourcePath);
    }

    /**
     * Gets a flat list of all the import specifiers in this file.
     */
    importSpecifiers() {
        const declarations = this.ast.program.body
            .filter(node => node.type === 'ImportDeclaration');

        return extractImportSpecifiers(declarations, this.resolveSpecifierProps);
    }

    /**
     * Gets a flat list of all the export specifiers in this file.
     */
    exportSpecifiers() {
        const declarations = this.ast.program.body
            .filter(node => node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration');

        return extractExportSpecifiers(declarations, this.resolveSpecifierProps);
    }
}

module.exports = AST;
