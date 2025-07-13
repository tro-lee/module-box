#!/usr/bin/env node

import chalk from 'chalk'
import inquirer from 'inquirer'
import { find } from 'lodash'
import exitChoice from './choices/exit'
import pushChoice from './choices/push'
import { asciiArt } from './lib/ascii-art'

const choices = [pushChoice, exitChoice]

async function handleUserChoice(choiceName: string) {
  const choice = find(choices, c => c.value === choiceName)

  if (!choice) {
    console.log(chalk.red('❌ 无效的选择'))
    return
  }
  await choice.function()
}

async function showMainMenu() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.cyan('请选择要执行的操作:'),
      choices,
      pageSize: 10,
    },
  ])
  await handleUserChoice(action)

  console.log(`\n${'='.repeat(60)}\n`)
  await showMainMenu()
}

// 主函数
async function main() {
  try {
    console.log(chalk.cyan(asciiArt))
    await showMainMenu()
  }
  catch (error) {
    console.warn(error)
    process.exit(1)
  }
}

await main()
