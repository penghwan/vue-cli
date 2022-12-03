// http请求工具
const request = require('request')
// 版本号处理工具
const semver = require('semver')
const chalk = require('chalk')
const packageConfig = require('../package.json')

// 检查node版本号 => 检查vue-cli版本
// 第一步：检查本地的node版本号，是否达到package.json文件中对node版本的要求，若低于package.json文件中要求的版本，则直接要求开发者更新自己的node版本。反之，可开始第二步
// 第二步：通过请求https://registry.npmjs.org/vue-cli来获取vue-cli的最小版本号，跟package.json中的version字段进行比较，
//        若本地的版本号小于最新的版本号，则提示有最小版本可以更新。注意：这里检查版本号并不影响后续的流程，即便本地的vue-cli版本不是最新的，也不影响构建，仅仅提示一下
module.exports = done => {
  // Ensure minimum supported node version is used
  // 如何检测功能模块与node是否搭配
  if (!semver.satisfies(process.version, packageConfig.engines.node)) {
    return console.log(chalk.red(
      '  You must upgrade node to >=' + packageConfig.engines.node + '.x to use vue-cli'
    ))
  }
  request({
    url: 'https://registry.npmjs.org/vue-cli',
    timeout: 1000
  }, (err, res, body) => {
    if (!err && res.statusCode === 200) {
      const latestVersion = JSON.parse(body)['dist-tags'].latest
      const localVersion = packageConfig.version
      if (semver.lt(localVersion, latestVersion)) {
        console.log(chalk.yellow('  A newer version of vue-cli is available.'))
        console.log()
        console.log('  latest:    ' + chalk.green(latestVersion))
        console.log('  installed: ' + chalk.red(localVersion))
        console.log()
      }
    }
    done()
  })
}
