/**
 * 根据模板渲染成我们需要的项目
 */
// 高亮打印
const chalk = require('chalk')
// 静态网页生成器
const Metalsmith = require('metalsmith')
// 模板引擎
const Handlebars = require('handlebars')
// 异步处理工具
const async = require('async')
// 模板引擎里解析渲染器
const render = require('consolidate').handlebars.render
const path = require('path')
// 多个条件匹配
const multimatch = require('multimatch')
// 自定义工具-用于获取模板配置
const getOptions = require('./options')
// 自定义工具-用于询问开发者
const ask = require('./ask')
// 自定义工具-用于文件过滤
const filter = require('./filter')
// 自定义工具-用于日志打印
const logger = require('./logger')

// register handlebars helper
// 注册handlebars的helper
Handlebars.registerHelper('if_eq', function (a, b, opts) {
  return a === b
    ? opts.fn(this)
    : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq', function (a, b, opts) {
  return a === b
    ? opts.inverse(this)
    : opts.fn(this)
})

/**
 * Generate a template given a `src` and `dest`.
 *
 * @param {String} name：如果在当前目录下构建项目，当前目录名为项目构建目录名，否则是当前目录子目录
 * @param {String} src：本地模板路径，如C:\Users\penghwan\.vue-templates\webpack（webpack是template模板名称）
 * @param {String} dest：项目构建目录的绝对路径 - D:\code\vue\vue-cli\my-project，命令：vue init webpack my-project
 * @param {Function} done:
 *  done = err => {
      if (err) logger.fatal(err)
      console.log()
      logger.success('Generated "%s".', name)
    })
 */
// 获取模板配置 ==> 初始化metalsmith ==> 添加一些变量至Metalsmith ==> handlebars模板注册helper
// ==> 配置对象中是否有before函数，有则执行 ==> 询问问题 ==> 过滤文件 ==> 渲染模板文件
// ==> 配置对象中是否有after函数，有则执行 ==> 最后构建项目内容
// ==> 构建完成，成功若配置对象中有complete函数则执行，否则打印配置对象中的completeMessage信息，如果有错误，执行回调函数done(err)
// 1. 获取完全体配置 2. 实例化、before、after、complete 3. 完成结束
module.exports = function generate (name, src, dest, done) {
  const opts = getOptions(name, src) // 获取模板配置

  // metalsmith初始化数据
  const metalsmith = Metalsmith(path.join(src, 'template'))
  // 添加一些变量至metalsmith，并获取metalsmith全部变量
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(), // dest：D:\code\vue\vue-cli\my-project；process.cwd()：D:\code\vue\vue-cli
    noEscape: true
  }) // { destDirName: 'my-project', inPlace: false, noEscape: true }
  // 注册配置对象中的helper - 动态组件可以学习这种方式
  opts.helpers && Object.keys(opts.helpers).map(key => {
    Handlebars.registerHelper(key, opts.helpers[key])
  })

  const helpers = { chalk, logger }

  // 配置对象是否有before函数，有则执行
  if (opts.metalsmith && typeof opts.metalsmith.before === 'function') {
    opts.metalsmith.before(metalsmith, opts, helpers) // 询问用户给模板选择自动化测试时，这将为所选场景添加答案
  }

  // 问询
  metalsmith
    .use(askQuestions(opts.prompts)) // 询问问题
    .use(filterFiles(opts.filters)) // 过滤文件
    .use(renderTemplateFiles(opts.skipInterpolation)) // 渲染模板文件


    // 直接执行（ms为函数直接执行）
  if (typeof opts.metalsmith === 'function') {
    opts.metalsmith(metalsmith, opts, helpers)
  } else if (opts.metalsmith && typeof opts.metalsmith.after === 'function') { // 配置对象是否有after函数，有则执行
    opts.metalsmith.after(metalsmith, opts, helpers)
  }

  // 结尾
  metalsmith.clean(false)
    .source('.') // start from template root instead of `./src` which is Metalsmith's default for `source`
    .destination(dest)
    .build((err, files) => {
      done(err)
      // 执行complete钩子回调
      if (typeof opts.complete === 'function') {
        const helpers = { chalk, logger, files }
        opts.complete(data, helpers)
      } else {
        // 打印完成
        logMessage(opts.completeMessage, data)
      }
    })

  return data
}

