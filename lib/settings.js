define([], () => {
  const homeDirectory = process.cwd();
  return {
    homeDirectory,
    config_file: {
      directory_name: '.jira-cli',
      file_name: 'config.json'
    },
  }
})
