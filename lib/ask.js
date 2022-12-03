// 异步处理工具
const async = require('async')
const inquirer = require('inquirer')
// 返回某作用下表达式的值
const evaluate = require('./eval')

// Support types from prompt-for which was used before
const promptMapping = {
  string: 'input',
  boolean: 'confirm'
}

/**
 * Ask questions, return results.
 * 将meta.js或者meta.json中的prompts字段解析成对应的问题，让用户选择
 *
 * @param {Object} prompts：meta.js或者meta.json中的prompts字段
 * @param {Object} data：metalsmith.metadata(): { destDirName: 'my-project', inPlace: false, noEscape: true, isNotTest: true }
 * @param {Function} done: 交于下一个metalsmith插件处理
 */
/**
  prompts: {
    name: {
      when: 'isNotTest',
      type: 'string',
      required: true,
      message: 'Project name',
    },
    description: {
      when: 'isNotTest',
      type: 'string',
      required: false,
      message: 'Project description',
      default: 'A Vue.js project',
    },
    author: {
      when: 'isNotTest',
      type: 'string',
      message: 'Author',
    }
    ...
  }
 */
module.exports = function ask (prompts, data, done) {
  // 遍历处理prompts下的每一个字段
  async.eachSeries(Object.keys(prompts), (key, next) => {
    prompt(data, key, prompts[key], next)
  }, done)
}

/**
 * Inquirer prompt wrapper.
 *
 * @param {Object} data
 * @param {String} key
 * @param {Object} prompt
 * @param {Function} done
 */

function prompt (data, key, prompt, done) {
  // skip prompts whose when condition is not met
  if (prompt.when && !evaluate(prompt.when, data)) {
    return done()
  }

  // 获取默认值
  let promptDefault = prompt.default
  if (typeof prompt.default === 'function') {
    promptDefault = function () {
      return prompt.default.bind(this)(data)
    }
  }

  // 弹出问题，让使用者选择
  inquirer.prompt([{
    type: promptMapping[prompt.type] || prompt.type,
    name: key,
    message: prompt.message || prompt.label || key,
    default: promptDefault,
    choices: prompt.choices || [],
    validate: prompt.validate || (() => true)
  }]).then(answers => {
    if (Array.isArray(answers[key])) { // 当答案是一个数组时
      data[key] = {}
      answers[key].forEach(multiChoiceAnswer => {
        data[key][multiChoiceAnswer] = true
      })
    } else if (typeof answers[key] === 'string') { // 当答案是一个字符串时
      data[key] = answers[key].replace(/"/g, '\\"')
    } else { // 其他情况
      data[key] = answers[key]
    }
    done()
  }).catch(done)
}
