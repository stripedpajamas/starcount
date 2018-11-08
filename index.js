#!/usr/bin/env node
const octokit = require('@octokit/rest')()
const prompt = require('prompts')
const c = require('clorox')
const ora = require('ora')

const filterRepos = (repos) => repos.filter(repo => !repo.fork && repo.stargazers_count > 0)
const countStars = (repos) => repos.reduce((total, repo) => total + repo.stargazers_count, 0)
const getStarsForRepo = (repo) => '⭐  '.repeat(repo.stargazers_count)
const getAllRepos = async (username) => {
  let data
  try {
    let response = await octokit.repos.getForUser({
      username,
      per_page: 100
    })
    data = response.data
    while (octokit.hasNextPage(response)) {
      response = await octokit.getNextPage(response)
      data = data.concat(response.data)
    }
  } catch (e) {
    console.log(`${
      c.red.bold('😞 Something went wrong! Sorry.')
    }`)
    process.exit(1)
  }
  return data
}

;(async () => {
  let user

  if (process.argv.length > 2) {
    user = process.argv[2]
  } else {
    const response = await prompt({
      type: 'text',
      name: 'user',
      message: 'Enter a GitHub username to starcount:'
    })
    user = response.user
  }

  const spinner = ora('Loading stars').start();
  const repos = await getAllRepos(user)
  spinner.stop()

  const filteredRepos = filterRepos(repos)
  const starcount = countStars(filteredRepos)

  if (!starcount) {
    console.log(`${
      c.white.bold(`✨ ${user} has no stars`)
    }`)
    process.exit(0)
  }

  console.log(`${
    c.white.bold(`✨ ${user} has ${starcount} total stars`)
  }`)

  const response = await prompt({
    type: 'confirm',
    name: 'showStars',
    message: 'Do you want to see them?',
    initial: true
  })

  if (response.showStars) {
    filteredRepos.forEach((repo) => {
        console.log(`\n${
          c.bold.green(`${repo.name}  ${getStarsForRepo(repo)}`)
        }`)
    })
  }

  console.log(`\n${
    c.bold.white("❤️  That's all ❤️")
  }`)
})()
