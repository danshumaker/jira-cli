define([], () => {
  const home_directory = process.cwd();
  return {
    home_directory,
    config_file: {
      directory_name: '.jira-cli',
      file_name: 'config.json'
    },
  }
})
