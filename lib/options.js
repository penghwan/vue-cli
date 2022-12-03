const path = require('path')
// 用于读取json或者yaml元数据文件，并返回一个对象
const metadata = require('read-metadata')
const exists = require('fs').existsSync
// 获取本地的git配置
const getGitUser = require('./git-user')
// 用于npm包的名字是否合法
const validateName = require('validate-npm-package-name')

/**
 * Read prompts metadata.
 *
 * @param {String} name：如果在当前目录下构建项目，当前目录名为项目构建目录名（如my-project)，否则是当前目录子目录
 * @param {String} dir：本地模板路径，如C:\Users\penghwan\.vue-templates\webpack（webpack是template模板名称）
 * @return {Object}
 */
// 获取元配置文件 => 设置name校验 => 并和本地git作者信息合并
// 第一步：获取模板的配置文件信息
// 第二步：设置name字段并检测name是否合法
// 第三步：只是author字段
module.exports = function options (name, dir) {
  const opts = getMetadata(dir)

  setDefault(opts, 'name', name)
  setValidateName(opts)

  const author = getGitUser()
  if (author) {
    setDefault(opts, 'author', author)
  }

  return opts
}

/**
 * Gets the metadata from either a meta.json or meta.js file.
 * 获取meta.js或者meta.json中的配置信息
 *
 * @param  {String} dir
 * @return {Object}
 */
function getMetadata (dir) {
  const json = path.join(dir, 'meta.json') // C:\Users\penghwan\.vue-templates\webpack\meta.json
  const js = path.join(dir, 'meta.js') // C:\Users\penghwan\.vue-templates\webpack\meta.js
  let opts = {}

  if (exists(json)) {
    opts = metadata.sync(json)
  } else if (exists(js)) {
    const req = require(path.resolve(js))
    if (req !== Object(req)) {
      throw new Error('meta.js needs to expose an object')
    }
    opts = req
  }

  return opts
}

/**
 * Set the default value for a prompt question
 * 用于向配置对象中添加默认字段
 *
 * @param {Object} opts
 * @param {String} key
 * @param {String} val
 */

function setDefault (opts, key, val) {
  if (opts.schema) {
    opts.prompts = opts.schema
    delete opts.schema
  }
  const prompts = opts.prompts || (opts.prompts = {})
  if (!prompts[key] || typeof prompts[key] !== 'object') {
    prompts[key] = {
      'type': 'string',
      'default': val
    }
  } else {
    prompts[key]['default'] = val
  }
}

// 用于检测配置对象中name字段是否合法
function setValidateName (opts) {
  const name = opts.prompts.name
  const customValidate = name.validate
  name.validate = name => {
    const its = validateName(name)
    if (!its.validForNewPackages) {
      const errors = (its.errors || []).concat(its.warnings || [])
      return 'Sorry, ' + errors.join(' and ') + '.'
    }
    if (typeof customValidate === 'function') return customValidate(name)
    return true
  }
}
