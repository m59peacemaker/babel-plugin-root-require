const {
  join: joinPath,
  relative: getRelativePath,
  resolve: resolvePath,
  dirname: getDirname,
  isAbsolute: isAbsolutePath
} = require('path')

const defaultPrefix = '~'

const traverseForFirstPartOfRequirePath = (t, node) => {
  if (t.isStringLiteral(node)) {
    return node
  }
  if (t.isBinaryExpression(node)) {
    return traverseForFirstPartOfRequirePath(t, node.left)
  }
  if (t.isTemplateLiteral(node)) {
    return traverseForFirstPartOfRequirePath(t, node.quasis[0])
  }
  if (t.isTemplateElement(node)) {
    return node
  }
  return null // there isn't a string or template string here
}

const hasPrefix = (prefix, path) => path.slice(0, prefix.length) === prefix

const getProjectRoot = (sourceRoot = '') => resolvePath(process.cwd(), sourceRoot)

const getAbsoluteSourceDirname = (sourcePath) => {
  const sourceDirname = getDirname(sourcePath)
  return isAbsolutePath(sourcePath) ? sourceDirname : joinPath(process.cwd(), sourceDirname)
}

const getRelativePathToProjectRoot = (absoluteSourcePath, projectRoot) => {
  const relativePath = getRelativePath(absoluteSourcePath, projectRoot)
  return relativePath + (relativePath.substr(-1) === '.' ? '/' : '')
}

const getNewValue = (sourceRoot, sourcePath, importPath, pathFromRoot) => {
  const projectRoot = getProjectRoot(sourceRoot)
  const absoluteSourcePath = getAbsoluteSourceDirname(sourcePath, projectRoot)
  const relativePathToProjectRoot = getRelativePathToProjectRoot(absoluteSourcePath, projectRoot)
  if (relativePathToProjectRoot.length) {
    return joinPath(relativePathToProjectRoot, pathFromRoot)
  } else { // source file is in project root
    return './' + pathFromRoot
  }
}

const updateNode = (newValue, node) => {
  if (typeof node.value === 'object') {
    node.value.raw = newValue
    node.value.cooked = newValue
  } else {
    node.value = newValue
  }
}

const plugin = ({types: t}) => {
  return {
    visitor: {
      CallExpression (path, state) {
        if (path.node.callee.name !== 'require') { return } // function call is not `require`

        const args = path.node.arguments
        if (!args.length) { return } // function call doesn't have any arguments

        const sourcePath = state.file.opts.filename
        if (sourcePath === 'unknown') { return } // code isn't from a file

        const firstNode = traverseForFirstPartOfRequirePath(t, args[0])
        if (!firstNode) { return } // first part of require path isn't a string

        const customPrefix = state.opts.prefix
        if (customPrefix !== undefined && typeof customPrefix !== 'string') {
          throw new Error(`"prefix" option must be a string. "${typeof customPrefix}" given.`)
        }
        const prefix = (customPrefix || defaultPrefix) + '/'

        const importPath = firstNode.value.raw || firstNode.value
        if (!hasPrefix(prefix, importPath)) { return }

        const pathFromRoot = importPath.slice(prefix.length)
        const newValue = getNewValue(state.file.opts.sourceRoot, sourcePath, importPath, pathFromRoot)
        updateNode(newValue, firstNode)
      }
    }
  }
}

module.exports = plugin
