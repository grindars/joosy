module.exports = (grunt) ->

  #
  # Joosy utilizes Grill to setup standalone environment
  # Check out https://github.com/joosy/grill
  #
  require('grill').setup grunt,
    prefix: 'joosy'
    assets:
      vendor: ['app/*', 'vendor/*', 'node_modules/joosy/source']
      destination: 'public'