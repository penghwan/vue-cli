// node自带模块child_process中的execSync方法用于新打开一个shell并执行相应的command，并返回相应的输出
const exec = require('child_process').execSync

// 用于获取本地的git配置的用户名和邮件，并返回格式“姓名<邮件>”的字符串
module.exports = () => {
  let name
  let email

  try {
    name = exec('git config --get user.name') // penghwan
    email = exec('git config --get user.email') // xxxxxx@126.com
  } catch (e) {}

  name = name && JSON.stringify(name.toString().trim()).slice(1, -1)
  email = email && (' <' + email.toString().trim() + '>')
  return (name || '') + (email || '')
}
