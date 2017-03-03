const {
  relative: getRelativePath,
  isAbsolute: isAbsolutePath,
  join: joinPath
} = require('path')

const {
  hasPrefix,
  stripPrefix,
  getRelativePathToModule,
  getLongRelativePathToModule
} = require('root-import-utils')

const defaultPrefix = '~'

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

const getProjectRoot = (projectRootOpt = './') => {
  // if opt is absolute, use that, otherwise use cwd with relative opt joined if given
  return isAbsolutePath(projectRootOpt) ? projectRootOpt : joinPath(process.cwd(), projectRootOpt)
}

const updateNode = (node, value) => {
  if (typeof node.value === 'object') {
    node.value.raw = value
    node.value.cooked = value
  } else {
    node.value = value
  }
}

const isResolve = (t, callee) => t.isIdentifier(callee.object, {name: 'require'}) &&
  callee.property.name === 'resolve'

const isRequireOrResolve = (t, path) => {
  return (path.node.callee.name === 'require' || isResolve(t, path.node.callee))
    && path.scope.hasGlobal('require')
}

const plugin = ({types: t}) => {
  return {
    visitor: {
      CallExpression: (path, state) => {
        if (!isRequireOrResolve(t, path)) { return }

        const args = path.node.arguments
        if (!args.length) { return } // function call doesn't have any arguments

        let sourcePath = state.file.opts.filename
        if (sourcePath === 'unknown') { return } // code isn't from a file

        const firstNode = traverseForFirstPartOfRequirePath(t, args[0])
        if (!firstNode) { return } // first part of require path isn't a string

        const customPrefix = state.opts.prefix
        if (customPrefix !== undefined && typeof customPrefix !== 'string') {
          throw new Error(`"prefix" option must be a string. "${typeof customPrefix}" given.`)
        }
        const prefix = customPrefix || defaultPrefix

        const modulePath = firstNode.value.raw || firstNode.value
        if (!hasPrefix(prefix, modulePath)) { return }

        const projectRootOpt = state.opts.projectRoot || ''

        const projectRoot = getProjectRoot(state.opts.projectRoot)
        const sourcePathFromRoot = getRelativePath(projectRoot, sourcePath)
        const modulePathFromRoot = stripPrefix(prefix, modulePath)

        const getNewValue = state.opts.long ? getLongRelativePathToModule : getRelativePathToModule
        const newValue = getNewValue(sourcePathFromRoot, modulePathFromRoot)
        updateNode(firstNode, newValue)
      }
    }
  }
}

module.exports = plugin
