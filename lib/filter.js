// 匹配文件
const match = require('minimatch')
const evaluate = require('./eval')

// 经过ask回去用户需求后 => metadata => 过滤不需要的模板文件

/**
 * 根据metalsmith.metadata()删除一些不需要的模板文件，而metalsmith.metadata()主要在ask.js中改变的，也就是说ask.js中获取到用户的需求
 *
 * @param {Object} files：模板内所有文件
 * @param {Object} filters：meta.js/meta.json过滤字段
 * @param {Object} data：Metalsmith.meta()
 * @param {Function} done：交于下一个metalsmith插件处理
 */
// filters: {
//   '.eslintrc.js': 'lint',
//   '.eslintignore': 'lint',
//   'config/test.env.js': 'unit || e2e',
//   'build/webpack.test.conf.js': "unit && runner === 'karma'",
//   'test/unit/**/*': 'unit',
//   'test/unit/index.js': "unit && runner === 'karma'",
//   'test/unit/jest.conf.js': "unit && runner === 'jest'",
//   'test/unit/karma.conf.js': "unit && runner === 'karma'",
//   'test/unit/specs/index.js': "unit && runner === 'karma'",
//   'test/unit/setup.js': "unit && runner === 'jest'",
//   'test/e2e/**/*': 'e2e',
//   'src/router/**/*': 'router',
// }
/**
 * data: {
    destDirName: 'my-project',
    inPlace: false,
    noEscape: true,
    isNotTest: true,
    name: 'my-project',
    description: 'A Vue.js project',
    author: 'penghwan <1291427932@qq.com>',
    build: 'runtime',
    router: true,
    lint: true,
    lintConfig: 'standard',
    unit: true,
    runner: 'jest',
    e2e: true,
    autoInstall: 'npm'
  }
 */
module.exports = (files, filters, data, done) => {
  // meta.js或者meta.json没有filters字段直接跳过交于下一个metalsmith插件处理
  if (!filters) {
    return done()
  }
  // 获取所有文件的名字
  const fileNames = Object.keys(files)
  /**
   * webpack模板下的所有文件
   * fileNames: [
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
  // 遍历meta.js或者meta.json下的filters所有字段
  Object.keys(filters).forEach(glob => { // glob为.eslintrc.js、.eslintignore、config/test.env.js等
    // 遍历所有文件名
    fileNames.forEach(file => {
      // 如果有文件名跟filters下某一个字段匹配上
      if (match(file, glob, { dot: true })) {
        const condition = filters[glob]
        if (!evaluate(condition, data)) {
          // 如果metalsmith.metadata()下condition表达式不成立，就删除该文件
          delete files[file]
        }
      }
    })
  })
  done()
}
