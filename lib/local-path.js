const path = require('path')

module.exports = {
  // 判断是否是本地路径
  isLocalPath (templatePath) {
    // UNIX (以“.”或者"/"开头)，WINDOWS(以形如：“C:”的方式开头)
    return /^[./]|(^[a-zA-Z]:)/.test(templatePath)
  },
  // 获取本地模板的绝对路径
  getTemplatePath (templatePath) {
    // templatePath是否为绝对路径，是则返回templatePath，否则转换成绝对路径并规范化
    return path.isAbsolute(templatePath)
      ? templatePath
      : path.normalize(path.join(process.cwd(), templatePath))
  }
}