/**
 * Create a middleware for asking questions.
 *
 * @param {Object} prompts
 * @return {Function}
 */

function askQuestions (prompts) {
  return (files, metalsmith, done) => {
    /**
     * {
        destDirName: 'my-project',
        inPlace: false,
        noEscape: true,
        isNotTest: true
      }
     */
    ask(prompts, metalsmith.metadata(), done)
  }
}

/**
 * Create a middleware for filtering files.
 *
 * @param {Object} filters
 * @return {Function}
 */

function filterFiles (filters) {
  return (files, metalsmith, done) => {
    filter(files, filters, metalsmith.metadata(), done)
  }
}

/**
 * Template in place plugin.
 * 渲染模板
 *
 * @param {Object} files
 * @param {Metalsmith} metalsmith
 * @param {Function} done
 */
// 1. 文件索引处理 2. 跳过要跳过的，取出内容字符串 3. 内容结合元数据 做渲染
function renderTemplateFiles (skipInterpolation) {
  skipInterpolation = typeof skipInterpolation === 'string'
    ? [skipInterpolation]
    : skipInterpolation // 保证skipInterpolation是一个数组
  return (files, metalsmith, done) => {
    const keys = Object.keys(files) // 获取所有文件的名字
    /**
     * [
        '.babelrc',
        '.editorconfig',
        '.eslintignore',
        '.eslintrc.js',
        '.gitignore',
        '.postcssrc.js',
        'README.md',
        'build\\build.js',
        'build\\check-versions.js',
        'build\\logo.png',
        'build\\utils.js',
        'build\\vue-loader.conf.js',
        'build\\webpack.base.conf.js',
        'build\\webpack.dev.conf.js',
        'build\\webpack.prod.conf.js',
        'build\\webpack.test.conf.js',
        'config\\dev.env.js',
        'config\\index.js',
        'config\\prod.env.js',
        'config\\test.env.js',
        'index.html',
        'package.json',
        'src\\App.vue',
        'src\\assets\\logo.png',
        'src\\components\\HelloWorld.vue',
        'src\\main.js',
        'src\\router\\index.js',
        'static\\.gitkeep',
        'test\\e2e\\custom-assertions\\elementCount.js',
        'test\\e2e\\nightwatch.conf.js',
        'test\\e2e\\runner.js',
        'test\\e2e\\specs\\test.js',
        'test\\unit\\.eslintrc',
        'test\\unit\\index.js',
        'test\\unit\\jest.conf.js',
        'test\\unit\\karma.conf.js',
        'test\\unit\\setup.js',
        'test\\unit\\specs\\HelloWorld.spec.js'
      ]
     */
    const metalsmithMetadata = metalsmith.metadata() // 获取metalsmith的所有变量
    /**
     * metalsmithMetadata: {
        destDirName: 'my-project',
        inPlace: false,
        noEscape: true,
        isNotTest: true,
        name: 'my-project',
        description: 'A Vue.js project',
        author: 'penghwan <1291427932@qq.com>',
        build: 'standalone',
        router: true,
        lint: true,
        lintConfig: 'standard',
        unit: true,
        runner: 'jest',
        e2e: true,
        autoInstall: 'npm'
      }
     */
    async.each(keys, (file, next) => { // 异步处理每一个file
      // skipping files with skipInterpolation option
      // 跳过符合skipInterpolation要求的file
      if (skipInterpolation && multimatch([file], skipInterpolation, { dot: true }).length) {
        return next()
      }

      // 获取文件的文本内容
      const str = files[file].contents.toString()
      // do not attempt to render files that do not have mustaches
      // 跳过不符合handlebars语法的file
      if (!/{{([^{}]+)}}/g.test(str)) {
        return next()
      }

      // 渲染文件
      render(str, metalsmithMetadata, (err, res) => {
        if (err) {
          err.message = `[${file}] ${err.message}`
          return next(err)
        }
        files[file].contents = new Buffer(res)
        next()
      })
    }, done)
  }
}

/**
 * Display template complete message.
 * 打印
 *
 * @param {String} message
 * @param {Object} data
 */

function logMessage (message, data) {
  if (!message) return
  render(message, data, (err, res) => {
    if (err) {
      console.error('\n   Error when rendering template complete message: ' + err.message.trim())
    } else {
      console.log('\n' + res.split(/\r?\n/g).map(line => '   ' + line).join('\n'))
    }
  })
}
