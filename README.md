Heroku Connect Toolbelt Plugin
==================

# Install

    $ heroku plugins:install heroku-connect-plugin


# Help  

    heroku help connect 

# Commands

    heroku connect:auth              - Authenticate a connection to Salesforce
    heroku connect:preauth           - Store a Salesforce authentication for future use
    heroku connect:export            - Export a mapping configuration json file
    heroku connect:import            - Import a mapping configuration json file
    heroku connect:mapping MAPPING   - Returns a status JSON doc for a single mapping
    heroku connect:setup             - configure a new connection
    heroku connect:state             - Return the state flag for a single connection
    heroku connect:status            - Print connection status

# Examples

Create a new mapping

    heroku connect:create-mapping Contact --fields FirstName,Email --with-required

Delete a mapping

    heroku connect:delete-mapping Account

Download the mapping configuration

    heroku connect:export
