define(['url'], (_url) => {
  function _extractErrorMessages (response) {
    const { errors, messages } = typeof response === 'string' ? JSON.parse(response).body : response.body

    function convertErrorsToArray (errors) {
      if (!errors) {return []}

      function formatErrorMessage (element) {
        return `${element}: ${errors[element]}`
      }

      return Object.keys(errors).map(formatErrorMessage)
    }

    return (messages && messages.length) ? messages : convertErrorsToArray(errors)
  }

  return {
    extractErrorMessages: _extractErrorMessages,
    url: _url
  }
})
