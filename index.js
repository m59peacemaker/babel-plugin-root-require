const {
  join: joinPath,
  relative: getRelativePath,
  resolve: resolvePath,
  dirname: getDirname,
  isAbsolute: isAbsolutePath
} = require('path')

const traverseForFirstPartOfRequirePath = (t, arg) => {
  if (t.isStringLiteral(arg)) {
    return arg
  }
  if (t.isBinaryExpression(arg)) {
    return traverseForFirstPartOfRequirePath(t, arg.left)
  }
  if (t.isTemplateLiteral(arg)) {
    return traverseForFirstPartOfRequirePath(t, arg.quasis[0])
  }
  if (t.isTemplateElement(arg)) {
    return arg
  }
  return null // there isn't a string or template string here
}

const prefix = '~/'

const hasPrefix = path => {
  return path.slice(0, 2) === prefix
}

const getProjectRoot = (sourceRoot = '') => resolvePath(process.cwd(), sourceRoot)

const getAbsoluteSourceDirname = (sourcePath, projectRoot) => {
  const sourceDirname = getDirname(sourcePath)
  return isAbsolutePath(sourcePath) ? sourceDirname : joinPath(projectRoot, sourceDirname)
}

const getRelativeImportPath = (sourceRoot = './', sourcePath, importPath) => {
  const importPathWithoutPrefix = importPath.slice(1)
  const projectRoot = getProjectRoot(sourceRoot)
  const absoluteImportPath = joinPath(projectRoot, importPathWithoutPrefix)
  const absoluteSourceDirname = getAbsoluteSourceDirname(sourcePath, projectRoot)
  const relativePath = getRelativePath(absoluteSourceDirname, absoluteImportPath)
  console.log(absoluteImportPath, absoluteSourceDirname, relativePath)
  //const firstChar = relativePath.slice(0, 1)
  //if (firstChar !== '.') {
  //  return './' + relativePath
  //}
  return relativePath
}

const getNewPrefix = (absoluteSourcePath, projectRoot) => {
  return relativePathToProjectRoot.length ? relativePathToProjectRoot : './'
}

const getNewValue = (relativePathToProjectRoot, importPath) => {
  const withoutPrefix = importPath.slice(2)
  if (relativePathToProjectRoot.length) {
    return joinPath(relativePathToProjectRoot, withoutPrefix)
  } else {
    return './' + withoutPrefix
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

        const firstArg = traverseForFirstPartOfRequirePath(t, args[0])
        if (!firstArg) { return } // first part of require path isn't a string

        const importPath = firstArg.value.raw || firstArg.value
        if (!hasPrefix(importPath)) { return }

        const sourceRoot = state.file.opts.sourceRoot
        const projectRoot = getProjectRoot(sourceRoot)
        const absoluteSourcePath = getAbsoluteSourceDirname(sourcePath, projectRoot)
        const relativePathToProjectRoot = getRelativePath(absoluteSourcePath, projectRoot)
        const newValue = getNewValue(relativePathToProjectRoot, importPath)
        //let newValue = getRelativeImportPath(state.file.opts.sourceRoot, sourcePath, importPath)
        //newValue += importPath === prefix ? '/' : ''
        if (typeof firstArg.value === 'object') {
          firstArg.value.raw = newValue
          firstArg.value.cooked = newValue
        } else {
          firstArg.value = newValue
        }
      }
    }
  }
}

module.exports = plugin
