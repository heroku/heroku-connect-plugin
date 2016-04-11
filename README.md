Heroku Connect Toolbelt Plugin
==================

# Install

    $ heroku plugins:install heroku-connect-plugin


# Help  

    heroku help connect 

# Commands

    heroku connect:db:set                  - Set database parameters
    heroku connect:export                  - Export a mapping configuration JSON file
    heroku connect:import FILE             - Import a mapping configuration JSON file
    heroku connect:info                    - Display connection information 
    heroku connect:mapping:state MAPPING   - Return the state of a mapping
    heroku connect:mapping:delete MAPPING  - Delete an existing mapping
    heroku connect:mapping:reload MAPPING  - Reload a mapping's data from Salesforce
    heroku connect:pause                   - Pause a connection
    heroku connect:resume                  - Resume a connection
    heroku connect:restart                 - Restart a connection
    heroku connect:sf:auth                 - Authenticate a connection to Salesforce
    heroku connect:state                   - Return the state flag for a single connection

# Examples

Download an existing mapping configuration

    $ heroku connect:export
    Saved config-file: app-name-resource-name.json

# Tutorial

Make sure you have a Heroku app, with a Postgres database attached

## Add the Heroku Connect add-on to your app

    $ heroku addons:create herokuconnect

## Link the new connection (the Heroku Connect add-on instance) to your Heroku user

    $ heroku connect:info

## Now link the connection to the database, specifying the config var and schema name

    $ heroku connect:db:set --db=DATABASE_URL --schema=salesforce
    settings database parameters... done
    db_key:      DATABASE_URL
    schema_name: salesforce

If either option is not supplied, this command will ask for a value.

## Authorize the connection to access your Salesforce organization

    $ heroku connect:sf:auth
    Launching Salesforce for authorization. If your browser doesn't open, please copy the following URL to proceed:

    https://login.salesforce.com/services/oauth2/authorize?…

This will launch your browser for an interactive authorization session.

## Verify that connection is now in 'IDLE' state

    $ heroku connect:state
    IDLE

## Now restore the exported configuration

This could be exported using the `connect:export` command or directly through the Heroku Connect dashboard. By editing this configuration file, you can add and edit existing mappings easily.

    $ heroku connect:import app-name-resource-name.json
    Upload complete

If you need to delete a mapping after the configuration has been imported, you can use a separate command for that:

    $ heroku connect:mapping:delete Contact

## Connect to your database to see the data

    $ heroku pg:psql
    > select * from salesforce.contact;

