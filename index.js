const fetch = require('node-fetch')
const prompt = require('prompts')
const c = require('clorox')

const getEndpoint = (user) => `https://api.github.com/users/${user}/repos`
const filterRepos = (repos) => repos.filter(repo => !repo.fork && repo.stargazers_count > 0)
const countStars = (repos) => repos.reduce((total, repo) => total + repo.stargazers_count, 0)
const getStarsForRepo = (repo) => '⭐  '.repeat(repo.stargazers_count)

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

  const repos = await fetch(getEndpoint(user))
    .then(res => res.json())
    .catch(() => {
      console.log(`${
        c.red.bold('😞 Something went wrong! Sorry.')
      }`)
      process.exit(1)
    })

  const filteredRepos = filterRepos(repos)
  const starcount = countStars(filteredRepos)

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
