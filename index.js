#!/usr/bin/env node
const fetch = require('node-fetch')
const links = require('http-link-header')
const prompt = require('prompts')
const c = require('clorox')
const ora = require('ora')

const getEndpoint = (user) => `https://api.github.com/users/${user}/repos`
const filterRepos = (repos) => repos.filter(repo => !repo.fork && repo.stargazers_count > 0)
const countStars = (repos) => repos.reduce((total, repo) => total + repo.stargazers_count, 0)
const getStarsForRepo = (repo) => '⭐  '.repeat(repo.stargazers_count)

const getAllRepos = async (user) => {
  let repos = []
  const getRepo = (endpoint = getEndpoint(user)) => {
    let nextPage
    return fetch(endpoint)
    .then(res => {
      const refs = links.parse(res.headers.get('link') || '')
      nextPage = refs.get('rel', 'next')[0]
      return res.json()
    })
    .then(json => {
      if (Array.isArray(json)) {
        repos = repos.concat(json)
        if (nextPage) {
          return getRepo(nextPage.uri)
        }
      }
      return repos
    })
    .catch((e) => {
      console.log(`${
        c.red.bold('😞 Something went wrong! Sorry.')
      }`)
      process.exit(1)
    })
  }
  await getRepo()
  return repos
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
